#!/bin/bash

echo "🪰 Fly.io Deployment"
echo "===================="
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "📦 Installing Fly CLI..."
    curl -L https://fly.io/install.sh | sh
    echo ""
    echo "⚠️  Please restart your terminal and run this script again"
    exit 0
fi

echo "🔐 Logging in to Fly.io..."
flyctl auth login

echo ""
echo "🚀 Launching app..."
flyctl launch --name parcimic-api --region sjc --no-deploy

echo ""
echo "🔑 Setting environment variables..."
flyctl secrets set NODE_ENV=production
flyctl secrets set GROQ_API_KEY=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
flyctl secrets set OPENROUTER_API_KEY=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
flyctl secrets set GEMINI_API_KEY=AIzaSyC7zwRWScFvl9ZvhF2AsO7VFliNc2Sr3ok

echo ""
echo "🚀 Deploying..."
flyctl deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your backend URL: https://parcimic-api.fly.dev"
echo ""
echo "Next step:"
echo "  ./deploy-frontend.sh https://parcimic-api.fly.dev"
