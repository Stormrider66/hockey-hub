import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  TrainingSessionSocketEvent,
  MedicalStatusChangedPayload,
  SessionProgressPayload,
  CalendarEventChangedPayload,
  PlayerAvailabilityChangedPayload,
  WorkoutTemplateUpdatedPayload,
  TeamAssignmentChangedPayload,
} from '@hockey-hub/shared-types';

interface UseTrainingSocketOptions {
  autoConnect?: boolean;
  onMedicalStatusChange?: (payload: MedicalStatusChangedPayload) => void;
  onSessionProgress?: (payload: SessionProgressPayload) => void;
  onCalendarEventChange?: (payload: CalendarEventChangedPayload) => void;
  onPlayerAvailabilityChange?: (payload: PlayerAvailabilityChangedPayload) => void;
  onWorkoutTemplateUpdate?: (payload: WorkoutTemplateUpdatedPayload) => void;
  onTeamAssignmentChange?: (payload: TeamAssignmentChangedPayload) => void;
}

interface UseTrainingSocketReturn {
  socket: Socket | null;
  connected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

export function useTrainingSocket(
  options: UseTrainingSocketOptions = {}
): UseTrainingSocketReturn {
  const {
    autoConnect = true,
    onMedicalStatusChange,
    onSessionProgress,
    onCalendarEventChange,
    onPlayerAvailabilityChange,
    onWorkoutTemplateUpdate,
    onTeamAssignmentChange,
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<UseTrainingSocketReturn['connectionStatus']>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const auth = useSelector((state: RootState) => state.auth);

  // Connect to training namespace
  const connect = useCallback(async () => {
    // Skip WebSocket connection in mock mode
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    if (isMockMode) {
      console.log('Mock mode enabled - skipping WebSocket connection');
      setConnectionStatus('connected');
      setConnected(true);
      return;
    }

    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      setConnectionStatus('connecting');
      const newSocket = io(
        `${process.env.NEXT_PUBLIC_COMMUNICATION_SERVICE_URL || 'http://localhost:3002'}/training`,
        {
          auth: {
            token: auth.token || '',
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          reconnectionDelayMax: 5000,
        }
      );

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection handlers
      newSocket.on('connect', () => {
        console.log('Connected to training namespace for dashboard updates');
        setConnected(true);
        setConnectionStatus('connected');
        setError(null);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Training socket connection error:', err);
        setError(err.message || 'Failed to connect to training service');
        setConnectionStatus('error');
        setConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from training namespace:', reason);
        setConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect after a delay if it was not a manual disconnect
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      });

      // Dashboard event handlers
      if (onMedicalStatusChange) {
        newSocket.on(TrainingSessionSocketEvent.MEDICAL_STATUS_CHANGED, (payload: MedicalStatusChangedPayload) => {
          console.log('Medical status changed:', payload);
          onMedicalStatusChange(payload);
        });
      }

      if (onSessionProgress) {
        newSocket.on(TrainingSessionSocketEvent.SESSION_PROGRESS, (payload: SessionProgressPayload) => {
          console.log('Session progress:', payload);
          onSessionProgress(payload);
        });
      }

      if (onCalendarEventChange) {
        newSocket.on(TrainingSessionSocketEvent.CALENDAR_EVENT_CHANGED, (payload: CalendarEventChangedPayload) => {
          console.log('Calendar event changed:', payload);
          onCalendarEventChange(payload);
        });
      }

      if (onPlayerAvailabilityChange) {
        newSocket.on(TrainingSessionSocketEvent.PLAYER_AVAILABILITY_CHANGED, (payload: PlayerAvailabilityChangedPayload) => {
          console.log('Player availability changed:', payload);
          onPlayerAvailabilityChange(payload);
        });
      }

      if (onWorkoutTemplateUpdate) {
        newSocket.on(TrainingSessionSocketEvent.WORKOUT_TEMPLATE_UPDATED, (payload: WorkoutTemplateUpdatedPayload) => {
          console.log('Workout template updated:', payload);
          onWorkoutTemplateUpdate(payload);
        });
      }

      if (onTeamAssignmentChange) {
        newSocket.on(TrainingSessionSocketEvent.TEAM_ASSIGNMENT_CHANGED, (payload: TeamAssignmentChangedPayload) => {
          console.log('Team assignment changed:', payload);
          onTeamAssignmentChange(payload);
        });
      }

    } catch (err) {
      console.error('Failed to create training socket:', err);
      setError('Failed to connect to training service');
      setConnectionStatus('error');
    }
  }, [
    auth.token,
    onMedicalStatusChange,
    onSessionProgress,
    onCalendarEventChange,
    onPlayerAvailabilityChange,
    onWorkoutTemplateUpdate,
    onTeamAssignmentChange,
  ]);

  // Disconnect from namespace
  const disconnect = useCallback(() => {
    // Skip disconnect in mock mode
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    if (isMockMode) {
      setConnected(false);
      setConnectionStatus('disconnected');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  // Reconnect method
  const reconnect = useCallback(async () => {
    disconnect();
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    await connect();
  }, [connect, disconnect]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && auth.token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, auth.token]);

  // Reconnect when auth token changes
  useEffect(() => {
    if (socketRef.current && auth.token) {
      reconnect();
    }
  }, [auth.token, reconnect]);

  return {
    socket,
    connected,
    connectionStatus,
    error,
    connect,
    disconnect,
    reconnect,
  };
}