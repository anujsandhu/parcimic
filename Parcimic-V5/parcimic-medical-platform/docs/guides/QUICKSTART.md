# 🚀 Quick Start Guide — Parcimic V5 Enhanced

## Installation & Setup

### 1. **Install Dependencies** (Already done)
```bash
npm install                # Root dependencies
cd client && npm install   # React dependencies
```

### 2. **Start Development**
```bash
npm run dev
```
This will start:
- **Frontend**: http://localhost:3000 (React dev server)
- **Backend**: http://localhost:5000 (Express server)

### 3. **Build for Production**
```bash
npm run build
npm start
```

---

## 🧪 Testing New Features

### Test the Dashboard
1. Open http://localhost:3000
2. Sign in with Google
3. You should see:
   - ✅ Offline indicator (top)
   - ✅ Health score card (if you have a previous check)
   - ✅ Daily symptom check-in card
   - ✅ AI recommendation card
   - ✅ Quick actions
   - ✅ Emergency section at bottom

### Test Symptom Check-In
1. Click "Start Check-In" button on dashboard
2. Toggle fever checkbox
3. Adjust fatigue, cough, breathing sliders
4. Add optional notes
5. Click "Save Check-In"
6. Should see success toast: "✅ Symptom check-in saved!"

### Test Health Timeline
1. Click "Timeline" in main navigation
2. Should see unified timeline of all events
3. Try clicking "Export" button

### Test Offline Mode
1. Open DevTools (F12) → Network tab
2. Set throttling to "Offline"
3. Refresh page
4. Should see "📡 You're offline" banner
5. Past data should still be visible

### Test Emergency Alert
1. Go to Health Check (http://localhost:3000/check)
2. Enter vitals that would give high risk (e.g., HR 120, Temp 39, RR 25, O2 92)
3. Submit check
4. Should auto-show emergency modal with nearby hospitals

---

## 📊 Sample Test Data

### High Risk Check
```
Heart Rate: 120 bpm
Temperature: 39.5°C
Respiration: 25 /min
Blood Pressure: 100 mmHg
O2 Saturation: 89%
Symptoms: Fever ✓, Shortness of breath ✓
```
Expected: Score > 64, Emergency card shows

### Moderate Risk Check
```
Heart Rate: 95 bpm
Temperature: 38°C
Respiration: 20 /min
Blood Pressure: 115 mmHg
O2 Saturation: 95%
Symptoms: Fever ✓
```
Expected: Score 35-64, Yellow alert

### Low Risk Check
```
Heart Rate: 75 bpm
Temperature: 37°C
Respiration: 16 /min
Blood Pressure: 120 mmHg
O2 Saturation: 98%
Symptoms: None
```
Expected: Score < 35, Green status

---

## 🔧 Configuration Files

### `.env` (Root)
```
NODE_ENV=development
PORT=5000
GEMINI_API_KEY=your_key_here
```

### `.env` (Client - if needed)
```
REACT_APP_API_URL=http://localhost:5000
```

---

## 📚 Key Files to Review

### Frontend
- `client/src/pages/Home.jsx` — Dashboard (redesigned)
- `client/src/pages/Timeline.jsx` — Timeline page
- `client/src/components/SymptomsCheckIn.jsx` — Symptom form
- `client/src/hooks/useAlerts.js` — Alert monitoring
- `client/src/utils/alertsService.js` — Alert rules

### Backend
- `server.js` — API endpoints (search for `/api/symptoms` or `/api/alerts`)

### Utilities
- `client/src/utils/offlineService.js` — Offline caching
- `client/src/utils/healthScoreService.js` — Score conversion

---

## 🐛 Troubleshooting

### "npm: command not found"
→ Install Node.js from https://nodejs.org

### "Module not found" errors
→ Run `npm install` in root directory

### React app not loading
→ Check if port 3000 is in use
```bash
lsof -i :3000  # Check what's using port 3000
kill -9 PID    # Kill if needed
```

### Backend not responding
→ Check if port 5000 is available
→ Run `npm run dev:server` to test just backend

### Build fails
→ Clear node_modules: `rm -rf node_modules && npm install`
→ Clear build cache: `cd client && rm -rf node_modules build && npm install`

---

## 📋 Checklist for First-Time Setup

- [ ] Clone/sync repository
- [ ] Run `npm install` at root
- [ ] Verify Firebase config in `client/src/utils/firebase.js`
- [ ] Set up `.env` file with API keys if needed
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000 in browser
- [ ] Sign in with Google
- [ ] Test symptom check-in
- [ ] Take a health check
- [ ] View timeline
- [ ] Check offline mode

---

## 💻 Development Workflow

### Making Changes
1. Edit files in `client/src/`
2. Save → React hot-reloads automatically
3. Check browser console for errors

### Adding New Component
1. Create file: `client/src/components/NewComponent.jsx`
2. Import in `App.jsx` or page file
3. Add to routes if needed
4. Test in browser

### Testing Backend Changes
1. Edit `server.js`
2. Backend will auto-restart (nodemon)
3. Test API with curl or Postman

### Building for Production
```bash
npm run build          # Creates optimized bundle
npm start             # Starts production server
```

---

## 🎯 Next Features to Add (Optional)

1. **Browser Notifications**
   - Use Notifications API for alerts
   - Ask for permission on first alert

2. **Email Reporting**
   - Generate HTML report
   - Send to doctor/family

3. **Data Export**
   - CSV format for spreadsheets
   - Historical data download

4. **Medication Reminders**
   - Time-based notifications
   - Browser notifications for missed doses

---

## 📞 Need Help?

1. **Check Logs**
   - Browser console (F12)
   - Terminal output
   - Network requests (DevTools → Network)

2. **Check Status**
   - http://localhost:5000/api/health → Should return `{ status: "ok" }`

3. **Review Code**
   - Check comments in relevant files
   - Look at component props for usage

4. **Test Manually**
   - Follow test scenarios above
   - Use sample data provided

---

## 🎉 You're All Set!

The application is ready for development and testing. 

**Start with**: `npm run dev`

Then navigate to **http://localhost:3000**

Enjoy exploring Parcimic's new daily health tracking features! 🚀

