#!/bin/bash

# Hockey Hub Integration Test Runner
# This script sets up and runs integration tests for all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}Hockey Hub Integration Test Runner${NC}"
echo "=================================="

# Function to run tests for a specific service
run_service_tests() {
    local service=$1
    local service_dir="$ROOT_DIR/services/$service"
    
    if [ ! -d "$service_dir" ]; then
        echo -e "${YELLOW}Warning: Service directory not found: $service_dir${NC}"
        return 1
    fi
    
    echo -e "\n${GREEN}Running integration tests for $service...${NC}"
    
    cd "$service_dir"
    
    # Check if integration tests exist
    if find src -name "*.integration.test.ts" -type f | grep -q .; then
        # Run integration tests
        npm run test:integration 2>/dev/null || npm test -- --testPathPattern="integration" --runInBand
    else
        echo -e "${YELLOW}No integration tests found for $service${NC}"
    fi
}

# Function to setup test databases
setup_test_databases() {
    echo -e "\n${GREEN}Setting up test databases...${NC}"
    
    # Check if setup script exists
    if [ -f "$ROOT_DIR/scripts/setup-test-db.sh" ]; then
        bash "$ROOT_DIR/scripts/setup-test-db.sh"
    else
        echo -e "${YELLOW}Test database setup script not found${NC}"
    fi
}

# Function to cleanup after tests
cleanup() {
    echo -e "\n${GREEN}Cleaning up...${NC}"
    # Add any cleanup commands here
}

# Parse command line arguments
SERVICE=""
SETUP_DB=false
ALL_SERVICES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --service)
            SERVICE="$2"
            shift 2
            ;;
        --setup-db)
            SETUP_DB=true
            shift
            ;;
        --all)
            ALL_SERVICES=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --service <name>  Run tests for specific service"
            echo "  --setup-db        Setup test databases before running tests"
            echo "  --all             Run tests for all services"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Trap cleanup on exit
trap cleanup EXIT

# Setup databases if requested
if [ "$SETUP_DB" = true ]; then
    setup_test_databases
fi

# Run tests
if [ "$ALL_SERVICES" = true ]; then
    # Run tests for all services
    echo -e "${GREEN}Running integration tests for all services...${NC}"
    
    # Critical services in order of dependency
    SERVICES=(
        "api-gateway"
        "user-service"
        "calendar-service"
        "training-service"
        "medical-service"
        "communication-service"
        "planning-service"
        "statistics-service"
        "payment-service"
        "admin-service"
    )
    
    FAILED_SERVICES=()
    
    for service in "${SERVICES[@]}"; do
        if ! run_service_tests "$service"; then
            FAILED_SERVICES+=("$service")
        fi
    done
    
    # Summary
    echo -e "\n${GREEN}Integration Test Summary${NC}"
    echo "========================"
    
    if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
        echo -e "${GREEN}All integration tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Failed services:${NC}"
        for failed in "${FAILED_SERVICES[@]}"; do
            echo -e "  - $failed"
        done
        exit 1
    fi
    
elif [ -n "$SERVICE" ]; then
    # Run tests for specific service
    run_service_tests "$SERVICE"
else
    # Default: Run critical integration tests
    echo -e "${GREEN}Running critical integration tests...${NC}"
    
    CRITICAL_TESTS=(
        "api-gateway"
        "user-service"
        "calendar-service"
        "training-service"
        "medical-service"
    )
    
    for service in "${CRITICAL_TESTS[@]}"; do
        run_service_tests "$service"
    done
fi

echo -e "\n${GREEN}Integration tests completed!${NC}"