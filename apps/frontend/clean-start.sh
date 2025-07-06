#!/bin/bash

echo "🏒 Hockey Hub Frontend Clean Start"
echo ""
echo "🧹 Cleaning build cache..."

# Kill any existing processes on port 3002
if lsof -i :3002 > /dev/null 2>&1; then
    echo "⚠️  Killing existing process on port 3002..."
    lsof -ti :3002 | xargs kill -9 2>/dev/null
fi

# Remove Next.js cache
if [ -d ".next" ]; then
    echo "🗑️  Removing .next folder..."
    rm -rf .next
fi

# Remove node_modules cache if exists
if [ -d "node_modules/.cache" ]; then
    echo "🗑️  Removing node_modules cache..."
    rm -rf node_modules/.cache
fi

echo ""
echo "🚀 Starting fresh development server..."
echo ""

npm run dev