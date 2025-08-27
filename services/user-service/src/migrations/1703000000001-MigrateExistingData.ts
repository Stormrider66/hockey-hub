import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateExistingData1703000000001 implements MigrationInterface {
  name = 'MigrateExistingData1703000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if we have a backup table with old data
    const hasBackupTable = await queryRunner.hasTable('users_backup');
    
    if (hasBackupTable) {
      console.log('🔄 Migrating existing user data...');
      
      // Check if users_backup has data
      const backupCount = await queryRunner.query('SELECT COUNT(*) as count FROM users_backup');
      
      if (backupCount[0].count > 0) {
        console.log(`   Found ${backupCount[0].count} users to migrate`);
        
        // Create default organization if needed
        const orgResult = await queryRunner.query(`
          INSERT INTO organizations (name, subdomain, subscriptionTier)
          VALUES ('Default Organization', 'default', 'free')
          ON CONFLICT (subdomain) DO UPDATE
          SET name = EXCLUDED.name
          RETURNING id
        `);
        const defaultOrgId = orgResult[0].id;
        console.log(`   Created/found default organization: ${defaultOrgId}`);
        
        // Migrate users with proper field mapping
        await queryRunner.query(`
          INSERT INTO users (
            id,
            email,
            passwordHash,
            firstName,
            lastName,
            isActive,
            emailVerified,
            lastLoginAt,
            refreshToken
          )
          SELECT 
            COALESCE(uuid, gen_random_uuid()),
            email,
            password,
            firstName,
            lastName,
            CASE 
              WHEN status = 'active' THEN true 
              ELSE false 
            END,
            false,
            lastLogin,
            refreshToken
          FROM users_backup
          ON CONFLICT (email) DO NOTHING
        `);
        console.log('   Users migrated');
        
        // Add users to default organization based on their old role
        await queryRunner.query(`
          INSERT INTO user_organizations (userId, organizationId, role)
          SELECT 
            u.id,
            '${defaultOrgId}',
            CASE 
              WHEN ub.role = 'player' THEN 'player'
              WHEN ub.role = 'coach' THEN 'coach'
              WHEN ub.role = 'parent' THEN 'parent'
              WHEN ub.role = 'medical_staff' THEN 'medical_staff'
              WHEN ub.role = 'equipment_manager' THEN 'team_manager'
              WHEN ub.role = 'physical_trainer' THEN 'coach'
              WHEN ub.role = 'club_admin' THEN 'admin'
              WHEN ub.role = 'admin' THEN 'super_admin'
              ELSE 'player'
            END
          FROM users u
          INNER JOIN users_backup ub ON u.email = ub.email
          ON CONFLICT (userId, organizationId) DO NOTHING
        `);
        console.log('   User-organization relationships created');
        
        // Create teams based on team codes if they exist
        await queryRunner.query(`
          INSERT INTO teams (organizationId, name, teamType, season)
          SELECT DISTINCT
            '${defaultOrgId}',
            COALESCE(teamCode, 'Default Team'),
            'recreational',
            '2024'
          FROM users_backup
          WHERE teamCode IS NOT NULL
          ON CONFLICT DO NOTHING
        `);
        
        // Add users to teams based on team codes
        await queryRunner.query(`
          INSERT INTO team_members (teamId, userId, role)
          SELECT 
            t.id,
            u.id,
            CASE 
              WHEN ub.role IN ('player', 'parent') THEN 'player'
              WHEN ub.role = 'coach' THEN 'coach'
              WHEN ub.role = 'physical_trainer' THEN 'coach'
              WHEN ub.role = 'medical_staff' THEN 'medical_staff'
              ELSE 'team_manager'
            END
          FROM users u
          INNER JOIN users_backup ub ON u.email = ub.email
          INNER JOIN teams t ON t.name = ub.teamCode AND t.organizationId = '${defaultOrgId}'
          WHERE ub.teamCode IS NOT NULL
          ON CONFLICT (teamId, userId) DO NOTHING
        `);
        console.log('   Team memberships created');
        
        console.log('✅ Data migration complete');
      }
    } else {
      console.log('ℹ️  No existing data to migrate');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration is not reversible as it transforms data
    console.log('⚠️  Data migration cannot be automatically reversed');
    console.log('   Restore from users_backup table if needed');
  }
}