import { Socket } from 'socket.io';
import {
  SocketEventType,
  TrainingSessionUpdateEvent,
  TrainingSessionJoinEvent,
  TrainingSessionLeaveEvent
} from '@hockey-hub/shared-lib';
import { logger } from '@hockey-hub/shared-lib';
import { AuthenticatedSocket } from '../../types/socket';

// Track active training sessions
const activeTrainingSessions = new Map<string, Set<string>>(); // sessionId -> Set of userIds

export function registerTrainingHandlers(socket: AuthenticatedSocket) {
  // Join training session
  socket.on(SocketEventType.TRAINING_SESSION_JOIN, async (sessionId: string) => {
    try {
      if (!socket.userId) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'User not authenticated',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      // Join the training session room
      const sessionRoom = `training:${sessionId}`;
      socket.join(sessionRoom);

      // Track active participants
      if (!activeTrainingSessions.has(sessionId)) {
        activeTrainingSessions.set(sessionId, new Set());
      }
      activeTrainingSessions.get(sessionId)!.add(socket.userId);

      // Create join event
      const joinEvent: TrainingSessionJoinEvent = {
        sessionId,
        userId: socket.userId,
        userRole: socket.roles?.[0] || 'player',
        userName: socket.userEmail || 'Unknown User'
      };

      // Notify other participants
      socket.to(sessionRoom).emit(SocketEventType.TRAINING_SESSION_JOIN, joinEvent);

      // Send current participants to the joining user
      const participants = Array.from(activeTrainingSessions.get(sessionId) || []);
      socket.emit('training:session:participants', {
        sessionId,
        participants,
        count: participants.length
      });

      logger.info('User joined training session', {
        socketId: socket.id,
        userId: socket.userId,
        sessionId,
        participantCount: participants.length
      });
    } catch (error) {
      logger.error('Error joining training session', {
        socketId: socket.id,
        userId: socket.userId,
        sessionId,
        error: error.message
      });
      socket.emit(SocketEventType.CONNECTION_ERROR, {
        message: 'Failed to join training session',
        code: 'JOIN_ERROR'
      });
    }
  });

  // Leave training session
  socket.on(SocketEventType.TRAINING_SESSION_LEAVE, async (sessionId: string) => {
    try {
      if (!socket.userId) return;

      const sessionRoom = `training:${sessionId}`;
      socket.leave(sessionRoom);

      // Remove from active participants
      if (activeTrainingSessions.has(sessionId)) {
        activeTrainingSessions.get(sessionId)!.delete(socket.userId);
        if (activeTrainingSessions.get(sessionId)!.size === 0) {
          activeTrainingSessions.delete(sessionId);
        }
      }

      // Create leave event
      const leaveEvent: TrainingSessionLeaveEvent = {
        sessionId,
        userId: socket.userId
      };

      // Notify other participants
      socket.to(sessionRoom).emit(SocketEventType.TRAINING_SESSION_LEAVE, leaveEvent);

      logger.info('User left training session', {
        socketId: socket.id,
        userId: socket.userId,
        sessionId
      });
    } catch (error) {
      logger.error('Error leaving training session', {
        socketId: socket.id,
        userId: socket.userId,
        sessionId,
        error: error.message
      });
    }
  });

  // Update training session
  socket.on(SocketEventType.TRAINING_SESSION_UPDATE, async (data: Partial<TrainingSessionUpdateEvent>) => {
    try {
      if (!socket.userId || !data.sessionId) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'Invalid update request',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      // Check if user has permission to update (coach, trainer, or admin)
      const canUpdate = socket.roles?.some(role => 
        ['coach', 'physical_trainer', 'admin', 'club_admin'].includes(role)
      );

      if (!canUpdate) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'Insufficient permissions to update session',
          code: 'PERMISSION_DENIED'
        });
        return;
      }

      // Create update event
      const updateEvent: TrainingSessionUpdateEvent = {
        sessionId: data.sessionId,
        updates: data.updates || {},
        updatedBy: socket.userId,
        timestamp: new Date()
      };

      // Broadcast to all participants in the session
      const sessionRoom = `training:${data.sessionId}`;
      socket.to(sessionRoom).emit(SocketEventType.TRAINING_SESSION_UPDATE, updateEvent);

      // Also emit to the sender for confirmation
      socket.emit(SocketEventType.TRAINING_SESSION_UPDATE, updateEvent);

      // If session status changed to completed, clean up
      if (data.updates?.status === 'completed') {
        activeTrainingSessions.delete(data.sessionId);
      }

      logger.info('Training session updated', {
        socketId: socket.id,
        userId: socket.userId,
        sessionId: data.sessionId,
        updates: data.updates
      });
    } catch (error) {
      logger.error('Error updating training session', {
        socketId: socket.id,
        userId: socket.userId,
        data,
        error: error.message
      });
      socket.emit(SocketEventType.CONNECTION_ERROR, {
        message: 'Failed to update training session',
        code: 'UPDATE_ERROR'
      });
    }
  });

  // Handle disconnect - clean up training sessions
  socket.on('disconnect', () => {
    if (!socket.userId) return;

    // Remove user from all active training sessions
    activeTrainingSessions.forEach((participants, sessionId) => {
      if (participants.has(socket.userId!)) {
        participants.delete(socket.userId!);
        
        // Notify other participants
        const sessionRoom = `training:${sessionId}`;
        socket.to(sessionRoom).emit(SocketEventType.TRAINING_SESSION_LEAVE, {
          sessionId,
          userId: socket.userId
        });

        // Clean up empty sessions
        if (participants.size === 0) {
          activeTrainingSessions.delete(sessionId);
        }
      }
    });
  });
}

// Utility function to broadcast training updates from other services
export function broadcastTrainingUpdate(io: any, sessionId: string, update: TrainingSessionUpdateEvent) {
  const sessionRoom = `training:${sessionId}`;
  io.to(sessionRoom).emit(SocketEventType.TRAINING_SESSION_UPDATE, update);
}