# Parcimic - Quick Reference Guide

## 🚀 Live URLs
- **App**: https://parcimic.web.app
- **API**: https://parcimic-api.onrender.com

---

## ✅ What's New

### 1. Gmail-Only Login
- Users can only sign in with Google/Gmail
- No email/password option
- All data tied to Gmail account

### 2. Mobile Fixes
- ✅ Profile dropdown works on mobile
- ✅ Emergency map doesn't overlap bottom nav
- ✅ All touch targets are 44px minimum

### 3. Logo & Branding
- Logo appears in navigation (mobile & desktop)
- Logo on sign-in page
- Logo in loading screen
- Professional appearance

### 4. Loading Screen
- Shows on app start
- Displays during page transitions
- Smooth animations

### 5. PWA (Progressive Web App)
- **Installable on all devices**:
  - Mac, Windows, Android, iOS
- **How to install**:
  - Desktop: Click install icon in address bar
  - Android: Menu → "Add to Home Screen"
  - iOS: Share → "Add to Home Screen"

### 6. Performance
- 46% smaller initial bundle (164 KB vs 304 KB)
- Lazy loading for faster startup
- Service worker for offline caching
- Better mobile performance

---

## 📱 How to Install as App

### iPhone/iPad
1. Open https://parcimic.web.app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen

### Android
1. Open https://parcimic.web.app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install app"
4. Tap "Install"
5. App icon appears on home screen

### Mac
1. Open https://parcimic.web.app in Chrome or Edge
2. Look for install icon (⊕) in address bar
3. Click it and select "Install"
4. App opens in its own window

### Windows
1. Open https://parcimic.web.app in Chrome or Edge
2. Look for install icon (⊕) in address bar
3. Click it and select "Install"
4. App opens in its own window

---

## 🔐 User Data

### What's Saved
- Health check results
- Risk scores
- Medication reminders
- Timeline history
- Profile stats

### How It Works
- Sign in with Gmail on any device
- All data automatically syncs
- Access from phone, tablet, or computer
- Data persists forever (unless deleted)

---

## 🛠️ Development Commands

### Build Frontend
```bash
cd client
npm run build
```

### Deploy to Firebase
```bash
firebase deploy --only hosting
```

### Test Backend
```bash
curl https://parcimic-api.onrender.com/api/health
```

### Run Locally
```bash
# Frontend
cd client
npm start

# Backend
cd backend
npm start
```

---

## 📊 Performance

### Bundle Sizes
- Main: 164.4 kB (optimized)
- Charts: 101.98 kB
- CSS: 8.17 kB

### Features
- Lazy loading ✅
- Code splitting ✅
- Service worker ✅
- Image optimization ✅
- Touch optimization ✅

---

## 🎯 Key Features

1. **Health Checks**: Multi-step form with AI risk assessment
2. **AI Assistant**: Chat with health AI
3. **Emergency Map**: Find nearby hospitals/clinics
4. **Medications**: Set reminders
5. **Timeline**: Track health over time
6. **History**: View past checks

---

## 🔧 Troubleshooting

### App not loading?
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check internet connection

### Can't sign in?
- Make sure you're using a Google/Gmail account
- Check if pop-ups are blocked
- Try incognito/private mode

### PWA not installing?
- Make sure you're using a supported browser
- iOS: Must use Safari
- Android: Use Chrome or Samsung Internet
- Desktop: Use Chrome or Edge

### Data not syncing?
- Make sure you're signed in with the same Gmail
- Check internet connection
- Wait a few seconds for sync

---

## 📞 Support

### Check Status
- Frontend: https://parcimic.web.app
- Backend: https://parcimic-api.onrender.com/api/health

### Logs
- Firebase Console: https://console.firebase.google.com/project/parcimic
- Render Dashboard: https://dashboard.render.com

---

## ✨ Tips

1. **Install as PWA** for best experience
2. **Sign in with Gmail** to save your data
3. **Use on mobile** - fully optimized
4. **Works offline** - cached pages load instantly
5. **Cross-device** - access from anywhere

---

## 🎉 All Done!

Your app is now:
- ✅ Live and deployed
- ✅ Fast and optimized
- ✅ Installable on all devices
- ✅ Mobile-friendly
- ✅ Secure (Gmail-only)
- ✅ Professional (logo, loading screen)
- ✅ Cross-device (data syncs)

Enjoy your new health assistant! 🏥💙
