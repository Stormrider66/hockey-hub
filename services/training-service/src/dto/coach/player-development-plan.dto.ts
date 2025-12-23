// @ts-nocheck - Player development plan DTOs with complex validation
import {
  IsString,
  IsUUID,
  IsDate,
  IsEnum,
  IsObject,
  IsOptional,
  IsInt,
  IsArray,
  ArrayMinSize,
  Min,
  Max,
  MaxLength,
  ValidateNested,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsNumber,
  IsUrl,
  IsBoolean
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { 
  DevelopmentPlanStatus, 
  GoalStatus, 
  GoalCategory, 
  MilestoneStatus, 
  CommunicationMethod, 
  ExternalResourceType 
} from '../../entities/PlayerDevelopmentPlan';

@ValidatorConstraint({ name: 'requiresValidStartDate', async: false })
class RequiresValidStartDateConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj: any = args.object;
    const sd = obj?.startDate;
    return sd instanceof Date && !Number.isNaN(sd.getTime());
  }
  defaultMessage(): string {
    return 'startDate must be a valid Date';
  }
}

// Nested validation classes for complex JSONB structures
export class CurrentLevelDto {
  @IsNumber()
  @Min(1)
  @Max(100)
  overallRating: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  strengths: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  weaknesses: string[];

  @IsString()
  @MaxLength(50)
  recentEvaluation: string; // Evaluation ID
}

export class DevelopmentGoalDto {
  @IsString()
  @MaxLength(50)
  id: string;

  @IsEnum(['technical', 'tactical', 'physical', 'mental'])
  category: GoalCategory;

  @IsString()
  @MaxLength(255)
  skill: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  currentLevel: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  targetLevel: number;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  deadline: Date;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  specificActions: string[];

  @IsString()
  @MaxLength(255)
  measurementMethod: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number; // percentage

  @IsEnum(['not_started', 'in_progress', 'completed', 'delayed'])
  status: GoalStatus;
}

export class WeeklyPlanDto {
  @IsInt()
  @Min(1)
  @Max(52)
  week: number;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  focus: string[];

  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  drills: string[]; // Drill IDs

  @IsObject()
  targetMetrics: any;

  @IsOptional()
  @IsObject()
  actualMetrics?: any;
}

export class MilestoneDto {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsString()
  @MaxLength(100)
  metric: string;

  @IsNumber()
  target: number;

  @IsOptional()
  @IsNumber()
  achieved?: number;

  @IsEnum(['pending', 'achieved', 'missed'])
  status: MilestoneStatus;
}

export class ParentCommunicationDto {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsEnum(['meeting', 'email', 'phone'])
  method: CommunicationMethod;

  @IsString()
  @MaxLength(1000)
  summary: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  nextFollowUp?: Date;
}

export class ExternalResourceDto {
  @IsEnum(['video', 'article', 'course', 'camp'])
  type: ExternalResourceType;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  assignedDate: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  completedDate?: Date;
}

// Main DTOs
export class CreateDevelopmentPlanDto {
  @IsUUID()
  playerId: string;

  @IsUUID()
  coachId: string;

  @IsUUID()
  @Validate(RequiresValidStartDateConstraint)
  seasonId: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsDate()
  @Validate(RequiresValidStartDateConstraint)
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @IsObject()
  @ValidateNested()
  @Type(() => CurrentLevelDto)
  currentLevel: CurrentLevelDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DevelopmentGoalDto)
  goals: DevelopmentGoalDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WeeklyPlanDto)
  weeklyPlan: WeeklyPlanDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones: MilestoneDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParentCommunicationDto)
  parentCommunication?: ParentCommunicationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalResourceDto)
  externalResources?: ExternalResourceDto[];

  @IsOptional()
  @IsEnum(['active', 'paused', 'completed', 'archived'])
  status?: DevelopmentPlanStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateDevelopmentPlanDto {
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  endDate?: Date;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CurrentLevelDto)
  currentLevel?: CurrentLevelDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DevelopmentGoalDto)
  goals?: DevelopmentGoalDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyPlanDto)
  weeklyPlan?: WeeklyPlanDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParentCommunicationDto)
  parentCommunication?: ParentCommunicationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalResourceDto)
  externalResources?: ExternalResourceDto[];

  @IsOptional()
  @IsEnum(['active', 'paused', 'completed', 'archived'])
  status?: DevelopmentPlanStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class DevelopmentPlanResponseDto {
  id: string;
  playerId: string;
  coachId: string;
  seasonId: string;
  startDate: Date;
  endDate: Date;
  currentLevel: any; // Full CurrentLevel object
  goals: any[]; // Full DevelopmentGoal objects
  weeklyPlan: any[]; // Full WeeklyPlan objects
  milestones: any[]; // Full Milestone objects
  parentCommunication?: any[]; // Full ParentCommunication objects
  externalResources?: any[]; // Full ExternalResource objects
  status: DevelopmentPlanStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Additional utility DTOs for specific operations
export class AddGoalDto {
  @IsEnum(['technical', 'tactical', 'physical', 'mental'])
  category: GoalCategory;

  @IsString()
  @MaxLength(255)
  skill: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  currentLevel: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  targetLevel: number;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  deadline: Date;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  specificActions: string[];

  @IsString()
  @MaxLength(255)
  measurementMethod: string;
}

export class UpdateGoalProgressDto {
  @IsString()
  @MaxLength(50)
  goalId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @IsEnum(['not_started', 'in_progress', 'completed', 'delayed'])
  status: GoalStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class AddMilestoneDto {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsString()
  @MaxLength(100)
  metric: string;

  @IsNumber()
  target: number;
}

export class CompleteMilestoneDto {
  @IsNumber()
  achieved: number;

  @IsEnum(['achieved', 'missed'])
  status: MilestoneStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}