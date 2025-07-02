import { DataSource } from 'typeorm';
import * as entities from '../entities';

const isTest = process.env.NODE_ENV === 'test';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5437'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: isTest ? process.env.DB_TEST_NAME || 'medical_test' : (process.env.DB_NAME || 'medical'),
  synchronize: isTest || process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: Object.values(entities),
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
});