import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { WorkoutSession } from '../entities/WorkoutSession';
import { trainingSessionSocketService } from '../services/TrainingSessionSocketService';
import { logger } from '@hockey-hub/shared-lib';
import {
  TrainingSessionState,
  PlayerMetrics,
  ExerciseProgress,
  IntervalProgress,
} from '@hockey-hub/shared-types';

/**
 * Start a live training session
 */
export const startLiveSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const trainerId = (req as any).user?.id;

    if (!trainerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get session from database
    const sessionRepo = AppDataSource.getRepository(WorkoutSession);
    const session = await sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['workout', 'players'],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Ensure socket service is connected
    if (!trainingSessionSocketService.isConnected()) {
      await trainingSessionSocketService.connect();
    }

    // Join session as trainer
    const sessionState = await trainingSessionSocketService.joinSessionAsTrainer(sessionId);

    // Start the session
    trainingSessionSocketService.startSession(sessionId);

    // Update database
    session.status = 'in_progress';
    session.startTime = new Date();
    await sessionRepo.save(session);

    logger.info(`Live session started: ${sessionId} by trainer ${trainerId}`);

    res.json({
      message: 'Live session started',
      session: sessionState,
    });
  } catch (error) {
    logger.error('Error starting live session:', error);
    res.status(500).json({ error: 'Failed to start live session' });
  }
};

/**
 * End a live training session
 */
export const endLiveSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const trainerId = (req as any).user?.id;

    if (!trainerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get session from database
    const sessionRepo = AppDataSource.getRepository(WorkoutSession);
    const session = await sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // End the session via socket
    trainingSessionSocketService.endSession(sessionId);

    // Update database
    session.status = 'completed';
    session.endTime = new Date();
    if (session.startTime) {
      session.duration = Math.floor(
        (session.endTime.getTime() - session.startTime.getTime()) / 1000
      );
    }
    await sessionRepo.save(session);

    logger.info(`Live session ended: ${sessionId} by trainer ${trainerId}`);

    res.json({
      message: 'Live session ended',
      duration: session.duration,
    });
  } catch (error) {
    logger.error('Error ending live session:', error);
    res.status(500).json({ error: 'Failed to end live session' });
  }
};

/**
 * Pause a live training session
 */
export const pauseLiveSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const trainerId = (req as any).user?.id;

    if (!trainerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Pause via socket
    trainingSessionSocketService.pauseSession(sessionId);

    // Update database
    const sessionRepo = AppDataSource.getRepository(WorkoutSession);
    await sessionRepo.update(sessionId, {
      status: 'paused',
    });

    logger.info(`Live session paused: ${sessionId} by trainer ${trainerId}`);

    res.json({ message: 'Live session paused' });
  } catch (error) {
    logger.error('Error pausing live session:', error);
    res.status(500).json({ error: 'Failed to pause live session' });
  }
};

/**
 * Resume a live training session
 */
export const resumeLiveSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const trainerId = (req as any).user?.id;

    if (!trainerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Resume via socket
    trainingSessionSocketService.resumeSession(sessionId);

    // Update database
    const sessionRepo = AppDataSource.getRepository(WorkoutSession);
    await sessionRepo.update(sessionId, {
      status: 'in_progress',
    });

    logger.info(`Live session resumed: ${sessionId} by trainer ${trainerId}`);

    res.json({ message: 'Live session resumed' });
  } catch (error) {
    logger.error('Error resuming live session:', error);
    res.status(500).json({ error: 'Failed to resume live session' });
  }
};

/**
 * Update player metrics
 */
export const updatePlayerMetrics = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const metrics: PlayerMetrics = req.body;

    // Validate metrics
    if (!metrics.playerId || !metrics.timestamp) {
      return res.status(400).json({ error: 'Invalid metrics data' });
    }

    // Send via socket
    trainingSessionSocketService.updatePlayerMetrics(sessionId, {
      ...metrics,
      sessionId,
      timestamp: new Date(metrics.timestamp),
    });

    res.json({ message: 'Metrics updated' });
  } catch (error) {
    logger.error('Error updating player metrics:', error);
    res.status(500).json({ error: 'Failed to update metrics' });
  }
};

/**
 * Update exercise progress
 */
export const updateExerciseProgress = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const progress: ExerciseProgress = req.body;

    // Validate progress
    if (!progress.playerId || !progress.exerciseId) {
      return res.status(400).json({ error: 'Invalid progress data' });
    }

    // Send via socket
    trainingSessionSocketService.updateExerciseProgress(sessionId, {
      ...progress,
      sessionId,
      timestamp: new Date(progress.timestamp || Date.now()),
    });

    res.json({ message: 'Exercise progress updated' });
  } catch (error) {
    logger.error('Error updating exercise progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

/**
 * Update interval progress
 */
export const updateIntervalProgress = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const progress: IntervalProgress = req.body;

    // Validate progress
    if (!progress.playerId || !progress.intervalId) {
      return res.status(400).json({ error: 'Invalid progress data' });
    }

    // Send via socket
    trainingSessionSocketService.updateIntervalProgress(sessionId, {
      ...progress,
      sessionId,
      timestamp: new Date(progress.timestamp || Date.now()),
    });

    res.json({ message: 'Interval progress updated' });
  } catch (error) {
    logger.error('Error updating interval progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

/**
 * Kick a player from session
 */
export const kickPlayer = async (req: Request, res: Response) => {
  try {
    const { sessionId, playerId } = req.params;
    const trainerId = (req as any).user?.id;

    if (!trainerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Kick via socket
    trainingSessionSocketService.kickPlayer(sessionId, playerId);

    logger.info(`Player ${playerId} kicked from session ${sessionId} by trainer ${trainerId}`);

    res.json({ message: 'Player kicked from session' });
  } catch (error) {
    logger.error('Error kicking player:', error);
    res.status(500).json({ error: 'Failed to kick player' });
  }
};

/**
 * Force end a session
 */
export const forceEndSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const trainerId = (req as any).user?.id;

    if (!trainerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Force end via socket
    trainingSessionSocketService.forceEndSession(sessionId);

    // Update database
    const sessionRepo = AppDataSource.getRepository(WorkoutSession);
    await sessionRepo.update(sessionId, {
      status: 'cancelled',
      endTime: new Date(),
    });

    logger.info(`Session ${sessionId} forcefully ended by trainer ${trainerId}`);

    res.json({ message: 'Session forcefully ended' });
  } catch (error) {
    logger.error('Error force ending session:', error);
    res.status(500).json({ error: 'Failed to force end session' });
  }
};