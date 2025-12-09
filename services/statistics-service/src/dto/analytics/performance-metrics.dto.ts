import { IsUUID, IsEnum, IsDateString, IsOptional, IsNumber, Min, Max, ValidateNested, IsObject, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetricType, MetricPeriod } from '../../entities/PerformanceMetrics';

export class MetricValueDto {
  @ApiProperty()
  @IsNumber()
  value!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class MetricsDataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxSquat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxBench?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  vo2Max?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sleepQuality?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hrv?: number;

  [key: string]: any;
}

export class ComparisonsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  teamAverage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  positionAverage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leagueAverage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  personalBest?: number;
}

export class CreatePerformanceMetricsDto {
  @ApiProperty()
  @IsUUID()
  playerId!: string;

  @ApiProperty()
  @IsUUID()
  teamId!: string;

  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  seasonId?: string;

  @ApiProperty({ enum: MetricType })
  @IsEnum(MetricType)
  metricType!: MetricType;

  @ApiProperty({ enum: MetricPeriod })
  @IsEnum(MetricPeriod)
  period!: MetricPeriod;

  @ApiProperty()
  @IsDateString()
  timestamp!: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => MetricsDataDto)
  metrics!: MetricsDataDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PerformanceMetricsFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ enum: MetricType })
  @IsOptional()
  @IsEnum(MetricType)
  metricType?: MetricType;

  @ApiPropertyOptional({ enum: MetricPeriod })
  @IsOptional()
  @IsEnum(MetricPeriod)
  period?: MetricPeriod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class PerformanceMetricsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  playerId!: string;

  @ApiProperty()
  teamId!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  metricType!: MetricType;

  @ApiProperty()
  period!: MetricPeriod;

  @ApiProperty()
  timestamp!: Date;

  @ApiProperty()
  metrics!: MetricsDataDto;

  @ApiPropertyOptional()
  performanceIndex?: number;

  @ApiPropertyOptional()
  trendValue?: number;

  @ApiPropertyOptional()
  percentileRank?: number;

  @ApiPropertyOptional()
  comparisons?: ComparisonsDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PerformanceTrendDto {
  @ApiProperty()
  playerId!: string;

  @ApiProperty()
  metricType!: MetricType;

  @ApiProperty({ type: [MetricValueDto] })
  dataPoints!: MetricValueDto[];

  @ApiProperty()
  trendDirection!: 'up' | 'down' | 'stable';

  @ApiProperty()
  changePercentage!: number;

  @ApiPropertyOptional()
  prediction?: MetricValueDto;
}

export class PlayerComparisonDto {
  @ApiProperty()
  playerId!: string;

  @ApiProperty()
  playerName!: string;

  @ApiProperty()
  metrics!: Record<string, number>;

  @ApiProperty()
  percentileRanks!: Record<string, number>;

  @ApiProperty()
  strengths!: string[];

  @ApiProperty()
  weaknesses!: string[];
}