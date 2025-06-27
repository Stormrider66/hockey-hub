import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'communication-service', port: PORT });
});

// Message routes
app.get('/api/messages', (req, res) => {
  res.json({ success: true, data: { messages: [] } });
});

app.post('/api/messages', (req, res) => {
  res.json({ success: true, message: 'Message sent' });
});

// Notification routes
app.get('/api/notifications', (req, res) => {
  res.json({ success: true, data: { notifications: [] } });
});

// Start server
app.listen(PORT, () => {
  console.log(`📧 Communication Service running on port ${PORT}`);
});