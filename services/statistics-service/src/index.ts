import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'statistics-service', port: PORT });
});

// Player stats routes
app.get('/api/stats/players/:playerId', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      stats: {
        games: 20,
        goals: 15,
        assists: 10
      } 
    } 
  });
});

// Team stats routes
app.get('/api/stats/teams/:teamId', (req, res) => {
  res.json({ success: true, data: { stats: {} } });
});

// Start server
app.listen(PORT, () => {
  console.log(`📊 Statistics Service running on port ${PORT}`);
});