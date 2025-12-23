// @ts-nocheck
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/database';
import { errorHandler } from '@hockey-hub/shared-lib/middleware/errorHandler';
import { requestLogger } from '@hockey-hub/shared-lib/middleware/logging';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service', port: PORT });
});

// Routes
app.use('/api/payments', dashboardRoutes);

// Invoice routes (placeholder for now)
app.get('/api/payments/invoices', (req, res) => {
  res.json({ success: true, data: { invoices: [] } });
});

// Payment routes (placeholder for now)
app.get('/api/payments', (req, res) => {
  res.json({ success: true, data: { payments: [] } });
});

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await connectToDatabase();
    
    app.listen(PORT, () => {
      console.log(`💰 Payment Service running on port ${PORT}`);
      console.log(`📦 Redis caching enabled for payment data`);
    });
  } catch (error) {
    console.error('Failed to start payment service:', error);
    process.exit(1);
  }
}

startServer();