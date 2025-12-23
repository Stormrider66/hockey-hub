// @ts-nocheck - Express routes with multiple return paths and complex types
import { Router, IRouter } from 'express';
import { TrainingIntegrationService } from '../services/trainingIntegrationService';

const router: any = Router();
const trainingService = new TrainingIntegrationService();

// Sync a training session to calendar
router.post('/sync', async (req, res) => {
  try {
    const { session, organizationId } = req.body;

    if (!session || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'session and organizationId are required',
      });
    }

    const event = await trainingService.syncTrainingSession(session, organizationId);
    
    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error syncing training session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync training session',
    });
  }
});

// Remove training session from calendar
router.delete('/session/:trainingId', async (req, res) => {
  try {
    await trainingService.removeTrainingSession(req.params.trainingId);
    
    res.json({
      success: true,
      message: 'Training session removed from calendar',
    });
  } catch (error) {
    console.error('Error removing training session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove training session',
    });
  }
});

// Mark workout as completed
router.post('/session/:trainingId/complete', async (req, res) => {
  try {
    const { userId, completionData } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    await trainingService.markWorkoutCompleted(
      req.params.trainingId,
      userId,
      completionData
    );
    
    res.json({
      success: true,
      message: 'Workout marked as completed',
    });
  } catch (error) {
    console.error('Error marking workout completed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark workout as completed',
    });
  }
});

// Get user's training calendar
router.get('/user/:userId', async (req, res) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'organizationId, startDate, and endDate are required',
      });
    }

    const events = await trainingService.getUserTrainingCalendar(
      req.params.userId,
      organizationId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching user training calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training calendar',
    });
  }
});

// Get team's training calendar
router.get('/team/:teamId', async (req, res) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'organizationId, startDate, and endDate are required',
      });
    }

    const events = await trainingService.getTeamTrainingCalendar(
      req.params.teamId,
      organizationId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching team training calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training calendar',
    });
  }
});

// Create recurring training sessions
router.post('/recurring', async (req, res) => {
  try {
    const { baseSession, organizationId, recurrencePattern } = req.body;

    if (!baseSession || !organizationId || !recurrencePattern) {
      return res.status(400).json({
        success: false,
        message: 'baseSession, organizationId, and recurrencePattern are required',
      });
    }

    const events = await trainingService.createRecurringTraining(
      baseSession,
      organizationId,
      recurrencePattern
    );
    
    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error('Error creating recurring training:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recurring training sessions',
    });
  }
});

export default router;