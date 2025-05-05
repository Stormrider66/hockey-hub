const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

// Mock data
const teams = [
  { id: 'team1', name: 'Team One' },
  { id: 'team2', name: 'Team Two' },
];

const playersByTeam = {
  team1: [
    { id: 'player1', name: 'Alice' },
    { id: 'player2', name: 'Bob' },
  ],
  team2: [
    { id: 'player3', name: 'Carol' },
    { id: 'player4', name: 'Dave' },
  ],
};

const sessionsByPlayer = {
  player1: [
    { id: 'session1', assignedToUserId: 'player1', start: new Date().toISOString(), end: new Date(Date.now()+3600000).toISOString() }
  ],
  player2: [
    { id: 'session2', assignedToUserId: 'player2', start: new Date().toISOString(), end: new Date(Date.now()+3600000).toISOString() }
  ],
};

// REST Endpoints
app.get('/', (req, res) => {
  res.send('Mock Training Socket is running');
});
app.get('/teams', (req, res) => res.json(teams));
app.get('/teams/:teamId/players', (req, res) => res.json(playersByTeam[req.params.teamId] || []));
app.get('/scheduled-sessions', (req, res) => res.json(sessionsByPlayer[req.query.assignedToUserId] || []));

// Create HTTP server & Socket.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Live Metrics namespace
const metricsNs = io.of('/live-metrics');
metricsNs.on('connection', (socket) => {
  console.log('Client connected to live-metrics', socket.id);
  const interval = setInterval(() => {
    socket.emit('metric', {
      playerId: socket.handshake.query.teamId || 'player1',
      heartRate: Math.floor(Math.random() * 60 + 60),
      watts: Math.floor(Math.random() * 200 + 50),
      ts: Date.now(),
    });
  }, 1000);
  socket.on('disconnect', () => clearInterval(interval));
});

// Session Intervals namespace
const intervalNs = io.of('/session-intervals');
intervalNs.on('connection', (socket) => {
  console.log('Client connected to session-intervals', socket.id);
  let seconds = 60;
  const timer = setInterval(() => {
    socket.emit('interval', { seconds });
    seconds = seconds > 0 ? seconds - 1 : 60;
  }, 1000);
  socket.on('disconnect', () => clearInterval(timer));
});

// Start server
const PORT = process.env.PORT || 3005;
server.listen(PORT, () => console.log(`Mock Training Socket running on port ${PORT}`)); 