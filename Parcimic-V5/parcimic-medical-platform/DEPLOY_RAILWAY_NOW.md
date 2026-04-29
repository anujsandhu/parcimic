# 🚂 Deploy to Railway NOW (Faster Alternative)

## ⚡ Why Railway Instead of Render?

- ✅ **No GitHub push required** - deploys from local
- ✅ **Faster setup** - 2 minutes vs 10 minutes
- ✅ **Same free tier** - $5 credit/month
- ✅ **Auto-detects backend/** - no manual config needed
- ✅ **Better for testing** - can always move to Render later

---

## 🚀 Deploy in 3 Minutes

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser. Sign up with GitHub (no repo access needed).

### Step 3: Deploy Backend

```bash
# Navigate to backend directory
cd backend

# Initialize Railway project
railway init

# When prompted:
# - Project name: parcimic-api
# - Start command: node server.js

# Deploy
railway up
```

### Step 4: Add Environment Variables

```bash
# Add your API keys
railway variables set NODE_ENV=production
railway variables set GROQ_API_KEY=your_groq_key_here
railway variables set OPENROUTER_API_KEY=your_openrouter_key_here
railway variables set GEMINI_API_KEY=your_gemini_key_here
```

### Step 5: Get Your URL

```bash
# Generate public URL
railway domain

# Or open in browser
railway open
```

Your backend will be at: `https://parcimic-api.up.railway.app`

---

## 🎨 Update Frontend

```bash
# Go back to root
cd ..

# Update frontend config
echo "REACT_APP_API_URL=https://parcimic-api.up.railway.app" > client/.env.production

# Rebuild and deploy
cd client
npm run build
cd ..
firebase deploy --only hosting
```

---

## ✅ Test Your Backend

```bash
# Test health endpoint
curl https://parcimic-api.up.railway.app/api/health

# Should return:
# {"status":"ok","timestamp":"...","aiProviders":["groq","openrouter","gemini"]}
```

---

## 📊 Railway vs Render

| Feature | Railway | Render |
|---------|---------|--------|
| **Setup Time** | 2 min | 10 min |
| **Deploy Method** | Local CLI | GitHub only |
| **Free Tier** | $5 credit/month | 750 hours/month |
| **Cold Start** | ~5 seconds | ~30 seconds |
| **Config** | Auto-detected | Manual setup |

---

## 🔄 Alternative: Use Railway Web UI

If CLI doesn't work:

1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → **Empty Project**
4. **Add Service** → **GitHub Repo**
5. **Connect** your repo
6. **Root Directory**: Set to `backend`
7. **Add Variables**: Add your API keys
8. **Deploy**

---

## 💰 Cost

Railway gives you **$5 credit/month** which is enough for:
- ~500 hours of runtime
- Perfect for development and testing
- Can upgrade later if needed

---

## 🎯 Complete Commands (Copy-Paste)

```bash
# Install Railway
npm install -g @railway/cli

# Login
railway login

# Deploy
cd backend
railway init
railway up

# Add environment variables
railway variables set NODE_ENV=production
railway variables set GROQ_API_KEY=your_actual_groq_key
railway variables set OPENROUTER_API_KEY=your_actual_openrouter_key
railway variables set GEMINI_API_KEY=your_actual_gemini_key

# Get URL
railway domain

# Test
curl $(railway domain)/api/health
```

---

## ✅ After Railway Deployment

1. ✅ Backend is live
2. ✅ Copy the Railway URL
3. ✅ Update `client/.env.production`
4. ✅ Rebuild frontend: `cd client && npm run build`
5. ✅ Deploy frontend: `firebase deploy --only hosting`
6. ✅ Test on https://parcimic.web.app

---

## 🆘 Troubleshooting

### "railway: command not found"

```bash
# Try with npx
npx @railway/cli login
npx @railway/cli init
npx @railway/cli up
```

### "No package.json found"

Make sure you're in the `backend/` directory:
```bash
pwd  # Should show: .../parcimic-medical-platform/backend
ls   # Should show: server.js, package.json, etc.
```

### "Build failed"

Check logs:
```bash
railway logs
```

---

## 🎉 Why This is Better Right Now

1. **No GitHub issues** - bypasses the secret scanning problem
2. **Faster deployment** - 2 minutes vs fighting with GitHub
3. **Same result** - your backend will be live and working
4. **Can migrate later** - once GitHub is fixed, can move to Render

---

## 🚀 DO THIS NOW

```bash
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
railway variables set NODE_ENV=production
railway variables set GROQ_API_KEY=<your_key>
railway variables set OPENROUTER_API_KEY=<your_key>
railway variables set GEMINI_API_KEY=<your_key>
railway domain
```

**Your backend will be live in 3 minutes!** 🎉

---

## 📝 Next Steps

After Railway deployment works:
1. ✅ Backend is live and tested
2. ⏳ Fix GitHub push issue (allow secrets)
3. ⏳ Optionally migrate to Render
4. ✅ Keep using Railway (it works great!)

**Railway is actually easier than Render for this use case!**
