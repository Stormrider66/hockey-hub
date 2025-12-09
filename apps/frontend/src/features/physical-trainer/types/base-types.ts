/**
 * Base Types for Physical Trainer
 * 
 * Core types shared across all Physical Trainer type definitions.
 * This file exists to prevent circular dependencies in the type system.
 */

// Base entity type used throughout the system
export interface BaseEntity {
  id: string | number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Player type (duplicated here to avoid circular imports)
export interface Player extends BaseEntity {
  name: string;
  number: number;
  position: string;
  teamId: string;
  teamIds?: string[]; // Support for multiple teams
  status: 'active' | 'injured' | 'inactive';
  photo?: string;
  age?: number;
}

// Team type (duplicated here to avoid circular imports)
export interface Team extends BaseEntity {
  name: string;
  level: 'youth' | 'junior' | 'senior' | 'professional';
  season?: 'preseason' | 'regular' | 'playoffs' | 'offseason';
  playerIds?: string[];
}

// Test result type (duplicated here to avoid circular imports)
export interface TestResult extends BaseEntity {
  playerId: string;
  playerName?: string;
  testBatchId: string;
  testType: TestType;
  value: number;
  unit: string;
  percentile?: number; // compared to team/league
  previousValue?: number;
  change?: number; // percentage change
  changeDirection?: 'improvement' | 'decline' | 'stable';
  notes?: string;
  conditions?: string; // testing conditions
  validator?: string; // who validated the test
}

export type TestType = 
  | 'verticalJump'
  | 'broadJump'
  | 'sprint10m'
  | 'sprint30m'
  | 'vo2Max'
  | 'benchPress1RM'
  | 'squat1RM'
  | 'deadlift1RM'
  | 'pullUps'
  | 'plank'
  | 'flexibility'
  | 'balanceTest'
  | 'reactionTime'
  | 'agility5105'
  | 'cooperTest'
  | 'yoyoTest'
  | 'custom';

// Workout session type placeholder (to avoid circular imports)
export type WorkoutSession = any;

// Additional types needed by analytics.types.ts
export interface PlayerReadiness extends BaseEntity {
  playerId: string;
  readinessScore: number; // 0-100
  physicalReadiness: number;
  mentalReadiness: number;
  recoveryStatus: 'recovered' | 'recovering' | 'needs-rest';
  lastUpdated: string;
  factors?: {
    sleep: number;
    nutrition: number;
    hydration: number;
    stress: number;
    fatigue: number;
  };
}

export interface WorkoutExecution extends BaseEntity {
  sessionId: string;
  playerId: string;
  startTime: string;
  endTime?: string;
  completionRate: number;
  performanceScore: number;
  rpe?: number; // Rate of Perceived Exertion
  notes?: string;
}

export interface OverallMetrics {
  totalWorkouts: number;
  averageAttendance: number;
  performanceIndex: number;
  injuryRate: number;
  readinessAverage: number;
}

// Workout type enum (duplicated to avoid circular imports)
export enum WorkoutType {
  STRENGTH = 'strength',
  CONDITIONING = 'conditioning',
  HYBRID = 'hybrid',
  AGILITY = 'agility'
}

// Base workout types (placeholders to avoid circular imports)
export type BaseWorkout = any;
export type StrengthWorkout = any;
export type ConditioningWorkout = any;
export type HybridWorkout = any;
export type AgilityWorkout = any;

// Additional types needed by batch-operations.types.ts
export interface PlayerAssignment {
  playerId: string;
  playerName?: string;
  loadPercentage?: number;
  modifications?: string[];
  role?: 'participant' | 'observer' | 'assistant';
}

export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
  severity?: 'error' | 'warning' | 'info';
}