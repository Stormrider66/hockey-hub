import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsArray, IsObject, IsBoolean, IsUUID, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateCategory, TemplateVisibility, DifficultyLevel } from '../entities/SessionTemplate';
import { WorkoutType } from '../entities/WorkoutType';

export class ExerciseInTemplateDto {
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsInt()
  @Min(1)
  sets: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsNumber()
  distance?: number;

  @IsInt()
  @Min(0)
  restBetweenSets: number;

  @IsInt()
  @Min(0)
  order: number;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsObject()
  targetMetrics?: {
    heartRateZone?: string;
    rpe?: number;
    velocity?: number;
    power?: number;
  };
}

export class WarmupCooldownDto {
  @IsInt()
  @Min(1)
  duration: number;

  @IsArray()
  @IsString({ each: true })
  activities: string[];
}

export class TargetGroupsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ageGroups?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillLevels?: string[];
}

export class PermissionsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  canEdit?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  canView?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  canUse?: string[];
}

export class CreateSessionTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @IsEnum(WorkoutType)
  type: WorkoutType;

  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @IsEnum(TemplateVisibility)
  visibility: TemplateVisibility;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsInt()
  @Min(1)
  estimatedDuration: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseInTemplateDto)
  exercises: ExerciseInTemplateDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WarmupCooldownDto)
  warmup?: WarmupCooldownDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WarmupCooldownDto)
  cooldown?: WarmupCooldownDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TargetGroupsDto)
  targetGroups?: TargetGroupsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions?: PermissionsDto;
}

export class UpdateSessionTemplateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @IsOptional()
  @IsEnum(WorkoutType)
  type?: WorkoutType;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsEnum(TemplateVisibility)
  visibility?: TemplateVisibility;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseInTemplateDto)
  exercises?: ExerciseInTemplateDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WarmupCooldownDto)
  warmup?: WarmupCooldownDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WarmupCooldownDto)
  cooldown?: WarmupCooldownDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TargetGroupsDto)
  targetGroups?: TargetGroupsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions?: PermissionsDto;
}

export class DuplicateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class BulkAssignTemplateDto {
  @IsArray()
  @IsUUID('4', { each: true })
  playerIds: string[];

  @IsUUID()
  teamId: string;

  @IsArray()
  @IsString({ each: true })
  scheduledDates: string[];
}

export class SessionTemplateFilterDto {
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @IsOptional()
  @IsEnum(WorkoutType)
  type?: WorkoutType;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsEnum(TemplateVisibility)
  visibility?: TemplateVisibility;

  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}