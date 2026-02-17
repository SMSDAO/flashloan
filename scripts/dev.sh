#!/bin/bash

# Development startup script

set -e

echo "🔧 Starting Solana Flashloan Arbitrage in development mode..."
echo ""

# Check Node version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 24 ]; then
    echo "❌ Error: Node.js 24+ is required. Current version: $(node --version)"
    exit 1
fi

# Check environment file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example"
    cp .env.example .env
    echo "✅ .env file created. You may want to customize it."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run setup
fi

echo ""
echo "🚀 Starting development servers..."
echo "   Backend: http://localhost:4000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start both services in parallel
npm run dev
