import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authMiddleware, createLoggingMiddleware, errorHandler } from '@hockey-hub/shared-lib';
import { initializeDatabase, AppDataSource, cacheManager } from './config/database';
import { CachedStatisticsService } from './services/CachedStatisticsService';
import { 
  CachedPlayerPerformanceRepository,
  CachedTeamAnalyticsRepository,
  CachedWorkloadAnalyticsRepository
} from './repositories';
import { 
  PlayerPerformanceStats,
  TeamAnalytics,
  WorkloadAnalytics
} from './entities';
import { createDashboardRoutes } from './routes/dashboardRoutes';
import { createPlayerPerformanceRoutes } from './routes/playerPerformanceRoutes';
import { createTeamAnalyticsRoutes } from './routes/teamAnalyticsRoutes';
import { createWorkloadRoutes } from './routes/workloadRoutes';
import { createPredictiveAnalyticsRoutes } from './routes/predictiveAnalyticsRoutes';
import { createWorkoutAnalyticsRoutes } from './routes/workoutAnalyticsRoutes';
import reportRoutes from './routes/reportRoutes';
import exportRoutes from './routes/exportRoutes';

// New Phase 6 services
import { StatisticsWebSocketClient } from './websocket/StatisticsWebSocketClient';
import { MetricsCollectionService } from './services/MetricsCollectionService';
import { WorkoutSummaryService } from './services/WorkoutSummaryService';
import { TeamPerformanceReportService } from './services/TeamPerformanceReportService';
import { IndividualProgressTrackingService } from './services/IndividualProgressTrackingService';

// Export services
import { EnhancedExportService } from './services/EnhancedExportService';
import { CSVExportService } from './services/CSVExportService';
import { ScheduledReportingService } from './services/ScheduledReportingService';
import { EmailService } from './services/EmailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

// Initialize services
let statisticsService: CachedStatisticsService;
let playerPerformanceRepo: CachedPlayerPerformanceRepository;
let teamAnalyticsRepo: CachedTeamAnalyticsRepository;
let workloadAnalyticsRepo: CachedWorkloadAnalyticsRepository;

// Phase 6 services
let metricsCollectionService: MetricsCollectionService;
let workoutSummaryService: WorkoutSummaryService;
let teamPerformanceReportService: TeamPerformanceReportService;
let individualProgressTrackingService: IndividualProgressTrackingService;
let statisticsWebSocketClient: StatisticsWebSocketClient;

// Export services
let enhancedExportService: EnhancedExportService;
let csvExportService: CSVExportService;
let scheduledReportingService: ScheduledReportingService;
let emailService: EmailService;

async function initializeServices() {
  try {
    // Initialize database and cache
    await initializeDatabase();
    
    // Initialize repositories
    playerPerformanceRepo = new CachedPlayerPerformanceRepository(
      AppDataSource.getRepository(PlayerPerformanceStats),
      cacheManager
    );
    
    teamAnalyticsRepo = new CachedTeamAnalyticsRepository(
      AppDataSource.getRepository(TeamAnalytics),
      cacheManager
    );
    
    workloadAnalyticsRepo = new CachedWorkloadAnalyticsRepository(
      AppDataSource.getRepository(WorkloadAnalytics),
      cacheManager
    );
    
    // Initialize main service
    statisticsService = new CachedStatisticsService(AppDataSource, cacheManager);
    
    // Initialize Phase 6 services
    metricsCollectionService = new MetricsCollectionService(AppDataSource);
    workoutSummaryService = new WorkoutSummaryService(AppDataSource);
    teamPerformanceReportService = new TeamPerformanceReportService(AppDataSource);
    individualProgressTrackingService = new IndividualProgressTrackingService(AppDataSource);
    
    // Initialize export services
    emailService = new EmailService();
    enhancedExportService = new EnhancedExportService();
    csvExportService = new CSVExportService();
    scheduledReportingService = new ScheduledReportingService(
      enhancedExportService,
      csvExportService,
      emailService
    );
    
    // Initialize WebSocket client to Communication Service
    statisticsWebSocketClient = new StatisticsWebSocketClient(
      metricsCollectionService,
      workoutSummaryService
    );
    
    // Connect to Communication Service WebSocket
    try {
      await statisticsWebSocketClient.connect();
      console.log('📊 Statistics Service: Connected to Communication Service WebSocket');
    } catch (error) {
      console.warn('📊 Statistics Service: Failed to connect to WebSocket, will retry:', error);
      // Continue without WebSocket - it will retry automatically
    }
    
    console.log('📊 Statistics Service: All services initialized successfully');
  } catch (error) {
    console.error('📊 Statistics Service: Failed to initialize services:', error);
    throw error;
  }
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(createLoggingMiddleware({
  serviceName: 'statistics-service',
  skipPaths: ['/health', '/metrics'],
  logHeaders: false,
  logBody: false
}));

// Health check (public route)
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'statistics-service', 
    port: PORT,
    timestamp: new Date().toISOString(),
    cache: cacheManager.isConnected() ? 'connected' : 'disconnected',
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected'
  });
});

