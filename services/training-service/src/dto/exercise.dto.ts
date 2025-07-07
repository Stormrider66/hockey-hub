import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsObject, MaxLength, IsInt, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExerciseCategory, ExerciseUnit } from '../entities';

export class CreateExerciseTemplateDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsEnum(ExerciseCategory)
  category!: ExerciseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(ExerciseUnit)
  primaryUnit!: ExerciseUnit;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  muscleGroups?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsObject()
  defaultParameters?: {
    sets?: number;
    reps?: number;
    duration?: number;
    restDuration?: number;
    intensityLevel?: 'low' | 'medium' | 'high' | 'max';
  };

  @IsOptional()
  @IsObject()
  progressionGuidelines?: {
    beginnerRange?: { min: number; max: number };
    intermediateRange?: { min: number; max: number };
    advancedRange?: { min: number; max: number };
    unit: string;
  };
}

export class UpdateExerciseTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(ExerciseCategory)
  category?: ExerciseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(ExerciseUnit)
  primaryUnit?: ExerciseUnit;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  muscleGroups?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsObject()
  defaultParameters?: {
    sets?: number;
    reps?: number;
    duration?: number;
    restDuration?: number;
    intensityLevel?: 'low' | 'medium' | 'high' | 'max';
  };

  @IsOptional()
  @IsObject()
  progressionGuidelines?: {
    beginnerRange?: { min: number; max: number };
    intermediateRange?: { min: number; max: number };
    advancedRange?: { min: number; max: number };
    unit: string;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ExerciseFilterDto {
  @IsOptional()
  @IsEnum(ExerciseCategory)
  category?: ExerciseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}