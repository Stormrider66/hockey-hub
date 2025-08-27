import { MigrationInterface, QueryRunner, Index } from 'typeorm';

export class AddPerformanceIndexes1703000000002 implements MigrationInterface {
  name = 'AddPerformanceIndexes1703000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Composite indexes for common queries
    
    // Users table - common search patterns
    await queryRunner.createIndex('users', new Index({
      name: 'idx_users_email_active',
      columnNames: ['email', 'isActive'],
      where: 'deletedAt IS NULL'
    }));

    await queryRunner.createIndex('users', new Index({
      name: 'idx_users_name_search',
      columnNames: ['firstName', 'lastName', 'isActive'],
      where: 'deletedAt IS NULL'
    }));

    await queryRunner.createIndex('users', new Index({
      name: 'idx_users_created_active',
      columnNames: ['createdAt', 'isActive'],
      where: 'deletedAt IS NULL'
    }));

    // User organizations - frequent joins
    await queryRunner.createIndex('user_organizations', new Index({
      name: 'idx_user_orgs_composite',
      columnNames: ['userId', 'organizationId', 'role', 'isActive']
    }));

    await queryRunner.createIndex('user_organizations', new Index({
      name: 'idx_user_orgs_org_role',
      columnNames: ['organizationId', 'role', 'isActive']
    }));

    // Team members - frequent queries
    await queryRunner.createIndex('team_members', new Index({
      name: 'idx_team_members_composite',
      columnNames: ['teamId', 'userId', 'role', 'isActive']
    }));

    await queryRunner.createIndex('team_members', new Index({
      name: 'idx_team_members_user_active',
      columnNames: ['userId', 'isActive'],
      where: 'leftAt IS NULL'
    }));

    // Teams - organization queries
    await queryRunner.createIndex('teams', new Index({
      name: 'idx_teams_org_active',
      columnNames: ['organizationId', 'isActive', 'season'],
      where: 'deletedAt IS NULL'
    }));

    // Parent-child relationships
    await queryRunner.createIndex('parent_child_relationships', new Index({
      name: 'idx_parent_child_primary',
      columnNames: ['parentUserId', 'isPrimaryContact']
    }));

    // Partial indexes for soft deletes
    await queryRunner.createIndex('users', new Index({
      name: 'idx_users_not_deleted',
      columnNames: ['id'],
      where: 'deletedAt IS NULL'
    }));

    await queryRunner.createIndex('organizations', new Index({
      name: 'idx_orgs_not_deleted',
      columnNames: ['id'],
      where: 'deletedAt IS NULL'
    }));

    await queryRunner.createIndex('teams', new Index({
      name: 'idx_teams_not_deleted',
      columnNames: ['id'],
      where: 'deletedAt IS NULL'
    }));

    // Full text search indexes (PostgreSQL specific)
    await queryRunner.query(`
      CREATE INDEX idx_users_fulltext_search 
      ON users 
      USING gin(to_tsvector('english', firstName || ' ' || lastName || ' ' || COALESCE(email, '')))
      WHERE deletedAt IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_organizations_fulltext_search 
      ON organizations 
      USING gin(to_tsvector('english', name))
      WHERE deletedAt IS NULL
    `);

    // Statistics and monitoring
    await queryRunner.query(`
      -- Enable pg_stat_statements for query performance monitoring
      CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
    `);

    // Create materialized view for user statistics
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW user_statistics AS
      SELECT 
        o.id as organization_id,
        o.name as organization_name,
        COUNT(DISTINCT uo.userId) as total_users,
        COUNT(DISTINCT CASE WHEN u.isActive = true THEN uo.userId END) as active_users,
        COUNT(DISTINCT CASE WHEN uo.role = 'player' THEN uo.userId END) as total_players,
        COUNT(DISTINCT CASE WHEN uo.role = 'coach' THEN uo.userId END) as total_coaches,
        COUNT(DISTINCT CASE WHEN uo.role = 'parent' THEN uo.userId END) as total_parents,
        COUNT(DISTINCT tm.teamId) as total_teams
      FROM organizations o
      LEFT JOIN user_organizations uo ON o.id = uo.organizationId
      LEFT JOIN users u ON uo.userId = u.id
      LEFT JOIN teams t ON o.id = t.organizationId
      LEFT JOIN team_members tm ON t.id = tm.teamId
      WHERE o.deletedAt IS NULL
      GROUP BY o.id, o.name;
    `);

    // Create index on materialized view
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_user_statistics_org 
      ON user_statistics(organization_id);
    `);

    // Add BRIN indexes for time-series data (very efficient for large tables)
    await queryRunner.query(`
      CREATE INDEX idx_users_created_brin 
      ON users 
      USING brin(createdAt);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_users_updated_brin 
      ON users 
      USING brin(updatedAt);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.dropIndex('users', 'idx_users_updated_brin');
    await queryRunner.dropIndex('users', 'idx_users_created_brin');
    
    await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS user_statistics');
    
    await queryRunner.dropIndex('organizations', 'idx_organizations_fulltext_search');
    await queryRunner.dropIndex('users', 'idx_users_fulltext_search');
    
    await queryRunner.dropIndex('teams', 'idx_teams_not_deleted');
    await queryRunner.dropIndex('organizations', 'idx_orgs_not_deleted');
    await queryRunner.dropIndex('users', 'idx_users_not_deleted');
    
    await queryRunner.dropIndex('parent_child_relationships', 'idx_parent_child_primary');
    await queryRunner.dropIndex('teams', 'idx_teams_org_active');
    await queryRunner.dropIndex('team_members', 'idx_team_members_user_active');
    await queryRunner.dropIndex('team_members', 'idx_team_members_composite');
    await queryRunner.dropIndex('user_organizations', 'idx_user_orgs_org_role');
    await queryRunner.dropIndex('user_organizations', 'idx_user_orgs_composite');
    await queryRunner.dropIndex('users', 'idx_users_created_active');
    await queryRunner.dropIndex('users', 'idx_users_name_search');
    await queryRunner.dropIndex('users', 'idx_users_email_active');
  }
}