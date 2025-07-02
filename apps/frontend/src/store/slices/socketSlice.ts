import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SocketEventType } from '@hockey-hub/shared-lib';

interface SocketState {
  connected: boolean;
  connecting: boolean;
  connectionError: string | null;
  connectionId: string | null;
  reconnectAttempts: number;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  
  // Room subscriptions
  subscribedRooms: string[];
  
  // Feature states
  features: {
    training: boolean;
    calendar: boolean;
    dashboard: boolean;
    collaboration: boolean;
    activity: boolean;
  };
  
  // Active sessions
  activeSessions: {
    training: string[];
    calendar: string[];
    documents: string[];
  };
  
  // Connection quality
  latency: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  
  // Event queue for offline mode
  offlineEventQueue: Array<{
    event: string;
    data: any;
    timestamp: string;
  }>;
}

const initialState: SocketState = {
  connected: false,
  connecting: false,
  connectionError: null,
  connectionId: null,
  reconnectAttempts: 0,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  subscribedRooms: [],
  features: {
    training: false,
    calendar: false,
    dashboard: false,
    collaboration: false,
    activity: false
  },
  activeSessions: {
    training: [],
    calendar: [],
    documents: []
  },
  latency: 0,
  connectionQuality: 'offline',
  offlineEventQueue: []
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    // Connection events
    startConnecting: (state) => {
      state.connecting = true;
      state.connectionError = null;
    },
    
    connectionSuccess: (state, action: PayloadAction<{ connectionId: string; timestamp: string }>) => {
      state.connected = true;
      state.connecting = false;
      state.connectionError = null;
      state.connectionId = action.payload.connectionId;
      state.lastConnectedAt = action.payload.timestamp;
      state.reconnectAttempts = 0;
      state.connectionQuality = 'good';
      
      // Process offline queue
      state.offlineEventQueue = [];
    },
    
    connectionError: (state, action: PayloadAction<{ error: string; timestamp: string }>) => {
      state.connected = false;
      state.connecting = false;
      state.connectionError = action.payload.error;
      state.connectionQuality = 'offline';
    },
    
    connectionLost: (state, action: PayloadAction<{ reason: string; timestamp: string }>) => {
      state.connected = false;
      state.connectionId = null;
      state.lastDisconnectedAt = action.payload.timestamp;
      state.connectionQuality = 'offline';
    },
    
    reconnectAttempt: (state, action: PayloadAction<{ attempt: number }>) => {
      state.reconnectAttempts = action.payload.attempt;
      state.connecting = true;
    },
    
    // Room management
    joinRoom: (state, action: PayloadAction<{ room: string }>) => {
      if (!state.subscribedRooms.includes(action.payload.room)) {
        state.subscribedRooms.push(action.payload.room);
      }
    },
    
    leaveRoom: (state, action: PayloadAction<{ room: string }>) => {
      state.subscribedRooms = state.subscribedRooms.filter(room => room !== action.payload.room);
    },
    
    // Feature toggles
    enableFeature: (state, action: PayloadAction<{ feature: keyof SocketState['features'] }>) => {
      state.features[action.payload.feature] = true;
    },
    
    disableFeature: (state, action: PayloadAction<{ feature: keyof SocketState['features'] }>) => {
      state.features[action.payload.feature] = false;
    },
    
    // Session management
    joinSession: (state, action: PayloadAction<{ type: keyof SocketState['activeSessions']; sessionId: string }>) => {
      const { type, sessionId } = action.payload;
      if (!state.activeSessions[type].includes(sessionId)) {
        state.activeSessions[type].push(sessionId);
      }
    },
    
    leaveSession: (state, action: PayloadAction<{ type: keyof SocketState['activeSessions']; sessionId: string }>) => {
      const { type, sessionId } = action.payload;
      state.activeSessions[type] = state.activeSessions[type].filter(id => id !== sessionId);
    },
    
    // Connection quality
    updateLatency: (state, action: PayloadAction<{ latency: number }>) => {
      state.latency = action.payload.latency;
      
      // Update connection quality based on latency
      if (!state.connected) {
        state.connectionQuality = 'offline';
      } else if (state.latency < 50) {
        state.connectionQuality = 'excellent';
      } else if (state.latency < 150) {
        state.connectionQuality = 'good';
      } else if (state.latency < 300) {
        state.connectionQuality = 'fair';
      } else {
        state.connectionQuality = 'poor';
      }
    },
    
    // Offline queue management
    queueOfflineEvent: (state, action: PayloadAction<{ event: string; data: any }>) => {
      state.offlineEventQueue.push({
        event: action.payload.event,
        data: action.payload.data,
        timestamp: new Date().toISOString()
      });
      
      // Limit queue size
      if (state.offlineEventQueue.length > 100) {
        state.offlineEventQueue.shift();
      }
    },
    
    clearOfflineQueue: (state) => {
      state.offlineEventQueue = [];
    },
    
    // Reset state
    resetSocketState: () => initialState
  }
});

export const {
  startConnecting,
  connectionSuccess,
  connectionError,
  connectionLost,
  reconnectAttempt,
  joinRoom,
  leaveRoom,
  enableFeature,
  disableFeature,
  joinSession,
  leaveSession,
  updateLatency,
  queueOfflineEvent,
  clearOfflineQueue,
  resetSocketState
} = socketSlice.actions;

export default socketSlice.reducer;

// Selectors
export const selectIsConnected = (state: { socket: SocketState }) => state.socket.connected;
export const selectIsConnecting = (state: { socket: SocketState }) => state.socket.connecting;
export const selectConnectionError = (state: { socket: SocketState }) => state.socket.connectionError;
export const selectConnectionQuality = (state: { socket: SocketState }) => state.socket.connectionQuality;
export const selectSubscribedRooms = (state: { socket: SocketState }) => state.socket.subscribedRooms;
export const selectActiveFeatures = (state: { socket: SocketState }) => state.socket.features;
export const selectActiveSessions = (state: { socket: SocketState }) => state.socket.activeSessions;
export const selectOfflineQueue = (state: { socket: SocketState }) => state.socket.offlineEventQueue;