import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { errorHandler, initializeCache } from '@hockey-hub/shared-lib';
import { CacheWarmupService } from './services/CacheWarmupService';

// Import routes
import wellnessRoutes from './routes/wellnessRoutes';
import injuryRoutes from './routes/injuryRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import medicalOverviewRoutes from './routes/medicalOverviewRoutes';
import medicalAnalyticsRoutes from './routes/medicalAnalyticsRoutes';
import complianceRoutes from './routes/complianceRoutes';
import loadManagementRoutes from './routes/loadManagementRoutes';
import recoveryProtocolRoutes from './routes/recoveryProtocolRoutes';

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
    service: 'medical-service', 
    port: PORT,
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/v1', wellnessRoutes);
app.use('/api/v1/injuries', injuryRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/medical', medicalOverviewRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/load-management', loadManagementRoutes);
app.use('/api/v1/recovery-protocol', recoveryProtocolRoutes);
app.use('/api/medical-analytics', medicalAnalyticsRoutes);

// Legacy medical routes for backward compatibility
app.get('/api/medical/injuries', (_req, res) => {
  res.redirect('/api/v1/injuries');
});

app.post('/api/medical/injuries', (_req, res) => {
  res.redirect(307, '/api/v1/injuries');
});

app.get('/api/medical/availability', (_req, res) => {
  res.redirect('/api/v1/availability');
});

// Error handling middleware
app.use(errorHandler);

// Database initialization and server startup
async function startServer() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Medical Service database connected');
    }

    // Initialize Redis cache
    try {
      await initializeCache({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '5'),
      });
      console.log('✅ Medical Service Redis cache initialized');
      
      // Warm up cache with frequently accessed data
      const cacheWarmupService = new CacheWarmupService();
      await cacheWarmupService.warmupCache();
      await cacheWarmupService.warmupDashboardData();
      
      // Start periodic cache refresh for hot data
      cacheWarmupService.startPeriodicWarmup(300000); // 5 minutes
      
    } catch (error) {
      console.warn('⚠️ Redis cache initialization failed, continuing without cache:', error);
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🏥 Medical Service running on port ${PORT}`);
      console.log(`📊 Redis caching: ${process.env.REDIS_HOST ? 'enabled' : 'disabled'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Medical Service:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down Medical Service...');
  
  // Close cache connection
  try {
    const { closeCache } = await import('@hockey-hub/shared-lib');
    await closeCache();
    console.log('✅ Cache connection closed');
  } catch (error) {
    console.warn('Cache close error:', error);
  }
  
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  }
  
  process.exit(0);
});

// Start the server
startServer();