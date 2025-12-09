// Shared types for Hockey Hub

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  PLAYER = 'PLAYER',
  COACH = 'COACH',
  PARENT = 'PARENT',
  MEDICAL_STAFF = 'MEDICAL_STAFF',
  EQUIPMENT_MANAGER = 'EQUIPMENT_MANAGER',
  PHYSICAL_TRAINER = 'PHYSICAL_TRAINER',
  CLUB_ADMIN = 'CLUB_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN'
}

// Workout types
export enum WorkoutType {
  STRENGTH = 'STRENGTH',
  CONDITIONING = 'CONDITIONING',
  HYBRID = 'HYBRID',
  AGILITY = 'AGILITY',
  FLEXIBILITY = 'FLEXIBILITY',
  RECOVERY = 'RECOVERY'
}

// WebSocket event types
export interface WebSocketEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// Training session events
export interface TrainingSessionEvent extends WebSocketEvent {
  type: 'session:join' | 'session:leave' | 'session:start' | 'session:end' | 
        'player:metrics:update' | 'exercise:progress' | 'interval:progress';
}

// Player metrics
export interface PlayerMetrics {
  playerId: string;
  heartRate?: number;
  power?: number;
  pace?: string;
  calories?: number;
  zone?: number;
  compliance?: number;
}

// Medical types
export interface MedicalRestriction {
  id: string;
  playerId: string;
  type: 'injury' | 'condition' | 'precaution';
  affectedArea: string;
  severity: 'mild' | 'moderate' | 'severe';
  restrictions: string[];
  startDate: Date;
  endDate?: Date;
}

// Export all types
export * from './training-session-events';
export * from './medical-events';
export * from './statistics-events';