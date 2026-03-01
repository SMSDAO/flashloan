#!/bin/bash

# Solana Flashloan Arbitrage - Production Deployment Script
# This script handles deployment without Docker

set -e

echo "🚀 Solana Flashloan Arbitrage - Production Deployment"
echo "=================================================="

# Check Node version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 24 ]; then
    echo "❌ Error: Node.js 24+ is required. Current version: $(node --version)"
    exit 1
fi
echo "✅ Node.js version check passed: $(node --version)"

# Check environment file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Copying from .env.example"
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration before proceeding!"
    exit 1
fi
echo "✅ Environment file found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
echo "✅ Dependencies installed"

# Build Solana program (if Cargo is available)
if command -v cargo &> /dev/null; then
    echo "🔨 Building Solana program..."
    if cargo build-bpf --manifest-path=programs/flashloan-arbitrage/Cargo.toml; then
        echo "✅ Solana program built successfully"
    else
        echo "⚠️  Solana BPF build failed. Check logs for details."
        echo "   This is optional for backend deployment."
    fi
else
    echo "⚠️  Rust/Cargo not found. Skipping program build."
fi

# Build frontend
echo "🏗️  Building frontend..."
cd frontend
npm run build
cd ..
echo "✅ Frontend built"

# Create logs directory
mkdir -p logs

# Check for process manager
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 detected"
    PROCESS_MANAGER="pm2"
elif command -v forever &> /dev/null; then
    echo "✅ Forever detected"
    PROCESS_MANAGER="forever"
else
    echo "⚠️  No process manager detected (pm2 or forever)"
    echo "   Installing pm2..."
    npm install -g pm2
    PROCESS_MANAGER="pm2"
fi

# Start services with process manager
echo "🚀 Starting services..."

if [ "$PROCESS_MANAGER" = "pm2" ]; then
    # Start backend
    pm2 start backend/index.js --name flashloan-backend --log logs/backend.log
    
    # Start frontend
    cd frontend
    pm2 start "npm start" --name flashloan-frontend --log ../logs/frontend.log
    cd ..
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    echo "✅ Services started with PM2"
    pm2 list
else
    # Start with forever
    forever start -l logs/backend.log -a backend/index.js
    cd frontend && forever start -l ../logs/frontend.log -a -c "npm start" ./ && cd ..
    
    echo "✅ Services started with Forever"
    forever list
fi

echo ""
echo "=================================================="
echo "🎉 Deployment Complete!"
echo "=================================================="
echo ""
echo "📊 Backend: http://localhost:4000"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "📝 Logs: ./logs/"
echo ""
echo "⚙️  Manage services:"
if [ "$PROCESS_MANAGER" = "pm2" ]; then
    echo "   pm2 list              - List all services"
    echo "   pm2 logs              - View logs"
    echo "   pm2 stop all          - Stop all services"
    echo "   pm2 restart all       - Restart all services"
    echo "   pm2 delete all        - Remove all services"
else
    echo "   forever list          - List all services"
    echo "   forever logs          - View logs"
    echo "   forever stopall       - Stop all services"
    echo "   forever restartall    - Restart all services"
fi
echo ""
echo "⚠️  Important: Update .env with production RPC endpoints before mainnet deployment!"
echo ""
