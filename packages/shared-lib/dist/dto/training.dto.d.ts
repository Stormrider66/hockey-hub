import { WorkoutType, WorkoutStatus, ExerciseCategory, ExerciseUnit } from '../index';
export declare class CreateWorkoutSessionDto {
    title: string;
    description?: string;
    type: WorkoutType;
    scheduledDate: string;
    location: string;
    teamId: string;
    playerIds: string[];
    estimatedDuration: number;
    settings?: WorkoutSettingsDto;
}
export declare class WorkoutSettingsDto {
    allowIndividualLoads?: boolean;
    displayMode?: 'grid' | 'focus' | 'tv';
    showMetrics?: boolean;
    autoRotation?: boolean;
    rotationInterval?: number;
}
export declare class CreateExerciseDto {
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
}
export declare class UpdateExerciseDto extends CreateExerciseDto {
    id: string;
}
export declare class PlayerLoadDto {
    playerId: string;
    loadModifier: number;
    exerciseModifications?: Record<string, ExerciseModificationDto>;
    notes?: string;
}
export declare class ExerciseModificationDto {
    sets?: number;
    reps?: number;
    duration?: number;
    targetValue?: number;
    restDuration?: number;
    notes?: string;
}
export declare class StartWorkoutDto {
    sessionId: string;
    deviceId?: string;
    deviceType?: string;
}
export declare class UpdateExerciseExecutionDto {
    exerciseId: string;
    setNumber: number;
    actualReps?: number;
    actualWeight?: number;
    actualDuration?: number;
    actualDistance?: number;
    actualPower?: number;
    restTaken?: number;
    performanceMetrics?: PerformanceMetricsDto;
    notes?: string;
    skipped?: boolean;
}
export declare class PerformanceMetricsDto {
    heartRate?: number;
    maxHeartRate?: number;
    averagePower?: number;
    maxPower?: number;
    speed?: number;
    cadence?: number;
    rpe?: number;
}
export declare class WorkoutFilterDto {
    type?: WorkoutType;
    status?: WorkoutStatus;
    teamId?: string;
    playerId?: string;
    coachId?: string;
    startDate?: string;
    endDate?: string;
}
export declare class UpdateWorkoutSessionDto {
    title?: string;
    description?: string;
    type?: WorkoutType;
    status?: WorkoutStatus;
    scheduledDate?: string;
    location?: string;
    playerIds?: string[];
    settings?: WorkoutSettingsDto;
    exercises?: UpdateExerciseDto[];
}
//# sourceMappingURL=training.dto.d.ts.map