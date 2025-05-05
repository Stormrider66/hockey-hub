import 'reflect-metadata';
import AppDataSource from '../data-source';

/**
 * This script resets the database schema and runs migrations from scratch.
 * WARNING: This will DROP ALL TABLES in the database. Use only in development or testing.
 */
(async () => {
  try {
    console.log('Initializing connection...');
    const dataSource = await AppDataSource.initialize();
    console.log('Database initialized');

    console.log('Dropping all tables...');
    await dataSource.dropDatabase();
    console.log('Database schema dropped');

    console.log('Running migrations...');
    const migrations = await dataSource.runMigrations({ transaction: 'all' });
    console.log(`Executed ${migrations.length} migrations:`, migrations.map(m => m.name));

    console.log('Database reset and migrations applied successfully');
    await dataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Database reset failed:', err);
    process.exit(1);
  }
})(); 