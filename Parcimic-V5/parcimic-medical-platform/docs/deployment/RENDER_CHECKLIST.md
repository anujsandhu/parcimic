# ✅ Render Deployment Checklist

## Before You Start
- [ ] GitHub account
- [ ] Credit card (won't be charged on free tier)
- [ ] 10 minutes of time

---

## Deployment Steps

### 1. Sign Up for Render
- [ ] Go to https://render.com
- [ ] Click "Sign up with GitHub"
- [ ] Authorize Render

### 2. Create Web Service
- [ ] Click "New +" → "Web Service"
- [ ] Click "Build and deploy from a Git repository"
- [ ] Connect your `parcimic-medical-platform` repository

### 3. Configure Service
- [ ] Name: `parcimic-api`
- [ ] Region: Choose closest to you
- [ ] Branch: `main`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node server.js`
- [ ] Plan: **Free**

### 4. Add Environment Variables
Copy these exactly:

- [ ] `NODE_ENV` = `production`
- [ ] `GROQ_API_KEY` = `YOUR_GROQ_API_KEY_HERE`
- [ ] `OPENROUTER_API_KEY` = `YOUR_OPENROUTER_API_KEY_HERE`
- [ ] `GEMINI_API_KEY` = `YOUR_GEMINI_API_KEY_HERE`
- [ ] `HF_API_KEY` = `YOUR_HUGGINGFACE_API_KEY_HERE`

### 5. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait 2-3 minutes for deployment
- [ ] Check for "Live" status (green)

### 6. Test Backend
- [ ] Copy your URL: `https://parcimic-api.onrender.com`
- [ ] Open: `https://parcimic-api.onrender.com/api/health`
- [ ] Should see: `{"status":"ok",...}`

### 7. Update Frontend
Run this command (replace with your actual URL):
```bash
./deploy-frontend.sh https://parcimic-api.onrender.com
```

Or manually:
- [ ] `echo "REACT_APP_API_URL=https://parcimic-api.onrender.com" > client/.env`
- [ ] `cd client && npm run build && cd ..`
- [ ] `firebase deploy --only hosting`

### 8. Test Everything
- [ ] Visit: https://parcimic.web.app
- [ ] Test AI Assistant → Type "hello"
- [ ] Test Emergency Map → Should load hospitals
- [ ] Test Health Check → Complete a check

---

## ✅ Done!

Your app is now fully deployed and working!

**URLs:**
- Frontend: https://parcimic.web.app
- Backend: https://parcimic-api.onrender.com
- Backend Health: https://parcimic-api.onrender.com/api/health

---

## Troubleshooting

### Deployment failed?
- [ ] Check Render logs in dashboard
- [ ] Verify `package.json` exists in root
- [ ] Check build command is `npm install`
- [ ] Check start command is `node server.js`

### Backend not responding?
- [ ] Check service status is "Live" (green)
- [ ] Test health endpoint
- [ ] Check environment variables are set
- [ ] Wait 30 seconds (free tier wakes from sleep)

### AI not working?
- [ ] Check browser console (F12)
- [ ] Verify `REACT_APP_API_URL` in `client/.env`
- [ ] Rebuild frontend: `cd client && npm run build`
- [ ] Redeploy: `firebase deploy --only hosting`

### Emergency Map not loading?
- [ ] Test: `https://parcimic-api.onrender.com/api/nearby-healthcare?lat=28.6139&lng=77.2090&radius=5000`
- [ ] Check browser console for CORS errors
- [ ] Verify backend URL is correct

---

## Need More Help?

Read **DEPLOY_RENDER_COMPLETE.md** for detailed instructions and troubleshooting.
