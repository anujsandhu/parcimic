# ⚡ Quick Start Deployment

## 🎯 Deploy in 10 Minutes

### 1️⃣ Push to GitHub (1 min)

```bash
git add .
git commit -m "feat: production-ready setup"
git push origin main
```

### 2️⃣ Deploy Backend to Render (5 min)

1. Go to https://render.com → Sign up
2. **New Web Service** → Connect repo
3. **Settings**:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `node server.js`
4. **Environment Variables**:
   ```
   NODE_ENV=production
   GROQ_API_KEY=<your_key>
   OPENROUTER_API_KEY=<your_key>
   GEMINI_API_KEY=<your_key>
   ```
5. **Deploy** → Copy URL

### 3️⃣ Deploy Frontend to Firebase (4 min)

```bash
# Update backend URL
echo "REACT_APP_API_URL=https://parcimic-api.onrender.com" > client/.env.production

# Build and deploy
cd client
npm run build
cd ..
firebase deploy --only hosting
```

### 4️⃣ Test (1 min)

- Backend: `curl https://parcimic-api.onrender.com/api/health`
- Frontend: https://parcimic.web.app

---

## ✅ Done!

- ✅ Backend: https://parcimic-api.onrender.com
- ✅ Frontend: https://parcimic.web.app
- ✅ Cost: $0/month

---

## 🔑 Get API Keys

- **Groq**: https://console.groq.com
- **OpenRouter**: https://openrouter.ai
- **Gemini**: https://makersuite.google.com/app/apikey

---

## 🆘 Issues?

See `PRODUCTION_DEPLOY.md` for detailed troubleshooting.

---

**Total Time: 10 minutes** ⏱️
