'use client';

import { useEffect, useCallback } from 'react';
import { useCalendarLiveUpdates } from '@/features/calendar/hooks/useCalendarLiveUpdates';

interface UseWorkoutLiveUpdatesProps {
  eventId?: string;
  workoutId: string;
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  organizationId: string;
  teamId?: string;
  userId: string;
}

/**
 * Hook for player workout pages to emit live updates to the calendar
 * This integrates with the calendar's live session system
 */
export function useWorkoutLiveUpdates({
  eventId,
  workoutId,
  workoutType,
  organizationId,
  teamId,
  userId,
}: UseWorkoutLiveUpdatesProps) {
  const { isConnected, emitSessionStarted, emitProgressUpdate, emitSessionCompleted } = useCalendarLiveUpdates({
    organizationId,
    teamId,
    userId,
    enabled: !!eventId, // Only enable if launched from calendar event
  });

  // Emit session started when component mounts
  useEffect(() => {
    if (eventId && isConnected) {
      emitSessionStarted(eventId, workoutType);
    }
  }, [eventId, workoutType, isConnected, emitSessionStarted]);

  // Helper to calculate progress based on workout type
  const calculateProgress = useCallback((completed: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, []);

  // Emit progress update for strength workouts
  const updateStrengthProgress = useCallback((
    exerciseIndex: number,
    totalExercises: number,
    currentExercise: { name: string; set: number; totalSets: number }
  ) => {
    if (!eventId) return;

    const progress = calculateProgress(exerciseIndex, totalExercises);
    const activity = {
      type: 'exercise' as const,
      name: `${currentExercise.name} - Set ${currentExercise.set}/${currentExercise.totalSets}`,
    };

    emitProgressUpdate(eventId, progress, activity);
  }, [eventId, calculateProgress, emitProgressUpdate]);

  // Emit progress update for conditioning workouts
  const updateConditioningProgress = useCallback((
    intervalIndex: number,
    totalIntervals: number,
    currentInterval: { name: string; type: 'work' | 'rest'; timeRemaining: number }
  ) => {
    if (!eventId) return;

    const progress = calculateProgress(intervalIndex, totalIntervals);
    const activity = {
      type: currentInterval.type === 'work' ? 'interval' : 'rest' as const,
      name: currentInterval.name,
      timeRemaining: currentInterval.timeRemaining,
    };

    emitProgressUpdate(eventId, progress, activity);
  }, [eventId, calculateProgress, emitProgressUpdate]);

  // Emit progress update for hybrid workouts
  const updateHybridProgress = useCallback((
    blockIndex: number,
    totalBlocks: number,
    currentBlock: { type: string; name: string; timeRemaining?: number }
  ) => {
    if (!eventId) return;

    const progress = calculateProgress(blockIndex, totalBlocks);
    const activityType = currentBlock.type === 'exercise' ? 'exercise' : 
                        currentBlock.type === 'interval' ? 'interval' : 
                        currentBlock.type === 'transition' ? 'transition' : 'rest';
    
    const activity = {
      type: activityType as any,
      name: currentBlock.name,
      timeRemaining: currentBlock.timeRemaining,
    };

    emitProgressUpdate(eventId, progress, activity);
  }, [eventId, calculateProgress, emitProgressUpdate]);

  // Emit progress update for agility workouts
  const updateAgilityProgress = useCallback((
    drillIndex: number,
    totalDrills: number,
    currentDrill: { name: string; phase: string }
  ) => {
    if (!eventId) return;

    const progress = calculateProgress(drillIndex, totalDrills);
    const activity = {
      type: 'exercise' as const,
      name: `${currentDrill.name} - ${currentDrill.phase}`,
    };

    emitProgressUpdate(eventId, progress, activity);
  }, [eventId, calculateProgress, emitProgressUpdate]);

  // Complete the session
  const completeWorkout = useCallback((summary?: {
    duration: number;
    exercisesCompleted?: number;
    intervalsCompleted?: number;
    drillsCompleted?: number;
    averageHeartRate?: number;
    caloriesBurned?: number;
  }) => {
    if (!eventId) return;

    emitSessionCompleted(eventId, summary);
  }, [eventId, emitSessionCompleted]);

  return {
    isLiveEnabled: !!eventId && isConnected,
    updateStrengthProgress,
    updateConditioningProgress,
    updateHybridProgress,
    updateAgilityProgress,
    completeWorkout,
  };
}