// API Routes (after service initialization)
app.get('/api/ready', (_req, res) => {
  const servicesReady = statisticsService && 
                       playerPerformanceRepo && 
                       teamAnalyticsRepo && 
                       workloadAnalyticsRepo &&
                       metricsCollectionService &&
                       workoutSummaryService &&
                       teamPerformanceReportService &&
                       individualProgressTrackingService;
  
  if (servicesReady) {
    res.json({ 
      ready: true, 
      services: 'all_initialized',
      websocketConnected: statisticsWebSocketClient?.isSocketConnected() || false,
      phase6Status: 'operational'
    });
  } else {
    res.status(503).json({ ready: false, error: 'Services not yet initialized' });
  }
});

// Initialize services and then set up routes
initializeServices().then(() => {
  // Dashboard routes (highest priority for performance)
  app.use('/api/dashboard', createDashboardRoutes(statisticsService));
  
  // Feature-specific routes
  app.use('/api/players', createPlayerPerformanceRoutes(playerPerformanceRepo));
  app.use('/api/teams', createTeamAnalyticsRoutes(teamAnalyticsRepo));
  app.use('/api/workload', createWorkloadRoutes(workloadAnalyticsRepo));
  
  // Predictive analytics routes
  app.use('/api/predictive', createPredictiveAnalyticsRoutes(AppDataSource, cacheManager));
  
  // Phase 6: Workout analytics routes
  app.use('/api/workout-analytics', createWorkoutAnalyticsRoutes(AppDataSource, workoutSummaryService));
  
  // Report generation routes
  app.use('/api/reports', reportRoutes);
  
  // Export routes
  app.use('/api/statistics/export', exportRoutes);
  
  // Phase 6: Team performance reports
  app.get('/api/teams/:teamId/performance-report', authMiddleware, async (req, res) => {
    try {
      const { teamId } = req.params;
      const { startDate, endDate, reportType = 'monthly' } = req.query as {
        startDate?: string;
        endDate?: string;
        reportType?: 'weekly' | 'monthly' | 'seasonal';
      };

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const report = await teamPerformanceReportService.generateTeamReport(
        teamId,
        start,
        end,
        reportType as 'weekly' | 'monthly' | 'seasonal'
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('📊 Failed to generate team performance report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate team performance report',
      });
    }
  });

  // Phase 6: Individual progress profiles
  app.get('/api/players/:playerId/progress-profile', authMiddleware, async (req, res) => {
    try {
      const { playerId } = req.params;
      const { lookbackMonths = 6 } = req.query as { lookbackMonths?: string };

      const profile = await individualProgressTrackingService.generatePlayerProgressProfile(
        playerId,
        parseInt(lookbackMonths)
      );

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error('📊 Failed to generate progress profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate progress profile',
      });
    }
  });

  // Phase 6: WebSocket connection status
  app.get('/api/websocket/status', authMiddleware, (_req, res) => {
    const status = statisticsWebSocketClient?.getConnectionStatus() || {
      connected: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 0,
    };

    res.json({
      success: true,
      data: {
        ...status,
        metricsBufferStats: metricsCollectionService?.getStats() || {
          activeSessionBuffers: 0,
          totalPlayerBuffers: 0,
          oldestBufferAge: 0,
        },
      },
    });
  });
  
  // Legacy compatibility routes (maintain backward compatibility)
  app.get('/api/stats/players/:playerId', authMiddleware, async (req, res) => {
    try {
      const { playerId } = req.params;
      const stats = await playerPerformanceRepo.getPlayerStats(playerId);
      
      // Transform to legacy format
      const legacyStats = stats.length > 0 ? {
        games: stats.length,
        goals: stats.reduce((sum, s) => sum + s.goals, 0),
        assists: stats.reduce((sum, s) => sum + s.assists, 0),
        points: stats.reduce((sum, s) => sum + s.goals + s.assists, 0)
      } : { games: 0, goals: 0, assists: 0, points: 0 };
      
      res.json({ 
        success: true, 
        data: { stats: legacyStats }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch player stats' });
    }
  });
  
  app.get('/api/stats/teams/:teamId', authMiddleware, async (req, res) => {
    try {
      const { teamId } = req.params;
      const stats = await teamAnalyticsRepo.getTeamSeasonStats(teamId);
      
      res.json({ 
        success: true, 
        data: { stats: stats.length > 0 ? stats[0] : {} }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch team stats' });
    }
  });

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use('*', (_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      availableEndpoints: {
        dashboard: '/api/dashboard/*',
        players: '/api/players/*',
        teams: '/api/teams/*',
        workload: '/api/workload/*',
        reports: '/api/reports/*',
        health: '/health'
      }
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`📊 Statistics Service running on port ${PORT}`);
    console.log(`📊 Available endpoints:`);
    console.log(`   - Dashboard Analytics: /api/dashboard/analytics`);
    console.log(`   - Player Dashboard: /api/dashboard/player/:playerId`);
    console.log(`   - Coach Dashboard: /api/dashboard/coach/:teamId`);
    console.log(`   - Trainer Dashboard: /api/dashboard/trainer`);
    console.log(`   - Admin Dashboard: /api/dashboard/admin/:organizationId`);
    console.log(`   - Report Generation: /api/reports/*`);
    console.log(`📊 Phase 6 - Analytics & Statistics:`);
    console.log(`   - Workout Analytics: /api/workout-analytics/*`);
    console.log(`   - Team Performance Reports: /api/teams/:teamId/performance-report`);
    console.log(`   - Individual Progress Profiles: /api/players/:playerId/progress-profile`);
    console.log(`   - WebSocket Status: /api/websocket/status`);
    console.log(`   - Health Check: /health`);
    console.log(`   - Service Ready: /api/ready`);
  });

}).catch((error) => {
  console.error('📊 Failed to start Statistics Service:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📊 Statistics Service: Received SIGTERM, shutting down gracefully...');
  
  try {
    // Shutdown Phase 6 services
    if (statisticsWebSocketClient) {
      await statisticsWebSocketClient.disconnect();
    }
    if (metricsCollectionService) {
      metricsCollectionService.shutdown();
    }
    
    await AppDataSource.destroy();
    await cacheManager.disconnect();
    console.log('📊 Statistics Service: Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('📊 Statistics Service: Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('📊 Statistics Service: Received SIGINT, shutting down gracefully...');
  
  try {
    // Shutdown Phase 6 services
    if (statisticsWebSocketClient) {
      await statisticsWebSocketClient.disconnect();
    }
    if (metricsCollectionService) {
      metricsCollectionService.shutdown();
    }
    
    await AppDataSource.destroy();
    await cacheManager.disconnect();
    console.log('📊 Statistics Service: Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('📊 Statistics Service: Error during shutdown:', error);
    process.exit(1);
  }
});