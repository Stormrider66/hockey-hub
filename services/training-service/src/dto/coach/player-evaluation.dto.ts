import { 
  IsString, 
  IsUUID, 
  IsDateString, 
  IsEnum, 
  IsObject, 
  IsOptional, 
  IsInt, 
  IsArray, 
  Min, 
  Max, 
  MaxLength, 
  ValidateNested,
  IsNumber
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EvaluationType } from '../../entities/PlayerEvaluation';

// Nested validation classes for complex JSONB structures
export class TechnicalSkillsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => SkatingSkillsDto)
  skating: SkatingSkillsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => PuckHandlingSkillsDto)
  puckHandling: PuckHandlingSkillsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ShootingSkillsDto)
  shooting: ShootingSkillsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => PassingSkillsDto)
  passing: PassingSkillsDto;
}

export class SkatingSkillsDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  forward: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  backward: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  acceleration: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  agility: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  speed: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  balance: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  edgeWork: number;
}

export class PuckHandlingSkillsDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  carrying: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  protection: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  deking: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  receiving: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  inTraffic: number;
}

export class ShootingSkillsDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  wristShot: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  slapShot: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  snapshot: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  backhand: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  accuracy: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  release: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  power: number;
}

export class PassingSkillsDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  forehand: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  backhand: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  saucer: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  accuracy: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  timing: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  vision: number;
}

export class TacticalSkillsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => OffensiveSkillsDto)
  offensive: OffensiveSkillsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => DefensiveSkillsDto)
  defensive: DefensiveSkillsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => TransitionSkillsDto)
  transition: TransitionSkillsDto;
}

export class OffensiveSkillsDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  positioning: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  spacing: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  timing: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  creativity: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  finishing: number;
}

export class DefensiveSkillsDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  positioning: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  gapControl: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  stickPosition: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  bodyPosition: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  anticipation: number;
}

export class TransitionSkillsDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  breakouts: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  rushes: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  tracking: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  backchecking: number;
}

export class PhysicalAttributesDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  strength: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  speed: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  endurance: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  flexibility: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  balance: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  coordination: number;
}

export class MentalAttributesDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  hockeyIQ: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  competitiveness: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  workEthic: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  coachability: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  leadership: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  teamwork: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  discipline: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  confidence: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  focusUnderPressure: number;
}

export class GameSpecificNotesDto {
  @IsInt()
  @Min(0)
  gamesObserved: number;

  @IsInt()
  @Min(0)
  goals: number;

  @IsInt()
  @Min(0)
  assists: number;

  @IsInt()
  plusMinus: number;

  @IsInt()
  @Min(0)
  penaltyMinutes: number;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  keyMoments: string[];
}

export class DevelopmentPriorityDto {
  @IsInt()
  @Min(1)
  @Max(5)
  priority: number;

  @IsString()
  @MaxLength(255)
  skill: string;

  @IsString()
  @MaxLength(1000)
  targetImprovement: string;

  @IsString()
  @MaxLength(100)
  timeline: string;
}

// Main DTOs
export class CreatePlayerEvaluationDto {
  @IsUUID()
  playerId: string;

  @IsUUID()
  coachId: string;

  @IsUUID()
  teamId: string;

  @IsDateString()
  @Transform(({ value }) => new Date(value))
  evaluationDate: Date;

  @IsEnum(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice'])
  type: EvaluationType;

  @IsObject()
  @ValidateNested()
  @Type(() => TechnicalSkillsDto)
  technicalSkills: TechnicalSkillsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => TacticalSkillsDto)
  tacticalSkills: TacticalSkillsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => PhysicalAttributesDto)
  physicalAttributes: PhysicalAttributesDto;

  @IsObject()
  @ValidateNested()
  @Type(() => MentalAttributesDto)
  mentalAttributes: MentalAttributesDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  strengths?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  areasForImprovement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  coachComments?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GameSpecificNotesDto)
  gameSpecificNotes?: GameSpecificNotesDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DevelopmentPriorityDto)
  developmentPriorities: DevelopmentPriorityDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  overallRating?: number;

  @IsOptional()
  @IsEnum(['Elite', 'High', 'Average', 'Depth'])
  potential?: string;
}

export class UpdatePlayerEvaluationDto {
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  evaluationDate?: Date;

  @IsOptional()
  @IsEnum(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice'])
  type?: EvaluationType;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TechnicalSkillsDto)
  technicalSkills?: TechnicalSkillsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TacticalSkillsDto)
  tacticalSkills?: TacticalSkillsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PhysicalAttributesDto)
  physicalAttributes?: PhysicalAttributesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MentalAttributesDto)
  mentalAttributes?: MentalAttributesDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  strengths?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  areasForImprovement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  coachComments?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GameSpecificNotesDto)
  gameSpecificNotes?: GameSpecificNotesDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DevelopmentPriorityDto)
  developmentPriorities?: DevelopmentPriorityDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  overallRating?: number;

  @IsOptional()
  @IsEnum(['Elite', 'High', 'Average', 'Depth'])
  potential?: string;
}

export class PlayerEvaluationResponseDto {
  id: string;
  playerId: string;
  coachId: string;
  teamId: string;
  evaluationDate: Date;
  type: EvaluationType;
  technicalSkills: any; // Will be the full object structure
  tacticalSkills: any;
  physicalAttributes: any;
  mentalAttributes: any;
  strengths?: string;
  areasForImprovement?: string;
  coachComments?: string;
  gameSpecificNotes?: any;
  developmentPriorities: any[];
  overallRating?: number;
  potential?: string;
  createdAt: Date;
  updatedAt: Date;
}