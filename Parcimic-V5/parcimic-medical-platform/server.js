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
// Groq → OpenRouter → Gemini → HuggingFace
// Each provider uses the correct API format for its service.
// Auto-falls back on 429 (rate limit), 402 (quota), 503, timeout.

const AI_PROVIDERS = [
  {
    name: 'groq',
    available: () => !!process.env.GROQ_API_KEY,
    // Groq uses OpenAI-compatible chat completions with system message
    call: async (messages, maxTokens) => {
      const r = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
          messages,
          max_tokens: maxTokens,
          temperature: 0.4,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      return r.data.choices[0].message.content;
    },
  },
  {
    name: 'openrouter',
    available: () => !!process.env.OPENROUTER_API_KEY,
    // OpenRouter also uses OpenAI-compatible format
    call: async (messages, maxTokens) => {
      const r = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: process.env.OPENROUTER_MODEL || 'google/gemma-3-12b-it:free',
          messages,
          max_tokens: maxTokens,
          temperature: 0.4,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://parcimic.web.app',
            'X-Title': 'Parcimic Health',
          },
          timeout: 20000,
        }
      );
      return r.data.choices[0].message.content;
    },
  },
  {
    name: 'gemini',
    available: () => !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    // Gemini uses its own format — convert messages array to Gemini format
    call: async (messages, maxTokens) => {
      const key   = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const model = process.env.GEMINI_MODEL   || 'gemini-2.0-flash';

      // Extract system message and conversation
      const systemMsg = messages.find((m) => m.role === 'system');
      const convo     = messages.filter((m) => m.role !== 'system');

      const contents = convo.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const body = {
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
      };
      if (systemMsg) {
        body.system_instruction = { parts: [{ text: systemMsg.content }] };
      }

      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        body,
        { timeout: 25000 }
      );
      return r.data.candidates[0].content.parts[0].text;
    },
  },
  {
    name: 'huggingface',
    available: () => !!process.env.HF_API_KEY,
    call: async (messages, maxTokens) => {
      const model = process.env.HF_MODEL || 'HuggingFaceH4/zephyr-7b-beta';
      // HF expects a single text prompt — flatten messages
      const prompt = messages.map((m) =>
        m.role === 'system' ? m.content : `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n') + '\nAssistant:';

      const r = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { inputs: prompt, parameters: { max_new_tokens: maxTokens, temperature: 0.4, return_full_text: false } },
        {
          headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
          timeout: 30000,
        }
      );
      const out = Array.isArray(r.data) ? r.data[0]?.generated_text : r.data?.generated_text;
      return out ? out.trim() : '';
    },
  },
];

// Retry-with-fallback — tries each provider, skips on rate-limit / quota / timeout
async function callAI(messages, maxTokens = 350) {
  const retryable = new Set([429, 402, 503, 529]);
  for (const provider of AI_PROVIDERS) {
    if (!provider.available()) continue;
    try {
      const text = await provider.call(messages, maxTokens);
      if (text && text.trim().length > 5) {
        if (process.env.DEBUG === 'true') console.log(`[AI] provider: ${provider.name}`);
        return text.trim();
      }
    } catch (err) {
      const status = err.response?.status;
      const isRetryable = retryable.has(status) || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
      console.warn(`[AI] ${provider.name} ${isRetryable ? 'rate-limited/timeout' : 'error'} (${status || err.code}): ${err.response?.data?.error?.message || err.message}`);
      if (isRetryable) continue;
      // Non-retryable error — still try next provider
      continue;
    }
  }
  return null;
}

// Helper: build messages array for simple single-turn prompts
function simpleMessages(system, userPrompt) {
  return [
    { role: 'system', content: system },
    { role: 'user',   content: userPrompt },
  ];
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

    if (process.env.ML_API_URL) {
      try {
        const r = await axios.post(process.env.ML_API_URL, { vitals, labs, symptoms, history }, { timeout: 10000 });
        result = { score: r.data.score ?? r.data.risk_score, riskLevel: r.data.riskLevel ?? r.data.risk_category, source: 'ml_api' };
      } catch (e) { console.warn('[ML API]', e.message); }
    }

    if (!result && process.env.USE_PYTHON_ML === 'true') {
      try {
        const pythonUrl = process.env.PYTHON_ML_URL || 'http://localhost:8000';
        const r = await axios.post(`${pythonUrl}/predict`, { vitals, labs, symptoms, history }, { timeout: 10000 });
        result = { score: r.data.score ?? r.data.risk_score, riskLevel: r.data.riskLevel ?? r.data.risk_category, source: 'python_ml' };
      } catch (e) { console.warn('[Python ML]', e.message); }
    }

    if (!result) result = localSepsisScore({ vitals, labs, symptoms, history });

    const { score, riskLevel } = result;

    let recommendation = null;
    if (score >= 30) {
      const activeSymptoms = Object.entries(symptoms || {}).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none';
      const msgs = simpleMessages(
        'You are a friendly health assistant for the Parcimic app. Always respond in 2-3 short, calm sentences using simple everyday language. Never use medical jargon. Never mention any AI brand name.',
        `A user completed a health check with these results:
Heart rate: ${vitals?.heartRate} bpm, Temperature: ${vitals?.temp}°C, Breathing: ${vitals?.respRate}/min, Blood pressure: ${vitals?.sysBP} mmHg, Oxygen: ${vitals?.o2Sat}%, Age: ${history?.age}
Symptoms reported: ${activeSymptoms}
Risk score: ${score}/100 (${riskLevel} risk)

Write a Parcimic AI Recommendation explaining what is happening, why it matters, and what they should do. Keep it reassuring and simple.`
      );
      recommendation = await callAI(msgs, 200);
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
    const msgs = simpleMessages(
      'You are a friendly health assistant for the Parcimic app. Explain health results to regular people using simple, calm language. No medical jargon. No AI brand names. Structure your response in short paragraphs.',
      `Explain this health check result to the user:
Risk score: ${score}/100 — ${riskLevel} risk
Heart rate: ${vitals?.heartRate || '?'} bpm, Temperature: ${vitals?.temp || '?'}°C, Oxygen: ${vitals?.o2Sat || '?'}%, Blood pressure: ${vitals?.sysBP || '?'} mmHg
${recommendation ? 'Initial assessment: ' + recommendation : ''}

Write 3-4 short paragraphs covering: (1) what is happening in simple terms, (2) why these readings matter, (3) what they should do right now, (4) when to seek help.`
    );
    const explanation = await callAI(msgs, 500);
    res.json({ explanation: explanation || 'Unable to generate a recommendation at this time. Please try again.' });
  } catch (err) {
    console.error('[llm/explain]', err.message);
    res.status(500).json({ error: 'Explanation failed' });
  }
});

// ─── POST /api/llm/chat ───────────────────────────────────────────────────────
app.post('/api/llm/chat', async (req, res) => {
  try {
    const { message, history = [], systemPrompt } = req.body;

    // Use custom system prompt if provided, otherwise use default
    const systemContent = systemPrompt || `You are Parcimic AI — a friendly, calm health assistant.
You help users understand their health check results and symptoms in simple, everyday language.
Keep responses concise (2-4 sentences unless more detail is needed).
Never use medical jargon. Be reassuring but honest.
If something sounds serious, gently encourage them to see a doctor.
Never mention "Gemini", "Groq", "OpenRouter", "LLaMA", or any AI brand. You are "Parcimic AI".`;

    // Build messages array: system + conversation history + new message
    const messages = [
      { role: 'system', content: systemContent },
      ...history.slice(-8).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Enforce max tokens for health assistant (prevent long essays)
    const maxTokens = 500; // Roughly 5-6 lines of text
    const reply = await callAI(messages, maxTokens);
    
    res.json({ reply: reply || "I'm having a little trouble right now. Please try again in a moment." });
  } catch (err) {
    console.error('[llm/chat]', err.message);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// ─── GET /api/nearby-healthcare ───────────────────────────────────────────────
// Uses OpenStreetMap Overpass API — completely free
// FIX: Added required User-Agent header (Overpass returns 406 without it)
app.get('/api/nearby-healthcare', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const query = `
[out:json][timeout:20];
(
  node["amenity"="hospital"](around:${radius},${lat},${lng});
  way["amenity"="hospital"](around:${radius},${lat},${lng});
  node["amenity"="clinic"](around:${radius},${lat},${lng});
  way["amenity"="clinic"](around:${radius},${lat},${lng});
  node["amenity"="pharmacy"](around:${radius},${lat},${lng});
);
out center 20;
    `.trim();

    const r = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Required — Overpass returns 406 without a User-Agent
          'User-Agent': 'Parcimic/1.0 (health emergency app; https://parcimic.web.app)',
          'Accept': 'application/json',
        },
        timeout: 25000,
      }
    );

    const elements = r.data.elements || [];
    const results = elements
      .filter((e) => e.tags?.name)
      .map((e) => {
        const elat = e.lat ?? e.center?.lat;
        const elng = e.lon  ?? e.center?.lon;
        const dist = (elat && elng)
          ? Math.round(Math.sqrt(
              Math.pow((elat - +lat) * 111000, 2) +
              Math.pow((elng - +lng) * 111000 * Math.cos(+lat * Math.PI / 180), 2)
            ))
          : null;
        return {
          id:        String(e.id),
          name:      e.tags.name,
          type:      e.tags.amenity,
          address:   [e.tags['addr:street'], e.tags['addr:city']].filter(Boolean).join(', ') || null,
          phone:     e.tags.phone || e.tags['contact:phone'] || null,
          website:   e.tags.website || null,
          lat:       elat,
          lng:       elng,
          distanceM: dist,
        };
      })
      .filter((e) => e.lat && e.lng)
      .sort((a, b) => (a.distanceM || 99999) - (b.distanceM || 99999))
      .slice(0, 12);

    res.json({ results, total: results.length });
  } catch (err) {
    const status = err.response?.status;
    console.error(`[nearby-healthcare] ${status || ''} ${err.message}`);

    // Fallback: try alternative Overpass mirror
    if (status === 429 || status === 503) {
      try {
        const { lat, lng, radius = 5000 } = req.query;
        const query = `[out:json][timeout:20];(node["amenity"="hospital"](around:${radius},${lat},${lng}););out center 10;`;
        const r2 = await axios.post(
          'https://overpass.kumi.systems/api/interpreter',
          `data=${encodeURIComponent(query)}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Parcimic/1.0',
            },
            timeout: 20000,
          }
        );
        const results = (r2.data.elements || [])
          .filter((e) => e.tags?.name && (e.lat || e.center?.lat))
          .map((e) => ({
            id: String(e.id), name: e.tags.name, type: e.tags.amenity,
            lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon,
            distanceM: null, address: null, phone: null,
          }))
          .slice(0, 10);
        return res.json({ results, total: results.length, source: 'mirror' });
      } catch (e2) {
        console.error('[nearby-healthcare fallback]', e2.message);
      }
    }

    res.status(500).json({ error: 'Could not load nearby hospitals. Please try again.', results: [] });
  }
});

