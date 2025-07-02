import { DataSource, DataSourceOptions } from 'typeorm';
import * as entities from '../entities';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5436'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hockey_hub_training',
  synchronize: false, // Never use synchronize in production
  logging: process.env.NODE_ENV === 'development',
  entities: Object.values(entities),
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  subscribers: [path.join(__dirname, '../subscribers/*{.ts,.js}')],
};

export default config;

// For TypeORM CLI
export const AppDataSource = new DataSource(config);