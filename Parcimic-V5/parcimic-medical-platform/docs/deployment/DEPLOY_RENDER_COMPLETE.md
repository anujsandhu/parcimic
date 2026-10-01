# 🚀 Deploy to Render (Free Tier)

## Why Render?
- ✅ **750 hours/month free** (enough for 24/7 operation)
- ✅ **Auto-deploys from GitHub**
- ✅ **Fast and reliable**
- ✅ **Easy setup**
- ✅ **Professional features**

**Note**: Requires credit card, but you won't be charged on free tier

---

## Step-by-Step Deployment

### Step 1: Sign Up for Render

1. Go to: **https://render.com**
2. Click **"Get Started"** or **"Sign Up"**
3. Choose **"Sign up with GitHub"**
4. Authorize Render to access your GitHub repositories

### Step 2: Create New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. You'll see two options:
   - **"Build and deploy from a Git repository"** ← Choose this
   - Click **"Next"**

### Step 3: Connect Your Repository

1. If you see your repository listed:
   - Click **"Connect"** next to `parcimic-medical-platform`
   
2. If you don't see it:
   - Click **"Configure account"**
   - Grant Render access to your repositories
   - Come back and click **"Connect"**

### Step 4: Configure Your Service

Fill in these settings:

**Basic Settings:**
- **Name**: `parcimic-api` (or any name you like)
- **Region**: Choose closest to you (e.g., Oregon, Frankfurt, Singapore)
- **Branch**: `main` (or `master` if that's your default)
- **Root Directory**: Leave empty
- **Runtime**: `Node`

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

**Plan:**
- Select **"Free"** plan
- Shows: "750 hours/month" ✅

### Step 5: Add Environment Variables

Scroll down to **"Environment Variables"** section:

Click **"Add Environment Variable"** and add these one by one:

1. **Key**: `NODE_ENV`  
   **Value**: `production`

2. **Key**: `GROQ_API_KEY`  
   **Value**: `YOUR_GROQ_API_KEY_HERE`

3. **Key**: `OPENROUTER_API_KEY`  
   **Value**: `YOUR_OPENROUTER_API_KEY_HERE`

4. **Key**: `GEMINI_API_KEY`  
   **Value**: `YOUR_GEMINI_API_KEY_HERE`

5. **Key**: `HF_API_KEY`  
   **Value**: `YOUR_HUGGINGFACE_API_KEY_HERE`

6. **Key**: `GROQ_MODEL`  
   **Value**: `llama-3.1-8b-instant`

7. **Key**: `OPENROUTER_MODEL`  
   **Value**: `google/gemma-3-12b-it:free`

8. **Key**: `GEMINI_MODEL`  
   **Value**: `gemini-2.0-flash`

### Step 6: Create Web Service

1. Click **"Create Web Service"** button at the bottom
2. Render will start deploying your app
3. You'll see the deployment logs in real-time

**Wait 2-3 minutes** for deployment to complete.

### Step 7: Get Your Backend URL

Once deployed (you'll see "Live" status):

1. Your URL will be at the top: `https://parcimic-api.onrender.com`
2. Copy this URL

### Step 8: Test Your Backend

Open this URL in your browser:
```
https://parcimic-api.onrender.com/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T...",
  "aiProviders": ["groq", "openrouter", "gemini"]
}
```

✅ If you see this, your backend is working!

---

## Step 9: Update Frontend

Now update your frontend to use the Render backend:

```bash
./deploy-frontend.sh https://parcimic-api.onrender.com
```

Or manually:

```bash
# 1. Update environment variable
echo "REACT_APP_API_URL=https://parcimic-api.onrender.com" > client/.env

# 2. Rebuild frontend
cd client
npm run build
cd ..

# 3. Deploy to Firebase
firebase deploy --only hosting
```

---

## Step 10: Test Everything

1. **Visit your app**: https://parcimic.web.app

2. **Test AI Assistant**:
   - Go to AI Assistant page
   - Type "hello"
   - Should get AI response ✅

3. **Test Emergency Map**:
   - Go to Emergency Map
   - Should load nearby hospitals ✅

4. **Test Health Check**:
   - Complete a health check
   - Should get risk score and recommendation ✅

---

## Render Dashboard Features

### View Logs
1. Go to your service dashboard
2. Click **"Logs"** tab
3. See real-time server logs

### Monitor Performance
1. Click **"Metrics"** tab
2. See CPU, memory, bandwidth usage

### Auto-Deploy on Git Push
- Every time you push to GitHub, Render auto-deploys
- No manual deployment needed!

### Custom Domain (Optional)
1. Click **"Settings"** tab
2. Scroll to **"Custom Domain"**
3. Add your own domain (free SSL included)

---

## Troubleshooting

### Deployment Failed

**Check build logs:**
1. Go to your service dashboard
2. Click on the failed deployment
3. Read the error message

**Common issues:**
- Missing `package.json` → Already exists ✅
- Wrong start command → Should be `node server.js` ✅
- Missing dependencies → Run `npm install` locally first

### Backend Not Responding

**Check if service is running:**
1. Go to dashboard
2. Look for "Live" status (green)
3. If "Deploy failed" (red), check logs

**Test health endpoint:**
```bash
curl https://parcimic-api.onrender.com/api/health
```

### AI Not Working

**Check environment variables:**
1. Go to **"Environment"** tab
2. Verify all API keys are set
3. Click **"Save Changes"** if you edited anything

**Check logs for errors:**
```
[AI] groq rate-limited/timeout (429)
```
This means it's trying next provider (normal behavior)

### Emergency Map Not Loading

**Test hospital endpoint:**
```bash
curl "https://parcimic-api.onrender.com/api/nearby-healthcare?lat=28.6139&lng=77.2090&radius=5000"
```

Should return list of hospitals.

### "Service Unavailable" Error

**Free tier limitation:**
- Free services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Subsequent requests are fast

**Solution:**
- This is normal on free tier
- Upgrade to paid plan ($7/month) for always-on service
- Or use a service like UptimeRobot to ping every 10 minutes

---

## Render Free Tier Limits

| Feature | Free Tier |
|---------|-----------|
| Hours | 750/month (24/7 for 1 service) |
| RAM | 512 MB |
| CPU | Shared |
| Bandwidth | 100 GB/month |
| Build time | 500 minutes/month |
| Services | Unlimited |
| Auto-deploy | Yes |
| SSL | Yes (free) |
| Custom domain | Yes |

**Perfect for small apps!**

---

## Cost Estimate

For your app with ~10-20 users:

| Metric | Usage | Free Tier | Cost |
|--------|-------|-----------|------|
| Requests | ~5,000/month | 100GB bandwidth | $0 |
| Compute | 24/7 | 750 hours | $0 |
| Build | ~10 builds | 500 min | $0 |
| **TOTAL** | | | **$0** |

You won't pay anything unless you exceed these limits!

---

## Upgrade Options (Optional)

If you need more:

**Starter Plan ($7/month):**
- Always-on (no sleep)
- 1 GB RAM
- Faster CPU
- Priority support

**Standard Plan ($25/month):**
- 4 GB RAM
- Dedicated CPU
- Auto-scaling

---

## Quick Commands

```bash
# Test backend health
curl https://parcimic-api.onrender.com/api/health

# Test AI chat
curl -X POST https://parcimic-api.onrender.com/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","history":[]}'

# Test hospital search
curl "https://parcimic-api.onrender.com/api/nearby-healthcare?lat=28.6139&lng=77.2090&radius=5000"

# Update frontend
./deploy-frontend.sh https://parcimic-api.onrender.com

# Deploy to Firebase
firebase deploy --only hosting
```

---

## Auto-Deploy Setup

Render automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update backend"
git push origin main

# Render automatically deploys! 🎉
```

---

## Summary

✅ **Backend**: https://parcimic-api.onrender.com  
✅ **Frontend**: https://parcimic.web.app  
✅ **Database**: Firestore (Firebase)  
✅ **Cost**: $0/month  

---

## Ready to Deploy?

1. Go to: **https://render.com**
2. Sign up with GitHub
3. Create Web Service
4. Connect your repository
5. Add environment variables
6. Deploy!
7. Run: `./deploy-frontend.sh https://parcimic-api.onrender.com`

**Need help? Check the Render logs or read the troubleshooting section above.**
