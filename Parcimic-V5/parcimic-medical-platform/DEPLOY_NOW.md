# 🚀 Deploy Parcimic Backend NOW

Your app works on localhost but not in production because the backend API is not deployed.

## The Problem

- ✅ Frontend deployed: https://parcimic.web.app
- ❌ Backend running: localhost:5000 only
- ❌ AI Assistant: Can't reach backend
- ❌ Emergency Map: Can't reach backend

## The Solution (5 minutes)

### Option 1: Render (Easiest - Recommended)

1. **Go to Render**: https://render.com/
2. **Sign up** with GitHub
3. **Click "New +"** → **"Web Service"**
4. **Connect this repository** or paste Git URL
5. **Configure**:
   - Name: `parcimic-api`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: **Free**
6. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
   OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   ```
7. **Click "Create Web Service"**
8. **Wait 2-3 minutes** for deployment
9. **Copy your URL**: `https://parcimic-api.onrender.com`

### Option 2: Railway (Also Easy)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Add environment variables (same as above)
5. Deploy
6. Copy URL: `https://parcimic-api.up.railway.app`

---

## After Backend Deploys

Run this command (replace with your actual backend URL):

```bash
./deploy-frontend.sh https://parcimic-api.onrender.com
```

Or manually:

```bash
# 1. Update client environment
echo "REACT_APP_API_URL=https://parcimic-api.onrender.com" > client/.env

# 2. Rebuild frontend
cd client && npm run build && cd ..

# 3. Redeploy to Firebase
firebase deploy --only hosting
```

---

## Test Everything

1. **Backend Health Check**:
   ```bash
   curl https://parcimic-api.onrender.com/api/health
   ```
   Should return: `{"status":"ok","aiProviders":["groq","openrouter","gemini"]}`

2. **Frontend**:
   - Visit: https://parcimic.web.app
   - Go to AI Assistant → Type "hello"
   - Go to Emergency Map → Should load hospitals

---

## Why This Happens

Firebase Hosting only serves static files (HTML, CSS, JS). Your backend API needs a separate server to:
- Handle AI chat requests
- Find nearby hospitals
- Process health predictions

Free hosting options:
- ✅ Render: 750 hours/month free
- ✅ Railway: $5 free credit/month
- ✅ Fly.io: 3 free VMs
- ✅ Heroku: Free tier (with credit card)

---

## Current Files Ready

- ✅ `server.js` - Backend API with all endpoints
- ✅ `.env` - All API keys configured
- ✅ `Procfile` - Deployment configuration
- ✅ `render.yaml` - Render auto-deploy config
- ✅ `deploy-frontend.sh` - Automated deployment script

**You just need to deploy the backend!**

---

## Need Help?

Check logs after deployment:
- Render: Dashboard → Your Service → Logs
- Railway: Dashboard → Your Project → Deployments → View Logs

Common issues:
- "Module not found": Run `npm install` in Render/Railway
- "Port already in use": Render/Railway handle this automatically
- "CORS error": Already configured in server.js
