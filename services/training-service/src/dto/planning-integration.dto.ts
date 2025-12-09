import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, ValidateNested, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum PhaseType {
  PRESEASON = 'preseason',
  IN_SEASON = 'in-season',
  PLAYOFFS = 'playoffs',
  OFFSEASON = 'offseason',
  RECOVERY = 'recovery'
}

export enum IntensityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  PEAK = 'peak',
  RECOVERY = 'recovery'
}

export enum AdjustmentType {
  LOAD = 'load',
  FREQUENCY = 'frequency',
  INTENSITY = 'intensity',
  EXERCISE_SELECTION = 'exercise_selection'
}

export class PhaseObjectiveDto {
  @IsEnum(['strength', 'endurance', 'speed', 'skill', 'tactical'])
  type: 'strength' | 'endurance' | 'speed' | 'skill' | 'tactical';

  @IsEnum(['high', 'medium', 'low'])
  priority: 'high' | 'medium' | 'low';

  @IsNumber()
  @Min(0)
  @Max(100)
  targetImprovement: number;
}

export class PlanningPhaseDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsEnum(PhaseType)
  type: PhaseType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(IntensityLevel)
  intensity: IntensityLevel;

  @IsNumber()
  @Min(0)
  @Max(5)
  loadMultiplier: number;

  @IsArray()
  @IsString({ each: true })
  focusAreas: string[];

  @IsNumber()
  @Min(1)
  @Max(7)
  trainingFrequency: number;

  @IsNumber()
  @Min(0)
  @Max(7)
  gameFrequency: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  recoveryRatio: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhaseObjectiveDto)
  objectives: PhaseObjectiveDto[];
}

export class LoadProgressionDto {
  @IsNumber()
  @Min(0)
  baseLoad: number;

  @IsNumber()
  @Min(1)
  @Max(52)
  peakWeek: number;

  @IsNumber()
  @Min(1)
  @Max(8)
  taperWeeks: number;

  @IsArray()
  @IsNumber({}, { each: true })
  recoveryWeeks: number[];
}

export class SeasonPlanMetadataDto {
  @IsUUID()
  createdBy: string;

  @IsDateString()
  lastModified: string;

  @IsNumber()
  @Min(1)
  version: number;
}

export class SeasonPlanDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsUUID()
  teamId: string;

  @IsUUID()
  organizationId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(['draft', 'active', 'completed', 'archived'])
  status: 'draft' | 'active' | 'completed' | 'archived';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanningPhaseDto)
  phases: PlanningPhaseDto[];

  @ValidateNested()
  @Type(() => LoadProgressionDto)
  loadProgression: LoadProgressionDto;

  @ValidateNested()
  @Type(() => SeasonPlanMetadataDto)
  metadata: SeasonPlanMetadataDto;
}

export class GetCurrentPhaseRequestDto {
  @IsUUID()
  teamId: string;
}

export class GetCurrentPhaseResponseDto {
  @ValidateNested()
  @Type(() => PlanningPhaseDto)
  @IsOptional()
  phase?: PlanningPhaseDto;

  @IsString()
  @IsOptional()
  message?: string;
}

export class GetSeasonPlanRequestDto {
  @IsUUID()
  teamId: string;
}

export class GetSeasonPlanResponseDto {
  @ValidateNested()
  @Type(() => SeasonPlanDto)
  @IsOptional()
  plan?: SeasonPlanDto;

  @IsString()
  @IsOptional()
  message?: string;
}

export class PhaseAdjustmentDto {
  @IsUUID()
  assignmentId: string;

  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType;

  originalValue: any;

  adjustedValue: any;

  @IsString()
  reason: string;

  @IsDateString()
  appliedAt: string;

  @IsString()
  appliedBy: string;
}

export class SyncPhaseAdjustmentsRequestDto {
  @IsUUID()
  teamId: string;

  @IsUUID()
  phaseId: string;

  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  playersToInclude?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(AdjustmentType, { each: true })
  adjustmentTypes?: AdjustmentType[];
}

export class SyncPhaseAdjustmentsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhaseAdjustmentDto)
  adjustments: PhaseAdjustmentDto[];

  @IsNumber()
  @Min(0)
  assignmentsUpdated: number;

  @IsString()
  @IsOptional()
  message?: string;
}

export class PhaseTemplateCustomizationDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  loadMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  trainingFrequency?: number;

  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  intensityAdjustment?: number;
}

export class ApplyPhaseTemplateRequestDto {
  @IsUUID()
  teamId: string;

  @IsUUID()
  templateId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PhaseTemplateCustomizationDto)
  customizations?: PhaseTemplateCustomizationDto;
}

export class ApplyPhaseTemplateResponseDto {
  @IsNumber()
  @Min(0)
  assignmentsCreated: number;

  @IsNumber()
  @Min(0)
  adjustmentsApplied: number;

  @IsBoolean()
  templateApplied: boolean;

  @IsString()
  @IsOptional()
  message?: string;
}

export class WorkloadDataDto {
  @IsUUID()
  playerId: string;

  @IsNumber()
  @Min(1)
  @Max(52)
  weekNumber: number;

  @IsNumber()
  @Min(0)
  totalLoad: number;

  @IsNumber()
  @Min(0)
  trainingLoad: number;

  @IsNumber()
  @Min(0)
  gameLoad: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  recoveryScore: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  readinessScore: number;

  @IsEnum(['low', 'medium', 'high'])
  injuryRisk: 'low' | 'medium' | 'high';
}

export class GetWorkloadAnalyticsRequestDto {
  @IsUUID()
  teamId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class GetWorkloadAnalyticsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkloadDataDto)
  workloadData: WorkloadDataDto[];

  @IsString()
  @IsOptional()
  message?: string;
}

export class TrainingCompletionDataDto {
  @IsUUID()
  playerId: string;

  @IsDateString()
  completedAt: string;

  @IsNumber()
  @Min(0)
  actualLoad: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  completionRate: number;

  @IsOptional()
  performance?: Record<string, number>;
}

export class NotifyTrainingCompletionRequestDto {
  @IsUUID()
  assignmentId: string;

  @ValidateNested()
  @Type(() => TrainingCompletionDataDto)
  completionData: TrainingCompletionDataDto;
}

export class SyncStatusResponseDto {
  @IsNumber()
  @Min(0)
  updatedAssignments: number;

  @IsNumber()
  @Min(0)
  newAdjustments: number;

  @IsArray()
  @IsString({ each: true })
  errors: string[];

  @IsString()
  @IsOptional()
  message?: string;
}