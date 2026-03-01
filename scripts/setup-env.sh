#!/bin/bash

# Auto-setup script for Solana Flashloan Arbitrage
# This script automatically configures .env with sensible defaults

set -e

echo "🚀 Solana Flashloan Arbitrage - Auto Setup"
echo "=========================================="

# Check if .env already exists
if [ -f ".env" ]; then
    read -p "⚠️  .env file already exists. Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ Keeping existing .env file"
        exit 0
    fi
fi

# Copy from example
echo "📝 Creating .env from .env.example..."
cp .env.example .env

# Generate secure random key for encryption
if command -v openssl &> /dev/null; then
    RANDOM_KEY=$(openssl rand -hex 32)
    echo "🔐 Generated secure encryption key"
    
    # Replace the default key on macOS or Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/auto-generated-dev-key-replace-in-production-with-secure-random-string/$RANDOM_KEY/" .env
    else
        sed -i "s/auto-generated-dev-key-replace-in-production-with-secure-random-string/$RANDOM_KEY/" .env
    fi
else
    echo "⚠️  OpenSSL not found. Using default encryption key (change in production!)"
fi

# Set backend URL from environment if available
if [ ! -z "$VERCEL_URL" ]; then
    echo "🌐 Detected Vercel deployment, configuring URLs..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|http://localhost:4000|https://$VERCEL_URL|" .env
    else
        sed -i "s|http://localhost:4000|https://$VERCEL_URL|" .env
    fi
fi

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env and add your RPC endpoints (Helius, QuickNode, etc.)"
echo "   2. Update NEXT_PUBLIC_BACKEND_URL with your backend URL"
echo "   3. Review security settings (KEY_ENCRYPTION_KEY, ALLOWED_ORIGINS)"
echo "   4. Run: npm run setup (to install dependencies)"
echo "   5. Run: npm run dev (to start development)"
echo ""
echo "🔗 For deployment, see DEPLOYMENT.md"
echo ""
