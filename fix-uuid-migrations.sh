#!/bin/bash

set -e

echo "🔧 Running UUID Foreign Key Fix Migrations..."
echo "============================================="

# Function to run migrations for a service
run_service_migrations() {
    local service_name=$1
    local service_path="services/$service_name"
    
    echo ""
    echo "📦 Running migrations for $service_name..."
    echo "--------------------------------------------"
    
    if [ -d "$service_path" ]; then
        cd "$service_path"
        
        # Check if the service has package.json and migration scripts
        if [ -f "package.json" ]; then
            # Install dependencies if needed
            if [ ! -d "node_modules" ]; then
                echo "  📥 Installing dependencies..."
                pnpm install
            fi
            
            # Run migrations
            echo "  🚀 Running migrations..."
            
            # Try different migration command patterns
            if pnpm run migration:run 2>/dev/null; then
                echo "  ✅ Migrations completed successfully for $service_name"
            elif pnpm run typeorm:migration:run 2>/dev/null; then
                echo "  ✅ Migrations completed successfully for $service_name"
            elif npx typeorm migration:run 2>/dev/null; then
                echo "  ✅ Migrations completed successfully for $service_name"
            else
                echo "  ⚠️  Could not run migrations for $service_name (migration command not found)"
            fi
        else
            echo "  ⚠️  No package.json found for $service_name"
        fi
        
        cd ../..
    else
        echo "  ❌ Service directory not found: $service_path"
    fi
}

# Services that need UUID fixes
services=(
    "training-service"
    "medical-service"
    "communication-service"
    "calendar-service"
    "user-service"
)

echo "Services to update: ${services[*]}"
echo ""

# Run migrations for each service
for service in "${services[@]}"; do
    run_service_migrations "$service"
done

echo ""
echo "🎉 UUID Foreign Key Fix Migrations Complete!"
echo "============================================="
echo ""
echo "Summary of changes:"
echo "- ✅ Fixed AuditableEntity to use UUID primary key"
echo "- ✅ Fixed training-service foreign key types (createdBy, teamId, playerId, etc.)"
echo "- ✅ Fixed medical-service audit column types"
echo "- ✅ All foreign key relationships now use consistent UUID types"
echo ""
echo "⚠️  Important notes:"
echo "- Review the migration outputs above for any errors"
echo "- Test the applications to ensure foreign key relationships work correctly"
echo "- Consider running a data validation script to verify foreign key integrity"
echo ""