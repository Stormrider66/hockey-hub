import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutType } from './WorkoutType';
export declare enum TemplateCategory {
    PRE_SEASON = "pre_season",
    IN_SEASON = "in_season",
    POST_SEASON = "post_season",
    RECOVERY = "recovery",
    STRENGTH = "strength",
    CONDITIONING = "conditioning",
    SKILL_DEVELOPMENT = "skill_development",
    INJURY_PREVENTION = "injury_prevention",
    CUSTOM = "custom"
}
export declare enum TemplateVisibility {
    PRIVATE = "private",
    TEAM = "team",
    ORGANIZATION = "organization",
    PUBLIC = "public"
}
export declare enum DifficultyLevel {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
    PROFESSIONAL = "professional"
}
export declare class SessionTemplate extends BaseEntity {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    type: WorkoutType;
    difficulty: DifficultyLevel;
    visibility: TemplateVisibility;
    organizationId: string;
    teamId: string;
    createdBy: string;
    estimatedDuration: number;
    exercises: {
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
    }[];
    warmup: {
        duration: number;
        activities: string[];
    };
    cooldown: {
        duration: number;
        activities: string[];
    };
    equipment: string[];
    targetGroups: {
        positions?: string[];
        ageGroups?: string[];
        skillLevels?: string[];
    };
    goals: string[];
    tags: string[];
    usageCount: number;
    averageRating: number;
    ratingCount: number;
    isActive: boolean;
    isSystemTemplate: boolean;
    permissions: {
        canEdit: string[];
        canView: string[];
        canUse: string[];
    };
    metadata: {
        source?: string;
        version?: number;
        lastModifiedBy?: string;
        notes?: string;
    };
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date;
    deletedAt: Date;
}
//# sourceMappingURL=SessionTemplate.d.ts.map