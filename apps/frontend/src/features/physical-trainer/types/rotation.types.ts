// Rotation Workout System Types and Interfaces
import type { IntervalProgram } from './conditioning.types';
import { WorkoutEquipmentType } from './conditioning.types';
import type { PlayerData } from '../components/shared/TeamPlayerSelector';

// Station Configuration
export interface WorkoutStation {
  id: string;
  name: string;
  equipment: WorkoutEquipmentType;
  capacity: number; // Number of players this station can accommodate
  workout: StationWorkout;
  duration: number; // Duration in minutes
  color: string; // For visual identification
  position: { x: number; y: number }; // For drag-and-drop positioning
  notes?: string;
}

// Station Workout Types
export type StationWorkoutType = 'intervals' | 'strength' | 'freeform' | 'rest';

export interface StationWorkout {
  type: StationWorkoutType;
  data: IntervalProgram | StrengthWorkout | FreeformWorkout | RestActivity;
}

export interface StrengthWorkout {
  id: string;
  name: string;
  exercises: StationExercise[];
  totalDuration: number;
}

export interface StationExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number; // For time-based exercises
  restBetweenSets: number;
}

export interface FreeformWorkout {
  id: string;
  name: string;
  description: string;
  duration: number;
  instructions: string[];
}

export interface RestActivity {
  id: string;
  name: string;
  description: string;
  duration: number;
  type: 'active_recovery' | 'passive_rest' | 'hydration' | 'mobility';
}

// Player Groups for Rotation
export interface RotationGroup {
  id: string;
  name: string;
  players: PlayerData[];
  color: string; // For visual identification
  startingStation: string; // Station ID where this group starts
  currentStation?: string; // Current station during execution
  rotationOrder: string[]; // Array of station IDs in rotation order
}

// Rotation Schedule
export interface RotationSchedule {
  id: string;
  name: string;
  stations: WorkoutStation[];
  groups: RotationGroup[];
  rotationDuration: number; // How long each group spends at a station (minutes)
  transitionTime: number; // Time between rotations (minutes)
  totalDuration: number; // Total session duration
  rotationOrder: string[]; // Global rotation order for all groups
  startTime: Date;
  strategy: RotationStrategy;
}

export type RotationStrategy = 'sequential' | 'staggered' | 'custom';

// Rotation Execution State
export interface RotationExecutionState {
  scheduleId: string;
  status: 'preparing' | 'active' | 'paused' | 'completed';
  currentRotation: number; // 0-based index
  timeRemaining: number; // Seconds remaining in current rotation
  nextRotationAt: Date;
  groupPositions: Record<string, string>; // groupId -> stationId
  alerts: RotationAlert[];
}

