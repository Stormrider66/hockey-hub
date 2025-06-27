import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'training-service', port: PORT });
});

// Training session routes
app.get('/api/training/sessions', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      sessions: [
        {
          id: 1,
          title: 'Strength Training',
          date: new Date().toISOString(),
          duration: 60
        }
      ] 
    } 
  });
});

app.post('/api/training/sessions', (req, res) => {
  res.json({ success: true, message: 'Training session created' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏃 Training Service running on port ${PORT}`);
});