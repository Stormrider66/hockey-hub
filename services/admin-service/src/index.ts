import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/database';
import { errorHandler } from '@hockey-hub/shared-lib/middleware/errorHandler';
import { createLoggingMiddleware } from '@hockey-hub/shared-lib/middleware/loggingMiddleware';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(createLoggingMiddleware({ serviceName: 'admin-service' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'admin-service', port: PORT });
});

// Routes
app.use('/api/admin', dashboardRoutes);

// Legacy routes (for backward compatibility)
app.get('/api/admin/config', (_req, res) => {
  res.json({ success: true, data: { config: {} } });
});

app.get('/api/admin/health/services', (_req, res) => {
  res.redirect('/api/admin/health/services');
});

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await connectToDatabase();
    
    app.listen(PORT, () => {
      console.log(`⚙️ Admin Service running on port ${PORT}`);
      console.log(`📦 Redis caching enabled for admin data`);
    });
  } catch (error) {
    console.error('Failed to start admin service:', error);
    process.exit(1);
  }
}

startServer();