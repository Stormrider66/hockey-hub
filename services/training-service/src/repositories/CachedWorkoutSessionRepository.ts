import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { WorkoutSession } from '../entities';
import { CachedRepository, CacheKeyBuilder, RedisCacheManager } from '@hockey-hub/shared-lib';

export class CachedWorkoutSessionRepository extends CachedRepository<WorkoutSession> {
  constructor() {
    super(
      AppDataSource.getRepository(WorkoutSession),
      RedisCacheManager.getInstance(),
      'workout-session'
    );
  }

  async findSessionsByTeam(teamId: string, page = 1, limit = 20): Promise<[WorkoutSession[], number]> {
    const cacheKey = CacheKeyBuilder.build('workout-session', 'list', 'team', teamId, { page, limit });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.createQueryBuilder('workout')
          .leftJoinAndSelect('workout.exercises', 'exercises')
          .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
          .where('workout.teamId = :teamId', { teamId })
          .orderBy('workout.scheduledDate', 'DESC')
          .addOrderBy('exercises.orderIndex', 'ASC')
          .skip((page - 1) * limit)
          .take(limit)
          .getManyAndCount();
      },
      120, // 2 minutes TTL for lists
      [`team:${teamId}`, 'workout-session:list']
    );
  }

  async findSessionsByPlayer(playerId: string, page = 1, limit = 20): Promise<[WorkoutSession[], number]> {
    const cacheKey = CacheKeyBuilder.build('workout-session', 'list', 'player', playerId, { page, limit });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.createQueryBuilder('workout')
          .leftJoinAndSelect('workout.exercises', 'exercises')
          .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
          .where(':playerId = ANY(workout.playerIds)', { playerId })
          .orderBy('workout.scheduledDate', 'DESC')
          .addOrderBy('exercises.orderIndex', 'ASC')
          .skip((page - 1) * limit)
          .take(limit)
          .getManyAndCount();
      },
      120, // 2 minutes TTL for lists
      [`player:${playerId}`, 'workout-session:list']
    );
  }

  async findSessionsByDate(date: Date, teamId?: string): Promise<WorkoutSession[]> {
    const dateKey = date.toISOString().split('T')[0];
    const cacheKey = CacheKeyBuilder.build('workout-session', 'date', dateKey, { teamId });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        let query = this.repository.createQueryBuilder('workout')
          .leftJoinAndSelect('workout.exercises', 'exercises')
          .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
          .where('workout.scheduledDate BETWEEN :startDate AND :endDate', { startDate, endDate })
          .orderBy('workout.scheduledDate', 'ASC')
          .addOrderBy('exercises.orderIndex', 'ASC');

        if (teamId) {
          query = query.andWhere('workout.teamId = :teamId', { teamId });
        }

        return query.getMany();
      },
      300, // 5 minutes TTL for date-based queries
      teamId ? [`team:${teamId}`, 'workout-session:date'] : ['workout-session:date']
    );
  }

  async findUpcomingSessions(
    playerId: string, 
    teamId?: string, 
    days = 7
  ): Promise<WorkoutSession[]> {
    const cacheKey = CacheKeyBuilder.build('workout-session', 'upcoming', playerId, { teamId, days });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        let query = this.repository.createQueryBuilder('workout')
          .leftJoinAndSelect('workout.exercises', 'exercises')
          .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
          .where('workout.scheduledDate BETWEEN :startDate AND :endDate', { startDate, endDate })
          .andWhere(':playerId = ANY(workout.playerIds)', { playerId })
          .andWhere('workout.status IN (:...statuses)', { statuses: ['SCHEDULED', 'IN_PROGRESS'] })
          .orderBy('workout.scheduledDate', 'ASC')
          .addOrderBy('exercises.orderIndex', 'ASC');

        if (teamId) {
          query = query.andWhere('workout.teamId = :teamId', { teamId });
        }

        return query.getMany();
      },
      180, // 3 minutes TTL for upcoming sessions
      [`player:${playerId}`, 'workout-session:upcoming'].concat(teamId ? [`team:${teamId}`] : [])
    );
  }

  async findSessionsByStatus(
    status: string, 
    teamId?: string, 
    limit = 50
  ): Promise<WorkoutSession[]> {
    const cacheKey = CacheKeyBuilder.build('workout-session', 'status', status, { teamId, limit });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        let query = this.repository.createQueryBuilder('workout')
          .leftJoinAndSelect('workout.exercises', 'exercises')
          .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
          .where('workout.status = :status', { status })
          .orderBy('workout.scheduledDate', 'DESC')
          .addOrderBy('exercises.orderIndex', 'ASC')
          .limit(limit);

        if (teamId) {
          query = query.andWhere('workout.teamId = :teamId', { teamId });
        }

        return query.getMany();
      },
      240, // 4 minutes TTL for status-based queries
      teamId ? [`team:${teamId}`, 'workout-session:status'] : ['workout-session:status']
    );
  }

  async findWithCompleteDetails(id: string): Promise<WorkoutSession | null> {
    const cacheKey = CacheKeyBuilder.build('workout-session', 'complete', id);
    
    const cached = await this.cacheManager.get<WorkoutSession>(cacheKey);
    if (cached) {
      return cached;
    }

    const session = await this.repository.findOne({
      where: { id },
      relations: ['exercises', 'playerLoads', 'executions']
    });

    if (session) {
      // Cache individual session for 5 minutes
      await this.cacheManager.set(
        cacheKey, 
        session, 
        300, 
        [`workout-session:${id}`, `team:${session.teamId}`]
      );
    }

    return session;
  }

  async save(session: WorkoutSession): Promise<WorkoutSession> {
    const savedSession = await super.save(session);
    
    // Invalidate related caches
    const tags = [
      'workout-session:list',
      'workout-session:date',
      'workout-session:upcoming',
      'workout-session:status'
    ];
    
    if (savedSession.teamId) {
      tags.push(`team:${savedSession.teamId}`);
    }
    
    if (savedSession.playerIds && savedSession.playerIds.length > 0) {
      savedSession.playerIds.forEach(playerId => {
        tags.push(`player:${playerId}`);
      });
    }
    
    await this.invalidateByTags(tags);
    
    return savedSession;
  }

  async remove(session: WorkoutSession): Promise<WorkoutSession> {
    const removedSession = await super.remove(session);
    
    // Invalidate related caches
    const tags = [
      'workout-session:list',
      'workout-session:date',
      'workout-session:upcoming',
      'workout-session:status'
    ];
    
    if (removedSession.teamId) {
      tags.push(`team:${removedSession.teamId}`);
    }
    
    if (removedSession.playerIds && removedSession.playerIds.length > 0) {
      removedSession.playerIds.forEach(playerId => {
        tags.push(`player:${playerId}`);
      });
    }
    
    await this.invalidateByTags(tags);
    
    return removedSession;
  }
}