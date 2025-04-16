import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';
import logger from './config/logger'; // Import logger

// Load environment variables from .env file
dotenv.config();

// Define the base path for entities (adjust if your structure is different)
const entitiesPath = path.join(__dirname, './entities/**/*{.ts,.js}');
// TODO: Define paths for migrations if you use them
// const migrationsPath = path.join(__dirname, './migrations/**/*{.ts,.js}');

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: process.env.NODE_ENV === 'development', // Auto-create schema in dev, disable in prod
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'], // Log queries in dev
  entities: [entitiesPath],
  migrations: [], // Add migrations path here if used
  subscribers: [],
  // ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Optional: Enable SSL if needed
};

// Validate essential DB configuration
if (!dataSourceOptions.username || !dataSourceOptions.password || !dataSourceOptions.database) {
  logger.fatal('FATAL ERROR: DB_USERNAME, DB_PASSWORD, and DB_DATABASE environment variables are required.'); // Use logger.fatal
  process.exit(1);
}

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource; 