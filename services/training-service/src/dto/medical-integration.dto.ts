import { IsUUID, IsString, IsEnum, IsOptional, IsDate, IsNumber, IsBoolean, ValidateNested, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum RestrictionSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  COMPLETE = 'complete'
}

export enum RestrictionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  CLEARED = 'cleared'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  PARTIAL = 'partial',
  NON_COMPLIANT = 'non_compliant',
  NOT_APPLICABLE = 'not_applicable'
}

export class MedicalRestrictionDTO {
  @IsUUID()
  id: string;

  @IsUUID()
  playerId: string;

  @IsEnum(RestrictionSeverity)
  severity: RestrictionSeverity;

  @IsEnum(RestrictionStatus)
  status: RestrictionStatus;

  @IsArray()
  @IsString({ each: true })
  affectedBodyParts: string[];

  @IsArray()
  @IsString({ each: true })
  restrictedMovements: string[];

  @IsArray()
  @IsString({ each: true })
  restrictedExerciseTypes: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  maxExertionLevel: number;

  @IsBoolean()
  requiresSupervision: boolean;

  @IsBoolean()
  clearanceRequired: boolean;

  @IsDate()
  @Type(() => Date)
  effectiveDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiryDate?: Date;

  @IsString()
  @IsOptional()
  medicalNotes?: string;

  @IsUUID()
  prescribedBy: string;

  @IsDate()
  @Type(() => Date)
  prescribedAt: Date;
}

export class SyncMedicalRestrictionsDTO {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  @IsOptional()
  teamId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  playerIds?: string[];

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fromDate?: Date;

  @IsBoolean()
  @IsOptional()
  includeExpired?: boolean;
}

export class ComplianceCheckDTO {
  @IsUUID()
  sessionId: string;

  @IsUUID()
  @IsOptional()
  playerId?: string;

  @IsBoolean()
  @IsOptional()
  detailed?: boolean;
}

export class ComplianceResultDTO {
  sessionId: string;
  overallStatus: ComplianceStatus;
  checkedAt: Date;
  playerCompliance: Array<{
    playerId: string;
    status: ComplianceStatus;
    restrictions: MedicalRestrictionDTO[];
    violations: Array<{
      restrictionId: string;
      exerciseId: string;
      violationType: 'movement' | 'intensity' | 'duration' | 'supervision';
      description: string;
      severity: RestrictionSeverity;
    }>;
    recommendations: string[];
  }>;
  requiresApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
}

export class ReportMedicalConcernDTO {
  @IsUUID()
  playerId: string;

  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @IsUUID()
  @IsOptional()
  exerciseId?: string;

  @IsEnum(['injury', 'discomfort', 'fatigue', 'technique', 'other'])
  concernType: 'injury' | 'discomfort' | 'fatigue' | 'technique' | 'other';

  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity: 'low' | 'medium' | 'high' | 'critical';

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  affectedBodyParts?: string[];

  @IsBoolean()
  @IsOptional()
  requiresImmediateAttention?: boolean;

  @IsUUID()
  reportedBy: string;

  @IsDate()
  @Type(() => Date)
  occurredAt: Date;
}

export class AlternativeExerciseDTO {
  @IsUUID()
  originalExerciseId: string;

  @IsUUID()
  alternativeExerciseId: string;

  @IsString()
  reason: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  loadMultiplier: number;

  @IsNumber()
  @Min(0)
  @Max(2)
  restMultiplier: number;

  @IsArray()
  @IsString({ each: true })
  modifications: string[];

  @IsBoolean()
  requiresSupervision: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  suitabilityScore: number;
}

export class GetAlternativesDTO {
  @IsUUID()
  playerId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  exerciseIds?: string[];

  @IsUUID()
  @IsOptional()
  workoutId?: string;

  @IsBoolean()
  @IsOptional()
  includeRationale?: boolean;
}

export class AlternativesResultDTO {
  playerId: string;
  restrictions: MedicalRestrictionDTO[];
  alternatives: Array<{
    originalExercise: {
      id: string;
      name: string;
      category: string;
      primaryMuscles: string[];
      equipment: string[];
    };
    suggestedAlternatives: AlternativeExerciseDTO[];
    cannotPerform: boolean;
    requiresApproval: boolean;
  }>;
  generalRecommendations: string[];
  loadAdjustment: number;
  restAdjustment: number;
}

export class MedicalSyncEventDTO {
  eventType: 'restriction_added' | 'restriction_updated' | 'restriction_cleared' | 'concern_reported';
  playerId: string;
  restrictionId?: string;
  concernId?: string;
  timestamp: Date;
  details: any;
}

export class CreateMedicalOverrideDTO {
  @IsUUID()
  workoutAssignmentId: string;

  @IsUUID()
  playerId: string;

  @IsUUID()
  medicalRecordId: string;

  @ValidateNested()
  @Type(() => MedicalRestrictionDTO)
  restriction: MedicalRestrictionDTO;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlternativeExerciseDTO)
  alternatives: AlternativeExerciseDTO[];

  @IsBoolean()
  @IsOptional()
  autoApprove?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}