#!/bin/bash

echo "Starting Authentication Services..."

# Kill any existing processes on ports 3000 and 3001
echo "Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Start user service in background
echo "Starting User Service on port 3001..."
cd services/user-service
DB_HOST=localhost DB_PORT=5432 DB_USER=postgres DB_PASSWORD=hockey_hub_password DB_NAME=hockey_hub_users npm run dev &
USER_SERVICE_PID=$!

# Wait for user service to start
sleep 5

# Start API gateway in background
echo "Starting API Gateway on port 3000..."
cd ../api-gateway
USER_SERVICE_URL=http://localhost:3001 npm run dev &
API_GATEWAY_PID=$!

echo ""
echo "Services started:"
echo "- User Service (PID: $USER_SERVICE_PID) on http://localhost:3001"
echo "- API Gateway (PID: $API_GATEWAY_PID) on http://localhost:3000"
echo ""
echo "Frontend should connect to http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $USER_SERVICE_PID $API_GATEWAY_PID 2>/dev/null; exit" INT
wait