import { AppDataSource } from '../config/database';
import { WorkoutSession, Exercise, PlayerWorkoutLoad } from '../entities';
import { CachedWorkoutSessionRepository } from '../repositories/CachedWorkoutSessionRepository';
import { RedisCacheManager, CacheKeyBuilder } from '@hockey-hub/shared-lib';

const exerciseRepository = () => AppDataSource.getRepository(Exercise);
const playerLoadRepository = () => AppDataSource.getRepository(PlayerWorkoutLoad);

export interface CreateWorkoutSessionDto {
  title: string;
  description?: string;
  type: string;
  scheduledDate: Date;
  location?: string;
  teamId: string;
  playerIds: string[];
  createdBy: string;
  exercises?: CreateExerciseDto[];
  playerLoads?: CreatePlayerLoadDto[];
  settings?: WorkoutSettings;
  estimatedDuration?: number;
  intervalProgram?: any;
}

export interface CreateExerciseDto {
  name: string;
  description?: string;
  type: string;
  duration?: number;
  sets?: number;
  reps?: number;
  weight?: number;
  distance?: number;
  restPeriod?: number;
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  equipment?: string[];
  targetMuscles?: string[];
  difficulty?: string;
  orderIndex?: number;
}

export interface CreatePlayerLoadDto {
  playerId: string;
  loadModifier: number;
  exerciseModifications?: Record<string, any>;
  notes?: string;
}

export interface UpdateWorkoutSessionDto {
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  scheduledDate?: Date;
  location?: string;
  playerIds?: string[];
  settings?: Partial<WorkoutSettings>;
  exercises?: CreateExerciseDto[];
  intervalProgram?: any; // IntervalProgram type from entity
}

export interface WorkoutSettings {
  allowIndividualLoads: boolean;
  displayMode: 'grid' | 'focus' | 'tv';
  showMetrics: boolean;
  autoRotation: boolean;
  rotationInterval: number;
}

export interface WorkoutSessionFilters {
  teamId?: string;
  playerId?: string;
  status?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  type?: string;
}

export class CachedWorkoutSessionService {
  private workoutRepository: CachedWorkoutSessionRepository;
  private cacheManager: RedisCacheManager;

  constructor() {
    this.workoutRepository = new CachedWorkoutSessionRepository();
    this.cacheManager = RedisCacheManager.getInstance();
  }

  async createWorkoutSession(data: CreateWorkoutSessionDto): Promise<WorkoutSession> {
    const base = {
      title: data.title,
      description: data.description,
      type: (data.type as any),
      scheduledDate: data.scheduledDate,
      location: data.location,
      teamId: data.teamId,
      playerIds: data.playerIds,
      createdBy: data.createdBy,
      status: 'scheduled',
      settings: data.settings || {
        allowIndividualLoads: true,
        displayMode: 'grid',
        showMetrics: true,
        autoRotation: false,
        rotationInterval: 30
      },
      estimatedDuration: data.estimatedDuration || 60,
      intervalProgram: data.intervalProgram || null
    } as Partial<WorkoutSession>;
    const wr: any = (this as any).workoutRepository;
    const workout = typeof wr?.create === 'function'
      ? wr.create(base as any)
      : AppDataSource.getRepository(WorkoutSession).create(base as any);

    const savedWorkout = typeof wr?.save === 'function'
      ? await wr.save(workout)
      : await AppDataSource.getRepository(WorkoutSession).save(workout);

    // Create exercises
    if (data.exercises && data.exercises.length > 0) {
      const workoutExercises = data.exercises.map((ex, index) => 
        exerciseRepository().create({
          name: ex.name,
          category: (ex.type as any) || 'strength',
          orderIndex: ex.orderIndex ?? index,
          sets: ex.sets,
          reps: ex.reps,
          duration: ex.duration,
          restDuration: ex.restPeriod,
          unit: 'reps',
          targetValue: ex.weight ?? ex.distance,
          equipment: ex.equipment ? ex.equipment.join(',') : undefined,
          instructions: ex.instructions,
          videoUrl: ex.videoUrl,
          imageUrl: ex.imageUrl,
          intensityZones: undefined,
          workoutSessionId: savedWorkout.id
        })
      );
      await exerciseRepository().save(workoutExercises);
    }

    // Create player loads if specified
    if (data.playerLoads && data.playerLoads.length > 0) {
      const loads = data.playerLoads.map(load => 
        playerLoadRepository().create({
          ...load,
          workoutSessionId: savedWorkout.id
        })
      );
      await playerLoadRepository().save(loads);
    }

    return this.getWorkoutSessionById(savedWorkout.id);
  }

