import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabase, AppDataSource } from './config/database';
import { initializeCache, closeCache, errorHandler } from '@hockey-hub/shared-lib';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    credentials: true
  }
});

const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Import routes
import workoutRoutes from './routes/workoutRoutes';
import { createExecutionRoutes } from './routes/executionRoutes';
import templateRoutes from './routes/templateRoutes';
import { mockWorkoutSessions } from './mocks/workoutData';

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'training-service', 
    port: PORT,
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected'
  });
});

// Mock endpoints for when database is not available
app.get('/api/training/sessions', (req, res, next) => {
  if (!AppDataSource.isInitialized) {
    const { playerId, date, status } = req.query;
    let filteredSessions = [...mockWorkoutSessions];
    
    if (playerId) {
      filteredSessions = filteredSessions.filter(s => 
        s.playerIds?.includes(playerId as string)
      );
    }
    
    if (status) {
      filteredSessions = filteredSessions.filter(s => 
        s.status === status
      );
    }
    
    return res.json({ 
      success: true, 
      data: filteredSessions,
      mock: true 
    });
  }
  next();
});

app.get('/api/training/sessions/:id', (req, res, next) => {
  if (!AppDataSource.isInitialized) {
    const session = mockWorkoutSessions.find(s => s.id === req.params.id);
    if (session) {
      return res.json({ success: true, data: session, mock: true });
    }
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  next();
});

// API routes (will be used when database is available)
app.use('/api/training', workoutRoutes);
app.use('/api/training', createExecutionRoutes(io));
app.use('/api/training', templateRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a workout session room
  socket.on('session:join', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
  });

  // Leave a workout session room
  socket.on('session:leave', (sessionId: string) => {
    socket.leave(`session:${sessionId}`);
  });

  // Handle workout session events
  socket.on('session:start', (data: { sessionId: string; startTime: Date; trainerId: string }) => {
    io.to(`session:${data.sessionId}`).emit('session:started', data);
  });

  socket.on('exercise:complete', (data: { sessionId: string; exerciseId: string; playerId: string; completedAt: Date }) => {
    io.to(`session:${data.sessionId}`).emit('exercise:completed', data);
  });

  socket.on('metrics:update', (data: { sessionId: string; playerId: string; metrics: Record<string, number> }) => {
    io.to(`session:${data.sessionId}`).emit('metrics:updated', data);
  });

  // Trainer control events
  socket.on('view:change', (data: { sessionId: string; view: string; trainerId: string }) => {
    io.to(`session:${data.sessionId}`).emit('view:changed', data);
  });

  socket.on('player:focus', (data: { sessionId: string; playerId: string; trainerId: string }) => {
    io.to(`session:${data.sessionId}`).emit('player:focused', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server with database connection
const startServer = async () => {
  try {
    // Initialize database
    if (process.env.SKIP_DB !== 'true') {
      try {
        await initializeDatabase();
        console.log('✅ Database connected successfully');
      } catch (dbError: unknown) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
        console.error('❌ Database connection error:', errorMessage);
        console.log('⚠️  Service will run without database features.');
        console.log('💡 Check your database configuration in .env file');
      }
    }
    
    // Initialize Redis cache
    try {
      await initializeCache({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '4'),
      });
      console.log('✅ Training Service Redis cache initialized');
    } catch (error) {
      console.warn('⚠️ Redis cache initialization failed, continuing without cache:', error);
    }
    
    httpServer.listen(PORT, () => {
      console.log(`🏃 Training Service running on port ${PORT}`);
      console.log(`🔌 WebSocket server ready`);
      console.log(`📊 Database: ${process.env.DB_NAME || 'hockey_hub_training'} on port ${process.env.DB_PORT || '5432'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  try {
    await closeCache();
    console.log('✅ Cache connection closed');
  } catch (error) {
    console.warn('Cache close error:', error);
  }
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  try {
    await closeCache();
    console.log('✅ Cache connection closed');
  } catch (error) {
    console.warn('Cache close error:', error);
  }
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});