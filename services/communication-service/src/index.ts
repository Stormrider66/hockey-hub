import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { AppDataSource, redisClient, closeConnections } from './config/database';
import { conversationRoutes, messageRoutes, presenceRoutes, notificationRoutes, dashboardRoutes, pushRoutes, encryptionRoutes, privacyRoutes, smsRoutes, broadcastRoutes, announcementRoutes, trainingDiscussionRoutes, parentCommunicationRoutes, privateCoachChannelRoutes, paymentDiscussionRoutes, scheduleClarificationRoutes, urgentMedicalNotificationRoutes, createMedicalDiscussionRoutes, systemAnnouncementRoutes, chatAnalyticsRoutes, eventConversationRoutes } from './routes';
import moderationRoutes from './routes/moderationRoutes';
import scheduledMessageRoutes from './routes/scheduledMessageRoutes';
import emailRoutes from './routes/emailRoutes';
import preferencesRoutes from './routes/preferencesRoutes';
import cacheRoutes from './routes/cacheRoutes';
import botRoutes from './routes/botRoutes';
import { createAppointmentReminderRoutes } from './routes/appointmentReminderRoutes';
import { errorHandler, requestLogger, logger } from '@hockey-hub/shared-lib';
import { socketAuthMiddleware, ChatHandler } from './sockets';
import { CachedCommunicationService } from './services/CachedCommunicationService';
import { EmailService, NotificationProcessor, DigestEmailScheduler, ScheduledMessageService, BroadcastService, NotificationService } from './services';
import { SystemAnnouncementService } from './services/SystemAnnouncementService';
import { IntegratedEmailService } from './services/IntegratedEmailService';
import { PaymentDiscussionService } from './services/PaymentDiscussionService';
import { AppointmentReminderService } from './services/AppointmentReminderService';
import { botManager } from './bots/BotManager';
import { OptimizedSocketManager } from './sockets/OptimizedSocketManager';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    credentials: true,
  },
  path: '/socket.io/',
});

const PORT = process.env.PORT || 3002;

// Initialize cached service
const cachedService = new CachedCommunicationService();

// Initialize email and notification services (will be started after DB connection)
let emailService: EmailService;
let integratedEmailService: IntegratedEmailService;
let notificationProcessor: NotificationProcessor;
let digestScheduler: DigestEmailScheduler;
let scheduledMessageService: ScheduledMessageService;
let broadcastService: BroadcastService;
let paymentDiscussionService: PaymentDiscussionService;
let appointmentReminderService: AppointmentReminderService;
let notificationService: NotificationService;
let systemAnnouncementService: SystemAnnouncementService;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', async (req, res) => {
  try {
    const healthMetrics = await cachedService.getHealthMetrics();
    res.json({ 
      status: 'ok', 
      service: 'communication-service', 
      port: PORT,
      database: AppDataSource.isInitialized ? 'connected' : 'disconnected',
      redis: redisClient.status === 'ready' ? 'connected' : 'disconnected',
      ...healthMetrics
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      service: 'communication-service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', pushRoutes);
app.use('/api/encryption', encryptionRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/scheduled-messages', scheduledMessageRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/training-discussions', trainingDiscussionRoutes);
app.use('/api/parent-communications', parentCommunicationRoutes);
app.use('/api/private-coach-channels', privateCoachChannelRoutes);
app.use('/api/payment-discussions', paymentDiscussionRoutes);
app.use('/api/schedule-clarifications', scheduleClarificationRoutes);
app.use('/api/medical', urgentMedicalNotificationRoutes);
app.use('/api/system-announcements', systemAnnouncementRoutes);
app.use('/api/chat-analytics', chatAnalyticsRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/event-conversations', eventConversationRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/bots', botRoutes);

// Medical discussion and appointment reminder routes will be added after DataSource initialization
let medicalDiscussionRoutes: any;
let appointmentReminderRoutes: any;

// Error handling
app.use(errorHandler);

// Socket.io setup
let chatHandler: ChatHandler;

// Apply authentication middleware to Socket.io
io.use(socketAuthMiddleware);

// Handle socket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'userId:', (socket as any).userId);
  
  // Initialize chat handler if not already done
  if (!chatHandler) {
    chatHandler = new ChatHandler(io);
  }
  
  // Handle the connection
  chatHandler.handleConnection(socket as any);
});

