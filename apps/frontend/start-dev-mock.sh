#!/bin/bash

# Start script for frontend development with mock authentication

echo "🏒 Starting Hockey Hub Frontend in Mock Mode..."
echo ""
echo "✅ Mock authentication is enabled"
echo "✅ No backend services required"
echo "✅ WebSocket connections disabled"
echo ""

# Ensure we're in the frontend directory
cd "$(dirname "$0")"

# Clear Next.js cache to avoid issues
echo "🧹 Clearing Next.js cache..."
rm -rf .next/cache

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🚀 Starting development server on http://localhost:3002"
echo ""
echo "📝 Quick Login Options:"
echo "   - Player: player@hockeyhub.com"
echo "   - Coach: coach@hockeyhub.com"
echo "   - Parent: parent@hockeyhub.com"
echo "   - Medical Staff: medical@hockeyhub.com"
echo "   - Equipment Manager: equipment@hockeyhub.com"
echo "   - Physical Trainer: trainer@hockeyhub.com"
echo "   - Club Admin: clubadmin@hockeyhub.com"
echo "   - Admin: admin@hockeyhub.com"
echo ""
echo "🔑 Password: Any password works in mock mode"
echo ""

npm run dev