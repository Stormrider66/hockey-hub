import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutSession } from './WorkoutSession';
export declare class PlayerWorkoutLoad extends BaseEntity {
    playerId: string;
    loadModifier: number;
    exerciseModifications: {
        [exerciseId: string]: {
            sets?: number;
            reps?: number;
            duration?: number;
            targetValue?: number;
            restDuration?: number;
            notes?: string;
        };
    };
    notes: string;
    isActive: boolean;
    workoutSession: WorkoutSession;
    workoutSessionId: string;
}
//# sourceMappingURL=PlayerWorkoutLoad.d.ts.map