// Initialize database and Redis, then start server
AppDataSource.initialize()
  .then(async () => {
    logger.info('✅ Database connected');
    
    // Connect to Redis
    await redisClient.connect();
    logger.info('✅ Redis connected');
    
    // Initialize email service
    emailService = new EmailService({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      },
      from: process.env.EMAIL_FROM || 'noreply@hockeyhub.com',
      replyTo: process.env.EMAIL_REPLY_TO
    });

    // Initialize integrated email service with SendGrid
    integratedEmailService = new IntegratedEmailService({
      sendGrid: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@hockeyhub.com',
          name: process.env.SENDGRID_FROM_NAME || 'Hockey Hub'
        },
        replyTo: process.env.SENDGRID_REPLY_TO,
        sandboxMode: process.env.NODE_ENV === 'development',
        trackingSettings: {
          clickTracking: true,
          openTracking: true,
          subscriptionTracking: true
        }
      },
      queue: {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD
        },
        concurrency: 5,
        maxAttempts: 3
      },
      baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      logoUrl: process.env.LOGO_URL || 'http://localhost:3000/logo.png'
    });

    // Make services available to routes
    app.locals.emailService = integratedEmailService;
    app.locals.sendGridService = integratedEmailService;
    
    // Initialize notification service (needed for appointment reminders)
    notificationService = new NotificationService();
    
    // Initialize medical discussion routes with DataSource
    medicalDiscussionRoutes = createMedicalDiscussionRoutes(AppDataSource);
    app.use('/api/medical/discussions', medicalDiscussionRoutes);
    logger.info('✅ Medical discussion routes initialized');
    
    // Initialize appointment reminder service and routes
    appointmentReminderService = new AppointmentReminderService(notificationService);
    appointmentReminderRoutes = createAppointmentReminderRoutes(appointmentReminderService);
    app.use('/api/appointment-reminders', appointmentReminderRoutes);
    logger.info('✅ Appointment reminder routes initialized');
    
    // Initialize notification processor
    notificationProcessor = new NotificationProcessor(
      AppDataSource,
      emailService,
      io
    );
    notificationProcessor.start();
    logger.info('✅ Notification processor started');
    
    // Initialize digest scheduler
    digestScheduler = new DigestEmailScheduler(
      AppDataSource,
      emailService
    );
    digestScheduler.start();
    logger.info('✅ Digest email scheduler started');
    
    // Initialize scheduled message service
    scheduledMessageService = new ScheduledMessageService();
    scheduledMessageService.startProcessing(30000); // Check every 30 seconds
    logger.info('✅ Scheduled message processor started');
    
    // Initialize broadcast service
    broadcastService = new BroadcastService();
    // Start scheduled broadcast processor
    setInterval(async () => {
      try {
        await broadcastService.processScheduledBroadcasts();
      } catch (error) {
        logger.error('Error processing scheduled broadcasts:', error);
      }
    }, 60000); // Check every minute
    logger.info('✅ Broadcast processor started');
    
    // Initialize payment discussion service and reminder processor
    paymentDiscussionService = new PaymentDiscussionService();
    setInterval(async () => {
      try {
        await paymentDiscussionService.processScheduledReminders();
      } catch (error) {
        logger.error('Error processing payment reminders:', error);
      }
    }, 60000); // Check every minute
    logger.info('✅ Payment reminder processor started');
    
    // Start appointment reminder processor
    appointmentReminderService.startProcessing(60000); // Check every minute
    logger.info('✅ Appointment reminder processor started');
    
    // Initialize system announcement service
    systemAnnouncementService = new SystemAnnouncementService();
    // Start scheduled system announcement processor
    setInterval(async () => {
      try {
        await systemAnnouncementService.processScheduledSystemAnnouncements();
      } catch (error) {
        logger.error('Error processing scheduled system announcements:', error);
      }
    }, 60000); // Check every minute
    logger.info('✅ System announcement processor started');
    
    // Initialize bot manager with socket manager
    const socketManager = new OptimizedSocketManager(io);
    await botManager.initialize(socketManager);
    logger.info('✅ Bot manager initialized');
    
    httpServer.listen(PORT, () => {
      logger.info(`📧 Communication Service running on port ${PORT}`);
      logger.info(`🔌 WebSocket server ready`);
      logger.info(`🚀 Redis caching enabled for communication data`);
      logger.info(`📨 Email notifications enabled`);
      logger.info(`⏰ Scheduled messages enabled`);
      logger.info(`💰 Payment discussions enabled`);
      logger.info(`🏥 Appointment reminders enabled`);
      logger.info(`📢 System announcements enabled`);
      logger.info(`🤖 Chat bots enabled`);
    });
  })
  .catch((error) => {
    logger.error('❌ Service initialization failed:', error);
    process.exit(1);
  });

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  try {
    // Stop notification processor and digest scheduler
    if (notificationProcessor) {
      notificationProcessor.stop();
      logger.info('Notification processor stopped');
    }
    
    if (digestScheduler) {
      digestScheduler.stop();
      logger.info('Digest scheduler stopped');
    }
    
    if (scheduledMessageService) {
      scheduledMessageService.stopProcessing();
      logger.info('Scheduled message processor stopped');
    }
    
    if (appointmentReminderService) {
      appointmentReminderService.stopProcessing();
      logger.info('Appointment reminder processor stopped');
    }
    
    if (emailService) {
      await emailService.close();
      logger.info('Email service closed');
    }
    
    if (integratedEmailService) {
      await integratedEmailService.close();
      logger.info('Integrated email service closed');
    }
    
    // Shutdown bot manager
    await botManager.shutdown();
    logger.info('Bot manager shut down');
    
    // Close Socket.io connections
    io.close(() => {
      logger.info('Socket.io server closed');
    });
    
    // Close database and Redis connections
    await closeConnections();
    
    // Close HTTP server
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));