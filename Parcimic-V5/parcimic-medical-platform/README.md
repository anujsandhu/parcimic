# 🏥 Parcimic — Sepsis Early Warning System

AI-powered clinical decision support for early sepsis detection.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Tailwind CSS + Recharts |
| Backend | Node.js + Express |
| Auth | Firebase Authentication (Google) |
| Database | Firebase Firestore |
| AI | Google Gemini 2.0 Flash |
| Maps | Google Maps API + Places |
| ML (optional) | Python FastAPI + scikit-learn |

## Quick Start

### 1. Install dependencies
```bash
npm install          # backend deps
cd client && npm install   # frontend deps
```

### 2. Configure environment
Edit `.env` in the root:
```env
PORT=5000
GEMINI_API_KEY=your_key_here

# Optional: External ML API (Mode 1 - PRIMARY)
# ML_API_URL=https://your-ml-api.com/predict

# Optional: Python microservice (Mode 2)
# USE_PYTHON_ML=true
# PYTHON_ML_URL=http://localhost:8000
```

### 3. Run development servers

**Backend** (terminal 1):
```bash
npm run dev:server   # nodemon server.js on :5000
```

**Frontend** (terminal 2):
```bash
npm run dev:client   # React dev server on :3000
```

Open http://localhost:3000

## ML Integration Modes

### Mode 1 — External ML API (PRIMARY)
Set `ML_API_URL` in `.env`. The backend calls it directly.
Expected response: `{ score, riskLevel }` or `{ risk_score, risk_category }`

### Mode 2 — Python Microservice (OPTIONAL)
Only used when `ML_API_URL` is not set and `USE_PYTHON_ML=true`.

```bash
cd ml_service
pip install -r requirements.txt
python train.py          # trains model, saves model.pkl
uvicorn app:app --port 8000
```

### Mode 3 — Local Scoring (FALLBACK)
Built-in rule-based scoring used when neither ML API nor Python service is available.

## Features

- **Sepsis Risk Assessment** — vitals + labs + symptoms → risk score (0–100)
- **Gemini AI Insights** — clinical interpretation of results
- **AI Chatbot** — Gemini-powered medical Q&A
- **Patient History** — Firestore-backed prediction history with trend charts
- **Emergency Map** — Google Maps with nearby hospital search
- **Dark/Light Mode** — system-aware theme toggle
- **Firebase Auth** — Google sign-in

## Deployment

### Frontend → Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Backend → Render / Railway
Push to GitHub, connect repo to Render/Railway, set env vars.

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/          # Dashboard, SepsisPrediction, AIAssistant, etc.
│   │   ├── components/     # Layout, ProtectedRoute
│   │   ├── context/        # AuthContext, ThemeContext
│   │   └── utils/          # firebase.js, api.js
│   └── public/
├── ml_service/             # Optional Python ML service
│   ├── app.py              # FastAPI app
│   ├── train.py            # Model training script
│   └── requirements.txt
├── server.js               # Express backend
├── .env                    # Environment variables
└── firebase.json           # Firebase config
```

---
> ⚠️ For clinical decision support only. Always consult qualified medical professionals.
