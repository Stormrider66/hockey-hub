#!/bin/bash

echo "🏒 Starting Hockey Hub Frontend (WSL Mode)"
echo ""
echo "This script handles WSL-specific issues with Next.js"
echo ""

cd apps/frontend || exit 1

# Clean up
echo "🧹 Cleaning up..."
pkill -f "next dev" 2>/dev/null || true
rm -rf .next 2>/dev/null || true

# Install SWC binary manually for WSL
echo "📦 Setting up SWC for WSL..."
mkdir -p node_modules/@next
cd node_modules/@next

# Download the correct SWC binary for WSL
if [ ! -d "swc-linux-x64-gnu" ]; then
    echo "Downloading SWC binary..."
    npm pack @next/swc-linux-x64-gnu@15.3.4 2>/dev/null
    tar -xf next-swc-linux-x64-gnu-15.3.4.tgz 2>/dev/null
    mv package swc-linux-x64-gnu 2>/dev/null
    rm -f next-swc-linux-x64-gnu-15.3.4.tgz 2>/dev/null
fi

cd ../..

# Start the server
echo ""
echo "🚀 Starting development server on http://localhost:3003"
echo ""

# Use npx to ensure we're using the local Next.js
npx next dev -p 3003