import express, { Request, Response } from 'express';
import cors from 'cors';
// Type-only fallback to satisfy editors missing @types
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dotenv from 'dotenv';
import { connectToDatabase } from './config/database';
import { createLoggingMiddleware } from '@hockey-hub/shared-lib/dist/middleware/loggingMiddleware';
import { errorHandler } from '@hockey-hub/shared-lib/dist/errors/ErrorHandler';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(createLoggingMiddleware({ serviceName: 'planning-service' }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'planning-service', port: PORT });
});

// Routes
app.use('/api/planning', routes);

// Season planning routes (placeholder for now)
app.get('/api/planning/seasons', (_req: Request, res: Response) => {
  res.json({ success: true, data: { seasons: [] } });
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