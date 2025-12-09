import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import * as entities from '../entities';
import dotenv from 'dotenv';
// Avoid importing the shared-lib root during migrations to prevent DTO side effects
const logger = {
  info: (...args: any[]) => console.log('[communication-database]', ...args),
  error: (...args: any[]) => console.error('[communication-database]', ...args),
  debug: (...args: any[]) => console.debug('[communication-database]', ...args),
  warn: (...args: any[]) => console.warn('[communication-database]', ...args),
};


dotenv.config();

const shouldSynchronize = (process.env.DB_SYNCHRONIZE || '').toLowerCase() === 'true';
const shouldLog = (process.env.DB_LOGGING || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'development';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5435'), // Communication service uses port 5435
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hockey_hub_communication',
  synchronize: shouldSynchronize, // Enable in dev to bootstrap schema if migrations are problematic
  logging: shouldLog,
  entities: [
    entities.Conversation,
    entities.ConversationParticipant,
    entities.Message,
    entities.MessageAttachment,
    entities.MessageReaction,
    entities.MessageReadReceipt,
    entities.Notification,
    entities.NotificationPreference,
    entities.NotificationQueue,
    entities.NotificationTemplate,
    entities.UserPresence,
    entities.PushSubscription,
    entities.UserEncryptionKey,
    entities.BlockedUser,
    entities.PrivacySettings,
    entities.Broadcast,
    entities.BroadcastRecipient,
    entities.TrainingDiscussion,
    entities.ExerciseDiscussion,
    entities.ParentCommunication,
    entities.ParentCommunicationAttachment,
    entities.ParentCommunicationReminder,
    entities.ParentCommunicationTemplate,
    entities.CoachAvailability,
    entities.MeetingRequest,
    entities.ScheduledMessage,
    entities.PaymentDiscussion,
    entities.PaymentDiscussionAttachment,
    entities.PaymentDiscussionReminder,
    entities.PerformanceDiscussion,
    entities.PerformanceFeedback
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  migrationsRun: process.env.NODE_ENV === 'production', // Auto-run migrations in production
});

// Redis configuration for caching
export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '3'), // Use DB 3 for Communication Service
  keyPrefix: 'comm:',
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Redis event handlers
redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

redisClient.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redisClient.on('ready', () => {
  logger.info('Redis is ready for communication service');
});

// Graceful shutdown
export const closeConnections = async () => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Error closing connections:', error);
  }
};