  async updateWorkoutSession(id: string, data: UpdateWorkoutSessionDto): Promise<WorkoutSession> {
    const wr: any = (this as any).workoutRepository;
    const workout = await this.getWorkoutSessionById(id);
    
    if (!workout) {
      throw new Error('Workout session not found');
    }

    // Update workout fields
    if (data.title) workout.title = data.title;
    if (data.description !== undefined) workout.description = data.description;
    if (data.type) workout.type = data.type as any;
    if (data.status) workout.status = (data.status as any);
    if (data.scheduledDate) workout.scheduledDate = data.scheduledDate;
    if (data.location !== undefined) workout.location = data.location;
    if (data.playerIds) workout.playerIds = data.playerIds;
    if (data.settings) workout.settings = { ...workout.settings, ...data.settings };
    if (data.intervalProgram !== undefined) workout.intervalProgram = data.intervalProgram;

    if (typeof wr?.save === 'function') {
      await wr.save(workout);
    } else {
      await AppDataSource.getRepository(WorkoutSession).save(workout);
    }

    // Update exercises if provided
    if (data.exercises) {
      // Delete existing exercises
      await exerciseRepository().delete({ workoutSessionId: workout.id });
      
      // Create new exercises
      const workoutExercises = data.exercises.map((ex, index) => 
        exerciseRepository().create({
          name: ex.name,
          category: (ex.type as any) || 'strength',
          orderIndex: index,
          sets: ex.sets,
          reps: ex.reps,
          duration: ex.duration,
          restDuration: ex.restPeriod,
          unit: 'reps',
          targetValue: ex.weight ?? ex.distance,
          equipment: ex.equipment ? ex.equipment.join(',') : undefined,
          instructions: ex.instructions,
          videoUrl: ex.videoUrl,
          imageUrl: ex.imageUrl,
          intensityZones: undefined,
          workoutSessionId: workout.id
        })
      );
      await exerciseRepository().save(workoutExercises);
    }

    return this.getWorkoutSessionById(id);
  }

  async deleteWorkoutSession(id: string): Promise<void> {
    const workout = await this.getWorkoutSessionById(id);
    
    if (!workout) {
      throw new Error('Workout session not found');
    }

    const wr: any = (this as any).workoutRepository;
    if (typeof wr?.remove === 'function') {
      await wr.remove(workout);
    } else {
      await AppDataSource.getRepository(WorkoutSession).remove(workout);
    }
  }

  async getWorkoutSessionById(id: string): Promise<WorkoutSession> {
    const session = await this.workoutRepository.findWithCompleteDetails(id);
    
    if (!session) {
      throw new Error('Workout session not found');
    }

    return session;
  }

