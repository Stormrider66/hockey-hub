import { IsString, IsOptional, IsDateString, IsArray, IsUUID, IsInt, Min, Max, IsObject, MaxLength, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IntervalProgramDto } from './interval-program.dto';

const WORKOUT_TYPES = ['strength', 'cardio', 'skill', 'recovery', 'mixed'] as const;

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
  @Max(480)
  estimatedDuration!: number;

  @IsOptional()
  @IsObject()
  settings?: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => IntervalProgramDto)
  intervalProgram?: IntervalProgramDto;
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
}





