#!/bin/bash

echo "▲ Vercel Deployment"
echo "==================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔐 Logging in to Vercel..."
vercel login

echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🔑 Setting environment variables..."
echo "You'll be prompted to enter each API key:"
echo ""

vercel env add GROQ_API_KEY production
vercel env add OPENROUTER_API_KEY production
vercel env add GEMINI_API_KEY production
vercel env add NODE_ENV production

echo ""
echo "🔄 Redeploying with environment variables..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your backend URL will be shown above (e.g., https://parcimic-api.vercel.app)"
echo ""
echo "Next step:"
echo "  ./deploy-frontend.sh https://your-vercel-url.vercel.app"
