import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

export interface SocketEventHandlers {
  onNotification?: (data: any) => void;
  onNotificationRead?: (data: any) => void;
  onUserOnline?: (data: any) => void;
  onUserOffline?: (data: any) => void;
  onUserPresence?: (data: any) => void;
  onUserTyping?: (data: any) => void;
  onUserTypingStop?: (data: any) => void;
  onMessage?: (data: any) => void;
  onMessageUpdate?: (data: any) => void;
  onConversationUpdate?: (data: any) => void;
}

export interface SocketConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
}

export class SocketService {
  private socket: Socket | null = null;
  private connectionState: SocketConnectionState = {
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0
  };
  private eventHandlers: SocketEventHandlers = {};
  private stateSubscribers: ((state: SocketConnectionState) => void)[] = [];
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private presenceUpdateTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
  }

  /**
   * Initialize Socket.io connection
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.updateState({ connecting: true, error: null });

    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
    
    this.socket = io(apiGatewayUrl, {
      auth: {
        token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
    this.setupBrowserEventListeners();
  }

  /**
   * Disconnect from Socket.io
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.clearTimeouts();
    this.removeBrowserEventListeners();
    this.updateState({ 
      connected: false, 
      connecting: false, 
      error: null,
      reconnectAttempts: 0
    });
  }

  /**
   * Set up Socket.io event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.updateState({ 
        connected: true, 
        connecting: false, 
        error: null,
        lastConnected: new Date(),
        reconnectAttempts: 0
      });
      
      toast.success('Connected to real-time services');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.updateState({ 
        connected: false, 
        connecting: false, 
        error: `Disconnected: ${reason}`
      });
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            this.socket.connect();
          }
        }, 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
      this.updateState({ 
        connected: false, 
        connecting: false, 
        error: error.message,
        reconnectAttempts: this.connectionState.reconnectAttempts + 1
      });
      
      if (this.connectionState.reconnectAttempts === 1) {
        toast.error('Connection failed. Retrying...');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.updateState({ 
        connected: true, 
        connecting: false, 
        error: null,
        lastConnected: new Date(),
        reconnectAttempts: 0
      });
      
      toast.success('Reconnected to real-time services');
    });

    this.socket.on('reconnecting', (attemptNumber) => {
      console.log('🔄 Socket reconnecting... attempt', attemptNumber);
      this.updateState({ 
        connected: false, 
        connecting: true, 
        error: null,
        reconnectAttempts: attemptNumber
      });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('💀 Socket reconnection failed');
      this.updateState({ 
        connected: false, 
        connecting: false, 
        error: 'Reconnection failed'
      });
      
      toast.error('Unable to connect to real-time services');
    });

    // Application events
    this.socket.on('notification:new', (data) => {
      console.log('🔔 New notification:', data);
      this.eventHandlers.onNotification?.(data);
      
      // Show toast notification
      toast.info(data.title, {
        description: data.message,
        action: data.actionUrl ? {
          label: 'View',
          onClick: () => window.location.href = data.actionUrl
        } : undefined
      });
    });

    this.socket.on('notification:read', (data) => {
      console.log('👁️ Notification read:', data);
      this.eventHandlers.onNotificationRead?.(data);
    });

    this.socket.on('user:online', (data) => {
      console.log('🟢 User online:', data);
      this.eventHandlers.onUserOnline?.(data);
    });

    this.socket.on('user:offline', (data) => {
      console.log('🔴 User offline:', data);
      this.eventHandlers.onUserOffline?.(data);
    });

    this.socket.on('user:presence', (data) => {
      console.log('👁️ User presence update:', data);
      this.eventHandlers.onUserPresence?.(data);
    });

    this.socket.on('user:typing', (data) => {
      console.log('✍️ User typing:', data);
      this.eventHandlers.onUserTyping?.(data);
      
      // Auto-clear typing indicator after 3 seconds
      const key = `${data.conversationId}-${data.userId}`;
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key)!);
      }
      
      const timeout = setTimeout(() => {
        this.eventHandlers.onUserTypingStop?.(data);
        this.typingTimeouts.delete(key);
      }, 3000);
      
      this.typingTimeouts.set(key, timeout);
    });

    this.socket.on('user:typing:stop', (data) => {
      console.log('✋ User stopped typing:', data);
      this.eventHandlers.onUserTypingStop?.(data);
      
      const key = `${data.conversationId}-${data.userId}`;
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key)!);
        this.typingTimeouts.delete(key);
      }
    });

    this.socket.on('message:new', (data) => {
      console.log('💬 New message:', data);
      this.eventHandlers.onMessage?.(data);
    });

    this.socket.on('message:update', (data) => {
      console.log('📝 Message updated:', data);
      this.eventHandlers.onMessageUpdate?.(data);
    });

    this.socket.on('conversation:update', (data) => {
      console.log('💬 Conversation updated:', data);
      this.eventHandlers.onConversationUpdate?.(data);
    });
  }

  /**
   * Set up browser event listeners for connection management
   */
  private setupBrowserEventListeners(): void {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Remove browser event listeners
   */
  private removeBrowserEventListeners(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  /**
   * Handle browser visibility change
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible' && this.socket && !this.socket.connected) {
      console.log('🔄 Page became visible, reconnecting socket...');
      this.socket.connect();
    }
  }

  /**
   * Handle browser coming online
   */
  private handleOnline(): void {
    console.log('🌐 Browser is online');
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  /**
   * Handle browser going offline
   */
  private handleOffline(): void {
    console.log('📴 Browser is offline');
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  /**
   * Update connection state and notify subscribers
   */
  private updateState(updates: Partial<SocketConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    this.stateSubscribers.forEach(callback => callback(this.connectionState));
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    
    if (this.presenceUpdateTimeout) {
      clearTimeout(this.presenceUpdateTimeout);
      this.presenceUpdateTimeout = null;
    }
  }

  /**
   * Subscribe to connection state changes
   */
  subscribeToState(callback: (state: SocketConnectionState) => void): () => void {
    this.stateSubscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.stateSubscribers.indexOf(callback);
      if (index > -1) {
        this.stateSubscribers.splice(index, 1);
      }
    };
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: SocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): SocketConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Attempted to emit event while socket disconnected:', event);
    }
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): void {
    this.emit('conversation:join', conversationId);
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string): void {
    this.emit('conversation:leave', conversationId);
  }

  /**
   * Send typing indicator
   */
  startTyping(conversationId: string): void {
    this.emit('typing:start', { conversationId });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string): void {
    this.emit('typing:stop', { conversationId });
  }

  /**
   * Update user presence
   */
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    // Debounce presence updates
    if (this.presenceUpdateTimeout) {
      clearTimeout(this.presenceUpdateTimeout);
    }
    
    this.presenceUpdateTimeout = setTimeout(() => {
      this.emit('presence:update', status);
    }, 1000);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    this.emit('notification:read', notificationId);
  }
}

// Export singleton instance
export const socketService = new SocketService();