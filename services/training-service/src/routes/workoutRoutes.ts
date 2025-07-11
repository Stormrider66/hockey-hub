import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { CachedWorkoutSessionService } from '../services/CachedWorkoutSessionService';
import { parsePaginationParams, authenticate, authorize, validationMiddleware } from '@hockey-hub/shared-lib';
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto, PlayerLoadDto, WorkoutFilterDto } from '@hockey-hub/shared-lib';
import { getTrainingEventService } from '../index';

const router = Router();
const workoutService = new CachedWorkoutSessionService();

// Apply authentication to all routes
router.use(authenticate);

// Middleware to check database connection
const checkDatabase = (req: Request, res: Response, next: NextFunction) => {
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
    const { title, description, type, scheduledDate, location, teamId, playerIds, exercises, playerLoads, settings, estimatedDuration, intervalProgram } = req.body;
    
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
      estimatedDuration,
      intervalProgram
    };

    const workout = await workoutService.createWorkoutSession(workoutData);

    // Publish workout created event
    try {
      const eventService = getTrainingEventService();
      const user = (req as any).user;
      if (user) {
        eventService.setUserContext(user.id, user.organizationId);
      }
      
      // If this is a workout assignment, publish the event
      // Note: This is a simplified example - in production, you'd create proper WorkoutAssignment entities
      if (workout.id && teamId) {
        await eventService.publishWorkoutCreated({
          id: workout.id,
          sessionTemplateId: workout.id,
          playerId: playerIds?.[0] || 'team',
          teamId,
          organizationId: user?.organizationId || teamId,
          scheduledDate: workout.scheduledDate,
          completedAt: null,
          startedAt: null,
          exercisesCompleted: null,
          exercisesTotal: workout.exercises?.length || 0
        } as any, req.headers['x-correlation-id'] as string);
      }
    } catch (eventError) {
      console.error('Failed to publish workout created event:', eventError);
      // Don't fail the request if event publishing fails
    }

    res.status(201).json({ success: true, data: workout });
  } catch (error) {
    console.error('Error creating workout session:', error);
    res.status(500).json({ success: false, error: 'Failed to create workout session' });
  }
});

// Update workout session
router.put('/sessions/:id', authorize(['physical_trainer', 'coach', 'admin']), validationMiddleware(UpdateWorkoutSessionDto), checkDatabase, async (req, res) => {
  try {
    const { title, description, type, scheduledDate, location, status, playerIds, settings, exercises, intervalProgram } = req.body;
    
    const updateData = {
      title,
      description,
      type,
      status,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      location,
      playerIds,
      settings,
      exercises,
      intervalProgram
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

// Get conditioning workouts (interval programs)
router.get('/sessions/conditioning', authorize(['physical_trainer', 'coach', 'admin', 'player']), checkDatabase, async (req, res) => {
  try {
    const { teamId, playerId } = req.query;
    
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    });

    const filters = {
      teamId: teamId as string,
      playerId: playerId as string,
      type: 'CARDIO' // Filter for cardio/conditioning workouts
    };

    const result = await workoutService.getWorkoutSessions(
      filters,
      paginationParams.page,
      paginationParams.limit
    );
    
    // Filter results to only include those with intervalProgram
    const conditioningWorkouts = {
      ...result,
      data: result.data.filter((workout: any) => workout.intervalProgram)
    };
    
    res.json({ 
      success: true, 
      ...conditioningWorkouts
    });
  } catch (error) {
    console.error('Error fetching conditioning workouts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conditioning workouts' });
  }
});

// Convert interval program to exercises (for backward compatibility)
router.post('/sessions/conditioning/convert', authorize(['physical_trainer', 'coach', 'admin']), checkDatabase, async (req, res) => {
  try {
    const { intervalProgram } = req.body;
    
    if (!intervalProgram || !intervalProgram.intervals) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid interval program' 
      });
    }

    // Convert intervals to exercises format
    const exercises = intervalProgram.intervals.map((interval: any, index: number) => ({
      name: `${interval.type.charAt(0).toUpperCase() + interval.type.slice(1)} - ${Math.floor(interval.duration / 60)}:${(interval.duration % 60).toString().padStart(2, '0')}`,
      category: 'cardio',
      orderIndex: index,
      duration: interval.duration,
      sets: 1,
      reps: 1,
      unit: 'seconds',
      intensityZones: interval.targetMetrics,
      notes: interval.notes || ''
    }));

    res.json({ 
      success: true, 
      data: { exercises }
    });
  } catch (error) {
    console.error('Error converting interval program:', error);
    res.status(500).json({ success: false, error: 'Failed to convert interval program' });
  }
});

// Get interval program templates
router.get('/sessions/conditioning/templates', authorize(['physical_trainer', 'coach', 'admin']), checkDatabase, async (req, res) => {
  try {
    // This would typically fetch from a database, but for now return mock templates
    const templates = [
      {
        id: '1',
        name: '20-Minute HIIT',
        equipment: 'rowing',
        totalDuration: 1200,
        estimatedCalories: 250,
        description: 'High-intensity interval training with 30s work/30s rest'
      },
      {
        id: '2',
        name: '30-Minute Steady State',
        equipment: 'bike_erg',
        totalDuration: 1800,
        estimatedCalories: 300,
        description: 'Aerobic base building at moderate intensity'
      },
      {
        id: '3',
        name: 'Pyramid Intervals',
        equipment: 'skierg',
        totalDuration: 2400,
        estimatedCalories: 400,
        description: 'Progressive intervals: 1-2-3-2-1 minutes'
      },
      {
        id: '4',
        name: 'FTP Test',
        equipment: 'wattbike',
        totalDuration: 1200,
        estimatedCalories: 350,
        description: '20-minute functional threshold power test'
      }
    ];

    res.json({ 
      success: true, 
      data: templates
    });
  } catch (error) {
    console.error('Error fetching conditioning templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conditioning templates' });
  }
});

// Apply checkDatabase middleware to all routes
router.use(checkDatabase);

export default router;