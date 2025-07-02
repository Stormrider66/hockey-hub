# Database Migrations Guide

## Overview

This guide covers the database migration strategy for the Hockey Hub platform. Each microservice manages its own database and migrations using TypeORM.

## Services with Databases

### 1. User Service (Port: 5433)
- **Database**: `hockey_hub_users`
- **Entities**: User, Organization, Team, Role, Permission, RefreshToken, etc.
- **Key Features**: Authentication, RBAC, Token management

### 2. Calendar Service (Port: 5435)
- **Database**: `hockey_hub_calendar`
- **Entities**: Event, EventParticipant, Resource, ResourceBooking, RecurrenceRule
- **Key Features**: Event scheduling, Resource management, Recurring events

### 3. Training Service (Port: 5436)
- **Database**: `hockey_hub_training`
- **Entities**: WorkoutSession, Exercise, ExerciseTemplate, WorkoutExecution
- **Key Features**: Workout planning, Exercise tracking, Performance metrics

### 4. Communication Service (Port: 5434)
- **Database**: `hockey_hub_communication`
- **Entities**: Conversation, Message, MessageAttachment, UserPresence
- **Key Features**: Messaging, Notifications, Real-time communication

## Migration Commands

### Generate a New Migration
```bash
# For a specific service
cd services/<service-name>
npm run migration:generate -- src/migrations/MigrationName
```

### Run Migrations
```bash
# Run all pending migrations
npm run migration:run

# For production
NODE_ENV=production npm run migration:run
```

### Revert Last Migration
```bash
npm run migration:revert
```

### Show Migration Status
```bash
npm run migration:show
```

## Migration Best Practices

### 1. Naming Conventions
- Use timestamp prefix: `1735500000000-DescriptiveName.ts`
- Use PascalCase for migration names
- Be descriptive: `AddIndexesToUserTable` not `UpdateUsers`

### 2. Migration Structure
```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationName1735500000000 implements MigrationInterface {
    name = 'MigrationName1735500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Forward migration logic
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback logic
    }
}
```

### 3. Performance Indexes

Always add indexes for:
- Foreign key columns
- Columns used in WHERE clauses
- Columns used in JOIN conditions
- Columns used for sorting (ORDER BY)
- Soft delete columns (deletedAt)

Example:
```typescript
await queryRunner.createIndex("table_name", new Index({
    name: "IDX_table_column",
    columnNames: ["column_name"]
}));
```

### 4. Audit Columns

All entities extend `AuditableEntity` which provides:
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update
- `createdBy`: User ID who created the record
- `updatedBy`: User ID who last updated
- `deletedAt`: Soft delete timestamp
- `deletedBy`: User ID who deleted
- `lastRequestId`: Request ID for tracing
- `lastIpAddress`: IP address for security

### 5. Foreign Key Constraints

Always define foreign keys with appropriate cascade options:
```typescript
await queryRunner.createForeignKey("child_table", new ForeignKey({
    columnNames: ["parent_id"],
    referencedColumnNames: ["id"],
    referencedTableName: "parent_table",
    onDelete: "CASCADE", // or "SET NULL", "RESTRICT"
    onUpdate: "CASCADE"
}));
```

## Development Workflow

### 1. Initial Setup
```bash
# Create test databases
./scripts/setup-test-db.sh

# Install dependencies
pnpm install
```

### 2. Creating a New Migration
```bash
# 1. Make entity changes
# 2. Generate migration
cd services/<service-name>
npm run migration:generate -- src/migrations/YourMigrationName

# 3. Review generated migration
# 4. Add indexes and constraints if needed
# 5. Test migration
npm run migration:run

# 6. Test rollback
npm run migration:revert
npm run migration:run
```

### 3. Deployment Process
1. Test migrations in development
2. Review migration SQL with team
3. Create backup of production database
4. Run migrations during maintenance window
5. Verify data integrity
6. Monitor application performance

## Common Patterns

### Adding a New Column
```typescript
await queryRunner.addColumn("table_name", new TableColumn({
    name: "column_name",
    type: "varchar",
    length: "255",
    isNullable: true,
    default: null
}));
```

### Creating a Junction Table
```typescript
await queryRunner.createTable(new Table({
    name: "user_roles",
    columns: [
        {
            name: "userId",
            type: "uuid"
        },
        {
            name: "roleId",
            type: "uuid"
        }
    ],
    indices: [
        {
            name: "IDX_user_roles_userId",
            columnNames: ["userId"]
        },
        {
            name: "IDX_user_roles_roleId",
            columnNames: ["roleId"]
        }
    ],
    uniques: [
        {
            name: "UQ_user_roles",
            columnNames: ["userId", "roleId"]
        }
    ]
}));
```

### Adding Composite Index
```typescript
await queryRunner.createIndex("table_name", new Index({
    name: "IDX_table_composite",
    columnNames: ["column1", "column2"],
    isUnique: false
}));
```

## Troubleshooting

### Migration Fails
1. Check database connectivity
2. Verify TypeORM configuration
3. Check for syntax errors in migration
4. Ensure proper permissions
5. Check for conflicting migrations

### Rollback Issues
1. Ensure down() method is properly implemented
2. Check for data dependencies
3. Verify foreign key constraints
4. Test rollback in development first

### Performance Issues
1. Add missing indexes
2. Analyze query execution plans
3. Consider partitioning large tables
4. Optimize batch operations

## Migration Checklist

- [ ] Entity changes match requirements
- [ ] Migration generated successfully
- [ ] Indexes added for foreign keys
- [ ] Indexes added for query columns
- [ ] Audit columns included
- [ ] Foreign key constraints defined
- [ ] Down migration implemented
- [ ] Migration tested locally
- [ ] Rollback tested
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Code reviewed

## References

- [TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [Database Indexing Best Practices](https://use-the-index-luke.com/)