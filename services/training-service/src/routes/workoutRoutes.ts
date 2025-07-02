import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { CachedWorkoutSessionService } from '../services/CachedWorkoutSessionService';
import { parsePaginationParams, authenticate, authorize, validationMiddleware } from '@hockey-hub/shared-lib';
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto, PlayerLoadDto, WorkoutFilterDto } from '@hockey-hub/shared-lib';

const router = Router();
const workoutService = new CachedWorkoutSessionService();

// Apply authentication to all routes
router.use(authenticate);

// Middleware to check database connection
const checkDatabase = (req: any, res: any, next: any) => {
  if (!AppDataSource.isInitialized) {
    return res.status(503).json({ 
      success: false, 
      error: 'Database service unavailable',
      message: 'Please ensure the database is created and running'
    });
  }
  next();
};

// Get all workout sessions with pagination
router.get('/sessions', authorize(['physical_trainer', 'coach', 'admin', 'player']), checkDatabase, async (req, res) => {
  try {
    const { teamId, playerId, status, date, type } = req.query;
    
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    });

    const filters = {
      teamId: teamId as string,
      playerId: playerId as string,
      status: status as string,
      type: type as string,
      date: date ? new Date(date as string) : undefined,
    };

    const result = await workoutService.getWorkoutSessions(
      filters,
      paginationParams.page,
      paginationParams.limit
    );
    
    res.json({ 
      success: true, 
      ...result
    });
  } catch (error) {
    console.error('Error fetching workout sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch workout sessions' });
  }
});

// Get single workout session
router.get('/sessions/:id', authorize(['physical_trainer', 'coach', 'admin', 'player', 'parent']), checkDatabase, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await workoutService.getWorkoutSessionById(sessionId);

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error fetching workout session:', error);
    if (error instanceof Error && error.message === 'Workout session not found') {
      res.status(404).json({ success: false, error: 'Workout session not found' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to fetch workout session' });
    }
  }
});

// Create workout session
router.post('/sessions', authorize(['physical_trainer', 'coach', 'admin']), validationMiddleware(CreateWorkoutSessionDto), checkDatabase, async (req, res) => {
  try {
    const { title, description, type, scheduledDate, location, teamId, playerIds, exercises, playerLoads, settings, estimatedDuration } = req.body;
    
    const workoutData = {
      title,
      description,
      type,
      scheduledDate: new Date(scheduledDate),
      location,
      teamId,
      playerIds,
      createdBy: req.body.userId || 'system', // Should come from auth middleware
      exercises,
      playerLoads,
      settings,
      estimatedDuration
    };

    const workout = await workoutService.createWorkoutSession(workoutData);

    res.status(201).json({ success: true, data: workout });
  } catch (error) {
    console.error('Error creating workout session:', error);
    res.status(500).json({ success: false, error: 'Failed to create workout session' });
  }
});

// Update workout session
router.put('/sessions/:id', authorize(['physical_trainer', 'coach', 'admin']), validationMiddleware(UpdateWorkoutSessionDto), checkDatabase, async (req, res) => {
  try {
    const { title, description, type, scheduledDate, location, status, playerIds, settings, exercises } = req.body;
    
    const updateData = {
      title,
      description,
      type,
      status,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      location,
      playerIds,
      settings,
      exercises
    };

    const updatedWorkout = await workoutService.updateWorkoutSession(req.params.id, updateData);

    res.json({ success: true, data: updatedWorkout });
  } catch (error) {
    console.error('Error updating workout session:', error);
    if (error instanceof Error && error.message === 'Workout session not found') {
      res.status(404).json({ success: false, error: 'Workout session not found' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update workout session' });
    }
  }
});

// Delete workout session
router.delete('/sessions/:id', authorize(['physical_trainer', 'coach', 'admin']), checkDatabase, async (req, res) => {
  try {
    await workoutService.deleteWorkoutSession(req.params.id);

    res.json({ success: true, message: 'Workout session deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout session:', error);
    if (error instanceof Error && error.message === 'Workout session not found') {
      res.status(404).json({ success: false, error: 'Workout session not found' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to delete workout session' });
    }
  }
});

// Update player workout load
router.put('/sessions/:sessionId/players/:playerId/load', authorize(['physical_trainer', 'coach', 'admin']), validationMiddleware(PlayerLoadDto), checkDatabase, async (req, res) => {
  try {
    const { sessionId, playerId } = req.params;
    const { loadModifier, exerciseModifications, notes } = req.body;
    
    const savedLoad = await workoutService.updatePlayerWorkoutLoad(sessionId, playerId, {
      loadModifier,
      exerciseModifications,
      notes
    });

    res.json({ success: true, data: savedLoad });
  } catch (error) {
    console.error('Error updating player workout load:', error);
    res.status(500).json({ success: false, error: 'Failed to update player workout load' });
  }
});

// Get player workout load
router.get('/sessions/:sessionId/players/:playerId/load', authorize(['physical_trainer', 'coach', 'admin', 'player']), checkDatabase, async (req, res) => {
  try {
    const { sessionId, playerId } = req.params;
    
    const playerLoad = await workoutService.getPlayerWorkoutLoad(sessionId, playerId);

    if (!playerLoad) {
      return res.status(404).json({ success: false, error: 'Player workout load not found' });
    }

    res.json({ success: true, data: playerLoad });
  } catch (error) {
    console.error('Error fetching player workout load:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch player workout load' });
  }
});

// Get upcoming workout sessions for a player
router.get('/sessions/upcoming/:playerId', authorize(['physical_trainer', 'coach', 'admin', 'player', 'parent']), checkDatabase, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { teamId, days = '7' } = req.query;
    
    const upcomingSessions = await workoutService.getUpcomingWorkoutSessions(
      playerId,
      teamId as string,
      parseInt(days as string)
    );

    res.json({ success: true, data: upcomingSessions });
  } catch (error) {
    console.error('Error fetching upcoming workout sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch upcoming workout sessions' });
  }
});

// Apply checkDatabase middleware to all routes
router.use(checkDatabase);

export default router;