import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import eventRoutes from './routes/eventRoutes';
import locationRoutes from './routes/locationRoutes';
import resourceTypeRoutes from './routes/resourceTypeRoutes';
import resourceRoutes from './routes/resourceRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());

// Health
app.get('/health', (_req, res) => res.status(200).json({ status: 'OK', service: 'Calendar Service' }));

// Routes
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/resource-types', resourceTypeRoutes);
app.use('/api/v1/resources', resourceRoutes);

// Error handling
app.use((_req, _res, next) => {
  const error = new Error('Not Found');
  (error as any).status = 404;
  next(error);
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[${err.status || 500}] ${err.message}`);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    code: err.code || (err.status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
  });
});

export default app; 