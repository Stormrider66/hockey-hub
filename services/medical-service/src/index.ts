import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import wellnessRoutes from './routes/wellnessRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'medical-service', port: PORT });
});

// Wellness routes
app.use('/api/v1', wellnessRoutes);

// Injury routes
app.get('/api/medical/injuries', (req, res) => {
  res.json({ success: true, data: { injuries: [] } });
});

app.post('/api/medical/injuries', (req, res) => {
  res.json({ success: true, message: 'Injury reported' });
});

// Availability routes
app.get('/api/medical/availability', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      availability: [
        { playerId: 1, status: 'available' }
      ] 
    } 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏥 Medical Service running on port ${PORT}`);
});