import { IsString, IsOptional, IsEnum, IsDateString, IsArray, IsUUID, IsBoolean, IsInt, ValidateNested, IsObject, MaxLength, ArrayMaxSize, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Enums for calendar events
export enum EventType {
  TRAINING = 'training',
  GAME = 'game',
  MEETING = 'meeting',
  MEDICAL = 'medical',
  EQUIPMENT = 'equipment',
  TEAM_EVENT = 'team_event',
  PERSONAL = 'personal',
  OTHER = 'other',
}

export enum EventStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum EventVisibility {
  PUBLIC = 'public',
  TEAM = 'team',
  PRIVATE = 'private',
  ROLE_BASED = 'role_based',
}

export enum ParticipantStatus {
  INVITED = 'invited',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  MAYBE = 'maybe',
  NOT_RESPONDED = 'not_responded',
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// Event DTOs
export class CreateEventDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(EventType)
  type!: EventType;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus = EventStatus.SCHEDULED;

  @IsOptional()
  @IsEnum(EventVisibility)
  visibility?: EventVisibility = EventVisibility.TEAM;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  onlineUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7) // Hex color
  color?: string;

  @IsUUID()
  organizationId!: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsUUID()
  createdBy!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(50, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  allowRsvp?: boolean = true;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxParticipants?: number;

  @IsOptional()
  @IsBoolean()
  sendReminders?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(5)
  @Min(0, { each: true })
  @Max(10080, { each: true }) // Max 7 days
  reminderMinutes?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants?: CreateParticipantDto[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  resourceIds?: string[];
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsEnum(EventVisibility)
  visibility?: EventVisibility;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  onlineUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(50, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  allowRsvp?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxParticipants?: number;

  @IsOptional()
  @IsBoolean()
  sendReminders?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(5)
  @Min(0, { each: true })
  @Max(10080, { each: true })
  reminderMinutes?: number[];
}

// Participant DTOs
export class CreateParticipantDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsEnum(ParticipantStatus)
  status?: ParticipantStatus = ParticipantStatus.INVITED;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateParticipantStatusDto {
  @IsEnum(ParticipantStatus)
  status!: ParticipantStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  responseMessage?: string;
}

// Recurring Event DTOs
export class CreateRecurringEventDto extends CreateEventDto {
  @ValidateNested()
  @Type(() => RecurrenceRuleDto)
  recurrenceRule!: RecurrenceRuleDto;
}

export class RecurrenceRuleDto {
  @IsEnum(RecurrenceFrequency)
  frequency!: RecurrenceFrequency;

  @IsInt()
  @Min(1)
  @Max(365)
  interval!: number;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  count?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  byWeekDay?: number[]; // 0 = Sunday, 6 = Saturday

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  byMonthDay?: number;

  @IsOptional()
  @IsArray()
  @IsDateString({ each: true })
  exceptions?: string[];
}

// Conflict Check DTO
export class CheckConflictsDto {
  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  participantIds!: string[];

  @IsOptional()
  @IsUUID()
  excludeEventId?: string;
}

// Bulk Add Participants DTO
export class BulkAddParticipantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants!: CreateParticipantDto[];
}

// Resource Enums
export enum ResourceType {
  FACILITY = 'facility',
  EQUIPMENT = 'equipment',
  STAFF = 'staff',
  VEHICLE = 'vehicle',
  ROOM = 'room',
  ICE_RINK = 'ice_rink',
  GYM = 'gym',
  FIELD = 'field',
  OTHER = 'other',
}

export enum ResourceStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
  RETIRED = 'retired',
}

// Resource DTOs
export class CreateResourceDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(ResourceType)
  type!: ResourceType;

  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus = ResourceStatus.AVAILABLE;

  @IsUUID()
  organizationId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  building?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  floor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  roomNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsObject()
  availability?: Record<string, any>;

  @IsOptional()
  @IsObject()
  maintenanceSchedule?: Record<string, any>;

  @IsOptional()
  @IsObject()
  bookingRules?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  approverIds?: string[];
}

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  building?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  floor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  roomNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsObject()
  availability?: Record<string, any>;

  @IsOptional()
  @IsObject()
  maintenanceSchedule?: Record<string, any>;

  @IsOptional()
  @IsObject()
  bookingRules?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  approverIds?: string[];
}

// Resource Availability Check DTO
export class CheckResourceAvailabilityDto {
  @IsUUID()
  resourceId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsUUID()
  excludeBookingId?: string;
}

// Resource Booking DTOs
export class CreateResourceBookingDto {
  @IsUUID()
  eventId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsUUID()
  bookedBy!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  purpose?: string;
}

export class ApproveBookingDto {
  @IsUUID()
  approvedBy!: string;
}

export class CancelBookingDto {
  @IsUUID()
  cancelledBy!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}