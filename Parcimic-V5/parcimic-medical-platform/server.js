require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const axios   = require('axios');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.NODE_ENV === 'production'
  ? ['https://parcimic.web.app', 'https://parcimic.firebaseapp.com'] : '*' }));
app.use(express.json({ limit: '1mb' }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

// ─── AI Provider Cascade ──────────────────────────────────────────────────────
// Priority: Groq (fastest/free) → OpenRouter (free) → Gemini → HuggingFace
// Auto-falls back on rate limit (429), quota (402), or timeout errors.

const AI_PROVIDERS = [
  {
    name: 'groq',
    available: () => !!process.env.GROQ_API_KEY,
    call: async (prompt, maxTokens) => {
      const r = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.35,
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: 12000,
        }
      );
      return r.data.choices[0].message.content;
    },
  },
  {
    name: 'openrouter',
    available: () => !!process.env.OPENROUTER_API_KEY,
    call: async (prompt, maxTokens) => {
      const r = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: process.env.OPENROUTER_MODEL || 'google/gemma-3-12b-it:free',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.35,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://parcimic.web.app',
            'X-Title': 'Parcimic Health',
          },
          timeout: 15000,
        }
      );
      return r.data.choices[0].message.content;
    },
  },
  {
    name: 'gemini',
    available: () => !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    call: async (prompt, maxTokens) => {
      const key   = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const model = process.env.GEMINI_MODEL   || 'gemini-2.0-flash';
      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.35 },
        },
        { timeout: 20000 }
      );
      return r.data.candidates[0].content.parts[0].text;
    },
  },
  {
    name: 'huggingface',
    available: () => !!process.env.HF_API_KEY,
    call: async (prompt, maxTokens) => {
      const model = process.env.HF_MODEL || 'HuggingFaceH4/zephyr-7b-beta';
      const r = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { inputs: prompt, parameters: { max_new_tokens: maxTokens, temperature: 0.35 } },
        {
          headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
          timeout: 25000,
        }
      );
      const out = Array.isArray(r.data) ? r.data[0]?.generated_text : r.data?.generated_text;
      // Strip the prompt from the output (HF echoes it)
      return out ? out.replace(prompt, '').trim() : '';
    },
  },
];

// Retry-with-fallback: tries each provider in order, skips on rate-limit/quota errors
async function callAI(prompt, maxTokens = 300) {
  const retryable = new Set([429, 402, 503, 529]);
  for (const provider of AI_PROVIDERS) {
    if (!provider.available()) continue;
    try {
      const text = await provider.call(prompt, maxTokens);
      if (text && text.trim()) {
        if (process.env.DEBUG === 'true') console.log(`[AI] Used: ${provider.name}`);
        return text.trim();
      }
    } catch (err) {
      const status = err.response?.status;
      if (retryable.has(status) || err.code === 'ECONNABORTED') {
        console.warn(`[AI] ${provider.name} unavailable (${status || err.code}), trying next...`);
        continue;
      }
      console.warn(`[AI] ${provider.name} error:`, err.message);
    }
  }
  return null; // All providers failed — caller handles gracefully
}

// ─── Local scoring ────────────────────────────────────────────────────────────
function localSepsisScore({ vitals = {}, labs = {}, history = {}, symptoms = {} }) {
  let s = 0;
  const { heartRate: hr, temp, respRate: rr, sysBP: sbp, o2Sat: o2 } = vitals;
  const { lactate, wbc } = labs;
  const { age, recentSurgery, chronicDisease } = history;

  if (hr > 100 || hr < 60)               s += 15;
  if (temp > 38.3 || temp < 36)          s += 15;
  if (rr > 22)                           s += 20;
  if (sbp < 100)                         s += 25;
  if (o2 < 94)                           s += 15;
  if (lactate > 2.0)                     s += 30;
  if (wbc > 12 || (wbc > 0 && wbc < 4)) s += 15;
  if (age > 65)                          s += 10;
  if (recentSurgery)                     s += 20;
  if (chronicDisease)                    s += 15;
  if (symptoms.shortnessBreath || symptoms.difficultyBreathing) s += 20;
  if (symptoms.abdominalPain)            s += 15;
  if (symptoms.fever)                    s += 10;
  if (symptoms.confusion)               s += 15;
  if (symptoms.fatigue)                  s += 8;

  const final = Math.min(Math.round(s * 0.72), 99);
  return { score: final, riskLevel: final >= 65 ? 'high' : final >= 35 ? 'moderate' : 'low', source: 'local' };
}

