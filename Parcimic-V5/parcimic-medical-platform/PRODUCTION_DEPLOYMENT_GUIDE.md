# 🚀 Production Deployment Guide

## ✅ Backend is Production-Ready!

Your backend has been fixed and is ready for Render deployment.

---

## 📋 What Was Fixed

### 1. Server Configuration ✅
- ✅ Dynamic PORT: `process.env.PORT || 5000`
- ✅ Root route "/" added with API info
- ✅ CORS configured for production origins
- ✅ All environment variables properly used
- ✅ No hardcoded localhost URLs
- ✅ Error handling in all routes

### 2. Environment Variables ✅
All API keys use `process.env`:
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`
- `GEMINI_API_KEY`
- `HF_API_KEY`

### 3. API Routes ✅
- `GET /` - API info and status
- `GET /api/health` - Health check
- `POST /api/llm/chat` - AI chatbot
- `POST /api/predict-sepsis` - Health prediction
- `GET /api/nearby-healthcare` - Hospital search
- `POST /api/llm/explain` - Explain results
- `POST /api/symptoms/checkin` - Save symptoms
- `POST /api/alerts/evaluate` - Evaluate alerts
- `POST /api/health-score` - Calculate health score

---

## 🎯 Deploy to Render (5 Minutes)

### Step 1: Sign Up & Create Service

1. Go to: **https://render.com**
2. Click **"Sign up with GitHub"**
3. Click **"New +"** → **"Web Service"**
4. Select **"Build and deploy from a Git repository"**
5. Connect your repository: `parcimic-medical-platform`

### Step 2: Configure Service

| Setting | Value |
|---------|-------|
| **Name** | `parcimic-api` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | *(leave empty)* |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | **Free** |

### Step 3: Add Environment Variables

Click **"Add Environment Variable"** and add these:

```
NODE_ENV=production
```

```
GROQ_API_KEY=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
```

```
OPENROUTER_API_KEY=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
```

```
GEMINI_API_KEY=AIzaSyC7zwRWScFvl9ZvhF2AsO7VFliNc2Sr3ok
```

```
HF_API_KEY=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
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Look for **"Live"** status (green)
4. Copy your URL: `https://parcimic-api.onrender.com`

### Step 5: Test Backend

Open in browser:
```
https://parcimic-api.onrender.com/
```

Should see:
```json
{
  "message": "Parcimic API is running",
  "status": "ok",
  "aiProviders": ["groq", "openrouter", "gemini"],
  "endpoints": { ... }
}
```

Test health endpoint:
```
https://parcimic-api.onrender.com/api/health
```

---

## 🎨 Update Frontend

### Option 1: Automated Script

```bash
./deploy-frontend.sh https://parcimic-api.onrender.com
```

### Option 2: Manual Steps

```bash
# 1. Update production environment variable
echo "REACT_APP_API_URL=https://parcimic-api.onrender.com" > client/.env.production

# 2. Rebuild frontend
cd client
npm run build
cd ..

# 3. Deploy to Firebase
firebase deploy --only hosting
```

---

## 🧪 Test Everything

### 1. Test Backend Directly

```bash
# Health check
curl https://parcimic-api.onrender.com/api/health

# AI chat
curl -X POST https://parcimic-api.onrender.com/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","history":[]}'

# Hospital search (Delhi coordinates)
curl "https://parcimic-api.onrender.com/api/nearby-healthcare?lat=28.6139&lng=77.2090&radius=5000"
```

### 2. Test Frontend

1. Visit: **https://parcimic.web.app**
2. Go to **AI Assistant** → Type "hello" → Should get response ✅
3. Go to **Emergency Map** → Should load hospitals ✅
4. Complete **Health Check** → Should get risk score ✅

---

## 📁 Files Modified

### Backend Files
- ✅ `server.js` - Added root route, fixed Python ML URL
- ✅ `package.json` - Already correct
- ✅ `.env` - Already has all keys

