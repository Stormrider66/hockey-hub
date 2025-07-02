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
const PORT = process.env.PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'planning-service', port: PORT });
});

// Routes
app.use('/api/planning', dashboardRoutes);

// Season planning routes (placeholder for now)
app.get('/api/planning/seasons', (req, res) => {
  res.json({ success: true, data: { seasons: [] } });
});

// Practice planning routes (placeholder for now)
app.get('/api/planning/practices', (req, res) => {
  res.json({ success: true, data: { practices: [] } });
});

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await connectToDatabase();
    
    app.listen(PORT, () => {
      console.log(`📋 Planning Service running on port ${PORT}`);
      console.log(`📦 Redis caching enabled for planning data`);
    });
  } catch (error) {
    console.error('Failed to start planning service:', error);
    process.exit(1);
  }
}

startServer();