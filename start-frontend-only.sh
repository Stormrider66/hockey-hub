#!/bin/bash

echo "🏒 Starting Hockey Hub Frontend (Mock Mode)"
echo "=========================================="

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install --no-frozen-lockfile
fi

# Navigate to frontend directory
cd apps/frontend

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    pnpm install
fi

# Start the frontend
echo "🚀 Starting frontend on http://localhost:3010"
echo "📌 Running in mock mode - no backend services required"
pnpm run dev