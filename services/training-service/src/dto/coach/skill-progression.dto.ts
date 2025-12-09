import { 
  IsString, 
  IsUUID, 
  IsDateString, 
  IsObject, 
  IsOptional, 
  IsInt, 
  IsArray, 
  Min, 
  Max, 
  MaxLength, 
  ValidateNested,
  IsNumber,
  IsUrl
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Nested validation classes for complex JSONB structures
export class SkillMeasurementDto {
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsNumber()
  value: number;

  @IsString()
  @MaxLength(50)
  unit: string; // "km/h", "accuracy %", "reps"

  @IsOptional()
  @IsString()
  @MaxLength(255)
  testConditions?: string;

  @IsString()
  @MaxLength(50)
  evaluatorId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  videoReference?: string;
}

export class BenchmarksDto {
  @IsString()
  @MaxLength(50)
  ageGroup: string;

  @IsNumber()
  elite: number;

  @IsNumber()
  above_average: number;

  @IsNumber()
  average: number;

  @IsNumber()
  below_average: number;
}

export class DrillHistoryDto {
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsString()
  @MaxLength(50)
  drillId: string;

  @IsString()
  @MaxLength(255)
  drillName: string;

  @IsNumber()
  performance: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// Main DTOs
export class CreateSkillProgressionDto {
  @IsUUID()
  playerId: string;

  @IsUUID()
  coachId: string;

  @IsString()
  @MaxLength(255)
  skill: string; // "Wrist Shot", "Backward Crossovers"

  @IsString()
  @MaxLength(100)
  category: string; // "Shooting", "Skating"

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillMeasurementDto)
  measurements: SkillMeasurementDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BenchmarksDto)
  benchmarks?: BenchmarksDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrillHistoryDto)
  drillHistory?: DrillHistoryDto[];

  @IsOptional()
  @IsNumber()
  currentLevel?: number;

  @IsOptional()
  @IsNumber()
  targetLevel?: number;

  @IsOptional()
  @IsNumber()
  improvementRate?: number; // percentage per month

  @IsDateString()
  @Transform(({ value }) => new Date(value))
  startDate: Date;
}

export class UpdateSkillProgressionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  skill?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillMeasurementDto)
  measurements?: SkillMeasurementDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BenchmarksDto)
  benchmarks?: BenchmarksDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrillHistoryDto)
  drillHistory?: DrillHistoryDto[];

  @IsOptional()
  @IsNumber()
  currentLevel?: number;

  @IsOptional()
  @IsNumber()
  targetLevel?: number;

  @IsOptional()
  @IsNumber()
  improvementRate?: number;
}

export class SkillProgressionResponseDto {
  id: string;
  playerId: string;
  coachId: string;
  skill: string;
  category: string;
  measurements: any[]; // Full SkillMeasurement objects
  benchmarks?: any; // Full Benchmarks object
  drillHistory?: any[]; // Full DrillHistory objects
  currentLevel?: number;
  targetLevel?: number;
  improvementRate?: number;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Additional utility DTOs for specific operations
export class AddMeasurementDto {
  @IsNumber()
  value: number;

  @IsString()
  @MaxLength(50)
  unit: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  testConditions?: string;

  @IsString()
  @MaxLength(50)
  evaluatorId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  videoReference?: string;
}

export class UpdateMeasurementDto {
  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  testConditions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  videoReference?: string;
}

export class AddDrillPerformanceDto {
  @IsString()
  @MaxLength(50)
  drillId: string;

  @IsString()
  @MaxLength(255)
  drillName: string;

  @IsNumber()
  performance: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class SetTargetLevelDto {
  @IsNumber()
  targetLevel: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasoning?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  targetDate?: Date;
}

export class UpdateBenchmarksDto {
  @IsString()
  @MaxLength(50)
  ageGroup: string;

  @IsNumber()
  elite: number;

  @IsNumber()
  above_average: number;

  @IsNumber()
  average: number;

  @IsNumber()
  below_average: number;
}

export class SkillProgressionFilterDto {
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  skill?: string;

  @IsOptional()
  @IsDateString()
  startAfter?: Date;

  @IsOptional()
  @IsDateString()
  startBefore?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minImprovementRate?: number;

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

export class ProgressAnalysisDto {
  @IsUUID()
  skillProgressionId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  monthsBack?: number; // How many months to analyze
}

export class BulkMeasurementDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleMeasurementDto)
  measurements: SingleMeasurementDto[];
}

export class SingleMeasurementDto {
  @IsUUID()
  skillProgressionId: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  testConditions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}