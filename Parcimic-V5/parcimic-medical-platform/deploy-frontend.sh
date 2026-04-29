#!/bin/bash

# Parcimic Frontend Deployment Script
# Run this after deploying backend to update frontend with backend URL

echo "🚀 Parcimic Frontend Deployment"
echo "================================"
echo ""

# Check if backend URL is provided
if [ -z "$1" ]; then
  echo "❌ Error: Backend URL required"
  echo ""
  echo "Usage: ./deploy-frontend.sh <backend-url>"
  echo "Example: ./deploy-frontend.sh https://parcimic-api.onrender.com"
  echo ""
  exit 1
fi

BACKEND_URL=$1

echo "📝 Backend URL: $BACKEND_URL"
echo ""

# Update client .env
echo "1️⃣  Updating client/.env..."
echo "REACT_APP_API_URL=$BACKEND_URL" > client/.env
echo "✅ Updated"
echo ""

# Build frontend
echo "2️⃣  Building frontend..."
cd client
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi
cd ..
echo "✅ Build complete"
echo ""

# Deploy to Firebase
echo "3️⃣  Deploying to Firebase Hosting..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
  echo "❌ Deployment failed"
  exit 1
fi
echo "✅ Deployed"
echo ""

echo "🎉 Deployment complete!"
echo ""
echo "Test your app:"
echo "  Frontend: https://parcimic.web.app"
echo "  Backend:  $BACKEND_URL/api/health"
echo ""
