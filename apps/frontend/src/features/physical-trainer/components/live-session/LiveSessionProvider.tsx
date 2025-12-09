'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  LiveSession, 
  LiveSessionContextType, 
  LiveSessionEvent, 
  LiveSessionFilters,
  LiveParticipant,
  LiveMetrics
} from './types';

const LiveSessionContext = createContext<LiveSessionContextType>({
  sessions: [],
  selectedSession: null,
  connected: false,
  error: null,
  selectSession: () => {},
  clearSelection: () => {},
  filters: {},
  setFilters: () => {},
});

export const useLiveSession = () => useContext(LiveSessionContext);

interface LiveSessionProviderProps {
  children: React.ReactNode;
}

export const LiveSessionProvider: React.FC<LiveSessionProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LiveSessionFilters>({});
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const TRAINING_SERVICE_URL = process.env.NEXT_PUBLIC_TRAINING_SERVICE_URL || 'http://localhost:3004';

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(TRAINING_SERVICE_URL + '/live', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('Connected to live session service');
      setConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      
      // Request current active sessions
      newSocket.emit('live:get_sessions');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from live session service');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError('Unable to connect to live session service. Please check your connection.');
      }
    });

    // Live session event handlers
    newSocket.on('live:sessions', (data: LiveSession[]) => {
      setSessions(data);
    });

    newSocket.on('live:session_started', (session: LiveSession) => {
      setSessions(prev => [...prev, session]);
    });

    newSocket.on('live:session_ended', (sessionId: string) => {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    });

    newSocket.on('live:participant_joined', (data: { sessionId: string; participant: LiveParticipant }) => {
      updateSession(data.sessionId, session => ({
        ...session,
        participants: [...session.participants, data.participant]
      }));
    });

    newSocket.on('live:participant_left', (data: { sessionId: string; participantId: string }) => {
      updateSession(data.sessionId, session => ({
        ...session,
        participants: session.participants.filter(p => p.id !== data.participantId)
      }));
    });

    newSocket.on('live:metrics_updated', (data: { 
      sessionId: string; 
      participantId: string; 
      metrics: LiveMetrics 
    }) => {
      updateSession(data.sessionId, session => ({
        ...session,
        participants: session.participants.map(p => 
          p.id === data.participantId 
            ? { ...p, metrics: data.metrics, lastUpdate: new Date() }
            : p
        )
      }));
    });

    newSocket.on('live:progress_updated', (data: { 
      sessionId: string; 
      participantId: string; 
      progress: number;
      currentExercise?: string;
      currentSet?: number;
      totalSets?: number;
    }) => {
      updateSession(data.sessionId, session => ({
        ...session,
        participants: session.participants.map(p => 
          p.id === data.participantId 
            ? { 
                ...p, 
                progress: data.progress,
                currentExercise: data.currentExercise,
                currentSet: data.currentSet,
                totalSets: data.totalSets,
                lastUpdate: new Date() 
              }
            : p
        )
      }));
    });

    newSocket.on('live:phase_changed', (data: { sessionId: string; phase: string }) => {
      updateSession(data.sessionId, session => ({
        ...session,
        currentPhase: data.phase
      }));
    });

    newSocket.on('live:session_status_changed', (data: { sessionId: string; status: LiveSession['status'] }) => {
      updateSession(data.sessionId, session => ({
        ...session,
        status: data.status
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [TRAINING_SERVICE_URL]);

  const updateSession = useCallback((sessionId: string, updater: (session: LiveSession) => LiveSession) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId ? updater(session) : session
    ));
    
    if (selectedSession?.id === sessionId) {
      setSelectedSession(prev => prev ? updater(prev) : null);
    }
  }, [selectedSession]);

  const selectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      
      // Join the session room for detailed updates
      if (socket) {
        socket.emit('live:join_session', sessionId);
      }
    }
  }, [sessions, socket]);

  const clearSelection = useCallback(() => {
    if (selectedSession && socket) {
      socket.emit('live:leave_session', selectedSession.id);
    }
    setSelectedSession(null);
  }, [selectedSession, socket]);

  // Apply filters to sessions
  const filteredSessions = sessions.filter(session => {
    if (filters.workoutType?.length && !filters.workoutType.includes(session.workoutType)) {
      return false;
    }
    if (filters.trainerIds?.length && !filters.trainerIds.includes(session.trainerId)) {
      return false;
    }
    if (filters.teamIds?.length) {
      const sessionTeamIds = session.participants.map(p => p.teamId);
      if (!filters.teamIds.some(id => sessionTeamIds.includes(id))) {
        return false;
      }
    }
    if (filters.status?.length && !filters.status.includes(session.status)) {
      return false;
    }
    return true;
  });

  const value: LiveSessionContextType = {
    sessions: filteredSessions,
    selectedSession,
    connected,
    error,
    selectSession,
    clearSelection,
    filters,
    setFilters,
  };

  return (
    <LiveSessionContext.Provider value={value}>
      {children}
    </LiveSessionContext.Provider>
  );
};