import { BaseEvent } from './EventBus';

// Event type constants
export const TRAINING_EVENTS = {
  WORKOUT_CREATED: 'training.workout.created',
  WORKOUT_COMPLETED: 'training.workout.completed',
  WORKOUT_UPDATED: 'training.workout.updated',
  WORKOUT_CANCELLED: 'training.workout.cancelled',
  INJURY_REPORTED: 'training.injury.reported',
  INJURY_RESOLVED: 'training.injury.resolved',
  PLAN_CREATED: 'training.plan.created',
  PLAN_UPDATED: 'training.plan.updated',
  PLAN_COMPLETED: 'training.plan.completed',
  MILESTONE_ACHIEVED: 'training.milestone.achieved',
  EXERCISE_ADDED: 'training.exercise.added',
  EXERCISE_REMOVED: 'training.exercise.removed'
} as const;

// Workout Events
export interface WorkoutCreatedData {
  workoutId: string;
  sessionTemplateId?: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  type: 'STRENGTH' | 'CARDIO' | 'SKILL' | 'RECOVERY';
  scheduledDate: Date;
  duration: number;
  exercises: {
    exerciseTemplateId: string;
    name: string;
    sets?: number;
    reps?: number;
    duration?: number;
  }[];
}

export interface WorkoutCompletedData {
  workoutId: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  completedAt: Date;
  totalDuration: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  performanceMetrics?: {
    averageHeartRate?: number;
    caloriesBurned?: number;
    playerLoad?: number;
  };
}

export interface WorkoutUpdatedData {
  workoutId: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface WorkoutCancelledData {
  workoutId: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  reason?: string;
  cancelledBy: string;
}

// Injury Events
export interface InjuryReportedData {
  injuryId: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  bodyPart: string;
  severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  type: string;
  occurredDuring?: string;
  workoutId?: string;
  reportedBy: string;
  estimatedRecoveryDays?: number;
}

export interface InjuryResolvedData {
  injuryId: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  resolvedBy: string;
  actualRecoveryDays: number;
  notes?: string;
}

// Training Plan Events
export interface PlanCreatedData {
  planId: string;
  name: string;
  playerId?: string;
  teamId?: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  goals: string[];
  sessionsPerWeek: number;
  createdBy: string;
}

export interface PlanUpdatedData {
  planId: string;
  organizationId: string;
  updatedBy: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface PlanCompletedData {
  planId: string;
  playerId?: string;
  teamId?: string;
  organizationId: string;
  completionDate: Date;
  sessionsCompleted: number;
  sessionsTotal: number;
  goalsAchieved: string[];
}

// Milestone Events
export interface MilestoneAchievedData {
  milestoneId: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  type: 'PERSONAL_BEST' | 'GOAL_REACHED' | 'STREAK' | 'CONSISTENCY' | 'IMPROVEMENT';
  name: string;
  description: string;
  value?: number;
  unit?: string;
  previousValue?: number;
  achievedAt: Date;
  relatedWorkoutId?: string;
}

// Exercise Events
export interface ExerciseAddedData {
  exerciseId: string;
  workoutId: string;
  playerId: string;
  organizationId: string;
  exerciseName: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
}

export interface ExerciseRemovedData {
  exerciseId: string;
  workoutId: string;
  playerId: string;
  organizationId: string;
  exerciseName: string;
  reason?: string;
}

// Type definitions for events
export type WorkoutCreatedEvent = BaseEvent<WorkoutCreatedData>;
export type WorkoutCompletedEvent = BaseEvent<WorkoutCompletedData>;
export type WorkoutUpdatedEvent = BaseEvent<WorkoutUpdatedData>;
export type WorkoutCancelledEvent = BaseEvent<WorkoutCancelledData>;
export type InjuryReportedEvent = BaseEvent<InjuryReportedData>;
export type InjuryResolvedEvent = BaseEvent<InjuryResolvedData>;
export type PlanCreatedEvent = BaseEvent<PlanCreatedData>;
export type PlanUpdatedEvent = BaseEvent<PlanUpdatedData>;
export type PlanCompletedEvent = BaseEvent<PlanCompletedData>;
export type MilestoneAchievedEvent = BaseEvent<MilestoneAchievedData>;
export type ExerciseAddedEvent = BaseEvent<ExerciseAddedData>;
export type ExerciseRemovedEvent = BaseEvent<ExerciseRemovedData>;

// Union type for all training events
export type TrainingEvent = 
  | WorkoutCreatedEvent
  | WorkoutCompletedEvent
  | WorkoutUpdatedEvent
  | WorkoutCancelledEvent
  | InjuryReportedEvent
  | InjuryResolvedEvent
  | PlanCreatedEvent
  | PlanUpdatedEvent
  | PlanCompletedEvent
  | MilestoneAchievedEvent
  | ExerciseAddedEvent
  | ExerciseRemovedEvent;