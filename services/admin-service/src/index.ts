import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'admin-service', port: PORT });
});

// System config routes
app.get('/api/admin/config', (req, res) => {
  res.json({ success: true, data: { config: {} } });
});

// System health routes
app.get('/api/admin/health/services', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      services: {
        'user-service': 'healthy',
        'calendar-service': 'healthy',
        'training-service': 'healthy'
      } 
    } 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`⚙️ Admin Service running on port ${PORT}`);
});