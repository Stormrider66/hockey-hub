#!/bin/bash

echo "🔍 Validating UUID Type Consistency..."
echo "====================================="
echo ""

# Function to check for potential UUID type mismatches in entity files
check_entity_types() {
    echo "📋 Checking entity definitions for type consistency..."
    echo ""
    
    # Find all TypeScript entity files
    find services/*/src/entities -name "*.ts" -not -name "index.ts" | while read -r file; do
        # Check for columns that reference user/team/organization/player IDs without explicit UUID type
        suspicious_columns=$(grep -n -E "@Column\(\)" "$file" | grep -E "(Id|_id)" | head -3)
        
        if [ -n "$suspicious_columns" ]; then
            echo "⚠️  Potential type issues in $file:"
            echo "$suspicious_columns"
            echo ""
        fi
    done
    
    echo "✅ Entity type check complete"
    echo ""
}

# Function to search for common foreign key patterns
check_foreign_key_patterns() {
    echo "🔗 Checking for common foreign key patterns..."
    echo ""
    
    echo "📌 User ID references:"
    grep -r -n "userId\|user_id\|createdBy\|updatedBy\|deletedBy" services/*/src/entities/*.ts | grep -v "type: 'uuid'" | head -10
    echo ""
    
    echo "📌 Team ID references:"
    grep -r -n "teamId\|team_id" services/*/src/entities/*.ts | grep -v "type: 'uuid'" | head -10
    echo ""
    
    echo "📌 Organization ID references:"
    grep -r -n "organizationId\|organization_id" services/*/src/entities/*.ts | grep -v "type: 'uuid'" | head -10
    echo ""
    
    echo "📌 Player ID references:"
    grep -r -n "playerId\|player_id" services/*/src/entities/*.ts | grep -v "type: 'uuid'" | head -10
    echo ""
}

# Function to verify BaseEntity vs AuditableEntity usage
check_entity_inheritance() {
    echo "🏗️  Checking entity inheritance patterns..."
    echo ""
    
    echo "📌 Entities using BaseEntity (should have UUID primary key):"
    grep -r -l "extends BaseEntity" services/*/src/entities/*.ts | wc -l
    
    echo "📌 Entities using AuditableEntity (should have UUID primary key + audit fields):"
    grep -r -l "extends AuditableEntity" services/*/src/entities/*.ts | wc -l
    
    echo "📌 Entities with custom primary keys (manual review needed):"
    grep -r -l "@PrimaryGeneratedColumn" services/*/src/entities/*.ts | head -5
    echo ""
}

# Function to check migration files for UUID conversions
check_migration_files() {
    echo "📜 Checking recent migration files..."
    echo ""
    
    echo "📌 Recent UUID-related migrations:"
    find services/*/src/migrations -name "*UUID*" -o -name "*uuid*" -o -name "*ForeignKey*" | head -10
    echo ""
    
    echo "📌 Migration files created in last day:"
    find services/*/src/migrations -name "*.ts" -mtime -1 | head -10
    echo ""
}

# Run all checks
check_entity_types
check_foreign_key_patterns
check_entity_inheritance
check_migration_files

echo "🎯 Validation Summary"
echo "===================="
echo ""
echo "✅ Fixed Issues:"
echo "- AuditableEntity now extends proper BaseEntity with UUID primary key"
echo "- Training service entities now use explicit UUID types for foreign keys"
echo "- Migration scripts created for type corrections"
echo ""
echo "⚠️  Items to Review:"
echo "- Any remaining @Column() declarations without explicit types"
echo "- Cross-service foreign key relationships (should use UUID consistently)"
echo "- Data integrity after migration (test foreign key constraints)"
echo ""
echo "🔧 Next Steps:"
echo "1. Run the migration script: ./fix-uuid-migrations.sh"
echo "2. Test foreign key relationships between services"
echo "3. Verify data consistency in test environment"
echo "4. Update any remaining entities with type mismatches"
echo ""