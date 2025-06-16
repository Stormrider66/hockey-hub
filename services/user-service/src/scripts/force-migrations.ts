import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import AppDataSource from '../data-source';

async function forceMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('Database initialized');
    
    // Check migrations table
    const migrations = await AppDataSource.query('SELECT * FROM migrations');
    console.log('\nCurrent migrations in database:');
    console.log(migrations);
    
    // Check pending migrations
    const pending = await AppDataSource.showMigrations();
    console.log('\nPending migrations:', pending);
    
    // Run migrations
    console.log('\nRunning migrations...');
    await AppDataSource.runMigrations({ transaction: 'all' });
    
    // Check tables after migration
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\nTables after migration:');
    tables.forEach((table: any) => {
      console.log(`- ${table.table_name}`);
    });
    
    await AppDataSource.destroy();
    console.log('\nMigrations completed!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

forceMigrations(); 