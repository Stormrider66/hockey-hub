#!/bin/bash

echo "🏒 Starting Essential Hockey Hub Services"
echo "========================================"
echo "Starting: Frontend, API Gateway, and User Service only"
echo ""

# Kill any existing node processes
echo "Stopping existing services..."
pkill -f "node" 2>/dev/null || true
sleep 2

# Function to start a service in background
start_service() {
  local service=$1
  local name=$2
  echo "Starting $name..."
  (cd $service && pnpm run dev > /tmp/$name.log 2>&1) &
}

# Start API Gateway
start_service "services/api-gateway" "api-gateway"

# Wait a bit for gateway to start
sleep 3

# Start User Service (for auth)
start_service "services/user-service" "user-service"

# Wait for services to initialize
sleep 3

# Start Frontend
echo "Starting Frontend..."
cd apps/frontend
pnpm run dev

# This will run in foreground so you can see the output