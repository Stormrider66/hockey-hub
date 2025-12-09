import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { 
  workoutSessionManager, 
  WorkoutSessionState, 
  SessionMetrics 
} from '../services/WorkoutSessionManager';
import { useSessionBroadcast } from './useSessionBroadcast';

interface UseWorkoutSessionProps {
  workoutId: string;
  eventId?: string;
  workoutType: 'STRENGTH' | 'CONDITIONING' | 'HYBRID' | 'AGILITY';
  workoutData: any;
  broadcastEnabled?: boolean;
}

interface UseWorkoutSessionReturn {
  // Session state
  session: WorkoutSessionState | null;
  isSessionActive: boolean;
  canResume: boolean;
  
  // Session controls
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: (finalMetrics?: Partial<SessionMetrics>) => void;
  clearSession: () => void;
  
  // State updates
  updateSessionState: (updates: Partial<WorkoutSessionState>) => void;
  updateMetrics: (metrics: Partial<SessionMetrics>) => void;
  updateProgress: (progress: number, timeElapsed: number) => void;
  
  // Recovery
  resumeFromStorage: () => boolean;
  
  // Broadcasting
  isConnected: boolean;
  isReconnecting: boolean;
  queuedUpdates: number;
  
  // History
  sessionHistory: WorkoutSessionState[];
}

