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
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
HF_API_KEY=YOUR_HUGGINGFACE_API_KEY_HERE
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
