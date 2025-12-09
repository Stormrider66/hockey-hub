// Session and Workout Types for Physical Trainer

import { BaseEntity } from './base-types';
import type { StrengthWorkout } from './strength.types';
import type { IntervalProgram } from './conditioning.types';
import type { HybridProgram } from './hybrid.types';
import type { AgilityProgram } from './agility.types';

// Core workout types
export enum WorkoutType {
  STRENGTH = 'strength',
  CONDITIONING = 'conditioning',
  HYBRID = 'hybrid',
  AGILITY = 'agility'
}

// Main workout session interface
export interface WorkoutSession extends BaseEntity {
  name: string;
  description?: string;
  type: WorkoutType;
  date: string; // ISO date string
  time?: string; // Time string (HH:mm)
  duration: number; // in minutes
  location?: string;
  
  // Assignment information
  assignedPlayerIds: string[];
  assignedTeamIds: string[];
  
  // Status and tracking
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  
  // Type-specific workout data
  strengthWorkout?: StrengthWorkout;
  intervalProgram?: IntervalProgram;
  hybridWorkout?: HybridProgram;
  agilityWorkout?: AgilityProgram;
  
  // Additional metadata
  intensity?: 'low' | 'medium' | 'high' | 'max';
  equipment?: string[];
  tags?: string[];
  notes?: string;
  
  // Coach information
  createdBy: string;
  assignedCoach?: string;
  
  // Execution tracking
  startedAt?: string;
  completedAt?: string;
  participantCount?: number;
  averageRating?: number;
  
  // Medical considerations
  medicalRestrictions?: string[];
  modifications?: string[];
}

// Workout session summary for lists/cards
export interface WorkoutSessionSummary {
  id: string | number;
  name: string;
  type: WorkoutType;
  date: string;
  time?: string;
  duration: number;
  playerCount: number;
  teamNames: string[];
  status: WorkoutSession['status'];
  intensity?: WorkoutSession['intensity'];
  location?: string;
  hasConflicts?: boolean;
}

// Session creation/edit form data
export interface WorkoutSessionFormData {
  name: string;
  description?: string;
  type: WorkoutType;
  date: string;
  time?: string;
  duration: number;
  location?: string;
  assignedPlayerIds: string[];
  assignedTeamIds: string[];
  intensity?: 'low' | 'medium' | 'high' | 'max';
  equipment?: string[];
  tags?: string[];
  notes?: string;
  
  // Type-specific data (one will be populated based on type)
  strengthWorkout?: Partial<StrengthWorkout>;
  intervalProgram?: Partial<IntervalProgram>;
  hybridWorkout?: Partial<HybridProgram>;
  agilityWorkout?: Partial<AgilityProgram>;
}

// Session execution state
export interface SessionExecution extends BaseEntity {
  sessionId: string;
  startTime: string;
  endTime?: string;
  status: 'preparing' | 'active' | 'paused' | 'completed' | 'abandoned';
  currentPhase?: string;
  currentExercise?: string;
  progressPercentage: number;
  participantIds: string[];
  notes?: string[];
}

// Participant progress tracking
export interface ParticipantProgress extends BaseEntity {
  sessionExecutionId: string;
  participantId: string;
  participantName: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  completionPercentage: number;
  performanceMetrics?: Record<string, any>;
  feedback?: string;
  rating?: number; // 1-5
  effortLevel?: number; // RPE 1-10
}

// Session analytics and reporting
export interface SessionAnalytics {
  sessionId: string;
  participantCount: number;
  completionRate: number;
  averageRating: number;
  averageEffort: number;
  totalVolume?: number;
  averageHeartRate?: number;
  injuries?: number;
  feedback: string[];
  improvements: string[];
  concerns: string[];
}

// Session template for reuse
export interface SessionTemplateData {
  name: string;
  description?: string;
  type: WorkoutType;
  duration: number;
  targetPlayers?: 'all' | 'specific_teams' | 'specific_players';
  targetTeamIds?: string[];
  targetPlayerIds?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  equipment: string[];
  tags: string[];
  
  // Template-specific workout data
  strengthWorkout?: StrengthWorkout;
  intervalProgram?: IntervalProgram;
  hybridWorkout?: HybridProgram;
  agilityWorkout?: AgilityProgram;
  
  // Usage tracking
  usageCount: number;
  lastUsed?: string;
  averageRating?: number;
  isPublic: boolean;
  organizationId?: string;
}

// Workout configuration options
export interface WorkoutConfiguration {
  type: WorkoutType;
  allowModifications: boolean;
  requireCompletion: boolean;
  trackPerformance: boolean;
  enableRealTimeMonitoring: boolean;
  autoProgressions: boolean;
  medicalChecking: boolean;
  restTimerEnabled: boolean;
  audioCuesEnabled: boolean;
  videoGuidanceEnabled: boolean;
}

// Export utility types
export type SessionStatus = WorkoutSession['status'];
export type SessionPriority = WorkoutSession['priority'];
export type SessionIntensity = WorkoutSession['intensity'];
export type ExecutionStatus = SessionExecution['status'];
export type ParticipantStatus = ParticipantProgress['status'];

// Re-export for convenience
export { StrengthWorkout, IntervalProgram, HybridProgram, AgilityProgram };