import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutExecution } from './WorkoutExecution';
export declare class ExerciseExecution extends BaseEntity {
    exerciseId: string;
    exerciseName: string;
    setNumber: number;
    actualReps: number;
    actualWeight: number;
    actualDuration: number;
    actualDistance: number;
    actualPower: number;
    restTaken: number;
    performanceMetrics: {
        heartRate?: number;
        maxHeartRate?: number;
        averagePower?: number;
        maxPower?: number;
        speed?: number;
        cadence?: number;
        rpe?: number;
    };
    notes: string;
    skipped: boolean;
    workoutExecution: WorkoutExecution;
    workoutExecutionId: string;
    completedAt: Date;
}
//# sourceMappingURL=ExerciseExecution.d.ts.map