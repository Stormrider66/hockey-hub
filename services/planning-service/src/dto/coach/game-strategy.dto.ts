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
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';

// Validation constants based on entity interfaces
const LINEUP_TYPES = ['even_strength', 'powerplay', 'penalty_kill', 'overtime', 'extra_attacker'] as const;
const PERIODS = [1, 2, 3, 'OT'] as const;

export class LineComboDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  forwards!: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  defense!: string[];

  @IsOptional()
  @IsUUID()
  goalie?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  chemistry!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minutesPlayed?: number;

  @IsOptional()
  @IsInt()
  plusMinus?: number;
}

export class MatchupDto {
  @IsString()
  @MaxLength(100)
  ourLine!: string;

  @IsString()
  @MaxLength(100)
  opposingLine!: string;

  @IsString()
  @MaxLength(500)
  strategy!: string;
}

export class SpecialInstructionDto {
  @IsUUID()
  playerId!: string;

  @IsArray()
  @IsString({ each: true })
  instructions!: string[];
}

export class KeyPlayerDto {
  @IsUUID()
  playerId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsArray()
  @IsString({ each: true })
  tendencies!: string[];

  @IsString()
  @MaxLength(500)
  howToDefend!: string;
}

export class GoalieTendenciesDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  gloveHigh!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  gloveLow!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  blockerHigh!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  blockerLow!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  fiveHole!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  wraparound!: number;
}

export class OpponentScoutingDto {
  @IsArray()
  @IsString({ each: true })
  strengths!: string[];

  @IsArray()
  @IsString({ each: true })
  weaknesses!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyPlayerDto)
  keyPlayers!: KeyPlayerDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GoalieTendenciesDto)
  goalieTendencies?: GoalieTendenciesDto;
}

export class LineupsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineComboDto)
  even_strength!: LineComboDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineComboDto)
  powerplay!: LineComboDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineComboDto)
  penalty_kill!: LineComboDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineComboDto)
  overtime?: LineComboDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineComboDto)
  extra_attacker?: LineComboDto[];
}

export class PeriodAdjustmentDto {
  @IsEnum([1, 2, 3, 'OT'])
  period!: 1 | 2 | 3 | 'OT';

  @IsArray()
  @IsString({ each: true })
  adjustments!: string[];

  @IsOptional()
  @IsObject()
  lineChanges?: any;
}

export class GoalAnalysisDto {
  @IsString()
  @MaxLength(50)
  time!: string;

  @IsInt()
  @Min(1)
  @Max(4) // Including OT
  period!: number;

  @IsString()
  @MaxLength(255)
  scoredBy!: string;

  @IsArray()
  @IsString({ each: true })
  assists!: string[];

  @IsString()
  @MaxLength(255)
  situation!: string;

  @IsString()
  @MaxLength(1000)
  description!: string;

  @IsBoolean()
  preventable!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class PlayerPerformanceDto {
  @IsUUID()
  playerId!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  rating!: number;

  @IsString()
  @MaxLength(1000)
  notes!: string;
}

export class PostGameAnalysisDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalAnalysisDto)
  goalsFor!: GoalAnalysisDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalAnalysisDto)
  goalsAgainst!: GoalAnalysisDto[];

  @IsArray()
  @IsString({ each: true })
  whatWorked!: string[];

  @IsArray()
  @IsString({ each: true })
  whatDidntWork!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerPerformanceDto)
  playerPerformance!: PlayerPerformanceDto[];
}

export class CreateGameStrategyDto {
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  coachId!: string;

  @IsUUID()
  teamId!: string;

  @IsUUID()
  gameId!: string;

  @IsUUID()
  opponentTeamId!: string;

  @IsString()
  @MaxLength(255)
  opponentTeamName!: string;

  @ValidateNested()
  @Type(() => LineupsDto)
  lineups!: LineupsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchupDto)
  matchups?: MatchupDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialInstructionDto)
  specialInstructions?: SpecialInstructionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => OpponentScoutingDto)
  opponentScouting?: OpponentScoutingDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preGameSpeech?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeriodAdjustmentDto)
  periodAdjustments?: PeriodAdjustmentDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PostGameAnalysisDto)
  postGameAnalysis?: PostGameAnalysisDto;

  @IsOptional()
  @IsBoolean()
  gameCompleted?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateGameStrategyDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LineupsDto)
  lineups?: LineupsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchupDto)
  matchups?: MatchupDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialInstructionDto)
  specialInstructions?: SpecialInstructionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => OpponentScoutingDto)
  opponentScouting?: OpponentScoutingDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preGameSpeech?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeriodAdjustmentDto)
  periodAdjustments?: PeriodAdjustmentDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PostGameAnalysisDto)
  postGameAnalysis?: PostGameAnalysisDto;

  @IsOptional()
  @IsBoolean()
  gameCompleted?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GameStrategyResponseDto {
  id!: string;
  organizationId!: string;
  coachId!: string;
  teamId!: string;
  gameId!: string;
  opponentTeamId!: string;
  opponentTeamName!: string;
  lineups!: LineupsDto;
  matchups?: MatchupDto[];
  specialInstructions?: SpecialInstructionDto[];
  opponentScouting?: OpponentScoutingDto;
  preGameSpeech?: string;
  periodAdjustments?: PeriodAdjustmentDto[];
  postGameAnalysis?: PostGameAnalysisDto;
  gameCompleted!: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class GameStrategyFilterDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  coachId?: string;

  @IsOptional()
  @IsUUID()
  gameId?: string;

  @IsOptional()
  @IsUUID()
  opponentTeamId?: string;

  @IsOptional()
  @IsBoolean()
  gameCompleted?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class AddPeriodAdjustmentDto {
  @IsUUID()
  gameStrategyId!: string;

  @ValidateNested()
  @Type(() => PeriodAdjustmentDto)
  adjustment!: PeriodAdjustmentDto;
}

export class AddPlayerPerformanceDto {
  @IsUUID()
  gameStrategyId!: string;

  @ValidateNested()
  @Type(() => PlayerPerformanceDto)
  performance!: PlayerPerformanceDto;
}