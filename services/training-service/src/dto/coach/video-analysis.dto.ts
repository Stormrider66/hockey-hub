import { 
  IsString, 
  IsUUID, 
  IsEnum, 
  IsObject, 
  IsOptional, 
  IsInt, 
  IsArray, 
  Min, 
  Max, 
  MaxLength, 
  ValidateNested,
  IsNumber,
  IsUrl,
  IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  VideoAnalysisType, 
  ClipCategory, 
  ImportanceLevel 
} from '../../entities/VideoAnalysis';

// Nested validation classes for complex JSONB structures
export class VideoClipDto {
  @IsNumber()
  @Min(0)
  startTime: number; // seconds

  @IsNumber()
  @Min(0)
  endTime: number; // seconds

  @IsString()
  @MaxLength(255)
  title: string;

  @IsEnum(['positive', 'negative', 'neutral', 'teaching'])
  category: ClipCategory;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  players: string[]; // Player IDs involved

  @IsString()
  @MaxLength(1000)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  coachingPoints: string[];

  @IsOptional()
  @IsObject()
  drawingData?: any; // Telestrator/drawing overlay data
}

export class AnalysisPointDto {
  @IsNumber()
  @Min(0)
  timestamp: number;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsString()
  @MaxLength(100)
  category: string;

  @IsEnum(['high', 'medium', 'low'])
  importance: ImportanceLevel;
}

export class PlayerPerformanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisPointDto)
  positives: AnalysisPointDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisPointDto)
  improvements: AnalysisPointDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisPointDto)
  keyMoments: AnalysisPointDto[];
}

export class TeamAnalysisDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisPointDto)
  systemExecution: AnalysisPointDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisPointDto)
  breakdowns: AnalysisPointDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisPointDto)
  opportunities: AnalysisPointDto[];
}

// Main DTOs
export class CreateVideoAnalysisDto {
  @IsUUID()
  coachId: string;

  @IsUUID()
  playerId: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  gameId?: string;

  @IsUrl()
  @MaxLength(500)
  videoUrl: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsEnum(['game', 'practice', 'skills', 'tactical'])
  type: VideoAnalysisType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoClipDto)
  clips: VideoClipDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PlayerPerformanceDto)
  playerPerformance?: PlayerPerformanceDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TeamAnalysisDto)
  teamAnalysis?: TeamAnalysisDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  sharedWithPlayer?: boolean;

  @IsOptional()
  @IsBoolean()
  sharedWithTeam?: boolean;
}

export class UpdateVideoAnalysisDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(['game', 'practice', 'skills', 'tactical'])
  type?: VideoAnalysisType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoClipDto)
  clips?: VideoClipDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PlayerPerformanceDto)
  playerPerformance?: PlayerPerformanceDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TeamAnalysisDto)
  teamAnalysis?: TeamAnalysisDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  sharedWithPlayer?: boolean;

  @IsOptional()
  @IsBoolean()
  sharedWithTeam?: boolean;
}

export class VideoAnalysisResponseDto {
  id: string;
  coachId: string;
  playerId: string;
  teamId?: string;
  gameId?: string;
  videoUrl: string;
  title: string;
  type: VideoAnalysisType;
  clips: any[]; // Full VideoClip objects
  playerPerformance?: any; // Full PlayerPerformance object
  teamAnalysis?: any; // Full TeamAnalysis object
  summary?: string;
  tags?: string[];
  sharedWithPlayer: boolean;
  sharedWithTeam: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Additional utility DTOs for specific operations
export class AddVideoClipDto {
  @IsNumber()
  @Min(0)
  startTime: number;

  @IsNumber()
  @Min(0)
  endTime: number;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsEnum(['positive', 'negative', 'neutral', 'teaching'])
  category: ClipCategory;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  players: string[];

  @IsString()
  @MaxLength(1000)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  coachingPoints: string[];
}

export class UpdateVideoClipDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(['positive', 'negative', 'neutral', 'teaching'])
  category?: ClipCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  coachingPoints?: string[];

  @IsOptional()
  @IsObject()
  drawingData?: any;
}

export class ShareVideoAnalysisDto {
  @IsBoolean()
  sharedWithPlayer: boolean;

  @IsBoolean()
  sharedWithTeam: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shareMessage?: string;
}

export class VideoAnalysisFilterDto {
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsEnum(['game', 'practice', 'skills', 'tactical'])
  type?: VideoAnalysisType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;

  @IsOptional()
  @IsBoolean()
  sharedWithPlayer?: boolean;

  @IsOptional()
  @IsBoolean()
  sharedWithTeam?: boolean;

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

export class BulkShareDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  videoAnalysisIds: string[];

  @IsBoolean()
  sharedWithPlayer: boolean;

  @IsBoolean()
  sharedWithTeam: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shareMessage?: string;
}