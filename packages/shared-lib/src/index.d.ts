export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}
export type WorkoutType = 'strength' | 'cardio' | 'skill' | 'recovery' | 'mixed';
export type WorkoutStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type ExerciseCategory = 'strength' | 'cardio' | 'skill' | 'mobility' | 'recovery';
export type ExerciseUnit = 'reps' | 'seconds' | 'meters' | 'watts' | 'kilograms';
export type ExecutionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
export interface WorkoutSession {
    id: string;
    title: string;
    description?: string;
    createdBy: string;
    type: WorkoutType;
    status: WorkoutStatus;
    scheduledDate: Date;
    location: string;
    teamId: string;
    playerIds: string[];
    estimatedDuration: number;
    settings: {
        allowIndividualLoads: boolean;
        displayMode: 'grid' | 'focus' | 'tv';
        showMetrics: boolean;
        autoRotation: boolean;
        rotationInterval: number;
    };
    exercises: Exercise[];
    playerLoads: PlayerWorkoutLoad[];
    executions?: WorkoutExecution[];
    createdAt: Date;
    updatedAt: Date;
}
export interface Exercise {
    id: string;
    name: string;
    category: ExerciseCategory;
    orderIndex: number;
    sets?: number;
    reps?: number;
    duration?: number;
    restDuration?: number;
    unit: ExerciseUnit;
    targetValue?: number;
    equipment?: string;
    instructions?: string;
    videoUrl?: string;
    imageUrl?: string;
    intensityZones?: {
        zone1: {
            min: number;
            max: number;
            name: string;
        };
        zone2: {
            min: number;
            max: number;
            name: string;
        };
        zone3: {
            min: number;
            max: number;
            name: string;
        };
        zone4: {
            min: number;
            max: number;
            name: string;
        };
        zone5: {
            min: number;
            max: number;
            name: string;
        };
    };
    workoutSessionId: string;
}
export interface PlayerWorkoutLoad {
    id: string;
    playerId: string;
    loadModifier: number;
    exerciseModifications?: {
        [exerciseId: string]: {
            sets?: number;
            reps?: number;
            duration?: number;
            targetValue?: number;
            restDuration?: number;
            notes?: string;
        };
    };
    notes?: string;
    isActive: boolean;
    workoutSessionId: string;
    createdAt: Date;
}
export interface WorkoutExecution {
    id: string;
    playerId: string;
    workoutSessionId: string;
    status: ExecutionStatus;
    startedAt?: Date;
    completedAt?: Date;
    currentExerciseIndex: number;
    currentSetNumber: number;
    completionPercentage?: number;
    metrics?: {
        heartRate?: number[];
        power?: number[];
        speed?: number[];
        calories?: number;
        averageHeartRate?: number;
        maxHeartRate?: number;
        averagePower?: number;
    };
    deviceData?: {
        deviceId?: string;
        deviceType?: string;
        lastSync?: Date;
    };
    exerciseExecutions?: ExerciseExecution[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ExerciseExecution {
    id: string;
    exerciseId: string;
    exerciseName: string;
    setNumber: number;
    actualReps?: number;
    actualWeight?: number;
    actualDuration?: number;
    actualDistance?: number;
    actualPower?: number;
    restTaken?: number;
    performanceMetrics?: {
        heartRate?: number;
        maxHeartRate?: number;
        averagePower?: number;
        maxPower?: number;
        speed?: number;
        cadence?: number;
        rpe?: number;
    };
    notes?: string;
    skipped: boolean;
    workoutExecutionId: string;
    completedAt: Date;
}
export interface ExerciseTemplate {
    id: string;
    name: string;
    category: ExerciseCategory;
    description?: string;
    primaryUnit: ExerciseUnit;
    equipment?: string[];
    muscleGroups?: string[];
    instructions?: string;
    videoUrl?: string;
    imageUrl?: string;
    defaultParameters?: {
        sets?: number;
        reps?: number;
        duration?: number;
        restDuration?: number;
        intensityLevel?: 'low' | 'medium' | 'high' | 'max';
    };
    progressionGuidelines?: {
        beginnerRange?: {
            min: number;
            max: number;
        };
        intermediateRange?: {
            min: number;
            max: number;
        };
        advancedRange?: {
            min: number;
            max: number;
        };
        unit: string;
    };
    isActive: boolean;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const USER_ROLES: {
    readonly ADMIN: "admin";
    readonly CLUB_ADMIN: "club_admin";
    readonly COACH: "coach";
    readonly PLAYER: "player";
    readonly PARENT: "parent";
    readonly MEDICAL_STAFF: "medical_staff";
    readonly EQUIPMENT_MANAGER: "equipment_manager";
    readonly PHYSICAL_TRAINER: "physical_trainer";
};
export * from './entities';
export * from './dto';
export * from './services';
export * from './saga';
export * from './cache';
export * from './validation';
export * from './middleware';
export * from './errors';
export * from './utils';
export * from './types/socket-events';
export * from './events/EventBus';
export * from './events/EventFactory';
export * from './events/EventPublisher';
export * from './events/training-events';
export * from './events/training-event-listeners';
export declare const formatDate: (date: Date) => string;
export declare const parseJWT: (token: string) => any;
//# sourceMappingURL=index.d.ts.map