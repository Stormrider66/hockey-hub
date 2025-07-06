#!/bin/bash

# Kill any existing processes on port 3010
kill -9 $(lsof -t -i:3010) 2>/dev/null || true

# Set environment variables
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1

# Clear Next.js cache
rm -rf .next

# Start development server
echo "Starting Hockey Hub Frontend on http://localhost:3010"
pnpm dev