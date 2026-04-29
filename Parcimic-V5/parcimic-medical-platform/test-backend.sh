#!/bin/bash

# Backend API Test Script
# Usage: ./test-backend.sh <backend-url>

if [ -z "$1" ]; then
  echo "❌ Error: Backend URL required"
  echo "Usage: ./test-backend.sh <backend-url>"
  echo "Example: ./test-backend.sh https://parcimic-api.onrender.com"
  exit 1
fi

BACKEND_URL=$1

echo "🧪 Testing Parcimic Backend API"
echo "================================"
echo "Backend: $BACKEND_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing /api/health..."
HEALTH=$(curl -s "$BACKEND_URL/api/health")
if echo "$HEALTH" | grep -q "ok"; then
  echo "✅ Health check passed"
  echo "   Response: $HEALTH"
else
  echo "❌ Health check failed"
  echo "   Response: $HEALTH"
fi
echo ""

# Test 2: AI Chat
echo "2️⃣  Testing /api/llm/chat..."
CHAT=$(curl -s -X POST "$BACKEND_URL/api/llm/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","history":[]}')
if echo "$CHAT" | grep -q "reply"; then
  echo "✅ AI chat working"
  echo "   Response: $CHAT"
else
  echo "❌ AI chat failed"
  echo "   Response: $CHAT"
fi
echo ""

# Test 3: Nearby Healthcare
echo "3️⃣  Testing /api/nearby-healthcare..."
HOSPITALS=$(curl -s "$BACKEND_URL/api/nearby-healthcare?lat=37.7749&lng=-122.4194&radius=5000")
if echo "$HOSPITALS" | grep -q "results"; then
  echo "✅ Hospital search working"
  TOTAL=$(echo "$HOSPITALS" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
  echo "   Found $TOTAL facilities"
else
  echo "❌ Hospital search failed"
  echo "   Response: $HOSPITALS"
fi
echo ""

# Test 4: Health Score
echo "4️⃣  Testing /api/health-score..."
SCORE=$(curl -s -X POST "$BACKEND_URL/api/health-score" \
  -H "Content-Type: application/json" \
  -d '{"score":25}')
if echo "$SCORE" | grep -q "healthScore"; then
  echo "✅ Health score calculation working"
  echo "   Response: $SCORE"
else
  echo "❌ Health score failed"
  echo "   Response: $SCORE"
fi
echo ""

echo "🎉 Backend testing complete!"
echo ""
echo "Next steps:"
echo "1. If all tests passed, update frontend:"
echo "   ./deploy-frontend.sh $BACKEND_URL"
echo ""
echo "2. Visit https://parcimic.web.app and test:"
echo "   - AI Assistant"
echo "   - Emergency Map"
echo "   - Health Check"
