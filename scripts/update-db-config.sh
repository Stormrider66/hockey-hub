#!/bin/bash

# Update all service .env files to use shared database with schemas

SERVICES=(
  "user-service:users"
  "training-service:training"
  "medical-service:medical"
  "calendar-service:calendar"
  "communication-service:communication"
  "payment-service:payment"
  "statistics-service:statistics"
  "planning-service:planning"
  "admin-service:admin"
)

for service_schema in "${SERVICES[@]}"; do
  IFS=':' read -r service schema <<< "$service_schema"
  env_file="services/$service/.env"
  
  if [ -f "$env_file" ]; then
    echo "Updating $service to use schema: $schema"
    
    # Create backup
    cp "$env_file" "$env_file.bak"
    
    # Update database configuration
    sed -i 's/^DB_HOST=.*/DB_HOST=localhost/g' "$env_file"
    sed -i 's/^DB_USER=.*/DB_USER=hockeyhub_user/g' "$env_file"
    sed -i 's/^DB_NAME=.*/DB_NAME=hockeyhub_dev/g' "$env_file"
    
    # Add schema if not present
    if ! grep -q "^DB_SCHEMA=" "$env_file"; then
      sed -i "/^DB_NAME=/a DB_SCHEMA=$schema" "$env_file"
    else
      sed -i "s/^DB_SCHEMA=.*/DB_SCHEMA=$schema/g" "$env_file"
    fi
  fi
done

echo "✅ All services updated to use shared database with schemas"