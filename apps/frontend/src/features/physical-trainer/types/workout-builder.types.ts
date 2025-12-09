/**
 * Unified Workout Builder Types
 * 
 * Type definitions for the unified workout builder layout system.
 * Supports all workout types with a consistent interface.
 */

import { 
  Exercise,
  WorkoutType,
  Player,
  Team,
  MedicalRestriction,
  ValidationError,
  ValidationWarning
} from './index';

import type { BulkSessionConfig, SessionConfiguration } from '../hooks/useBulkSession';

/**
 * Tab definitions for the workout builder
 */
export type WorkoutBuilderTab = 'details' | 'exercises' | 'assignment' | 'preview' | 'templates';

/**
 * Exercise phase types for structured workouts
 */
export type ExercisePhase = 'warmup' | 'main' | 'cooldown' | 'recovery';

/**
 * Exercise library item with metadata
 */
export interface ExerciseLibraryItem {
  id: string;
  name: string;
  category: 'strength' | 'conditioning' | 'agility' | 'mobility' | 'recovery' | 'skill';
  phase: ExercisePhase;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  equipment: string[];
  muscleGroups?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // in seconds
  defaultSets?: number;
  defaultReps?: number;
  defaultWeight?: number;
  restBetweenSets?: number;
  instructions?: string[];
  commonMistakes?: string[];
  modifications?: ExerciseModification[];
  tags?: string[];
  isFavorite?: boolean;
  usageCount?: number;
  lastUsed?: string;
}

/**
 * Exercise modification for different skill levels or restrictions
 */
export interface ExerciseModification {
  id: string;
  name: string;
  type: 'easier' | 'harder' | 'injury' | 'equipment';
  description: string;
  changes: string[];
}

/**
 * Filter options for the exercise library
 */
export interface ExerciseLibraryFilters {
  search?: string;
  category?: string[];
  phase?: ExercisePhase[];
  equipment?: string[];
  muscleGroups?: string[];
  difficulty?: string[];
  favorites?: boolean;
  recentlyUsed?: boolean;
  tags?: string[];
}

/**
 * Workout builder state for different workout types
 */
export interface WorkoutBuilderState<T = any> {
  workoutType: WorkoutType;
  currentTab: WorkoutBuilderTab;
  isDirty: boolean;
  isSaving: boolean;
  workout: T;
  assignedPlayers: Player[];
  assignedTeams: Team[];
  medicalRestrictions: MedicalRestriction[];
  validationErrors: ValidationError[];
  validationWarnings: ValidationWarning[];
  selectedExercises: Exercise[];
  exercisesByPhase: Record<ExercisePhase, Exercise[]>;
}

/**
 * Props for the unified workout builder layout
 */
export interface WorkoutBuilderLayoutProps {
  workoutType: WorkoutType;
  currentTab: WorkoutBuilderTab;
  onTabChange: (tab: WorkoutBuilderTab) => void;
  children: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  isDirty?: boolean;
  isSaving?: boolean;
  validationErrors?: ValidationError[];
  title?: string;
}

/**
 * Extended workout builder header props with bulk mode
 */
export interface WorkoutBuilderHeaderProps {
  title: string;
  workoutType: WorkoutType;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  showAutoSave?: boolean;
  lastSaved?: Date;
  progress?: number;
  className?: string;
  
  // Bulk mode support
  supportsBulkMode?: boolean;
  bulkMode?: boolean;
  onBulkToggle?: (enabled: boolean) => void;
  bulkConfig?: BulkSessionConfig;
  onBulkConfigChange?: (config: BulkSessionConfig) => void;
}

/**
 * Extended player team assignment props with bulk mode
 */
export interface PlayerTeamAssignmentProps {
  // Core assignment props
  selectedPlayers: string[];
  selectedTeams: string[];
  onPlayersChange: (playerIds: string[]) => void;
  onTeamsChange: (teamIds: string[]) => void;
  
  // UI configuration
  showTeams?: boolean;
  showGroups?: boolean;
  showMedical?: boolean;
  showFilters?: boolean;
  showSummary?: boolean;
  title?: string;
  description?: string;
  playerTabLabel?: string;
  teamTabLabel?: string;
  inline?: boolean;
  maxHeight?: number;
  
  // Callbacks and customization
  onPlayerClick?: (player: any) => void;
  onTeamClick?: (team: any) => void;
  customPlayers?: any[];
  customTeams?: any[];
  
  // Filtering
  filterInjured?: boolean;
  filterByTeam?: string[];
  filterByPosition?: string[];
  