export function useWorkoutSession({
  workoutId,
  eventId,
  workoutType,
  workoutData,
  broadcastEnabled = true
}: UseWorkoutSessionProps): UseWorkoutSessionReturn {
  const user = useSelector((state: RootState) => state.auth.user);
  const [session, setSession] = useState<WorkoutSessionState | null>(null);
  const [sessionHistory, setSessionHistory] = useState<WorkoutSessionState[]>([]);
  const broadcastRef = useRef<any>(null);
  
  // Initialize broadcasting
  const {
    isConnected,
    isReconnecting,
    queuedUpdates,
    broadcast,
    broadcastStrengthUpdate,
    broadcastConditioningUpdate,
    broadcastHybridUpdate,
    broadcastAgilityUpdate,
    joinSession,
    disconnect
  } = useSessionBroadcast({
    enabled: broadcastEnabled && !!session,
    throttleMs: 2000
  });
  
  // Store broadcast functions for different workout types
  useEffect(() => {
    broadcastRef.current = {
      STRENGTH: broadcastStrengthUpdate,
      CONDITIONING: broadcastConditioningUpdate,
      HYBRID: broadcastHybridUpdate,
      AGILITY: broadcastAgilityUpdate
    };
  }, [broadcastStrengthUpdate, broadcastConditioningUpdate, broadcastHybridUpdate, broadcastAgilityUpdate]);
  
  // Initialize session and load history
  useEffect(() => {
    const history = workoutSessionManager.getSessionHistory();
    setSessionHistory(history);
    
    // Check for existing active session
    const activeSession = workoutSessionManager.getCurrentSession();
    if (activeSession && activeSession.workoutId === workoutId) {
      setSession(activeSession);
    }
  }, [workoutId]);
  
  // Start new session
  const startSession = useCallback(() => {
    if (!user?.id) return;
    
    const newSession = workoutSessionManager.startSession({
      workoutId,
      eventId,
      workoutType,
      playerId: user.id,
      playerName: user.name || 'Unknown Player',
      workoutData
    });
    
    setSession(newSession);
    
    // Join broadcasting session if enabled
    if (broadcastEnabled && newSession.sessionId) {
      joinSession(newSession.sessionId, workoutId, eventId);
    }
    
    // Initial broadcast
    if (broadcastEnabled && broadcastRef.current[workoutType]) {
      setTimeout(() => {
        broadcastSessionUpdate(newSession);
      }, 1000);
    }
  }, [workoutId, eventId, workoutType, workoutData, user, broadcastEnabled, joinSession]);
  
  // Pause session
  const pauseSession = useCallback(() => {
    workoutSessionManager.pauseSession();
    const updatedSession = workoutSessionManager.getCurrentSession();
    if (updatedSession) {
      setSession({ ...updatedSession });
      broadcastSessionUpdate(updatedSession);
    }
  }, []);
  
  // Resume session
  const resumeSession = useCallback(() => {
    workoutSessionManager.resumeSessionPlayback();
    const updatedSession = workoutSessionManager.getCurrentSession();
    if (updatedSession) {
      setSession({ ...updatedSession });
      broadcastSessionUpdate(updatedSession);
    }
  }, []);
  
  // Complete session
  const completeSession = useCallback((finalMetrics?: Partial<SessionMetrics>) => {
    const completedSession = workoutSessionManager.completeSession(finalMetrics);
    if (completedSession) {
      // Broadcast completion
      broadcastSessionUpdate(completedSession);
      
      // Update local state
      setSession(null);
      setSessionHistory(workoutSessionManager.getSessionHistory());
    }
  }, []);
  
  // Clear session
  const clearSession = useCallback(() => {
    workoutSessionManager.clearSession();
    setSession(null);
    disconnect();
  }, [disconnect]);
  
  // Update session state
  const updateSessionState = useCallback((updates: Partial<WorkoutSessionState>) => {
    workoutSessionManager.updateSession(updates);
    const updatedSession = workoutSessionManager.getCurrentSession();
    if (updatedSession) {
      setSession({ ...updatedSession });
      
      // Broadcast if significant state change
      if (updates.isPaused !== undefined || updates.isCompleted !== undefined || updates.overallProgress !== undefined) {
        broadcastSessionUpdate(updatedSession);
      }
    }
  }, []);
  
  // Update metrics
  const updateMetrics = useCallback((metrics: Partial<SessionMetrics>) => {
    workoutSessionManager.updateMetrics(metrics);
    const updatedSession = workoutSessionManager.getCurrentSession();
    if (updatedSession) {
      setSession({ ...updatedSession });
    }
  }, []);
  
  // Update progress with time
  const updateProgress = useCallback((progress: number, timeElapsed: number) => {
    const updates = {
      overallProgress: progress,
      totalTimeElapsed: timeElapsed
    };
    
    workoutSessionManager.updateSession(updates);
    const updatedSession = workoutSessionManager.getCurrentSession();
    if (updatedSession) {
      setSession({ ...updatedSession });
      broadcastSessionUpdate(updatedSession);
    }
  }, []);
  
  // Resume from storage
  const resumeFromStorage = useCallback((): boolean => {
    const resumedSession = workoutSessionManager.resumeSession();
    if (resumedSession && resumedSession.workoutId === workoutId) {
      setSession(resumedSession);
      return true;
    }
    return false;
  }, [workoutId]);
  
  // Broadcast session updates
  const broadcastSessionUpdate = useCallback((sessionToBroadcast: WorkoutSessionState) => {
    if (!broadcastEnabled || !broadcastRef.current[sessionToBroadcast.workoutType]) return;
    
    const broadcastFn = broadcastRef.current[sessionToBroadcast.workoutType];
    
    switch (sessionToBroadcast.workoutType) {
      case 'STRENGTH':
        if (sessionToBroadcast.strengthState) {
          const state = sessionToBroadcast.strengthState;
          const currentExercise = state.exercises[state.currentExerciseIndex];
          broadcastFn({
            workoutId: sessionToBroadcast.workoutId,
            eventId: sessionToBroadcast.eventId,
            overallProgress: sessionToBroadcast.overallProgress,
            currentExercise: currentExercise?.name || 'Unknown',
            currentSet: state.currentSetIndex + 1,
            totalSets: currentExercise?.sets.length || 0,
            currentReps: currentExercise?.sets[state.currentSetIndex]?.actualReps || currentExercise?.sets[state.currentSetIndex]?.reps || 0,
            currentLoad: currentExercise?.sets[state.currentSetIndex]?.actualWeight?.toString() || currentExercise?.sets[state.currentSetIndex]?.weight?.toString(),
            totalTimeElapsed: sessionToBroadcast.totalTimeElapsed,
            isCompleted: sessionToBroadcast.isCompleted,
            isPaused: sessionToBroadcast.isPaused
          });
        }
        break;
        
      case 'CONDITIONING':
        if (sessionToBroadcast.conditioningState) {
          const state = sessionToBroadcast.conditioningState;
          const currentInterval = state.intervals[state.currentIntervalIndex];
          broadcastFn({
            workoutId: sessionToBroadcast.workoutId,
            eventId: sessionToBroadcast.eventId,
            overallProgress: sessionToBroadcast.overallProgress,
            currentInterval: currentInterval?.intensity || 'Unknown',
            intervalIndex: state.currentIntervalIndex,
            totalIntervals: state.intervals.length,
            intervalTimeRemaining: state.intervalTimeRemaining,
            heartRate: sessionToBroadcast.metrics.heartRate,
            targetHeartRate: currentInterval?.targetBPM,
            targetPower: currentInterval?.targetPower,
            targetPace: currentInterval?.targetPace,
            totalTimeElapsed: sessionToBroadcast.totalTimeElapsed,
            isCompleted: sessionToBroadcast.isCompleted,
            isPaused: sessionToBroadcast.isPaused
          });
        }
        break;
        
      case 'HYBRID':
        if (sessionToBroadcast.hybridState) {
          const state = sessionToBroadcast.hybridState;
          const currentBlock = state.blocks[state.currentBlockIndex];
          broadcastFn({
            workoutId: sessionToBroadcast.workoutId,
            eventId: sessionToBroadcast.eventId,
            overallProgress: sessionToBroadcast.overallProgress,
            currentBlock: currentBlock?.name || 'Unknown',
            blockType: currentBlock?.type || 'exercise',
            blockIndex: state.currentBlockIndex,
            totalBlocks: state.blocks.length,
            totalTimeElapsed: sessionToBroadcast.totalTimeElapsed,
            currentExercise: currentBlock?.type === 'exercise' ? currentBlock.name : undefined,
            currentSet: currentBlock?.currentSet,
            totalSets: currentBlock?.sets?.length,
            currentInterval: currentBlock?.type === 'interval' ? currentBlock.intensity : undefined,
            intervalTimeRemaining: currentBlock?.timeRemaining,
            isCompleted: sessionToBroadcast.isCompleted,
            isPaused: sessionToBroadcast.isPaused
          });
        }
        break;
        
      case 'AGILITY':
        if (sessionToBroadcast.agilityState) {
          const state = sessionToBroadcast.agilityState;
          const currentDrill = state.drills[state.currentDrillIndex];
          broadcastFn({
            workoutId: sessionToBroadcast.workoutId,
            eventId: sessionToBroadcast.eventId,
            overallProgress: sessionToBroadcast.overallProgress,
            currentPhase: state.currentPhase,
            currentDrill: currentDrill?.name,
            drillIndex: state.currentDrillIndex,
            totalDrills: state.drills.length,
            currentRep: state.currentRepIndex + 1,
            totalReps: currentDrill?.reps || 0,
            lastTime: currentDrill?.times[currentDrill.times.length - 1],
            bestTime: currentDrill?.bestTime,
            rpe: currentDrill?.rpe,
            totalTimeElapsed: sessionToBroadcast.totalTimeElapsed,
            isCompleted: sessionToBroadcast.isCompleted,
            isPaused: sessionToBroadcast.isPaused
          });
        }
        break;
    }
  }, [broadcastEnabled]);
  
  // Computed values
  const isSessionActive = session !== null && !session.isCompleted;
  const canResume = !!session && session.isPaused && !session.isCompleted;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect here as session might continue
      // Session will be auto-saved by the manager
    };
  }, []);
  
  return {
    // Session state
    session,
    isSessionActive,
    canResume,
    
    // Session controls
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    clearSession,
    
    // State updates
    updateSessionState,
    updateMetrics,
    updateProgress,
    
    // Recovery
    resumeFromStorage,
    
    // Broadcasting
    isConnected,
    isReconnecting,
    queuedUpdates,
    
    // History
    sessionHistory
  };
}