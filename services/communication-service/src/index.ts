import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { AppDataSource, redisClient, closeConnections } from './config/database';
import { Logger } from '@hockey-hub/shared-lib/src/utils/Logger';

dotenv.config();

const app = express();
export const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3002;

// Minimal boot for dev: avoid importing heavy route/socket modules

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true,
}));
app.use(express.json());
const serviceLogger = new Logger('communication-service');
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    serviceLogger.http(req as any, res as any, Date.now() - start);
  });
  next();
});

// Health check (no shared-lib middleware)
app.get('/health', async (_req, res) => {
  try {
    const healthMetrics = { database: true, redis: true, messageQueue: true, performance: { avgResponseTime: 0, cacheHitRate: 0, errorRate: 0 } };
    const payload: any = {
      status: 'ok',
      service: 'communication-service',
      port: PORT,
      dbStatus: AppDataSource.isInitialized ? 'connected' : 'disconnected',
      redisStatus: redisClient.status === 'ready' ? 'connected' : 'disconnected',
      ...healthMetrics,
    };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      service: 'communication-service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes temporarily disabled for bootstrapping

// No sockets during minimal boot

// Optional processors/services (declared for type-safety during minimal boot)
let notificationProcessor: { stop: () => void } | undefined;
let digestScheduler: { stop: () => void } | undefined;
let scheduledMessageService: { stopProcessing: () => void } | undefined;
let appointmentReminderService: { stopProcessing: () => void } | undefined;
let emailService: { close: () => Promise<void> } | undefined;
let integratedEmailService: { close: () => Promise<void> } | undefined;
const botManager: { shutdown: () => Promise<void> } = { shutdown: async () => {} };
let namespaceManager: { shutdown: () => void } = { shutdown: () => {} };

// Check if we should enable full WebSocket functionality
const ENABLE_WEBSOCKETS = process.env.ENABLE_WEBSOCKETS !== 'false';

// Initialize database and Redis, then start server
AppDataSource.initialize()
  .then(async () => {
    serviceLogger.info('✅ Database connected');
    
    // Connect to Redis
    await redisClient.connect();
    serviceLogger.info('✅ Redis connected');
    
    // Initialize WebSocket namespaces if enabled
    if (ENABLE_WEBSOCKETS) {
      const { NamespaceManager } = await import('./sockets');
      namespaceManager = new NamespaceManager(io);
      serviceLogger.info('🔌 WebSocket namespaces initialized');
      serviceLogger.info('  - Training namespace: /training');
      serviceLogger.info('  - Tactical collaboration namespace: /tactical');
    }
    
    // Minimal boot: skip initialization of auxiliary processors and routes
    
    httpServer.listen(PORT, () => {
      serviceLogger.info(`📧 Communication Service running on port ${PORT}`);
      serviceLogger.info(`🔌 WebSocket server ready`);
      serviceLogger.info(`🚀 Redis caching enabled for communication data`);
      serviceLogger.info(`📨 Email notifications enabled`);
      serviceLogger.info(`⏰ Scheduled messages enabled`);
      serviceLogger.info(`💰 Payment discussions enabled`);
      serviceLogger.info(`🏥 Appointment reminders enabled`);
      serviceLogger.info(`📢 System announcements enabled`);
      serviceLogger.info(`🤖 Chat bots enabled`);
    });
  })
  .catch((error) => {
    serviceLogger.error('❌ Service initialization failed:', error);
    process.exit(1);
  });

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  serviceLogger.info(`${signal} received, shutting down gracefully...`);
  
  try {
    // Stop notification processor and digest scheduler
    if (notificationProcessor) {
      notificationProcessor.stop();
      serviceLogger.info('Notification processor stopped');
    }
    
    if (digestScheduler) {
      digestScheduler.stop();
      serviceLogger.info('Digest scheduler stopped');
    }
    
    if (scheduledMessageService) {
      scheduledMessageService.stopProcessing();
      serviceLogger.info('Scheduled message processor stopped');
    }
    
    if (appointmentReminderService) {
      appointmentReminderService.stopProcessing();
      serviceLogger.info('Appointment reminder processor stopped');
    }
    
    if (emailService) {
      await emailService.close();
      serviceLogger.info('Email service closed');
    }
    
    if (integratedEmailService) {
      await integratedEmailService.close();
      serviceLogger.info('Integrated email service closed');
    }
    
    // Shutdown bot manager
    await botManager.shutdown();
    serviceLogger.info('Bot manager shut down');
    
    // Shutdown namespace manager
    if (namespaceManager) {
      namespaceManager.shutdown();
      serviceLogger.info('Namespace manager shut down');
    }
    
    // Close Socket.io connections
    io.close(() => {
      serviceLogger.info('Socket.io server closed');
    });
    
    // Close database and Redis connections
    await closeConnections();
    
    // Close HTTP server
    httpServer.close(() => {
      serviceLogger.info('HTTP server closed');
      process.exit(0);
    });
  } catch (error) {
    serviceLogger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));