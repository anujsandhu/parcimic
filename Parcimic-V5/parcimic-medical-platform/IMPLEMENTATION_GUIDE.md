# Parcimic V5 — Daily Health Assistant Implementation Guide

## 🎯 Project Overview

This document summarizes the transformation of Parcimic from a **one-time risk checker** into a **daily-use personal health assistant** with connected, context-aware features.

## ✨ What's New

### 1. **Health Score System** 🟢
- Converts clinical risk scores (0-100) into user-friendly health labels
- **Labels**: Good (✅) | Moderate (⚠️) | High Risk (🚨)
- **Friendly text guidance** for each status
- Color-coded visual indicators (green/yellow/red)
- **Files**: `utils/healthScoreService.js`, `components/HealthScoreCard.jsx`

### 2. **Daily Symptom Check-In** 🤒
- Quick daily symptom tracker on dashboard (1-2 clicks)
- **Tracks**: Fever, fatigue level (0-10), cough intensity, breathing difficulty, notes
- Shows last check-in timestamp
- Saves to Firestore `symptoms` collection
- **Files**: `components/SymptomsCheckIn.jsx`

### 3. **Unified Health Timeline** 📊
- Merged view of all health events (predictions + symptoms + medications)
- Vertical timeline with type-based icons and cards
- Shows progression over time
- **New Route**: `/timeline`
- **Files**: `components/HealthTimeline.jsx`, `pages/Timeline.jsx`

### 4. **Smart Alert System** 🚨
- **Risk Alerts**: Triggers when score > 64 (high) or 34-64 (moderate)
- **Symptom Alerts**: Fever + high HR, breathing difficulties, worsening symptoms
- **Medication Alerts**: Missed doses, upcoming times
- Color-coded severity (red/yellow/blue)
- Shows action buttons for each alert
- **Files**: `utils/alertsService.js`, `components/AlertsBanner.jsx`, `hooks/useAlerts.js`
- **Backend**: `server.js` endpoints `/api/alerts/evaluate`, `/api/health-score`

### 5. **Enhanced Medication Tracking** 💊
- Status tracking: Pending / Taken / Missed
- Daily schedule with times
- Missed medication alerts
- Browser notification API ready
- **Existing**: `pages/Medications.jsx` (enhanced)

### 6. **Emergency Auto-Trigger System** 🚑
- Auto-shows emergency modal when risk > 64
- Displays nearby hospitals/clinics
- Emergency buttons: 112, 108, 100
- Google Maps integration
- Offline emergency numbers cached
- **Files**: `components/EmergencyCard.jsx`

### 7. **AI Recommendation Refinement** 🤖
- Cleaner card display with icon and status
- 3-4 line explanations + action bullets
- Integrated into dashboard
- **Files**: `components/AIRecommendationCard.jsx`

### 8. **Offline Support** 📡
- LocalStorage caching for last health check, symptoms, medications
- Offline indicator banner
- Cache emergency numbers
- Last sync timestamp
- **Files**: `utils/offlineService.js`, `components/OfflineIndicator.jsx`, `hooks/useOfflineMode.js`

### 9. **PDF/Report Export** 📄
- Generate text-based health reports
- Copy to clipboard functionality
- Email-ready HTML format
- **Files**: `utils/pdfExport.js`
- **Button**: Added to Timeline page

### 10. **Redesigned Dashboard** 📱
- Key sections organized: Current Status, Health Score, AI Recommendation, Symptoms, Medications, Quick Actions, Emergency
- Connected logic: High risk → highlight emergency section
- Symptom worsening → suggest health check
- Offline indicator
- Active alerts banner
- **File**: `pages/Home.jsx` (redesigned)

## 📁 File Structure

### New Files Created
```
client/src/
├── utils/
│   ├── alertsService.js          # Alert rule engine
│   ├── healthScoreService.js     # Health score conversion
│   ├── offlineService.js         # Offline caching
│   └── pdfExport.js              # Report generation
├── hooks/
│   ├── useAlerts.js              # Alert monitoring hook
│   └── useOfflineMode.js         # Offline detection hook
├── components/
│   ├── OfflineIndicator.jsx      # Offline status banner
│   ├── HealthScoreCard.jsx       # Health score display
│   ├── AlertsBanner.jsx          # Alert notifications
│   ├── SymptomsCheckIn.jsx       # Daily symptom form
│   ├── AIRecommendationCard.jsx  # AI recommendation display
│   ├── EmergencyCard.jsx         # Emergency modal
│   └── HealthTimeline.jsx        # Unified timeline
└── pages/
    └── Timeline.jsx              # Full timeline page
```

### Modified Files
```
client/src/
├── pages/Home.jsx                # Dashboard redesign
├── App.jsx                       # Added timeline route
└── components/Layout.jsx         # Added timeline nav link

server.js                         # Added 3 new API endpoints
package.json                      # Added "dev" script
```

## 🔌 Backend API Endpoints

### New Endpoints

**POST** `/api/symptoms/checkin`
- Save daily symptom entry
- **Body**: `{ uid, fever, fatigue, cough, breathing, notes }`
- **Returns**: Entry object with timestamp

**POST** `/api/alerts/evaluate`
- Evaluate alert conditions
- **Body**: `{ uid, score, vitals, symptoms, medications, recentSymptoms }`
- **Returns**: `{ alerts: [...], count }`

