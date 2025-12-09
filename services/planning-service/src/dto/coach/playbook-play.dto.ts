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
  IsDate,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlayType, PlayAction } from '../../entities/PlaybookPlay';

// Validation constants
const PLAY_TYPES = ['breakout', 'forecheck', 'cycle', 'rush', 'faceoff', 'powerplay', 'penalty_kill'] as const;
const PLAY_ACTIONS = ['pass', 'carry', 'shoot', 'screen', 'retrieve', 'support'] as const;

export class PlaySequenceStepDto {
  @IsInt()
  @Min(1)
  @Max(20)
  stepNumber!: number;

  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsEnum(PLAY_ACTIONS as readonly string[])
  action!: PlayAction;

  @ValidateNested()
  @Type(() => Object)
  from!: { x: number; y: number };

  @ValidateNested()
  @Type(() => Object)
  to!: { x: number; y: number };

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  timing?: number;

  @IsString()
  @MaxLength(500)
  description!: string;
}

export class ContingencyDto {
  @IsString()
  @MaxLength(255)
  condition!: string;

  @IsString()
  @MaxLength(255)
  alternativeAction!: string;
}

export class PracticeNoteDto {
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @IsNumber()
  @Min(0)
  @Max(100)
  success_rate!: number;

  @IsString()
  @MaxLength(1000)
  notes!: string;
}

export class CreatePlaybookPlayDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsUUID()
  tacticalPlanId!: string;

  @IsEnum(PLAY_TYPES as readonly string[])
  type!: PlayType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaySequenceStepDto)
  sequence!: PlaySequenceStepDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContingencyDto)
  contingencies?: ContingencyDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coachingPoints?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PracticeNoteDto)
  practiceNotes?: PracticeNoteDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  usageCount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  successRate?: number = 0;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdatePlaybookPlayDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(PLAY_TYPES as readonly string[])
  type?: PlayType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaySequenceStepDto)
  sequence?: PlaySequenceStepDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContingencyDto)
  contingencies?: ContingencyDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coachingPoints?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PracticeNoteDto)
  practiceNotes?: PracticeNoteDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  usageCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  successRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PlaybookPlayResponseDto {
  id!: string;
  name!: string;
  tacticalPlanId!: string;
  type!: PlayType;
  sequence!: PlaySequenceStepDto[];
  contingencies?: ContingencyDto[];
  coachingPoints?: string;
  practiceNotes?: PracticeNoteDto[];
  usageCount!: number;
  successRate!: number;
  isActive!: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class PlaybookPlayFilterDto {
  @IsOptional()
  @IsEnum(PLAY_TYPES as readonly string[])
  type?: PlayType;

  @IsOptional()
  @IsUUID()
  tacticalPlanId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minSuccessRate?: number;
}

export class AddPracticeNoteDto {
  @IsUUID()
  playId!: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @IsNumber()
  @Min(0)
  @Max(100)
  success_rate!: number;

  @IsString()
  @MaxLength(1000)
  notes!: string;
}