// ─── POST /api/predict-sepsis ─────────────────────────────────────────────────
app.post('/api/predict-sepsis', async (req, res) => {
  try {
    const { vitals, labs, symptoms, history } = req.body;
    let result = null;

    // External ML API (Mode 1)
    if (process.env.ML_API_URL) {
      try {
        const r = await axios.post(process.env.ML_API_URL, { vitals, labs, symptoms, history }, { timeout: 10000 });
        result = { score: r.data.score ?? r.data.risk_score, riskLevel: r.data.riskLevel ?? r.data.risk_category, source: 'ml_api' };
      } catch (e) { console.warn('[ML API]', e.message); }
    }

    // Python microservice (Mode 2)
    if (!result && process.env.USE_PYTHON_ML === 'true') {
      try {
        const r = await axios.post(`${process.env.PYTHON_ML_URL || 'http://localhost:8000'}/predict`, { vitals, labs, symptoms, history }, { timeout: 10000 });
        result = { score: r.data.score ?? r.data.risk_score, riskLevel: r.data.riskLevel ?? r.data.risk_category, source: 'python_ml' };
      } catch (e) { console.warn('[Python ML]', e.message); }
    }

    // Local scoring (Mode 3 — always available)
    if (!result) result = localSepsisScore({ vitals, labs, symptoms, history });

    const { score, riskLevel } = result;

    // AI recommendation — only for score >= 30, user-friendly language
    let recommendation = null;
    if (score >= 30) {
      const activeSymptoms = Object.entries(symptoms || {}).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none';
      const prompt = `You are a friendly health assistant for the Parcimic app. A user completed a health check.

Health data: HR=${vitals?.heartRate}bpm, Temp=${vitals?.temp}°C, Breathing=${vitals?.respRate}/min, BP=${vitals?.sysBP}mmHg, O2=${vitals?.o2Sat}%, Age=${history?.age}
Symptoms: ${activeSymptoms}
Risk score: ${score}/100 (${riskLevel})

Write a Parcimic AI Recommendation in 2-3 short sentences. Use simple, calm, non-medical language.
Explain: what is happening, why it matters, what they should do.
Do NOT use medical jargon. Do NOT mention any AI brand name.
Example: "Your temperature and heart rate are slightly higher than normal, which may indicate early signs of infection. It would be good to rest, stay hydrated, and monitor how you feel over the next few hours."`;

      recommendation = await callAI(prompt, 180);
    }

    res.json({ score, riskLevel, recommendation, source: result.source });
  } catch (err) {
    console.error('[predict-sepsis]', err.message);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// ─── POST /api/llm/explain ────────────────────────────────────────────────────
app.post('/api/llm/explain', async (req, res) => {
  try {
    const { score, riskLevel, vitals, recommendation } = req.body;
    const prompt = `You are a friendly health assistant for the Parcimic app. Explain a health check result to a regular person.

Result: ${score}/100 — ${riskLevel} risk
HR=${vitals?.heartRate || '?'}bpm, Temp=${vitals?.temp || '?'}°C, O2=${vitals?.o2Sat || '?'}%, BP=${vitals?.sysBP || '?'}mmHg
${recommendation ? 'Initial note: ' + recommendation : ''}

Write a Parcimic AI Recommendation with 3-4 short paragraphs:
1. What is happening in simple terms
2. Why these readings matter
3. What the person should do right now
4. When to seek help

Use calm, clear language. No medical jargon. No AI brand names.`;

    const explanation = await callAI(prompt, 450);
    res.json({ explanation: explanation || 'Unable to generate recommendation at this time.' });
  } catch (err) {
    console.error('[llm/explain]', err.message);
    res.status(500).json({ error: 'Explanation failed' });
  }
});

// ─── POST /api/llm/chat ───────────────────────────────────────────────────────
app.post('/api/llm/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const system = `You are the Parcimic health assistant — friendly, calm, and helpful.
Help users understand their health check results and symptoms in simple terms.
Never use medical jargon. Be reassuring but honest. If something sounds serious, gently suggest seeing a doctor.
Never mention "Gemini", "Groq", "OpenRouter", or any AI brand. You are "Parcimic AI".`;

    // Build a single prompt with conversation history
    const historyText = history.slice(-6).map((m) =>
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n');

    const fullPrompt = `${system}\n\n${historyText ? historyText + '\n' : ''}User: ${message}\nAssistant:`;

    const reply = await callAI(fullPrompt, 350);
    res.json({ reply: reply || "I'm having trouble responding right now. Please try again in a moment." });
  } catch (err) {
    console.error('[llm/chat]', err.message);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// ─── GET /api/nearby-healthcare (OpenStreetMap Overpass — free) ───────────────
app.get('/api/nearby-healthcare', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const query = `[out:json][timeout:15];(node["amenity"="hospital"](around:${radius},${lat},${lng});way["amenity"="hospital"](around:${radius},${lat},${lng});node["amenity"="clinic"](around:${radius},${lat},${lng});node["amenity"="pharmacy"](around:${radius},${lat},${lng}););out center 20;`;

    const r = await axios.post('https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(query)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 18000 }
    );

    const results = (r.data.elements || [])
      .filter((e) => e.tags?.name)
      .map((e) => {
        const elat = e.lat ?? e.center?.lat;
        const elng = e.lon ?? e.center?.lon;
        const dist = elat && elng ? Math.round(
          Math.sqrt(Math.pow((elat - +lat) * 111000, 2) + Math.pow((elng - +lng) * 111000 * Math.cos(+lat * Math.PI / 180), 2))
        ) : null;
        return { id: e.id, name: e.tags.name, type: e.tags.amenity,
          address: [e.tags['addr:street'], e.tags['addr:city']].filter(Boolean).join(', ') || null,
          phone: e.tags.phone || e.tags['contact:phone'] || null,
          lat: elat, lng: elng, distanceM: dist };
      })
      .filter((e) => e.lat && e.lng)
      .sort((a, b) => (a.distanceM || 9999) - (b.distanceM || 9999))
      .slice(0, 12);

    res.json({ results });
  } catch (err) {
    console.error('[nearby-healthcare]', err.message);
    res.status(500).json({ error: 'Could not fetch nearby healthcare', results: [] });
  }
});

// ─── GET /api/health ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const providers = AI_PROVIDERS.filter((p) => p.available()).map((p) => p.name);
  res.json({ status: 'ok', timestamp: new Date().toISOString(), aiProviders: providers });
});

// ─── SPA fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  } else {
    res.json({ message: 'Parcimic API running. React dev server on :3000' });
  }
});

app.listen(PORT, () => {
  const providers = AI_PROVIDERS.filter((p) => p.available()).map((p) => p.name);
  console.log(`\n  Parcimic  http://localhost:${PORT}`);
  console.log(`  AI cascade: ${providers.join(' → ') || 'none configured'}\n`);
});