  async getWorkoutSessions(filters: WorkoutSessionFilters, page = 1, limit = 20) {
    // Use cached repository for common queries
    if (filters.teamId && !filters.playerId && !filters.date && !filters.status) {
      const [sessions, total] = await this.workoutRepository.findSessionsByTeam(
        filters.teamId, 
        page, 
        limit
      );
      
      return {
        data: sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    if (filters.playerId && !filters.date && !filters.status) {
      const [sessions, total] = await this.workoutRepository.findSessionsByPlayer(
        filters.playerId, 
        page, 
        limit
      );
      
      return {
        data: sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    if (filters.date) {
      const sessions = await this.workoutRepository.findSessionsByDate(
        filters.date, 
        filters.teamId
      );
      
      // Apply pagination to date-based results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSessions = sessions.slice(startIndex, endIndex);
      
      return {
        data: paginatedSessions,
        pagination: {
          page,
          limit,
          total: sessions.length,
          totalPages: Math.ceil(sessions.length / limit),
        },
      };
    }

    if (filters.status) {
      const sessions = await this.workoutRepository.findSessionsByStatus(
        filters.status, 
        filters.teamId, 
        100 // Get more for status queries
      );
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSessions = sessions.slice(startIndex, endIndex);
      
      return {
        data: paginatedSessions,
        pagination: {
          page,
          limit,
          total: sessions.length,
          totalPages: Math.ceil(sessions.length / limit),
        },
      };
    }

    // Fallback to complex query for multiple filters
    const query = AppDataSource.getRepository(WorkoutSession).createQueryBuilder('workout')
      .leftJoinAndSelect('workout.exercises', 'exercises')
      .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
      .orderBy('workout.scheduledDate', 'DESC')
      .addOrderBy('exercises.orderIndex', 'ASC');

    if (filters.teamId) {
      query.andWhere('workout.teamId = :teamId', { teamId: filters.teamId });
    }

    if (filters.playerId) {
      query.andWhere("(',' || workout.playerIds || ',') LIKE :playerPattern", { playerPattern: `%${filters.playerId},%` });
    }

    if (filters.status) {
      query.andWhere('workout.status = :status', { status: filters.status });
    }

    if (filters.type) {
      query.andWhere('workout.type = :type', { type: filters.type });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('workout.scheduledDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
    }

    const [sessions, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUpcomingWorkoutSessions(
    playerId: string, 
    teamId?: string, 
    days = 7
  ): Promise<WorkoutSession[]> {
    return this.workoutRepository.findUpcomingSessions(playerId, teamId, days);
  }

  async updatePlayerWorkoutLoad(
    sessionId: string,
    playerId: string,
    data: {
      loadModifier?: number;
      exerciseModifications?: Record<string, any>;
      notes?: string;
    }
  ): Promise<PlayerWorkoutLoad> {
    let playerLoad = await playerLoadRepository().findOne({
      where: { workoutSessionId: sessionId, playerId }
    });

    if (!playerLoad) {
      playerLoad = playerLoadRepository().create({
        workoutSessionId: sessionId,
        playerId,
        loadModifier: data.loadModifier || 1.0,
        exerciseModifications: data.exerciseModifications || {},
        notes: data.notes
      });
    } else {
      if (data.loadModifier !== undefined) playerLoad.loadModifier = data.loadModifier;
      if (data.exerciseModifications) playerLoad.exerciseModifications = data.exerciseModifications;
      if (data.notes !== undefined) playerLoad.notes = data.notes;
    }

    const savedLoad = await playerLoadRepository().save(playerLoad);
    
    // Invalidate session cache (tolerate CacheKeyBuilder differences)
    try {
      const key = (CacheKeyBuilder as any)?.build ? (CacheKeyBuilder as any).build('workout-session', 'complete', sessionId) : `workout-session:complete:${sessionId}`;
      await this.cacheManager.delete(key);
    } catch {}
    
    return savedLoad;
  }

  async getPlayerWorkoutLoad(sessionId: string, playerId: string): Promise<PlayerWorkoutLoad | null> {
    const cacheKey = (CacheKeyBuilder as any)?.build ? (CacheKeyBuilder as any).build('player-load', sessionId, playerId) : `player-load:${sessionId}:${playerId}`;
    
    const cached = await this.cacheManager.get<PlayerWorkoutLoad>(cacheKey);
    if (cached) {
      return cached;
    }

    const playerLoad = await playerLoadRepository().findOne({
      where: { workoutSessionId: sessionId, playerId }
    });

    if (playerLoad) {
      // Cache player load for 10 minutes (ignore tag errors in E2E)
      try {
        await this.cacheManager.set(
          cacheKey, 
          playerLoad, 
          600
        );
      } catch {}
    }

    return playerLoad;
  }

  async getWorkoutSessionsByTeamAndDateRange(
    teamId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WorkoutSession[]> {
    const cacheKey = (CacheKeyBuilder as any)?.build ? (CacheKeyBuilder as any).build('workout-session', 'daterange', teamId, {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }) : `workout-session:daterange:${teamId}:${startDate.toISOString().split('T')[0]}:${endDate.toISOString().split('T')[0]}`;

    const cached = await this.cacheManager.get<WorkoutSession[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const sessions = await AppDataSource.getRepository(WorkoutSession).createQueryBuilder('workout')
      .leftJoinAndSelect('workout.exercises', 'exercises')
      .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
      .where('workout.teamId = :teamId', { teamId })
      .andWhere('workout.scheduledDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('workout.scheduledDate', 'ASC')
      .addOrderBy('exercises.orderIndex', 'ASC')
      .getMany();

    // Cache for 5 minutes (ignore tag errors in E2E)
    try {
      await this.cacheManager.set(
        cacheKey, 
        sessions, 
        300
      );
    } catch {}

    return sessions;
  }
}