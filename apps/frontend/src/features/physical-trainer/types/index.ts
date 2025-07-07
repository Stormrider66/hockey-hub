/**
 * Physical Trainer Types
 * 
 * Comprehensive type definitions for the Physical Trainer dashboard and related components.
 * These types ensure type safety across all Physical Trainer features.
 */

// Base types for entities
export interface BaseEntity {
  id: string | number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Player related types
export interface Player extends BaseEntity {
  name: string;
  number: number;
  position: string;
  teamId: string;
  status: 'active' | 'injured' | 'inactive';
  photo?: string;
}

export interface PlayerReadiness {
  id: string | number;
  playerId: string;
  name: string;
  status: 'ready' | 'caution' | 'rest';
  load: number; // 0-120%
  fatigue: 'low' | 'medium' | 'high';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  metrics?: {
    hrv?: number;
    sleepQuality?: number;
    soreness?: number;
    energy?: number;
  };
}

export interface MedicalRestriction {
  id: string;
  playerId: string;
  type: 'injury' | 'illness' | 'precaution';
  description: string;
  restrictions: string[];
  startDate: string;
  endDate?: string;
  severity: 'minor' | 'moderate' | 'severe';
  clearedBy?: string;
}

// Workout and Session types
export interface WorkoutSession extends BaseEntity {
  title: string;
  description?: string;
  type: 'strength' | 'cardio' | 'skill' | 'recovery' | 'mixed';
  scheduledDate: string;
  location: string;
  teamId: string;
  teamName?: string;
  playerIds: string[];
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  intensity: 'low' | 'medium' | 'high' | 'max';
  exercises: Exercise[];
  playerLoads?: PlayerWorkoutLoad[];
  settings?: SessionSettings;
  weather?: WeatherConditions;
  notes?: string;
}

export interface Exercise extends BaseEntity {
  workoutSessionId?: string;
  name: string;
  category: 'strength' | 'conditioning' | 'agility' | 'mobility' | 'recovery' | 'skill';
  sets?: number;
  reps?: number;
  duration?: number; // in seconds
  distance?: number; // in meters
  weight?: number; // in kg
  restBetweenSets?: number; // in seconds
  intensity?: 'low' | 'medium' | 'high' | 'max';
  equipment?: string[];
  notes?: string;
  videoUrl?: string;
  orderIndex: number;
  targetMetrics?: {
    heartRateZone?: number[];
    powerOutput?: number;
    speed?: number;
  };
}

export interface PlayerWorkoutLoad extends BaseEntity {
  workoutSessionId: string;
  playerId: string;
  playerName?: string;
  plannedLoad: number; // 0-100%
  actualLoad?: number;
  rpe?: number; // Rate of Perceived Exertion 1-10
  customExercises?: Exercise[];
  notes?: string;
  status: 'planned' | 'active' | 'completed' | 'skipped';
}

export interface SessionSettings {
  allowIndividualLoads: boolean;
  displayMode: 'grid' | 'focus' | 'tv';
  showMetrics: boolean;
  autoRotation: boolean;
  rotationInterval: number; // in seconds
  sound: boolean;
  notifications: boolean;
}

export interface WeatherConditions {
  temperature: number; // in Celsius
  humidity: number; // percentage
  windSpeed: number; // km/h
  conditions: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
}

// Execution types
export interface WorkoutExecution extends BaseEntity {
  workoutSessionId: string;
  playerId: string;
  playerName?: string;
  startTime: string;
  endTime?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentExerciseIndex: number;
  currentSetNumber: number;
  completionPercentage: number;
  exerciseExecutions: ExerciseExecution[];
  overallMetrics?: OverallMetrics;
  notes?: string;
}

export interface ExerciseExecution extends BaseEntity {
  workoutExecutionId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  plannedReps?: number;
  actualReps?: number;
  plannedWeight?: number;
  actualWeight?: number;
  plannedDuration?: number;
  actualDuration?: number;
  plannedDistance?: number;
  actualDistance?: number;
  performanceMetrics?: PerformanceMetrics;
  completedAt: string;
  notes?: string;
}

export interface PerformanceMetrics {
  heartRate?: number;
  maxHeartRate?: number;
  averagePower?: number;
  maxPower?: number;
  speed?: number;
  cadence?: number;
  rpe?: number; // Rate of Perceived Exertion
  technique?: number; // 1-10 scale
}

export interface OverallMetrics {
  totalDuration: number; // in seconds
  averageHeartRate?: number;
  maxHeartRate?: number;
  caloriesBurned?: number;
  totalVolume?: number; // total weight lifted
  totalDistance?: number;
  averageRpe?: number;
}

// Template types
export interface SessionTemplate extends BaseEntity {
  name: string;
  description?: string;
  type: 'strength' | 'cardio' | 'skill' | 'recovery' | 'mixed';
  category: string;
  duration: number; // estimated in minutes
  exercises: Exercise[];
  equipment: string[];
  targetPlayers?: 'all' | 'forwards' | 'defense' | 'goalies' | 'injured' | 'rookies';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  tags?: string[];
  lastUsed?: string;
  usageCount: number;
  rating?: number; // 1-5 stars
  author?: string;
  isPublic?: boolean;
}

// Test and Assessment types
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

export interface TestBatch extends BaseEntity {
  name: string;
  date: string;
  teamId?: string;
  status: 'scheduled' | 'active' | 'completed';
  completedTests: number;
  totalTests: number;
  testTypes: TestType[];
  notes?: string;
  location?: string;
  conductor?: string; // who conducted the tests
}

export interface WorkoutAssignment extends BaseEntity {
  playerId: string;
  playerName?: string;
  templateId?: string;
  customWorkout?: WorkoutSession;
  assignedDate: string;
  dueDate: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  completedDate?: string;
  completionPercentage?: number;
  feedback?: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high';
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  daysOfWeek?: number[]; // 0-6, where 0 is Sunday
  endDate?: string;
  occurrences?: number;
}

// Calendar event types
export interface CalendarEvent extends BaseEntity {
  title: string;
  start: Date | string;
  end: Date | string;
  type: 'training' | 'testing' | 'recovery' | 'meeting' | 'other';
  sessionId?: string;
  teamId?: string;
  playerIds?: string[];
  location?: string;
  recurring?: boolean;
  recurrenceRule?: string;
  color?: string;
  allDay?: boolean;
  resource?: {
    id: string;
    title: string;
    type?: string;
    color?: string;
    [key: string]: unknown;
  }; // react-big-calendar resource
}

// Analytics types
export interface PlayerAnalytics {
  playerId: string;
  playerName: string;
  period: 'week' | 'month' | 'season';
  workloadTrend: number[]; // array of daily/weekly loads
  averageLoad: number;
  peakLoad: number;
  totalSessions: number;
  completedSessions: number;
  missedSessions: number;
  improvementAreas: ImprovementArea[];
  injuryRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface ImprovementArea {
  area: string;
  currentLevel: number; // 0-100
  targetLevel: number;
  progress: number; // percentage
  exercises: string[];
}

export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  period: 'week' | 'month' | 'season';
  averageAttendance: number;
  totalSessions: number;
  sessionTypes: Record<string, number>;
  playerReadiness: {
    ready: number;
    caution: number;
    rest: number;
  };
  topPerformers: string[];
  concernedPlayers: string[];
  upcomingTests: TestBatch[];
}

// Form and input types
export interface SessionFormData {
  title: string;
  description?: string;
  type: WorkoutSession['type'];
  date: string;
  time: string;
  duration: number;
  location: string;
  teamId: string;
  playerIds: string[];
  intensity: WorkoutSession['intensity'];
  exercises: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>[];
  equipment?: string[];
  notes?: string;
}

export interface TestFormData {
  playerId: string;
  testBatchId?: string;
  testType: TestType;
  value: number;
  unit: string;
  notes?: string;
  date?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  metadata: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Component prop types
export interface SessionCardProps {
  session: WorkoutSession;
  onLaunch?: (session: WorkoutSession) => void;
  onEdit?: (session: WorkoutSession) => void;
  onDelete?: (sessionId: string) => void;
  variant?: 'compact' | 'detailed';
}

export interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exerciseId: string) => void;
  onPlay?: (videoUrl: string) => void;
  isEditable?: boolean;
}

