#!/bin/bash

# Cypress E2E Test Runner Script
# This script starts the necessary services and runs Cypress tests

echo "Starting Hockey Hub E2E Tests..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local port=$1
    local service=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓ $service is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}✗ $service is not running on port $port${NC}"
        return 1
    fi
}

# Check if required services are running
echo "Checking services..."
services_running=true

check_service 3000 "API Gateway" || services_running=false
check_service 3001 "User Service" || services_running=false
check_service 3010 "Frontend" || services_running=false

if [ "$services_running" = false ]; then
    echo -e "${RED}Some required services are not running.${NC}"
    echo "Please start the services first with:"
    echo "  - Backend: cd ../../ && docker-compose up -d"
    echo "  - Frontend: npm run dev"
    exit 1
fi

# Run Cypress
if [ "$1" = "open" ]; then
    echo "Opening Cypress Test Runner..."
    npm run cypress:open
elif [ "$1" = "run" ]; then
    echo "Running Cypress tests in headless mode..."
    npm run cypress:run
else
    echo "Usage: ./cypress-run.sh [open|run]"
    echo "  open - Opens the Cypress Test Runner"
    echo "  run  - Runs tests in headless mode"
    exit 1
fi