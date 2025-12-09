'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { calendarApi } from '@/store/api/calendarApi';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

interface LiveSessionUpdate {
  eventId: string;
  isLive: boolean;
  currentProgress: number;
  activeParticipants: number;
  currentActivity?: {
    type: 'exercise' | 'interval' | 'rest' | 'transition';
    name: string;
    timeRemaining?: number;
  };
}

interface UseCalendarLiveUpdatesProps {
  organizationId: string;
  teamId?: string;
  userId: string;
  enabled?: boolean;
}

export function useCalendarLiveUpdates({
  organizationId,
  teamId,
  userId,
  enabled = true,
}: UseCalendarLiveUpdatesProps) {
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  // Handle live session updates
  const handleLiveSessionUpdate = useCallback((update: LiveSessionUpdate) => {
    // Update the event in the RTK Query cache
    (dispatch as any)(
      calendarApi.util.updateQueryData(
        'getEventsByDateRange',
        ({ organizationId, teamId } as any),
        (draft) => {
          const event = draft.find((e) => e.id === update.eventId);
          if (event) {
            event.isLive = update.isLive;
            event.currentProgress = update.currentProgress;
            event.activeParticipants = update.activeParticipants;
            event.currentActivity = update.currentActivity;
          }
        }
      )
    );

    // Also update getEvents query cache
    (dispatch as any)(
      calendarApi.util.updateQueryData(
        'getEvents',
        { organizationId, teamId },
        (draft) => {
          if (draft.data) {
            const event = draft.data.find((e) => e.id === update.eventId);
            if (event) {
              event.isLive = update.isLive;
              event.currentProgress = update.currentProgress;
              event.activeParticipants = update.activeParticipants;
              event.currentActivity = update.currentActivity;
            }
          }
        }
      )
    );
  }, [dispatch, organizationId, teamId]);

  // Handle session completion
  const handleSessionComplete = useCallback((data: { eventId: string; summary?: any }) => {
    (dispatch as any)(
      calendarApi.util.updateQueryData(
        'getEventsByDateRange',
        ({ organizationId, teamId } as any),
        (draft) => {
          const event = draft.find((e) => e.id === data.eventId);
          if (event) {
            event.isLive = false;
            event.currentProgress = 100;
            event.status = 'completed' as any;
          }
        }
      )
    );

    toast.success('Training session completed!');
  }, [dispatch, organizationId, teamId]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3003', {
      auth: {
        token: localStorage.getItem('access_token'),
      },
      query: {
        organizationId,
        teamId,
        userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to calendar live updates');
      reconnectAttemptsRef.current = 0;
      
      // Subscribe to calendar updates room
      socket.emit('subscribe:calendar', {
        organizationId,
        teamId,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from calendar live updates:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, attempt to reconnect
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Calendar WebSocket connection error:', error);
      reconnectAttemptsRef.current++;
      
      if (reconnectAttemptsRef.current > 5) {
        toast.error('Unable to connect to live updates. Some features may be unavailable.');
      }
    });

    // Listen for live session updates
    socket.on('session:live', handleLiveSessionUpdate);
    socket.on('session:update', handleLiveSessionUpdate);
    socket.on('session:complete', handleSessionComplete);

    // Listen for participant updates
    socket.on('session:participant:joined', (data: { eventId: string; userId: string }) => {
      (dispatch as any)(
        calendarApi.util.updateQueryData(
          'getEventsByDateRange',
          ({ organizationId, teamId } as any),
          (draft) => {
            const event = draft.find((e) => e.id === data.eventId);
            if (event && event.activeParticipants !== undefined) {
              event.activeParticipants++;
            }
          }
        )
      );
    });

    socket.on('session:participant:left', (data: { eventId: string; userId: string }) => {
      (dispatch as any)(
        calendarApi.util.updateQueryData(
          'getEventsByDateRange',
          ({ organizationId, teamId } as any),
          (draft) => {
            const event = draft.find((e) => e.id === data.eventId);
            if (event && event.activeParticipants !== undefined && event.activeParticipants > 0) {
              event.activeParticipants--;
            }
          }
        )
      );
    });

    socketRef.current = socket;
  }, [enabled, organizationId, teamId, userId, dispatch, handleLiveSessionUpdate, handleSessionComplete]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  // Emit session started event
  const emitSessionStarted = useCallback((eventId: string, workoutType: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('session:start', {
        eventId,
        workoutType,
        userId,
      });
    }
  }, [userId]);

  // Emit session progress update
  const emitProgressUpdate = useCallback((eventId: string, progress: number, currentActivity?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('session:progress', {
        eventId,
        progress,
        currentActivity,
        userId,
      });
    }
  }, [userId]);

  // Emit session completed
  const emitSessionCompleted = useCallback((eventId: string, summary?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('session:complete', {
        eventId,
        summary,
        userId,
      });
    }
  }, [userId]);

  // Setup and cleanup
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: socketRef.current?.connected || false,
    emitSessionStarted,
    emitProgressUpdate,
    emitSessionCompleted,
  };
}