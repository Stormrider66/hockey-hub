#!/bin/bash

echo "🏒 Hockey Hub Frontend Startup Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/frontend" ]; then
    echo "❌ Error: Please run this script from the Hockey Hub root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
echo "Note: If you see permission errors, you may need to:"
echo "1. Run as administrator on Windows"
echo "2. Or manually run: pnpm install"
echo ""

# Try to install dependencies
pnpm install || echo "⚠️  Warning: pnpm install failed. You may need to run it manually."

echo ""
echo "🚀 Starting the frontend development server..."
echo "The frontend will start on http://localhost:3002"
echo ""

cd apps/frontend
pnpm dev