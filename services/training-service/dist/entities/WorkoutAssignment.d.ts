import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutSession } from './WorkoutSession';
import { WorkoutPlayerOverride } from './WorkoutPlayerOverride';
import { WorkoutType } from './WorkoutType';
export declare enum AssignmentType {
    INDIVIDUAL = "individual",
    TEAM = "team",
    LINE = "line",
    POSITION = "position",
    AGE_GROUP = "age_group",
    CUSTOM_GROUP = "custom_group"
}
export declare enum AssignmentStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    ARCHIVED = "archived"
}
export declare enum RecurrenceType {
    NONE = "none",
    DAILY = "daily",
    WEEKLY = "weekly",
    BIWEEKLY = "biweekly",
    MONTHLY = "monthly",
    CUSTOM = "custom"
}
export declare class WorkoutAssignment extends BaseEntity {
    workoutSessionId: string;
    sessionTemplateId: string;
    playerId: string;
    teamId: string;
    workoutSession: WorkoutSession;
    organizationId: string;
    assignmentType: AssignmentType;
    status: AssignmentStatus;
    workoutType: WorkoutType;
    assignmentTarget: {
        teamId?: string;
        lineId?: string;
        positionCode?: string;
        ageGroupId?: string;
        customGroupId?: string;
        playerIds?: string[];
    };
    effectiveDate: Date;
    expiryDate: Date;
    scheduledDate: Date;
    startedAt: Date;
    completedAt: Date;
    exercisesCompleted: number;
    exercisesTotal: number;
    recurrenceType: RecurrenceType;
    recurrencePattern: {
        interval?: number;
        daysOfWeek?: number[];
        dayOfMonth?: number;
        endDate?: Date;
        occurrences?: number;
        exceptions?: Date[];
    };
    createdBy: string;
    approvedBy: string;
    approvedAt: Date;
    priority: number;
    loadProgression: {
        baseLoad: number;
        progressionType: 'linear' | 'stepped' | 'wave' | 'custom';
        progressionRate: number;
        progressionInterval: 'daily' | 'weekly' | 'monthly';
        maxLoad?: number;
        minLoad?: number;
        customProgression?: Array<{
            week: number;
            loadMultiplier: number;
        }>;
    };
    performanceThresholds: {
        minCompletionRate?: number;
        targetHeartRateZone?: {
            min: number;
            max: number;
        };
        targetPowerOutput?: number;
        targetVelocity?: number;
        customMetrics?: Record<string, any>;
    };
    allowPlayerOverrides: boolean;
    requireMedicalClearance: boolean;
    notifications: {
        enabled: boolean;
        reminderMinutesBefore: number[];
        notifyOnCompletion: boolean;
        notifyOnMissed: boolean;
        customRecipients?: string[];
    };
    parentAssignmentId: string;
    parentAssignment: WorkoutAssignment;
    childAssignments: WorkoutAssignment[];
    playerOverrides: WorkoutPlayerOverride[];
    metadata: {
        source?: 'manual' | 'template' | 'ai_generated' | 'imported';
        templateId?: string;
        importSource?: string;
        tags?: string[];
        notes?: string;
    };
    eventMetadata: {
        publishedEvents: Array<{
            type: string;
            publishedAt: string;
            eventId: string;
        }>;
    };
    eventBusMetadata: {
        lastPublishedAt?: Date;
        lastEventId?: string;
        publishedEvents?: string[];
        subscribedEvents?: string[];
    };
    lastSyncedAt: Date;
    version: number;
}
//# sourceMappingURL=WorkoutAssignment.d.ts.map