import { IsString, IsEnum, IsUUID, IsDate, IsOptional, IsBoolean, IsInt, ValidateNested, IsArray, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { AssignmentType, AssignmentStatus, RecurrenceType } from '../entities/WorkoutAssignment';
import { OverrideType } from '../entities/WorkoutPlayerOverride';
import { WorkoutType } from '../entities/WorkoutType';

// Base assignment target DTO
export class AssignmentTargetDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  lineId?: string;

  @IsOptional()
  @IsString()
  positionCode?: string;

  @IsOptional()
  @IsUUID()
  ageGroupId?: string;

  @IsOptional()
  @IsUUID()
  customGroupId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  playerIds?: string[];
}

// Recurrence pattern DTO
export class RecurrencePatternDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  daysOfWeek?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  occurrences?: number;

  @IsOptional()
  @IsArray()
  @Type(() => Date)
  @IsDate({ each: true })
  exceptions?: Date[];
}

// Bulk assignment DTO
export class BulkAssignWorkoutDto {
  @IsUUID()
  workoutSessionId: string;

  @IsOptional()
  @IsUUID()
  sessionTemplateId?: string;

  @IsEnum(AssignmentType)
  assignmentType: AssignmentType;

  @Type(() => AssignmentTargetDto)
  @ValidateNested()
  assignmentTarget: AssignmentTargetDto;

  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;

  @Type(() => Date)
  @IsDate()
  scheduledDate: Date;

  @IsOptional()
  @IsEnum(WorkoutType)
  workoutType?: WorkoutType;

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @IsOptional()
  @Type(() => RecurrencePatternDto)
  @ValidateNested()
  recurrencePattern?: RecurrencePatternDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  allowPlayerOverrides?: boolean;

  @IsOptional()
  @IsBoolean()
  requireMedicalClearance?: boolean;

  @IsOptional()
  @IsObject()
  notifications?: {
    enabled: boolean;
    reminderMinutesBefore: number[];
    notifyOnCompletion: boolean;
    notifyOnMissed: boolean;
    customRecipients?: string[];
  };

  @IsOptional()
  @IsObject()
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

  @IsOptional()
  @IsObject()
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

  @IsOptional()
  @IsObject()
  metadata?: {
    source?: 'manual' | 'template' | 'ai_generated' | 'imported';
    templateId?: string;
    importSource?: string;
    tags?: string[];
    notes?: string;
  };
}

// Cascade assignment DTO
export class CascadeAssignmentDto extends BulkAssignWorkoutDto {
  @IsBoolean()
  cascadeToSubTeams: boolean;

  @IsOptional()
  @IsBoolean()
  cascadeToPlayers?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeTeamIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludePlayerIds?: string[];

  @IsOptional()
  @IsBoolean()
  respectExistingAssignments?: boolean;

  @IsOptional()
  @IsEnum(['skip', 'replace', 'merge'])
  conflictResolution?: 'skip' | 'replace' | 'merge';
}

// Conflict check DTO
export class ConflictCheckDto {
  @IsArray()
  @IsUUID('4', { each: true })
  playerIds: string[];

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsArray()
  @IsEnum(WorkoutType, { each: true })
  workoutTypes?: WorkoutType[];

  @IsOptional()
  @IsBoolean()
  checkMedicalRestrictions?: boolean;

  @IsOptional()
  @IsBoolean()
  checkLoadLimits?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDailyLoad?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxWeeklyLoad?: number;
}

// Conflict resolution DTO
export class ResolveConflictDto {
  @IsUUID()
  conflictId: string;

  @IsEnum(['cancel', 'reschedule', 'merge', 'override'])
  resolution: 'cancel' | 'reschedule' | 'merge' | 'override';

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  newScheduledDate?: Date;

  @IsOptional()
  @IsObject()
  mergeOptions?: {
    keepExercises: 'first' | 'second' | 'both';
    totalDuration?: number;
    loadDistribution?: 'equal' | 'weighted';
  };

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  affectedPlayerIds?: string[];
}

// Player override DTO
export class CreatePlayerOverrideDto {
  @IsUUID()
  playerId: string;

  @IsEnum(OverrideType)
  overrideType: OverrideType;

  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;

  @IsObject()
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

  @IsOptional()
  @IsUUID()
  medicalRecordId?: string;

  @IsOptional()
  @IsObject()
  medicalRestrictions?: {
    restrictionType: 'injury' | 'illness' | 'condition' | 'recovery';
    affectedBodyParts?: string[];
    restrictedMovements?: string[];
    maxExertionLevel?: number;
    requiresSupervision?: boolean;
    clearanceRequired?: boolean;
    medicalNotes?: string;
  };

  @IsOptional()
  @IsString()
  approvalNotes?: string;

  @IsOptional()
  @IsObject()
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

  @IsOptional()
  @IsObject()
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

  @IsOptional()
  @IsObject()
  metadata?: {
    source: 'medical_staff' | 'coach' | 'auto_generated' | 'player_request';
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    relatedIncidentId?: string;
    notes?: string;
  };
}

// Assignment filter DTO
export class WorkoutAssignmentFilterDto {
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @IsOptional()
  @IsEnum(AssignmentType)
  assignmentType?: AssignmentType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  includeExpired?: boolean;

  @IsOptional()
  @IsBoolean()
  includeOverrides?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}