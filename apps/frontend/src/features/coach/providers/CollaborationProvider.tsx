/**
 * Collaboration Provider
 * React context provider for tactical collaboration state management
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@hockey-hub/translations';
import {
  CollaborationSession,
  CollaborationUser,
  TacticalUpdate,
  UserPresence,
  CursorPosition,
  PresentationState,
  CollaborationMessage,
  Conflict,
  ConflictResolution,
  CollaborationError
} from '@hockey-hub/shared-types/src/tactical/collaboration.types';
import { getCollaborationService } from '../services/collaborationService';

// State interface
interface CollaborationState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Session state
  currentSession: CollaborationSession | null;
  participants: CollaborationUser[];
  userPresences: Record<string, UserPresence>;
  
  // Current user
  currentUser: CollaborationUser | null;
  
  // Real-time collaboration
  pendingUpdates: TacticalUpdate[];
  conflicts: Conflict[];
  optimisticUpdates: Map<string, TacticalUpdate>;
  
  // Presentation state
  presentationState: PresentationState | null;
  isPresenting: boolean;
  
  // UI state
  cursors: Record<string, CursorPosition>;
  messages: CollaborationMessage[];
  unreadCount: number;
  
  // Settings
  settings: {
    showCursors: boolean;
    enableNotifications: boolean;
    audioEnabled: boolean;
    autoSync: boolean;
  };
  
  // Recording
  isRecording: boolean;
  recordingId: string | null;
}

// Actions
type CollaborationAction =
  | { type: 'SET_CONNECTION_STATE'; payload: { isConnected: boolean; isConnecting: boolean; error?: string } }
  | { type: 'SET_CURRENT_USER'; payload: CollaborationUser }
  | { type: 'SET_SESSION'; payload: CollaborationSession | null }
  | { type: 'UPDATE_PARTICIPANTS'; payload: CollaborationUser[] }
  | { type: 'ADD_PARTICIPANT'; payload: CollaborationUser }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'UPDATE_PRESENCE'; payload: { userId: string; presence: UserPresence } }
  | { type: 'UPDATE_CURSOR'; payload: { userId: string; position: CursorPosition } }
  | { type: 'ADD_TACTICAL_UPDATE'; payload: TacticalUpdate }
  | { type: 'BATCH_TACTICAL_UPDATES'; payload: TacticalUpdate[] }
  | { type: 'ADD_OPTIMISTIC_UPDATE'; payload: TacticalUpdate }
  | { type: 'REMOVE_OPTIMISTIC_UPDATE'; payload: string }
  | { type: 'ADD_CONFLICT'; payload: Conflict }
  | { type: 'RESOLVE_CONFLICT'; payload: string }
  | { type: 'SET_PRESENTATION_STATE'; payload: PresentationState | null }
  | { type: 'ADD_MESSAGE'; payload: CollaborationMessage }
  | { type: 'MARK_MESSAGES_READ' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<CollaborationState['settings']> }
  | { type: 'SET_RECORDING_STATE'; payload: { isRecording: boolean; recordingId?: string } }
  | { type: 'CLEAR_SESSION' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: CollaborationState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  
  currentSession: null,
  participants: [],
  userPresences: {},
  
  currentUser: null,
  
  pendingUpdates: [],
  conflicts: [],
  optimisticUpdates: new Map(),
  
  presentationState: null,
  isPresenting: false,
  
  cursors: {},
  messages: [],
  unreadCount: 0,
  
  settings: {
    showCursors: true,
    enableNotifications: true,
    audioEnabled: true,
    autoSync: true
  },
  
  isRecording: false,
  recordingId: null
};

// Reducer
function collaborationReducer(state: CollaborationState, action: CollaborationAction): CollaborationState {
  switch (action.type) {
    case 'SET_CONNECTION_STATE':
      return {
        ...state,
        isConnected: action.payload.isConnected,
        isConnecting: action.payload.isConnecting,
        connectionError: action.payload.error || null
      };
      
    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUser: action.payload
      };
      
    case 'SET_SESSION':
      return {
        ...state,
        currentSession: action.payload,
        participants: action.payload?.participants || [],
        messages: action.payload ? state.messages : [],
        unreadCount: action.payload ? state.unreadCount : 0
      };
      
    case 'UPDATE_PARTICIPANTS':
      return {
        ...state,
        participants: action.payload
      };
      
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        participants: [...state.participants.filter(p => p.id !== action.payload.id), action.payload]
      };
      
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter(p => p.id !== action.payload),
        userPresences: Object.fromEntries(
          Object.entries(state.userPresences).filter(([userId]) => userId !== action.payload)
        ),
        cursors: Object.fromEntries(
          Object.entries(state.cursors).filter(([userId]) => userId !== action.payload)
        )
      };
      
    case 'UPDATE_PRESENCE':
      return {
        ...state,
        userPresences: {
          ...state.userPresences,
          [action.payload.userId]: action.payload.presence
        }
      };
      
    case 'UPDATE_CURSOR':
      return {
        ...state,
        cursors: {
          ...state.cursors,
          [action.payload.userId]: action.payload.position
        }
      };
      
    case 'ADD_TACTICAL_UPDATE':
      // Remove corresponding optimistic update if exists
      const newOptimisticUpdates = new Map(state.optimisticUpdates);
      newOptimisticUpdates.delete(action.payload.id);
      
      return {
        ...state,
        pendingUpdates: [...state.pendingUpdates, action.payload],
        optimisticUpdates: newOptimisticUpdates
      };
      
    case 'BATCH_TACTICAL_UPDATES':
      return {
        ...state,
        pendingUpdates: [...state.pendingUpdates, ...action.payload]
      };
      
    case 'ADD_OPTIMISTIC_UPDATE':
      const updatedOptimistic = new Map(state.optimisticUpdates);
      updatedOptimistic.set(action.payload.id, action.payload);
      
      return {
        ...state,
        optimisticUpdates: updatedOptimistic
      };
      
    case 'REMOVE_OPTIMISTIC_UPDATE':
      const filteredOptimistic = new Map(state.optimisticUpdates);
      filteredOptimistic.delete(action.payload);
      
      return {
        ...state,
        optimisticUpdates: filteredOptimistic
      };
      
    case 'ADD_CONFLICT':
      return {
        ...state,
        conflicts: [...state.conflicts, action.payload]
      };
      
    case 'RESOLVE_CONFLICT':
      return {
        ...state,
        conflicts: state.conflicts.filter(c => c.id !== action.payload)
      };
      
    case 'SET_PRESENTATION_STATE':
      return {
        ...state,
        presentationState: action.payload,
        isPresenting: !!action.payload && action.payload.presenterId === state.currentUser?.id
      };
      
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        unreadCount: action.payload.userId !== state.currentUser?.id ? state.unreadCount + 1 : state.unreadCount
      };
      
    case 'MARK_MESSAGES_READ':
      return {
        ...state,
        unreadCount: 0
      };
      
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
      
    case 'SET_RECORDING_STATE':
      return {
        ...state,
        isRecording: action.payload.isRecording,
        recordingId: action.payload.recordingId || null
      };
      
    case 'CLEAR_SESSION':
      return {
        ...state,
        currentSession: null,
        participants: [],
        userPresences: {},
        pendingUpdates: [],
        conflicts: [],
        optimisticUpdates: new Map(),
        presentationState: null,
        isPresenting: false,
        cursors: {},
        messages: [],
        unreadCount: 0,
        isRecording: false,
        recordingId: null
      };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
}

// Context
interface CollaborationContextType {
  // State
  state: CollaborationState;
  
  // Connection methods
  connect: (userId: string) => Promise<void>;
  disconnect: () => void;
  
  // Session methods
  createSession: (data: { playId: string; title: string; settings: any }) => Promise<CollaborationSession>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => void;
  
  // Real-time updates
  sendUpdate: (update: Omit<TacticalUpdate, 'id' | 'timestamp' | 'sessionId' | 'userId'>) => void;
  sendBatchUpdates: (updates: Omit<TacticalUpdate, 'id' | 'timestamp' | 'sessionId' | 'userId'>[]) => void;
  
  // Cursor and presence
  updateCursor: (position: CursorPosition) => void;
  updatePresence: (presence: Partial<UserPresence>) => void;
  
  // Presentation
  startPresentation: () => void;
  updatePresentation: (state: Partial<PresentationState>) => void;
  endPresentation: () => void;
  
  // Communication
  sendMessage: (content: string) => void;
  markMessagesRead: () => void;
  
  // Conflict resolution
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => void;
  
  // Recording
  startRecording: () => void;
  stopRecording: () => void;
  
  // Settings
  updateSettings: (settings: Partial<CollaborationState['settings']>) => void;
  
  // User management
  setCurrentUser: (user: CollaborationUser) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

// Provider component
interface CollaborationProviderProps {
  children: React.ReactNode;
  apiUrl: string;
  authToken?: string;
  currentUser: CollaborationUser;
}

export function CollaborationProvider({ 
  children, 
  apiUrl, 
  authToken,
  currentUser 
}: CollaborationProviderProps) {
  const [state, dispatch] = useReducer(collaborationReducer, initialState);
  const { t } = useTranslation('coach');
  const collaborationService = useRef(getCollaborationService({ apiUrl, authToken }));
  const isInitialized = useRef(false);

  // Initialize service and event handlers
  useEffect(() => {
    if (isInitialized.current) return;
    
    const service = collaborationService.current;
    service.setCurrentUser(currentUser);
    dispatch({ type: 'SET_CURRENT_USER', payload: currentUser });

    // Connection events
    service.on('connection:established', () => {
      dispatch({ type: 'SET_CONNECTION_STATE', payload: { isConnected: true, isConnecting: false } });
      toast.success(t('collaboration.connected'));
    });

    service.on('connection:lost', () => {
      dispatch({ type: 'SET_CONNECTION_STATE', payload: { isConnected: false, isConnecting: false } });
      toast.warning(t('collaboration.disconnected'));
    });

    service.on('connection:error', ({ error }) => {
      dispatch({ 
        type: 'SET_CONNECTION_STATE', 
        payload: { isConnected: false, isConnecting: false, error: error.message } 
      });
      toast.error(t('collaboration.connectionError'));
    });

    // Session events
    service.on('session:created', (session: CollaborationSession) => {
      dispatch({ type: 'SET_SESSION', payload: session });
    });

    service.on('session:updated', (session: CollaborationSession) => {
      dispatch({ type: 'SET_SESSION', payload: session });
    });

    service.on('session:ended', () => {
      dispatch({ type: 'CLEAR_SESSION' });
      toast.info(t('collaboration.sessionEnded'));
    });

    service.on('session:user_joined', ({ user }: { user: CollaborationUser }) => {
      dispatch({ type: 'ADD_PARTICIPANT', payload: user });
      toast.info(t('collaboration.userJoined', { name: user.name }));
    });

    service.on('session:user_left', ({ userId }: { userId: string }) => {
      const participant = state.participants.find(p => p.id === userId);
      dispatch({ type: 'REMOVE_PARTICIPANT', payload: userId });
      if (participant) {
        toast.info(t('collaboration.userLeft', { name: participant.name }));
      }
    });

    // Tactical updates
    service.on('tactical:update', (update: TacticalUpdate) => {
      dispatch({ type: 'ADD_TACTICAL_UPDATE', payload: update });
    });

    service.on('tactical:batch_update', (updates: TacticalUpdate[]) => {
      dispatch({ type: 'BATCH_TACTICAL_UPDATES', payload: updates });
    });

    service.on('tactical:conflict', (conflict: Conflict) => {
      dispatch({ type: 'ADD_CONFLICT', payload: conflict });
      toast.warning(t('collaboration.conflictDetected'));
    });

    // Presence events
    service.on('presence:update', ({ userId, presence }: { userId: string; presence: UserPresence }) => {
      dispatch({ type: 'UPDATE_PRESENCE', payload: { userId, presence } });
    });

    service.on('cursor:move', ({ userId, position }: { userId: string; position: CursorPosition }) => {
      if (state.settings.showCursors) {
        dispatch({ type: 'UPDATE_CURSOR', payload: { userId, position } });
      }
    });

    // Presentation events
    service.on('presentation:start', (presentationState: PresentationState) => {
      dispatch({ type: 'SET_PRESENTATION_STATE', payload: presentationState });
      toast.info(t('collaboration.presentationStarted'));
    });

    service.on('presentation:update', (presentationState: PresentationState) => {
      dispatch({ type: 'SET_PRESENTATION_STATE', payload: presentationState });
    });

    service.on('presentation:end', () => {
      dispatch({ type: 'SET_PRESENTATION_STATE', payload: null });
      toast.info(t('collaboration.presentationEnded'));
    });

    // Communication events
    service.on('chat:message', (message: CollaborationMessage) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
      
      if (message.userId !== currentUser.id && state.settings.enableNotifications) {
        const participant = state.participants.find(p => p.id === message.userId);
        toast.info(t('collaboration.newMessage', { name: participant?.name || 'Unknown' }));
      }
    });

    // Recording events
    service.on('recording:start', (recordingId: string) => {
      dispatch({ type: 'SET_RECORDING_STATE', payload: { isRecording: true, recordingId } });
      toast.success(t('collaboration.recordingStarted'));
    });

    service.on('recording:stop', () => {
      dispatch({ type: 'SET_RECORDING_STATE', payload: { isRecording: false } });
      toast.success(t('collaboration.recordingStopped'));
    });

    // Error handling
    service.on('error', (error: CollaborationError) => {
      toast.error(t(`collaboration.errors.${error.code}`, { fallback: error.message }));
    });

    isInitialized.current = true;

    return () => {
      service.disconnect();
    };
  }, [currentUser, apiUrl, authToken, t, state.participants, state.settings]);

  // Context methods
  const connect = useCallback(async (userId: string) => {
    dispatch({ type: 'SET_CONNECTION_STATE', payload: { isConnected: false, isConnecting: true } });
    try {
      await collaborationService.current.connect(userId);
    } catch (error) {
      dispatch({ 
        type: 'SET_CONNECTION_STATE', 
        payload: { isConnected: false, isConnecting: false, error: (error as Error).message } 
      });
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    collaborationService.current.disconnect();
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const createSession = useCallback(async (data: { playId: string; title: string; settings: any }) => {
    return await collaborationService.current.createSession(data);
  }, []);

  const joinSession = useCallback(async (sessionId: string) => {
    await collaborationService.current.joinSession(sessionId);
  }, []);

  const leaveSession = useCallback(() => {
    collaborationService.current.leaveSession();
    dispatch({ type: 'CLEAR_SESSION' });
  }, []);

  const sendUpdate = useCallback((update: Omit<TacticalUpdate, 'id' | 'timestamp' | 'sessionId' | 'userId'>) => {
    if (!state.currentSession || !state.currentUser) return;

    const fullUpdate = {
      ...update,
      sessionId: state.currentSession.id,
      userId: state.currentUser.id
    };

    // Add optimistic update
    const optimisticUpdate: TacticalUpdate = {
      ...fullUpdate,
      id: `optimistic-${Date.now()}`,
      timestamp: new Date(),
      optimistic: true
    };

    dispatch({ type: 'ADD_OPTIMISTIC_UPDATE', payload: optimisticUpdate });
    collaborationService.current.sendUpdate(fullUpdate);
  }, [state.currentSession, state.currentUser]);

  const sendBatchUpdates = useCallback((updates: Omit<TacticalUpdate, 'id' | 'timestamp' | 'sessionId' | 'userId'>[]) => {
    updates.forEach(sendUpdate);
  }, [sendUpdate]);

  const updateCursor = useCallback((position: CursorPosition) => {
    collaborationService.current.updateCursor(position);
  }, []);

  const updatePresence = useCallback((presence: Partial<UserPresence>) => {
    collaborationService.current.updatePresence(presence);
  }, []);

  const startPresentation = useCallback(() => {
    collaborationService.current.startPresentation();
  }, []);

  const updatePresentation = useCallback((presentationState: Partial<PresentationState>) => {
    collaborationService.current.updatePresentation(presentationState);
  }, []);

  const endPresentation = useCallback(() => {
    collaborationService.current.endPresentation();
  }, []);

  const sendMessage = useCallback((content: string) => {
    collaborationService.current.sendMessage(content);
  }, []);

  const markMessagesRead = useCallback(() => {
    dispatch({ type: 'MARK_MESSAGES_READ' });
  }, []);

  const resolveConflict = useCallback((conflictId: string, resolution: ConflictResolution) => {
    collaborationService.current.resolveConflict(conflictId, resolution);
    dispatch({ type: 'RESOLVE_CONFLICT', payload: conflictId });
  }, []);

  const startRecording = useCallback(() => {
    collaborationService.current.startRecording();
  }, []);

  const stopRecording = useCallback(() => {
    collaborationService.current.stopRecording();
  }, []);

  const updateSettings = useCallback((settings: Partial<CollaborationState['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const setCurrentUser = useCallback((user: CollaborationUser) => {
    collaborationService.current.setCurrentUser(user);
    dispatch({ type: 'SET_CURRENT_USER', payload: user });
  }, []);

  const contextValue: CollaborationContextType = {
    state,
    connect,
    disconnect,
    createSession,
    joinSession,
    leaveSession,
    sendUpdate,
    sendBatchUpdates,
    updateCursor,
    updatePresence,
    startPresentation,
    updatePresentation,
    endPresentation,
    sendMessage,
    markMessagesRead,
    resolveConflict,
    startRecording,
    stopRecording,
    updateSettings,
    setCurrentUser
  };

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
}

// Hook to use collaboration context
export function useCollaboration(): CollaborationContextType {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}

// Convenience hooks for specific functionality
export function useCollaborationSession() {
  const { state, createSession, joinSession, leaveSession } = useCollaboration();
  return {
    currentSession: state.currentSession,
    participants: state.participants,
    createSession,
    joinSession,
    leaveSession
  };
}

export function useCollaborationUpdates() {
  const { state, sendUpdate, sendBatchUpdates } = useCollaboration();
  return {
    pendingUpdates: state.pendingUpdates,
    optimisticUpdates: Array.from(state.optimisticUpdates.values()),
    conflicts: state.conflicts,
    sendUpdate,
    sendBatchUpdates
  };
}

export function useCollaborationPresence() {
  const { state, updateCursor, updatePresence } = useCollaboration();
  return {
    userPresences: state.userPresences,
    cursors: state.cursors,
    updateCursor,
    updatePresence
  };
}

export function useCollaborationPresentation() {
  const { 
    state, 
    startPresentation, 
    updatePresentation, 
    endPresentation 
  } = useCollaboration();
  
  return {
    presentationState: state.presentationState,
    isPresenting: state.isPresenting,
    startPresentation,
    updatePresentation,
    endPresentation
  };
}

export function useCollaborationChat() {
  const { state, sendMessage, markMessagesRead } = useCollaboration();
  return {
    messages: state.messages,
    unreadCount: state.unreadCount,
    sendMessage,
    markMessagesRead
  };
}