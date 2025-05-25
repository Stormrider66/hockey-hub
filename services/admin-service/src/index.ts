import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import AppDataSource from './data-source';
import organizationRoutes from './routes/organizationRoutes';
import { startOutboxDispatcher } from './workers/outboxDispatcher';

dotenv.config(); // Load .env

const app = express();
const PORT = process.env.PORT || 3009;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/v1/admin/organizations', organizationRoutes);

// Basic Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', service: 'Admin Service' });
});

// Placeholder for API routes
// app.use('/api/v1', apiRouter);

// Basic Error Handling
app.use((_req, _res, next) => {
  const error = new Error('Not Found');
  (error as any).status = 404;
  next(error);
});
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Admin Service Error:', err);
  res.status(err.status || 500).json({ 
    error: true, 
    message: err.message || 'Internal Server Error' 
  });
});

// Initialize DB and Start Server
AppDataSource.initialize()
  .then(() => {
    console.log('Admin Service: Data Source Initialized!');
    startOutboxDispatcher();
    app.listen(PORT, () => {
      console.log(`Admin Service listening on port ${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error('Admin Service: Error during Data Source initialization:', err);
    process.exit(1);
  });

export default app; 