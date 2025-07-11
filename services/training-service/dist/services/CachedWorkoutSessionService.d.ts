import { WorkoutSession, PlayerWorkoutLoad } from '../entities';
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
export declare class CachedWorkoutSessionService {
    private workoutRepository;
    private cacheManager;
    constructor();
    createWorkoutSession(data: CreateWorkoutSessionDto): Promise<WorkoutSession>;
    updateWorkoutSession(id: string, data: UpdateWorkoutSessionDto): Promise<WorkoutSession>;
    deleteWorkoutSession(id: string): Promise<void>;
    getWorkoutSessionById(id: string): Promise<WorkoutSession>;
    getWorkoutSessions(filters: WorkoutSessionFilters, page?: number, limit?: number): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getUpcomingWorkoutSessions(playerId: string, teamId?: string, days?: number): Promise<WorkoutSession[]>;
    updatePlayerWorkoutLoad(sessionId: string, playerId: string, data: {
        loadModifier?: number;
        exerciseModifications?: Record<string, any>;
        notes?: string;
    }): Promise<PlayerWorkoutLoad>;
    getPlayerWorkoutLoad(sessionId: string, playerId: string): Promise<PlayerWorkoutLoad | null>;
    getWorkoutSessionsByTeamAndDateRange(teamId: string, startDate: Date, endDate: Date): Promise<WorkoutSession[]>;
}
//# sourceMappingURL=CachedWorkoutSessionService.d.ts.map