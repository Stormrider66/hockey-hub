// Conditioning Workout Types and Interfaces

export enum WorkoutEquipmentType {
  RUNNING = 'running',
  ROWING = 'rowing',
  SKIERG = 'skierg',
  BIKE_ERG = 'bike_erg',
  WATTBIKE = 'wattbike',
  AIRBIKE = 'airbike',
  ROPE_JUMP = 'rope_jump',
  TREADMILL = 'treadmill'
}

export interface WorkoutEquipmentConfig {
  type: WorkoutEquipmentType;
  label: string;
  icon: string;
  metrics: {
    primary: 'watts' | 'pace' | 'speed' | 'count';
    secondary?: ('heartRate' | 'rpm' | 'calories' | 'distance')[];
  };
  units: {
    pace?: string;
    speed?: string;
    distance?: string;
  };
}

export const EQUIPMENT_CONFIGS: Record<WorkoutEquipmentType, WorkoutEquipmentConfig> = {
  [WorkoutEquipmentType.RUNNING]: {
    type: WorkoutEquipmentType.RUNNING,
    label: 'Running',
    icon: '🏃',
    metrics: { primary: 'pace', secondary: ['heartRate', 'distance', 'calories'] },
    units: { pace: 'min/km', speed: 'km/h', distance: 'km' }
  },
  [WorkoutEquipmentType.ROWING]: {
    type: WorkoutEquipmentType.ROWING,
    label: 'Rowing',
    icon: '🚣',
    metrics: { primary: 'pace', secondary: ['heartRate', 'watts', 'calories', 'distance'] },
    units: { pace: '/500m', distance: 'm' }
  },
  [WorkoutEquipmentType.SKIERG]: {
    type: WorkoutEquipmentType.SKIERG,
    label: 'SkiErg',
    icon: '⛷️',
    metrics: { primary: 'pace', secondary: ['heartRate', 'watts', 'calories', 'distance'] },
    units: { pace: '/500m', distance: 'm' }
  },
  [WorkoutEquipmentType.BIKE_ERG]: {
    type: WorkoutEquipmentType.BIKE_ERG,
    label: 'Bike Erg',
    icon: '🚴',
    metrics: { primary: 'watts', secondary: ['heartRate', 'rpm', 'calories', 'distance'] },
    units: { speed: 'km/h', distance: 'km' }
  },
  [WorkoutEquipmentType.WATTBIKE]: {
    type: WorkoutEquipmentType.WATTBIKE,
    label: 'Wattbike',
    icon: '🚴‍♂️',
    metrics: { primary: 'watts', secondary: ['heartRate', 'rpm', 'calories', 'distance'] },
    units: { speed: 'km/h', distance: 'km' }
  },
  [WorkoutEquipmentType.AIRBIKE]: {
    type: WorkoutEquipmentType.AIRBIKE,
    label: 'Air Bike',
    icon: '💨',
    metrics: { primary: 'watts', secondary: ['heartRate', 'rpm', 'calories'] },
    units: { speed: 'km/h' }
  },
  [WorkoutEquipmentType.ROPE_JUMP]: {
    type: WorkoutEquipmentType.ROPE_JUMP,
    label: 'Rope Jump',
    icon: '🪢',
    metrics: { primary: 'count', secondary: ['heartRate', 'calories'] },
    units: {}
  },
  [WorkoutEquipmentType.TREADMILL]: {
    type: WorkoutEquipmentType.TREADMILL,
    label: 'Treadmill',
    icon: '🏃‍♂️',
    metrics: { primary: 'speed', secondary: ['heartRate', 'distance', 'calories'] },
    units: { speed: 'km/h', distance: 'km' }
  }
};

export type IntervalType = 'warmup' | 'work' | 'rest' | 'cooldown' | 'active_recovery';

export interface TargetMetric {
  type: 'absolute' | 'percentage' | 'zone';
  value: number;
  reference?: 'max' | 'threshold' | 'ftp' | 'test' | 'rpe';
  testId?: string; // Reference to specific test result
}

export interface IntervalSet {
  id: string;
  type: IntervalType;
  name?: string;
  duration: number; // seconds
  equipment: WorkoutEquipmentType;
  targetMetrics: {
    heartRate?: TargetMetric;
    watts?: TargetMetric;
    pace?: TargetMetric;
    speed?: TargetMetric;
    rpm?: number;
    incline?: number;
    resistance?: number;
    calories?: number;
  };
  notes?: string;
  color?: string; // For visual representation
}

