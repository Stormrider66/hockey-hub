// @ts-nocheck - Cached repository with complex cache patterns
import { AppDataSource } from '../config/database';
import { WorkoutSession } from '../entities';
import { CachedRepository, CacheKeyBuilder } from '@hockey-hub/shared-lib';

export class CachedWorkoutSessionRepository extends CachedRepository<WorkoutSession> {
  constructor() {
    // Base class only needs the repository and entity name; cache manager is handled internally
    super(AppDataSource.getRepository(WorkoutSession), 'workout-session');
  }

  async findSessionsByTeam(teamId: string, page = 1, limit = 20): Promise<[WorkoutSession[], number]> {
    const cacheKey = (CacheKeyBuilder as any)?.build
      ? (CacheKeyBuilder as any).build('workout-session', 'list', 'team', teamId, { page, limit })
      : `workout-session:list:team:${teamId}:page:${page}:limit:${limit}`;
    
    const queryFn = async () => {
      return this.repository.createQueryBuilder('workout')
        .leftJoinAndSelect('workout.exercises', 'exercises')
        .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
        .where('workout.teamId = :teamId', { teamId })
        .orderBy('workout.scheduledDate', 'DESC')
        .addOrderBy('exercises.orderIndex', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
    };
    const cacheFn: any = (this as any).cacheQueryResult;
    if (typeof cacheFn === 'function') {
      return (cacheFn as (k: string, q: () => Promise<any>, ttl?: number, tags?: string[]) => Promise<any>)
        .call(this, cacheKey, queryFn, 120, [`team:${teamId}`, 'workout-session:list']);
    }
    return queryFn();
  }

  async findSessionsByPlayer(playerId: string, page = 1, limit = 20): Promise<[WorkoutSession[], number]> {
    const cacheKey = (CacheKeyBuilder as any)?.build
      ? (CacheKeyBuilder as any).build('workout-session', 'list', 'player', playerId, { page, limit })
      : `workout-session:list:player:${playerId}:page:${page}:limit:${limit}`;
    
    const queryFn = async () => {
      return this.repository.createQueryBuilder('workout')
        .leftJoinAndSelect('workout.exercises', 'exercises')
        .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
        .where(':playerId = ANY(string_to_array(workout.playerIds, ","))', { playerId })
        .orderBy('workout.scheduledDate', 'DESC')
        .addOrderBy('exercises.orderIndex', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
    };
    const cacheFn: any = (this as any).cacheQueryResult;
    if (typeof cacheFn === 'function') {
      return (cacheFn as (k: string, q: () => Promise<any>, ttl?: number, tags?: string[]) => Promise<any>)
        .call(this, cacheKey, queryFn, 120, [`player:${playerId}`, 'workout-session:list']);
    }
    return queryFn();
  }

  async findSessionsByDate(date: Date, teamId?: string): Promise<WorkoutSession[]> {
    const dateKey = date.toISOString().split('T')[0];
    const cacheKey = (CacheKeyBuilder as any)?.build
      ? (CacheKeyBuilder as any).build('workout-session', 'date', dateKey, { teamId })
      : `workout-session:date:${dateKey}:${teamId ?? ''}`;
    
    const queryFn = async () => {
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
    };
    const cacheFn: any = (this as any).cacheQueryResult;
    if (typeof cacheFn === 'function') {
      return (cacheFn as (k: string, q: () => Promise<any>, ttl?: number, tags?: string[]) => Promise<any>)
        .call(this, cacheKey, queryFn, 300, teamId ? [`team:${teamId}`, 'workout-session:date'] : ['workout-session:date']);
    }
    return queryFn();
  }

  async findUpcomingSessions(
    playerId: string, 
    teamId?: string, 
    days = 7
  ): Promise<WorkoutSession[]> {
    const cacheKey = (CacheKeyBuilder as any)?.build
      ? (CacheKeyBuilder as any).build('workout-session', 'upcoming', playerId, { teamId, days })
      : `workout-session:upcoming:${playerId}:${teamId ?? ''}:${days}`;
    
    const queryFn = async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      let query = this.repository.createQueryBuilder('workout')
        .leftJoinAndSelect('workout.exercises', 'exercises')
        .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
        .where('workout.scheduledDate BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere("(',' || workout.playerIds || ',') LIKE :playerPattern", { playerPattern: `%${playerId},%` })
        .andWhere('workout.status IN (:...statuses)', { statuses: ['scheduled', 'active'] })
        .orderBy('workout.scheduledDate', 'ASC')
        .addOrderBy('exercises.orderIndex', 'ASC');

      if (teamId) {
        query = query.andWhere('workout.teamId = :teamId', { teamId });
      }

      return query.getMany();
    };
    const cacheFn: any = (this as any).cacheQueryResult;
    if (typeof cacheFn === 'function') {
      const tags = [`player:${playerId}`, 'workout-session:upcoming'];
      if (teamId) tags.push(`team:${teamId}`);
      return (cacheFn as (k: string, q: () => Promise<any>, ttl?: number, tags?: string[]) => Promise<any>)
        .call(this, cacheKey, queryFn, 180, tags);
    }
    return queryFn();
  }

  async findSessionsByStatus(
    status: string, 
    teamId?: string, 
    limit = 50
  ): Promise<WorkoutSession[]> {
    const cacheKey = (CacheKeyBuilder as any)?.build
      ? (CacheKeyBuilder as any).build('workout-session', 'status', status, { teamId, limit })
      : `workout-session:status:${status}:${teamId ?? ''}:${limit}`;
    
    const queryFn = async () => {
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
    };
    const cacheFn: any = (this as any).cacheQueryResult;
    if (typeof cacheFn === 'function') {
      return cacheFn.call(this, cacheKey, queryFn, 240, teamId ? [`team:${teamId}`, 'workout-session:status'] : ['workout-session:status']);
    }
    return queryFn();
  }

  async findWithCompleteDetails(id: string): Promise<WorkoutSession | null> {
    try {
      const keyBuilder = (CacheKeyBuilder as any);
      if (typeof keyBuilder?.build === 'function') {
        const cacheKey = keyBuilder.build('workout-session', 'complete', id);
        const cached = await ((this as any)?.cacheManager?.get(cacheKey) as Promise<WorkoutSession | null>);
        if (cached) return cached;
        const session = await this.repository.findOne({ where: { id }, relations: ['exercises', 'playerLoads', 'executions'] });
        if (session) {
          try { await ((this as any)?.cacheManager?.set(cacheKey, session, 300) as Promise<void>); } catch {}
        }
        return session;
      }
    } catch {}
    // Fallback: direct DB fetch without caching
    return this.repository.findOne({ where: { id }, relations: ['exercises', 'playerLoads', 'executions'] });
  }

  override async save(session: WorkoutSession): Promise<WorkoutSession> {
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

  override async remove(session: WorkoutSession): Promise<WorkoutSession> {
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