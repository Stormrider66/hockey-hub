import { Router, type Router as ExpressRouter } from 'express';
import { AppDataSource } from '../config/database';
import { WorkoutExecution, ExerciseExecution, WorkoutSession } from '../entities';
import { Server } from 'socket.io';
import { parsePaginationParams, paginateArray } from '@hockey-hub/shared-lib';

const router: ExpressRouter = Router();

// Initialize execution routes with Socket.io instance
export const createExecutionRoutes = (io: Server) => {
  // Start workout execution
  router.post('/executions/start', async (req, res) => {
    try {
      const { workoutSessionId, playerId } = req.body;
      
      const executionRepo = AppDataSource.getRepository(WorkoutExecution);
      const sessionRepo = AppDataSource.getRepository(WorkoutSession);

      // Check if session exists
      const session = await sessionRepo.findOne({
        where: { id: workoutSessionId },
        relations: ['exercises']
      });

      if (!session) {
        return res.status(404).json({ success: false, error: 'Workout session not found' });
      }

      // Check for existing execution
      let execution = await executionRepo.findOne({
        where: { workoutSessionId, playerId }
      });

      if (execution && execution.status === 'in_progress') {
        return res.status(400).json({ success: false, error: 'Workout already in progress' });
      }

      // Create new execution
      execution = executionRepo.create({
        workoutSessionId,
        playerId,
        status: 'in_progress',
        startedAt: new Date(),
        currentExerciseIndex: 0,
        currentSetNumber: 1,
        completionPercentage: 0
      });

      const savedExecution = await executionRepo.save(execution);

      // Update session status if this is the first player starting
      const activeExecutions = await executionRepo.count({
        where: { workoutSessionId, status: 'in_progress' }
      });

      if (activeExecutions === 1) {
        session.status = 'active';
        await sessionRepo.save(session);
      }

      // Emit socket event
      io.to(`session:${workoutSessionId}`).emit('execution:started', {
        executionId: savedExecution.id,
        playerId,
        workoutSessionId
      });

      res.json({ success: true, data: savedExecution });
    } catch (error) {
      console.error('Error starting workout execution:', error);
      res.status(500).json({ success: false, error: 'Failed to start workout execution' });
    }
  });

  // Update execution progress
  router.put('/executions/:id/progress', async (req, res) => {
    try {
      const { currentExerciseIndex, currentSetNumber, completionPercentage, metrics } = req.body;
      
      const executionRepo = AppDataSource.getRepository(WorkoutExecution);
      const execution = await executionRepo.findOne({
        where: { id: req.params.id }
      });

      if (!execution) {
        return res.status(404).json({ success: false, error: 'Execution not found' });
      }

      if (currentExerciseIndex !== undefined) execution.currentExerciseIndex = currentExerciseIndex;
      if (currentSetNumber !== undefined) execution.currentSetNumber = currentSetNumber;
      if (completionPercentage !== undefined) execution.completionPercentage = completionPercentage;
      if (metrics) execution.metrics = { ...execution.metrics, ...metrics };

      const savedExecution = await executionRepo.save(execution);

      // Emit socket event
      io.to(`session:${execution.workoutSessionId}`).emit('execution:progress', {
        executionId: execution.id,
        playerId: execution.playerId,
        currentExerciseIndex,
        currentSetNumber,
        completionPercentage,
        metrics
      });

      res.json({ success: true, data: savedExecution });
    } catch (error) {
      console.error('Error updating execution progress:', error);
      res.status(500).json({ success: false, error: 'Failed to update execution progress' });
    }
  });

  // Complete exercise set
  router.post('/executions/:executionId/exercises', async (req, res) => {
    try {
      const { exerciseId, exerciseName, setNumber, actualReps, actualWeight, actualDuration, actualDistance, actualPower, performanceMetrics, notes } = req.body;
      
      const exerciseExecRepo = AppDataSource.getRepository(ExerciseExecution);
      const executionRepo = AppDataSource.getRepository(WorkoutExecution);

      const execution = await executionRepo.findOne({
        where: { id: req.params.executionId }
      });

      if (!execution) {
        return res.status(404).json({ success: false, error: 'Execution not found' });
      }

      const exerciseExecution = exerciseExecRepo.create({
        workoutExecutionId: execution.id,
        exerciseId,
        exerciseName,
        setNumber,
        actualReps,
        actualWeight,
        actualDuration,
        actualDistance,
        actualPower,
        performanceMetrics,
        notes
      });

      const savedExerciseExecution = await exerciseExecRepo.save(exerciseExecution);

      // Emit socket event
      io.to(`session:${execution.workoutSessionId}`).emit('exercise:completed', {
        executionId: execution.id,
        playerId: execution.playerId,
        exerciseId,
        setNumber,
        performance: {
          actualReps,
          actualWeight,
          actualDuration,
          actualPower
        }
      });

      res.json({ success: true, data: savedExerciseExecution });
    } catch (error) {
      console.error('Error completing exercise set:', error);
      res.status(500).json({ success: false, error: 'Failed to complete exercise set' });
    }
  });

  // Complete workout execution
  router.put('/executions/:id/complete', async (req, res) => {
    try {
      const executionRepo = AppDataSource.getRepository(WorkoutExecution);
      const sessionRepo = AppDataSource.getRepository(WorkoutSession);
      
      const execution = await executionRepo.findOne({
        where: { id: req.params.id }
      });

      if (!execution) {
        return res.status(404).json({ success: false, error: 'Execution not found' });
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.completionPercentage = 100;

      const savedExecution = await executionRepo.save(execution);

      // Check if all players have completed
      const incompleteExecutions = await executionRepo.count({
        where: { 
          workoutSessionId: execution.workoutSessionId, 
          status: 'in_progress' 
        }
      });

      if (incompleteExecutions === 0) {
        await sessionRepo.update(execution.workoutSessionId, { status: 'completed' });
      }

      // Emit socket event
      io.to(`session:${execution.workoutSessionId}`).emit('execution:completed', {
        executionId: execution.id,
        playerId: execution.playerId,
        completedAt: execution.completedAt
      });

      res.json({ success: true, data: savedExecution });
    } catch (error) {
      console.error('Error completing workout execution:', error);
      res.status(500).json({ success: false, error: 'Failed to complete workout execution' });
    }
  });

  // Get execution details
  router.get('/executions/:id', async (req, res) => {
    try {
      const executionRepo = AppDataSource.getRepository(WorkoutExecution);
      const execution = await executionRepo.findOne({
        where: { id: req.params.id },
        relations: ['workoutSession', 'exerciseExecutions']
      });

      if (!execution) {
        return res.status(404).json({ success: false, error: 'Execution not found' });
      }

      res.json({ success: true, data: execution });
    } catch (error) {
      console.error('Error fetching execution:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch execution' });
    }
  });

  // Get all executions for a session with pagination
  router.get('/sessions/:sessionId/executions', async (req, res) => {
    try {
      // Parse pagination parameters
      const paginationParams = parsePaginationParams(req.query, {
        page: 1,
        limit: 20,
        maxLimit: 100
      });
      
      const executionRepo = AppDataSource.getRepository(WorkoutExecution);
      const executions = await executionRepo.find({
        where: { workoutSessionId: req.params.sessionId },
        relations: ['exerciseExecutions'],
        order: { createdAt: 'DESC' }
      });
      
      // Apply pagination to the results
      const result = paginateArray(executions, paginationParams);

      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error fetching executions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch executions' });
    }
  });

  return router;
};