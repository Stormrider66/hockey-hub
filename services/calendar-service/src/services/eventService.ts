// @ts-nocheck - Complex event service needs refactoring
import { AppDataSource } from '../config/database';
import { 
  Event, 
  EventType, 
  EventStatus, 
  EventVisibility,
  EventParticipant,
  ParticipantStatus,
  ParticipantType,
  ParticipantRole,
  RecurrenceRule
} from '../entities';
import { Between, In, IsNull, Not, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { RecurringEventProcessor } from './recurringEventProcessor';
import { CalendarNotificationService } from './CalendarNotificationService';

const eventRepository = () => AppDataSource.getRepository(Event);
const participantRepository = () => AppDataSource.getRepository(EventParticipant);

export interface CreateEventDto {
  title: string;
  description?: string;
  type: EventType;
  startTime: Date;
  endTime: Date;
  location?: string;
  onlineUrl?: string;
  organizationId: string;
  teamId?: string;
  createdBy: string;
  visibility?: EventVisibility;
  participants?: {
    userId: string;
    role?: ParticipantRole;
    type?: ParticipantType;
  }[];
  metadata?: Record<string, any>;
  maxParticipants?: number;
  sendReminders?: boolean;
  reminderMinutes?: number[];
  recurrence?: CreateRecurrenceDto;
}

export interface CreateRecurrenceDto {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  endDate?: Date;
  count?: number;
  weekDays?: number[];
  monthDays?: number[];
  months?: number[];
  exceptionDates?: string[];
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  type?: EventType;
  status?: EventStatus;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  onlineUrl?: string;
  visibility?: EventVisibility;
  metadata?: Record<string, any>;
  updatedBy: string;
}

export interface EventFilters {
  organizationId?: string;
  teamId?: string;
  type?: EventType;
  status?: EventStatus;
  startDate?: Date;
  endDate?: Date;
  participantId?: string;
  createdBy?: string;
  search?: string;
}

export class EventService {
  private notificationService: CalendarNotificationService;

  constructor() {
    this.notificationService = new CalendarNotificationService();
  }

  async createEvent(data: CreateEventDto): Promise<Event> {
    const event = eventRepository().create({
      ...data,
      status: EventStatus.SCHEDULED,
      visibility: data.visibility || EventVisibility.TEAM,
    });

    const savedEvent = await eventRepository().save(event);

    let savedParticipants: EventParticipant[] = [];
    if (data.participants && data.participants.length > 0) {
      const participants = data.participants.map(p => 
        participantRepository().create({
          eventId: savedEvent.id,
          participantId: p.userId,
          participantType: p.type || ParticipantType.USER,
          role: p.role || ParticipantRole.REQUIRED,
          status: p.userId === data.createdBy ? ParticipantStatus.ACCEPTED : ParticipantStatus.PENDING,
          isOrganizer: p.userId === data.createdBy,
        })
      );

      savedParticipants = await participantRepository().save(participants);
    }

    // Send event created notifications
    if (savedParticipants.length > 0) {
      try {
        await this.notificationService.notifyEventCreated(savedEvent, savedParticipants);
      } catch (error) {
        console.error('Failed to send event created notifications:', error);
        // Don't fail the entire operation if notifications fail
      }
    }

    return this.getEventById(savedEvent.id);
  }

  async updateEvent(id: string, data: UpdateEventDto): Promise<Event> {
    const event = await this.getEventById(id);
    
    if (!event) {
      throw new Error('Event not found');
    }

    // Track changes for notifications
    const changes: string[] = [];
    if (data.title && data.title !== event.title) changes.push('title');
    if (data.startTime && data.startTime.getTime() !== event.startTime?.getTime()) changes.push('start_time');
    if (data.endTime && data.endTime.getTime() !== event.endTime?.getTime()) changes.push('end_time');
    if (data.location && data.location !== event.location) changes.push('location');
    if (data.description && data.description !== event.description) changes.push('description');

    Object.assign(event, data);
    const updatedEvent = await eventRepository().save(event);

    // Send event updated notifications if there are significant changes
    if (changes.length > 0 && event.participants && event.participants.length > 0) {
      try {
        await this.notificationService.notifyEventUpdated(updatedEvent, event.participants, changes);
      } catch (error) {
        console.error('Failed to send event updated notifications:', error);
        // Don't fail the entire operation if notifications fail
      }
    }

    return this.getEventById(id);
  }

  async deleteEvent(id: string): Promise<void> {
    const event = await this.getEventById(id);
    
    if (!event) {
      throw new Error('Event not found');
    }

    event.deletedAt = new Date();
    event.status = EventStatus.CANCELLED;
    await eventRepository().save(event);

    // Send event cancelled notifications
    if (event.participants && event.participants.length > 0) {
      try {
        await this.notificationService.notifyEventCancelled(event, event.participants);
      } catch (error) {
        console.error('Failed to send event cancelled notifications:', error);
        // Don't fail the entire operation if notifications fail
      }
    }
  }

  async getEventById(id: string): Promise<Event> {
    const event = await eventRepository().findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['participants', 'resourceBookings', 'recurrenceRule'],
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  async getEvents(filters: EventFilters, page = 1, limit = 20) {
    const query = eventRepository().createQueryBuilder('event')
      .leftJoinAndSelect('event.participants', 'participants')
      .where('event.deletedAt IS NULL');

    if (filters.organizationId) {
      query.andWhere('event.organizationId = :organizationId', { organizationId: filters.organizationId });
    }

    if (filters.teamId) {
      query.andWhere('event.teamId = :teamId', { teamId: filters.teamId });
    }

    if (filters.type) {
      query.andWhere('event.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query.andWhere('event.status = :status', { status: filters.status });
    }

    if (filters.createdBy) {
      query.andWhere('event.createdBy = :createdBy', { createdBy: filters.createdBy });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('event.startTime BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.participantId) {
      query.andWhere('participants.participantId = :participantId', { participantId: filters.participantId });
    }

    if (filters.search) {
      query.andWhere('(event.title ILIKE :search OR event.description ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [events, total] = await query
      .orderBy('event.startTime', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUpcomingEvents(userId: string, organizationId: string, days = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const events = await eventRepository().createQueryBuilder('event')
      .leftJoinAndSelect('event.participants', 'participants')
      .where('event.deletedAt IS NULL')
      .andWhere('event.organizationId = :organizationId', { organizationId })
      .andWhere('event.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('(event.visibility = :public OR participants.participantId = :userId)', {
        public: EventVisibility.PUBLIC,
        userId,
      })
      .andWhere('event.status != :cancelled', { cancelled: EventStatus.CANCELLED })
      .orderBy('event.startTime', 'ASC')
      .getMany();

    return events;
  }

  async updateParticipantStatus(
    eventId: string, 
    participantId: string, 
    status: ParticipantStatus,
    responseMessage?: string
  ): Promise<EventParticipant> {
    const participant = await participantRepository().findOne({
      where: { eventId, participantId },
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    participant.status = status;
    participant.respondedAt = new Date();
    if (responseMessage) {
      participant.responseMessage = responseMessage;
    }

    return await participantRepository().save(participant);
  }

  async addParticipants(eventId: string, participants: CreateEventDto['participants']) {
    const event = await this.getEventById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    const newParticipants = participants.map(p => 
      participantRepository().create({
        eventId,
        participantId: p.userId,
        participantType: p.type || ParticipantType.USER,
        role: p.role || ParticipantRole.REQUIRED,
        status: ParticipantStatus.PENDING,
      })
    );

    return await participantRepository().save(newParticipants);
  }

  async removeParticipant(eventId: string, participantId: string): Promise<void> {
    await participantRepository().delete({ eventId, participantId });
  }

  async getEventsByDateRange(organizationId: string, startDate: Date, endDate: Date) {
    return await eventRepository().find({
      where: {
        organizationId,
        startTime: Between(startDate, endDate),
        deletedAt: IsNull(),
      },
      relations: ['participants'],
      order: { startTime: 'ASC' },
    });
  }

  async checkConflicts(
    startTime: Date, 
    endTime: Date, 
    participantIds: string[],
    excludeEventId?: string
  ) {
    const query = eventRepository().createQueryBuilder('event')
      .leftJoin('event.participants', 'participants')
      .where('event.deletedAt IS NULL')
      .andWhere('event.status != :cancelled', { cancelled: EventStatus.CANCELLED })
      .andWhere('participants.participantId IN (:...participantIds)', { participantIds })
      .andWhere('participants.status IN (:...statuses)', { 
        statuses: [ParticipantStatus.ACCEPTED, ParticipantStatus.TENTATIVE] 
      })
      .andWhere(
        '(event.startTime < :endTime AND event.endTime > :startTime)',
        { startTime, endTime }
      );

    if (excludeEventId) {
      query.andWhere('event.id != :excludeEventId', { excludeEventId });
    }

    return await query.getMany();
  }

  async createRecurringEvent(data: CreateEventDto): Promise<Event> {
    if (!data.recurrence) {
      throw new Error('Recurrence data is required');
    }

    // Validate recurrence rule
    const errors = RecurringEventProcessor.validateRecurrenceRule(data.recurrence);
    if (errors.length > 0) {
      throw new Error(`Invalid recurrence rule: ${errors.join(', ')}`);
    }

    // Create recurrence rule
    const recurrenceRule = AppDataSource.getRepository(RecurrenceRule).create({
      frequency: data.recurrence.frequency,
      interval: data.recurrence.interval || 1,
      startDate: data.startTime,
      endDate: data.recurrence.endDate,
      count: data.recurrence.count,
      weekDays: data.recurrence.weekDays,
      monthDays: data.recurrence.monthDays,
      months: data.recurrence.months,
      exceptionDates: data.recurrence.exceptionDates,
      // Generate human-readable description
      description: this.generateRecurrenceDescription(data.recurrence),
    });

    const savedRule = await AppDataSource.getRepository(RecurrenceRule).save(recurrenceRule);

    // Create the parent event
    const parentEvent = await this.createEvent({
      ...data,
      recurrence: undefined, // Remove recurrence from regular create
    });

    // Update parent event with recurrence info
    parentEvent.recurrenceRuleId = savedRule.id;
    parentEvent.isRecurring = true;
    parentEvent.seriesId = parentEvent.id; // Parent is its own series ID
    
    await eventRepository().save(parentEvent);

    return this.getEventById(parentEvent.id);
  }

  async getRecurringEventInstances(
    eventId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Partial<Event>[]> {
    const event = await this.getEventById(eventId);
    
    if (!event.isRecurring || !event.recurrenceRule) {
      return [event];
    }

    // Generate instances for the date range
    const instances = await RecurringEventProcessor.generateRecurringEvents(
      event,
      event.recurrenceRule,
      startDate,
      endDate
    );

    // Filter out any instances that have been modified (exceptions)
    const existingExceptions = await eventRepository().find({
      where: {
        parentEventId: eventId,
        deletedAt: IsNull(),
      },
    });

    const exceptionDates = existingExceptions.map(e => 
      e.recurrenceExceptionDate ? new Date(e.recurrenceExceptionDate) : null
    ).filter(Boolean);

    return instances.filter(instance => {
      return !exceptionDates.some(exDate => 
        this.isSameDay(new Date(instance.startDate!), exDate!)
      );
    });
  }

  async updateRecurringEventInstance(
    eventId: string,
    instanceDate: Date,
    updates: UpdateEventDto,
    updateType: 'single' | 'future' | 'all' = 'single'
  ): Promise<Event | Event[]> {
    const event = await this.getEventById(eventId);
    
    if (!event.isRecurring) {
      throw new Error('Event is not recurring');
    }

    switch (updateType) {
      case 'single': {
        const exceptionEvent = await RecurringEventProcessor.updateRecurringInstance(
          event,
          instanceDate,
          updates
        );
        const savedException = await eventRepository().save(exceptionEvent as Event);
        if (event.recurrenceRule) {
          event.recurrenceRule.exceptionDates = event.recurrenceRule.exceptionDates || [];
          event.recurrenceRule.exceptionDates.push(instanceDate.toISOString());
          await AppDataSource.getRepository(RecurrenceRule).save(event.recurrenceRule);
        }
        return savedException;
      }
      case 'future': {
        const { originalRule, newEvent } = await RecurringEventProcessor.updateFutureInstances(
          event,
          instanceDate,
          updates,
          event.recurrenceRule ? { ...event.recurrenceRule } : undefined
        );
        if (event.recurrenceRule) {
          Object.assign(event.recurrenceRule, originalRule);
          await AppDataSource.getRepository(RecurrenceRule).save(event.recurrenceRule);
        }
        const futureEvent = await this.createEvent({
          ...(newEvent as CreateEventDto),
          recurrence: newEvent.recurrenceRule ? {
            frequency: newEvent.recurrenceRule.frequency,
            interval: newEvent.recurrenceRule.interval,
            endDate: newEvent.recurrenceRule.endDate,
            weekDays: newEvent.recurrenceRule.weekDays,
            monthDays: newEvent.recurrenceRule.monthDays,
            months: newEvent.recurrenceRule.months,
          } : undefined,
        });
        return [event, futureEvent];
      }
      case 'all': {
        await this.updateEvent(eventId, updates);
        return this.getEventById(eventId);
      }
      default: {
        throw new Error('Invalid update type');
      }
    }
  }

  async deleteRecurringEventInstance(
    eventId: string,
    instanceDate: Date,
    deleteType: 'single' | 'future' | 'all' = 'single'
  ): Promise<void> {
    const event = await this.getEventById(eventId);
    
    if (!event.isRecurring) {
      throw new Error('Event is not recurring');
    }

    switch (deleteType) {
      case 'single': {
        const exceptionDates = await RecurringEventProcessor.deleteRecurringInstance(
          event,
          instanceDate
        );
        if (event.recurrenceRule) {
          event.recurrenceRule.exceptionDates = exceptionDates;
          await AppDataSource.getRepository(RecurrenceRule).save(event.recurrenceRule);
        }
        break;
      }
      case 'future': {
        const ruleUpdate = await RecurringEventProcessor.deleteFutureInstances(
          event,
          instanceDate
        );
        if (event.recurrenceRule) {
          Object.assign(event.recurrenceRule, ruleUpdate);
          await AppDataSource.getRepository(RecurrenceRule).save(event.recurrenceRule);
        }
        break;
      }
      case 'all': {
        await this.deleteEvent(eventId);
        const exceptions = await eventRepository().find({
          where: {
            parentEventId: eventId,
            deletedAt: IsNull(),
          },
        });
        for (const exception of exceptions) {
          await this.deleteEvent(exception.id);
        }
        break;
      }
      default: {
        throw new Error('Invalid delete type');
      }
    }
  }

  private generateRecurrenceDescription(recurrence: CreateRecurrenceDto): string {
    let description = `Repeats ${recurrence.frequency}`;
    
    if (recurrence.interval && recurrence.interval > 1) {
      description += ` every ${recurrence.interval} ${recurrence.frequency}s`;
    }
    
    if (recurrence.weekDays && recurrence.weekDays.length > 0) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const selectedDays = recurrence.weekDays.map(d => days[d]).join(', ');
      description += ` on ${selectedDays}`;
    }
    
    if (recurrence.endDate) {
      description += ` until ${new Date(recurrence.endDate).toLocaleDateString()}`;
    } else if (recurrence.count) {
      description += ` for ${recurrence.count} occurrences`;
    }
    
    return description;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}