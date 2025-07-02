#!/bin/bash

# Script to generate TypeORM migrations for all services

echo "Generating TypeORM migrations for all services..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to generate migration for a service
generate_migration() {
    local SERVICE=$1
    local SERVICE_DIR="/mnt/c/Hockey Hub/services/$SERVICE"
    
    if [ ! -d "$SERVICE_DIR" ]; then
        echo -e "${RED}Service directory not found: $SERVICE_DIR${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Generating migration for $SERVICE...${NC}"
    
    cd "$SERVICE_DIR"
    
    # Check if migrations directory exists, create if not
    if [ ! -d "src/migrations" ]; then
        mkdir -p "src/migrations"
        echo "Created migrations directory"
    fi
    
    # Check if typeorm config exists
    if [ ! -f "src/config/typeorm.config.ts" ] && [ ! -f "ormconfig.ts" ]; then
        echo -e "${RED}No TypeORM configuration found for $SERVICE${NC}"
        return 1
    fi
    
    # Generate timestamp for migration name
    TIMESTAMP=$(date +%s)
    MIGRATION_NAME="Initial${SERVICE}Schema${TIMESTAMP}"
    
    # Run TypeORM migration generation
    npx typeorm-ts-node-commonjs migration:generate "src/migrations/${MIGRATION_NAME}" -d src/config/typeorm.config.ts
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migration generated for $SERVICE${NC}"
    else
        echo -e "${RED}✗ Failed to generate migration for $SERVICE${NC}"
    fi
}

# Services with entities
SERVICES_WITH_ENTITIES=(
    "user-service"
    "calendar-service"
    "training-service"
    "communication-service"
)

# Generate migrations for each service
for SERVICE in "${SERVICES_WITH_ENTITIES[@]}"; do
    generate_migration "$SERVICE"
    echo ""
done

echo -e "${GREEN}Migration generation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the generated migration files"
echo "2. Add indexes and constraints as needed"
echo "3. Run migrations with: pnpm run migration:run"