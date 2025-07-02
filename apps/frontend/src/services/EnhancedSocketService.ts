import { io, Socket } from 'socket.io-client';
import { store } from '@/store/store';
import {
  startConnecting,
  connectionSuccess,
  connectionError,
  connectionLost,
  reconnectAttempt,
  joinRoom,
  leaveRoom,
  updateLatency,
  queueOfflineEvent,
  clearOfflineQueue,
  enableFeature,
  disableFeature,
  joinSession,
  leaveSession
} from '@/store/slices/socketSlice';
import { SocketEventType, ClientToServerEvents, ServerToClientEvents } from '@hockey-hub/shared-lib';
import { toast } from 'react-hot-toast';

// Enhanced Socket with typed events
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export class EnhancedSocketService {
  private static instance: EnhancedSocketService;
  private socket: TypedSocket | null = null;
  private latencyCheckInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  private constructor() {}

  public static getInstance(): EnhancedSocketService {
    if (!EnhancedSocketService.instance) {
      EnhancedSocketService.instance = new EnhancedSocketService();
    }
    return EnhancedSocketService.instance;
  }

  public connect(token: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    store.dispatch(startConnecting());

    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      path: '/socket.io/'
    }) as TypedSocket;

    this.setupEventHandlers();
    this.startLatencyCheck();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      
      // Process offline queue
      const state = store.getState();
      const offlineQueue = state.socket.offlineEventQueue;
      
      if (offlineQueue.length > 0) {
        console.log(`Processing ${offlineQueue.length} offline events`);
        offlineQueue.forEach(({ event, data }) => {
          this.emit(event as any, data);
        });
        store.dispatch(clearOfflineQueue());
      }
    });

    this.socket.on(SocketEventType.CONNECTION_SUCCESS, (data) => {
      store.dispatch(connectionSuccess({
        connectionId: data.sessionId,
        timestamp: new Date().toISOString()
      }));
      toast.success('Connected to server');
    });

    this.socket.on(SocketEventType.CONNECTION_ERROR, (error) => {
      store.dispatch(connectionError({
        error: error.message,
        timestamp: new Date().toISOString()
      }));
      toast.error(`Connection error: ${error.message}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      store.dispatch(connectionLost({
        reason,
        timestamp: new Date().toISOString()
      }));
      
      if (reason === 'io server disconnect') {
        toast.error('Disconnected by server');
      } else if (reason === 'transport close') {
        toast.warning('Connection lost, attempting to reconnect...');
      }
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      store.dispatch(reconnectAttempt({ attempt }));
    });

    this.socket.on('reconnect', () => {
      toast.success('Reconnected to server');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      toast.error('Failed to reconnect to server');
    });

    // Feature events
    this.registerGenericHandlers();
  }

  private registerGenericHandlers(): void {
    if (!this.socket) return;

    // Training events
    this.socket.on(SocketEventType.TRAINING_SESSION_UPDATE, (data) => {
      this.notifyHandlers(SocketEventType.TRAINING_SESSION_UPDATE, data);
    });

    this.socket.on(SocketEventType.TRAINING_SESSION_JOIN, (data) => {
      this.notifyHandlers(SocketEventType.TRAINING_SESSION_JOIN, data);
    });

    this.socket.on(SocketEventType.TRAINING_SESSION_LEAVE, (data) => {
      this.notifyHandlers(SocketEventType.TRAINING_SESSION_LEAVE, data);
    });

    // Calendar events
    this.socket.on(SocketEventType.CALENDAR_EVENT_UPDATE, (data) => {
      this.notifyHandlers(SocketEventType.CALENDAR_EVENT_UPDATE, data);
    });

    this.socket.on(SocketEventType.CALENDAR_EVENT_CREATED, (data) => {
      this.notifyHandlers(SocketEventType.CALENDAR_EVENT_CREATED, data);
    });

    this.socket.on(SocketEventType.CALENDAR_EVENT_DELETED, (data) => {
      this.notifyHandlers(SocketEventType.CALENDAR_EVENT_DELETED, data);
    });

    // Dashboard events
    this.socket.on(SocketEventType.DASHBOARD_WIDGET_UPDATE, (data) => {
      this.notifyHandlers(SocketEventType.DASHBOARD_WIDGET_UPDATE, data);
    });

    this.socket.on(SocketEventType.DASHBOARD_METRIC_UPDATE, (data) => {
      this.notifyHandlers(SocketEventType.DASHBOARD_METRIC_UPDATE, data);
    });

    // Activity events
    this.socket.on(SocketEventType.ACTIVITY_FEED_NEW, (data) => {
      this.notifyHandlers(SocketEventType.ACTIVITY_FEED_NEW, data);
    });

    // Collaboration events
    this.socket.on(SocketEventType.COLLABORATION_CURSOR, (data) => {
      this.notifyHandlers(SocketEventType.COLLABORATION_CURSOR, data);
    });

    this.socket.on(SocketEventType.COLLABORATION_EDIT, (data) => {
      this.notifyHandlers(SocketEventType.COLLABORATION_EDIT, data);
    });

    // Room events
    this.socket.on(SocketEventType.ROOM_USERS_UPDATE, (data) => {
      this.notifyHandlers(SocketEventType.ROOM_USERS_UPDATE, data);
    });

    // System events
    this.socket.on(SocketEventType.SYSTEM_MAINTENANCE, (data) => {
      this.notifyHandlers(SocketEventType.SYSTEM_MAINTENANCE, data);
      toast.warning(`System maintenance: ${data.message}`);
    });

    this.socket.on(SocketEventType.SERVICE_STATUS_UPDATE, (data) => {
      this.notifyHandlers(SocketEventType.SERVICE_STATUS_UPDATE, data);
    });
  }

  private startLatencyCheck(): void {
    this.latencyCheckInterval = setInterval(() => {
      if (this.socket?.connected) {
        const start = Date.now();
        
        this.socket.emit('ping');
        this.socket.once('pong', () => {
          const latency = Date.now() - start;
          store.dispatch(updateLatency({ latency }));
        });
      }
    }, 5000); // Check every 5 seconds
  }

  // Public methods
  public disconnect(): void {
    if (this.latencyCheckInterval) {
      clearInterval(this.latencyCheckInterval);
      this.latencyCheckInterval = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.eventHandlers.clear();
  }

  public emit(event: keyof ClientToServerEvents, data?: any): void {
    if (this.socket?.connected) {
      (this.socket as any).emit(event, data);
    } else {
      // Queue for offline processing
      store.dispatch(queueOfflineEvent({ event: event as string, data }));
    }
  }

  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  public off(event: string, handler: Function): void {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.delete(handler);
    }
  }

  public once(event: string, handler: Function): void {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  private notifyHandlers(event: string, data: any): void {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Feature-specific methods
  public joinTrainingSession(sessionId: string): void {
    this.emit(SocketEventType.TRAINING_SESSION_JOIN, sessionId);
    store.dispatch(joinSession({ type: 'training', sessionId }));
    store.dispatch(enableFeature({ feature: 'training' }));
  }

  public leaveTrainingSession(sessionId: string): void {
    this.emit(SocketEventType.TRAINING_SESSION_LEAVE, sessionId);
    store.dispatch(leaveSession({ type: 'training', sessionId }));
  }

  public updateTrainingSession(sessionId: string, updates: any): void {
    this.emit(SocketEventType.TRAINING_SESSION_UPDATE, { sessionId, updates });
  }

  public subscribeToCalendar(view: 'month' | 'week' | 'day' | 'agenda', date?: string): void {
    this.emit('calendar:subscribe', { view, date });
    store.dispatch(enableFeature({ feature: 'calendar' }));
  }

  public unsubscribeFromCalendar(): void {
    this.emit('calendar:unsubscribe');
    store.dispatch(disableFeature({ feature: 'calendar' }));
  }

  public subscribeToDashboard(dashboardType: string, widgets?: string[]): void {
    this.emit('dashboard:subscribe', { dashboardType, widgets });
    store.dispatch(enableFeature({ feature: 'dashboard' }));
  }

  public unsubscribeFromDashboard(widgets?: string[]): void {
    this.emit('dashboard:unsubscribe', { widgets });
  }

  public joinCollaboration(documentId: string, documentType: string): void {
    this.emit('collaboration:join', { documentId, documentType });
    store.dispatch(joinSession({ type: 'documents', sessionId: documentId }));
    store.dispatch(enableFeature({ feature: 'collaboration' }));
  }

  public leaveCollaboration(documentId: string): void {
    this.emit('collaboration:leave', documentId);
    store.dispatch(leaveSession({ type: 'documents', sessionId: documentId }));
  }

  public updateCursor(documentId: string, position: { x: number; y: number }, selection?: { start: number; end: number }): void {
    this.emit(SocketEventType.COLLABORATION_CURSOR, { documentId, position, selection });
  }

  public sendCollaborativeEdit(documentId: string, changes: any[], version: number): void {
    this.emit(SocketEventType.COLLABORATION_EDIT, { documentId, changes, version });
  }

  public subscribeToActivity(filter?: string, limit?: number): void {
    this.emit('activity:subscribe', { filter, limit });
    store.dispatch(enableFeature({ feature: 'activity' }));
  }

  public unsubscribeFromActivity(): void {
    this.emit('activity:unsubscribe');
    store.dispatch(disableFeature({ feature: 'activity' }));
  }

  public joinRoom(roomType: string, roomId: string, metadata?: any): void {
    this.emit(SocketEventType.ROOM_JOIN, { roomType, roomId, metadata });
    store.dispatch(joinRoom({ room: `${roomType}:${roomId}` }));
  }

  public leaveRoom(roomType: string, roomId: string): void {
    this.emit(SocketEventType.ROOM_LEAVE, { roomType, roomId });
    store.dispatch(leaveRoom({ room: `${roomType}:${roomId}` }));
  }

  public getConnectionState(): boolean {
    return this.socket?.connected || false;
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const enhancedSocketService = EnhancedSocketService.getInstance();