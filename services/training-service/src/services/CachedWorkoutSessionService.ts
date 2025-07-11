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
  displayMode: 'grid' | 'list' | 'carousel';
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
    const workout = this.workoutRepository.create({
      title: data.title,
      description: data.description,
      type: data.type,
      scheduledDate: data.scheduledDate,
      location: data.location,
      teamId: data.teamId,
      playerIds: data.playerIds,
      createdBy: data.createdBy,
      status: 'SCHEDULED',
      settings: data.settings || {
        allowIndividualLoads: true,
        displayMode: 'grid',
        showMetrics: true,
        autoRotation: false,
        rotationInterval: 30
      },
      estimatedDuration: data.estimatedDuration || 60,
      intervalProgram: data.intervalProgram || null
    });

    const savedWorkout = await this.workoutRepository.save(workout);

    // Create exercises
    if (data.exercises && data.exercises.length > 0) {
      const workoutExercises = data.exercises.map((ex, index) => 
        exerciseRepository().create({
          ...ex,
          orderIndex: ex.orderIndex ?? index,
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
    const workout = await this.getWorkoutSessionById(id);
    
    if (!workout) {
      throw new Error('Workout session not found');
    }

    // Update workout fields
    if (data.title) workout.title = data.title;
    if (data.description !== undefined) workout.description = data.description;
    if (data.type) workout.type = data.type;
    if (data.status) workout.status = data.status;
    if (data.scheduledDate) workout.scheduledDate = data.scheduledDate;
    if (data.location !== undefined) workout.location = data.location;
    if (data.playerIds) workout.playerIds = data.playerIds;
    if (data.settings) workout.settings = { ...workout.settings, ...data.settings };
    if (data.intervalProgram !== undefined) workout.intervalProgram = data.intervalProgram;

    await this.workoutRepository.save(workout);

    // Update exercises if provided
    if (data.exercises) {
      // Delete existing exercises
      await exerciseRepository().delete({ workoutSessionId: workout.id });
      
      // Create new exercises
      const workoutExercises = data.exercises.map((ex, index) => 
        exerciseRepository().create({
          ...ex,
          orderIndex: index,
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

    await this.workoutRepository.remove(workout);
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
    const query = this.workoutRepository.createQueryBuilder('workout')
      .leftJoinAndSelect('workout.exercises', 'exercises')
      .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
      .orderBy('workout.scheduledDate', 'DESC')
      .addOrderBy('exercises.orderIndex', 'ASC');

    if (filters.teamId) {
      query.andWhere('workout.teamId = :teamId', { teamId: filters.teamId });
    }

    if (filters.playerId) {
      query.andWhere(':playerId = ANY(workout.playerIds)', { playerId: filters.playerId });
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
    
    // Invalidate session cache
    await this.cacheManager.delete(CacheKeyBuilder.build('workout-session', 'complete', sessionId));
    
    return savedLoad;
  }

  async getPlayerWorkoutLoad(sessionId: string, playerId: string): Promise<PlayerWorkoutLoad | null> {
    const cacheKey = CacheKeyBuilder.build('player-load', sessionId, playerId);
    
    const cached = await this.cacheManager.get<PlayerWorkoutLoad>(cacheKey);
    if (cached) {
      return cached;
    }

    const playerLoad = await playerLoadRepository().findOne({
      where: { workoutSessionId: sessionId, playerId }
    });

    if (playerLoad) {
      // Cache player load for 10 minutes
      await this.cacheManager.set(
        cacheKey, 
        playerLoad, 
        600, 
        [`player:${playerId}`, `workout-session:${sessionId}`]
      );
    }

    return playerLoad;
  }

  async getWorkoutSessionsByTeamAndDateRange(
    teamId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WorkoutSession[]> {
    const cacheKey = CacheKeyBuilder.build('workout-session', 'daterange', teamId, {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });

    const cached = await this.cacheManager.get<WorkoutSession[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const sessions = await this.workoutRepository.createQueryBuilder('workout')
      .leftJoinAndSelect('workout.exercises', 'exercises')
      .leftJoinAndSelect('workout.playerLoads', 'playerLoads')
      .where('workout.teamId = :teamId', { teamId })
      .andWhere('workout.scheduledDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('workout.scheduledDate', 'ASC')
      .addOrderBy('exercises.orderIndex', 'ASC')
      .getMany();

    // Cache for 5 minutes
    await this.cacheManager.set(
      cacheKey, 
      sessions, 
      300, 
      [`team:${teamId}`, 'workout-session:daterange']
    );

    return sessions;
  }
}