# 🚀 Production Deployment Guide

## ✅ Project is Production-Ready!

Your project is now clean, secure, and ready for deployment.

---

## 📁 Final Project Structure

```
parcimic-medical-platform/
├── backend/                          # Backend API (Render)
│   ├── server.js                    # Main server (uses env vars)
│   ├── package.json                 # Dependencies
│   ├── .nvmrc                       # Node 18
│   ├── .env.example                 # Environment template
│   └── README.md                    # Backend docs
│
├── client/                           # Frontend (Firebase)
│   ├── src/                         # React source
│   ├── public/                      # Static assets
│   ├── package.json                 # Dependencies
│   ├── .env.production              # Production config
│   └── .env.local.example           # Local dev template
│
├── .gitignore                        # Protects secrets
├── firebase.json                     # Firebase config
└── PRODUCTION_DEPLOY.md              # This file
```

---

## 🔒 Security Checklist

- ✅ No `.env` files in git
- ✅ All API keys use `process.env.*`
- ✅ `.gitignore` protects secrets
- ✅ Firebase API key is public (safe by design)
- ✅ Backend API keys in environment variables only
- ✅ CORS configured for production domains

---

## 🚀 Deploy Backend to Render

### Step 1: Push to GitHub

```bash
# Verify no secrets are tracked
git status

# Add all files
git add .

# Commit
git commit -m "feat: production-ready deployment setup"

# Push
git push origin main
```

### Step 2: Deploy on Render

1. **Go to**: https://render.com
2. **Sign up** with GitHub
3. **New Web Service** → Connect repository
4. **Configure**:
   ```
   Name: parcimic-api
   Region: Choose closest to you
   Branch: main
   Root Directory: backend          ← CRITICAL!
   Runtime: Node
   Build Command: npm install
   Start Command: node server.js
   Instance Type: Free
   ```

5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   GROQ_API_KEY=<your_groq_key>
   OPENROUTER_API_KEY=<your_openrouter_key>
   GEMINI_API_KEY=<your_gemini_key>
   ```

6. **Deploy** → Wait 2-3 minutes

7. **Copy URL**: `https://parcimic-api.onrender.com`

### Step 3: Test Backend

```bash
# Health check
curl https://parcimic-api.onrender.com/api/health

# Should return:
# {"status":"ok","timestamp":"...","aiProviders":["groq","openrouter","gemini"]}
```

---

## 🎨 Deploy Frontend to Firebase

### Step 1: Update Backend URL

```bash
# Update production config with your Render URL
echo "REACT_APP_API_URL=https://parcimic-api.onrender.com" > client/.env.production
```

### Step 2: Build Frontend

```bash
cd client
npm install
npm run build
cd ..
```

### Step 3: Deploy to Firebase

```bash
# Deploy hosting only (no functions)
firebase deploy --only hosting
```

### Step 4: Test Frontend

Visit: https://parcimic.web.app

Test:
- ✅ AI Assistant chat
- ✅ Health Check prediction
- ✅ Emergency Map hospitals
- ✅ All features working

---

## 🧪 Local Development Setup

### Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env

# Start server
npm start

# Server runs on http://localhost:5000
```

### Frontend

```bash
cd client

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local (should point to http://localhost:5000)
nano .env.local

# Start dev server
npm start

# App runs on http://localhost:3000
```

---

## 🔑 Get API Keys

### Groq (Free: 14,400 req/day)
1. Go to: https://console.groq.com
2. Sign up
3. Create API key
4. Copy key

### OpenRouter (Free: 200 req/day)
1. Go to: https://openrouter.ai
2. Sign up
3. Create API key
4. Copy key

### Gemini (Free: 1,500 req/day)
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Create API key
4. Copy key

---

## 📊 Environment Variables Reference

### Backend (`backend/.env`)

```bash
# Required
NODE_ENV=production
GROQ_API_KEY=your_groq_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
GEMINI_API_KEY=your_gemini_key_here

# Optional
GROQ_MODEL=llama-3.1-8b-instant
OPENROUTER_MODEL=google/gemma-3-12b-it:free
GEMINI_MODEL=gemini-2.0-flash
```

### Frontend (`client/.env.production`)

```bash
REACT_APP_API_URL=https://parcimic-api.onrender.com
```

### Frontend Local (`client/.env.local`)

```bash
REACT_APP_API_URL=http://localhost:5000
```

---

## 🔍 Troubleshooting

### Backend Issues

**"Could not read package.json"**
- ✅ Ensure Root Directory is set to `backend` in Render

**"Service Unavailable"**
- ✅ Free tier sleeps after 15 min (first request takes ~30s)

**"AI not working"**
- ✅ Check environment variables in Render dashboard
- ✅ Visit `/api/health` to see available providers

### Frontend Issues

**"Network Error" or CORS**
- ✅ Verify `REACT_APP_API_URL` in `client/.env.production`
- ✅ Rebuild: `cd client && npm run build`
- ✅ Redeploy: `firebase deploy --only hosting`

**"API calls failing"**
- ✅ Check browser console for errors
- ✅ Verify backend URL is correct
- ✅ Test backend directly: `curl <backend_url>/api/health`

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] No `.env` files in git
- [ ] `.gitignore` updated
- [ ] All secrets use environment variables
- [ ] Code pushed to GitHub

### Backend (Render)
- [ ] Service created
- [ ] Root Directory set to `backend`
- [ ] Environment variables added
- [ ] Service shows "Live" status
- [ ] `/api/health` returns 200 OK
- [ ] Backend URL copied

### Frontend (Firebase)
- [ ] `client/.env.production` updated with backend URL
- [ ] `npm run build` successful
- [ ] `firebase deploy --only hosting` successful
- [ ] Site loads at https://parcimic.web.app
- [ ] All features tested

---

## 🎯 Success Criteria

- ✅ Backend API is live on Render
- ✅ Frontend is live on Firebase
- ✅ No secrets in git repository
- ✅ AI chat works
- ✅ Health prediction works
- ✅ Hospital search works
- ✅ No CORS errors
- ✅ No console errors

---

## 💰 Cost

| Service | Plan | Cost |
|---------|------|------|
| Render | Free | $0/month (750 hours) |
| Firebase Hosting | Spark | $0/month |
| Firestore | Spark | $0/month |
| Groq API | Free | $0/month |
| OpenRouter API | Free | $0/month |
| Gemini API | Free | $0/month |

**Total: $0/month** 🎉

---

## 📝 Important Notes

1. **Root Directory**: Must be set to `backend` in Render
2. **Environment Variables**: Add all 3 API keys in Render dashboard
3. **Frontend URL**: Update `client/.env.production` after backend deploy
4. **Rebuild**: Always rebuild frontend after changing `.env.production`
5. **Free Tier**: Backend sleeps after 15 min inactivity (normal)

---

## 🆘 Need Help?

- **Backend Docs**: See `backend/README.md`
- **Render Docs**: https://render.com/docs
- **Firebase Docs**: https://firebase.google.com/docs/hosting

---

**Everything is ready! Follow the steps above to deploy.** 🚀
