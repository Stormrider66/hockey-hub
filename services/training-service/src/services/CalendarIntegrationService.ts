import { WorkoutSession } from '../entities/WorkoutSession';
import { WorkoutType } from '../entities/WorkoutType';

export interface CalendarEventPayload {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  trainerId: string;
  participants: string[];
  teamId?: string;
  type: string;
  workoutType?: string;
  estimatedDuration?: number;
  metadata?: {
    exercises?: any[];
    intervalProgram?: any;
    hybridProgram?: any;
    agilityProgram?: any;
    intensity?: string;
    focus?: string;
    equipment?: string[];
    targetMetrics?: {
      heartRateZone?: string;
      powerTarget?: number;
      expectedCalories?: number;
    };
    preview?: {
      exerciseCount?: number;
      intervalCount?: number;
      blockCount?: number;
      drillCount?: number;
      mainEquipment?: string;
      estimatedLoad?: 'low' | 'medium' | 'high' | 'max';
    };
  };
}

export class CalendarIntegrationService {
  private calendarServiceUrl: string;

  constructor() {
    this.calendarServiceUrl = process.env.CALENDAR_SERVICE_URL || 'http://localhost:3003';
  }

  /**
   * Creates a calendar event for a workout session
   */
  async createWorkoutEvent(
    workout: WorkoutSession,
    organizationId: string,
    userId: string
  ): Promise<void> {
    try {
      const eventPayload = this.convertWorkoutToCalendarEvent(workout, userId);
      
      const response = await fetch(`${this.calendarServiceUrl}/training-integration/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getServiceToken()}`,
        },
        body: JSON.stringify({
          session: eventPayload,
          organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to create calendar event:', response.status, errorData);
        throw new Error(`Calendar integration failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Calendar event created successfully:', result.data?.id);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      // Don't throw - calendar integration failure shouldn't block workout creation
    }
  }

  /**
   * Updates a calendar event when a workout is modified
   */
  async updateWorkoutEvent(
    workout: WorkoutSession,
    organizationId: string,
    userId: string
  ): Promise<void> {
    try {
      const eventPayload = this.convertWorkoutToCalendarEvent(workout, userId);
      
      const response = await fetch(`${this.calendarServiceUrl}/training-integration/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getServiceToken()}`,
        },
        body: JSON.stringify({
          session: eventPayload,
          organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to update calendar event:', response.status, errorData);
        throw new Error(`Calendar integration failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Calendar event updated successfully:', result.data?.id);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      // Don't throw - calendar integration failure shouldn't block workout updates
    }
  }

  /**
   * Removes a calendar event when a workout is deleted
   */
  async deleteWorkoutEvent(workoutId: string): Promise<void> {
    try {
      const response = await fetch(`${this.calendarServiceUrl}/training-integration/session/${workoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getServiceToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to delete calendar event:', response.status, errorData);
        throw new Error(`Calendar integration failed: ${response.statusText}`);
      }

      console.log('Calendar event deleted successfully');
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      // Don't throw - calendar integration failure shouldn't block workout deletion
    }
  }

  /**
   * Converts a WorkoutSession to calendar event payload
   */
  private convertWorkoutToCalendarEvent(
    workout: WorkoutSession,
    userId: string
  ): CalendarEventPayload {
    // Calculate end time based on estimated duration
    const startTime = workout.scheduledDate;
    const endTime = new Date(startTime.getTime() + workout.estimatedDuration * 60 * 1000);

    // Generate preview data based on workout type
    const preview = this.generateWorkoutPreview(workout);

    return {
      id: workout.id,
      title: workout.title,
      description: workout.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: workout.location,
      trainerId: userId,
      participants: workout.playerIds,
      teamId: workout.teamId,
      type: this.mapWorkoutTypeToTrainingType(workout.type),
      workoutType: workout.type,
      estimatedDuration: workout.estimatedDuration,
      metadata: {
        exercises: workout.exercises,
        intervalProgram: workout.intervalProgram,
        // Add other program types when they're added to WorkoutSession entity
        intensity: this.calculateIntensity(workout),
        focus: this.determineFocus(workout),
        equipment: this.extractEquipment(workout),
        preview,
      },
    };
  }

  /**
   * Generate workout preview data for calendar display
   */
  private generateWorkoutPreview(workout: WorkoutSession): any {
    switch (workout.type) {
      case WorkoutType.CARDIO:
        return {
          intervalCount: workout.intervalProgram?.intervals?.length || 0,
          mainEquipment: workout.intervalProgram?.equipment || 'Cardio Equipment',
          estimatedLoad: this.calculateLoadFromIntervals(workout.intervalProgram),
        };
      case WorkoutType.STRENGTH:
        return {
          exerciseCount: workout.exercises?.length || 0,
          mainEquipment: 'Weight Room',
          estimatedLoad: this.calculateLoadFromExercises(workout.exercises),
        };
      case WorkoutType.MIXED:
        return {
          exerciseCount: workout.exercises?.length || 0,
          intervalCount: workout.intervalProgram?.intervals?.length || 0,
          mainEquipment: 'Mixed Equipment',
          estimatedLoad: 'medium',
        };
      default:
        return {
          exerciseCount: workout.exercises?.length || 0,
          mainEquipment: 'Various',
          estimatedLoad: 'medium',
        };
    }
  }

  /**
   * Map WorkoutType to training type string
   */
  private mapWorkoutTypeToTrainingType(workoutType: WorkoutType): string {
    switch (workoutType) {
      case WorkoutType.STRENGTH:
        return 'strength';
      case WorkoutType.CARDIO:
        return 'conditioning';
      case WorkoutType.SKILL:
        return 'agility';
      case WorkoutType.RECOVERY:
        return 'recovery';
      case WorkoutType.MIXED:
        return 'hybrid';
      default:
        return 'physical';
    }
  }

  /**
   * Calculate workout intensity based on content
   */
  private calculateIntensity(workout: WorkoutSession): string {
    // Basic intensity calculation - can be enhanced with more sophisticated logic
    if (workout.intervalProgram) {
      const highIntensityIntervals = workout.intervalProgram.intervals?.filter(
        (interval: any) => interval.type === 'work' && interval.targetMetrics?.heartRate?.value > 85
      ).length || 0;
      
      if (highIntensityIntervals > 3) return 'high';
      if (highIntensityIntervals > 0) return 'medium';
    }

    if (workout.exercises && workout.exercises.length > 8) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Determine workout focus
   */
  private determineFocus(workout: WorkoutSession): string {
    switch (workout.type) {
      case WorkoutType.STRENGTH:
        return 'Strength & Power';
      case WorkoutType.CARDIO:
        return 'Cardiovascular Fitness';
      case WorkoutType.SKILL:
        return 'Speed & Agility';
      case WorkoutType.RECOVERY:
        return 'Recovery & Mobility';
      case WorkoutType.MIXED:
        return 'Combined Training';
      default:
        return 'Physical Training';
    }
  }

  /**
   * Extract equipment list from workout
   */
  private extractEquipment(workout: WorkoutSession): string[] {
    const equipment: string[] = [];

    if (workout.intervalProgram?.equipment) {
      equipment.push(workout.intervalProgram.equipment);
    }

    // Extract equipment from exercises
    workout.exercises?.forEach(exercise => {
      if (exercise.equipment) {
        equipment.push(...exercise.equipment);
      }
    });

    return [...new Set(equipment)]; // Remove duplicates
  }

  /**
   * Calculate load from interval program
   */
  private calculateLoadFromIntervals(intervalProgram: any): string {
    if (!intervalProgram?.intervals) return 'medium';

    const workIntervals = intervalProgram.intervals.filter((i: any) => i.type === 'work');
    const avgIntensity = workIntervals.reduce((acc: number, interval: any) => {
      return acc + (interval.targetMetrics?.heartRate?.value || 70);
    }, 0) / workIntervals.length;

    if (avgIntensity > 90) return 'max';
    if (avgIntensity > 80) return 'high';
    if (avgIntensity > 70) return 'medium';
    return 'low';
  }

  /**
   * Calculate load from exercises
   */
  private calculateLoadFromExercises(exercises: any[]): string {
    if (!exercises || exercises.length === 0) return 'medium';

    // Simple heuristic based on exercise count and sets
    const totalSets = exercises.reduce((acc, exercise) => acc + (exercise.sets || 1), 0);
    
    if (totalSets > 25) return 'high';
    if (totalSets > 15) return 'medium';
    return 'low';
  }

  /**
   * Get service-to-service authentication token
   */
  private getServiceToken(): string {
    // In production, this would use proper service-to-service authentication
    // For now, use environment variable or return a service token
    return process.env.SERVICE_AUTH_TOKEN || 'service-token';
  }
}