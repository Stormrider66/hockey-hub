/**
 * Tactical Collaboration Service
 * Handles WebSocket communication for real-time tactical collaboration
 */

import { io, Socket } from 'socket.io-client';
import {
  CollaborationSession,
  CollaborationUser,
  TacticalUpdate,
  UserPresence,
  CursorPosition,
  PresentationState,
  CollaborationMessage,
  SessionRecording,
  Conflict,
  ConflictResolution,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  CollaborationError,
  CollaborationEventHandler,
  CollaborationHookOptions
} from '@hockey-hub/shared-types/src/tactical/collaboration.types';

export class CollaborationService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private currentSession: CollaborationSession | null = null;
  private currentUser: CollaborationUser | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventHandlers: Map<string, Set<CollaborationEventHandler>> = new Map();
  private updateQueue: TacticalUpdate[] = [];
  private isOnline = navigator.onLine;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(private options: { apiUrl: string; authToken?: string }) {
    this.setupOnlineHandlers();
  }

  // Connection Management
  async connect(userId: string): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;

    try {
      const socketUrl = this.options.apiUrl.replace(/\/api/, '');
      
      this.socket = io(`${socketUrl}/tactical`, {
        auth: {
          token: this.options.authToken,
          userId
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      await this.setupEventHandlers();
      this.isConnecting = false;
      
      this.emit('connection:established', { userId });
    } catch (error) {
      this.isConnecting = false;
      throw new Error(`Failed to connect to collaboration service: ${error}`);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.currentSession = null;
    this.emit('connection:lost');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Session Management
  async createSession(data: {
    playId: string;
    title: string;
    settings: any;
  }): Promise<CollaborationSession> {
    if (!this.isConnected()) {
      throw new Error('Not connected to collaboration service');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Session creation timeout'));
      }, 10000);

      this.socket?.emit('session:create', data);
      
      const handler = (session: CollaborationSession) => {
        clearTimeout(timeout);
        this.currentSession = session;
        this.emit('session:created', session);
        resolve(session);
      };

      this.socket?.once('session:created', handler);
    });
  }

  async joinSession(sessionId: string): Promise<CollaborationSession> {
    if (!this.isConnected()) {
      throw new Error('Not connected to collaboration service');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Session join timeout'));
      }, 10000);

      this.socket?.emit('session:join', sessionId);
      
      const handler = (session: CollaborationSession) => {
        clearTimeout(timeout);
        this.currentSession = session;
        this.startSyncTimer();
        this.emit('session:joined', session);
        resolve(session);
      };

      this.socket?.once('session:updated', handler);
    });
  }

  leaveSession(): void {
    if (this.currentSession && this.socket) {
      this.socket.emit('session:leave', this.currentSession.id);
      this.currentSession = null;
      
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
        this.syncTimer = null;
      }
      
      this.emit('session:left');
    }
  }

  // Real-time Updates
  sendUpdate(update: Omit<TacticalUpdate, 'id' | 'timestamp'>): void {
    if (!this.isConnected() || !this.currentSession) {
      // Queue update for when connection is restored
      this.queueUpdate({
        ...update,
        id: this.generateId(),
        timestamp: new Date(),
        sessionId: this.currentSession?.id || ''
      });
      return;
    }

    // Add optimistic update
    const optimisticUpdate: TacticalUpdate = {
      ...update,
      id: this.generateId(),
      timestamp: new Date(),
      sessionId: this.currentSession.id,
      optimistic: true
    };

    this.emit('tactical:update', optimisticUpdate);
    this.socket?.emit('tactical:update', update);
  }

  sendBatchUpdates(updates: Omit<TacticalUpdate, 'id' | 'timestamp'>[]): void {
    updates.forEach(update => this.sendUpdate(update));
  }

  requestSync(): void {
    if (this.isConnected() && this.currentSession) {
      this.socket?.emit('tactical:request_sync', this.currentSession.id);
    }
  }

  // Cursor and Presence
  updateCursor(position: CursorPosition): void {
    if (!this.isConnected()) return;

    // Throttle cursor updates
    clearTimeout(this.cursorThrottle);
    this.cursorThrottle = setTimeout(() => {
      this.socket?.emit('cursor:move', position);
    }, 50);
  }

  private cursorThrottle: NodeJS.Timeout | null = null;

  updatePresence(presence: Partial<UserPresence>): void {
    if (this.isConnected()) {
      this.socket?.emit('presence:update', presence);
    }
  }

  // Presentation and Coaching
  startPresentation(): void {
    if (this.isConnected() && this.currentSession) {
      this.socket?.emit('presentation:start', this.currentSession.id);
    }
  }

  updatePresentation(state: Partial<PresentationState>): void {
    if (this.isConnected()) {
      this.socket?.emit('presentation:update', state);
    }
  }

  endPresentation(): void {
    if (this.isConnected() && this.currentSession) {
      this.socket?.emit('presentation:end', this.currentSession.id);
    }
  }

  sendCoachingControl(control: Omit<any, 'timestamp'>): void {
    if (this.isConnected()) {
      this.socket?.emit('coaching:control', control);
    }
  }

  // Communication
  sendMessage(content: string, type: 'text' | 'voice' = 'text'): void {
    if (!this.isConnected() || !this.currentSession || !this.currentUser) return;

    const message: Omit<CollaborationMessage, 'id' | 'timestamp'> = {
      sessionId: this.currentSession.id,
      userId: this.currentUser.id,
      content,
      type
    };

    this.socket?.emit('chat:send', message);
  }

  // Recording
  startRecording(): void {
    if (this.isConnected() && this.currentSession) {
      this.socket?.emit('recording:start', this.currentSession.id);
    }
  }

  stopRecording(): void {
    if (this.isConnected() && this.currentSession) {
      this.socket?.emit('recording:stop', this.currentSession.id);
    }
  }

  // Conflict Resolution
  resolveConflict(conflictId: string, resolution: ConflictResolution): void {
    if (this.isConnected()) {
      this.socket?.emit('tactical:resolve_conflict', conflictId, resolution);
    }
  }

  // Event Handling
  on<T = any>(event: string, handler: CollaborationEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);
  }

  off<T = any>(event: string, handler: CollaborationEventHandler<T>): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    handlers?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in collaboration event handler for ${event}:`, error);
      }
    });
  }

  // Private Methods
  private async setupEventHandlers(): Promise<void> {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.emit('connection:established');
      this.processUpdateQueue();
    });

    this.socket.on('disconnect', (reason) => {
      this.emit('connection:lost', { reason });
      if (reason === 'io server disconnect') {
        // Server disconnected, need to reconnect manually
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.emit('connection:error', { error });
      this.handleReconnection();
    });

    // Session events
    this.socket.on('session:created', (session) => {
      this.currentSession = session;
      this.emit('session:created', session);
    });

    this.socket.on('session:updated', (session) => {
      this.currentSession = session;
      this.emit('session:updated', session);
    });

    this.socket.on('session:ended', (sessionId) => {
      if (this.currentSession?.id === sessionId) {
        this.currentSession = null;
      }
      this.emit('session:ended', sessionId);
    });

    this.socket.on('session:user_joined', (user, sessionId) => {
      this.emit('session:user_joined', { user, sessionId });
    });

    this.socket.on('session:user_left', (userId, sessionId) => {
      this.emit('session:user_left', { userId, sessionId });
    });

    // Tactical updates
    this.socket.on('tactical:update', (update) => {
      this.emit('tactical:update', update);
    });

    this.socket.on('tactical:batch_update', (updates) => {
      this.emit('tactical:batch_update', updates);
    });

    this.socket.on('tactical:conflict', (conflict) => {
      this.emit('tactical:conflict', conflict);
    });

    // Presence events
    this.socket.on('presence:update', (userId, presence) => {
      this.emit('presence:update', { userId, presence });
    });

    this.socket.on('cursor:move', (userId, position) => {
      this.emit('cursor:move', { userId, position });
    });

    // Presentation events
    this.socket.on('presentation:start', (state) => {
      this.emit('presentation:start', state);
    });

    this.socket.on('presentation:update', (state) => {
      this.emit('presentation:update', state);
    });

    this.socket.on('presentation:end', () => {
      this.emit('presentation:end');
    });

    this.socket.on('coaching:control', (control) => {
      this.emit('coaching:control', control);
    });

    // Communication events
    this.socket.on('chat:message', (message) => {
      this.emit('chat:message', message);
    });

    this.socket.on('voice:session_start', (session) => {
      this.emit('voice:session_start', session);
    });

    this.socket.on('voice:session_end', (sessionId) => {
      this.emit('voice:session_end', sessionId);
    });

    // Recording events
    this.socket.on('recording:start', (recordingId) => {
      this.emit('recording:start', recordingId);
    });

    this.socket.on('recording:stop', (recording) => {
      this.emit('recording:stop', recording);
    });

    // Error handling
    this.socket.on('error', (error) => {
      this.emit('error', error);
    });

    this.socket.on('warning', (warning) => {
      this.emit('warning', warning);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('connection:failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (!this.isConnected() && this.currentUser) {
        this.connect(this.currentUser.id).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  private setupOnlineHandlers(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('network:online');
      this.processUpdateQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('network:offline');
    });
  }

  private queueUpdate(update: TacticalUpdate): void {
    this.updateQueue.push(update);
    
    // Limit queue size
    if (this.updateQueue.length > 100) {
      this.updateQueue.shift();
    }
  }

  private processUpdateQueue(): void {
    if (!this.isConnected() || this.updateQueue.length === 0) return;

    const updates = [...this.updateQueue];
    this.updateQueue = [];

    updates.forEach(update => {
      const { id, timestamp, optimistic, ...updateData } = update;
      this.sendUpdate(updateData);
    });
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isConnected()) {
        this.requestSync();
      }
    }, 30000); // Sync every 30 seconds
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  setCurrentUser(user: CollaborationUser): void {
    this.currentUser = user;
  }

  isInSession(): boolean {
    return !!this.currentSession;
  }
}

// Singleton instance
let collaborationServiceInstance: CollaborationService | null = null;

export const getCollaborationService = (options?: { apiUrl: string; authToken?: string }): CollaborationService => {
  if (!collaborationServiceInstance && options) {
    collaborationServiceInstance = new CollaborationService(options);
  }
  
  if (!collaborationServiceInstance) {
    throw new Error('CollaborationService not initialized. Provide options for first call.');
  }
  
  return collaborationServiceInstance;
};

export const destroyCollaborationService = (): void => {
  if (collaborationServiceInstance) {
    collaborationServiceInstance.disconnect();
    collaborationServiceInstance = null;
  }
};