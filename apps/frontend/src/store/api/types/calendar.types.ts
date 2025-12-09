// Calendar API Types - Extracted to prevent circular dependencies

export enum EventType {
  TRAINING = 'training',
  GAME = 'game',
  MEETING = 'meeting',
  MEDICAL = 'medical',
  EQUIPMENT = 'equipment',
  TEAM_EVENT = 'team_event',
  PERSONAL = 'personal',
  OTHER = 'other',
  PRACTICE = 'practice', // Keep for backward compatibility
  WORKOUT_SESSION = 'workout_session' // Keep for workout integration
}

export enum EventVisibility {
  PUBLIC = 'public',
  TEAM = 'team',
  PRIVATE = 'private',
  ROLE_BASED = 'role_based'
}

export enum EventStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export enum ParticipantStatus {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative',
  PENDING = 'pending',
  NO_RESPONSE = 'no_response'
}

export interface EventParticipant {
  user_id: string;
  status: ParticipantStatus;
}

export interface EventRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  endDate?: string;
  count?: number;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  type: EventType;
  start_date: string;
  end_date: string;
  location?: string;
  team_id?: string;
  organization_id: string;
  participants?: string[];
  visibility?: EventVisibility;
  recurrence?: EventRecurrence;
  workout_session_id?: string; // Link to workout session
  ice_time_id?: string; // Link to ice time booking
}

export interface Event extends CreateEventDto {
  id: string;
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants_details?: EventParticipant[];
  conflicts?: EventConflict[];
  live_session?: {
    active: boolean;
    participantCount: number;
    startedAt?: string;
  };
  // Enhanced workout metadata for calendar integration
  metadata?: {
    workoutId?: string;
    sessionId?: string;
    trainingType?: string;
    workoutType?: 'STRENGTH' | 'CARDIO' | 'SKILL' | 'RECOVERY' | 'MIXED' | 'CONDITIONING' | 'HYBRID' | 'AGILITY';
    estimatedDuration?: number; // minutes
    exercises?: any[];
    intervalProgram?: any;
    hybridProgram?: any;
    agilityProgram?: any;
    intensity?: string;
    focus?: string;
    equipment?: string[];
    targetMetrics?: {
      heartRateZone?: string;
      powerTarget?: number;
      expectedCalories?: number;
    };
    workoutPreview?: {
      type?: string;
      duration?: string;
      equipment?: string;
      intervals?: number;
      blocks?: number;
      drills?: number;
      exercises?: number;
      estimatedCalories?: number;
      intensity?: string;
      focus?: string;
    };
    programData?: {
      intervalProgram?: any;
      hybridProgram?: any;
      agilityProgram?: any;
      exercises?: any[];
    };
  };
  color?: string; // Color coding based on workout type
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  status?: EventStatus;
}

export interface EventConflict {
  event_id: string;
  type: 'time' | 'location' | 'participant';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface CalendarFilters {
  startDate: string;
  endDate: string;
  teamId?: string;
  organizationId?: string;
  eventTypes?: EventType[];
  participantId?: string;
}

export interface CalendarEvent extends Event {
  color?: string;
  textColor?: string;
}

export interface CreateIceTimeDto {
  rink_id: string;
  date: string;
  start_time: string;
  end_time: string;
  team_id?: string;
  event_type: 'practice' | 'game' | 'other';
  notes?: string;
}

export interface IceTime extends CreateIceTimeDto {
  id: string;
  booked_by: string;
  created_at: string;
  updated_at: string;
  cost?: number;
  status: 'confirmed' | 'tentative' | 'cancelled';
}