export interface PlayerCardProps {
  player: Player;
  readiness?: PlayerReadiness;
  restrictions?: MedicalRestriction[];
  onSelect?: (player: Player) => void;
  isSelected?: boolean;
  showDetails?: boolean;
}

export interface TemplateCardProps {
  template: SessionTemplate;
  onApply?: (template: SessionTemplate, date?: Date, time?: string) => void;
  onEdit?: (template: SessionTemplate) => void;
  onDelete?: (templateId: string) => void;
  onDuplicate?: (template: SessionTemplate) => void;
}

// Chart data types
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

export interface ChartConfig {
  title?: string;
  xAxis?: {
    label?: string;
    type?: 'category' | 'datetime' | 'numeric';
  };
  yAxis?: {
    label?: string;
    min?: number;
    max?: number;
  };
  legend?: boolean;
  tooltip?: boolean;
  theme?: 'light' | 'dark';
}

// Utility types
export type Status = 'idle' | 'loading' | 'success' | 'error';

// Today's session interface used in dashboard
export interface TodaySession {
  id: string | number;
  time: string;
  team: string;
  type: string;
  location: string;
  players: number;
  status: 'upcoming' | 'active' | 'completed';
  intensity: string;
  description: string;
}

export interface LoadingState {
  status: Status;
  error?: string | null;
}

export interface FilterOptions {
  teamId?: string;
  playerId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Re-export commonly used types for convenience
export type SessionType = WorkoutSession['type'];
export type IntensityLevel = WorkoutSession['intensity'];
export type ExerciseCategory = Exercise['category'];
export type PlayerStatus = Player['status'];
export type ReadinessStatus = PlayerReadiness['status'];
export type FatigueLevel = PlayerReadiness['fatigue'];