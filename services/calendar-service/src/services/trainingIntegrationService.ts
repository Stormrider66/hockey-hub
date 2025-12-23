// @ts-nocheck - Complex training integration needs refactoring
import { AppDataSource } from '../config/database';
import { Event, EventType, EventStatus, EventVisibility } from '../entities';
import { EventService } from './eventService';

export interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  trainerId: string;
  participants: string[];
  teamId?: string;
  type: 'physical' | 'ice' | 'video' | 'recovery' | 'strength' | 'conditioning' | 'hybrid' | 'agility';
  workoutType?: 'STRENGTH' | 'CARDIO' | 'SKILL' | 'RECOVERY' | 'MIXED' | 'CONDITIONING' | 'HYBRID' | 'AGILITY';
  estimatedDuration?: number; // minutes
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

export class TrainingIntegrationService {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  /**
   * Creates or updates a calendar event from a training session
   */
  async syncTrainingSession(
    session: TrainingSession,
    organizationId: string
  ): Promise<Event> {
    // Check if event already exists for this training session
    const existingEvent = await this.findEventByTrainingId(session.id);

    // Calculate end time if not provided
    const endTime = session.endTime ? 
      new Date(session.endTime) : 
      new Date(new Date(session.startTime).getTime() + (session.estimatedDuration || 60) * 60 * 1000);

    // Create enhanced metadata with workout details for player preview
    const enhancedMetadata = {
      workoutId: session.id,
      sessionId: session.id,
      trainingType: session.type,
      workoutType: session.workoutType || this.mapTypeToWorkoutType(session.type),
      estimatedDuration: session.estimatedDuration || 60,
      ...(session.metadata || {}),
      // Add workout preview data for calendar display
      workoutPreview: this.generateWorkoutPreview(session),
      // Store program data for launching correct viewer
      programData: {
        intervalProgram: session.metadata?.intervalProgram,
        hybridProgram: session.metadata?.hybridProgram,
        agilityProgram: session.metadata?.agilityProgram,
        exercises: session.metadata?.exercises,
      },
    };

    if (existingEvent) {
      // Update existing event
      return await this.eventService.updateEvent(existingEvent.id, {
        title: session.title,
        description: this.generateEnhancedDescription(session),
        startTime: new Date(session.startTime),
        endTime,
        location: session.location,
        teamId: session.teamId,
        metadata: enhancedMetadata,
        updatedBy: session.trainerId,
      });
    } else {
      // Create new event
      return await this.eventService.createEvent({
        title: session.title,
        description: this.generateEnhancedDescription(session),
        type: this.mapTrainingTypeToEventType(session.type),
        startTime: new Date(session.startTime),
        endTime,
        location: session.location,
        organizationId,
        teamId: session.teamId,
        createdBy: session.trainerId,
        visibility: EventVisibility.TEAM,
        participants: session.participants.map(userId => ({
          userId,
          role: 'required' as const,
        })),
        metadata: enhancedMetadata,
        sendReminders: true,
        reminderMinutes: [60, 15], // 1 hour and 15 minutes before
        // Add color coding based on workout type
        color: this.getWorkoutTypeColor(session.workoutType || session.type),
      });
    }
  }

  /**
   * Removes a calendar event when a training session is cancelled
   */
  async removeTrainingSession(trainingId: string): Promise<void> {
    const event = await this.findEventByTrainingId(trainingId);
    
    if (event) {
      await this.eventService.deleteEvent(event.id);
    }
  }

  /**
   * Updates participant status when they complete a workout
   */
  async markWorkoutCompleted(
    trainingId: string,
    userId: string,
    completionData?: {
      actualStartTime?: Date;
      actualEndTime?: Date;
      performance?: any;
      notes?: string;
    }
  ): Promise<void> {
    const event = await this.findEventByTrainingId(trainingId);
    
    if (!event) {
      throw new Error('No calendar event found for this training session');
    }

    // Update participant status
    const participant = event.participants?.find(p => p.participantId === userId);
    if (participant) {
      await this.eventService.updateParticipantStatus(
        event.id,
        userId,
        'accepted' as any,
        completionData?.notes
      );
    }

    // Update event metadata with completion data
    if (completionData) {
      await this.eventService.updateEvent(event.id, {
        metadata: {
          ...event.metadata,
          completions: {
            ...(event.metadata?.completions || {}),
            [userId]: {
              completedAt: new Date(),
              ...completionData,
            },
          },
        },
        updatedBy: userId,
      });
    }
  }

