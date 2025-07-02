import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../config/database';
import { EmailTemplateSeeder } from '../seeds/EmailTemplateSeeder';
import { Logger } from '@hockey-hub/shared-lib';

dotenv.config();

const logger = new Logger('SeedEmailTemplates');

async function seedEmailTemplates() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    logger.info('Database connected');

    // Run seeder
    const seeder = new EmailTemplateSeeder();
    await seeder.seed(AppDataSource);

    logger.info('Email template seeding completed successfully');
  } catch (error) {
    logger.error('Failed to seed email templates:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

// Run the script
seedEmailTemplates();