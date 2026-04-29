# Backend Deployment Guide

## Quick Deploy to Render (Recommended - Free Tier)

### Step 1: Prepare for Deployment

Your backend is ready! All files are configured.

### Step 2: Deploy to Render

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (or use "Deploy from Git URL")
4. Configure:
   - **Name**: `parcimic-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### Step 3: Add Environment Variables

In Render dashboard, go to "Environment" tab and add:

```
NODE_ENV=production
PORT=10000
GROQ_API_KEY=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
OPENROUTER_API_KEY=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
GEMINI_API_KEY=AIzaSyC7zwRWScFvl9ZvhF2AsO7VFliNc2Sr3ok
HF_API_KEY=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
GROQ_MODEL=llama-3.1-8b-instant
OPENROUTER_MODEL=google/gemma-3-12b-it:free
GEMINI_MODEL=gemini-2.0-flash
HF_MODEL=HuggingFaceH4/zephyr-7b-beta
DEBUG=false
```

### Step 4: Deploy

Click "Create Web Service" - Render will deploy automatically.

Your backend URL will be: `https://parcimic-api.onrender.com`

### Step 5: Update Frontend

Once deployed, copy your Render URL and run:

```bash
cd client
echo "REACT_APP_API_URL=https://parcimic-api.onrender.com" > .env
npm run build
cd ..
firebase deploy --only hosting
```

### Step 6: Test

Visit https://parcimic.web.app and test:
- AI Assistant (should respond to messages)
- Emergency Map (should load nearby hospitals)

---

## Alternative: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js
5. Add environment variables (same as above)
6. Deploy

Your URL: `https://parcimic-api.up.railway.app`

---

## Alternative: Deploy to Heroku

```bash
heroku login
heroku create parcimic-api
heroku config:set NODE_ENV=production
heroku config:set GROQ_API_KEY=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
heroku config:set OPENROUTER_API_KEY=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
heroku config:set GEMINI_API_KEY=AIzaSyC7zwRWScFvl9ZvhF2AsO7VFliNc2Sr3ok
git push heroku main
```

---

## Troubleshooting

### AI not responding
- Check Render logs: Dashboard → Logs
- Verify environment variables are set
- Test endpoint: `https://your-backend-url.onrender.com/api/health`

### Emergency Map not loading
- Check browser console for CORS errors
- Verify backend URL in client/.env
- Ensure frontend was rebuilt after changing .env

### "No facilities found"
- This is normal if there are no hospitals within 5km radius
- Try increasing radius in EmergencyMap.jsx
- Check Overpass API status: https://overpass-api.de/api/status

---

## Current Status

✅ Backend code ready (server.js)
✅ Environment variables configured (.env)
✅ Procfile created for deployment
✅ Frontend deployed to Firebase Hosting
❌ Backend needs deployment (currently localhost only)

**Next Step**: Deploy backend to Render following steps above.
