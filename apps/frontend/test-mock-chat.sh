#!/bin/bash

echo "Testing Chat Interface in Mock Mode..."
echo "======================================"

# Set mock mode environment variable
export NEXT_PUBLIC_ENABLE_MOCK_AUTH=true

# Start the dev server in mock mode
echo "Starting frontend in mock mode..."
echo "Chat should be accessible at http://localhost:3002/chat"
echo ""
echo "To test:"
echo "1. Login with any mock user"
echo "2. Navigate to Chat from the menu"
echo "3. Verify the chat interface loads without errors"
echo "4. You should see a simple chat UI with mock conversations"
echo ""

npm run dev