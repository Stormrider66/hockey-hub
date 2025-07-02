import { Router } from 'express';
import { metricsRegistry } from '@hockey-hub/shared-lib/src/monitoring/metrics';
import { AppDataSource } from '../config/database';
import { redis } from '../config/redis';
import axios from 'axios';

const router = Router();

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  lastCheck: Date;
  responseTime?: number;
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    userService: ServiceHealth;
    communicationService: ServiceHealth;
    [key: string]: ServiceHealth;
  };
  metrics: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

// Basic health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const startTime = process.hrtime();
  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {} as any,
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }
  };

  // Check database
  try {
    const dbStart = Date.now();
    await AppDataSource.query('SELECT 1');
    health.services.database = {
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: Date.now() - dbStart
    };
  } catch (error) {
    health.services.database = {
      status: 'unhealthy',
      message: 'Database connection failed',
      lastCheck: new Date()
    };
    health.status = 'unhealthy';
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    await redis.ping();
    health.services.redis = {
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: Date.now() - redisStart
    };
  } catch (error) {
    health.services.redis = {
      status: 'unhealthy',
      message: 'Redis connection failed',
      lastCheck: new Date()
    };
    health.status = 'degraded';
  }

  // Check microservices
  const services = [
    { name: 'userService', url: 'http://user-service:3001/health' },
    { name: 'communicationService', url: 'http://communication-service:3002/health' },
    { name: 'calendarService', url: 'http://calendar-service:3003/health' },
    { name: 'trainingService', url: 'http://training-service:3004/health' }
  ];

  for (const service of services) {
    try {
      const serviceStart = Date.now();
      const response = await axios.get(service.url, { timeout: 5000 });
      health.services[service.name] = {
        status: response.data.status === 'ok' ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime: Date.now() - serviceStart
      };
    } catch (error) {
      health.services[service.name] = {
        status: 'unhealthy',
        message: `Service unreachable`,
        lastCheck: new Date()
      };
      if (health.status === 'healthy') {
        health.status = 'degraded';
      }
    }
  }

  // Calculate overall response time
  const [seconds, nanoseconds] = process.hrtime(startTime);
  const totalTime = seconds * 1000 + nanoseconds / 1000000;

  res.status(health.status === 'healthy' ? 200 : 503).json({
    ...health,
    responseTime: totalTime
  });
});

// Readiness check for Kubernetes
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    await AppDataSource.query('SELECT 1');
    await redis.ping();
    
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});

// Liveness check for Kubernetes
router.get('/live', (req, res) => {
  // Simple check to see if the process is alive
  res.json({ alive: true });
});

// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsRegistry.contentType);
    const metrics = await metricsRegistry.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

export default router;