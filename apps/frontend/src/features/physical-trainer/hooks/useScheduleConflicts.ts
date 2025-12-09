import { useState, useCallback } from 'react';
import { WorkoutSession, ScheduleConflict, CalendarEvent } from '../types';

interface ConflictCheckOptions {
  bufferMinutes?: number;
  checkMedical?: boolean;
  checkGames?: boolean;
  checkOtherTraining?: boolean;
}

interface ConflictResolution {
  type: 'reschedule' | 'override' | 'cancel';
  newDate?: Date;
  reason?: string;
}

export const useScheduleConflicts = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);

  /**
   * Check for scheduling conflicts
   */
  const checkConflicts = useCallback(async (
    workout: WorkoutSession | Partial<WorkoutSession>,
    proposedDate: Date,
    playerIds: string[],
    options: ConflictCheckOptions = {}
  ): Promise<ScheduleConflict[]> => {
    const {
      bufferMinutes = 30,
      checkMedical = true,
      checkGames = true,
      checkOtherTraining = true,
    } = options;

    setIsChecking(true);
    const foundConflicts: ScheduleConflict[] = [];

    try {
      // Simulate API call to check conflicts
      // In real implementation, this would query the backend
      const workoutDuration = workout.metadata?.duration || 60;
      const workoutEnd = new Date(proposedDate.getTime() + workoutDuration * 60000);

      // Check for game conflicts
      if (checkGames) {
        const gameConflicts = await checkGameConflicts(proposedDate, workoutEnd, playerIds);
        foundConflicts.push(...gameConflicts);
      }

      // Check for other training conflicts
      if (checkOtherTraining) {
        const trainingConflicts = await checkTrainingConflicts(
          proposedDate, 
          workoutEnd, 
          playerIds, 
          bufferMinutes
        );
        foundConflicts.push(...trainingConflicts);
      }

      // Check for medical appointments
      if (checkMedical) {
        const medicalConflicts = await checkMedicalConflicts(proposedDate, workoutEnd, playerIds);
        foundConflicts.push(...medicalConflicts);
      }

      setConflicts(foundConflicts);
      return foundConflicts;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return [];
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Check conflicts for multiple workouts (bulk operations)
   */
  const checkBulkConflicts = useCallback(async (
    workouts: WorkoutSession[],
    updates: Partial<WorkoutSession>
  ): Promise<ScheduleConflict[]> => {
    const allConflicts: ScheduleConflict[] = [];

    for (const workout of workouts) {
      if (updates.scheduledDate) {
        const conflicts = await checkConflicts(
          { ...workout, ...updates },
          new Date(updates.scheduledDate),
          workout.playerIds
        );
        allConflicts.push(...conflicts);
      }
    }

    return allConflicts;
  }, [checkConflicts]);

  /**
   * Resolve conflicts with various strategies
   */
  const resolveConflicts = useCallback(async (
    conflicts: ScheduleConflict[],
    resolution: ConflictResolution
  ): Promise<boolean> => {
    try {
      switch (resolution.type) {
        case 'reschedule':
          if (resolution.newDate) {
            // Check if new date has conflicts
            const newConflicts = await checkConflicts(
              {} as WorkoutSession,
              resolution.newDate,
              conflicts.map(c => c.playerId)
            );
            return newConflicts.length === 0;
          }
          break;

        case 'override':
          // Log the override decision
          console.log('Overriding conflicts:', conflicts, 'Reason:', resolution.reason);
          return true;

        case 'cancel':
          return false;
      }
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      return false;
    }

    return false;
  }, [checkConflicts]);

  /**
   * Find alternative time slots
   */
  const findAlternativeSlots = useCallback(async (
    workout: Partial<WorkoutSession>,
    preferredDate: Date,
    playerIds: string[],
    options: {
      maxDaysToSearch?: number;
      preferredTimes?: string[];
      avoidWeekends?: boolean;
    } = {}
  ): Promise<Date[]> => {
    const {
      maxDaysToSearch = 7,
      preferredTimes = ['morning', 'afternoon'],
      avoidWeekends = false,
    } = options;

    const alternatives: Date[] = [];
    const duration = workout.metadata?.duration || 60;

    for (let dayOffset = 0; dayOffset < maxDaysToSearch; dayOffset++) {
      const checkDate = new Date(preferredDate);
      checkDate.setDate(checkDate.getDate() + dayOffset);

      // Skip weekends if requested
      if (avoidWeekends && (checkDate.getDay() === 0 || checkDate.getDay() === 6)) {
        continue;
      }

      // Check different time slots
      for (const timeSlot of preferredTimes) {
        const slotDate = new Date(checkDate);
        
        switch (timeSlot) {
          case 'morning':
            slotDate.setHours(8, 0, 0, 0);
            break;
          case 'afternoon':
            slotDate.setHours(14, 0, 0, 0);
            break;
          case 'evening':
            slotDate.setHours(18, 0, 0, 0);
            break;
        }

        const conflicts = await checkConflicts(workout, slotDate, playerIds);
        if (conflicts.length === 0) {
          alternatives.push(slotDate);
        }
      }

      // Return early if we have enough alternatives
      if (alternatives.length >= 3) {
        break;
      }
    }

    return alternatives;
  }, [checkConflicts]);

  // Mock conflict checking functions
  async function checkGameConflicts(
    start: Date,
    end: Date,
    playerIds: string[]
  ): Promise<ScheduleConflict[]> {
    // Simulate game conflicts
    const conflicts: ScheduleConflict[] = [];
    
    // Mock: Check if there's a game on the same day
    if (start.getDay() === 5 || start.getDay() === 6) { // Friday or Saturday
      playerIds.forEach(playerId => {
        conflicts.push({
          playerId,
          playerName: `Player ${playerId}`,
          conflictType: 'game',
          eventTitle: 'Home Game vs Opponents',
          eventTime: '7:00 PM',
          severity: 'high',
        });
      });
    }

    return conflicts;
  }

  async function checkTrainingConflicts(
    start: Date,
    end: Date,
    playerIds: string[],
    bufferMinutes: number
  ): Promise<ScheduleConflict[]> {
    // Simulate training conflicts
    const conflicts: ScheduleConflict[] = [];
    
    // Mock: Morning ice practice conflict
    if (start.getHours() < 10) {
      playerIds.slice(0, 2).forEach(playerId => {
        conflicts.push({
          playerId,
          playerName: `Player ${playerId}`,
          conflictType: 'practice',
          eventTitle: 'Ice Practice',
          eventTime: '8:00 AM',
          severity: 'medium',
        });
      });
    }

    return conflicts;
  }

  async function checkMedicalConflicts(
    start: Date,
    end: Date,
    playerIds: string[]
  ): Promise<ScheduleConflict[]> {
    // Simulate medical appointment conflicts
    const conflicts: ScheduleConflict[] = [];
    
    // Mock: Random medical appointments
    if (Math.random() > 0.8) {
      conflicts.push({
        playerId: playerIds[0],
        playerName: `Player ${playerIds[0]}`,
        conflictType: 'medical',
        eventTitle: 'Physiotherapy Session',
        eventTime: start.toLocaleTimeString(),
        severity: 'medium',
      });
    }

    return conflicts;
  }

  return {
    isChecking,
    conflicts,
    checkConflicts,
    checkBulkConflicts,
    resolveConflicts,
    findAlternativeSlots,
  };
};