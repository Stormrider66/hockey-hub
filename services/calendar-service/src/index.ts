import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'calendar-service', port: PORT });
});

// Event routes
app.get('/api/events', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      events: [
        {
          id: 1,
          title: 'Team Practice',
          date: new Date().toISOString(),
          location: 'Main Rink'
        }
      ] 
    } 
  });
});

app.post('/api/events', (req, res) => {
  res.json({ success: true, message: 'Event created' });
});

// Start server
app.listen(PORT, () => {
  console.log(`📅 Calendar Service running on port ${PORT}`);
});