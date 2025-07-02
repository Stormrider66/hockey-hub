# User Service Migration Guide

## Overview

This guide explains how to migrate the User Service database from numeric IDs to UUIDs and implement the new comprehensive schema.

## Prerequisites

1. PostgreSQL database running
2. Node.js and pnpm installed
3. Database credentials configured in `.env`

## Migration Steps

### 1. Backup Existing Data (if any)

```bash
# Create a full database backup
pg_dump -U postgres -d hockey_hub_users > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Run Migrations

```bash
# Navigate to user service
cd services/user-service

# Install dependencies
pnpm install

# Run migrations (includes backup and data transformation)
pnpm run db:migrate
```

This command will:
1. Check for existing data and create backups
2. Create new tables with UUID primary keys
3. Migrate existing data if present
4. Set up all relationships and constraints

### 3. Seed Development Data (Optional)

For development environments:

```bash
# Seed with test data
pnpm run db:seed
```

This creates:
- 1 Organization (Hockey Hub Demo Club)
- 5 Teams
- 10 Users with different roles
- Parent-child relationships

### 4. Verify Migration

```bash
# Connect to database
psql -U postgres -d hockey_hub_users

# Check tables
\dt

# Verify users table structure
\d+ users

# Count records
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM organizations;
SELECT COUNT(*) FROM teams;
```

## Migration Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm run migration:show` | Show pending migrations |
| `pnpm run migration:run` | Run all pending migrations |
| `pnpm run migration:revert` | Revert last migration |
| `pnpm run db:seed` | Seed development data |
| `pnpm run db:reset` | Drop all, recreate, and seed |

## Handling Existing Data

If you have existing users with numeric IDs:

1. The migration automatically creates a backup table (`users_backup`)
2. Generates UUIDs for all existing records
3. Creates an ID mapping table for reference
4. Migrates users to the new schema
5. Creates a default organization and assigns users

### ID Mapping Table

The `id_mappings` table preserves the relationship between old numeric IDs and new UUIDs:

```sql
SELECT * FROM id_mappings WHERE table_name = 'users';
```

## Troubleshooting

### Migration Fails

1. Check database connection:
   ```bash
   psql -U postgres -d hockey_hub_users
   ```

2. Check for conflicts:
   ```sql
   SELECT * FROM users WHERE email IN (SELECT email FROM users_backup);
   ```

3. Manually backup and clear:
   ```sql
   CREATE TABLE users_backup_manual AS SELECT * FROM users;
   DROP TABLE users CASCADE;
   ```

### UUID Extension Missing

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Permission Issues

Ensure the database user has permission to:
- Create/drop tables
- Create extensions
- Alter table structures

## Production Migration Checklist

- [ ] Backup production database
- [ ] Test migration on staging environment
- [ ] Schedule maintenance window
- [ ] Prepare rollback plan
- [ ] Update environment variables
- [ ] Run migrations
- [ ] Verify data integrity
- [ ] Update API endpoints to handle UUIDs
- [ ] Monitor application logs
- [ ] Keep backup for 30 days

## Rollback Procedure

If issues occur:

```bash
# Restore from backup
psql -U postgres -d hockey_hub_users < backup_YYYYMMDD_HHMMSS.sql

# Or use the backup table
psql -U postgres -d hockey_hub_users -c "
  DROP TABLE users CASCADE;
  ALTER TABLE users_backup RENAME TO users;
"
```

## Next Steps

After successful migration:

1. Update all services to use UUID references
2. Implement DTOs for cross-service communication
3. Set up event bus for data synchronization
4. Remove old numeric ID handling code