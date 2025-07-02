import {
  SocketEventType,
  DashboardWidgetUpdateEvent,
  DashboardMetricUpdateEvent
} from '@hockey-hub/shared-lib';
import { logger } from '@hockey-hub/shared-lib';
import { AuthenticatedSocket } from '../../types/socket';

// Track dashboard subscriptions
const dashboardSubscriptions = new Map<string, Set<string>>(); // userId -> Set of widgetIds

export function registerDashboardHandlers(socket: AuthenticatedSocket, io: any) {
  // Subscribe to dashboard updates
  socket.on('dashboard:subscribe', (data: { dashboardType: string; widgets?: string[] }) => {
    try {
      if (!socket.userId) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'User not authenticated',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      // Join dashboard room based on user role
      const dashboardRoom = `dashboard:${socket.userId}:${data.dashboardType}`;
      socket.join(dashboardRoom);

      // Track widget subscriptions
      if (data.widgets && data.widgets.length > 0) {
        if (!dashboardSubscriptions.has(socket.userId)) {
          dashboardSubscriptions.set(socket.userId, new Set());
        }
        data.widgets.forEach(widgetId => {
          dashboardSubscriptions.get(socket.userId)!.add(widgetId);
          socket.join(`widget:${widgetId}`);
        });
      }

      logger.info('User subscribed to dashboard updates', {
        socketId: socket.id,
        userId: socket.userId,
        dashboardType: data.dashboardType,
        widgets: data.widgets
      });

      // Send initial dashboard state
      socket.emit('dashboard:subscribed', {
        dashboardType: data.dashboardType,
        widgets: data.widgets,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error subscribing to dashboard', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
      socket.emit(SocketEventType.CONNECTION_ERROR, {
        message: 'Failed to subscribe to dashboard updates',
        code: 'SUBSCRIBE_ERROR'
      });
    }
  });

  // Unsubscribe from dashboard updates
  socket.on('dashboard:unsubscribe', (data?: { widgets?: string[] }) => {
    try {
      if (!socket.userId) return;

      if (data?.widgets) {
        // Unsubscribe from specific widgets
        data.widgets.forEach(widgetId => {
          socket.leave(`widget:${widgetId}`);
          if (dashboardSubscriptions.has(socket.userId!)) {
            dashboardSubscriptions.get(socket.userId!)!.delete(widgetId);
          }
        });
      } else {
        // Unsubscribe from all dashboard rooms
        Array.from(socket.rooms).forEach(room => {
          if (room.startsWith('dashboard:') || room.startsWith('widget:')) {
            socket.leave(room);
          }
        });

        // Clear widget subscriptions
        dashboardSubscriptions.delete(socket.userId);
      }

      logger.info('User unsubscribed from dashboard updates', {
        socketId: socket.id,
        userId: socket.userId,
        widgets: data?.widgets
      });
    } catch (error) {
      logger.error('Error unsubscribing from dashboard', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
    }
  });

  // Request widget refresh
  socket.on('dashboard:widget:refresh', (widgetId: string) => {
    try {
      if (!socket.userId) return;

      logger.info('Widget refresh requested', {
        socketId: socket.id,
        userId: socket.userId,
        widgetId
      });

      // Emit refresh event to trigger data update
      socket.emit('dashboard:widget:refreshing', { widgetId });

      // In a real implementation, this would trigger a data fetch
      // from the appropriate service
    } catch (error) {
      logger.error('Error refreshing widget', {
        socketId: socket.id,
        userId: socket.userId,
        widgetId,
        error: error.message
      });
    }
  });

  // Handle dashboard metric updates from the user
  socket.on('dashboard:metric:update', (metric: { type: string; value: any }) => {
    try {
      if (!socket.userId) return;

      // Verify user has permission to update metrics
      const canUpdate = socket.roles?.some(role => 
        ['coach', 'physical_trainer', 'medical_staff', 'admin'].includes(role)
      );

      if (!canUpdate) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'Insufficient permissions to update metrics',
          code: 'PERMISSION_DENIED'
        });
        return;
      }

      logger.info('Dashboard metric updated', {
        socketId: socket.id,
        userId: socket.userId,
        metric
      });

      // Broadcast metric update to relevant users
      // This would typically be processed by a service first
    } catch (error) {
      logger.error('Error updating metric', {
        socketId: socket.id,
        userId: socket.userId,
        metric,
        error: error.message
      });
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      dashboardSubscriptions.delete(socket.userId);
    }
  });
}

// Utility functions for broadcasting dashboard updates from services
export function broadcastWidgetUpdate(io: any, widgetId: string, update: DashboardWidgetUpdateEvent) {
  io.to(`widget:${widgetId}`).emit(SocketEventType.DASHBOARD_WIDGET_UPDATE, update);
}

export function broadcastMetricUpdate(io: any, userId: string, update: DashboardMetricUpdateEvent) {
  io.to(`dashboard:${userId}`).emit(SocketEventType.DASHBOARD_METRIC_UPDATE, update);
}

export function broadcastDashboardUpdate(io: any, userId: string, dashboardType: string, updates: DashboardWidgetUpdateEvent[]) {
  const room = `dashboard:${userId}:${dashboardType}`;
  updates.forEach(update => {
    io.to(room).emit(SocketEventType.DASHBOARD_WIDGET_UPDATE, update);
  });
}