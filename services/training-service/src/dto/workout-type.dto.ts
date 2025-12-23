// @ts-nocheck - Workout type DTOs with complex validation
import { IsEnum, IsString, IsObject, IsBoolean, IsOptional, IsUUID, ValidateNested, IsNumber, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkoutType, MetricsConfig, EquipmentRequirement, ProgressionModel, SafetyProtocol } from '../entities/WorkoutType';

export class MetricsConfigDto implements MetricsConfig {
  @IsArray()
  @IsString({ each: true })
  primary: string[];

  @IsArray()
  @IsString({ each: true })
  secondary: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculatedMetricDto)
  calculated: CalculatedMetricDto[];
}

export class CalculatedMetricDto {
  @IsString()
  name: string;

  @IsString()
  formula: string;

  @IsString()
  unit: string;
}

export class EquipmentRequirementDto implements EquipmentRequirement {
  @IsArray()
  @IsString({ each: true })
  required: string[];

  @IsObject()
  alternatives: { [key: string]: string[] };

  @IsArray()
  @IsString({ each: true })
  optional: string[];
}

export class ProgressionLevelDto {
  @IsString()
  duration: string;

  @IsArray()
  @IsString({ each: true })
  focus: string[];

  @IsArray()
  @IsString({ each: true })
  goals: string[];
}

export class ProgressionModelDto implements ProgressionModel {
  @ValidateNested()
  @Type(() => ProgressionLevelDto)
  beginner: ProgressionLevelDto;

  @ValidateNested()
  @Type(() => ProgressionLevelDto)
  intermediate: ProgressionLevelDto;

  @ValidateNested()
  @Type(() => ProgressionLevelDto)
  advanced: ProgressionLevelDto;

  @ValidateNested()
  @Type(() => ProgressionLevelDto)
  elite: ProgressionLevelDto;
}

export class SafetyProtocolDto implements SafetyProtocol {
  @IsBoolean()
  warmupRequired: boolean;

  @IsNumber()
  @Min(0)
  warmupDuration: number;

  @IsBoolean()
  cooldownRequired: boolean;

  @IsNumber()
  @Min(0)
  cooldownDuration: number;

  @IsArray()
  @IsString({ each: true })
  contraindications: string[];

  @IsArray()
  @IsString({ each: true })
  injuryPrevention: string[];

  @IsArray()
  @IsString({ each: true })
  monitoringRequired: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  maxIntensity: number;

  @IsNumber()
  @Min(0)
  recoveryTime: number;
}

export class CreateWorkoutTypeConfigDto {
  @IsEnum(WorkoutType)
  workoutType: WorkoutType;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @Type(() => MetricsConfigDto)
  metricsConfig: MetricsConfigDto;

  @ValidateNested()
  @Type(() => EquipmentRequirementDto)
  equipmentRequirements: EquipmentRequirementDto;

  @ValidateNested()
  @Type(() => ProgressionModelDto)
  progressionModels: ProgressionModelDto;

  @ValidateNested()
  @Type(() => SafetyProtocolDto)
  safetyProtocols: SafetyProtocolDto;

  @IsObject()
  @IsOptional()
  customSettings?: Record<string, any>;
}

export class UpdateWorkoutTypeConfigDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @Type(() => MetricsConfigDto)
  @IsOptional()
  metricsConfig?: MetricsConfigDto;

  @ValidateNested()
  @Type(() => EquipmentRequirementDto)
  @IsOptional()
  equipmentRequirements?: EquipmentRequirementDto;

  @ValidateNested()
  @Type(() => ProgressionModelDto)
  @IsOptional()
  progressionModels?: ProgressionModelDto;

  @ValidateNested()
  @Type(() => SafetyProtocolDto)
  @IsOptional()
  safetyProtocols?: SafetyProtocolDto;

  @IsObject()
  @IsOptional()
  customSettings?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class WorkoutTypeConfigResponseDto {
  id: string;

  workoutType: WorkoutType;

  organizationId: string;

  name: string;

  description?: string;

  metricsConfig: MetricsConfig;

  equipmentRequirements: EquipmentRequirement;

  progressionModels: ProgressionModel;

  safetyProtocols: SafetyProtocol;

  customSettings?: Record<string, any>;

  isActive: boolean;

  usageCount: number;

  createdAt: Date;

  updatedAt: Date;

  createdBy?: string;

  updatedBy?: string;
}

export class WorkoutTypeStatisticsDto {
  totalConfigs: number;

  activeConfigs: number;

  mostUsed: Array<{ workoutType: WorkoutType; usageCount: number }>;

  recentlyUpdated: WorkoutTypeConfigResponseDto[];
}

export class ValidateMetricsDto {
  @IsObject()
  metrics: Record<string, any>;
}

export class MetricsValidationResponseDto {
  valid: boolean;

  errors: string[];
}

export class ProgressionRecommendationDto {
  currentLevel: any;

  nextLevel: any;

  recommendations: string[];
}