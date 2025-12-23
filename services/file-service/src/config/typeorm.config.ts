// @ts-nocheck - TypeORM CLI config with entity imports
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import * as entities from '../entities';

// Load environment variables
dotenv.config();

// TypeORM CLI configuration
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5442'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hockey_hub_files',
  entities: Object.values(entities),
  migrations: [`${__dirname}/../migrations/*.{ts,js}`],
  synchronize: false,
  logging: true,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});