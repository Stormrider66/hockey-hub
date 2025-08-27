import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class InitialSchema1703000000000 implements MigrationInterface {
  name = 'InitialSchema1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create organizations table
    await queryRunner.createTable(
      new Table({
        name: 'organizations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'subdomain',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'logoUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'primaryColor',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'secondaryColor',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'subscriptionTier',
            type: 'varchar',
            length: '50',
            default: "'free'",
          },
          {
            name: 'subscriptionExpiresAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'jerseyNumber',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'handedness',
            type: 'enum',
            enum: ['left', 'right', 'ambidextrous'],
            isNullable: true,
          },
          {
            name: 'profileImageUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'emailVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'lastLoginAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'refreshToken',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create teams table
    await queryRunner.createTable(
      new Table({
        name: 'teams',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'organizationId',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'teamType',
            type: 'enum',
            enum: ['youth', 'junior', 'senior', 'recreational'],
          },
          {
            name: 'ageGroup',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'season',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'logoUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create user_organizations table
    await queryRunner.createTable(
      new Table({
        name: 'user_organizations',
        columns: [
          {
            name: 'userId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['player', 'coach', 'assistant_coach', 'team_manager', 'parent', 'medical_staff', 'admin', 'super_admin'],
          },
          {
            name: 'joinedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
        ],
      }),
      true
    );

    // Create team_members table
    await queryRunner.createTable(
      new Table({
        name: 'team_members',
        columns: [
          {
            name: 'teamId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['player', 'coach', 'assistant_coach', 'team_manager', 'medical_staff'],
          },
          {
            name: 'jerseyNumber',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'joinedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'leftAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
        ],
      }),
      true
    );

    // Create parent_child_relationships table
    await queryRunner.createTable(
      new Table({
        name: 'parent_child_relationships',
        columns: [
          {
            name: 'parentUserId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'childUserId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'relationshipType',
            type: 'varchar',
            length: '50',
            default: "'parent'",
          },
          {
            name: 'isPrimaryContact',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex('organizations', new Index({ columnNames: ['subdomain'] }));
    await queryRunner.createIndex('users', new Index({ columnNames: ['email'] }));
    await queryRunner.createIndex('users', new Index({ columnNames: ['isActive'] }));
    await queryRunner.createIndex('teams', new Index({ columnNames: ['organizationId'] }));
    await queryRunner.createIndex('user_organizations', new Index({ columnNames: ['userId'] }));
    await queryRunner.createIndex('user_organizations', new Index({ columnNames: ['organizationId'] }));
    await queryRunner.createIndex('user_organizations', new Index({ columnNames: ['role'] }));
    await queryRunner.createIndex('team_members', new Index({ columnNames: ['teamId'] }));
    await queryRunner.createIndex('team_members', new Index({ columnNames: ['userId'] }));
    await queryRunner.createIndex('team_members', new Index({ columnNames: ['isActive'] }));

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE teams 
      ADD CONSTRAINT FK_teams_organization 
      FOREIGN KEY (organizationId) 
      REFERENCES organizations(id) 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE user_organizations 
      ADD CONSTRAINT FK_user_organizations_user 
      FOREIGN KEY (userId) 
      REFERENCES users(id) 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE user_organizations 
      ADD CONSTRAINT FK_user_organizations_organization 
      FOREIGN KEY (organizationId) 
      REFERENCES organizations(id) 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE team_members 
      ADD CONSTRAINT FK_team_members_team 
      FOREIGN KEY (teamId) 
      REFERENCES teams(id) 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE team_members 
      ADD CONSTRAINT FK_team_members_user 
      FOREIGN KEY (userId) 
      REFERENCES users(id) 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE parent_child_relationships 
      ADD CONSTRAINT FK_parent_child_parent 
      FOREIGN KEY (parentUserId) 
      REFERENCES users(id) 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE parent_child_relationships 
      ADD CONSTRAINT FK_parent_child_child 
      FOREIGN KEY (childUserId) 
      REFERENCES users(id) 
      ON DELETE CASCADE
    `);

    // Add unique constraint for team names within organization
    await queryRunner.query(`
      ALTER TABLE teams 
      ADD CONSTRAINT unique_team_name 
      UNIQUE (organizationId, name, season)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query('ALTER TABLE parent_child_relationships DROP CONSTRAINT FK_parent_child_child');
    await queryRunner.query('ALTER TABLE parent_child_relationships DROP CONSTRAINT FK_parent_child_parent');
    await queryRunner.query('ALTER TABLE team_members DROP CONSTRAINT FK_team_members_user');
    await queryRunner.query('ALTER TABLE team_members DROP CONSTRAINT FK_team_members_team');
    await queryRunner.query('ALTER TABLE user_organizations DROP CONSTRAINT FK_user_organizations_organization');
    await queryRunner.query('ALTER TABLE user_organizations DROP CONSTRAINT FK_user_organizations_user');
    await queryRunner.query('ALTER TABLE teams DROP CONSTRAINT FK_teams_organization');

    // Drop tables
    await queryRunner.dropTable('parent_child_relationships', true);
    await queryRunner.dropTable('team_members', true);
    await queryRunner.dropTable('user_organizations', true);
    await queryRunner.dropTable('teams', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.dropTable('organizations', true);
  }
}