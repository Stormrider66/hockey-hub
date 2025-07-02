import { AppDataSource } from './src/config/database';

async function runMigrations() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('📦 Running migrations...');
    await AppDataSource.runMigrations();
    
    console.log('✅ Migrations completed successfully!');
    
    // Show applied migrations
    const migrations = await AppDataSource.showMigrations();
    console.log('\nApplied migrations:', migrations);
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();