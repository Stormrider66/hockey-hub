import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutSession } from './WorkoutSession';
import { ExerciseExecution } from './ExerciseExecution';
export type ExecutionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
export declare class WorkoutExecution extends BaseEntity {
    playerId: string;
    workoutSession: WorkoutSession;
    workoutSessionId: string;
    status: ExecutionStatus;
    startedAt: Date;
    completedAt: Date;
    currentExerciseIndex: number;
    currentSetNumber: number;
    completionPercentage: number;
    metrics: {
        heartRate?: number[];
        power?: number[];
        speed?: number[];
        calories?: number;
        averageHeartRate?: number;
        maxHeartRate?: number;
        averagePower?: number;
    };
    deviceData: {
        deviceId?: string;
        deviceType?: string;
        lastSync?: Date;
    };
    exerciseExecutions: ExerciseExecution[];
}
//# sourceMappingURL=WorkoutExecution.d.ts.map