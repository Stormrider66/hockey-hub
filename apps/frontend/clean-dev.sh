#!/bin/bash

echo "🧹 Cleaning Next.js cache and build files..."

# Remove Next.js build cache
rm -rf .next

# Remove node_modules cache
rm -rf node_modules/.cache

# Remove any lockfiles that might cause issues
rm -f .next.lock

echo "✅ Cache cleared!"
echo ""
echo "🚀 Starting development server..."
echo ""

# Start the dev server
pnpm dev