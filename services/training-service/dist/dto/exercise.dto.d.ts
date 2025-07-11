import { ExerciseCategory, ExerciseUnit } from '../entities';
export declare class CreateExerciseTemplateDto {
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
}
export declare class UpdateExerciseTemplateDto {
    name?: string;
    category?: ExerciseCategory;
    description?: string;
    primaryUnit?: ExerciseUnit;
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
    isActive?: boolean;
}
export declare class ExerciseFilterDto {
    category?: ExerciseCategory;
    search?: string;
    isActive?: boolean;
    skip?: number;
    take?: number;
}
//# sourceMappingURL=exercise.dto.d.ts.map