**POST** `/api/health-score`
- Convert risk score to health score
- **Body**: `{ score }`
- **Returns**: `{ healthScore, label, color, friendlyText }`

## 🗄️ Firestore Collections

### Existing Collections (Enhanced)
- **predictions** — Risk check results (unchanged)
- **medications** — Drug tracking (now tracks status)

### New Collections
- **symptoms** — Daily check-in entries
  ```
  {
    uid,
    fever,          // boolean
    fatigue,        // 0-10
    cough,          // 0-10
    breathing,      // 0-10
    notes,          // string
    createdAt,      // timestamp
    date            // YYYY-MM-DD
  }
  ```

- **timeline** — Unified events (optional, used for advanced analytics)

- **alerts** — Active alerts (optional, for history)

## 🎯 Usage Examples

### Daily Workflow
1. **User opens app** → Sees Health Score, Active Alerts, Symptoms Check-In
2. **Quick check-in** → 1-click fever + slides for symptoms (30 seconds)
3. **Review AI recommendation** → "You're doing fine" or "Take action"
4. **Check medications** → See what's pending, mark as taken
5. **View Timeline** → See all historical data in one place

### High-Risk Scenario
1. User completes health check with score > 64
2. Emergency modal auto-opens
3. Shows nearby hospitals, emergency numbers
4. Alert banner appears with "Seek medical attention"
5. Dashboard highlights emergency section

### Offline Mode
1. App detects no internet connection
2. Shows offline indicator banner
3. Displays cached last check-in, medications, symptoms
4. Shows emergency numbers from cache
5. Can still view history locally

## 🚀 How to Run

### Development (Both Client & Server)
```bash
npm run dev
```
This runs both backend and frontend concurrently.

### Individual Servers
```bash
npm run dev:server    # Just backend on :5000
npm run dev:client    # Just frontend on :3000 (in client/)
```

### Production Build
```bash
npm run build         # Builds React app
npm start             # Runs production backend + static SPA
```

## 🔍 Testing Checklist

### Alert System
- [ ] High-risk alert triggers (score > 64)
- [ ] Moderate alert shows (score 35-64)
- [ ] Fever + high HR alert appears
- [ ] Breathing difficulty alert shows
- [ ] Missed medication alert appears

### Symptom Tracking
- [ ] Daily check-in form opens
- [ ] Can toggle fever checkbox
- [ ] Can adjust fatigue/cough/breathing sliders
- [ ] Can add notes
- [ ] Saves to Firestore
- [ ] Shows last entry on dashboard

### Offline Mode
- [ ] Turn off internet → offline banner appears
- [ ] Can still view cached health data
- [ ] Emergency numbers show offline
- [ ] Reconnect → data syncs

### Emergency Card
- [ ] High-risk (score > 64) auto-shows emergency modal
- [ ] Shows nearby hospitals
- [ ] 112 call button works
- [ ] Google Maps link works
- [ ] Can close modal

### Timeline
- [ ] Navigate to /timeline
- [ ] See all predictions, symptoms, medications mixed
- [ ] Events sorted by date (newest first)
- [ ] Risk gauge visible for predictions
- [ ] Can export/copy report

## ⚙️ Configuration

### Required Environment Variables
```
# Existing (unchanged)
FIREBASE_API_KEY
GOOGLE_API_KEY / GEMINI_API_KEY

# AI Providers (optional, for cascade)
GROQ_API_KEY
OPENROUTER_API_KEY
HF_API_KEY
```

### Optional
```
PYTHON_ML_URL=http://localhost:8000
USE_PYTHON_ML=false
```

## 🎨 UI/UX Principles Applied

1. **Simplicity** — No medical jargon, friendly labels
2. **Quick Actions** — Most tasks complete in 1-2 clicks
3. **Context-Aware** — Different views based on user status
4. **Visual Hierarchy** — Colors (green/yellow/red), icons, sizing
5. **Offline-First** — Always shows something useful
6. **Connected** — Data flows between pages, actions trigger related views

## 🔐 Security

- Firestore rules: UID-based access control (existing)
- Alert evaluation done server-side
- No PHI exposed in browser console
- Offline cache doesn't store sensitive data

## 📚 Future Enhancements

1. **Browser Notifications** — Real-time alerts
2. **Wearable Integration** — Smartwatch sync
3. **Doctor Portal** — Share reports with providers
4. **Predictive Trends** — ML-powered forecasting
5. **Goal Setting** — Track health improvements
6. **Social Features** — Share achievements

## 🆘 Troubleshooting

### Symptoms Not Saving
- Check Firestore collection `symptoms` exists
- Verify user is signed in
- Check browser console for errors

### Alerts Not Showing
- Ensure user uid is set
- Check `/api/alerts/evaluate` returns data
- Verify data matches alert trigger conditions

### Offline Mode Not Working
- Check localStorage quota
- Ensure offline service cached data first
- Test with DevTools Network > Offline

### Timeline Empty
- Run health check, symptom check-in, add medication
- Wait for Firestore to sync
- Refresh page

## 📞 Support

For issues or questions:
1. Check browser console (F12)
2. Check Firebase Firestore permissions
3. Verify API endpoints return expected data
4. Check network tab for failed requests

---

**Version**: 2.1.0 (Enhanced Daily Health Assistant)
**Last Updated**: April 28, 2026
**Status**: Ready for Testing ✅
