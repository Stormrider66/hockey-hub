import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3010', 'http://localhost:3002', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', port: PORT });
});

// Service routing configuration
const isDocker = process.env.DOCKER_ENV === 'true';
const services = {
  '/api/v1/users': process.env.USER_SERVICE_URL || (isDocker ? 'http://user-service:3001' : 'http://localhost:3001'),
  '/api/v1/auth': process.env.USER_SERVICE_URL || (isDocker ? 'http://user-service:3001' : 'http://localhost:3001'),
  '/api/v1/players': process.env.USER_SERVICE_URL || (isDocker ? 'http://user-service:3001' : 'http://localhost:3001'),  // Player endpoints go to user service
  '/api/v1/messages': process.env.COMMUNICATION_SERVICE_URL || (isDocker ? 'http://communication-service:3002' : 'http://localhost:3002'),
  '/api/v1/notifications': process.env.COMMUNICATION_SERVICE_URL || (isDocker ? 'http://communication-service:3002' : 'http://localhost:3002'),
  '/api/v1/events': process.env.CALENDAR_SERVICE_URL || (isDocker ? 'http://calendar-service:3003' : 'http://localhost:3003'),
  '/api/v1/calendar': process.env.CALENDAR_SERVICE_URL || (isDocker ? 'http://calendar-service:3003' : 'http://localhost:3003'),
  '/api/v1/training': process.env.TRAINING_SERVICE_URL || (isDocker ? 'http://training-service:3004' : 'http://localhost:3004'),
  '/api/v1/medical': process.env.MEDICAL_SERVICE_URL || (isDocker ? 'http://medical-service:3005' : 'http://localhost:3005'),
  '/api/v1/planning': process.env.PLANNING_SERVICE_URL || (isDocker ? 'http://planning-service:3006' : 'http://localhost:3006'),
  '/api/v1/stats': process.env.STATISTICS_SERVICE_URL || (isDocker ? 'http://statistics-service:3007' : 'http://localhost:3007'),
  '/api/v1/payments': process.env.PAYMENT_SERVICE_URL || (isDocker ? 'http://payment-service:3008' : 'http://localhost:3008'),
  '/api/v1/admin': process.env.ADMIN_SERVICE_URL || (isDocker ? 'http://admin-service:3009' : 'http://localhost:3009'),
};

// Set up proxy routes
Object.entries(services).forEach(([path, target]) => {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      timeout: 30000,
      proxyTimeout: 30000,
      onError: (err, req, res) => {
        console.error(`Proxy error for ${path}:`, err.message);
        res.status(502).json({ 
          error: 'Service temporarily unavailable',
          service: path,
          details: err.message
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        // Log the proxied request for debugging
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${target}`);
      }
    })
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log('📡 Proxying to services:');
  Object.entries(services).forEach(([path, target]) => {
    console.log(`   ${path} -> ${target}`);
  });
});