  // Bulk mode support
  bulkMode?: boolean;
  bulkConfig?: BulkSessionConfig;
  onBulkConfigChange?: (config: BulkSessionConfig) => void;
  showSessionDistribution?: boolean;
  onAutoDistributePlayers?: () => void;
  onAutoDistributeTeams?: () => void;
}

/**
 * Props for the exercise library sidebar
 */
export interface ExerciseLibrarySidebarProps {
  exercises: ExerciseLibraryItem[];
  filters: ExerciseLibraryFilters;
  onFiltersChange: (filters: ExerciseLibraryFilters) => void;
  onExerciseSelect: (exercise: ExerciseLibraryItem) => void;
  onExerciseDragStart?: (exercise: ExerciseLibraryItem) => void;
  selectedPhase?: ExercisePhase;
  workoutType: WorkoutType;
  isLoading?: boolean;
  onAddCustomExercise?: () => void;
  onClose?: () => void;
}

/**
 * Tab content props
 */
export interface WorkoutTabContentProps {
  isActive: boolean;
  children: React.ReactNode;
}

/**
 * Workout details form data
 */
export interface WorkoutDetailsFormData {
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number; // in minutes
  location: string;
  intensity: 'low' | 'medium' | 'high' | 'max';
  notes?: string;
  tags?: string[];
}

/**
 * Exercise assignment data
 */
export interface ExerciseAssignment {
  exerciseId: string;
  phase: ExercisePhase;
  orderIndex: number;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  restBetweenSets?: number;
  notes?: string;
  modifications?: string[];
}

/**
 * Player/Team assignment data
 */
export interface WorkoutAssignmentData {
  playerIds: string[];
  teamIds: string[];
  individualLoads?: Record<string, number>; // playerId -> load percentage
  restrictionOverrides?: Record<string, string[]>; // playerId -> allowed restrictions
  notes?: Record<string, string>; // playerId -> notes
  
  // Bulk mode extensions
  bulkMode?: boolean;
  sessionAssignments?: Record<string, WorkoutAssignmentData>; // sessionId -> assignment
}

/**
 * Workout preview data
 */
export interface WorkoutPreviewData {
  details: WorkoutDetailsFormData;
  exercises: ExerciseAssignment[];
  assignments: WorkoutAssignmentData;
  estimatedDuration: number;
  totalVolume?: number;
  calorieEstimate?: number;
  equipmentNeeded: string[];
  spaceRequirements?: string;
}

/**
 * Template selection data
 */
export interface WorkoutTemplateSelection {
  templateId: string;
  name: string;
  description?: string;
  type: WorkoutType;
  exercises: ExerciseAssignment[];
  defaultDuration: number;
  defaultIntensity: 'low' | 'medium' | 'high' | 'max';
  tags?: string[];
  author?: string;
  lastModified?: string;
  usageCount?: number;
  rating?: number;
}

/**
 * Drag and drop data
 */
export interface DragData {
  type: 'exercise' | 'phase' | 'assignment';
  data: ExerciseLibraryItem | ExerciseAssignment | ExercisePhase;
  sourcePhase?: ExercisePhase;
  sourceIndex?: number;
}

/**
 * Drop zone props
 */
export interface DropZoneProps {
  phase: ExercisePhase;
  onDrop: (data: DragData, targetIndex?: number) => void;
  exercises: ExerciseAssignment[];
  isActive?: boolean;
  placeholder?: string;
}

/**
 * Exercise card props for the builder
 */
export interface BuilderExerciseCardProps {
  exercise: ExerciseAssignment & ExerciseLibraryItem;
  phase: ExercisePhase;
  index: number;
  onEdit: (exercise: ExerciseAssignment) => void;
  onDelete: (exerciseId: string) => void;
  onReorder: (fromIndex: number, toIndex: number, fromPhase: ExercisePhase, toPhase: ExercisePhase) => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
}

/**
 * Phase section props
 */
