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
import { CachedEventRepository } from '../repositories/CachedEventRepository';
import { RedisCacheManager, CacheKeyBuilder } from '@hockey-hub/shared-lib';

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

export class CachedEventService {
  private notificationService: CalendarNotificationService;
  private eventRepository: CachedEventRepository;
  private cacheManager: RedisCacheManager;

  constructor() {
    this.notificationService = new CalendarNotificationService();
    this.eventRepository = new CachedEventRepository();
    this.cacheManager = RedisCacheManager.getInstance();
  }

  async createEvent(data: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...data,
      status: EventStatus.SCHEDULED,
      visibility: data.visibility || EventVisibility.TEAM,
    });

    const savedEvent = await this.eventRepository.save(event);

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
    const updatedEvent = await this.eventRepository.save(event);

    // Send event updated notifications if there are significant changes
    if (changes.length > 0 && event.participants && event.participants.length > 0) {
      try {
        await this.notificationService.notifyEventUpdated(updatedEvent, event.participants, changes);
      } catch (error) {
        console.error('Failed to send event updated notifications:', error);
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
    await this.eventRepository.save(event);

    // Send event cancelled notifications
    if (event.participants && event.participants.length > 0) {
      try {
        await this.notificationService.notifyEventCancelled(event, event.participants);
      } catch (error) {
        console.error('Failed to send event cancelled notifications:', error);
      }
    }
  }

  async getEventById(id: string): Promise<Event> {
    const cacheKey = CacheKeyBuilder.build('event', id);
    
    const cachedEvent = await this.cacheManager.get<Event>(cacheKey);
    if (cachedEvent) {
      return cachedEvent;
    }

    const event = await this.eventRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['participants', 'resourceBookings', 'recurrenceRule'],
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Cache individual event for 5 minutes
    await this.cacheManager.set(cacheKey, event, 300, [`event:${id}`]);

    return event;
  }

  async getEvents(filters: EventFilters, page = 1, limit = 20) {
    // Use cached repository for organization/team based queries
    if (filters.organizationId && !filters.teamId && !filters.search && !filters.participantId) {
      const [events, total] = await this.eventRepository.findEventsByOrganization(
        filters.organizationId, 
        page, 
        limit
      );
      
      // Apply additional filters if needed
      let filteredEvents = events;
      if (filters.type) {
        filteredEvents = filteredEvents.filter(e => e.type === filters.type);
      }
      if (filters.status) {
        filteredEvents = filteredEvents.filter(e => e.status === filters.status);
      }
      if (filters.startDate && filters.endDate) {
        filteredEvents = filteredEvents.filter(e => 
          e.startTime && e.startTime >= filters.startDate! && e.startTime <= filters.endDate!
        );
      }

      return {
        data: filteredEvents,
        pagination: {
          page,
          limit,
          total: filteredEvents.length,
          totalPages: Math.ceil(filteredEvents.length / limit),
        },
      };
    }

    if (filters.teamId && !filters.search && !filters.participantId) {
      const [events, total] = await this.eventRepository.findEventsByTeam(
        filters.teamId, 
        page, 
        limit
      );
      
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

    // Fallback to original query for complex filters
    const query = this.eventRepository.createQueryBuilder('event')
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

  async getUpcomingEvents(userId: string, organizationId: string, days = 7): Promise<Event[]> {
    return this.eventRepository.findUpcomingEventsByUser(userId, organizationId, days);
  }

  async getEventsByDateRange(organizationId: string, startDate: Date, endDate: Date): Promise<Event[]> {
    return this.eventRepository.findEventsByDateRange(organizationId, startDate, endDate);
  }

  async checkConflicts(
    startTime: Date, 
    endTime: Date, 
    participantIds: string[],
    excludeEventId?: string
  ): Promise<Event[]> {
    return this.eventRepository.findConflictingEvents(startTime, endTime, participantIds, excludeEventId);
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

    const savedParticipant = await participantRepository().save(participant);
    
    // Invalidate event cache
    await this.cacheManager.delete(CacheKeyBuilder.build('event', eventId));
    
    return savedParticipant;
  }

  async addParticipants(eventId: string, participants: CreateEventDto['participants']): Promise<EventParticipant[]> {
    const event = await this.getEventById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    const newParticipants = participants!.map(p => 
      participantRepository().create({
        eventId,
        participantId: p.userId,
        participantType: p.type || ParticipantType.USER,
        role: p.role || ParticipantRole.REQUIRED,
        status: ParticipantStatus.PENDING,
      })
    );

    const savedParticipants = await participantRepository().save(newParticipants);
    
    // Invalidate event cache
    await this.cacheManager.delete(CacheKeyBuilder.build('event', eventId));
    
    return savedParticipants;
  }

  async removeParticipant(eventId: string, participantId: string): Promise<void> {
    await participantRepository().delete({ eventId, participantId });
    
    // Invalidate event cache
    await this.cacheManager.delete(CacheKeyBuilder.build('event', eventId));
  }

  // Recurring events methods (simplified for brevity - would implement caching as needed)
  async createRecurringEvent(data: CreateEventDto): Promise<Event> {
    if (!data.recurrence) {
      throw new Error('Recurrence data is required');
    }

    const errors = RecurringEventProcessor.validateRecurrenceRule(data.recurrence);
    if (errors.length > 0) {
      throw new Error(`Invalid recurrence rule: ${errors.join(', ')}`);
    }

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
      description: this.generateRecurrenceDescription(data.recurrence),
    });

    const savedRule = await AppDataSource.getRepository(RecurrenceRule).save(recurrenceRule);

    const parentEvent = await this.createEvent({
      ...data,
      recurrence: undefined,
    });

    parentEvent.recurrenceRuleId = savedRule.id;
    parentEvent.isRecurring = true;
    parentEvent.seriesId = parentEvent.id;
    
    await this.eventRepository.save(parentEvent);

    return this.getEventById(parentEvent.id);
  }

  async getRecurringEventInstances(
    eventId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Partial<Event>[]> {
    const cacheKey = CacheKeyBuilder.build('event', 'instances', eventId, {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });

    const cachedInstances = await this.cacheManager.get<Partial<Event>[]>(cacheKey);
    if (cachedInstances) {
      return cachedInstances;
    }

    const event = await this.getEventById(eventId);
    
    if (!event.isRecurring || !event.recurrenceRule) {
      return [event];
    }

    const instances = await RecurringEventProcessor.generateRecurringEvents(
      event,
      event.recurrenceRule,
      startDate,
      endDate
    );

    const existingExceptions = await this.eventRepository.find({
      where: {
        parentEventId: eventId,
        deletedAt: IsNull(),
      },
    });

    const exceptionDates = existingExceptions.map(e => 
      e.recurrenceExceptionDate ? new Date(e.recurrenceExceptionDate) : null
    ).filter(Boolean);

    const filteredInstances = instances.filter(instance => {
      return !exceptionDates.some(exDate => 
        this.isSameDay(new Date(instance.startDate!), exDate!)
      );
    });

    // Cache instances for 5 minutes
    await this.cacheManager.set(cacheKey, filteredInstances, 300, [`event:${eventId}`, 'event:instances']);

    return filteredInstances;
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