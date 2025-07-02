#!/bin/bash

echo "🚀 Starting Hockey Hub databases with Docker Compose..."

# Start only the database services
docker-compose up -d \
  db-users \
  db-admin \
  db-calendar \
  db-communication \
  db-medical \
  db-payment \
  db-planning \
  db-statistics \
  db-training

echo ""
echo "⏳ Waiting for databases to be ready..."
sleep 10

echo ""
echo "📊 Database Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep hockeyhub_db

echo ""
echo "✅ Databases are running!"
echo ""
echo "Database Ports:"
echo "  - Users DB:          localhost:5432"
echo "  - Admin DB:          localhost:5433"
echo "  - Calendar DB:       localhost:5434"
echo "  - Communication DB:  localhost:5435"
echo "  - Medical DB:        localhost:5436"
echo "  - Payment DB:        localhost:5437"
echo "  - Planning DB:       localhost:5438"
echo "  - Statistics DB:     localhost:5439"
echo "  - Training DB:       localhost:5440"
echo ""
echo "Now you can run 'pnpm run dev' to start the services!"