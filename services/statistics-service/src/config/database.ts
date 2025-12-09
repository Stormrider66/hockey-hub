import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { RedisCacheManager } from '@hockey-hub/shared-lib';
import { 
  PlayerPerformanceStats,
  TeamAnalytics,
  WorkloadAnalytics,
  TrainingStatistics,
  FacilityAnalytics
} from '../entities';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5439'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'hockey_hub_password',
  database: process.env.DB_NAME || 'hockey_hub_statistics',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    'src/entities/**/*.ts',
    PlayerPerformanceStats,
    TeamAnalytics,
    WorkloadAnalytics,
    TrainingStatistics,
    FacilityAnalytics
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
});

export const cacheManager = new RedisCacheManager({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '7'),
});

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('📊 Statistics Service: Database connected successfully');
    
    await cacheManager.connect();
    console.log('📊 Statistics Service: Redis cache connected successfully');
  } catch (error) {
    console.error('📊 Statistics Service: Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase() {
  try {
    await AppDataSource.destroy();
    await cacheManager.disconnect();
    console.log('📊 Statistics Service: Database and cache connections closed');
  } catch (error) {
    console.error('📊 Statistics Service: Error closing connections:', error);
    throw error;
  }
}