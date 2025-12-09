import { 
  IsString, 
  IsUUID, 
  IsDateString, 
  IsEnum, 
  IsObject, 
  IsOptional, 
  IsInt, 
  IsArray, 
  Min, 
  Max, 
  MaxLength, 
  ValidateNested,
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

// Nested validation classes for complex JSONB structures
export class CurrentLevelDto {
  @IsNumber()
  @Min(1)
  @Max(100)
  overallRating: number;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  strengths: string[];

  @IsArray()
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

  @IsDateString()
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
  @IsDateString()
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
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsEnum(['meeting', 'email', 'phone'])
  method: CommunicationMethod;

  @IsString()
  @MaxLength(1000)
  summary: string;

  @IsOptional()
  @IsDateString()
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

  @IsDateString()
  @Transform(({ value }) => new Date(value))
  assignedDate: Date;

  @IsOptional()
  @IsDateString()
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
  seasonId: string;

  @IsDateString()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsDateString()
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @IsObject()
  @ValidateNested()
  @Type(() => CurrentLevelDto)
  currentLevel: CurrentLevelDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DevelopmentGoalDto)
  goals: DevelopmentGoalDto[];

  @IsArray()
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
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  startDate?: Date;

  @IsOptional()
  @IsDateString()
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

  @IsDateString()
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
  @IsDateString()
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