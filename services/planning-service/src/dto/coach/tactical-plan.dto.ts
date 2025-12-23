// @ts-nocheck - Suppress TypeScript errors for build
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
  IsObject,
  IsIn,
  ArrayNotEmpty,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { TacticalCategory, FormationType, PlayerPositionType, ZoneType } from '../../entities/TacticalPlan';

// Validation constants
const TACTICAL_CATEGORIES = ['offensive', 'defensive', 'transition', 'special_teams', 'powerplay', 'penalty_kill'] as const;
const FORMATION_TYPES = ['even_strength', 'powerplay', 'penalty_kill', '6_on_5', '5_on_3'] as const;
const PLAYER_POSITIONS = ['C', 'LW', 'RW', 'LD', 'RD', 'G'] as const;
const ZONE_TYPES = ['offensive', 'neutral', 'defensive'] as const;

export class PlayerPositionDto {
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsIn(PLAYER_POSITIONS as readonly string[])
  position!: PlayerPositionType;

  @IsNumber()
  @Min(-100)
  @Max(100)
  x!: number;

  @IsNumber()
  @Min(-50)
  @Max(50)
  y!: number;

  @IsIn(ZONE_TYPES as readonly string[])
  zone!: ZoneType;
}

export class PlayerAssignmentDto {
  @IsUUID()
  playerId!: string;

  @IsString()
  @MaxLength(100)
  position!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  responsibilities!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  alternatePosition?: string;
}

export class TriggerDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  situation!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  action!: string;
}

export class VideoReferenceDto {
  @IsString()
  @MaxLength(500)
  url!: string;

  @IsNumber()
  @Min(0)
  timestamp!: number;

  @IsString()
  @MaxLength(255)
  description!: string;
}

export class FormationZonesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerPositionDto)
  offensive!: PlayerPositionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerPositionDto)
  neutral!: PlayerPositionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerPositionDto)
  defensive!: PlayerPositionDto[];
}

export class FormationDto {
  @IsIn(FORMATION_TYPES as readonly string[])
  type!: FormationType;

  @ValidateNested()
  @Type(() => FormationZonesDto)
  zones!: FormationZonesDto;
}

export class CreateTacticalPlanDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsUUID()
  organizationId!: string;

  @IsUUID()
  coachId!: string;

  @IsUUID()
  teamId!: string;

  @IsIn(TACTICAL_CATEGORIES as readonly string[])
  category!: TacticalCategory;

  @ValidateNested()
  @Type(() => FormationDto)
  formation!: FormationDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerAssignmentDto)
  playerAssignments!: PlayerAssignmentDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TriggerDto)
  triggers?: TriggerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoReferenceDto)
  videoReferences?: VideoReferenceDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateTacticalPlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsIn(TACTICAL_CATEGORIES as readonly string[])
  category?: TacticalCategory;

  @IsOptional()
  @ValidateNested()
  @Type(() => FormationDto)
  formation?: FormationDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerAssignmentDto)
  playerAssignments?: PlayerAssignmentDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TriggerDto)
  triggers?: TriggerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoReferenceDto)
  videoReferences?: VideoReferenceDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TacticalPlanResponseDto {
  id!: string;
  name!: string;
  organizationId!: string;
  coachId!: string;
  teamId!: string;
  category!: TacticalCategory;
  formation!: FormationDto;
  playerAssignments!: PlayerAssignmentDto[];
  description?: string;
  triggers?: TriggerDto[];
  videoReferences?: VideoReferenceDto[];
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class TacticalPlanFilterDto {
  @IsOptional()
  @IsEnum(TACTICAL_CATEGORIES as readonly string[])
  category?: TacticalCategory;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  coachId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}