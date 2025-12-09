import express from 'express';
import cors from 'cors';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dotenv from 'dotenv';
import { createServer } from 'http';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Server } from 'socket.io';
import { initializeDatabase, AppDataSource } from './config/database';
import { initializeCache, closeCache, errorHandler } from '@hockey-hub/shared-lib';
import { TrainingEventService } from './services/TrainingEventService';

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

// Global event service instance
let trainingEventService: TrainingEventService | null = null;
let planningEventListener: PlanningEventListener | null = null;

// Export for use in routes
export const getTrainingEventService = () => {
  if (!trainingEventService) {
    throw new Error('TrainingEventService not initialized');
  }
  return trainingEventService;
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Import routes
import workoutRoutes from './routes/workoutRoutes';
import { createExecutionRoutes } from './routes/executionRoutes';
import templateRoutes from './routes/templateRoutes';
import sessionTemplateRoutes from './routes/sessionTemplateRoutes';
import { exerciseRoutes } from './routes/exercise.routes';
import workoutTypeRoutes, { initializeWorkoutTypeRoutes } from './routes/workoutTypeRoutes';
import medicalIntegrationRoutes, { initializeMedicalIntegrationRoutes } from './routes/medicalIntegrationRoutes';
import { planningIntegrationRoutes, initializePlanningIntegrationRoutes } from './routes/planningIntegrationRoutes';
import trainingSessionRoutes from './routes/trainingSessionRoutes';
import playerWellnessRoutes from './routes/playerWellnessRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import { coachRoutes } from './routes/coach';
import { mockWorkoutSessions } from './mocks/workoutData';
import { mockExercises } from './mocks/exerciseData';
import { WorkoutTypeService } from './services/WorkoutTypeService';
import { WorkoutTypeConfig } from './entities/WorkoutType';
import { PlanningEventListener } from './events/PlanningEventListener';
import { trainingSessionSocketService } from './services/TrainingSessionSocketService';

// Health check
app.get('/health', (_req, res) => {
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
    const { playerId, status } = req.query;
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
  return next();
});

app.get('/api/training/sessions/:id', (req, res, next) => {
  if (!AppDataSource.isInitialized) {
    const session = mockWorkoutSessions.find(s => s.id === req.params.id);
    if (session) {
      return res.json({ success: true, data: session, mock: true });
    }
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  return next();
});

// Mock endpoints for exercises when database is not available
app.get('/api/v1/training/exercises', (req, res, next) => {
  if (!AppDataSource.isInitialized) {
    const { category, search, skip = 0, take = 50 } = req.query;
    let filteredExercises = [...mockExercises];
    
    if (category) {
      filteredExercises = filteredExercises.filter(e => e.category === category);
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredExercises = filteredExercises.filter(e => 
        e.name?.toLowerCase().includes(searchLower)
      );
    }
    
    const total = filteredExercises.length;
    const skipNum = parseInt(skip as string) || 0;
    const takeNum = parseInt(take as string) || 50;
    const paginatedExercises = filteredExercises.slice(skipNum, skipNum + takeNum);
    
    return res.json({ 
      success: true, 
      data: paginatedExercises,
      total,
      skip: skipNum,
      take: takeNum,
      mock: true 
    });
  }
  return next();
});

app.get('/api/v1/training/exercises/:id', (req, res, next) => {
  if (!AppDataSource.isInitialized) {
    const exercise = mockExercises.find(e => e.id === req.params.id);
    if (exercise) {
      return res.json({ success: true, data: exercise, mock: true });
    }
    return res.status(404).json({ success: false, error: 'Exercise not found' });
  }
  return next();
});

// API routes (will be used when database is available)
app.use('/api/training', workoutRoutes);
app.use('/api/training', createExecutionRoutes(io));
app.use('/api/training', templateRoutes);
app.use('/api/training', playerWellnessRoutes);
app.use('/api/training/equipment', equipmentRoutes);
app.use('/api/v1/training', sessionTemplateRoutes);
// In tests, mount exercise routes early to allow test-only fast paths to win
if (process.env.NODE_ENV === 'test') {
  app.use('/api/v1/training', exerciseRoutes);
} else {
  app.use('/api/v1/training', exerciseRoutes);
}
app.use('/api/v1/training/workout-types', workoutTypeRoutes);
app.use('/api/v1/training/medical-sync', medicalIntegrationRoutes);
app.use('/api/v1/training/planning', planningIntegrationRoutes);
app.use('/api/v1/training/live', trainingSessionRoutes);
app.use('/api/training/coach', coachRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// WebSocket connection handling for training sessions
io.on('connection', (socket: any) => {
  console.log('Training client connected:', socket.id);

  // Authentication (simple version for now)
  socket.on('authenticate', (data: { userId: string; role: string; token?: string }) => {
    socket.data = { userId: data.userId, role: data.role };
    socket.emit('authenticated', { success: true });
    console.log(`Socket ${socket.id} authenticated as ${data.role} for user ${data.userId}`);
  });

  // Join a workout session room
  socket.on('session:join', (data: { sessionId: string; workoutId?: string; eventId?: string }) => {
    const roomName = `session:${data.sessionId}`;
    socket.join(roomName);
    socket.data.sessionId = data.sessionId;
    socket.data.workoutId = data.workoutId;
    socket.data.eventId = data.eventId;
    
    console.log(`Socket ${socket.id} joined session ${data.sessionId}`);
    
    // Notify others in the room about the join
    socket.to(roomName).emit('participant:joined', { 
      socketId: socket.id, 
      userId: socket.data.userId,
      role: socket.data.role,
      sessionId: data.sessionId
    });
    
    // Send current session state to the newly joined user
    socket.emit('session:joined', { 
      sessionId: data.sessionId,
      roomParticipants: io.sockets.adapter.rooms.get(roomName)?.size || 1
    });
  });

  // Leave a workout session room
  socket.on('session:leave', (sessionId: string) => {
    const roomName = `session:${sessionId}`;
    socket.leave(roomName);
    
    // Notify others about the leave
    socket.to(roomName).emit('participant:left', { 
      socketId: socket.id,
      userId: socket.data.userId,
      sessionId
    });
  });

  // Handle real-time workout broadcasts
  socket.on('workout_update', (data: {
    type: 'workout_update';
    data: {
      workoutId: string;
      eventId?: string;
      workoutType: 'STRENGTH' | 'CONDITIONING' | 'HYBRID' | 'AGILITY';
      playerId: string;
      playerName: string;
      timestamp: string;
      overallProgress: number;
      currentPhase?: string;
      isCompleted: boolean;
      isPaused: boolean;
      totalTimeElapsed: number;
      
      // Type-specific data
      currentExercise?: string;
      currentSet?: number;
      totalSets?: number;
      currentReps?: number;
      currentLoad?: string;
      
      currentInterval?: string;
      intervalIndex?: number;
      totalIntervals?: number;
      intervalTimeRemaining?: number;
      heartRate?: number;
      targetHeartRate?: number;
      targetPower?: number;
      targetPace?: string;
      
      currentBlock?: string;
      blockType?: 'exercise' | 'interval' | 'transition';
      blockIndex?: number;
      totalBlocks?: number;
      
      currentDrill?: string;
      drillIndex?: number;
      totalDrills?: number;
      currentRep?: number;
      totalReps?: number;
      lastTime?: number;
      bestTime?: number;
      rpe?: number;
    };
  }) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) {
      socket.emit('error', { message: 'Not joined to any session. Call session:join first.' });
      return;
    }
    
    const roomName = `session:${sessionId}`;
    console.log(`Broadcasting workout update from ${data.data.playerId} in session ${sessionId}`);
    
    // Broadcast to all participants in the session (including trainers)
    io.to(roomName).emit('workout:progress_update', {
      sessionId,
      ...data.data,
      receivedAt: new Date().toISOString()
    });
    
    // Store in session state for late joiners (basic in-memory for now)
    // In production, this would be stored in Redis or database
    // TODO: Implement proper session state storage
  });

  // Handle session control commands (trainer only)
  socket.on('session:start', (data: { sessionId: string; workoutId: string }) => {
    if (socket.data.role !== 'trainer' && socket.data.role !== 'coach') {
      socket.emit('error', { message: 'Only trainers can start sessions' });
      return;
    }
    
    const roomName = `session:${data.sessionId}`;
    io.to(roomName).emit('session:started', {
      sessionId: data.sessionId,
      workoutId: data.workoutId,
      startedBy: socket.data.userId,
      startTime: new Date().toISOString()
    });
    
    console.log(`Session ${data.sessionId} started by ${socket.data.userId}`);
  });

  socket.on('session:pause', (sessionId: string) => {
    if (socket.data.role !== 'trainer' && socket.data.role !== 'coach') {
      socket.emit('error', { message: 'Only trainers can pause sessions' });
      return;
    }
    
    const roomName = `session:${sessionId}`;
    io.to(roomName).emit('session:paused', {
      sessionId,
      pausedBy: socket.data.userId,
      pausedAt: new Date().toISOString()
    });
  });

  socket.on('session:resume', (sessionId: string) => {
    if (socket.data.role !== 'trainer' && socket.data.role !== 'coach') {
      socket.emit('error', { message: 'Only trainers can resume sessions' });
      return;
    }
    
    const roomName = `session:${sessionId}`;
    io.to(roomName).emit('session:resumed', {
      sessionId,
      resumedBy: socket.data.userId,
      resumedAt: new Date().toISOString()
    });
  });

  socket.on('session:end', (sessionId: string) => {
    if (socket.data.role !== 'trainer' && socket.data.role !== 'coach') {
      socket.emit('error', { message: 'Only trainers can end sessions' });
      return;
    }
    
    const roomName = `session:${sessionId}`;
    io.to(roomName).emit('session:ended', {
      sessionId,
      endedBy: socket.data.userId,
      endedAt: new Date().toISOString()
    });
    
    // Clean up session rooms after a delay
    setTimeout(() => {
      io.in(roomName).disconnectSockets();
    }, 30000); // 30 second grace period
  });

  // Legacy event handlers for backward compatibility
  socket.on('exercise:complete', (data: { sessionId: string; exerciseId: string; playerId: string; completedAt: Date }) => {
    io.to(`session:${data.sessionId}`).emit('exercise:completed', data);
  });

  socket.on('metrics:update', (data: { sessionId: string; playerId: string; metrics: Record<string, number> }) => {
    io.to(`session:${data.sessionId}`).emit('metrics:updated', data);
  });

  socket.on('view:change', (data: { sessionId: string; view: string; trainerId: string }) => {
    io.to(`session:${data.sessionId}`).emit('view:changed', data);
  });

  socket.on('player:focus', (data: { sessionId: string; playerId: string; trainerId: string }) => {
    io.to(`session:${data.sessionId}`).emit('player:focused', data);
  });

  socket.on('disconnect', () => {
    console.log('Training client disconnected:', socket.id);
    
    // Clean up from any session rooms
    const sessionId = socket.data?.sessionId;
    if (sessionId) {
      const roomName = `session:${sessionId}`;
      socket.to(roomName).emit('participant:disconnected', {
        socketId: socket.id,
        userId: socket.data.userId,
        sessionId
      });
    }
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
        
        // Initialize event service
        trainingEventService = new TrainingEventService(AppDataSource);
        console.log('✅ Event service initialized');
        
        // Initialize workout type service
        const workoutTypeRepository = AppDataSource.getRepository(WorkoutTypeConfig);
        const workoutTypeService = new WorkoutTypeService(workoutTypeRepository);
        initializeWorkoutTypeRoutes(workoutTypeService);
        console.log('✅ Workout type service initialized');
        
        // Initialize medical integration service
        initializeMedicalIntegrationRoutes();
        console.log('✅ Medical integration service initialized');
        
        // Initialize planning integration service
        initializePlanningIntegrationRoutes();
        console.log('✅ Planning integration service initialized');
        
        // Initialize planning event listener
        planningEventListener = new PlanningEventListener(AppDataSource);
        console.log('✅ Planning event listener initialized');
        
        // Initialize training session socket service
        await trainingSessionSocketService.connect();
        console.log('✅ Training session socket service connected');
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

if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  startServer();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  try {
    if (planningEventListener) {
      planningEventListener.destroy();
      console.log('✅ Planning event listener cleaned up');
    }
    trainingSessionSocketService.disconnect();
    console.log('✅ Training session socket disconnected');
    await closeCache();
    console.log('✅ Cache connection closed');
  } catch (error) {
    console.warn('Shutdown error:', error);
  }
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  try {
    if (planningEventListener) {
      planningEventListener.destroy();
      console.log('✅ Planning event listener cleaned up');
    }
    trainingSessionSocketService.disconnect();
    console.log('✅ Training session socket disconnected');
    await closeCache();
    console.log('✅ Cache connection closed');
  } catch (error) {
    console.warn('Shutdown error:', error);
  }
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});