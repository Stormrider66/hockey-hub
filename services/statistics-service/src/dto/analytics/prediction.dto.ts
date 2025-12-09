import { IsUUID, IsEnum, IsDateString, IsOptional, IsNumber, Min, Max, ValidateNested, IsObject, IsArray, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PredictionType, PredictionTimeframe, ModelType } from '../../entities/PredictionData';

export class PredictionValueDto {
  @ApiProperty()
  value!: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class PredictionRangeDto {
  @ApiProperty()
  @IsNumber()
  min!: number;

  @ApiProperty()
  @IsNumber()
  max!: number;

  @ApiProperty()
  @IsNumber()
  mostLikely!: number;
}

export class ProbabilityDto {
  @ApiProperty()
  @IsString()
  outcome!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  probability!: number;
}

export class TimeSeriesPointDto {
  @ApiProperty()
  @IsDateString()
  timestamp!: string;

  @ApiProperty()
  @IsNumber()
  value!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence!: number;
}

export class RiskFactorDto {
  @ApiProperty()
  @IsString()
  factor!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  impact!: number;

  @ApiProperty()
  @IsString()
  description!: string;
}

export class ActionRecommendationDto {
  @ApiProperty()
  @IsString()
  action!: string;

  @ApiProperty({ enum: ['high', 'medium', 'low'] })
  @IsEnum(['high', 'medium', 'low'])
  priority!: 'high' | 'medium' | 'low';

  @ApiProperty()
  @IsString()
  impact!: string;

  @ApiProperty()
  @IsString()
  effort!: string;
}

export class CreatePredictionDto {
  @ApiProperty()
  @IsUUID()
  entityId!: string;

  @ApiProperty()
  @IsString()
  entityType!: string;

  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ enum: PredictionType })
  @IsEnum(PredictionType)
  predictionType!: PredictionType;

  @ApiProperty({ enum: PredictionTimeframe })
  @IsEnum(PredictionTimeframe)
  timeframe!: PredictionTimeframe;

  @ApiProperty({ enum: ModelType })
  @IsEnum(ModelType)
  modelType!: ModelType;

  @ApiProperty()
  @IsString()
  modelVersion!: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PredictionValueDto)
  prediction!: {
    value: any;
    unit?: string;
    category?: string;
    range?: PredictionRangeDto;
    probabilities?: ProbabilityDto[];
    timeSeries?: TimeSeriesPointDto[];
    factors?: Record<string, number>;
  };

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence!: number;

  @ApiProperty()
  @IsObject()
  features!: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class PredictionFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ enum: PredictionType })
  @IsOptional()
  @IsEnum(PredictionType)
  predictionType?: PredictionType;

  @ApiPropertyOptional({ enum: PredictionTimeframe })
  @IsOptional()
  @IsEnum(PredictionTimeframe)
  timeframe?: PredictionTimeframe;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minConfidence?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PredictionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  entityId!: string;

  @ApiProperty()
  entityType!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  predictionType!: PredictionType;

  @ApiProperty()
  timeframe!: PredictionTimeframe;

  @ApiProperty()
  modelType!: ModelType;

  @ApiProperty()
  modelVersion!: string;

  @ApiProperty()
  prediction!: any;

  @ApiProperty()
  confidence!: number;

  @ApiPropertyOptional()
  accuracy?: number;

  @ApiPropertyOptional()
  uncertainty?: number;

  @ApiProperty()
  features!: Record<string, any>;

  @ApiPropertyOptional()
  riskFactors?: {
    identified: RiskFactorDto[];
    mitigations: string[];
    riskScore: number;
  };

  @ApiPropertyOptional()
  recommendations?: {
    primary: string[];
    secondary: string[];
    actions: ActionRecommendationDto[];
  };

  @ApiPropertyOptional()
  explanations?: {
    reasoning: string;
    keyFactors: string[];
    methodology: string;
    limitations: string[];
  };

  @ApiPropertyOptional()
  validUntil?: Date;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PredictionAccuracyDto {
  @ApiProperty()
  predictionId!: string;

  @ApiProperty()
  actualValue!: any;

  @ApiProperty()
  accuracy!: number;

  @ApiProperty()
  error!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}