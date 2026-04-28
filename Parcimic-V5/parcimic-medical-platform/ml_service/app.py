"""
Parcimic — Optional Python ML Microservice
Only used when ML_API_URL is not set and USE_PYTHON_ML=true in .env

Run:
  pip install -r requirements.txt
  python train.py        # train and save model.pkl
  uvicorn app:app --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import numpy as np
import os

app = FastAPI(title="Parcimic ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load model ───────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
model = None
feature_names = None

def load_model():
    global model, feature_names
    if os.path.exists(MODEL_PATH):
        data = joblib.load(MODEL_PATH)
        if isinstance(data, dict):
            model = data.get("model")
            feature_names = data.get("feature_names", [])
        else:
            model = data
        print(f"[ML] Model loaded from {MODEL_PATH}")
    else:
        print("[ML] No model.pkl found — run train.py first. Using rule-based fallback.")

load_model()

# ─── Request schema ───────────────────────────────────────────────────────────
class Vitals(BaseModel):
    heartRate: Optional[float] = 80
    temp: Optional[float] = 37.0
    respRate: Optional[float] = 16
    sysBP: Optional[float] = 120
    o2Sat: Optional[float] = 98

class Labs(BaseModel):
    wbc: Optional[float] = 8.0
    lactate: Optional[float] = 1.0
    creatinine: Optional[float] = 1.0
    platelets: Optional[float] = 250

class History(BaseModel):
    age: Optional[float] = 45
    recentSurgery: Optional[bool] = False
    chronicDisease: Optional[bool] = False

class Symptoms(BaseModel):
    shortnessBreath: Optional[bool] = False
    difficultyBreathing: Optional[bool] = False
    abdominalPain: Optional[bool] = False
    fever: Optional[bool] = False
    confusion: Optional[bool] = False
    decreasedAppetite: Optional[bool] = False

class PredictRequest(BaseModel):
    vitals: Optional[Vitals] = Vitals()
    labs: Optional[Labs] = Labs()
    history: Optional[History] = History()
    symptoms: Optional[Symptoms] = Symptoms()

# ─── Feature extraction ───────────────────────────────────────────────────────
def extract_features(req: PredictRequest) -> np.ndarray:
    v = req.vitals or Vitals()
    l = req.labs or Labs()
    h = req.history or History()
    s = req.symptoms or Symptoms()

    return np.array([[
        v.heartRate or 80,
        v.temp or 37.0,
        v.respRate or 16,
        v.sysBP or 120,
        v.o2Sat or 98,
        l.wbc or 8.0,
        l.lactate or 1.0,
        l.creatinine or 1.0,
        l.platelets or 250,
        h.age or 45,
        int(h.recentSurgery or False),
        int(h.chronicDisease or False),
        int(s.shortnessBreath or False),
        int(s.difficultyBreathing or False),
        int(s.abdominalPain or False),
        int(s.fever or False),
        int(s.confusion or False),
        int(s.decreasedAppetite or False),
    ]])

# ─── Rule-based fallback ──────────────────────────────────────────────────────
def rule_based_score(req: PredictRequest) -> float:
    v = req.vitals or Vitals()
    l = req.labs or Labs()
    h = req.history or History()
    s = req.symptoms or Symptoms()
    score = 0
    if (v.heartRate or 80) > 100 or (v.heartRate or 80) < 60: score += 15
    if (v.temp or 37) > 38.3 or (v.temp or 37) < 36: score += 15
    if (v.respRate or 16) > 22: score += 20
    if (v.sysBP or 120) < 100: score += 25
    if (v.o2Sat or 98) < 94: score += 15
    if (l.lactate or 0) > 2.0: score += 30
    wbc = l.wbc or 0
    if wbc > 12 or (0 < wbc < 4): score += 15
    if (h.age or 0) > 65: score += 10
    if h.recentSurgery: score += 20
    if h.chronicDisease: score += 15
    if s.shortnessBreath or s.difficultyBreathing: score += 20
    if s.abdominalPain: score += 15
    if s.fever: score += 10
    if s.confusion: score += 15
    return min(score * 0.72, 99)

# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict")
def predict(req: PredictRequest):
    try:
        if model is not None:
            features = extract_features(req)
            proba = model.predict_proba(features)[0]
            score = round(float(proba[1]) * 100, 1)

            # Feature importance (Random Forest)
            importance = None
            if hasattr(model, "feature_importances_") and feature_names:
                imp = model.feature_importances_
                importance = dict(zip(feature_names, [round(float(x), 4) for x in imp]))
        else:
            score = round(rule_based_score(req), 1)
            importance = None

        risk_level = "high" if score >= 65 else "moderate" if score >= 35 else "low"

        return {
            "score": score,
            "risk_score": score,
            "riskLevel": risk_level,
            "risk_category": risk_level,
            "feature_importance": importance,
            "source": "python_ml" if model else "rule_based",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
