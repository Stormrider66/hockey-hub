import { IsString, IsOptional, IsDateString, IsArray, IsUUID, IsInt, Min, Max, IsBoolean, ValidateNested, IsNumber, IsObject, MaxLength, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
// Allowed value lists for validation (runtime-safe; avoids circular type imports)
const WORKOUT_TYPES = ['strength', 'cardio', 'skill', 'recovery', 'mixed'] as const;
const WORKOUT_STATUSES = ['scheduled', 'active', 'completed', 'cancelled'] as const;
const EXERCISE_CATEGORIES = ['strength', 'cardio', 'skill', 'mobility', 'recovery'] as const;
const EXERCISE_UNITS = ['reps', 'seconds', 'meters', 'watts', 'kilograms'] as const;
import { IntervalProgramDto } from './interval-program.dto';

export class CreateWorkoutSessionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsIn(WORKOUT_TYPES as readonly string[])
  type!: (typeof WORKOUT_TYPES)[number];

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
  @IsObject()
  settings?: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => IntervalProgramDto)
  intervalProgram?: IntervalProgramDto;
}

export class CreateExerciseDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsIn(EXERCISE_CATEGORIES as readonly string[])
  category!: (typeof EXERCISE_CATEGORIES)[number];

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

  @IsIn(EXERCISE_UNITS as readonly string[])
  unit!: (typeof EXERCISE_UNITS)[number];

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

export class WorkoutFilterDto {
  @IsOptional()
  @IsIn(WORKOUT_TYPES as readonly string[])
  type?: (typeof WORKOUT_TYPES)[number];

  @IsOptional()
  @IsIn(WORKOUT_STATUSES as readonly string[])
  status?: (typeof WORKOUT_STATUSES)[number];

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
  @IsIn(WORKOUT_TYPES as readonly string[])
  type?: (typeof WORKOUT_TYPES)[number];

  @IsOptional()
  @IsIn(WORKOUT_STATUSES as readonly string[])
  status?: (typeof WORKOUT_STATUSES)[number];

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
  @IsObject()
  settings?: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateExerciseDto)
  exercises?: UpdateExerciseDto[];
}

