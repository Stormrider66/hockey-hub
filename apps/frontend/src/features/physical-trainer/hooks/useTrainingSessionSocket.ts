import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  TrainingSessionSocketEvent,
  TrainingSessionState,
  PlayerSessionStatus,
  PlayerMetrics,
  ExerciseProgress,
  IntervalProgress,
  JoinSessionPayload,
  SessionJoinedPayload,
  SessionUpdatePayload,
  PlayerJoinPayload,
  PlayerLeavePayload,
  MetricsUpdatePayload,
  ExerciseProgressPayload,
  IntervalProgressPayload,
  PlayerStatusUpdatePayload,
  TrainingErrorPayload,
} from '@hockey-hub/shared-types';

interface UseTrainingSessionSocketOptions {
  sessionId?: string;
  role?: 'trainer' | 'player' | 'observer';
  playerId?: string;
  autoConnect?: boolean;
}

interface UseTrainingSessionSocketReturn {
  socket: Socket | null;
  connected: boolean;
  session: TrainingSessionState | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => void;
  startSession: () => void;
  endSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  updatePlayerMetrics: (metrics: PlayerMetrics) => void;
  updateExerciseProgress: (progress: ExerciseProgress) => void;
  updateIntervalProgress: (progress: IntervalProgress) => void;
  updatePlayerStatus: (playerId: string, status: PlayerSessionStatus['status'], reason?: string) => void;
  kickPlayer: (playerId: string) => void;
  forceEndSession: () => void;
}

