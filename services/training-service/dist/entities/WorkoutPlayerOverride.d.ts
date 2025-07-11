import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutAssignment } from './WorkoutAssignment';
export declare enum OverrideType {
    MEDICAL = "medical",
    PERFORMANCE = "performance",
    SCHEDULING = "scheduling",
    CUSTOM = "custom"
}
export declare enum OverrideStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    EXPIRED = "expired"
}
export declare class WorkoutPlayerOverride extends BaseEntity {
    workoutAssignmentId: string;
    workoutAssignment: WorkoutAssignment;
    playerId: string;
    overrideType: OverrideType;
    status: OverrideStatus;
    effectiveDate: Date;
    expiryDate: Date;
    modifications: {
        loadMultiplier?: number;
        maxHeartRate?: number;
        excludeExercises?: string[];
        substituteExercises?: Array<{
            originalExerciseId: string;
            substituteExerciseId: string;
            reason: string;
        }>;
        restMultiplier?: number;
        workDurationMultiplier?: number;
        intensityZone?: {
            min: number;
            max: number;
        };
        exempt?: boolean;
        exemptionReason?: string;
        alternativeWorkoutId?: string;
        customModifications?: Record<string, any>;
    };
    medicalRecordId: string;
    medicalRestrictions: {
        restrictionType: 'injury' | 'illness' | 'condition' | 'recovery';
        affectedBodyParts?: string[];
        restrictedMovements?: string[];
        maxExertionLevel?: number;
        requiresSupervision?: boolean;
        clearanceRequired?: boolean;
        medicalNotes?: string;
    };
    requestedBy: string;
    requestedAt: Date;
    approvedBy: string;
    approvedAt: Date;
    approvalNotes: string;
    performanceData: {
        recentTestResults?: Array<{
            testId: string;
            testDate: Date;
            score: number;
            percentile?: number;
        }>;
        currentFitnessLevel?: number;
        fatigueIndex?: number;
        recoveryScore?: number;
        customMetrics?: Record<string, any>;
    };
    progressionOverride: {
        useCustomProgression: boolean;
        progressionRate?: number;
        targetDate?: Date;
        milestones?: Array<{
            date: Date;
            targetLoad: number;
            targetMetrics: Record<string, any>;
        }>;
    };
    requiresReview: boolean;
    nextReviewDate: Date;
    communicationLog: Array<{
        timestamp: Date;
        type: 'notification' | 'reminder' | 'update';
        recipient: string;
        message: string;
        acknowledged?: boolean;
    }>;
    metadata: {
        source: 'medical_staff' | 'coach' | 'auto_generated' | 'player_request';
        priority: 'low' | 'medium' | 'high' | 'critical';
        tags?: string[];
        relatedIncidentId?: string;
        notes?: string;
    };
    eventBusMetadata: {
        lastPublishedAt?: Date;
        lastEventId?: string;
        syncedWithMedical?: boolean;
        syncedWithCalendar?: boolean;
    };
    version: number;
}
//# sourceMappingURL=WorkoutPlayerOverride.d.ts.map