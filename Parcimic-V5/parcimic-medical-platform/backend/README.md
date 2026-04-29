# Parcimic Backend API

Production-ready Node.js backend for the Parcimic Medical Platform.

## 🚀 Deploy to Render

### Quick Deploy (5 minutes)

1. **Sign up at Render**: https://render.com
2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
3. **Configure Service**:
   - **Name**: `parcimic-api`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ **IMPORTANT**
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free
4. **Add Environment Variables**:
   ```
   NODE_ENV=production
   GROQ_API_KEY=your_groq_key_here
   OPENROUTER_API_KEY=your_openrouter_key_here
   GEMINI_API_KEY=your_gemini_key_here
   ```
5. **Deploy**: Click "Create Web Service"
6. **Copy URL**: `https://parcimic-api.onrender.com`

## 📋 Local Development

### Prerequisites
- Node.js 18.x
- npm

### Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your API keys to .env
# Edit .env and add your keys

# Start server
npm start
```

Server runs on: http://localhost:5000

### Test Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Root info
curl http://localhost:5000/
```

## 🔑 API Keys

Get your free API keys:

- **Groq**: https://console.groq.com (14,400 req/day)
- **OpenRouter**: https://openrouter.ai (200 req/day)
- **Gemini**: https://makersuite.google.com/app/apikey (1,500 req/day)

## 📡 API Endpoints

### GET /
Returns API status and available endpoints

### GET /api/health
Health check endpoint

### POST /api/llm/chat
AI chatbot endpoint
```json
{
  "message": "Hello",
  "history": []
}
```

### POST /api/predict-sepsis
Health risk prediction
```json
{
  "vitals": {
    "heartRate": 85,
    "temp": 37.2,
    "respRate": 16,
    "sysBP": 120,
    "o2Sat": 98
  },
  "symptoms": {},
  "labs": {},
  "history": { "age": 45 }
}
```

### GET /api/nearby-healthcare
Find nearby hospitals
```
?lat=28.6139&lng=77.2090&radius=5000
```

### POST /api/health-score
Convert risk score to health score
```json
{
  "score": 45
}
```

## 🏗️ Project Structure

```
backend/
├── server.js          # Main application
├── package.json       # Dependencies
├── .env.example       # Environment template
├── .nvmrc            # Node version
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Auto-set by Render (default: 5000) |
| `GROQ_API_KEY` | Yes | Groq API key |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |

## 🐛 Troubleshooting

### Render Build Fails
- ✅ Ensure **Root Directory** is set to `backend`
- ✅ Check all environment variables are set
- ✅ Verify Node version is 18.x

### API Not Responding
- ✅ Check Render logs in dashboard
- ✅ Verify environment variables are set correctly
- ✅ Free tier sleeps after 15 min inactivity (first request takes ~30s)

### AI Not Working
- ✅ Verify API keys are valid
- ✅ Check `/api/health` endpoint shows available providers
- ✅ Review Render logs for API errors

## 📊 Free Tier Limits

- **Render**: 750 hours/month (enough for 1 service)
- **Groq**: 14,400 requests/day
- **OpenRouter**: 200 requests/day
- **Gemini**: 1,500 requests/day

## 🔒 Security

- All API keys stored in environment variables
- CORS configured for production domains
- Helmet.js for security headers
- No sensitive data in logs

## 📝 License

ISC
