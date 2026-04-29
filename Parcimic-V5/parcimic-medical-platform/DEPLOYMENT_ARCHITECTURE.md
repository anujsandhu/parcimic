# 🏗️ Parcimic Deployment Architecture

## Current Problem

```
┌─────────────────────────────────────────┐
│  Frontend (DEPLOYED ✅)                 │
│  https://parcimic.web.app               │
│  Firebase Hosting                       │
│                                         │
│  - React SPA (static files)            │
│  - Firestore SDK (works ✅)            │
│  - API calls to backend                │
└────────────┬────────────────────────────┘
             │
             │ REACT_APP_API_URL
             │ (currently: empty or localhost)
             │
             ▼
┌─────────────────────────────────────────┐
│  Backend (NOT DEPLOYED ❌)              │
│  localhost:5000                         │
│  Only accessible on your computer       │
│                                         │
│  - Express.js API                      │
│  - AI chatbot endpoints                │
│  - Hospital search                     │
└─────────────────────────────────────────┘

RESULT: AI Assistant and Emergency Map don't work in production
```

---

## Solution: Deploy Backend

```
┌─────────────────────────────────────────┐
│  Frontend (DEPLOYED ✅)                 │
│  https://parcimic.web.app               │
│  Firebase Hosting                       │
│                                         │
│  - React SPA (static files)            │
│  - Firestore SDK (direct connection)   │
│  - API calls to backend                │
└────────────┬────────────────────────────┘
             │
             │ REACT_APP_API_URL
             │ https://parcimic-api.onrender.com
             │
             ▼
┌─────────────────────────────────────────┐
│  Backend (DEPLOYED ✅)                  │
│  https://parcimic-api.onrender.com      │
│  Render Free Tier                       │
│                                         │
│  - Express.js API                      │
│  - AI chatbot endpoints                │
│  - Hospital search                     │
└────────────┬────────────────────────────┘
             │
             ├─────────────────────────────┐
             │                             │
             ▼                             ▼
┌────────────────────────┐   ┌────────────────────────┐
│  AI Providers          │   │  OpenStreetMap         │
│  - Groq (primary)      │   │  Overpass API          │
│  - OpenRouter          │   │  (hospital search)     │
│  - Gemini              │   │                        │
│  - HuggingFace         │   │  Free, no API key      │
└────────────────────────┘   └────────────────────────┘

RESULT: Everything works! ✅
```

---

## Data Flow

### 1. User Opens App
```
User Browser
    ↓
https://parcimic.web.app (Firebase Hosting)
    ↓
Loads React SPA (HTML, CSS, JS)
    ↓
Initializes Firebase SDK
    ↓
Connects to Firestore (direct connection)
```

### 2. User Sends AI Message
```
User types in AI Assistant
    ↓
React component calls llmChat()
    ↓
client/src/utils/api.js
    ↓
POST https://parcimic-api.onrender.com/api/llm/chat
    ↓
Backend server.js receives request
    ↓
Calls AI provider (Groq → OpenRouter → Gemini)
    ↓
Returns AI response
    ↓
React displays message
```

### 3. User Opens Emergency Map
```
User clicks Emergency Map
    ↓
React gets user location (browser geolocation)
    ↓
Calls getNearbyHealth(lat, lng)
    ↓
GET https://parcimic-api.onrender.com/api/nearby-healthcare
    ↓
Backend queries OpenStreetMap Overpass API
    ↓
Returns list of hospitals/clinics
    ↓
React displays on Leaflet map
```

### 4. User Saves Health Data
```
User completes health check
    ↓
React calls Firestore SDK directly
    ↓
Saves to Firestore (no backend needed)
    ↓
Firestore security rules validate
    ↓
Data saved ✅
```

---

## Why Two Separate Deployments?

### Frontend (Firebase Hosting)
- **Purpose**: Serve static files (HTML, CSS, JS)
- **Best for**: React apps, Vue apps, static sites
- **Can't do**: Run server code, make API calls to external services
- **Cost**: Free (10GB storage, 360MB/day transfer)

