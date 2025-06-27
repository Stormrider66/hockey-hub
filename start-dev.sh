#!/bin/bash

echo "🚀 Starting Hockey Hub Development Environment"
echo "============================================"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
pnpm install

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    echo "Starting $service_name..."
    cd "$service_path" && pnpm dev &
}

# Start all services
echo ""
echo "🏃 Starting services..."
echo ""

# Start Frontend
echo "🎨 Starting Frontend (http://localhost:3002)..."
cd apps/frontend && npm run dev &

# Give frontend a moment to start
sleep 2

# Start API Gateway
echo "🌐 Starting API Gateway (http://localhost:3000)..."
cd ../../services/api-gateway && npm run dev &

# Start other services
echo "👤 Starting User Service (port 3001)..."
cd ../user-service && npm run dev &

echo "📧 Starting Communication Service (port 3002)..."
cd ../communication-service && npm run dev &

echo "📅 Starting Calendar Service (port 3003)..."
cd ../calendar-service && npm run dev &

echo "🏃 Starting Training Service (port 3004)..."
cd ../training-service && npm run dev &

echo "🏥 Starting Medical Service (port 3005)..."
cd ../medical-service && npm run dev &

echo "📋 Starting Planning Service (port 3006)..."
cd ../planning-service && npm run dev &

echo "📊 Starting Statistics Service (port 3007)..."
cd ../statistics-service && npm run dev &

echo "💰 Starting Payment Service (port 3008)..."
cd ../payment-service && npm run dev &

echo "⚙️ Starting Admin Service (port 3009)..."
cd ../admin-service && npm run dev &

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Frontend: http://localhost:3002"
echo "🚪 API Gateway: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait