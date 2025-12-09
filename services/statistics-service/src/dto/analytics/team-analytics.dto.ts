import { IsUUID, IsEnum, IsDateString, IsOptional, IsNumber, Min, Max, ValidateNested, IsObject, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalyticsPeriod, TeamMetricCategory } from '../../entities/TeamAnalyticsEnhanced';

export class TeamPerformanceMetricsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  wins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  losses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  winPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  goalsFor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  goalsAgainst?: number;

  [key: string]: any;
}

export class TeamFitnessMetricsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  averageVO2Max?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  averageVerticalJump?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  fitnessDistribution?: Record<string, number>;

  [key: string]: any;
}

export class TeamHealthMetricsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalInjuries?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  injuryRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  averageReadinessScore?: number;

  [key: string]: any;
}

export class CreateTeamAnalyticsDto {
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

  @ApiProperty({ enum: AnalyticsPeriod })
  @IsEnum(AnalyticsPeriod)
  period!: AnalyticsPeriod;

  @ApiProperty({ enum: TeamMetricCategory })
  @IsEnum(TeamMetricCategory)
  category!: TeamMetricCategory;

  @ApiProperty()
  @IsDateString()
  timestamp!: string;

  @ApiProperty()
  @IsNumber()
  playerCount!: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => TeamPerformanceMetricsDto)
  performanceMetrics!: TeamPerformanceMetricsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => TeamFitnessMetricsDto)
  fitnessMetrics!: TeamFitnessMetricsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => TeamHealthMetricsDto)
  healthMetrics!: TeamHealthMetricsDto;
}

export class TeamAnalyticsFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ enum: AnalyticsPeriod })
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod;

  @ApiPropertyOptional({ enum: TeamMetricCategory })
  @IsOptional()
  @IsEnum(TeamMetricCategory)
  category?: TeamMetricCategory;

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
}

export class TeamAnalyticsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  teamId!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  period!: AnalyticsPeriod;

  @ApiProperty()
  category!: TeamMetricCategory;

  @ApiProperty()
  timestamp!: Date;

  @ApiProperty()
  playerCount!: number;

  @ApiProperty()
  performanceMetrics!: TeamPerformanceMetricsDto;

  @ApiProperty()
  fitnessMetrics!: TeamFitnessMetricsDto;

  @ApiProperty()
  healthMetrics!: TeamHealthMetricsDto;

  @ApiPropertyOptional()
  comparisons?: Record<string, any>;

  @ApiPropertyOptional()
  predictions?: Record<string, any>;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TeamComparisonDto {
  @ApiProperty()
  teamId!: string;

  @ApiProperty()
  teamName!: string;

  @ApiProperty()
  metrics!: Record<string, number>;

  @ApiProperty()
  rankings!: Record<string, number>;

  @ApiProperty()
  percentiles!: Record<string, number>;
}

export class TeamInsightsDto {
  @ApiProperty()
  teamId!: string;

  @ApiProperty()
  period!: AnalyticsPeriod;

  @ApiProperty({ type: [String] })
  strengths!: string[];

  @ApiProperty({ type: [String] })
  weaknesses!: string[];

  @ApiProperty({ type: [String] })
  opportunities!: string[];

  @ApiProperty({ type: [String] })
  threats!: string[];

  @ApiProperty({ type: [String] })
  recommendations!: string[];
}