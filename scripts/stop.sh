#!/bin/bash

# Stop all services

set -e

echo "🛑 Stopping Solana Flashloan Arbitrage services..."

if command -v pm2 &> /dev/null; then
    echo "Stopping PM2 services..."
    pm2 stop flashloan-backend flashloan-frontend || true
    pm2 delete flashloan-backend flashloan-frontend || true
    echo "✅ PM2 services stopped"
elif command -v forever &> /dev/null; then
    echo "Stopping Forever services..."
    forever stopall
    echo "✅ Forever services stopped"
else
    echo "⚠️  No process manager found. Please stop services manually."
fi

echo "✅ All services stopped"
