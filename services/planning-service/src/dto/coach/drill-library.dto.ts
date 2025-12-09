import { 
  IsString, 
  IsOptional, 
  IsUUID, 
  IsEnum, 
  IsBoolean, 
  IsArray, 
  ValidateNested, 
  IsNumber, 
  Min, 
  Max, 
  MaxLength,
  IsInt,
  IsUrl,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { DrillDifficulty, DrillType } from '../../entities/Drill';

// Validation constants
const DRILL_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'elite'] as const;
const DRILL_TYPES = ['warm_up', 'skill', 'tactical', 'conditioning', 'game', 'cool_down'] as const;
const RINK_AREAS = ['full', 'half', 'zone', 'corner', 'neutral'] as const;
const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior'] as const;

export class DrillSetupDto {
  @IsEnum(RINK_AREAS as readonly string[])
  rinkArea!: 'full' | 'half' | 'zone' | 'corner' | 'neutral';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagram?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  cones?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  pucks?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  otherEquipment?: string[];
}

export class DrillInstructionDto {
  @IsInt()
  @Min(1)
  @Max(20)
  step!: number;

  @IsString()
  @MaxLength(1000)
  description!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600) // 1 hour max per step
  duration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];
}

export class CreateDrillDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;

  @IsUUID()
  categoryId!: string;

  @IsEnum(DRILL_TYPES as readonly string[])
  type!: DrillType;

  @IsEnum(DRILL_DIFFICULTIES as readonly string[])
  difficulty!: DrillDifficulty;

  @IsInt()
  @Min(1)
  @Max(480) // 8 hours max
  duration!: number;

  @IsInt()
  @Min(1)
  @Max(50)
  minPlayers!: number;

  @IsInt()
  @Min(1)
  @Max(50)
  maxPlayers!: number;

  @IsArray()
  @IsString({ each: true })
  equipment!: string[];

  @ValidateNested()
  @Type(() => DrillSetupDto)
  setup!: DrillSetupDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrillInstructionDto)
  instructions!: DrillInstructionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(AGE_GROUPS as readonly string[], { each: true })
  ageGroups?: string[];

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsUrl()
  animationUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  usageCount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(0)
  ratingCount?: number = 0;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateDrillDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(DRILL_TYPES as readonly string[])
  type?: DrillType;

  @IsOptional()
  @IsEnum(DRILL_DIFFICULTIES as readonly string[])
  difficulty?: DrillDifficulty;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  minPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxPlayers?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DrillSetupDto)
  setup?: DrillSetupDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrillInstructionDto)
  instructions?: DrillInstructionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(AGE_GROUPS as readonly string[], { each: true })
  ageGroups?: string[];

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsUrl()
  animationUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  usageCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ratingCount?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class DrillResponseDto {
  id!: string;
  name!: string;
  description!: string;
  organizationId?: string;
  isPublic!: boolean;
  categoryId!: string;
  type!: DrillType;
  difficulty!: DrillDifficulty;
  duration!: number;
  minPlayers!: number;
  maxPlayers!: number;
  equipment!: string[];
  setup!: DrillSetupDto;
  instructions!: DrillInstructionDto[];
  objectives?: string[];
  keyPoints?: string[];
  variations?: string[];
  tags?: string[];
  ageGroups?: string[];
  videoUrl?: string;
  animationUrl?: string;
  usageCount!: number;
  rating!: number;
  ratingCount!: number;
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class DrillFilterDto {
  @IsOptional()
  @IsEnum(DRILL_TYPES as readonly string[])
  type?: DrillType;

  @IsOptional()
  @IsEnum(DRILL_DIFFICULTIES as readonly string[])
  difficulty?: DrillDifficulty;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  minPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  maxDuration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(AGE_GROUPS as readonly string[], { each: true })
  ageGroups?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsEnum(RINK_AREAS as readonly string[])
  rinkArea?: 'full' | 'half' | 'zone' | 'corner' | 'neutral';
}

export class RateDrillDto {
  @IsUUID()
  drillId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class DrillUsageDto {
  @IsUUID()
  drillId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  context?: string; // e.g., "practice", "training session"

  @IsOptional()
  @IsUUID()
  relatedEntityId?: string; // e.g., practice plan ID
}

export class BulkDrillOperationDto {
  @IsArray()
  @IsUUID('4', { each: true })
  drillIds!: string[];

  @IsEnum(['activate', 'deactivate', 'delete', 'public', 'private'])
  operation!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}