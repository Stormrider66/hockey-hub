#!/bin/bash

# Hockey Hub Frontend Development Startup Script
# This script helps fix common startup issues and launches the frontend

echo "🏒 Hockey Hub Frontend Development Startup"
echo "========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "⚠️  node_modules not found. Running pnpm install..."
  pnpm install
else
  echo "✅ node_modules found"
fi

# Clear Next.js cache
echo ""
echo "🧹 Clearing Next.js cache..."
rm -rf .next/cache

# Clear localStorage data that might be corrupted
echo ""
echo "💾 Note: If you encounter Redux persist errors, clear your browser's localStorage:"
echo "   1. Open DevTools (F12)"
echo "   2. Go to Application tab"
echo "   3. Click on localStorage"
echo "   4. Right-click and Clear"
echo ""

# Check environment configuration
if [ -f ".env.local" ]; then
  echo "✅ .env.local found"
  
  # Check if mock auth is enabled
  if grep -q "NEXT_PUBLIC_ENABLE_MOCK_AUTH=true" .env.local; then
    echo "✅ Mock authentication is ENABLED"
    echo ""
    echo "🚀 Quick Access URLs (after startup):"
    echo "   Physical Trainer: http://localhost:3010/physicaltrainer"
    echo "   Login Page: http://localhost:3010/login (with dev quick login panel)"
    echo ""
  else
    echo "⚠️  Mock authentication is DISABLED"
    echo "   To enable quick development access, set NEXT_PUBLIC_ENABLE_MOCK_AUTH=true in .env.local"
  fi
else
  echo "⚠️  .env.local not found. Creating from .env.example..."
  cp .env.example .env.local
  
  # Enable mock auth by default for development
  sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_AUTH=false/NEXT_PUBLIC_ENABLE_MOCK_AUTH=true/g' .env.local
  echo "✅ Created .env.local with mock auth enabled"
fi

echo ""
echo "🚀 Starting development server..."
echo "========================================="
echo ""

# Start the development server
pnpm dev