### Frontend Files
- ✅ `client/.env.production` - Created with backend URL
- ✅ `client/.env.local.example` - Created for local dev
- ✅ `client/src/utils/api.js` - Already uses `REACT_APP_API_URL`

---

## 🔍 Troubleshooting

### Backend Issues

**Deployment failed?**
- Check Render logs in dashboard
- Verify all environment variables are set
- Ensure `npm install` completes successfully

**"Service Unavailable"?**
- Free tier sleeps after 15 min inactivity
- First request takes ~30 seconds to wake up
- This is normal on free tier

**AI not responding?**
- Check Render logs for API key errors
- Test: `curl https://your-url.onrender.com/api/health`
- Verify `aiProviders` array is not empty

### Frontend Issues

**AI still not working?**
- Check browser console (F12) for errors
- Verify `REACT_APP_API_URL` in `client/.env.production`
- Rebuild: `cd client && npm run build`
- Redeploy: `firebase deploy --only hosting`

**CORS errors?**
- Backend already configured for `https://parcimic.web.app`
- Check Render logs for CORS errors
- Verify frontend URL matches exactly

**Emergency Map not loading?**
- Test backend: `curl "https://your-url.onrender.com/api/nearby-healthcare?lat=28.6139&lng=77.2090&radius=5000"`
- Check browser console for errors
- Verify geolocation permission is granted

---

## 🎯 Production Checklist

### Backend ✅
- [x] Dynamic PORT configuration
- [x] Root "/" route added
- [x] CORS configured for production
- [x] All API keys in environment variables
- [x] No hardcoded localhost URLs
- [x] Error handling in all routes
- [x] Proper JSON responses
- [x] `package.json` has `"start": "node server.js"`

### Frontend ✅
- [x] `REACT_APP_API_URL` environment variable
- [x] API client uses environment variable
- [x] Production build configured
- [x] Firebase hosting configured

### Deployment ⏳
- [ ] Backend deployed to Render
- [ ] Environment variables set in Render
- [ ] Backend URL copied
- [ ] Frontend `.env.production` updated
- [ ] Frontend rebuilt
- [ ] Frontend redeployed to Firebase
- [ ] All features tested

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│  User Browser                           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Frontend (Firebase Hosting)            │
│  https://parcimic.web.app               │
│  - React SPA                            │
│  - Firestore SDK (direct)               │
│  - API calls via REACT_APP_API_URL      │
└────────────┬────────────────────────────┘
             │
             │ REACT_APP_API_URL
             │
             ▼
┌─────────────────────────────────────────┐
│  Backend API (Render)                   │
│  https://parcimic-api.onrender.com      │
│  - Express.js server                    │
│  - AI provider cascade                  │
│  - Hospital search                      │
│  - Health prediction                    │
└────────────┬────────────────────────────┘
             │
             ├─────────────────────────────┐
             │                             │
             ▼                             ▼
┌────────────────────────┐   ┌────────────────────────┐
│  AI APIs               │   │  OpenStreetMap         │
│  - Groq                │   │  Overpass API          │
│  - OpenRouter          │   │  (hospital search)     │
│  - Gemini              │   │                        │
│  - HuggingFace         │   │  Free, no API key      │
└────────────────────────┘   └────────────────────────┘
```

---

## 💰 Cost

| Service | Plan | Cost |
|---------|------|------|
| Render Backend | Free | $0/month (750 hours) |
| Firebase Hosting | Spark | $0/month |
| Firestore | Spark | $0/month |
| Groq API | Free | $0/month (14,400 req/day) |
| OpenRouter API | Free | $0/month (200 req/day) |
| Gemini API | Free | $0/month (1,500 req/day) |
| OpenStreetMap | Free | $0/month |

**Total: $0/month** 🎉

---

## 🚀 Ready to Deploy!

1. Go to: **https://render.com**
2. Follow **Step 1-4** above
3. Run: `./deploy-frontend.sh <your-render-url>`
4. Test: **https://parcimic.web.app**

**Your app will be fully deployed and working!**
