import { TemplateCategory, TemplateVisibility, WorkoutType, DifficultyLevel } from '../entities/SessionTemplate';
export declare class ExerciseInTemplateDto {
    exerciseId: string;
    name: string;
    category: string;
    sets: number;
    reps?: number;
    duration?: number;
    distance?: number;
    restBetweenSets: number;
    order: number;
    instructions?: string;
    targetMetrics?: {
        heartRateZone?: string;
        rpe?: number;
        velocity?: number;
        power?: number;
    };
}
export declare class WarmupCooldownDto {
    duration: number;
    activities: string[];
}
export declare class TargetGroupsDto {
    positions?: string[];
    ageGroups?: string[];
    skillLevels?: string[];
}
export declare class PermissionsDto {
    canEdit?: string[];
    canView?: string[];
    canUse?: string[];
}
export declare class CreateSessionTemplateDto {
    name: string;
    description?: string;
    category: TemplateCategory;
    type: WorkoutType;
    difficulty: DifficultyLevel;
    visibility: TemplateVisibility;
    teamId?: string;
    estimatedDuration: number;
    exercises: ExerciseInTemplateDto[];
    warmup?: WarmupCooldownDto;
    cooldown?: WarmupCooldownDto;
    equipment?: string[];
    targetGroups?: TargetGroupsDto;
    goals?: string[];
    tags?: string[];
    permissions?: PermissionsDto;
}
export declare class UpdateSessionTemplateDto {
    name?: string;
    description?: string;
    category?: TemplateCategory;
    type?: WorkoutType;
    difficulty?: DifficultyLevel;
    visibility?: TemplateVisibility;
    estimatedDuration?: number;
    exercises?: ExerciseInTemplateDto[];
    warmup?: WarmupCooldownDto;
    cooldown?: WarmupCooldownDto;
    equipment?: string[];
    targetGroups?: TargetGroupsDto;
    goals?: string[];
    tags?: string[];
    permissions?: PermissionsDto;
}
export declare class DuplicateTemplateDto {
    name: string;
}
export declare class BulkAssignTemplateDto {
    playerIds: string[];
    teamId: string;
    scheduledDates: string[];
}
export declare class SessionTemplateFilterDto {
    organizationId?: string;
    teamId?: string;
    category?: TemplateCategory;
    type?: WorkoutType;
    difficulty?: DifficultyLevel;
    visibility?: TemplateVisibility;
    createdBy?: string;
    search?: string;
    tags?: string[];
    isActive?: boolean;
    page?: number;
    limit?: number;
}
//# sourceMappingURL=sessionTemplate.dto.d.ts.map