export interface IntervalProgram {
  id: string;
  name: string;
  description?: string;
  equipment: WorkoutEquipmentType;
  intervals: IntervalSet[];
  totalDuration: number; // calculated from intervals
  estimatedCalories?: number;
  targetZones?: {
    zone1: number; // percentage of time
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
}

export interface PlayerTestResult {
  id: string;
  playerId: string;
  testType: 'vo2max' | 'lactate_threshold' | 'ftp' | 'max_hr' | 'max_watts' | 'vvo2max' | 'anaerobic_threshold';
  value: number;
  unit: string;
  testDate: Date;
  validUntil?: Date;
  notes?: string;
  conductedBy?: string;
}

export interface PersonalizedInterval extends IntervalSet {
  playerId: string;
  personalizedTargets: {
    heartRate?: number; // Calculated absolute value
    watts?: number;
    pace?: string; // Formatted pace
    speed?: number;
  };
  basedOnTests?: PlayerTestResult[];
}

export interface ConditioningSession {
  id: string;
  sessionId: string; // WorkoutSession ID
  intervalProgram: IntervalProgram;
  personalizedPrograms?: Record<string, PersonalizedInterval[]>; // playerId -> intervals
  scheduledDate: Date;
  location: string;
  equipment: WorkoutEquipmentType[];
  notes?: string;
}

export interface IntervalExecution {
  intervalId: string;
  playerId: string;
  startTime: Date;
  endTime: Date;
  actualDuration: number;
  metrics: {
    avgHeartRate?: number;
    maxHeartRate?: number;
    avgWatts?: number;
    maxWatts?: number;
    avgPace?: string;
    avgSpeed?: number;
    avgRpm?: number;
    totalCalories?: number;
    distance?: number;
  };
  targetAchievement: number; // 0-100 percentage
  notes?: string;
}

export interface ConditioningWorkoutExecution {
  id: string;
  sessionId: string;
  playerId: string;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
  intervalExecutions: IntervalExecution[];
  overallMetrics: {
    totalDuration: number;
    totalCalories: number;
    avgHeartRate: number;
    maxHeartRate: number;
    avgWatts?: number;
    totalDistance?: number;
    compliance: number; // 0-100 percentage
    rpe?: number; // 1-10 scale
  };
  feedback?: {
    difficulty: 'too_easy' | 'just_right' | 'too_hard';
    notes?: string;
  };
}

// Preset workout templates
export interface WorkoutTemplate {
  id: string;
  name: string;
  category: 'hiit' | 'steady_state' | 'pyramid' | 'fartlek' | 'recovery' | 'test' | 'custom';
  description: string;
  intervalProgram: Omit<IntervalProgram, 'id'>;
  recommendedFor?: string[];
  createdBy?: string;
  isPublic: boolean;
}

// Utility functions for calculations
export const calculatePersonalizedTarget = (
  target: TargetMetric,
  testResults: PlayerTestResult[]
): number | undefined => {
  if (target.type === 'absolute') {
    return target.value;
  }

  if (target.type === 'percentage' && target.reference) {
    const relevantTest = testResults.find(test => {
      switch (target.reference) {
        case 'max':
          return test.testType === 'max_hr' || test.testType === 'max_watts';
        case 'threshold':
          return test.testType === 'lactate_threshold' || test.testType === 'anaerobic_threshold';
        case 'ftp':
          return test.testType === 'ftp';
        default:
          return false;
      }
    });

    if (relevantTest) {
      return (relevantTest.value * target.value) / 100;
    }
  }

  return undefined;
};

export const formatPace = (metersPerSecond: number, unit: string): string => {
  if (unit === '/500m') {
    const secondsPer500m = 500 / metersPerSecond;
    const minutes = Math.floor(secondsPer500m / 60);
    const seconds = Math.round(secondsPer500m % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else if (unit === 'min/km') {
    const secondsPerKm = 1000 / metersPerSecond;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${metersPerSecond.toFixed(1)} m/s`;
};

export const getHeartRateZone = (hr: number, maxHr: number): number => {
  const percentage = (hr / maxHr) * 100;
  if (percentage < 60) return 1;
  if (percentage < 70) return 2;
  if (percentage < 80) return 3;
  if (percentage < 90) return 4;
  return 5;
};