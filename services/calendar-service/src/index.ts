import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AppDataSource, initializeDatabase } from './config/database';
import eventRoutes from './routes/eventRoutes';
import resourceRoutes from './routes/resourceRoutes';
import trainingIntegrationRoutes from './routes/trainingIntegrationRoutes';
import { ReminderScheduler } from './services/ReminderScheduler';
import { initializeCache, closeCache, errorHandler } from '@hockey-hub/shared-lib';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'calendar-service', 
    port: PORT,
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected' 
  });
});

// API routes
app.use('/api/events', eventRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/training', trainingIntegrationRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    // Initialize Redis cache
    try {
      await initializeCache({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '3'),
      });
      console.log('✅ Calendar Service Redis cache initialized');
    } catch (error) {
      console.warn('⚠️ Redis cache initialization failed, continuing without cache:', error);
    }
    
    // Initialize reminder scheduler
    const reminderScheduler = new ReminderScheduler();
    reminderScheduler.start();
    
    // Run conflict checking every hour
    setInterval(() => {
      reminderScheduler.checkScheduleConflicts();
    }, 60 * 60 * 1000); // 1 hour
    
    // Run RSVP reminders every 6 hours
    setInterval(() => {
      reminderScheduler.scheduleRSVPReminders();
    }, 6 * 60 * 60 * 1000); // 6 hours
    
    app.listen(PORT, () => {
      console.log(`📅 Calendar Service running on port ${PORT}`);
      console.log(`⏰ Reminder scheduler initialized`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      try {
        await closeCache();
        console.log('✅ Cache connection closed');
      } catch (error) {
        console.warn('Cache close error:', error);
      }
      reminderScheduler.stop();
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start calendar service:', error);
    process.exit(1);
  }
};

startServer();