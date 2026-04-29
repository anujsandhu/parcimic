# ⚡ Quick Deploy Reference

## ✅ Your Backend is Production-Ready!

All fixes applied. Ready to deploy.

---

## 🚀 Deploy in 3 Steps

### Step 1: Render (3 min)
```
1. https://render.com → Sign up with GitHub
2. New + → Web Service → Connect repo
3. Settings:
   - Build: npm install
   - Start: node server.js
   - Plan: Free
4. Add env vars (see below)
5. Deploy → Copy URL
```

### Step 2: Update Frontend (1 min)
```bash
echo "REACT_APP_API_URL=https://parcimic-api.onrender.com" > client/.env.production
cd client && npm run build && cd ..
firebase deploy --only hosting
```

### Step 3: Test (1 min)
```
Visit: https://parcimic.web.app
Test AI Assistant
Test Emergency Map
Done! ✅
```

---

## 🔑 Environment Variables for Render

Copy these exactly:

```
NODE_ENV=production
GROQ_API_KEY=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
OPENROUTER_API_KEY=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
GEMINI_API_KEY=AIzaSyC7zwRWScFvl9ZvhF2AsO7VFliNc2Sr3ok
HF_API_KEY=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
```

---

## 🧪 Quick Test

```bash
# After deployment, test:
curl https://parcimic-api.onrender.com/
curl https://parcimic-api.onrender.com/api/health
```

Should see:
```json
{
  "message": "Parcimic API is running",
  "status": "ok",
  "aiProviders": ["groq", "openrouter", "gemini"]
}
```

---

## 📋 What Was Fixed

✅ Added root "/" route  
✅ Fixed Python ML URL  
✅ Created frontend production env  
✅ All other configs already correct  

---

## 💰 Cost

**$0/month** - Everything on free tier

---

## 📖 Full Guide

Read **PRODUCTION_DEPLOYMENT_GUIDE.md** for detailed instructions.

---

**Ready? Go to https://render.com and deploy!**