export interface PhaseSectionProps {
  phase: ExercisePhase;
  title: string;
  exercises: (ExerciseAssignment & ExerciseLibraryItem)[];
  onExerciseEdit: (exercise: ExerciseAssignment) => void;
  onExerciseDelete: (exerciseId: string) => void;
  onExerciseReorder: (fromIndex: number, toIndex: number, fromPhase: ExercisePhase, toPhase: ExercisePhase) => void;
  onExerciseAdd: (exercise: ExerciseLibraryItem, index?: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showDuration?: boolean;
  showIntensity?: boolean;
}

/**
 * Equipment summary
 */
export interface EquipmentSummary {
  equipment: string;
  count: number;
  exercises: string[];
}

/**
 * Space requirement calculation
 */
export interface SpaceRequirement {
  minWidth: number; // in meters
  minLength: number; // in meters
  minHeight: number; // in meters
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  surfaceType?: 'gym' | 'turf' | 'ice' | 'track' | 'pool' | 'any';
}

/**
 * Unified schedule configuration
 * Used by UnifiedScheduler component for consistent scheduling across all workout types
 */
export interface UnifiedSchedule {
  startDate: Date;
  startTime: string;
  location?: string;
  participants: {
    playerIds: string[];
    teamIds: string[];
  };
  recurrence?: RecurrenceConfig;
  reminders?: ReminderConfig;
  assignedCoachId?: string;
  assignedCoachRole?: 'physical_trainer' | 'ice_coach';
}

/**
 * Recurrence configuration for scheduled workouts
 */
export interface RecurrenceConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  count?: number;
  endDate?: Date;
}

/**
 * Reminder configuration for scheduled workouts
 */
export interface ReminderConfig {
  enabled: boolean;
  minutesBefore: number[];
}

/**
 * Workout intensity distribution
 */
export interface IntensityDistribution {
  warmup: number; // percentage
  low: number;
  medium: number;
  high: number;
  max: number;
  cooldown: number;
}

/**
 * Workout metrics summary
 */
export interface WorkoutMetricsSummary {
  totalExercises: number;
  exercisesByPhase: Record<ExercisePhase, number>;
  estimatedDuration: number;
  intensityDistribution: IntensityDistribution;
  equipmentNeeded: EquipmentSummary[];
  spaceRequirements: SpaceRequirement;
  targetMuscleGroups?: Record<string, number>; // muscle group -> percentage
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  medicalCompliance: {
    safe: number;
    caution: number;
    restricted: number;
  };
}

/**
 * Bulk mode configuration for workout builders
 */
export interface BulkModeConfig {
  enabled: boolean;
  numberOfSessions: number;
  sessionNames?: string[];
  distributionStrategy: 'even' | 'manual' | 'team-based' | 'skill-based';
  sessionConfigurations: SessionConfiguration[];
  allowPlayerOverlap?: boolean;
  staggerStartTimes?: boolean;
  staggerInterval?: number; // minutes
}

/**
 * Session distribution summary for bulk mode
 */
export interface SessionDistributionSummary {
  sessionIndex: number;
  sessionId: string;
  sessionName: string;
  playerCount: number;
  teamCount: number;
  totalPlayers: number;
  playerIds: string[];
  teamIds: string[];
  startTime?: string;
  equipment?: string[];
  facility?: string;
  estimatedDuration?: number;
  conflicts?: string[];
}

/**
 * Bulk mode props extension for components
 */
export interface BulkModeProps {
  bulkMode?: boolean;
  bulkConfig?: BulkSessionConfig;
  onBulkModeToggle?: (enabled: boolean) => void;
  onBulkConfigChange?: (config: BulkSessionConfig) => void;
  supportsBulkMode?: boolean;
  showSessionDistribution?: boolean;
  maxBulkSessions?: number;
  minBulkSessions?: number;
}

/**
 * Enhanced workout builder props with bulk mode support
 */
export interface EnhancedWorkoutBuilderProps extends WorkoutBuilderLayoutProps, BulkModeProps {
  // Additional props specific to bulk mode
  onSessionDistribute?: (strategy: 'even' | 'manual' | 'team-based') => void;
  onAutoDistributePlayers?: () => void;
  onAutoDistributeTeams?: () => void;
  sessionDistributionSummary?: SessionDistributionSummary[];
  bulkValidationErrors?: Record<string, ValidationError[]>; // sessionId -> errors
}

/**
 * Player assignment with session awareness for bulk mode
 */
export interface BulkPlayerAssignment extends WorkoutAssignmentData {
  sessionAssignments?: Record<string, { // sessionId -> assignment
    playerIds: string[];
    teamIds: string[];
    individualLoads?: Record<string, number>;
    notes?: Record<string, string>;
  }>;
  distributionStrategy?: 'even' | 'manual' | 'team-based' | 'skill-based';
  allowOverlap?: boolean;
}

/**
 * Bulk session validation result
 */
export interface BulkSessionValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>; // sessionId -> error messages
  warnings: Record<string, string[]>; // sessionId -> warning messages
  conflicts: {
    equipment: string[];
    facilities: string[];
    scheduling: string[];
    players: string[];
  };
  suggestions: {
    sessionId: string;
    type: 'auto-fix' | 'manual-review' | 'optimization';
    message: string;
    action?: () => void;
  }[];
}