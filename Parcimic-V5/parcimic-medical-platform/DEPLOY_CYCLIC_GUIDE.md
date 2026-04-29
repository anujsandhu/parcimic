# 🆓 Deploy Backend to Cyclic (100% Free)

## Why Cyclic?
- ✅ **No credit card required**
- ✅ **10,000 requests per day** (plenty for your app)
- ✅ **Auto-deploys from GitHub**
- ✅ **Takes 5 minutes**
- ✅ **Free forever**

---

## Step-by-Step Deployment

### Step 1: Go to Cyclic
1. Open: https://app.cyclic.sh
2. Click **"Sign in with GitHub"**
3. Authorize Cyclic to access your GitHub

### Step 2: Deploy Your App
1. Click the **"Deploy"** button (or "Link Your Own" if you see it)
2. Select **"Link Your Own"** → Choose your repository
3. Or click **"Deploy from GitHub"** → Find `parcimic-medical-platform`
4. Click **"Connect"**

Cyclic will automatically:
- Detect it's a Node.js app
- Install dependencies
- Start your server
- Give you a URL

### Step 3: Add Environment Variables
1. Once deployed, click on your app
2. Go to **"Variables"** tab (left sidebar)
3. Click **"Add Variable"** and add these one by one:

```
NODE_ENV=production
```

```
GROQ_API_KEY=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
```

```
OPENROUTER_API_KEY=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
```

```
GEMINI_API_KEY=AIzaSyC7zwRWScFvl9ZvhF2AsO7VFliNc2Sr3ok
```

```
HF_API_KEY=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
```

4. Cyclic will **automatically redeploy** after adding variables

### Step 4: Get Your Backend URL
1. Go to **"Settings"** tab
2. Copy your app URL (looks like: `https://parcimic-api.cyclic.app`)
3. Or find it at the top of the dashboard

### Step 5: Test Your Backend
Open this URL in your browser (replace with your actual URL):
```
https://your-app-name.cyclic.app/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T...",
  "aiProviders": ["groq", "openrouter", "gemini"]
}
```

---

## Step 6: Update Frontend

Now that your backend is deployed, update your frontend:

```bash
# Replace with your actual Cyclic URL
./deploy-frontend.sh https://your-app-name.cyclic.app
```

Or manually:

```bash
# 1. Update client environment variable
echo "REACT_APP_API_URL=https://your-app-name.cyclic.app" > client/.env

# 2. Rebuild frontend
cd client
npm run build
cd ..

# 3. Deploy to Firebase
firebase deploy --only hosting
```

---

## Step 7: Test Everything

1. **Visit your app**: https://parcimic.web.app
2. **Test AI Assistant**:
   - Go to AI Assistant page
   - Type "hello"
   - Should get a response ✅
3. **Test Emergency Map**:
   - Go to Emergency Map page
   - Should load nearby hospitals ✅
4. **Test Health Check**:
   - Complete a health check
   - Should get risk score ✅

---

## Troubleshooting

### Backend not responding
1. Check Cyclic logs:
   - Go to your app dashboard
   - Click "Logs" tab
   - Look for errors
2. Verify environment variables are set
3. Make sure app is deployed (green status)

### AI not working
1. Test backend directly: `https://your-app.cyclic.app/api/health`
2. Check browser console for errors
3. Verify `REACT_APP_API_URL` in `client/.env`
4. Rebuild frontend: `cd client && npm run build`

### Emergency Map not loading
1. Check browser console for CORS errors
2. Verify backend URL is correct
3. Test hospital endpoint: `https://your-app.cyclic.app/api/nearby-healthcare?lat=28.6139&lng=77.2090&radius=5000`

### "No facilities found"
- This is normal if there are no hospitals within 5km
- Try a different location
- Backend is working fine

---

## What You Get (Free)

| Feature | Limit |
|---------|-------|
| Requests | 10,000/day |
| Bandwidth | Unlimited |
| Apps | Unlimited |
| Custom domain | Yes |
| Auto-deploy | Yes |
| SSL | Yes |
| Uptime | ~99% |

**10,000 requests/day = ~7 requests/minute**

For a small app with 10-20 users, this is more than enough!

---

## Alternative: Glitch (Also Free)

If Cyclic doesn't work, try Glitch:

1. Go to https://glitch.com
2. Click "New Project" → "Import from GitHub"
3. Paste your repository URL
4. Click `.env` file in Glitch editor
5. Add environment variables (same as above)
6. Copy your Glitch URL: `https://parcimic-api.glitch.me`
7. Update frontend with: `./deploy-frontend.sh https://parcimic-api.glitch.me`

**Note**: Glitch sleeps after 5 minutes of inactivity (first request will be slow)

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| Cyclic Backend | $0/month |
| Firebase Hosting | $0/month |
| Firestore | $0/month |
| AI APIs (Groq, etc.) | $0/month |
| OpenStreetMap | $0/month |
| **TOTAL** | **$0/month** 🎉 |

---

## Quick Commands

```bash
# Test backend health
curl https://your-app.cyclic.app/api/health

# Test AI chat
curl -X POST https://your-app.cyclic.app/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","history":[]}'

# Test hospital search (Delhi coordinates)
curl "https://your-app.cyclic.app/api/nearby-healthcare?lat=28.6139&lng=77.2090&radius=5000"

# Update frontend
./deploy-frontend.sh https://your-app.cyclic.app

# Deploy to Firebase
firebase deploy --only hosting
```

---

## Ready to Deploy?

1. Go to https://app.cyclic.sh
2. Sign in with GitHub
3. Deploy your repository
4. Add environment variables
5. Copy your URL
6. Run: `./deploy-frontend.sh <your-cyclic-url>`
7. Done! 🎉

**Need help? Check the Cyclic logs or browser console for errors.**
