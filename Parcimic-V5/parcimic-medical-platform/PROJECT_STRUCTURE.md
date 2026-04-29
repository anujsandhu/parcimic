# 📁 Parcimic Project Structure

## ✅ Final Structure (Production-Ready)

```
parcimic-medical-platform/
│
├── backend/                          ← DEPLOY THIS TO RENDER
│   ├── server.js                    ← Main API server
│   ├── package.json                 ← Backend dependencies only
│   ├── .nvmrc                       ← Node version (18)
│   ├── .env.example                 ← Environment template
│   ├── .gitignore                   ← Backend git ignore
│   └── README.md                    ← Backend documentation
│
├── client/                           ← Frontend (already on Firebase)
│   ├── src/                         ← React source code
│   ├── public/                      ← Static assets
│   ├── package.json                 ← Frontend dependencies
│   ├── .env.production              ← Production config
│   └── build/                       ← Built files (deployed)
│
├── .gitignore                        ← Root git ignore
├── firebase.json                     ← Firebase config
├── firestore.rules                   ← Firestore security
├── firestore.indexes.json            ← Firestore indexes
├── RENDER_DEPLOYMENT.md              ← Render deployment guide
└── PROJECT_STRUCTURE.md              ← This file
```

---

## 🎯 What Changed

### Before (Broken)
```
❌ parcimic-medical-platform/
   ├── server.js              ← Mixed with frontend
   ├── package.json           ← Mixed dependencies
   ├── client/
   └── ...
```

**Problem**: Render couldn't find `package.json` because it was in root with frontend files.

### After (Fixed)
```
✅ parcimic-medical-platform/
   ├── backend/               ← Isolated backend
   │   ├── server.js
   │   └── package.json       ← Backend only
   ├── client/                ← Isolated frontend
   └── ...
```

**Solution**: Backend is now in its own directory with its own `package.json`.

---

## 🚀 Deployment Strategy

### Backend → Render
- **Directory**: `backend/`
- **Root Directory Setting**: `backend` ⚠️ **CRITICAL**
- **Build**: `npm install`
- **Start**: `node server.js`
- **URL**: `https://parcimic-api.onrender.com`

### Frontend → Firebase Hosting
- **Directory**: `client/`
- **Build**: `npm run build`
- **Deploy**: `firebase deploy --only hosting`
- **URL**: `https://parcimic.web.app`

### Database → Firestore
- **Config**: `firestore.rules`, `firestore.indexes.json`
- **Deploy**: `firebase deploy --only firestore`

---

## 📦 Dependencies

### Backend (`backend/package.json`)
```json
{
  "dependencies": {
    "axios": "^1.6.7",        // HTTP client
    "cors": "^2.8.5",         // CORS middleware
    "dotenv": "^16.4.5",      // Environment variables
    "express": "^4.18.3",     // Web framework
    "helmet": "^7.1.0"        // Security headers
  }
}
```

**Total**: 5 dependencies (minimal, production-ready)

### Frontend (`client/package.json`)
- React, React Router, Tailwind CSS, Firebase SDK, etc.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```bash
NODE_ENV=production
GROQ_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### Frontend (`client/.env.production`)
```bash
REACT_APP_API_URL=https://parcimic-api.onrender.com
```

---

## 🔒 Security

### Git Ignore
- ✅ `backend/.env` ignored
- ✅ `client/.env.local` ignored
- ✅ `node_modules/` ignored
- ✅ API keys never committed

### CORS
- ✅ Production: Only `parcimic.web.app` allowed
- ✅ Development: All origins allowed

### Headers
- ✅ Helmet.js security headers
- ✅ Content Security Policy configured

---

## 🧪 Testing

### Test Backend Locally
```bash
cd backend
npm install
cp .env.example .env
# Add your API keys to .env
npm start
# Visit http://localhost:5000
```

### Test Frontend Locally
```bash
cd client
npm install
npm start
# Visit http://localhost:3000
```

### Test Production
```bash
# Backend
curl https://parcimic-api.onrender.com/api/health

# Frontend
open https://parcimic.web.app
```

---

## 📊 File Sizes

| File | Size | Purpose |
|------|------|---------|
| `backend/server.js` | ~12 KB | Main API logic |
| `backend/package.json` | ~400 B | Dependencies |
| `backend/.nvmrc` | ~3 B | Node version |
| `backend/.env.example` | ~300 B | Env template |

**Total Backend**: ~13 KB (excluding node_modules)

---

## 🎯 Render Configuration

### Service Settings
```yaml
Name: parcimic-api
Region: Oregon (US West)
Branch: main
Root Directory: backend          ← CRITICAL
Runtime: Node
Build Command: npm install
Start Command: node server.js
Instance Type: Free
```

### Environment Variables (in Render Dashboard)
```
NODE_ENV=production
GROQ_API_KEY=***
OPENROUTER_API_KEY=***
GEMINI_API_KEY=***
```

---

## ✅ Deployment Checklist

### Backend Setup
- [x] Created `backend/` directory
- [x] Moved `server.js` to `backend/`
- [x] Created clean `backend/package.json`
- [x] Added `backend/.nvmrc` (Node 18)
- [x] Created `backend/.env.example`
- [x] Added `backend/.gitignore`
- [x] Created `backend/README.md`

### Render Deployment
- [ ] Sign up at render.com
- [ ] Create new web service
- [ ] Set Root Directory to `backend`
- [ ] Add environment variables
- [ ] Deploy and verify

### Frontend Update
- [ ] Update `client/.env.production`
- [ ] Rebuild frontend
- [ ] Redeploy to Firebase

---

## 🆘 Common Issues

### ❌ "Could not read package.json"
**Cause**: Root Directory not set to `backend`
**Fix**: Set Root Directory to `backend` in Render settings

### ❌ "Module not found"
**Cause**: Dependencies not installed
**Fix**: Verify Build Command is `npm install`

### ❌ "Port already in use"
**Cause**: Another process using port 5000
**Fix**: Kill process or use different port

### ❌ "CORS error"
**Cause**: Frontend using wrong backend URL
**Fix**: Update `REACT_APP_API_URL` in `client/.env.production`

---

## 📝 Next Steps

1. ✅ Structure is fixed
2. ⏳ Deploy backend to Render
3. ⏳ Update frontend with backend URL
4. ⏳ Test all features
5. ⏳ Monitor logs

---

## 🎉 Success Criteria

- ✅ Backend deploys without errors
- ✅ `/api/health` returns 200 OK
- ✅ AI chat works
- ✅ Hospital search works
- ✅ Frontend connects to backend
- ✅ No CORS errors
- ✅ All features working

---

## 📚 Documentation

- **Backend**: `backend/README.md`
- **Deployment**: `RENDER_DEPLOYMENT.md`
- **Structure**: This file
- **Render Docs**: https://render.com/docs/web-services

---

**Ready to deploy!** 🚀

Follow `RENDER_DEPLOYMENT.md` for step-by-step instructions.