// ─── POST /api/symptoms/checkin ───────────────────────────────────────────────
// Save a daily symptom check-in (fever, fatigue, cough, breathing, notes)
app.post('/api/symptoms/checkin', async (req, res) => {
  try {
    const { uid, fever, fatigue, cough, breathing, notes } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });

    // In production, this would save to Firestore via cloud function
    // For now, return structure to be saved by client
    const entry = {
      uid,
      fever: !!fever,
      fatigue: Number(fatigue) || 0,
      cough: Number(cough) || 0,
      breathing: Number(breathing) || 0,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
    };

    res.json({ success: true, entry });
  } catch (err) {
    console.error('[symptoms/checkin]', err.message);
    res.status(500).json({ error: 'Failed to save symptom check-in' });
  }
});

// ─── POST /api/alerts/evaluate ────────────────────────────────────────────────
// Evaluate alert conditions (risk, symptoms, medications)
app.post('/api/alerts/evaluate', async (req, res) => {
  try {
    const { uid, score, vitals, symptoms, medications, recentSymptoms } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });

    const alerts = [];

    // Alert 1: High risk score
    if (score && score > 64) {
      alerts.push({
        type: 'risk',
        severity: 'high',
        message: 'High risk detected. You may need immediate attention.',
        actionUrl: '/emergency',
      });
    }

    // Alert 2: Moderate risk
    if (score && score > 34 && score <= 64) {
      alerts.push({
        type: 'risk',
        severity: 'moderate',
        message: 'Moderate risk. Keep monitoring your symptoms.',
        actionUrl: '/health-check',
      });
    }

    // Alert 3: Critical symptoms (fever + high HR, or breathing issues)
    if (symptoms?.fever && vitals?.heartRate > 100) {
      alerts.push({
        type: 'symptom',
        severity: 'high',
        message: 'Fever + elevated heart rate detected. Consider seeing a doctor.',
        actionUrl: '/emergency',
      });
    }

    if (symptoms?.breathing || symptoms?.difficultyBreathing) {
      alerts.push({
        type: 'symptom',
        severity: 'high',
        message: 'Breathing difficulty detected. Seek immediate medical attention.',
        actionUrl: '/emergency',
      });
    }

    // Alert 4: Worsening symptoms (if we have recent history)
    if (recentSymptoms && recentSymptoms.length > 1) {
      const latest = recentSymptoms[0];
      const previous = recentSymptoms[1];
      if (latest.fever && !previous.fever) {
        alerts.push({
          type: 'symptom',
          severity: 'moderate',
          message: 'New fever detected. Take your temperature and monitor closely.',
          actionUrl: '/health-check',
        });
      }
    }

    // Alert 5: Missed medication (would need medication tracking data)
    // This is a placeholder for client-side logic
    if (medications?.some((m) => m.status === 'missed')) {
      alerts.push({
        type: 'medication',
        severity: 'low',
        message: 'You missed a dose. Take it as soon as possible.',
        actionUrl: '/medications',
      });
    }

    res.json({ alerts, count: alerts.length });
  } catch (err) {
    console.error('[alerts/evaluate]', err.message);
    res.status(500).json({ error: 'Failed to evaluate alerts', alerts: [] });
  }
});

