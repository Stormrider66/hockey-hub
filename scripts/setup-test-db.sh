#!/bin/bash

# Script to set up test databases for all services

echo "Setting up test databases..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to create a test database
create_test_db() {
    local SERVICE=$1
    local PORT=$2
    local DB_NAME="${SERVICE}_test"
    
    echo "Creating test database for $SERVICE..."
    
    # Check if PostgreSQL is running
    if ! pg_isready -p $PORT > /dev/null 2>&1; then
        echo -e "${RED}PostgreSQL is not running on port $PORT${NC}"
        return 1
    fi
    
    # Create test database if it doesn't exist
    if psql -U postgres -p $PORT -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo "Test database $DB_NAME already exists"
    else
        createdb -U postgres -p $PORT "$DB_NAME" 2>/dev/null || {
            echo -e "${RED}Failed to create database $DB_NAME${NC}"
            return 1
        }
        echo -e "${GREEN}Created test database $DB_NAME${NC}"
    fi
    
    # Create .env.test file for the service
    local SERVICE_DIR="/mnt/c/Hockey Hub/services/$SERVICE"
    if [ -d "$SERVICE_DIR" ]; then
        cat > "$SERVICE_DIR/.env.test" << EOF
# Test Environment Variables
NODE_ENV=test
PORT=0

# Test Database
DB_HOST=localhost
DB_PORT=$PORT
DB_NAME=$DB_NAME
DB_USER=postgres
DB_PASS=postgres
DB_SYNC=true
DB_LOGGING=false

# Test JWT Secret
JWT_SECRET=test-jwt-secret-key
JWT_EXPIRES_IN=1h

# Test Redis (using a different database)
REDIS_URL=redis://localhost:6379/1

# Disable external services in tests
DISABLE_EMAIL=true
DISABLE_SMS=true
DISABLE_EXTERNAL_APIS=true
EOF
        echo "Created .env.test for $SERVICE"
    fi
}

# Service to database port mapping
declare -A SERVICE_PORTS=(
    ["user-service"]=5433
    ["communication-service"]=5434
    ["calendar-service"]=5435
    ["training-service"]=5436
    ["medical-service"]=5437
    ["planning-service"]=5438
    ["statistics-service"]=5439
    ["payment-service"]=5440
    ["admin-service"]=5441
)

# Create test databases for all services
for SERVICE in "${!SERVICE_PORTS[@]}"; do
    PORT=${SERVICE_PORTS[$SERVICE]}
    create_test_db "$SERVICE" "$PORT"
done

# Create a shared test utilities script
cat > "/mnt/c/Hockey Hub/scripts/test-db-utils.sh" << 'EOF'
#!/bin/bash

# Utility functions for test databases

# Reset a test database
reset_test_db() {
    local SERVICE=$1
    local PORT=$2
    local DB_NAME="${SERVICE}_test"
    
    echo "Resetting test database for $SERVICE..."
    
    # Drop and recreate the database
    dropdb -U postgres -p $PORT --if-exists "$DB_NAME"
    createdb -U postgres -p $PORT "$DB_NAME"
    
    echo "Test database $DB_NAME has been reset"
}

# Run migrations on test database
run_test_migrations() {
    local SERVICE=$1
    local SERVICE_DIR="/mnt/c/Hockey Hub/services/$SERVICE"
    
    if [ -d "$SERVICE_DIR" ]; then
        cd "$SERVICE_DIR"
        
        # Load test environment
        export $(cat .env.test | grep -v '^#' | xargs)
        
        # Run migrations
        pnpm run migration:run
    fi
}

# Export functions
export -f reset_test_db
export -f run_test_migrations
EOF

chmod +x "/mnt/c/Hockey Hub/scripts/test-db-utils.sh"

echo -e "${GREEN}Test database setup complete!${NC}"
echo ""
echo "To reset a test database, run:"
echo "  source scripts/test-db-utils.sh"
echo "  reset_test_db <service-name> <port>"
echo ""
echo "To run migrations on a test database:"
echo "  run_test_migrations <service-name>"