export function useTrainingSessionSocket(
  options: UseTrainingSessionSocketOptions = {}
): UseTrainingSessionSocketReturn {
  const { sessionId: initialSessionId, role = 'observer', playerId, autoConnect = true } = options;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState<TrainingSessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSessionId);
  
  const socketRef = useRef<Socket | null>(null);
  const auth = useSelector((state: RootState) => state.auth);

  // Connect to training namespace
  const connect = useCallback(async () => {
    if (socketRef.current?.connected) return;

    try {
      const newSocket = io(`${process.env.NEXT_PUBLIC_COMMUNICATION_SERVICE_URL || 'http://localhost:3002'}/training`, {
        auth: {
          token: auth.token || '',
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection handlers
      newSocket.on('connect', () => {
        console.log('Connected to training namespace');
        setConnected(true);
        setError(null);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setError('Failed to connect to training service');
        setConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from training namespace:', reason);
        setConnected(false);
      });

      // Error handler
      newSocket.on(TrainingSessionSocketEvent.ERROR, (errorData: TrainingErrorPayload) => {
        console.error('Training session error:', errorData);
        setError(errorData.message);
      });

      // Session update handlers
      newSocket.on(TrainingSessionSocketEvent.SESSION_UPDATE, (data: SessionUpdatePayload) => {
        if (data.sessionId === currentSessionId) {
          setSession(prev => prev ? { ...prev, ...data.updates } : null);
        }
      });

      // Player events
      newSocket.on(TrainingSessionSocketEvent.PLAYER_JOIN, (data: PlayerJoinPayload) => {
        if (data.sessionId === currentSessionId) {
          setSession(prev => {
            if (!prev) return null;
            return {
              ...prev,
              players: [...prev.players, data.player],
              totalPlayers: prev.totalPlayers + 1,
            };
          });
        }
      });

      newSocket.on(TrainingSessionSocketEvent.PLAYER_LEAVE, (data: PlayerLeavePayload) => {
        if (data.sessionId === currentSessionId) {
          setSession(prev => {
            if (!prev) return null;
            const updatedPlayers = prev.players.filter(p => p.playerId !== data.playerId);
            return {
              ...prev,
              players: updatedPlayers,
              totalPlayers: updatedPlayers.length,
            };
          });
        }
      });

      // Metrics and progress handlers
      newSocket.on(TrainingSessionSocketEvent.PLAYER_METRICS_UPDATE, (data: MetricsUpdatePayload) => {
        if (data.sessionId === currentSessionId) {
          setSession(prev => {
            if (!prev) return null;
            const updatedPlayers = prev.players.map(p => 
              p.playerId === data.metrics.playerId 
                ? { ...p, metrics: data.metrics, lastActivity: new Date() }
                : p
            );
            return { ...prev, players: updatedPlayers };
          });
        }
      });

      newSocket.on(TrainingSessionSocketEvent.PLAYER_EXERCISE_PROGRESS, (data: ExerciseProgressPayload) => {
        if (data.sessionId === currentSessionId) {
          setSession(prev => {
            if (!prev) return null;
            const updatedPlayers = prev.players.map(p => 
              p.playerId === data.progress.playerId 
                ? { ...p, currentExercise: data.progress.exerciseName, lastActivity: new Date() }
                : p
            );
            return { ...prev, players: updatedPlayers };
          });
        }
      });

      newSocket.on(TrainingSessionSocketEvent.PLAYER_INTERVAL_PROGRESS, (data: IntervalProgressPayload) => {
        if (data.sessionId === currentSessionId) {
          setSession(prev => {
            if (!prev) return null;
            const updatedPlayers = prev.players.map(p => 
              p.playerId === data.progress.playerId 
                ? { ...p, currentInterval: data.progress.intervalName, lastActivity: new Date() }
                : p
            );
            return { ...prev, players: updatedPlayers };
          });
        }
      });

      newSocket.on(TrainingSessionSocketEvent.PLAYER_STATUS_UPDATE, (data: PlayerStatusUpdatePayload) => {
        if (data.sessionId === currentSessionId) {
          setSession(prev => {
            if (!prev) return null;
            const updatedPlayers = prev.players.map(p => 
              p.playerId === data.playerId 
                ? { ...p, status: data.status, lastActivity: new Date() }
                : p
            );
            const activePlayers = updatedPlayers.filter(p => p.status === 'active').length;
            const completedPlayers = updatedPlayers.filter(p => p.status === 'completed').length;
            return { 
              ...prev, 
              players: updatedPlayers,
              activePlayers,
              completedPlayers,
            };
          });
        }
      });

    } catch (err) {
      console.error('Failed to connect to training namespace:', err);
      setError('Failed to connect to training service');
    }
  }, [auth.token, currentSessionId]);

  // Disconnect from namespace
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setSession(null);
    }
  }, []);

  // Join a training session
  const joinSession = useCallback(async (sessionId: string) => {
    if (!socketRef.current?.connected) {
      throw new Error('Not connected to training service');
    }

    return new Promise<void>((resolve, reject) => {
      const payload: JoinSessionPayload = {
        sessionId,
        role,
        playerId,
      };

      socketRef.current!.emit(TrainingSessionSocketEvent.JOIN_SESSION, payload);

      const handleJoined = (response: SessionJoinedPayload) => {
        setSession(response.session);
        setCurrentSessionId(sessionId);
        socketRef.current!.off(TrainingSessionSocketEvent.SESSION_JOINED, handleJoined);
        socketRef.current!.off(TrainingSessionSocketEvent.ERROR, handleError);
        resolve();
      };

      const handleError = (error: TrainingErrorPayload) => {
        setError(error.message);
        socketRef.current!.off(TrainingSessionSocketEvent.SESSION_JOINED, handleJoined);
        socketRef.current!.off(TrainingSessionSocketEvent.ERROR, handleError);
        reject(new Error(error.message));
      };

      socketRef.current!.once(TrainingSessionSocketEvent.SESSION_JOINED, handleJoined);
      socketRef.current!.once(TrainingSessionSocketEvent.ERROR, handleError);
    });
  }, [role, playerId]);

  // Leave current session
  const leaveSession = useCallback(() => {
    if (!socketRef.current?.connected || !currentSessionId) return;
    
    socketRef.current.emit(TrainingSessionSocketEvent.LEAVE_SESSION, currentSessionId);
    setSession(null);
    setCurrentSessionId(undefined);
  }, [currentSessionId]);

  // Session control methods (trainer only)
  const startSession = useCallback(() => {
    if (!socketRef.current?.connected || !currentSessionId || role !== 'trainer') return;
    socketRef.current.emit(TrainingSessionSocketEvent.SESSION_START, currentSessionId);
  }, [currentSessionId, role]);

  const endSession = useCallback(() => {
    if (!socketRef.current?.connected || !currentSessionId || role !== 'trainer') return;
    socketRef.current.emit(TrainingSessionSocketEvent.SESSION_END, currentSessionId);
  }, [currentSessionId, role]);

  const pauseSession = useCallback(() => {
    if (!socketRef.current?.connected || !currentSessionId || role !== 'trainer') return;
    socketRef.current.emit(TrainingSessionSocketEvent.SESSION_PAUSE, currentSessionId);
  }, [currentSessionId, role]);

  const resumeSession = useCallback(() => {
    if (!socketRef.current?.connected || !currentSessionId || role !== 'trainer') return;
    socketRef.current.emit(TrainingSessionSocketEvent.SESSION_RESUME, currentSessionId);
  }, [currentSessionId, role]);

  // Player update methods
  const updatePlayerMetrics = useCallback((metrics: PlayerMetrics) => {
    if (!socketRef.current?.connected || !currentSessionId) return;
    
    const payload: MetricsUpdatePayload = {
      sessionId: currentSessionId,
      metrics: {
        ...metrics,
        sessionId: currentSessionId,
        timestamp: new Date(),
      },
    };
    
    socketRef.current.emit(TrainingSessionSocketEvent.PLAYER_METRICS_UPDATE, payload);
  }, [currentSessionId]);

  const updateExerciseProgress = useCallback((progress: ExerciseProgress) => {
    if (!socketRef.current?.connected || !currentSessionId) return;
    
    const payload: ExerciseProgressPayload = {
      sessionId: currentSessionId,
      progress: {
        ...progress,
        sessionId: currentSessionId,
        timestamp: new Date(),
      },
    };
    
    socketRef.current.emit(TrainingSessionSocketEvent.PLAYER_EXERCISE_PROGRESS, payload);
  }, [currentSessionId]);

  const updateIntervalProgress = useCallback((progress: IntervalProgress) => {
    if (!socketRef.current?.connected || !currentSessionId) return;
    
    const payload: IntervalProgressPayload = {
      sessionId: currentSessionId,
      progress: {
        ...progress,
        sessionId: currentSessionId,
        timestamp: new Date(),
      },
    };
    
    socketRef.current.emit(TrainingSessionSocketEvent.PLAYER_INTERVAL_PROGRESS, payload);
  }, [currentSessionId]);

  const updatePlayerStatus = useCallback(
    (playerId: string, status: PlayerSessionStatus['status'], reason?: string) => {
      if (!socketRef.current?.connected || !currentSessionId) return;
      
      const payload: PlayerStatusUpdatePayload = {
        sessionId: currentSessionId,
        playerId,
        status,
        reason,
      };
      
      socketRef.current.emit(TrainingSessionSocketEvent.PLAYER_STATUS_UPDATE, payload);
    },
    [currentSessionId]
  );

  // Admin methods (trainer only)
  const kickPlayer = useCallback((playerId: string) => {
    if (!socketRef.current?.connected || !currentSessionId || role !== 'trainer') return;
    socketRef.current.emit(TrainingSessionSocketEvent.KICK_PLAYER, { sessionId: currentSessionId, playerId });
  }, [currentSessionId, role]);

  const forceEndSession = useCallback(() => {
    if (!socketRef.current?.connected || !currentSessionId || role !== 'trainer') return;
    socketRef.current.emit(TrainingSessionSocketEvent.FORCE_END_SESSION, currentSessionId);
  }, [currentSessionId, role]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (currentSessionId) {
        leaveSession();
      }
      disconnect();
    };
  }, []);

  // Auto-join session if provided
  useEffect(() => {
    if (connected && initialSessionId && !currentSessionId) {
      joinSession(initialSessionId).catch(err => {
        console.error('Failed to join session:', err);
      });
    }
  }, [connected, initialSessionId, currentSessionId, joinSession]);

  return {
    socket,
    connected,
    session,
    error,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    updatePlayerMetrics,
    updateExerciseProgress,
    updateIntervalProgress,
    updatePlayerStatus,
    kickPlayer,
    forceEndSession,
  };
}