import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authMiddleware, loggingMiddleware, errorHandler } from '@hockey-hub/shared-lib';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

// Initialize services
let statisticsService: CachedStatisticsService;
let playerPerformanceRepo: CachedPlayerPerformanceRepository;
let teamAnalyticsRepo: CachedTeamAnalyticsRepository;
let workloadAnalyticsRepo: CachedWorkloadAnalyticsRepository;

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
app.use(loggingMiddleware);

// Health check (public route)
app.get('/health', (req, res) => {
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
app.get('/api/ready', (req, res) => {
  if (statisticsService && playerPerformanceRepo && teamAnalyticsRepo && workloadAnalyticsRepo) {
    res.json({ ready: true, services: 'all_initialized' });
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
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      availableEndpoints: {
        dashboard: '/api/dashboard/*',
        players: '/api/players/*',
        teams: '/api/teams/*',
        workload: '/api/workload/*',
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
    console.log(`   - Health Check: /health`);
  });

}).catch((error) => {
  console.error('📊 Failed to start Statistics Service:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📊 Statistics Service: Received SIGTERM, shutting down gracefully...');
  
  try {
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
    await AppDataSource.destroy();
    await cacheManager.disconnect();
    console.log('📊 Statistics Service: Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('📊 Statistics Service: Error during shutdown:', error);
    process.exit(1);
  }
});