# Database Migrations Guide

This guide covers database migration management, best practices, and common patterns in the Hockey Hub project.

## Table of Contents
1. [Migration Overview](#migration-overview)
2. [Setting Up Migrations](#setting-up-migrations)
3. [Creating Migrations](#creating-migrations)
4. [Migration Best Practices](#migration-best-practices)
5. [Common Migration Patterns](#common-migration-patterns)
6. [Testing Migrations](#testing-migrations)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## Migration Overview

### What are Migrations?
Database migrations are version-controlled scripts that modify your database schema. They allow you to:
- Track database changes over time
- Apply schema changes consistently across environments
- Rollback changes if needed
- Collaborate on database changes with your team

### TypeORM Migration System
Hockey Hub uses TypeORM for database management, which provides:
- Automatic migration generation from entity changes
- Manual migration creation for complex changes
- Up/down migration support
- Transaction support for safe migrations

## Setting Up Migrations

### TypeORM Configuration
Each service has its own TypeORM configuration in `src/config/typeorm.config.ts`:

```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'hockey_hub_service',
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false, // Never use true in production
  logging: process.env.NODE_ENV === 'development',
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  },
});
```

### Package.json Scripts
Add these scripts to each service's `package.json`:

```json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-esm -d src/config/typeorm.config.ts",
    "migration:create": "typeorm-ts-node-esm migration:create -d src/config/typeorm.config.ts",
    "migration:generate": "typeorm-ts-node-esm migration:generate -d src/config/typeorm.config.ts",
    "migration:run": "typeorm-ts-node-esm migration:run -d src/config/typeorm.config.ts",
    "migration:revert": "typeorm-ts-node-esm migration:revert -d src/config/typeorm.config.ts",
    "migration:show": "typeorm-ts-node-esm migration:show -d src/config/typeorm.config.ts"
  }
}
```

## Creating Migrations

### Method 1: Generate from Entity Changes
When you modify entities, TypeORM can automatically generate migrations:

```bash
# After modifying entities
pnpm migration:generate src/migrations/UpdatePlayerEntity
```

### Method 2: Create Empty Migration
For complex changes or data migrations:

```bash
pnpm migration:create src/migrations/AddPlayerStatistics
```

### Migration File Structure
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlayerStatistics1234567890 implements MigrationInterface {
  name = 'AddPlayerStatistics1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Forward migration - apply changes
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse migration - undo changes
  }
}
```

## Migration Best Practices

### 1. Naming Conventions
```bash
# Good naming patterns
CreateUserTable1234567890
AddEmailIndexToUsers1234567891
UpdatePlayerPositionEnum1234567892
AddAuditFieldsToTeams1234567893

# Bad naming patterns
Migration1234567890
UpdateStuff1234567891
Fix1234567892
```

### 2. Atomic Changes
Each migration should be atomic and focused:

```typescript
// ✅ Good: Single focused change
export class AddEmailIndexToUsers1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex('users', new Index('IDX_users_email', ['email']));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_users_email');
  }
}

// ❌ Bad: Multiple unrelated changes
export class UpdateUsersAndTeams1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adding user fields
    await queryRunner.addColumn('users', new Column('phone', 'varchar'));
    // Updating team structure
    await queryRunner.addColumn('teams', new Column('description', 'text'));
    // Creating new table
    await queryRunner.createTable(/* ... */);
  }
}
```

### 3. Reversible Migrations
Always provide proper down methods:

```typescript
export class AddPlayerStatsTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'player_stats',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'player_id',
            type: 'uuid',
          },
          {
            name: 'goals',
            type: 'integer',
            default: 0,
          },
          {
            name: 'assists',
            type: 'integer',
            default: 0,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['player_id'],
            referencedTableName: 'players',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('player_stats');
  }
}
```

### 4. Safe Column Changes
Handle column modifications carefully:

```typescript
export class UpdatePlayerPositionEnum1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new column with new enum
    await queryRunner.addColumn('players', 
      new Column({
        name: 'position_new',
        type: 'enum',
        enum: ['GOALIE', 'DEFENSE', 'FORWARD', 'CENTER', 'LEFT_WING', 'RIGHT_WING'],
        isNullable: true,
      })
    );

    // Step 2: Migrate data
    await queryRunner.query(`
      UPDATE players 
      SET position_new = CASE 
        WHEN position = 'G' THEN 'GOALIE'
        WHEN position = 'D' THEN 'DEFENSE'
        WHEN position = 'F' THEN 'FORWARD'
        ELSE 'FORWARD'
      END
    `);

    // Step 3: Make new column non-nullable
    await queryRunner.changeColumn('players', 'position_new',
      new Column({
        name: 'position_new',
        type: 'enum',
        enum: ['GOALIE', 'DEFENSE', 'FORWARD', 'CENTER', 'LEFT_WING', 'RIGHT_WING'],
        isNullable: false,
      })
    );

    // Step 4: Drop old column
    await queryRunner.dropColumn('players', 'position');

    // Step 5: Rename new column
    await queryRunner.renameColumn('players', 'position_new', 'position');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse the process
    await queryRunner.renameColumn('players', 'position', 'position_new');
    
    await queryRunner.addColumn('players',
      new Column({
        name: 'position',
        type: 'varchar',
        length: '1',
      })
    );

    await queryRunner.query(`
      UPDATE players 
      SET position = CASE 
        WHEN position_new = 'GOALIE' THEN 'G'
        WHEN position_new = 'DEFENSE' THEN 'D'
        ELSE 'F'
      END
    `);

    await queryRunner.dropColumn('players', 'position_new');
  }
}
```

## Common Migration Patterns

### 1. Creating Tables
```typescript
export class CreatePlayersTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'players',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'jersey_number',
            type: 'integer',
          },
          {
            name: 'position',
            type: 'enum',
            enum: ['GOALIE', 'DEFENSE', 'FORWARD'],
          },
          {
            name: 'team_id',
            type: 'uuid',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_players_team_id',
            columnNames: ['team_id'],
          },
          {
            name: 'IDX_players_email',
            columnNames: ['email'],
          },
          {
            name: 'IDX_players_jersey_team',
            columnNames: ['jersey_number', 'team_id'],
            isUnique: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['team_id'],
            referencedTableName: 'teams',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('players');
  }
}
```

### 2. Adding Indexes
```typescript
export class AddPerformanceIndexes1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Single column index
    await queryRunner.createIndex('players', 
      new Index('IDX_players_position', ['position'])
    );

    // Composite index
    await queryRunner.createIndex('game_stats',
      new Index('IDX_game_stats_player_game', ['player_id', 'game_id'])
    );

    // Partial index for active players only
    await queryRunner.query(`
      CREATE INDEX IDX_players_active_team 
      ON players (team_id) 
      WHERE is_active = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('players', 'IDX_players_position');
    await queryRunner.dropIndex('game_stats', 'IDX_game_stats_player_game');
    await queryRunner.query('DROP INDEX IDX_players_active_team');
  }
}
```

### 3. Data Migrations
```typescript
export class MigratePlayerPositions1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migrate data in batches to avoid memory issues
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const players = await queryRunner.query(
        `SELECT id, old_position FROM players 
         WHERE new_position IS NULL 
         LIMIT $1 OFFSET $2`,
        [batchSize, offset]
      );

      if (players.length === 0) {
        hasMore = false;
        break;
      }

      for (const player of players) {
        const newPosition = this.mapOldToNewPosition(player.old_position);
        await queryRunner.query(
          'UPDATE players SET new_position = $1 WHERE id = $2',
          [newPosition, player.id]
        );
      }

      offset += batchSize;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('UPDATE players SET new_position = NULL');
  }

  private mapOldToNewPosition(oldPosition: string): string {
    const mapping: { [key: string]: string } = {
      'G': 'GOALIE',
      'D': 'DEFENSE',
      'LW': 'LEFT_WING',
      'C': 'CENTER',
      'RW': 'RIGHT_WING',
    };
    return mapping[oldPosition] || 'FORWARD';
  }
}
```

### 4. Adding Audit Fields
```typescript
export class AddAuditFields1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = ['players', 'teams', 'games', 'training_sessions'];

    for (const tableName of tables) {
      // Add audit columns
      await queryRunner.addColumn(tableName, 
        new Column({
          name: 'created_by',
          type: 'uuid',
          isNullable: true,
        })
      );

      await queryRunner.addColumn(tableName,
        new Column({
          name: 'updated_by',
          type: 'uuid',
          isNullable: true,
        })
      );

      await queryRunner.addColumn(tableName,
        new Column({
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
        })
      );

      await queryRunner.addColumn(tableName,
        new Column({
          name: 'deleted_by',
          type: 'uuid',
          isNullable: true,
        })
      );

      // Add indexes for soft delete queries
      await queryRunner.createIndex(tableName,
        new Index(`IDX_${tableName}_deleted_at`, ['deleted_at'])
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = ['players', 'teams', 'games', 'training_sessions'];

    for (const tableName of tables) {
      await queryRunner.dropIndex(tableName, `IDX_${tableName}_deleted_at`);
      await queryRunner.dropColumn(tableName, 'created_by');
      await queryRunner.dropColumn(tableName, 'updated_by');
      await queryRunner.dropColumn(tableName, 'deleted_at');
      await queryRunner.dropColumn(tableName, 'deleted_by');
    }
  }
}
```

## Testing Migrations

### 1. Migration Tests
```typescript
// src/__tests__/migrations/AddPlayerStatsTable.test.ts
import { DataSource } from 'typeorm';
import { AddPlayerStatsTable1234567890 } from '../../migrations/1234567890-AddPlayerStatsTable';

describe('AddPlayerStatsTable Migration', () => {
  let dataSource: DataSource;
  let migration: AddPlayerStatsTable1234567890;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      database: 'test_migration',
      synchronize: false,
      dropSchema: true,
    });
    await dataSource.initialize();
    migration = new AddPlayerStatsTable1234567890();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should create player_stats table', async () => {
    await migration.up(dataSource.createQueryRunner());

    const table = await dataSource.getRepository('player_stats').metadata;
    expect(table).toBeDefined();
    expect(table.columns).toHaveLength(4); // id, player_id, goals, assists
  });

  it('should create foreign key constraint', async () => {
    const queryRunner = dataSource.createQueryRunner();
    await migration.up(queryRunner);

    const table = await queryRunner.getTable('player_stats');
    expect(table?.foreignKeys).toHaveLength(1);
    expect(table?.foreignKeys[0].referencedTableName).toBe('players');
  });

  it('should rollback successfully', async () => {
    const queryRunner = dataSource.createQueryRunner();
    
    await migration.up(queryRunner);
    await migration.down(queryRunner);

    const table = await queryRunner.getTable('player_stats');
    expect(table).toBeUndefined();
  });
});
```

### 2. Testing Scripts
```bash
#!/bin/bash
# test-migrations.sh

set -e

echo "Setting up test database..."
dropdb --if-exists test_migrations
createdb test_migrations

echo "Running migrations..."
cd services/user-service
NODE_ENV=test pnpm migration:run

echo "Testing rollback..."
NODE_ENV=test pnpm migration:revert

echo "Re-running migrations..."
NODE_ENV=test pnpm migration:run

echo "All migration tests passed!"
```

## Production Deployment

### 1. Pre-deployment Checklist
- [ ] All migrations tested in staging
- [ ] Backup created
- [ ] Migration rollback plan prepared
- [ ] Database locks considered
- [ ] Downtime requirements communicated

### 2. Safe Deployment Process
```bash
#!/bin/bash
# deploy-migrations.sh

set -e

echo "Creating database backup..."
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

echo "Running migrations..."
pnpm migration:run

echo "Verifying migration status..."
pnpm migration:show

echo "Deployment completed successfully!"
```

### 3. Zero-Downtime Migrations
For large tables or operations that might cause locks:

```typescript
// Example: Adding non-null column with default
export class AddPlayerStatusColumn1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add nullable column
    await queryRunner.addColumn('players',
      new Column({
        name: 'status',
        type: 'enum',
        enum: ['ACTIVE', 'INACTIVE', 'INJURED'],
        isNullable: true,
      })
    );

    // Step 2: Populate in batches
    await this.populateStatusInBatches(queryRunner);

    // Step 3: Make non-nullable in separate migration
    // (This would be a separate migration file)
  }

  private async populateStatusInBatches(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 1000;
    let hasMore = true;
    let lastId = '';

    while (hasMore) {
      const result = await queryRunner.query(`
        UPDATE players 
        SET status = 'ACTIVE'
        WHERE id > $1 AND status IS NULL
        ORDER BY id
        LIMIT $2
        RETURNING id
      `, [lastId, batchSize]);

      if (result.length === 0) {
        hasMore = false;
      } else {
        lastId = result[result.length - 1].id;
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Migration Fails Midway
```bash
# Check migration status
pnpm migration:show

# If migration is marked as executed but actually failed:
# 1. Fix the issue in the migration
# 2. Manually mark as not executed
psql $DATABASE_URL -c "DELETE FROM migrations WHERE name = 'YourMigration1234567890'"

# 3. Run migration again
pnpm migration:run
```

#### 2. Schema Drift
```bash
# Generate migration from current entities vs database
pnpm migration:generate src/migrations/SyncSchema

# Review the generated migration carefully before running
```

#### 3. Foreign Key Constraint Violations
```typescript
// Handle in migration with proper ordering
export class FixForeignKeys1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Temporarily disable foreign key checks
    await queryRunner.query('SET foreign_key_checks = 0');
    
    try {
      // Perform your changes
      await this.performChanges(queryRunner);
    } finally {
      // Re-enable foreign key checks
      await queryRunner.query('SET foreign_key_checks = 1');
    }
  }
}
```

### Recovery Procedures

#### Emergency Rollback
```bash
# Immediate rollback of last migration
pnpm migration:revert

# Rollback multiple migrations
pnpm migration:revert
pnpm migration:revert
# etc.

# Restore from backup if needed
psql $DATABASE_URL < backup_20240101_120000.sql
```

#### Data Recovery
```sql
-- If data was accidentally modified, check if audit trail exists
SELECT * FROM audit_log 
WHERE table_name = 'players' 
  AND operation = 'UPDATE' 
  AND created_at > '2024-01-01 12:00:00'
ORDER BY created_at DESC;

-- Restore specific records if possible
UPDATE players 
SET column_name = old_value
WHERE id IN (/* affected IDs */);
```

This comprehensive migration guide ensures safe, reliable database changes across all environments in the Hockey Hub project.