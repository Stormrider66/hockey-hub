import type { Exercise } from '../types';
import type { IntervalSet } from './conditioning.types';

export type BlockType = 'exercise' | 'interval' | 'transition';

export interface HybridBlock {
  id: string;
  type: BlockType;
  name: string;
  duration: number; // in seconds
  orderIndex: number;
}

export interface ExerciseBlock extends HybridBlock {
  type: 'exercise';
  exercises: Exercise[];
  targetMuscleGroups?: string[];
  equipment?: string[];
}

export interface IntervalBlock extends HybridBlock {
  type: 'interval';
  intervals: IntervalSet[];
  equipment: string;
  totalWorkTime: number;
  totalRestTime: number;
}

export interface TransitionBlock extends HybridBlock {
  type: 'transition';
  transitionType: 'rest' | 'active_recovery' | 'equipment_change';
  activities?: string[];
  nextBlockPrep?: string;
}

export type HybridWorkoutBlock = ExerciseBlock | IntervalBlock | TransitionBlock;

export interface HybridProgram {
  id: string;
  name: string;
  description?: string;
  blocks: HybridWorkoutBlock[];
  totalDuration: number;
  totalExercises: number;
  totalIntervals: number;
  estimatedCalories: number;
  equipment: string[];
  targetGroups?: {
    positions?: string[];
    ageGroups?: string[];
    skillLevels?: string[];
  };
  metadata?: {
    sessionId: string | number;
    sessionType: string;
    sessionDate: string;
    sessionTime: string;
    sessionLocation: string;
  };
}

export interface HybridWorkoutSession {
  id: string;
  title: string;
  type: 'hybrid';
  hybridProgram: HybridProgram;
  scheduledDate: Date;
  location: string;
  teamId: string;
  playerIds: string[];
  createdBy: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface HybridExecutionData {
  blockId: string;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  performance?: {
    exercisesCompleted?: number;
    intervalsCompleted?: number;
    averageHeartRate?: number;
    peakHeartRate?: number;
    caloriesBurned?: number;
  };
  notes?: string;
}

// Template for common hybrid workout patterns
export interface HybridTemplate {
  id: string;
  name: string;
  description: string;
  category: 'strength_cardio' | 'circuit' | 'crossfit' | 'bootcamp' | 'custom';
  blockPattern: Array<{
    type: BlockType;
    duration: number;
    repeat?: number;
  }>;
  recommendedEquipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
}