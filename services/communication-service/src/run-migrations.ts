import { dataSource } from './config/typeorm.config';
import { Logger } from '@hockey-hub/shared-lib';

const logger = new Logger('communication-migrations');

async function runMigrations() {
  try {
    logger.info('Initializing database connection...');
    await dataSource.initialize();
    
    logger.info('Running pending migrations...');
    const migrations = await dataSource.runMigrations();
    
    if (migrations.length === 0) {
      logger.info('No pending migrations to run');
    } else {
      logger.info(`Successfully ran ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        logger.info(`  - ${migration.name}`);
      });
    }
    
    await dataSource.destroy();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();