#!/bin/bash

echo "🏒 Starting Hockey Hub Frontend (Simple Mode)"
echo ""

# Clean any existing processes
echo "🧹 Cleaning up..."
pkill -f "next dev" 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

echo ""
echo "🚀 Starting development server..."
echo ""

# Start with minimal options
npx next dev -p 3010