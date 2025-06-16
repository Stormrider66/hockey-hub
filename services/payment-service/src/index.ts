import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import AppDataSource from './data-source';
import subscriptionRoutes from './routes/subscriptionRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import paymentMethodRoutes from './routes/paymentMethodRoutes';
import { stripeWebhookHandler } from './controllers/webhookController';
import { authenticate } from './middleware/authMiddleware';
import { startOrgConsumer } from './workers/orgEventConsumer';

dotenv.config(); // Load .env

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Stripe webhook endpoint (raw body required) before JSON parsing
app.post('/api/v1/payments/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());
app.use(authenticate);

// Basic Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', service: 'Payment Service' });
});

// API Routes
app.use('/api/v1/payments/subscriptions', subscriptionRoutes);
app.use('/api/v1/payments/invoices', invoiceRoutes);
app.use('/api/v1/payments/payment-methods', paymentMethodRoutes);

// Basic Error Handling
app.use((_req, _res, next) => {
  const error = new Error('Not Found');
  (error as any).status = 404;
  next(error);
});
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Payment Service Error:', err);
  res.status(err.status || 500).json({ 
    error: true, 
    message: err.message || 'Internal Server Error' 
  });
});

// Initialize DB and Start Server
AppDataSource.initialize()
  .then(() => {
    console.log('Payment Service: Data Source Initialized!');
    app.listen(PORT, () => {
      console.log(`Payment Service listening on port ${PORT}`);
      startOrgConsumer();
    });
  })
  .catch((err: unknown) => {
    console.error('Payment Service: Error during Data Source initialization:', err);
    process.exit(1);
  });

export default app; 