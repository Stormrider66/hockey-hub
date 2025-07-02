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
  type: 'physical' | 'ice' | 'video' | 'recovery';
  metadata?: {
    exercises?: any[];
    intensity?: string;
    focus?: string;
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

    if (existingEvent) {
      // Update existing event
      return await this.eventService.updateEvent(existingEvent.id, {
        title: session.title,
        description: session.description,
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime),
        location: session.location,
        teamId: session.teamId,
        metadata: {
          ...existingEvent.metadata,
          workoutId: session.id,
          trainingType: session.type,
          ...session.metadata,
        },
        updatedBy: session.trainerId,
      });
    } else {
      // Create new event
      return await this.eventService.createEvent({
        title: session.title,
        description: session.description,
        type: this.mapTrainingTypeToEventType(session.type),
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime),
        location: session.location,
        organizationId,
        teamId: session.teamId,
        createdBy: session.trainerId,
        visibility: EventVisibility.TEAM,
        participants: session.participants.map(userId => ({
          userId,
          role: 'required' as const,
        })),
        metadata: {
          workoutId: session.id,
          trainingType: session.type,
          ...session.metadata,
        },
        sendReminders: true,
        reminderMinutes: [60, 15], // 1 hour and 15 minutes before
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
    let currentDate = new Date(startDate);
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
        return EventType.TRAINING;
      default:
        return EventType.OTHER;
    }
  }
}