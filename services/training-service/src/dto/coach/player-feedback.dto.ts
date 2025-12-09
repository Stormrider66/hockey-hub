import { 
  IsString, 
  IsUUID, 
  IsEnum, 
  IsOptional, 
  IsArray, 
  MaxLength, 
  ValidateNested,
  IsBoolean,
  IsDateString,
  IsInt,
  Min,
  Max
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { 
  FeedbackType, 
  FeedbackTone, 
  FeedbackStatus 
} from '../../entities/PlayerFeedback';

// Main DTOs
export class CreatePlayerFeedbackDto {
  @IsUUID()
  playerId: string;

  @IsUUID()
  coachId: string;

  @IsEnum(['game', 'practice', 'general', 'behavioral', 'tactical'])
  type: FeedbackType;

  @IsOptional()
  @IsUUID()
  relatedEventId?: string; // Game or Practice ID

  @IsEnum(['positive', 'constructive', 'critical', 'mixed'])
  tone: FeedbackTone;

  @IsString()
  @MaxLength(3000)
  message: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  actionItems?: string[];

  @IsOptional()
  @IsBoolean()
  requiresResponse?: boolean;

  @IsOptional()
  @IsBoolean()
  parentVisible?: boolean;
}

export class UpdatePlayerFeedbackDto {
  @IsOptional()
  @IsEnum(['game', 'practice', 'general', 'behavioral', 'tactical'])
  type?: FeedbackType;

  @IsOptional()
  @IsUUID()
  relatedEventId?: string;

  @IsOptional()
  @IsEnum(['positive', 'constructive', 'critical', 'mixed'])
  tone?: FeedbackTone;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  message?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  actionItems?: string[];

  @IsOptional()
  @IsBoolean()
  requiresResponse?: boolean;

  @IsOptional()
  @IsBoolean()
  parentVisible?: boolean;

  @IsOptional()
  @IsEnum(['unread', 'read', 'acknowledged', 'discussed'])
  status?: FeedbackStatus;
}

export class PlayerFeedbackResponseDto {
  id: string;
  playerId: string;
  coachId: string;
  type: FeedbackType;
  relatedEventId?: string;
  tone: FeedbackTone;
  message: string;
  actionItems?: string[];
  requiresResponse: boolean;
  playerResponse?: string;
  playerResponseDate?: Date;
  parentVisible: boolean;
  status: FeedbackStatus;
  discussedInPerson?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Player response DTOs
export class PlayerResponseDto {
  @IsString()
  @MaxLength(2000)
  playerResponse: string;
}

export class MarkDiscussedDto {
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : new Date())
  discussedInPerson?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  discussionNotes?: string;
}

export class UpdateFeedbackStatusDto {
  @IsEnum(['unread', 'read', 'acknowledged', 'discussed'])
  status: FeedbackStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// Filtering and bulk operations DTOs
export class PlayerFeedbackFilterDto {
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsUUID()
  coachId?: string;

  @IsOptional()
  @IsEnum(['game', 'practice', 'general', 'behavioral', 'tactical'])
  type?: FeedbackType;

  @IsOptional()
  @IsEnum(['positive', 'constructive', 'critical', 'mixed'])
  tone?: FeedbackTone;

  @IsOptional()
  @IsEnum(['unread', 'read', 'acknowledged', 'discussed'])
  status?: FeedbackStatus;

  @IsOptional()
  @IsBoolean()
  requiresResponse?: boolean;

  @IsOptional()
  @IsBoolean()
  parentVisible?: boolean;

  @IsOptional()
  @IsUUID()
  relatedEventId?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: Date;

  @IsOptional()
  @IsDateString()
  createdBefore?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string; // Search in message content

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

export class BulkFeedbackDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  playerIds: string[];

  @IsUUID()
  coachId: string;

  @IsEnum(['game', 'practice', 'general', 'behavioral', 'tactical'])
  type: FeedbackType;

  @IsOptional()
  @IsUUID()
  relatedEventId?: string;

  @IsEnum(['positive', 'constructive', 'critical', 'mixed'])
  tone: FeedbackTone;

  @IsString()
  @MaxLength(3000)
  message: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  actionItems?: string[];

  @IsOptional()
  @IsBoolean()
  requiresResponse?: boolean;

  @IsOptional()
  @IsBoolean()
  parentVisible?: boolean;
}

export class BulkStatusUpdateDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  feedbackIds: string[];

  @IsEnum(['unread', 'read', 'acknowledged', 'discussed'])
  status: FeedbackStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// Template-based feedback DTOs
export class FeedbackTemplateDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(['game', 'practice', 'general', 'behavioral', 'tactical'])
  type: FeedbackType;

  @IsEnum(['positive', 'constructive', 'critical', 'mixed'])
  tone: FeedbackTone;

  @IsString()
  @MaxLength(3000)
  messageTemplate: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  defaultActionItems?: string[];

  @IsOptional()
  @IsBoolean()
  requiresResponse?: boolean;

  @IsOptional()
  @IsBoolean()
  parentVisible?: boolean;
}

export class CreateFromTemplateDto {
  @IsUUID()
  templateId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  playerIds: string[];

  @IsOptional()
  @IsUUID()
  relatedEventId?: string;

  @IsOptional()
  @IsObject()
  templateVariables?: { [key: string]: string }; // For template placeholders like {{playerName}}

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalMessage?: string; // To append to template
}

// Statistics and analytics DTOs
export class FeedbackStatsFilterDto {
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsUUID()
  coachId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}

export class PlayerFeedbackStatsDto {
  playerId: string;
  totalFeedback: number;
  byType: { [key in FeedbackType]: number };
  byTone: { [key in FeedbackTone]: number };
  byStatus: { [key in FeedbackStatus]: number };
  averageResponseTime?: number; // in hours
  responseRate?: number; // percentage
  discussionRate?: number; // percentage
}

export class CoachFeedbackStatsDto {
  coachId: string;
  totalFeedbackGiven: number;
  playersReachedCount: number;
  byType: { [key in FeedbackType]: number };
  byTone: { [key in FeedbackTone]: number };
  averagePlayerResponseTime?: number; // in hours
  overallResponseRate?: number; // percentage
}