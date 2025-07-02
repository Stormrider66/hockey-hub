import {
  SocketEventType,
  CalendarEventUpdateEvent,
  CalendarEventCreatedEvent,
  CalendarEventDeletedEvent
} from '@hockey-hub/shared-lib';
import { logger } from '@hockey-hub/shared-lib';
import { AuthenticatedSocket } from '../../types/socket';

export function registerCalendarHandlers(socket: AuthenticatedSocket, io: any) {
  // Subscribe to calendar updates
  socket.on('calendar:subscribe', (data: { view: 'month' | 'week' | 'day' | 'agenda'; date?: string }) => {
    try {
      if (!socket.userId || !socket.organizationId) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'User not authenticated',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      // Join calendar rooms based on user's access
      const calendarRooms = [
        `calendar:org:${socket.organizationId}`,
        `calendar:user:${socket.userId}`
      ];

      // Join team calendar rooms
      if (socket.teamIds && socket.teamIds.length > 0) {
        socket.teamIds.forEach(teamId => {
          calendarRooms.push(`calendar:team:${teamId}`);
        });
      }

      // Join all calendar rooms
      calendarRooms.forEach(room => socket.join(room));

      logger.info('User subscribed to calendar updates', {
        socketId: socket.id,
        userId: socket.userId,
        rooms: calendarRooms,
        view: data.view
      });

      // Send acknowledgment
      socket.emit('calendar:subscribed', {
        rooms: calendarRooms,
        view: data.view,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error subscribing to calendar', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
      socket.emit(SocketEventType.CONNECTION_ERROR, {
        message: 'Failed to subscribe to calendar updates',
        code: 'SUBSCRIBE_ERROR'
      });
    }
  });

  // Unsubscribe from calendar updates
  socket.on('calendar:unsubscribe', () => {
    try {
      // Leave all calendar rooms
      Array.from(socket.rooms).forEach(room => {
        if (room.startsWith('calendar:')) {
          socket.leave(room);
        }
      });

      logger.info('User unsubscribed from calendar updates', {
        socketId: socket.id,
        userId: socket.userId
      });
    } catch (error) {
      logger.error('Error unsubscribing from calendar', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
    }
  });

  // Handle calendar event updates (from authorized users)
  socket.on(SocketEventType.CALENDAR_EVENT_UPDATE, async (data: Partial<CalendarEventUpdateEvent>) => {
    try {
      if (!socket.userId || !data.eventId) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'Invalid update request',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      // Check if user has permission to update calendar events
      const canUpdate = socket.roles?.some(role => 
        ['coach', 'admin', 'club_admin', 'equipment_manager', 'medical_staff'].includes(role)
      );

      if (!canUpdate) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'Insufficient permissions to update calendar',
          code: 'PERMISSION_DENIED'
        });
        return;
      }

      // Create update event
      const updateEvent: CalendarEventUpdateEvent = {
        eventId: data.eventId,
        eventType: data.eventType || 'meeting',
        changes: data.changes || {},
        affectedUsers: data.affectedUsers || [],
        updatedBy: socket.userId
      };

      // Broadcast to affected users and teams
      if (updateEvent.affectedUsers.length > 0) {
        updateEvent.affectedUsers.forEach(userId => {
          io.to(`calendar:user:${userId}`).emit(SocketEventType.CALENDAR_EVENT_UPDATE, updateEvent);
        });
      }

      // Broadcast to organization
      if (socket.organizationId) {
        io.to(`calendar:org:${socket.organizationId}`).emit(SocketEventType.CALENDAR_EVENT_UPDATE, updateEvent);
      }

      logger.info('Calendar event updated', {
        socketId: socket.id,
        userId: socket.userId,
        eventId: data.eventId,
        changes: data.changes
      });
    } catch (error) {
      logger.error('Error updating calendar event', {
        socketId: socket.id,
        userId: socket.userId,
        data,
        error: error.message
      });
      socket.emit(SocketEventType.CONNECTION_ERROR, {
        message: 'Failed to update calendar event',
        code: 'UPDATE_ERROR'
      });
    }
  });
}

// Utility functions for broadcasting calendar events from services
export function broadcastCalendarEventCreated(io: any, event: CalendarEventCreatedEvent, organizationId: string, teamIds?: string[]) {
  // Broadcast to organization
  io.to(`calendar:org:${organizationId}`).emit(SocketEventType.CALENDAR_EVENT_CREATED, event);

  // Broadcast to teams
  if (teamIds && teamIds.length > 0) {
    teamIds.forEach(teamId => {
      io.to(`calendar:team:${teamId}`).emit(SocketEventType.CALENDAR_EVENT_CREATED, event);
    });
  }

  // Broadcast to specific users
  if (event.event.participants && event.event.participants.length > 0) {
    event.event.participants.forEach(userId => {
      io.to(`calendar:user:${userId}`).emit(SocketEventType.CALENDAR_EVENT_CREATED, event);
    });
  }
}

export function broadcastCalendarEventUpdated(io: any, event: CalendarEventUpdateEvent, organizationId: string, teamIds?: string[]) {
  // Broadcast to organization
  io.to(`calendar:org:${organizationId}`).emit(SocketEventType.CALENDAR_EVENT_UPDATE, event);

  // Broadcast to teams
  if (teamIds && teamIds.length > 0) {
    teamIds.forEach(teamId => {
      io.to(`calendar:team:${teamId}`).emit(SocketEventType.CALENDAR_EVENT_UPDATE, event);
    });
  }

  // Broadcast to affected users
  if (event.affectedUsers && event.affectedUsers.length > 0) {
    event.affectedUsers.forEach(userId => {
      io.to(`calendar:user:${userId}`).emit(SocketEventType.CALENDAR_EVENT_UPDATE, event);
    });
  }
}

export function broadcastCalendarEventDeleted(io: any, event: CalendarEventDeletedEvent, organizationId: string, teamIds?: string[]) {
  // Broadcast to organization
  io.to(`calendar:org:${organizationId}`).emit(SocketEventType.CALENDAR_EVENT_DELETED, event);

  // Broadcast to teams
  if (teamIds && teamIds.length > 0) {
    teamIds.forEach(teamId => {
      io.to(`calendar:team:${teamId}`).emit(SocketEventType.CALENDAR_EVENT_DELETED, event);
    });
  }

  // Broadcast to affected users
  if (event.affectedUsers && event.affectedUsers.length > 0) {
    event.affectedUsers.forEach(userId => {
      io.to(`calendar:user:${userId}`).emit(SocketEventType.CALENDAR_EVENT_DELETED, event);
    });
  }
}