// ─── POST /api/health-score ───────────────────────────────────────────────────
// Convert risk score to health score (0-100 friendly scale) with label
app.post('/api/health-score', async (req, res) => {
  try {
    const { score } = req.body;
    if (score === undefined) return res.status(400).json({ error: 'score required' });

    // Invert: high risk score = low health score
    let healthScore = Math.max(0, 100 - score);

    // Apply smoothing: boost low scores slightly, floor high alerts
    if (healthScore > 85) healthScore = Math.max(85, healthScore); // Cap "good"
    if (healthScore < 20) healthScore = Math.min(20, healthScore); // Cap "critical"

    let label, color;
    if (healthScore >= 70) {
      label = 'Good';
      color = 'green';
    } else if (healthScore >= 40) {
      label = 'Moderate';
      color = 'yellow';
    } else {
      label = 'High Risk';
      color = 'red';
    }

    let friendlyText;
    if (healthScore >= 80) friendlyText = "You're doing great! Keep it up.";
    else if (healthScore >= 70) friendlyText = "You're doing fine. Keep monitoring.";
    else if (healthScore >= 50) friendlyText = "Keep monitoring. It's a good idea to track your health closely.";
    else if (healthScore >= 35) friendlyText = "Your health needs attention. Consider a check-up soon.";
    else friendlyText = "Take action now. This needs medical attention.";

    res.json({ healthScore, label, color, friendlyText });
  } catch (err) {
    console.error('[health-score]', err.message);
    res.status(500).json({ error: 'Failed to calculate health score' });
  }
});

// ─── GET / (Root route) ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const providers = AI_PROVIDERS.filter((p) => p.available()).map((p) => p.name);
  res.json({ 
    message: 'Parcimic API is running',
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    aiProviders: providers,
    endpoints: {
      health: '/api/health',
      chat: 'POST /api/llm/chat',
      predict: 'POST /api/predict-sepsis',
      hospitals: 'GET /api/nearby-healthcare'
    }
  });
});

// ─── GET /api/health ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const providers = AI_PROVIDERS.filter((p) => p.available()).map((p) => p.name);
  res.json({ status: 'ok', timestamp: new Date().toISOString(), aiProviders: providers });
});

app.listen(PORT, () => {
  const providers = AI_PROVIDERS.filter((p) => p.available()).map((p) => p.name);
  console.log(`\n  Parcimic  http://localhost:${PORT}`);
  console.log(`  AI cascade: ${providers.join(' → ') || 'none configured'}\n`);
});
