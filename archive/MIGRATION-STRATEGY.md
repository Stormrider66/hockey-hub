# Database Migration Strategy

## Overview

This document outlines the strategy for migrating from the current database structure to the comprehensive schema designed for Hockey Hub.

## Current State

- **User Service**: Has basic User entity with numeric IDs
- **Training Service**: Partially implemented entities with UUIDs
- **Other Services**: No entities implemented yet

## Migration Phases

### Phase 1: Entity Implementation ✅
- Created all TypeORM entities for User Service with UUID primary keys
- Maintained backward compatibility where possible
- Added proper relationships and constraints

### Phase 2: Data Migration (Next Steps)

#### Step 1: Prepare Migration Scripts
1. Create backup of existing data
2. Generate initial migration from entities
3. Create data transformation scripts for:
   - Converting numeric IDs to UUIDs
   - Migrating existing user data to new schema
   - Creating default organizations and teams

#### Step 2: Gradual Migration
1. Add UUID columns alongside existing numeric IDs
2. Generate UUIDs for all existing records
3. Update foreign key references
4. Switch primary keys from numeric to UUID
5. Remove old numeric ID columns

### Phase 3: Service Implementation
1. Implement entities for all other services
2. Set up cross-service communication
3. Implement event-driven updates

## Migration Commands

### User Service
```bash
cd services/user-service

# Generate migration from entities
npm run migration:generate -- -n InitialSchema

# Run migrations
npm run migration:run

# Revert if needed
npm run migration:revert
```

## Data Preservation Strategy

1. **Backup First**: Always backup database before migrations
2. **Test Environment**: Run migrations in test environment first
3. **Rollback Plan**: Keep rollback scripts ready
4. **Gradual Rollout**: Migrate one service at a time

## Cross-Service Considerations

- User IDs are referenced across all services
- Use event bus (NATS) to propagate ID changes
- Implement saga pattern for distributed transactions

## Development Workflow

1. Disable auto-synchronization in production
2. Use migrations for all schema changes
3. Version control all migration files
4. Document breaking changes

## Next Immediate Steps

1. Build the shared-lib package
2. Test new entities in development
3. Create initial migration for User Service
4. Implement similar entities for other services