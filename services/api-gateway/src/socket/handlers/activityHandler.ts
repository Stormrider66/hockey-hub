import {
  SocketEventType,
  ActivityFeedEvent
} from '@hockey-hub/shared-lib';
import { logger } from '@hockey-hub/shared-lib';
import { AuthenticatedSocket } from '../../types/socket';

// Recent activity cache (last 100 items per organization)
const recentActivityCache = new Map<string, ActivityFeedEvent[]>();
const MAX_CACHE_SIZE = 100;

export function registerActivityHandlers(socket: AuthenticatedSocket, io: any) {
  // Subscribe to activity feed
  socket.on('activity:subscribe', (data?: { filter?: string; limit?: number }) => {
    try {
      if (!socket.userId || !socket.organizationId) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'User not authenticated',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      // Join activity feed rooms based on visibility
      const activityRooms = [
        `activity:user:${socket.userId}`,
        `activity:org:${socket.organizationId}`
      ];

      // Join team activity rooms
      if (socket.teamIds && socket.teamIds.length > 0) {
        socket.teamIds.forEach(teamId => {
          activityRooms.push(`activity:team:${teamId}`);
        });
      }

      // Join role-based activity rooms
      if (socket.roles && socket.roles.length > 0) {
        socket.roles.forEach(role => {
          activityRooms.push(`activity:org:${socket.organizationId}:role:${role}`);
        });
      }

      activityRooms.forEach(room => socket.join(room));

      logger.info('User subscribed to activity feed', {
        socketId: socket.id,
        userId: socket.userId,
        rooms: activityRooms,
        filter: data?.filter
      });

      // Send recent activity from cache
      const orgCache = recentActivityCache.get(socket.organizationId);
      if (orgCache) {
        const limit = data?.limit || 20;
        const recentActivities = orgCache
          .filter(activity => {
            // Filter based on visibility and user permissions
            if (activity.visibility === 'private' && activity.actor.id !== socket.userId) {
              return false;
            }
            if (activity.visibility === 'team' && socket.teamIds) {
              // Check if activity is from user's teams
              const activityTeamId = activity.metadata?.teamId;
              return activityTeamId && socket.teamIds.includes(activityTeamId);
            }
            return true;
          })
          .slice(-limit);

        socket.emit('activity:recent', {
          activities: recentActivities,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('Error subscribing to activity feed', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
      socket.emit(SocketEventType.CONNECTION_ERROR, {
        message: 'Failed to subscribe to activity feed',
        code: 'SUBSCRIBE_ERROR'
      });
    }
  });

  // Unsubscribe from activity feed
  socket.on('activity:unsubscribe', () => {
    try {
      // Leave all activity rooms
      Array.from(socket.rooms).forEach(room => {
        if (room.startsWith('activity:')) {
          socket.leave(room);
        }
      });

      logger.info('User unsubscribed from activity feed', {
        socketId: socket.id,
        userId: socket.userId
      });
    } catch (error) {
      logger.error('Error unsubscribing from activity feed', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
    }
  });

  // Mark activity as read
  socket.on('activity:mark-read', (activityIds: string[]) => {
    try {
      if (!socket.userId) return;

      logger.info('Activities marked as read', {
        socketId: socket.id,
        userId: socket.userId,
        count: activityIds.length
      });

      // In a real implementation, this would update the database
      // and potentially update unread counts
    } catch (error) {
      logger.error('Error marking activities as read', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
    }
  });

  // React to activity (like, comment, etc.)
  socket.on('activity:react', (data: { activityId: string; reaction: string }) => {
    try {
      if (!socket.userId || !socket.userEmail) return;

      logger.info('User reacted to activity', {
        socketId: socket.id,
        userId: socket.userId,
        activityId: data.activityId,
        reaction: data.reaction
      });

      // In a real implementation, this would update the activity
      // and broadcast the reaction to relevant users
    } catch (error) {
      logger.error('Error reacting to activity', {
        socketId: socket.id,
        userId: socket.userId,
        data,
        error: error.message
      });
    }
  });
}

// Utility functions for broadcasting activities from services
export function broadcastActivityEvent(io: any, activity: ActivityFeedEvent, organizationId: string) {
  // Add to cache
  if (!recentActivityCache.has(organizationId)) {
    recentActivityCache.set(organizationId, []);
  }
  
  const orgCache = recentActivityCache.get(organizationId)!;
  orgCache.push(activity);
  
  // Maintain cache size
  if (orgCache.length > MAX_CACHE_SIZE) {
    orgCache.shift();
  }

  // Broadcast based on visibility
  switch (activity.visibility) {
    case 'public':
      // Broadcast to entire organization
      io.to(`activity:org:${organizationId}`).emit(SocketEventType.ACTIVITY_FEED_NEW, activity);
      break;
      
    case 'team':
      // Broadcast to specific team
      if (activity.metadata?.teamId) {
        io.to(`activity:team:${activity.metadata.teamId}`).emit(SocketEventType.ACTIVITY_FEED_NEW, activity);
      }
      break;
      
    case 'organization':
      // Broadcast to organization members
      io.to(`activity:org:${organizationId}`).emit(SocketEventType.ACTIVITY_FEED_NEW, activity);
      break;
      
    case 'private':
      // Broadcast only to specific user
      io.to(`activity:user:${activity.actor.id}`).emit(SocketEventType.ACTIVITY_FEED_NEW, activity);
      if (activity.target && activity.metadata?.targetUserId) {
        io.to(`activity:user:${activity.metadata.targetUserId}`).emit(SocketEventType.ACTIVITY_FEED_NEW, activity);
      }
      break;
  }
}

export function createActivityEvent(
  type: 'user_action' | 'system_event' | 'achievement' | 'announcement',
  actor: { id: string; name: string; avatar?: string; role: string },
  action: string,
  target?: { type: string; id: string; name: string },
  metadata?: Record<string, any>,
  visibility: 'public' | 'team' | 'organization' | 'private' = 'organization'
): ActivityFeedEvent {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    actor,
    action,
    target,
    metadata,
    timestamp: new Date(),
    visibility
  };
}

// Clear activity cache for an organization (useful for cleanup)
export function clearActivityCache(organizationId: string) {
  recentActivityCache.delete(organizationId);
}