export interface RotationAlert {
  id: string;
  type: 'transition_warning' | 'transition_now' | 'completion' | 'emergency';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Group Management
export interface GroupAssignment {
  playerId: string;
  groupId: string;
  assignedAt: Date;
  notes?: string;
}

export interface AutoGroupOptions {
  strategy: 'balanced' | 'skill_based' | 'position_based' | 'random';
  considerMedicalStatus: boolean;
  considerPlayerPreferences: boolean;
  minGroupSize: number;
  maxGroupSize: number;
  enforceEqualSizes: boolean;
}

// Station Templates
export interface StationTemplate {
  id: string;
  name: string;
  category: 'cardio' | 'strength' | 'hybrid' | 'recovery' | 'skill';
  description: string;
  equipment: WorkoutEquipmentType;
  defaultCapacity: number;
  defaultDuration: number;
  workoutTemplate: StationWorkout;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  createdBy?: string;
  isPublic: boolean;
}

// Visual Configuration
export interface RotationVisualization {
  layout: 'grid' | 'circle' | 'linear' | 'custom';
  showPlayerNames: boolean;
  showTimers: boolean;
  showProgress: boolean;
  colorScheme: 'default' | 'high_contrast' | 'colorblind_friendly';
  animateTransitions: boolean;
  soundEnabled: boolean;
  alertVolume: number; // 0-100
}

// Rotation Analytics
export interface RotationAnalytics {
  scheduleId: string;
  totalParticipants: number;
  stationUtilization: Record<string, number>; // stationId -> utilization percentage
  averageTransitionTime: number;
  completionRate: number;
  playerEngagement: Record<string, number>; // playerId -> engagement score
  equipmentUsage: Record<WorkoutEquipmentType, number>;
  feedbackScores: Record<string, number>; // stationId -> average rating
}

// Print/Export Configuration
export interface RotationPrintConfig {
  includePlayerNames: boolean;
  includeInstructions: boolean;
  includeTimeline: boolean;
  includeNotes: boolean;
  groupByStation: boolean;
  groupByTime: boolean;
  format: 'schedule' | 'instruction_cards' | 'timeline' | 'summary';
  orientation: 'portrait' | 'landscape';
  fontSize: 'small' | 'medium' | 'large';
}

// Validation Results
export interface RotationValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: ValidationRecommendation[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationRecommendation {
  type: 'optimization' | 'safety' | 'engagement';
  message: string;
  action?: string;
}

// Drag and Drop Types
export interface DragItem {
  type: 'player' | 'group' | 'station';
  id: string;
  data: PlayerData | RotationGroup | WorkoutStation;
}

export interface DropTarget {
  type: 'group' | 'station' | 'trash';
  id: string;
  accepts: ('player' | 'group' | 'station')[];
}

// Equipment Availability for Rotation
export interface EquipmentAvailability {
  equipmentType: WorkoutEquipmentType;
  totalCount: number;
  availableCount: number;
  conflictingReservations: string[];
  recommendedCapacity: number;
}

// Station Conflict Detection
export interface StationConflict {
  type: 'equipment' | 'capacity' | 'timing' | 'safety';
  stationIds: string[];
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

// Utility Types
export type RotationDirection = 'clockwise' | 'counterclockwise' | 'custom';

export interface RotationPattern {
  name: string;
  description: string;
  direction: RotationDirection;
  skipStations?: string[]; // Station IDs to skip in rotation
  customOrder?: string[]; // Custom rotation order if direction is 'custom'
}

// Session Integration Types
export interface RotationSessionContext {
  rotationScheduleId: string;
  stationId: string;
  groupId: string;
  rotationIndex: number;
  isRotationSession: true;
  nextStation?: string;
  previousStation?: string;
  timeUntilRotation?: number; // seconds
}

// Individual training session created for each station
export interface RotationTrainingSession {
  id: string;
  rotationContext: RotationSessionContext;
  stationWorkout: StationWorkout;
  assignedPlayers: string[]; // Player IDs assigned to this station
  status: 'pending' | 'active' | 'completed' | 'paused';
  startTime?: Date;
  endTime?: Date;
  duration: number; // Expected duration in seconds
  actualDuration?: number; // Actual duration if completed
}

// Collection of all sessions for a rotation schedule
export interface RotationSessionCollection {
  scheduleId: string;
  rotationIndex: number;
  sessions: RotationTrainingSession[];
  groupPositions: Record<string, string>; // groupId -> stationId
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'active' | 'transitioning' | 'completed';
}

// Enhanced rotation execution state with session integration
export interface EnhancedRotationExecutionState extends RotationExecutionState {
  currentSessions: RotationSessionCollection;
  sessionHistory: RotationSessionCollection[];
  activeSessions: string[]; // Active session IDs for TrainingSessionViewer
}

// Event Types for Real-time Updates
export interface RotationEvent {
  type: 'rotation_start' | 'rotation_end' | 'group_move' | 'emergency_stop' | 'session_complete' | 'transition_warning' | 'station_ready';
  timestamp: Date;
  data: any;
  scheduleId: string;
  triggeredBy: string; // User ID
}

// Configuration Presets
export interface RotationPreset {
  id: string;
  name: string;
  description: string;
  stationCount: number;
  groupCount: number;
  rotationDuration: number;
  transitionTime: number;
  strategy: RotationStrategy;
  equipmentTypes: WorkoutEquipmentType[];
  recommendedFor: string[]; // Team sizes, skill levels, etc.
  tags: string[];
}

// Default Presets
export const ROTATION_PRESETS: RotationPreset[] = [
  {
    id: 'small-team-4x6',
    name: '4 Station Small Team',
    description: '4 stations for teams of 12-24 players with 6 per station',
    stationCount: 4,
    groupCount: 4,
    rotationDuration: 15,
    transitionTime: 2,
    strategy: 'sequential',
    equipmentTypes: [
      WorkoutEquipmentType.ROWING,
      WorkoutEquipmentType.BIKE_ERG,
      WorkoutEquipmentType.SKIERG,
      WorkoutEquipmentType.AIRBIKE
    ],
    recommendedFor: ['12-24 players', 'Youth teams', '60-minute sessions'],
    tags: ['cardio', 'endurance', 'youth']
  },
  {
    id: 'large-team-6x4',
    name: '6 Station Large Team',
    description: '6 stations for teams of 18-30 players with 4-5 per station',
    stationCount: 6,
    groupCount: 6,
    rotationDuration: 12,
    transitionTime: 3,
    strategy: 'staggered',
    equipmentTypes: [
      WorkoutEquipmentType.ROWING,
      WorkoutEquipmentType.BIKE_ERG,
      WorkoutEquipmentType.SKIERG,
      WorkoutEquipmentType.AIRBIKE,
      WorkoutEquipmentType.TREADMILL,
      WorkoutEquipmentType.ROPE_JUMP
    ],
    recommendedFor: ['18-30 players', 'Professional teams', '90-minute sessions'],
    tags: ['cardio', 'professional', 'endurance', 'strength']
  },
  {
    id: 'hybrid-circuit',
    name: 'Hybrid Circuit Training',
    description: 'Mixed cardio and strength stations for comprehensive training',
    stationCount: 5,
    groupCount: 5,
    rotationDuration: 10,
    transitionTime: 2,
    strategy: 'sequential',
    equipmentTypes: [
      WorkoutEquipmentType.ROWING,
      WorkoutEquipmentType.AIRBIKE,
      WorkoutEquipmentType.ROPE_JUMP
    ],
    recommendedFor: ['15-25 players', 'Cross-training', '60-minute sessions'],
    tags: ['hybrid', 'strength', 'cardio', 'circuit']
  }
];

// Color Schemes for Groups and Stations
export const GROUP_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280'  // gray
];

export const STATION_COLORS = [
  '#fee2e2', // red-100
  '#dbeafe', // blue-100
  '#d1fae5', // green-100
  '#fef3c7', // yellow-100
  '#ede9fe', // purple-100
  '#fed7aa', // orange-100
  '#cffafe', // cyan-100
  '#ecfccb', // lime-100
  '#fce7f3', // pink-100
  '#f3f4f6'  // gray-100
];