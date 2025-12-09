// Unified Schedule Types

export enum EventType {
  TRAINING = 'training',
  ICE_PRACTICE = 'ice_practice',
  GAME = 'game',
  MEDICAL = 'medical',
  MEETING = 'meeting',
  PERSONAL = 'personal'
}

export interface EventConfig {
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badge: string;
  owner: string;
  viewLabel: string;
  launchLabel: string;
}

export const EVENT_CONFIG: Record<EventType, EventConfig> = {
  [EventType.TRAINING]: {
    icon: 'Dumbbell',
    color: '#3B82F6', // blue-500
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badge: 'Training',
    owner: 'physicalTrainer',
    viewLabel: 'View Workout',
    launchLabel: 'Start Training'
  },
  [EventType.ICE_PRACTICE]: {
    icon: 'Snowflake',
    color: '#06B6D4', // cyan-500
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    badge: 'Ice Time',
    owner: 'iceCoach',
    viewLabel: 'View Practice',
    launchLabel: 'Start Practice'
  },
  [EventType.GAME]: {
    icon: 'Trophy',
    color: '#10B981', // green-500
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badge: 'Game Day',
    owner: 'teamManager',
    viewLabel: 'Game Plan',
    launchLabel: 'Game Center'
  },
  [EventType.MEDICAL]: {
    icon: 'Heart',
    color: '#EF4444', // red-500
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badge: 'Medical',
    owner: 'medicalStaff',
    viewLabel: 'View Details',
    launchLabel: 'Start Session'
  },
  [EventType.MEETING]: {
    icon: 'Users',
    color: '#8B5CF6', // purple-500
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badge: 'Meeting',
    owner: 'coach',
    viewLabel: 'View Agenda',
    launchLabel: 'Join Meeting'
  },
  [EventType.PERSONAL]: {
    icon: 'User',
    color: '#F59E0B', // amber-500
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badge: 'Personal',
    owner: 'player',
    viewLabel: 'View Details',
    launchLabel: 'Start Activity'
  }
};

export interface ScheduleEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  participants: string[] | Participant[];
  intensity?: 'low' | 'medium' | 'high';
  owner?: string;
  metadata?: any;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  permissions?: EventPermissions;
  
  // Type-specific fields
  // Training
  workoutType?: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  exercises?: any[];
  
  // Ice Practice
  drills?: any[];
  focus?: string;
  lines?: any[];
  
  // Game
  opponent?: string;
  gameType?: 'regular' | 'playoff' | 'exhibition';
  homeAway?: 'home' | 'away';
  
  // Medical
  confidential?: boolean;
  appointmentType?: string;
  
  // Meeting
  agenda?: string[];
  meetingLink?: string;
}

export interface Participant {
  id: string;
  name: string;
  role?: string;
  status?: 'confirmed' | 'tentative' | 'declined';
  medical?: 'healthy' | 'limited' | 'injured';
}

export interface EventPermissions {
  canView: boolean;
  canEdit: boolean;
  canLaunch: boolean;
  canCancel: boolean;
}

export interface LaunchEventDto {
  id: string;
  role: string;
  action: string;
}

export interface LaunchResponse {
  success: boolean;
  redirectUrl?: string;
  message?: string;
}

export interface UpdateEventDto {
  id: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  participants?: string[];
  status?: ScheduleEvent['status'];
}

export type UserRole = 
  | 'player'
  | 'coach'
  | 'physicalTrainer'
  | 'iceCoach'
  | 'medicalStaff'
  | 'parent'
  | 'equipmentManager'
  | 'clubAdmin'
  | 'systemAdmin';

export const PERMISSION_MATRIX: Record<EventType, Record<string, string[]>> = {
  [EventType.TRAINING]: {
    view: ['all'],
    edit: ['physicalTrainer', 'systemAdmin'],
    launch: ['physicalTrainer', 'coach', 'player'],
    cancel: ['physicalTrainer', 'systemAdmin']
  },
  [EventType.ICE_PRACTICE]: {
    view: ['all'],
    edit: ['iceCoach', 'coach', 'systemAdmin'],
    launch: ['iceCoach', 'coach'],
    cancel: ['iceCoach', 'coach', 'systemAdmin']
  },
  [EventType.GAME]: {
    view: ['all'],
    edit: ['coach', 'clubAdmin', 'systemAdmin'],
    launch: ['coach', 'clubAdmin'],
    cancel: ['clubAdmin', 'systemAdmin']
  },
  [EventType.MEDICAL]: {
    view: ['medicalStaff', 'player', 'coach', 'parent'],
    edit: ['medicalStaff'],
    launch: ['medicalStaff'],
    cancel: ['medicalStaff']
  },
  [EventType.MEETING]: {
    view: ['all'],
    edit: ['coach', 'clubAdmin', 'systemAdmin'],
    launch: ['coach', 'clubAdmin'],
    cancel: ['coach', 'clubAdmin', 'systemAdmin']
  },
  [EventType.PERSONAL]: {
    view: ['player', 'parent'],
    edit: ['player'],
    launch: ['player'],
    cancel: ['player']
  }
};

export function hasPermission(
  eventType: EventType,
  action: keyof typeof PERMISSION_MATRIX[EventType],
  userRole: UserRole
): boolean {
  const permissions = PERMISSION_MATRIX[eventType][action];
  return permissions.includes('all') || permissions.includes(userRole);
}