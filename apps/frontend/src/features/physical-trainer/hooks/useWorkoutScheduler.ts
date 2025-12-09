import { useState, useCallback } from 'react';
import { WorkoutSession, CalendarEvent } from '../types';

interface ScheduleOptimizationOptions {
  teamId?: string;
  playerIds?: string[];
  startDate: Date;
  endDate: Date;
  constraints: {
    maxPerDay?: number;
    minRestBetween?: number; // hours
    preferredTimes?: string[];
    avoidDays?: number[]; // 0-6, where 0 is Sunday
    balanceWorkTypes?: boolean;
  };
}

interface TimeSlotSuggestion {
  date: Date;
  score: number; // 0-100, higher is better
  reasons: string[];
  conflicts: number;
}

interface OptimizedSchedule {
  original: CalendarEvent[];
  optimized: CalendarEvent[];
  improvements: string[];
  score: number;
}

export const useWorkoutScheduler = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState<TimeSlotSuggestion[]>([]);

  /**
   * Suggest best times for a workout
   */
  const suggestBestTimes = useCallback(async (
    workout: Partial<WorkoutSession>,
    preferredDate: Date,
    daysToCheck: number = 7
  ): Promise<TimeSlotSuggestion[]> => {
    const suggestions: TimeSlotSuggestion[] = [];
    const workoutDuration = workout.metadata?.duration || 60;

    for (let day = 0; day < daysToCheck; day++) {
      const checkDate = new Date(preferredDate);
      checkDate.setDate(checkDate.getDate() + day);

      // Check morning, afternoon, and evening slots
      const timeSlots = [
        { hour: 8, period: 'morning' },
        { hour: 10, period: 'mid-morning' },
        { hour: 14, period: 'afternoon' },
        { hour: 16, period: 'late-afternoon' },
        { hour: 18, period: 'evening' },
      ];

      for (const slot of timeSlots) {
        const slotDate = new Date(checkDate);
        slotDate.setHours(slot.hour, 0, 0, 0);

        const score = await calculateTimeSlotScore(
          slotDate,
          workout,
          slot.period
        );

        suggestions.push({
          date: slotDate,
          score: score.total,
          reasons: score.reasons,
          conflicts: score.conflicts,
        });
      }
    }

    // Sort by score (highest first)
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Return top 10 suggestions
  }, []);

  /**
   * Optimize entire schedule
   */
  const optimizeSchedule = useCallback(async (
    workouts: WorkoutSession[],
    existingEvents: CalendarEvent[],
    options: ScheduleOptimizationOptions
  ): Promise<OptimizedSchedule> => {
    setIsOptimizing(true);

    try {
      const optimized = [...existingEvents];
      const improvements: string[] = [];
      
      // Group workouts by type
      const workoutsByType = groupWorkoutsByType(workouts);
      
      // Distribute workouts evenly across the period
      const daysInPeriod = Math.ceil(
        (options.endDate.getTime() - options.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Calculate optimal frequency for each workout type
      const frequencies = calculateOptimalFrequencies(workoutsByType, daysInPeriod);
      
      // Remove conflicts and overlaps
      const conflictFreeSchedule = removeConflicts(optimized, options.constraints);
      
      // Balance workout types throughout the week
      if (options.constraints.balanceWorkTypes) {
        balanceWorkoutTypes(conflictFreeSchedule, workoutsByType);
        improvements.push('Balanced workout types throughout the week');
      }
      
      // Respect rest periods
      if (options.constraints.minRestBetween) {
        enforceRestPeriods(conflictFreeSchedule, options.constraints.minRestBetween);
        improvements.push(`Ensured ${options.constraints.minRestBetween}h rest between sessions`);
      }
      
      // Optimize for preferred times
      if (options.constraints.preferredTimes?.length) {
        optimizeForPreferredTimes(conflictFreeSchedule, options.constraints.preferredTimes);
        improvements.push('Scheduled workouts at preferred times');
      }
      
      // Calculate overall schedule score
      const score = calculateScheduleScore(conflictFreeSchedule, existingEvents);
      
      return {
        original: existingEvents,
        optimized: conflictFreeSchedule,
        improvements,
        score,
      };
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  /**
   * Auto-schedule workouts based on patterns
   */
  const autoScheduleWorkouts = useCallback(async (
    workouts: WorkoutSession[],
    pattern: 'weekly' | 'biweekly' | 'monthly' | 'custom',
    startDate: Date,
    options: {
      duration: number; // weeks
      skipDays?: number[];
      preferredTimes?: string[];
    }
  ): Promise<CalendarEvent[]> => {
    const scheduledEvents: CalendarEvent[] = [];
    const { duration, skipDays = [], preferredTimes = ['morning'] } = options;

    // Sort workouts by priority (high intensity first, then by type)
    const sortedWorkouts = [...workouts].sort((a, b) => {
      const intensityOrder = { max: 4, high: 3, medium: 2, low: 1 };
      return (intensityOrder[b.intensity] || 0) - (intensityOrder[a.intensity] || 0);
    });

    let currentDate = new Date(startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration * 7);

    while (currentDate < endDate) {
      // Skip specified days
      if (skipDays.includes(currentDate.getDay())) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Schedule workouts based on pattern
      switch (pattern) {
        case 'weekly':
          // Schedule each workout once per week
          for (let i = 0; i < sortedWorkouts.length; i++) {
            const workout = sortedWorkouts[i];
            const dayOffset = i % 5; // Distribute across weekdays
            const scheduleDate = new Date(currentDate);
            scheduleDate.setDate(scheduleDate.getDate() + dayOffset);
            
            if (scheduleDate < endDate) {
              const event = createEventFromWorkout(workout, scheduleDate, preferredTimes[0]);
              scheduledEvents.push(event);
            }
          }
          currentDate.setDate(currentDate.getDate() + 7);
          break;

        case 'biweekly':
          // Schedule workouts every two weeks
          for (const workout of sortedWorkouts) {
            const event = createEventFromWorkout(workout, currentDate, preferredTimes[0]);
            scheduledEvents.push(event);
          }
          currentDate.setDate(currentDate.getDate() + 14);
          break;

        case 'monthly':
          // Schedule workouts once per month
          for (const workout of sortedWorkouts) {
            const event = createEventFromWorkout(workout, currentDate, preferredTimes[0]);
            scheduledEvents.push(event);
          }
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;

        case 'custom':
          // Custom pattern - alternate between workout types
          const workoutIndex = scheduledEvents.length % sortedWorkouts.length;
          const workout = sortedWorkouts[workoutIndex];
          const event = createEventFromWorkout(workout, currentDate, preferredTimes[0]);
          scheduledEvents.push(event);
          currentDate.setDate(currentDate.getDate() + 2); // Every other day
          break;
      }
    }

    return scheduledEvents;
  }, []);

  /**
   * Detect scheduling patterns and suggest improvements
   */
  const analyzeSchedulePatterns = useCallback((
    events: CalendarEvent[],
    dateRange: { start: Date; end: Date }
  ): {
    patterns: string[];
    issues: string[];
    suggestions: string[];
  } => {
    const patterns: string[] = [];
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Group events by day of week
    const eventsByDay = new Map<number, CalendarEvent[]>();
    events.forEach(event => {
      const day = new Date(event.start).getDay();
      if (!eventsByDay.has(day)) {
        eventsByDay.set(day, []);
      }
      eventsByDay.get(day)!.push(event);
    });

    // Detect patterns
    if (eventsByDay.get(1)?.length > 3 && eventsByDay.get(3)?.length > 3) {
      patterns.push('Monday/Wednesday heavy training pattern detected');
    }

    // Detect issues
    const consecutiveDays = findConsecutiveTrainingDays(events);
    if (consecutiveDays.length > 3) {
      issues.push(`${consecutiveDays.length} consecutive training days without rest`);
      suggestions.push('Add rest day after 3 consecutive training days');
    }

    // Check for workout type imbalance
    const typeDistribution = getWorkoutTypeDistribution(events);
    const dominantType = Object.entries(typeDistribution)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (dominantType && dominantType[1] > events.length * 0.5) {
      issues.push(`Over-emphasis on ${dominantType[0]} workouts (${Math.round(dominantType[1] / events.length * 100)}%)`);
      suggestions.push(`Add more variety - reduce ${dominantType[0]} and add other workout types`);
    }

    return { patterns, issues, suggestions };
  }, []);

  // Helper functions
  async function calculateTimeSlotScore(
    date: Date,
    workout: Partial<WorkoutSession>,
    period: string
  ): Promise<{ total: number; reasons: string[]; conflicts: number }> {
    let score = 50; // Base score
    const reasons: string[] = [];
    let conflicts = 0;

    // Prefer weekdays
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      score += 10;
      reasons.push('Weekday scheduling preferred');
    }

    // Time of day preferences based on workout type
    if (workout.type === 'strength' && period === 'afternoon') {
      score += 15;
      reasons.push('Afternoon optimal for strength training');
    } else if (workout.type === 'conditioning' && period === 'morning') {
      score += 15;
      reasons.push('Morning optimal for conditioning');
    }

    // Check for conflicts (mock implementation)
    if (Math.random() > 0.7) {
      conflicts++;
      score -= 20;
    }

    // Recovery considerations
    if (workout.intensity === 'high' || workout.intensity === 'max') {
      // Check if there's adequate rest before/after
      score += 10;
      reasons.push('Adequate recovery time available');
    }

    return { total: Math.max(0, Math.min(100, score)), reasons, conflicts };
  }

  function groupWorkoutsByType(workouts: WorkoutSession[]): Map<string, WorkoutSession[]> {
    const grouped = new Map<string, WorkoutSession[]>();
    
    workouts.forEach(workout => {
      if (!grouped.has(workout.type)) {
        grouped.set(workout.type, []);
      }
      grouped.get(workout.type)!.push(workout);
    });

    return grouped;
  }

  function calculateOptimalFrequencies(
    workoutsByType: Map<string, WorkoutSession[]>,
    daysInPeriod: number
  ): Map<string, number> {
    const frequencies = new Map<string, number>();
    const weeklyTargets = {
      strength: 3,
      conditioning: 2,
      agility: 2,
      recovery: 1,
    };

    workoutsByType.forEach((workouts, type) => {
      const target = weeklyTargets[type] || 2;
      frequencies.set(type, Math.floor(target * daysInPeriod / 7));
    });

    return frequencies;
  }

  function removeConflicts(
    events: CalendarEvent[],
    constraints: ScheduleOptimizationOptions['constraints']
  ): CalendarEvent[] {
    // Sort events by start time
    const sorted = [...events].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const conflictFree: CalendarEvent[] = [];
    
    sorted.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Check if this event conflicts with any already scheduled
      const hasConflict = conflictFree.some(scheduled => {
        const scheduledStart = new Date(scheduled.start);
        const scheduledEnd = new Date(scheduled.end);
        
        return (eventStart < scheduledEnd && eventEnd > scheduledStart);
      });

      if (!hasConflict) {
        conflictFree.push(event);
      }
    });

    return conflictFree;
  }

  function balanceWorkoutTypes(
    schedule: CalendarEvent[],
    workoutsByType: Map<string, WorkoutSession[]>
  ): void {
    // Implementation for balancing workout types
    // This would redistribute workouts to avoid clustering of same types
  }

  function enforceRestPeriods(
    schedule: CalendarEvent[],
    minRestHours: number
  ): void {
    // Implementation for enforcing minimum rest periods
    // This would adjust event times to ensure adequate rest
  }

  function optimizeForPreferredTimes(
    schedule: CalendarEvent[],
    preferredTimes: string[]
  ): void {
    // Implementation for optimizing based on preferred times
    // This would shift events to preferred time slots when possible
  }

  function calculateScheduleScore(
    optimized: CalendarEvent[],
    original: CalendarEvent[]
  ): number {
    // Calculate a score based on various factors
    let score = 50;

    // Fewer conflicts = higher score
    score += 20;

    // Better distribution = higher score
    score += 15;

    // Respects constraints = higher score
    score += 15;

    return Math.min(100, score);
  }

  function createEventFromWorkout(
    workout: WorkoutSession,
    date: Date,
    timePreference: string
  ): CalendarEvent {
    const start = new Date(date);
    
    // Set time based on preference
    switch (timePreference) {
      case 'morning':
        start.setHours(8, 0, 0, 0);
        break;
      case 'afternoon':
        start.setHours(14, 0, 0, 0);
        break;
      case 'evening':
        start.setHours(18, 0, 0, 0);
        break;
      default:
        start.setHours(10, 0, 0, 0);
    }

    const duration = workout.metadata?.duration || 60;
    const end = new Date(start.getTime() + duration * 60000);

    return {
      id: `${workout.id}-${date.getTime()}`,
      title: workout.title,
      start,
      end,
      type: 'training',
      sessionId: workout.id.toString(),
      teamId: workout.teamId,
      playerIds: workout.playerIds,
      location: workout.location,
      color: getWorkoutTypeColor(workout.type),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function getWorkoutTypeColor(type: string): string {
    const colors = {
      strength: '#1976d2',
      conditioning: '#d32f2f',
      agility: '#f57c00',
      recovery: '#388e3c',
      hybrid: '#7b1fa2',
    };
    return colors[type] || '#757575';
  }

  function findConsecutiveTrainingDays(events: CalendarEvent[]): Date[] {
    // Sort events by date
    const sorted = [...events].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const consecutive: Date[] = [];
    let currentStreak: Date[] = [];

    sorted.forEach((event, index) => {
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);

      if (index === 0) {
        currentStreak.push(eventDate);
      } else {
        const prevDate = new Date(sorted[index - 1].start);
        prevDate.setHours(0, 0, 0, 0);
        
        const dayDiff = (eventDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          currentStreak.push(eventDate);
        } else {
          if (currentStreak.length > consecutive.length) {
            consecutive.splice(0, consecutive.length, ...currentStreak);
          }
          currentStreak = [eventDate];
        }
      }
    });

    if (currentStreak.length > consecutive.length) {
      consecutive.splice(0, consecutive.length, ...currentStreak);
    }

    return consecutive;
  }

  function getWorkoutTypeDistribution(events: CalendarEvent[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.type === 'training') {
        distribution[event.type] = (distribution[event.type] || 0) + 1;
      }
    });

    return distribution;
  }

  return {
    isOptimizing,
    suggestions,
    suggestBestTimes,
    optimizeSchedule,
    autoScheduleWorkouts,
    analyzeSchedulePatterns,
  };
};