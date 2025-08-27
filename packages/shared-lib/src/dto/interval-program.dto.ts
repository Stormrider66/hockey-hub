import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsInt, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TargetMetricDto {
  @IsEnum(['absolute', 'percentage', 'zone'])
  type!: 'absolute' | 'percentage' | 'zone';

  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsEnum(['max', 'threshold', 'resting', 'ftp'])
  reference?: 'max' | 'threshold' | 'resting' | 'ftp';
}

export class IntervalTargetMetricsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TargetMetricDto)
  heartRate?: TargetMetricDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TargetMetricDto)
  watts?: TargetMetricDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TargetMetricDto)
  pace?: TargetMetricDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  rpm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  calories?: number;
}

export class IntervalSetDto {
  @IsString()
  id!: string;

  @IsEnum(['warmup', 'work', 'rest', 'active_recovery', 'cooldown'])
  type!: 'warmup' | 'work' | 'rest' | 'active_recovery' | 'cooldown';

  @IsInt()
  @Min(1)
  @Max(7200) // 2 hours max per interval
  duration!: number;

  @IsString()
  equipment!: string;

  @ValidateNested()
  @Type(() => IntervalTargetMetricsDto)
  targetMetrics!: IntervalTargetMetricsDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class IntervalProgramDto {
  @IsString()
  name!: string;

  @IsString()
  equipment!: string;

  @IsInt()
  @Min(1)
  totalDuration!: number;

  @IsInt()
  @Min(0)
  estimatedCalories!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntervalSetDto)
  intervals!: IntervalSetDto[];
}