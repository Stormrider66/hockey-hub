// @ts-nocheck - Repository with complex cache patterns
import { AppDataSource } from '../config/database';
import { Event } from '../entities';
import { CachedRepository, CacheKeyBuilder } from '@hockey-hub/shared-lib';

export class CachedEventRepository extends CachedRepository<Event> {
  constructor() {
    super(
      AppDataSource.getRepository(Event),
      'event'
    );
  }

  async findEventsByOrganization(organizationId: string, page = 1, limit = 20): Promise<[Event[], number]> {
    const cacheKey = CacheKeyBuilder.build('event', 'list', 'org', organizationId, { page, limit });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.createQueryBuilder('event')
          .leftJoinAndSelect('event.participants', 'participants')
          .where('event.organizationId = :organizationId', { organizationId })
          .andWhere('event.deletedAt IS NULL')
          .orderBy('event.startTime', 'ASC')
          .skip((page - 1) * limit)
          .take(limit)
          .getManyAndCount();
      },
      60, // 1 minute TTL for lists
      [`org:${organizationId}`, 'event:list']
    );
  }

  async findEventsByTeam(teamId: string, page = 1, limit = 20): Promise<[Event[], number]> {
    const cacheKey = CacheKeyBuilder.build('event', 'list', 'team', teamId, { page, limit });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.createQueryBuilder('event')
          .leftJoinAndSelect('event.participants', 'participants')
          .where('event.teamId = :teamId', { teamId })
          .andWhere('event.deletedAt IS NULL')
          .orderBy('event.startTime', 'ASC')
          .skip((page - 1) * limit)
          .take(limit)
          .getManyAndCount();
      },
      60, // 1 minute TTL for lists
      [`team:${teamId}`, 'event:list']
    );
  }

  async findUpcomingEventsByUser(
    userId: string, 
    organizationId: string, 
    days = 7
  ): Promise<Event[]> {
    const cacheKey = CacheKeyBuilder.build('event', 'upcoming', userId, organizationId, { days });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        return this.repository.createQueryBuilder('event')
          .leftJoinAndSelect('event.participants', 'participants')
          .where('event.deletedAt IS NULL')
          .andWhere('event.organizationId = :organizationId', { organizationId })
          .andWhere('event.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
          .andWhere('(event.visibility = :public OR participants.participantId = :userId)', {
            public: 'PUBLIC',
            userId,
          })
          .andWhere('event.status != :cancelled', { cancelled: 'CANCELLED' })
          .orderBy('event.startTime', 'ASC')
          .getMany();
      },
      120, // 2 minutes TTL for upcoming events
      [`user:${userId}`, `org:${organizationId}`, 'event:upcoming']
    );
  }

  async findEventsByDateRange(
    organizationId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Event[]> {
    const cacheKey = CacheKeyBuilder.build('event', 'daterange', organizationId, {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.createQueryBuilder('event')
          .leftJoinAndSelect('event.participants', 'participants')
          .where('event.organizationId = :organizationId', { organizationId })
          .andWhere('event.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
          .andWhere('event.deletedAt IS NULL')
          .orderBy('event.startTime', 'ASC')
          .getMany();
      },
      300, // 5 minutes TTL for date ranges
      [`org:${organizationId}`, 'event:daterange']
    );
  }

  async findConflictingEvents(
    startTime: Date,
    endTime: Date,
    participantIds: string[],
    excludeEventId?: string
  ): Promise<Event[]> {
    // Don't cache conflict checks as they are time-sensitive
    const query = this.repository.createQueryBuilder('event')
      .leftJoin('event.participants', 'participants')
      .where('event.deletedAt IS NULL')
      .andWhere('event.status != :cancelled', { cancelled: 'CANCELLED' })
      .andWhere('participants.participantId IN (:...participantIds)', { participantIds })
      .andWhere('participants.status IN (:...statuses)', { 
        statuses: ['ACCEPTED', 'TENTATIVE'] 
      })
      .andWhere(
        '(event.startTime < :endTime AND event.endTime > :startTime)',
        { startTime, endTime }
      );

    if (excludeEventId) {
      query.andWhere('event.id != :excludeEventId', { excludeEventId });
    }

    return query.getMany();
  }

  override async save(event: Event): Promise<Event> {
    const savedEvent = await super.save(event);
    
    // Invalidate related caches
    const tags = [
      `org:${savedEvent.organizationId}`,
      'event:list',
      'event:upcoming',
      'event:daterange'
    ];
    
    if (savedEvent.teamId) {
      tags.push(`team:${savedEvent.teamId}`);
    }
    
    await this.invalidateByTags(tags);
    
    return savedEvent;
  }

  override async remove(event: Event): Promise<Event> {
    const removedEvent = await super.remove(event);
    
    // Invalidate related caches
    const tags = [
      `org:${removedEvent.organizationId}`,
      'event:list',
      'event:upcoming',
      'event:daterange'
    ];
    
    if (removedEvent.teamId) {
      tags.push(`team:${removedEvent.teamId}`);
    }
    
    await this.invalidateByTags(tags);
    
    return removedEvent;
  }
}