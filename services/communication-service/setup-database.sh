#!/bin/bash

echo "🔄 Setting up Communication Service Database..."

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    exit 1
fi

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5435}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-hockey_hub_password}
DB_NAME=${DB_NAME:-hockey_hub_communication}

echo "📋 Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"

# Test connection
echo "🔍 Testing PostgreSQL connection..."
export PGPASSWORD=$DB_PASSWORD
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "\q" 2>/dev/null; then
    echo "❌ Cannot connect to PostgreSQL"
    echo "Please ensure PostgreSQL is running on $DB_HOST:$DB_PORT"
    echo "and the user $DB_USER has the correct password"
    exit 1
fi

echo "✅ PostgreSQL connection successful"

# Create database and tables
echo "📦 Creating database and tables..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f create-database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "🎉 Communication Service database is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Start the communication service: pnpm run dev"
    echo "2. Test the API: pnpm run test:backend"
else
    echo "❌ Database setup failed"
    exit 1
fi