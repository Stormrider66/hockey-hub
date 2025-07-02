import { IsString, IsOptional, IsEnum, IsDateString, IsArray, IsUUID, IsInt, Min, Max, IsBoolean, ValidateNested, IsNumber, IsObject, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkoutType, WorkoutStatus, ExerciseCategory, ExerciseUnit } from '../index';

export class CreateWorkoutSessionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(WorkoutType)
  type!: WorkoutType;

  @IsDateString()
  scheduledDate!: string;

  @IsString()
  @MaxLength(255)
  location!: string;

  @IsUUID()
  teamId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  playerIds!: string[];

  @IsInt()
  @Min(15)
  @Max(480) // 8 hours max
  estimatedDuration!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkoutSettingsDto)
  settings?: WorkoutSettingsDto;
}

export class WorkoutSettingsDto {
  @IsOptional()
  @IsBoolean()
  allowIndividualLoads?: boolean = true;

  @IsOptional()
  @IsEnum(['grid', 'focus', 'tv'])
  displayMode?: 'grid' | 'focus' | 'tv' = 'grid';

  @IsOptional()
  @IsBoolean()
  showMetrics?: boolean = true;

  @IsOptional()
  @IsBoolean()
  autoRotation?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  rotationInterval?: number = 30;
}

export class CreateExerciseDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsEnum(ExerciseCategory)
  category!: ExerciseCategory;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  sets?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  reps?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600) // 1 hour max
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600) // 10 minutes max
  restDuration?: number;

  @IsEnum(ExerciseUnit)
  unit!: ExerciseUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  equipment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;
}

export class UpdateExerciseDto extends CreateExerciseDto {
  @IsUUID()
  id!: string;
}

export class PlayerLoadDto {
  @IsUUID()
  playerId!: string;

  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  loadModifier!: number;

  @IsOptional()
  @IsObject()
  exerciseModifications?: Record<string, ExerciseModificationDto>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ExerciseModificationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  sets?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  reps?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  restDuration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class StartWorkoutDto {
  @IsUUID()
  sessionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceType?: string;
}

export class UpdateExerciseExecutionDto {
  @IsUUID()
  exerciseId!: string;

  @IsInt()
  @Min(1)
  setNumber!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  actualReps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualWeight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  actualDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualDistance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualPower?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  restTaken?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PerformanceMetricsDto)
  performanceMetrics?: PerformanceMetricsDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  skipped?: boolean;
}

export class PerformanceMetricsDto {
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(220)
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(220)
  maxHeartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  averagePower?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPower?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cadence?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rpe?: number; // Rate of Perceived Exertion
}

export class WorkoutFilterDto {
  @IsOptional()
  @IsEnum(WorkoutType)
  type?: WorkoutType;

  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsUUID()
  coachId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateWorkoutSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(WorkoutType)
  type?: WorkoutType;

  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  playerIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkoutSettingsDto)
  settings?: WorkoutSettingsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateExerciseDto)
  exercises?: UpdateExerciseDto[];
}

