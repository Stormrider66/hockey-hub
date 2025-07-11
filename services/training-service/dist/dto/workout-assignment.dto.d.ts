import { AssignmentType, AssignmentStatus, RecurrenceType } from '../entities/WorkoutAssignment';
import { OverrideType } from '../entities/WorkoutPlayerOverride';
import { WorkoutType } from '../entities/WorkoutType';
export declare class AssignmentTargetDto {
    teamId?: string;
    lineId?: string;
    positionCode?: string;
    ageGroupId?: string;
    customGroupId?: string;
    playerIds?: string[];
}
export declare class RecurrencePatternDto {
    interval?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: Date;
    occurrences?: number;
    exceptions?: Date[];
}
export declare class BulkAssignWorkoutDto {
    workoutSessionId: string;
    sessionTemplateId?: string;
    assignmentType: AssignmentType;
    assignmentTarget: AssignmentTargetDto;
    effectiveDate: Date;
    expiryDate?: Date;
    scheduledDate: Date;
    workoutType?: WorkoutType;
    recurrenceType?: RecurrenceType;
    recurrencePattern?: RecurrencePatternDto;
    priority?: number;
    allowPlayerOverrides?: boolean;
    requireMedicalClearance?: boolean;
    notifications?: {
        enabled: boolean;
        reminderMinutesBefore: number[];
        notifyOnCompletion: boolean;
        notifyOnMissed: boolean;
        customRecipients?: string[];
    };
    loadProgression?: {
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
    performanceThresholds?: {
        minCompletionRate?: number;
        targetHeartRateZone?: {
            min: number;
            max: number;
        };
        targetPowerOutput?: number;
        targetVelocity?: number;
        customMetrics?: Record<string, any>;
    };
    metadata?: {
        source?: 'manual' | 'template' | 'ai_generated' | 'imported';
        templateId?: string;
        importSource?: string;
        tags?: string[];
        notes?: string;
    };
}
export declare class CascadeAssignmentDto extends BulkAssignWorkoutDto {
    cascadeToSubTeams: boolean;
    cascadeToPlayers?: boolean;
    excludeTeamIds?: string[];
    excludePlayerIds?: string[];
    respectExistingAssignments?: boolean;
    conflictResolution?: 'skip' | 'replace' | 'merge';
}
export declare class ConflictCheckDto {
    playerIds: string[];
    startDate: Date;
    endDate: Date;
    workoutTypes?: WorkoutType[];
    checkMedicalRestrictions?: boolean;
    checkLoadLimits?: boolean;
    maxDailyLoad?: number;
    maxWeeklyLoad?: number;
}
export declare class ResolveConflictDto {
    conflictId: string;
    resolution: 'cancel' | 'reschedule' | 'merge' | 'override';
    newScheduledDate?: Date;
    mergeOptions?: {
        keepExercises: 'first' | 'second' | 'both';
        totalDuration?: number;
        loadDistribution?: 'equal' | 'weighted';
    };
    reason?: string;
    affectedPlayerIds?: string[];
}
export declare class CreatePlayerOverrideDto {
    playerId: string;
    overrideType: OverrideType;
    effectiveDate: Date;
    expiryDate?: Date;
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
    medicalRecordId?: string;
    medicalRestrictions?: {
        restrictionType: 'injury' | 'illness' | 'condition' | 'recovery';
        affectedBodyParts?: string[];
        restrictedMovements?: string[];
        maxExertionLevel?: number;
        requiresSupervision?: boolean;
        clearanceRequired?: boolean;
        medicalNotes?: string;
    };
    approvalNotes?: string;
    performanceData?: {
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
    progressionOverride?: {
        useCustomProgression: boolean;
        progressionRate?: number;
        targetDate?: Date;
        milestones?: Array<{
            date: Date;
            targetLoad: number;
            targetMetrics: Record<string, any>;
        }>;
    };
    metadata?: {
        source: 'medical_staff' | 'coach' | 'auto_generated' | 'player_request';
        priority: 'low' | 'medium' | 'high' | 'critical';
        tags?: string[];
        relatedIncidentId?: string;
        notes?: string;
    };
}
export declare class WorkoutAssignmentFilterDto {
    playerId?: string;
    teamId?: string;
    status?: AssignmentStatus;
    assignmentType?: AssignmentType;
    startDate?: Date;
    endDate?: Date;
    includeExpired?: boolean;
    includeOverrides?: boolean;
    page?: number;
    limit?: number;
}
//# sourceMappingURL=workout-assignment.dto.d.ts.map