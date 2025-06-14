import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import injuryRoutes from './routes/injuryRoutes'; // Import injury routes
import treatmentRoutes from './routes/treatmentRoutes';
import treatmentPlanRoutes from './routes/treatmentPlanRoutes';
import treatmentPlanItemRoutes from './routes/treatmentPlanItemRoutes';
import playerAvailabilityRoutes from './routes/playerAvailabilityRoutes';
import medicalDocumentRoutes from './routes/medicalDocumentRoutes';
import overviewRoutes from './routes/overviewRoutes';
import { authenticateToken } from './middleware/auth';
import { randomUUID } from 'crypto';
// Load environment variables
dotenv.config({ path: '../../.env' });
const app = express();
const server = http.createServer(app);
const PORT = process.env.MEDICAL_SERVICE_PORT || 3005;
// --- Middleware ---
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3000'], // Frontend and API Gateway
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());
// --- API Routes ---
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'Medical Service' });
});
// Apply authentication middleware to all API routes
app.use('/api/v1', authenticateToken);
// Mount Injury Routes
app.use('/api/v1/injuries', injuryRoutes);
app.use('/api/v1/treatments', treatmentRoutes);
app.use('/api/v1', treatmentPlanRoutes);
app.use('/api/v1', treatmentPlanItemRoutes);
app.use('/api/v1', playerAvailabilityRoutes);
app.use('/api/v1', medicalDocumentRoutes);
app.use('/api/v1', overviewRoutes);
// TODO: Add other routes
// app.use('/api/v1/player-status', playerStatusRoutes);
// app.use('/api/v1/player-medical', playerMedicalRoutes);
// --- Error Handling Middleware ---
// Handle 404 Not Found
app.use((_req: Request, _res: Response, next: NextFunction) => {
  const error = new Error('Not Found');
  (error as any).status = 404;
  next(error);
});
// Global error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const code = err.code || (status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
  let category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'VALIDATION' | 'RESOURCE_CONFLICT' | 'EXTERNAL_SERVICE' | 'INTERNAL_ERROR';
  if (status === 401) category = 'AUTHENTICATION';
  else if (status === 403) category = 'AUTHORIZATION';
  else if (status === 400) category = 'VALIDATION';
  else if (status === 409) category = 'RESOURCE_CONFLICT';
  else if (status >= 500) category = 'INTERNAL_ERROR';
  else category = 'INTERNAL_ERROR';
  const transactionId = randomUUID();
  console.error(
    `[${status}] ${err.message}${err.stack ? '\n' + err.stack : ''} Request Path: ${req.path} TransactionId: ${transactionId}`
  );
  res.setHeader('transactionId', transactionId);
  res.status(status).json({
    error: true,
    message: err.message || 'Internal Server Error',
    code,
    category,
    details: err.details || undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    transactionId
  });
});
// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Medical Service listening on port ${PORT}`);
});
