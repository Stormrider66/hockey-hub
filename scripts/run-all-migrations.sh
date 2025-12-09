#!/bin/bash

# Script to run migrations for all services

echo "Running migrations for all services..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run migrations for a service
run_migrations() {
    local SERVICE=$1
    local SERVICE_DIR="/mnt/c/Hockey Hub/services/$SERVICE"
    
    if [ ! -d "$SERVICE_DIR" ]; then
        echo -e "${RED}Service directory not found: $SERVICE_DIR${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Running migrations for $SERVICE...${NC}"
    
    cd "$SERVICE_DIR"
    
    # Check if migrations exist
    if [ ! -d "src/migrations" ] || [ -z "$(ls -A src/migrations/*.ts 2>/dev/null)" ]; then
        echo -e "${YELLOW}No migrations found for $SERVICE${NC}"
        return 0
    fi
    
    # Run migrations
    pnpm run migration:run
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migrations completed for $SERVICE${NC}"
    else
        echo -e "${RED}✗ Migration failed for $SERVICE${NC}"
        return 1
    fi
}

# Function to show migration status
show_migration_status() {
    local SERVICE=$1
    local SERVICE_DIR="/mnt/c/Hockey Hub/services/$SERVICE"
    
    if [ -d "$SERVICE_DIR" ]; then
        echo -e "${YELLOW}Migration status for $SERVICE:${NC}"
        cd "$SERVICE_DIR"
        pnpm run migration:show 2>/dev/null || echo "No migration command available"
        echo ""
    fi
}

# Services with databases
SERVICES=(
    "user-service"
    "calendar-service"
    "training-service"
    "communication-service"
)

# Check if we're running a specific command
COMMAND=${1:-"run"}

case $COMMAND in
    "run")
        echo "Running all migrations..."
        for SERVICE in "${SERVICES[@]}"; do
            run_migrations "$SERVICE"
            echo ""
        done
        ;;
    
    "status")
        echo "Checking migration status..."
        for SERVICE in "${SERVICES[@]}"; do
            show_migration_status "$SERVICE"
        done
        ;;
    
    "revert")
        echo -e "${RED}WARNING: This will revert the last migration for all services!${NC}"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for SERVICE in "${SERVICES[@]}"; do
                echo -e "${YELLOW}Reverting last migration for $SERVICE...${NC}"
                cd "/mnt/c/Hockey Hub/services/$SERVICE"
                pnpm run migration:revert
                echo ""
            done
        fi
        ;;
    
    *)
        echo "Usage: $0 [run|status|revert]"
        echo "  run    - Run all pending migrations (default)"
        echo "  status - Show migration status for all services"
        echo "  revert - Revert last migration for all services"
        exit 1
        ;;
esac

echo -e "${GREEN}Migration process complete!${NC}"