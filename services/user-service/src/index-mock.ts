// @ts-nocheck - Mock server entry point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'user-service', port: PORT });
});

// Mock auth routes
app.post('/api/v1/auth/login', (req, res) => {
  const { email, _password } = req.body;
  
  // Mock user data
  const mockUsers = [
    { id: 1, email: 'player@hockeyhub.com', name: 'Erik Johansson', role: 'player' },
    { id: 2, email: 'coach@hockeyhub.com', name: 'Lars Andersson', role: 'coach' },
    { id: 3, email: 'parent@hockeyhub.com', name: 'Anna Svensson', role: 'parent' },
  ];
  
  const user = mockUsers.find(u => u.email === email);
  
  if (user) {
    res.json({
      access_token: 'mock-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
      user
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Mock player overview
app.get('/api/v1/players/:id/overview', (req, res) => {
  const playerId = parseInt(req.params.id);
  
  res.json({
    player: {
      id: playerId,
      name: 'Erik Johansson',
      teamName: 'Djurgården U20',
      position: 'Center',
      jerseyNumber: 18
    },
    schedule: {
      today: [
        { time: '16:00', title: 'Team Practice', location: 'Hovet Rink 1' },
        { time: '19:00', title: 'Video Review', location: 'Team Room' }
      ],
      upcoming: [
        { date: '2024-01-22', time: '18:00', title: 'vs AIK U20', type: 'game' }
      ]
    },
    wellness: {
      lastSubmission: new Date().toISOString(),
      status: 'good'
    },
    training: {
      weeklyGoals: [
        { name: 'Face-off Practice', progress: 75, target: 100 },
        { name: 'Shooting Drills', progress: 45, target: 60 }
      ]
    }
  });
});

app.listen(PORT, () => {
  console.log(`🏒 User Service (Mock) running on port ${PORT}`);
});