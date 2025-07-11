import { BaseEntity } from '@hockey-hub/shared-lib';
import { ExerciseCategory, ExerciseUnit } from './Exercise';
export declare class ExerciseTemplate extends BaseEntity {
    name: string;
    category: ExerciseCategory;
    description: string;
    primaryUnit: ExerciseUnit;
    equipment: string[];
    muscleGroups: string[];
    instructions: string;
    videoUrl: string;
    imageUrl: string;
    defaultParameters: {
        sets?: number;
        reps?: number;
        duration?: number;
        restDuration?: number;
        intensityLevel?: 'low' | 'medium' | 'high' | 'max';
    };
    progressionGuidelines: {
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
    createdBy: string;
    organizationId?: string;
}
//# sourceMappingURL=ExerciseTemplate.d.ts.map