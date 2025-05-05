import 'reflect-metadata';
import AppDataSource from '../data-source';

(async () => {
  try {
    const dataSource = await AppDataSource.initialize();
    console.log('Database initialized');
    const pendingMigrations = await dataSource.showMigrations();
    console.log('Pending migrations:', pendingMigrations);
    await dataSource.runMigrations();
    console.log('Migrations executed successfully');
    await dataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Migration run failed', err);
    process.exit(1);
  }
})(); 