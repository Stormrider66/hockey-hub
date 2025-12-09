'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from '../store/hooks';
import { trainingSessionViewerSlice } from '../store/slices/trainingSessionViewerSlice';

interface TrainingSocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  startSession: (sessionId: string) => void;
  completeExercise: (data: any) => void;
  updateMetrics: (data: any) => void;
  changeView: (data: any) => void;
  focusPlayer: (data: any) => void;
}

const TrainingSocketContext = createContext<TrainingSocketContextType>({
  socket: null,
  connected: false,
  joinSession: () => {},
  leaveSession: () => {},
  startSession: () => {},
  completeExercise: () => {},
  updateMetrics: () => {},
  changeView: () => {},
  focusPlayer: () => {},
});

export const useTrainingSocket = () => useContext(TrainingSocketContext);

interface TrainingSocketProviderProps {
  children: React.ReactNode;
}

export const TrainingSocketProvider: React.FC<TrainingSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const dispatch = useAppDispatch();
  
  const TRAINING_SERVICE_URL = process.env.NEXT_PUBLIC_TRAINING_SERVICE_URL || 'http://localhost:3004';

  useEffect(() => {
    // Skip WebSocket connection in mock mode
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    if (isMockMode) {
      console.log('Mock mode enabled, skipping training socket connection');
      return;
    }

    // Initialize socket connection
    const newSocket = io(TRAINING_SERVICE_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to training service');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from training service');
      setConnected(false);
    });

    // Session events
    newSocket.on('session:started', (data) => {
      console.log('Session started:', data);
      // Update Redux state or trigger notifications
    });

    newSocket.on('exercise:completed', (data) => {
      console.log('Exercise completed:', data);
      dispatch(trainingSessionViewerSlice.actions.updatePlayerProgress({
        playerId: data.playerId,
        exerciseId: data.exerciseId,
        completed: true,
      }));
    });

    newSocket.on('metrics:updated', (data) => {
      console.log('Metrics updated:', data);
      dispatch(trainingSessionViewerSlice.actions.updatePlayerMetrics({
        playerId: data.playerId,
        metrics: data.metrics,
      }));
    });

    // Trainer control events
    newSocket.on('view:changed', (data) => {
      console.log('View changed:', data);
      dispatch(trainingSessionViewerSlice.actions.setViewMode(data.viewMode));
    });

    newSocket.on('player:focused', (data) => {
      console.log('Player focused:', data);
      dispatch(trainingSessionViewerSlice.actions.setFocusedPlayer(data.playerId));
    });

    // Execution events
    newSocket.on('execution:started', (data) => {
      console.log('Execution started:', data);
      dispatch(trainingSessionViewerSlice.actions.addActivePlayer(data.playerId));
    });

    newSocket.on('execution:progress', (data) => {
      console.log('Execution progress:', data);
      dispatch(trainingSessionViewerSlice.actions.updatePlayerProgress({
        playerId: data.playerId,
        currentExerciseIndex: data.currentExerciseIndex,
        currentSetNumber: data.currentSetNumber,
        completionPercentage: data.completionPercentage,
      }));
    });

    newSocket.on('execution:completed', (data) => {
      console.log('Execution completed:', data);
      dispatch(trainingSessionViewerSlice.actions.removeActivePlayer(data.playerId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [dispatch, TRAINING_SERVICE_URL]);

  const joinSession = useCallback((sessionId: string) => {
    if (socket) {
      socket.emit('session:join', sessionId);
    }
  }, [socket]);

  const leaveSession = useCallback((sessionId: string) => {
    if (socket) {
      socket.emit('session:leave', sessionId);
    }
  }, [socket]);

  const startSession = useCallback((sessionId: string) => {
    if (socket) {
      socket.emit('session:start', { sessionId });
    }
  }, [socket]);

  const completeExercise = useCallback((data: any) => {
    if (socket) {
      socket.emit('exercise:complete', data);
    }
  }, [socket]);

  const updateMetrics = useCallback((data: any) => {
    if (socket) {
      socket.emit('metrics:update', data);
    }
  }, [socket]);

  const changeView = useCallback((data: any) => {
    if (socket) {
      socket.emit('view:change', data);
    }
  }, [socket]);

  const focusPlayer = useCallback((data: any) => {
    if (socket) {
      socket.emit('player:focus', data);
    }
  }, [socket]);

  const value = {
    socket,
    connected,
    joinSession,
    leaveSession,
    startSession,
    completeExercise,
    updateMetrics,
    changeView,
    focusPlayer,
  };

  return (
    <TrainingSocketContext.Provider value={value}>
      {children}
    </TrainingSocketContext.Provider>
  );
};