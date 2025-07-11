import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutSession } from './WorkoutSession';
export type ExerciseCategory = 'strength' | 'cardio' | 'skill' | 'mobility' | 'recovery';
export type ExerciseUnit = 'reps' | 'seconds' | 'meters' | 'watts' | 'kilograms';
export declare class Exercise extends BaseEntity {
    name: string;
    category: ExerciseCategory;
    orderIndex: number;
    sets: number;
    reps: number;
    duration: number;
    restDuration: number;
    unit: ExerciseUnit;
    targetValue: number;
    equipment: string;
    instructions: string;
    videoUrl: string;
    imageUrl: string;
    intensityZones: {
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
    workoutSession: WorkoutSession;
    workoutSessionId: string;
}
//# sourceMappingURL=Exercise.d.ts.map