  /**
   * Gets all training-related events for a user
   */
  async getUserTrainingCalendar(
    userId: string,
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const events = await this.eventService.getEvents({
      organizationId,
      participantId: userId,
      startDate,
      endDate,
      type: EventType.TRAINING,
    });

    return events.data.filter(event => event.metadata?.workoutId);
  }

  /**
   * Gets training events for a specific team
   */
  async getTeamTrainingCalendar(
    teamId: string,
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const events = await this.eventService.getEvents({
      organizationId,
      teamId,
      startDate,
      endDate,
      type: EventType.TRAINING,
    });

    return events.data.filter(event => event.metadata?.workoutId);
  }

  /**
   * Creates recurring training sessions
   */
  async createRecurringTraining(
    baseSession: TrainingSession,
    organizationId: string,
    recurrencePattern: {
      frequency: 'daily' | 'weekly' | 'monthly';
      interval: number;
      daysOfWeek?: number[]; // 0-6, Sunday-Saturday
      endDate?: Date;
      count?: number;
    }
  ): Promise<Event[]> {
    const events: Event[] = [];
    const startDate = new Date(baseSession.startTime);
    const endDate = new Date(baseSession.endTime);
    const currentDate = new Date(startDate);
    let occurrences = 0;

    // Calculate end condition
    const maxDate = recurrencePattern.endDate || new Date();
    if (!recurrencePattern.endDate && !recurrencePattern.count) {
      // Default to 3 months if no end condition specified
      maxDate.setMonth(maxDate.getMonth() + 3);
    }
    const maxOccurrences = recurrencePattern.count || 100;

    while (
      currentDate <= maxDate &&
      occurrences < maxOccurrences
    ) {
      // Check if this day matches the pattern
      let shouldCreate = false;

      switch (recurrencePattern.frequency) {
        case 'daily':
          shouldCreate = true;
          break;
        case 'weekly':
          if (recurrencePattern.daysOfWeek) {
            shouldCreate = recurrencePattern.daysOfWeek.includes(currentDate.getDay());
          } else {
            shouldCreate = currentDate.getDay() === startDate.getDay();
          }
          break;
        case 'monthly':
          shouldCreate = currentDate.getDate() === startDate.getDate();
          break;
      }

      if (shouldCreate) {
        const sessionStart = new Date(currentDate);
        sessionStart.setHours(startDate.getHours(), startDate.getMinutes());
        
        const sessionEnd = new Date(currentDate);
        sessionEnd.setHours(endDate.getHours(), endDate.getMinutes());

        const event = await this.syncTrainingSession(
          {
            ...baseSession,
            id: `${baseSession.id}-${occurrences}`,
            startTime: sessionStart.toISOString(),
            endTime: sessionEnd.toISOString(),
          },
          organizationId
        );

        events.push(event);
        occurrences++;
      }

      // Increment date based on frequency
      switch (recurrencePattern.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + recurrencePattern.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (recurrencePattern.interval * 7));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + recurrencePattern.interval);
          break;
      }
    }

    return events;
  }

  private async findEventByTrainingId(trainingId: string): Promise<Event | null> {
    const repository = AppDataSource.getRepository(Event);
    return await repository
      .createQueryBuilder('event')
      .where('event.metadata ->> :key = :value', {
        key: 'workoutId',
        value: trainingId,
      })
      .andWhere('event.deletedAt IS NULL')
      .getOne();
  }

  private mapTrainingTypeToEventType(trainingType: string): EventType {
    switch (trainingType) {
      case 'physical':
      case 'ice':
      case 'video':
      case 'recovery':
      case 'strength':
      case 'conditioning':
      case 'hybrid':
      case 'agility':
        return EventType.TRAINING;
      default:
        return EventType.OTHER;
    }
  }

  private mapTypeToWorkoutType(type: string): string {
    switch (type) {
      case 'strength':
      case 'physical':
        return 'STRENGTH';
      case 'conditioning':
        return 'CONDITIONING';
      case 'hybrid':
        return 'HYBRID';
      case 'agility':
        return 'AGILITY';
      case 'recovery':
        return 'RECOVERY';
      case 'ice':
        return 'SKILL';
      default:
        return 'MIXED';
    }
  }

  private generateWorkoutPreview(session: TrainingSession): any {
    const preview = session.metadata?.preview || {};
    const type = session.workoutType || this.mapTypeToWorkoutType(session.type);

    switch (type) {
      case 'CONDITIONING':
        return {
          type: 'Conditioning',
          duration: `${session.estimatedDuration || 60} min`,
          equipment: session.metadata?.intervalProgram?.equipment || 'Various',
          intervals: session.metadata?.intervalProgram?.intervals?.length || 0,
          estimatedCalories: session.metadata?.intervalProgram?.estimatedCalories || 0,
          intensity: preview.estimatedLoad || session.metadata?.intensity || 'medium',
        };
      case 'HYBRID':
        return {
          type: 'Hybrid Training',
          duration: `${session.estimatedDuration || 60} min`,
          blocks: preview.blockCount || session.metadata?.hybridProgram?.blocks?.length || 0,
          exercises: preview.exerciseCount || 0,
          intervals: preview.intervalCount || 0,
          intensity: preview.estimatedLoad || 'medium',
        };
      case 'AGILITY':
        return {
          type: 'Agility Training',
          duration: `${session.estimatedDuration || 45} min`,
          drills: preview.drillCount || session.metadata?.agilityProgram?.drills?.length || 0,
          equipment: preview.mainEquipment || 'Cones & Ladders',
          focus: session.metadata?.focus || 'Speed & Agility',
        };
      case 'STRENGTH':
        return {
          type: 'Strength Training',
          duration: `${session.estimatedDuration || 75} min`,
          exercises: preview.exerciseCount || session.metadata?.exercises?.length || 0,
          equipment: preview.mainEquipment || 'Weight Room',
          intensity: preview.estimatedLoad || session.metadata?.intensity || 'medium',
        };
      default:
        return {
          type: 'Training Session',
          duration: `${session.estimatedDuration || 60} min`,
          focus: session.metadata?.focus || 'General Training',
        };
    }
  }

  private generateEnhancedDescription(session: TrainingSession): string {
    const preview = this.generateWorkoutPreview(session);
    let description = session.description || '';

    // Add workout-specific details to description
    switch (preview.type) {
      case 'Conditioning':
        description += `\n\n🏃‍♂️ Conditioning Workout\n`;
        description += `⏱️ Duration: ${preview.duration}\n`;
        description += `🏋️ Equipment: ${preview.equipment}\n`;
        if (preview.intervals > 0) {
          description += `🔥 Intervals: ${preview.intervals}\n`;
        }
        if (preview.estimatedCalories > 0) {
          description += `🔥 Est. Calories: ${preview.estimatedCalories}\n`;
        }
        break;
      case 'Hybrid Training':
        description += `\n\n🔀 Hybrid Workout\n`;
        description += `⏱️ Duration: ${preview.duration}\n`;
        description += `📦 Blocks: ${preview.blocks}\n`;
        if (preview.exercises > 0) {
          description += `💪 Exercises: ${preview.exercises}\n`;
        }
        if (preview.intervals > 0) {
          description += `🏃‍♂️ Intervals: ${preview.intervals}\n`;
        }
        break;
      case 'Agility Training':
        description += `\n\n⚡ Agility Workout\n`;
        description += `⏱️ Duration: ${preview.duration}\n`;
        description += `🎯 Drills: ${preview.drills}\n`;
        description += `🏋️ Equipment: ${preview.equipment}\n`;
        description += `🎯 Focus: ${preview.focus}\n`;
        break;
      case 'Strength Training':
        description += `\n\n💪 Strength Workout\n`;
        description += `⏱️ Duration: ${preview.duration}\n`;
        description += `🏋️ Exercises: ${preview.exercises}\n`;
        description += `📍 Location: ${preview.equipment}\n`;
        break;
    }

    return description;
  }

  private getWorkoutTypeColor(workoutType: string): string {
    switch (workoutType) {
      case 'STRENGTH':
      case 'strength':
        return '#3B82F6'; // Blue
      case 'CONDITIONING':
      case 'conditioning':
        return '#EF4444'; // Red
      case 'HYBRID':
      case 'hybrid':
        return '#8B5CF6'; // Purple
      case 'AGILITY':
      case 'agility':
        return '#F97316'; // Orange
      case 'RECOVERY':
      case 'recovery':
        return '#10B981'; // Green
      case 'SKILL':
      case 'ice':
        return '#06B6D4'; // Cyan
      default:
        return '#6B7280'; // Gray
    }
  }
}