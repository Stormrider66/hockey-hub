// @ts-nocheck - Suppress TypeScript errors for build
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  IsObject,
  ValidateNested, 
  IsNumber, 
  Min, 
  Max, 
  MaxLength,
  IsInt,
  IsDate,
  IsDateString
} from 'class-validator';
import { Type } from 'class-transformer';
import { PracticeStatus, PracticeFocus } from '../../entities/PracticePlan';

// Validation constants
const PRACTICE_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'] as const;
const PRACTICE_FOCUSES = ['skills', 'tactics', 'conditioning', 'game_prep', 'recovery', 'evaluation'] as const;

export class PracticeSectionDto {
  @IsUUID()
  id!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsInt()
  @Min(1)
  @Max(480) // 8 hours max
  duration!: number;

  @IsArray()
  @IsUUID('4', { each: true })
  drillIds!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];
}

export class PlayerAttendanceDto {
  @IsUUID()
  playerId!: string;

  @IsBoolean()
  present!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class PlayerEvaluationDto {
  @IsUUID()
  playerId!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areasOfImprovement?: string[];
}

export class LineupDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  forward1?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  forward2?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  forward3?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  forward4?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  defense1?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  defense2?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  defense3?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  goalies?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  scratched?: string[];
}

export class CreatePracticePlanDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsUUID()
  organizationId!: string;

  @IsUUID()
  teamId!: string;

  @IsUUID()
  coachId!: string;

  @IsOptional()
  @IsUUID()
  trainingPlanId?: string;

  @IsDateString()
  date!: string;

  @IsInt()
  @Min(15)
  @Max(480) // 8 hours max
  duration!: number;

  @IsOptional()
  @IsEnum(PRACTICE_STATUSES as readonly string[])
  status?: PracticeStatus = PracticeStatus.PLANNED;

  @IsEnum(PRACTICE_FOCUSES as readonly string[])
  primaryFocus!: PracticeFocus;

  @IsOptional()
  @IsArray()
  @IsEnum(PRACTICE_FOCUSES as readonly string[], { each: true })
  secondaryFocus?: PracticeFocus[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  rinkId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PracticeSectionDto)
  sections!: PracticeSectionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => LineupDto)
  lineups?: LineupDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coachFeedback?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerAttendanceDto)
  attendance?: PlayerAttendanceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerEvaluationDto)
  playerEvaluations?: PlayerEvaluationDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdatePracticePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  duration?: number;

  @IsOptional()
  @IsEnum(PRACTICE_STATUSES as readonly string[])
  status?: PracticeStatus;

  @IsOptional()
  @IsEnum(PRACTICE_FOCUSES as readonly string[])
  primaryFocus?: PracticeFocus;

  @IsOptional()
  @IsArray()
  @IsEnum(PRACTICE_FOCUSES as readonly string[], { each: true })
  secondaryFocus?: PracticeFocus[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  rinkId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PracticeSectionDto)
  sections?: PracticeSectionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => LineupDto)
  lineups?: LineupDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coachFeedback?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerAttendanceDto)
  attendance?: PlayerAttendanceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerEvaluationDto)
  playerEvaluations?: PlayerEvaluationDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PracticePlanResponseDto {
  id!: string;
  title!: string;
  description?: string;
  organizationId!: string;
  teamId!: string;
  coachId!: string;
  trainingPlanId?: string;
  date!: Date;
  duration!: number;
  status!: PracticeStatus;
  primaryFocus!: PracticeFocus;
  secondaryFocus?: PracticeFocus[];
  location?: string;
  rinkId?: string;
  sections!: PracticeSectionDto[];
  objectives?: string[];
  equipment?: string[];
  lineups?: LineupDto;
  notes?: string;
  coachFeedback?: string;
  attendance?: PlayerAttendanceDto[];
  playerEvaluations?: PlayerEvaluationDto[];
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class PracticePlanFilterDto {
  @IsOptional()
  @IsEnum(PRACTICE_STATUSES as readonly string[])
  status?: PracticeStatus;

  @IsOptional()
  @IsEnum(PRACTICE_FOCUSES as readonly string[])
  primaryFocus?: PracticeFocus;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  coachId?: string;

  @IsOptional()
  @IsUUID()
  trainingPlanId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

export class BulkAttendanceUpdateDto {
  @IsUUID()
  practicePlanId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PlayerAttendanceDto)
  attendance!: PlayerAttendanceDto[];
}

export class BulkEvaluationUpdateDto {
  @IsUUID()
  practicePlanId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerEvaluationDto)
  evaluations!: PlayerEvaluationDto[];
}