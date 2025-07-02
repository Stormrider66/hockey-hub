import { AppDataSource } from '../config/database';
import { User } from '../models/User';

/**
 * This script prepares the database for UUID migration
 * It adds UUID columns alongside existing numeric IDs
 */
async function prepareUuidMigration() {
  try {
    await AppDataSource.initialize();
    console.log('🔄 Preparing database for UUID migration...');

    // Check if we have existing users with numeric IDs
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Check if old users table exists
    const hasUsersTable = await queryRunner.hasTable('users');
    if (hasUsersTable) {
      // Check if it has numeric ID column
      const usersTable = await queryRunner.getTable('users');
      const hasNumericId = usersTable?.columns.some(col => col.name === 'id' && col.type === 'int');
      
      if (hasNumericId) {
        console.log('📊 Found existing users table with numeric IDs');
        
        // Count existing users
        const userCount = await queryRunner.query('SELECT COUNT(*) as count FROM users');
        console.log(`   Found ${userCount[0].count} existing users`);

        // Create backup table
        console.log('💾 Creating backup of existing users table...');
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS users_backup AS 
          SELECT * FROM users
        `);
        console.log('   Backup created: users_backup');

        // Add UUID column if it doesn't exist
        const hasUuidColumn = usersTable?.columns.some(col => col.name === 'uuid');
        if (!hasUuidColumn) {
          console.log('🔧 Adding UUID column to users table...');
          await queryRunner.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid()
          `);
          console.log('   UUID column added');
        }

        // Generate UUIDs for existing records
        console.log('🆔 Generating UUIDs for existing records...');
        await queryRunner.query(`
          UPDATE users 
          SET uuid = gen_random_uuid() 
          WHERE uuid IS NULL
        `);
        console.log('   UUIDs generated');

        // Create mapping table for ID references
        console.log('🗺️  Creating ID mapping table...');
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS id_mappings (
            table_name VARCHAR(100),
            old_id INTEGER,
            new_id UUID,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (table_name, old_id)
          )
        `);

        // Insert mappings
        await queryRunner.query(`
          INSERT INTO id_mappings (table_name, old_id, new_id)
          SELECT 'users', id, uuid FROM users
          ON CONFLICT (table_name, old_id) DO NOTHING
        `);
        console.log('   ID mappings created');
      } else {
        console.log('✅ Users table already using UUIDs');
      }
    } else {
      console.log('📝 No existing users table found - will create fresh with UUIDs');
    }

    await queryRunner.release();
    console.log('✅ UUID migration preparation complete!');
    
  } catch (error) {
    console.error('❌ Error preparing UUID migration:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  prepareUuidMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { prepareUuidMigration };