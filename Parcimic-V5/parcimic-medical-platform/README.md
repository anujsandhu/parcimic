# Parcimic Health Assistant

> AI-powered health monitoring and sepsis early warning system

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://parcimic.web.app)
[![Backend](https://img.shields.io/badge/backend-live-success)](https://parcimic-api.onrender.com)
[![PWA](https://img.shields.io/badge/PWA-enabled-blue)](https://parcimic.web.app)

## 🚀 Quick Start

### Live Application
- **Frontend**: https://parcimic.web.app
- **Backend API**: https://parcimic-api.onrender.com

### Install as PWA
- **iPhone/iPad**: Safari → Share → Add to Home Screen
- **Android**: Chrome → Menu → Install app
- **Desktop**: Chrome/Edge → Install icon in address bar

---

## 📋 Features

### Core Features
- ✅ **Health Risk Assessment** - Multi-step health check with AI-powered risk scoring
- ✅ **AI Assistant** - Chat with health AI for personalized guidance
- ✅ **Emergency Map** - Find nearby hospitals, clinics, and pharmacies
- ✅ **Medication Reminders** - Track daily medications
- ✅ **Health Timeline** - Visualize health trends over time
- ✅ **History Tracking** - View past health checks

### Technical Features
- ✅ **PWA Support** - Installable on all devices (Mac, Windows, Android, iOS)
- ✅ **Offline Mode** - Service worker caching for offline access
- ✅ **Gmail Authentication** - Secure Google sign-in only
- ✅ **Cross-Device Sync** - Access data from any device
- ✅ **Touch Optimized** - 48px minimum touch targets
- ✅ **Responsive Design** - Mobile-first, works on all screen sizes

---

## 🏗️ Project Structure

```
parcimic-medical-platform/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   │   ├── assets/        # Images, logos, icons
│   │   ├── manifest.json  # PWA manifest
│   │   └── service-worker.js  # Service worker
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utilities
│   │   ├── context/       # React context
│   │   ├── App.jsx        # Main app component
│   │   └── index.css      # Global styles
│   └── package.json
│
├── backend/               # Node.js backend
│   ├── server.js         # Express server
│   ├── package.json
│   └── .env.example      # Environment variables template
│
├── functions/            # Firebase Cloud Functions (optional)
├── ml_service/          # Python ML service (optional)
│
├── docs/                # Documentation
│   ├── deployment/      # Deployment guides
│   ├── architecture/    # Architecture docs
│   └── guides/          # User guides
│
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
├── render.yaml          # Render deployment config
└── .gitignore
```

---

## 🛠️ Tech Stack

### Frontend
- **React** 18.2 - UI framework
- **React Router** 6.22 - Routing
- **Tailwind CSS** 3.4 - Styling
- **Firebase** 10.8 - Authentication & Database
- **Recharts** 2.12 - Data visualization
- **Lucide React** - Icons
- **Framer Motion** - Animations

### Backend
- **Node.js** 18+ - Runtime
- **Express** 4.18 - Web framework
- **Axios** - HTTP client
- **CORS** - Cross-origin support

### AI Providers
- **Groq** - Primary AI (fast inference)
- **OpenRouter** - Fallback AI
- **Google Gemini** - Secondary fallback

### Infrastructure
- **Firebase Hosting** - Frontend hosting
- **Firestore** - Database
- **Render** - Backend hosting
- **OpenStreetMap** - Maps & location services

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Firebase account
- Render account (for backend)

### Frontend Setup

```bash
cd client
npm install
```

Create `client/.env.production`:
```env
REACT_APP_API_URL=https://parcimic-api.onrender.com
```

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5001
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key
```

---

## 🚀 Development

### Run Frontend
```bash
cd client
npm start
```
Opens at http://localhost:3000

### Run Backend
```bash
cd backend
npm start
```
Runs at http://localhost:5001

---

## 📤 Deployment

### Deploy Frontend (Firebase)
```bash
cd client
npm run build
firebase deploy --only hosting
```

### Deploy Backend (Render)
1. Push code to GitHub
2. Connect repository to Render
3. Set Root Directory: `backend`
4. Set Build Command: `npm install`
5. Set Start Command: `node server.js`
6. Add environment variables in Render dashboard

---

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5001
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://parcimic-api.onrender.com
```

---

## 📱 PWA Features

### Manifest Configuration
- **Name**: Parcimic Health Assistant
- **Short Name**: Parcimic
- **Theme Color**: #3B82F6 (Brand Blue)
- **Background Color**: #FFFFFF (White)
- **Display**: Standalone
- **Orientation**: Portrait

### Service Worker
- Caches static assets
- Offline page support
- Network-first strategy for API calls
- Cache-first strategy for static files

---

## 🎨 Design System

### Colors
- **Brand**: #3B82F6 (Blue)
- **Success**: #22C55E (Green)
- **Warning**: #F59E0B (Amber)
- **Danger**: #EF4444 (Red)

### Typography
- **Font**: Inter (Google Fonts)
- **Base Size**: 14px mobile, 15px desktop
- **Line Height**: 1.6

### Spacing
- **Grid**: 8px base unit
- **Border Radius**: 12px mobile, 16px desktop
- **Container**: 1280px max-width

### Touch Targets
- **Minimum**: 48px × 48px
- **Buttons**: 48px height minimum
- **Icons**: 44px touch area

---

## 📊 Performance

### Bundle Sizes
- **Main Bundle**: 164.4 kB (gzipped)
- **Charts Library**: 101.98 kB
- **CSS**: 8.17 kB

### Optimizations
- ✅ Lazy loading for routes
- ✅ Code splitting
- ✅ Service worker caching
- ✅ Image optimization
- ✅ Tree shaking

### Lighthouse Scores (Target)
- Performance: 85-95
- Accessibility: 95-100
- Best Practices: 95-100
- SEO: 90-100
- PWA: 100

---

## 🔒 Security

### Authentication
- Gmail-only authentication via Firebase
- Secure token-based sessions
- No password storage

### Data Protection
- Firestore security rules
- Environment variables for secrets
- HTTPS only
- CORS configuration

### API Security
- Rate limiting (backend)
- Input validation
- Error handling
- Secure headers

---

## 📚 Documentation

- **[Deployment Guide](docs/deployment/)** - How to deploy frontend and backend
- **[Architecture](docs/architecture/)** - System architecture and design
- **[User Guides](docs/guides/)** - Feature guides and tutorials
- **[Quick Reference](docs/guides/QUICK_REFERENCE.md)** - Quick start guide

---

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

## 🆘 Support

### Check Status
- Frontend: https://parcimic.web.app
- Backend: https://parcimic-api.onrender.com/api/health

### Logs & Monitoring
- Firebase Console: https://console.firebase.google.com/project/parcimic
- Render Dashboard: https://dashboard.render.com

---

## 🎉 Acknowledgments

- **OpenStreetMap** - Map data and location services
- **Firebase** - Authentication and database
- **Render** - Backend hosting
- **Groq** - Fast AI inference
- **Google Gemini** - AI capabilities

---

**Made with ❤️ for better health monitoring**
