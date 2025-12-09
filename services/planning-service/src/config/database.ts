import { DataSource } from 'typeorm';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

export let redisClient: RedisClientType;
export let isRedisConnected = false;

const initializeRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.warn('Redis URL not configured, caching will be disabled');
    return;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
      isRedisConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
      isRedisConnected = true;
    });

    redisClient.on('end', () => {
      console.log('Redis Client Disconnected');
      isRedisConnected = false;
    });

    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    isRedisConnected = false;
  }
};

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5438'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hockey_hub_planning',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/../entities/*.{js,ts}'],
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
  subscribers: [],
  // Defer enabling TypeORM cache until after Redis connects; we'll manage caching manually in repositories
  cache: false,
});

export const connectToDatabase = async () => {
  try {
    // Initialize Redis first
    await initializeRedis();
    
    // Then connect to PostgreSQL
    await AppDataSource.initialize();
    console.log('Database connection established');
    // Optional: enable schema sync only when explicitly requested
    if (process.env.PLAN_SYNC === '1') {
      await AppDataSource.synchronize();
      console.log('Database schema synchronized');
    }
    
    // Set up graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
      if (redisClient && isRedisConnected) {
        await redisClient.quit();
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};