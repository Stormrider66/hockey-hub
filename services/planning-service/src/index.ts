import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'planning-service', port: PORT });
});

// Season planning routes
app.get('/api/planning/seasons', (req, res) => {
  res.json({ success: true, data: { seasons: [] } });
});

// Practice planning routes
app.get('/api/planning/practices', (req, res) => {
  res.json({ success: true, data: { practices: [] } });
});

// Start server
app.listen(PORT, () => {
  console.log(`📋 Planning Service running on port ${PORT}`);
});