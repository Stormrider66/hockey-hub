#!/bin/bash

echo "🔧 Setting up Hockey Hub databases..."

# Database configuration
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Array of databases to create
DATABASES=(
  "hockey_hub_users"
  "hockey_hub_training"
  "hockey_hub_medical"
  "hockey_hub_calendar"
  "hockey_hub_communication"
  "hockey_hub_payment"
  "hockey_hub_statistics"
  "hockey_hub_planning"
  "hockey_hub_admin"
)

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to create database
create_database() {
  local db_name=$1
  
  # Check if database exists
  if psql -U $DB_USER -h $DB_HOST -p $DB_PORT -lqt | cut -d \| -f 1 | grep -qw $db_name; then
    echo -e "${YELLOW}⚠️  Database $db_name already exists${NC}"
  else
    # Create database
    if createdb -U $DB_USER -h $DB_HOST -p $DB_PORT $db_name 2>/dev/null; then
      echo -e "${GREEN}✅ Created database: $db_name${NC}"
    else
      echo -e "${RED}❌ Failed to create database: $db_name${NC}"
      echo "   Make sure PostgreSQL is running and you have the correct permissions"
    fi
  fi
}

# Check if PostgreSQL is running
if ! pg_isready -U $DB_USER -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
  echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
  echo "   Please start PostgreSQL first"
  exit 1
fi

echo "📊 Creating databases..."
echo ""

# Create each database
for db in "${DATABASES[@]}"; do
  create_database $db
done

echo ""
echo -e "${GREEN}✨ Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update service .env files with database credentials if needed"
echo "2. Run 'pnpm run dev' to start all services"
echo "3. Services will create tables automatically on first run"