### Backend (Render/Railway)
- **Purpose**: Run server code (Node.js, Python, etc.)
- **Best for**: APIs, databases, background jobs
- **Can do**: Make API calls, process data, run AI models
- **Cost**: Free (750 hours/month on Render)

### Why Not Firebase Functions?
- Requires Blaze (pay-as-you-go) plan
- You're on Spark (free) plan
- Render/Railway are free alternatives

---

## Environment Variables

### Backend (.env)
```bash
NODE_ENV=production
PORT=10000
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIza...
HF_API_KEY=hf_...
```

### Frontend (client/.env)
```bash
REACT_APP_API_URL=https://parcimic-api.onrender.com
```

**Important**: Frontend env vars must start with `REACT_APP_` to be included in build.

---

## Deployment Checklist

### Backend Deployment
- [ ] Sign up for Render/Railway
- [ ] Create new web service
- [ ] Connect GitHub repository
- [ ] Set build command: `npm install`
- [ ] Set start command: `node server.js`
- [ ] Add environment variables (API keys)
- [ ] Deploy and wait 2-3 minutes
- [ ] Copy backend URL

### Frontend Update
- [ ] Update `client/.env` with backend URL
- [ ] Rebuild: `cd client && npm run build`
- [ ] Redeploy: `firebase deploy --only hosting`
- [ ] Test AI Assistant
- [ ] Test Emergency Map

---

## Testing

### Test Backend
```bash
# Health check
curl https://parcimic-api.onrender.com/api/health

# AI chat
curl -X POST https://parcimic-api.onrender.com/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","history":[]}'

# Hospital search
curl "https://parcimic-api.onrender.com/api/nearby-healthcare?lat=37.7749&lng=-122.4194&radius=5000"
```

### Test Frontend
1. Visit https://parcimic.web.app
2. Open browser console (F12)
3. Go to AI Assistant → Type "hello"
4. Check console for errors
5. Go to Emergency Map → Should load hospitals
6. Check console for API calls

---

## Monitoring

### Backend Logs (Render)
1. Go to Render dashboard
2. Click your service
3. Click "Logs" tab
4. Watch for errors

### Frontend Errors (Browser)
1. Open browser console (F12)
2. Check "Console" tab for errors
3. Check "Network" tab for failed API calls

---

## Common Issues

### "Failed to fetch" in browser console
- Backend URL is wrong in `client/.env`
- Backend is not deployed
- CORS error (already configured in server.js)

### "Cannot GET /api/health"
- Backend not running
- Wrong URL
- Deployment failed

### "No facilities found"
- Normal if no hospitals within 5km
- Try different location
- Overpass API might be rate-limited (uses fallback)

### AI not responding
- Check backend logs for API key errors
- Verify API keys in Render environment variables
- Try different AI provider (cascade auto-falls back)

---

## Cost Optimization

### Free Tier Limits
- **Render**: 750 hours/month (enough for 1 service 24/7)
- **Groq**: 14,400 requests/day (plenty for small app)
- **Firebase Hosting**: 10GB storage, 360MB/day transfer
- **Firestore**: 50K reads, 20K writes per day

### If You Exceed Free Tier
1. **Render**: Upgrade to $7/month for more hours
2. **AI**: Cascade automatically uses free alternatives
3. **Firebase**: Upgrade to Blaze (pay-as-you-go)

---

## Security

### Backend
- ✅ CORS configured for production domains only
- ✅ Helmet.js security headers
- ✅ Environment variables for API keys
- ✅ Rate limiting on AI providers

### Frontend
- ✅ Firestore security rules (user can only access own data)
- ✅ No API keys in client code
- ✅ HTTPS only (Firebase Hosting enforces)

### API Keys
- ✅ Stored in Render environment variables
- ✅ Never committed to Git
- ✅ Not exposed to client

---

**Ready to deploy? Follow DEPLOY_NOW.md!**
