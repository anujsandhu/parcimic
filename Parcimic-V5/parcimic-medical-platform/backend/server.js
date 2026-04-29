require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://parcimic.web.app', 'https://parcimic.firebaseapp.com']
    : '*'
}));
app.use(express.json({ limit: '1mb' }));

// ─── AI Provider Cascade ──────────────────────────────────────────────────────
const AI_PROVIDERS = [
  {
    name: 'groq',
    available: () => !!process.env.GROQ_API_KEY,
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
    call: async (messages, maxTokens) => {
      const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

      const systemMsg = messages.find((m) => m.role === 'system');
      const convo = messages.filter((m) => m.role !== 'system');

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
];

async function callAI(messages, maxTokens = 350) {
  const retryable = new Set([429, 402, 503, 529]);
  for (const provider of AI_PROVIDERS) {
    if (!provider.available()) continue;
    try {
      const text = await provider.call(messages, maxTokens);
      if (text && text.trim().length > 5) {
        return text.trim();
      }
    } catch (err) {
      const status = err.response?.status;
      const isRetryable = retryable.has(status) || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
      console.warn(`[AI] ${provider.name} ${isRetryable ? 'rate-limited/timeout' : 'error'} (${status || err.code})`);
      if (isRetryable) continue;
      continue;
    }
  }
  return null;
}

function simpleMessages(system, userPrompt) {
  return [
    { role: 'system', content: system },
    { role: 'user', content: userPrompt },
  ];
}

// ─── Local Scoring ────────────────────────────────────────────────────────────
function localSepsisScore({ vitals = {}, labs = {}, history = {}, symptoms = {} }) {
  let s = 0;
  const { heartRate: hr, temp, respRate: rr, sysBP: sbp, o2Sat: o2 } = vitals;
  const { lactate, wbc } = labs;
  const { age, recentSurgery, chronicDisease } = history;

  if (hr > 100 || hr < 60) s += 15;
  if (temp > 38.3 || temp < 36) s += 15;
  if (rr > 22) s += 20;
  if (sbp < 100) s += 25;
  if (o2 < 94) s += 15;
  if (lactate > 2.0) s += 30;
  if (wbc > 12 || (wbc > 0 && wbc < 4)) s += 15;
  if (age > 65) s += 10;
  if (recentSurgery) s += 20;
  if (chronicDisease) s += 15;
  if (symptoms.shortnessBreath || symptoms.difficultyBreathing) s += 20;
  if (symptoms.abdominalPain) s += 15;
  if (symptoms.fever) s += 10;
  if (symptoms.confusion) s += 15;
  if (symptoms.fatigue) s += 8;

  const final = Math.min(Math.round(s * 0.72), 99);
  return {
    score: final,
    riskLevel: final >= 65 ? 'high' : final >= 35 ? 'moderate' : 'low',
    source: 'local'
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Root route
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

// Health check
app.get('/api/health', (req, res) => {
  const providers = AI_PROVIDERS.filter((p) => p.available()).map((p) => p.name);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiProviders: providers
  });
});

// Predict sepsis
app.post('/api/predict-sepsis', async (req, res) => {
  try {
    const { vitals, labs, symptoms, history } = req.body;
    const result = localSepsisScore({ vitals, labs, symptoms, history });
    const { score, riskLevel } = result;

    let recommendation = null;
    if (score >= 30) {
      const activeSymptoms = Object.entries(symptoms || {})
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ') || 'none';

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

// Chat endpoint
app.post('/api/llm/chat', async (req, res) => {
  try {
    const { message, history = [], systemPrompt } = req.body;

    const systemContent = systemPrompt || `You are Parcimic AI — a friendly, calm health assistant.
You help users understand their health check results and symptoms in simple, everyday language.
Keep responses concise (2-4 sentences unless more detail is needed).
Never use medical jargon. Be reassuring but honest.
If something sounds serious, gently encourage them to see a doctor.
Never mention "Gemini", "Groq", "OpenRouter", "LLaMA", or any AI brand. You are "Parcimic AI".`;

    const messages = [
      { role: 'system', content: systemContent },
      ...history.slice(-8).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const reply = await callAI(messages, 500);
    res.json({ reply: reply || "I'm having a little trouble right now. Please try again in a moment." });
  } catch (err) {
    console.error('[llm/chat]', err.message);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// Nearby healthcare
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
        const elng = e.lon ?? e.center?.lon;
        const dist = (elat && elng)
          ? Math.round(Math.sqrt(
            Math.pow((elat - +lat) * 111000, 2) +
            Math.pow((elng - +lng) * 111000 * Math.cos(+lat * Math.PI / 180), 2)
          ))
          : null;
        return {
          id: String(e.id),
          name: e.tags.name,
          type: e.tags.amenity,
          address: [e.tags['addr:street'], e.tags['addr:city']].filter(Boolean).join(', ') || null,
          phone: e.tags.phone || e.tags['contact:phone'] || null,
          website: e.tags.website || null,
          lat: elat,
          lng: elng,
          distanceM: dist,
        };
      })
      .filter((e) => e.lat && e.lng)
      .sort((a, b) => (a.distanceM || 99999) - (b.distanceM || 99999))
      .slice(0, 12);

    res.json({ results, total: results.length });
  } catch (err) {
    console.error('[nearby-healthcare]', err.message);
    res.status(500).json({ error: 'Could not load nearby hospitals. Please try again.', results: [] });
  }
});

// Health score
app.post('/api/health-score', async (req, res) => {
  try {
    const { score } = req.body;
    if (score === undefined) return res.status(400).json({ error: 'score required' });

    let healthScore = Math.max(0, 100 - score);
    if (healthScore > 85) healthScore = Math.max(85, healthScore);
    if (healthScore < 20) healthScore = Math.min(20, healthScore);

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

// Start server
app.listen(PORT, () => {
  const providers = AI_PROVIDERS.filter((p) => p.available()).map((p) => p.name);
  console.log(`\n✅ Parcimic API running on port ${PORT}`);
  console.log(`🤖 AI providers: ${providers.join(' → ') || 'none configured'}\n`);
});
