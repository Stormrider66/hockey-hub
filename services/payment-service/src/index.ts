import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service', port: PORT });
});

// Invoice routes
app.get('/api/payments/invoices', (req, res) => {
  res.json({ success: true, data: { invoices: [] } });
});

// Payment routes
app.get('/api/payments', (req, res) => {
  res.json({ success: true, data: { payments: [] } });
});

// Start server
app.listen(PORT, () => {
  console.log(`💰 Payment Service running on port ${PORT}`);
});