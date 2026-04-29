# 🚀 Render Deployment Guide

## ✅ Project Structure Fixed

Your project is now properly structured for Render deployment:

```
parcimic-medical-platform/
├── backend/                    ← Backend API (deploy this to Render)
│   ├── server.js              ← Main server file
│   ├── package.json           ← Backend dependencies
│   ├── .nvmrc                 ← Node version (18)
│   ├── .env.example           ← Environment template
│   ├── .gitignore             ← Git ignore
│   └── README.md              ← Backend docs
├── client/                     ← Frontend (already on Firebase)
└── [other files]
```

---

## 🎯 Deploy Backend to Render

### Step 1: Sign Up

1. Go to: **https://render.com**
2. Click **"Sign up with GitHub"**
3. Authorize Render to access your repositories

### Step 2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Click **"Build and deploy from a Git repository"**
3. Select your repository: `parcimic-medical-platform`

### Step 3: Configure Service

Fill in these **EXACT** settings:

| Setting | Value |
|---------|-------|
| **Name** | `parcimic-api` |
| **Region** | Choose closest to you (e.g., Oregon USA) |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ **CRITICAL** |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | **Free** |

⚠️ **IMPORTANT**: The **Root Directory** MUST be set to `backend`. This tells Render where to find `package.json`.

### Step 4: Add Environment Variables

Click **"Add Environment Variable"** and add these one by one:

#### 1. NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`

#### 2. GROQ_API_KEY
- **Key**: `GROQ_API_KEY`
- **Value**: `YOUR_GROQ_API_KEY_HERE`

#### 3. OPENROUTER_API_KEY
- **Key**: `OPENROUTER_API_KEY`
- **Value**: `YOUR_OPENROUTER_API_KEY_HERE`

#### 4. GEMINI_API_KEY
- **Key**: `GEMINI_API_KEY`
- **Value**: `YOUR_GEMINI_API_KEY_HERE`

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Look for **"Live"** status (green dot)
4. Copy your URL: `https://parcimic-api.onrender.com`

---

## 🧪 Test Your Backend

### Test 1: Root Endpoint

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

### Test 2: Health Check

```bash
curl https://parcimic-api.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "aiProviders": ["groq", "openrouter", "gemini"]
}
```

### Test 3: AI Chat

```bash
curl -X POST https://parcimic-api.onrender.com/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","history":[]}'
```

Should get AI response.

---

## 🎨 Update Frontend

Now update your frontend to use the new backend URL:

### Option 1: Automated

```bash
cd client
echo "REACT_APP_API_URL=https://parcimic-api.onrender.com" > .env.production
npm run build
cd ..
firebase deploy --only hosting
```

### Option 2: Manual

1. Edit `client/.env.production`:
   ```
   REACT_APP_API_URL=https://parcimic-api.onrender.com
   ```

2. Rebuild frontend:
   ```bash
   cd client
   npm run build
   cd ..
   ```

3. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

---

## 🔍 Troubleshooting

### ❌ Build Failed: "Could not read package.json"

**Solution**: Root Directory is not set correctly.
- Go to Render dashboard → Settings
- Set **Root Directory** to `backend`
- Click "Save Changes"
- Trigger manual deploy

### ❌ "Service Unavailable" or 503 Error

**Cause**: Free tier sleeps after 15 minutes of inactivity.
**Solution**: This is normal. First request takes ~30 seconds to wake up.

### ❌ AI Not Responding

**Check**:
1. Visit `/api/health` endpoint
2. Verify `aiProviders` array is not empty
3. Check Render logs for API key errors
4. Ensure environment variables are set correctly

**Fix**:
- Go to Render dashboard → Environment
- Verify all API keys are set
- Click "Save Changes" (triggers redeploy)

### ❌ CORS Errors in Frontend

**Check**:
- Backend CORS is configured for `https://parcimic.web.app`
- Frontend is using correct backend URL
- Check browser console for exact error

**Fix**:
- Verify `REACT_APP_API_URL` in `client/.env.production`
- Rebuild and redeploy frontend

### ❌ Frontend Still Using Localhost

**Check**:
```bash
# In client/.env.production
cat client/.env.production
```

Should show:
```
REACT_APP_API_URL=https://parcimic-api.onrender.com
```

**Fix**:
```bash
cd client
npm run build
cd ..
firebase deploy --only hosting
```

---

## 📊 Render Dashboard

### View Logs
1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. See real-time server logs

### Monitor Status
- **Live** (green) = Running
- **Building** (yellow) = Deploying
- **Failed** (red) = Check logs

### Manual Deploy
1. Go to "Manual Deploy" section
2. Click "Deploy latest commit"
3. Wait for deployment

---

## 💰 Free Tier Details

| Resource | Limit |
|----------|-------|
| **Hours** | 750 hours/month (enough for 1 service) |
| **RAM** | 512 MB |
| **CPU** | Shared |
| **Sleep** | After 15 min inactivity |
| **Wake** | ~30 seconds on first request |
| **Bandwidth** | 100 GB/month |

---

## ✅ Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Root Directory set to `backend`
- [ ] All environment variables added
- [ ] Service shows "Live" status
- [ ] `/` endpoint returns API info
- [ ] `/api/health` shows AI providers
- [ ] Frontend `.env.production` updated
- [ ] Frontend rebuilt
- [ ] Frontend redeployed to Firebase
- [ ] AI chat works on production site
- [ ] Emergency map loads hospitals

---

## 🎉 Success!

Your app is now fully deployed:

- **Frontend**: https://parcimic.web.app
- **Backend**: https://parcimic-api.onrender.com

**Total Cost**: $0/month 🎉

---

## 📝 Next Steps

1. **Monitor**: Check Render logs regularly
2. **Optimize**: Add caching if needed
3. **Scale**: Upgrade to paid tier if traffic increases
4. **Backup**: Keep API keys secure

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Render Support**: https://render.com/support
- **Backend README**: See `backend/README.md`
