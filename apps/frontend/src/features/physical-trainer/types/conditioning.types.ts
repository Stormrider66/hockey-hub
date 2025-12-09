// Conditioning Workout Types and Interfaces

// Import only if WorkoutTemplate is needed from template.types
// import { WorkoutTemplate } from './template.types';

// Garmin 5-Zone Heart Rate System
export interface GarminHeartRateZone {
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  percentage: { min: number; max: number };
  purpose: string;
  color: string;
  description: string;
}

export const GARMIN_HR_ZONES: GarminHeartRateZone[] = [
  {
    zone: 1,
    name: 'Warm-up',
    percentage: { min: 50, max: 60 },
    purpose: 'Easy effort, recovery',
    color: '#94a3b8', // gray
    description: 'Light activity that helps improve overall health and aids recovery'
  },
  {
    zone: 2,
    name: 'Easy',
    percentage: { min: 60, max: 70 },
    purpose: 'Comfortable effort, aerobic base',
    color: '#3b82f6', // blue
    description: 'Comfortable effort that builds aerobic base and endurance'
  },
  {
    zone: 3,
    name: 'Aerobic',
    percentage: { min: 70, max: 80 },
    purpose: 'Moderate effort, aerobic threshold',
    color: '#10b981', // green
    description: 'Moderate effort that improves aerobic capacity and efficiency'
  },
  {
    zone: 4,
    name: 'Threshold',
    percentage: { min: 80, max: 90 },
    purpose: 'Hard effort, lactate threshold',
    color: '#f59e0b', // yellow/orange
    description: 'Hard effort at lactate threshold, improves race pace endurance'
  },
  {
    zone: 5,
    name: 'Maximum',
    percentage: { min: 90, max: 100 },
    purpose: 'Maximum effort, VO2 max',
    color: '#ef4444', // red
    description: 'Maximum effort that improves VO2 max and anaerobic power'
  }
];

// Lactate Threshold Zones
export interface LactateThresholdZone {
  name: 'LT1' | 'LT2' | 'BELOW_LT1' | 'BETWEEN_LT1_LT2' | 'ABOVE_LT2';
  percentage: { min: number; max: number };
  lactateLevel: { min: number; max: number }; // mmol/L
  description: string;
  color: string;
}

export const LACTATE_ZONES: LactateThresholdZone[] = [
  {
    name: 'BELOW_LT1',
    percentage: { min: 50, max: 65 },
    lactateLevel: { min: 1, max: 2 },
    description: 'Aerobic base training, fat burning',
    color: '#3b82f6'
  },
  {
    name: 'LT1',
    percentage: { min: 65, max: 75 },
    lactateLevel: { min: 2, max: 2.5 },
    description: 'First lactate threshold, aerobic threshold',
    color: '#10b981'
  },
  {
    name: 'BETWEEN_LT1_LT2',
    percentage: { min: 75, max: 85 },
    lactateLevel: { min: 2.5, max: 4 },
    description: 'Tempo zone, lactate steady state',
    color: '#f59e0b'
  },
  {
    name: 'LT2',
    percentage: { min: 85, max: 95 },
    lactateLevel: { min: 4, max: 8 },
    description: 'Lactate threshold, maximum lactate steady state',
    color: '#f97316'
  },
  {
    name: 'ABOVE_LT2',
    percentage: { min: 95, max: 100 },
    lactateLevel: { min: 8, max: 20 },
    description: 'VO2 max, anaerobic capacity',
    color: '#ef4444'
  }
];

// Enhanced Target Metric Types
export type TargetMetricType = 'absolute' | 'percentage' | 'zone' | 'range';
export type TargetReference = 'max_hr' | 'threshold_hr' | 'lt1' | 'lt2' | 'ftp' | 'critical_power' | 'vo2max' | 'vvo2max' | 'max_speed' | 'critical_speed' | 'anaerobic_threshold';

// Power Zones (based on FTP)
export interface PowerZone {
  zone: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  percentage: { min: number; max: number };
  purpose: string;
  color: string;
}

export const POWER_ZONES: PowerZone[] = [
  {
    zone: 1,
    name: 'Active Recovery',
    percentage: { min: 0, max: 55 },
    purpose: 'Recovery, easy spinning',
    color: '#94a3b8'
  },
  {
    zone: 2,
    name: 'Endurance',
    percentage: { min: 56, max: 75 },
    purpose: 'Aerobic base building',
    color: '#3b82f6'
  },
  {
    zone: 3,
    name: 'Tempo',
    percentage: { min: 76, max: 90 },
    purpose: 'Aerobic capacity, sustainable pace',
    color: '#10b981'
  },
  {
    zone: 4,
    name: 'Lactate Threshold',
    percentage: { min: 91, max: 105 },
    purpose: 'FTP, lactate threshold power',
    color: '#f59e0b'
  },
  {
    zone: 5,
    name: 'VO2 Max',
    percentage: { min: 106, max: 120 },
    purpose: 'VO2 max, 5-8 minute power',
    color: '#f97316'
  },
  {
    zone: 6,
    name: 'Anaerobic',
    percentage: { min: 121, max: 150 },
    purpose: 'Anaerobic capacity, 1-3 minute power',
    color: '#ef4444'
  },
  {
    zone: 7,
    name: 'Neuromuscular',
    percentage: { min: 151, max: 400 },
    purpose: 'Sprint power, <15 seconds',
    color: '#7c3aed'
  }
];

// Conditioning Mode Types
export type ConditioningMode = 'conditioning' | 'recovery' | 'sprint';

export interface ConditioningModeConfig {
  mode: ConditioningMode;
  name: string;
  description: string;
  color: string;
  icon: string;
  equipmentTypes: WorkoutEquipmentType[];
  defaultZones: number[]; // preferred HR zones
  intensityRange: { min: number; max: number }; // percentage of max
  durationRange: { min: number; max: number }; // minutes
  intervalDuration: { min: number; max: number }; // seconds
  metrics: string[]; // primary metrics to focus on
}

export enum WorkoutEquipmentType {
  // Conditioning Equipment
  RUNNING = 'running',
  ROWING = 'rowing',
  SKIERG = 'skierg',
  BIKE_ERG = 'bike_erg',
  WATTBIKE = 'wattbike',
  AIRBIKE = 'airbike',
  ROPE_JUMP = 'rope_jump',
  TREADMILL = 'treadmill',
  
  // Recovery Equipment
  FOAM_ROLLER = 'foam_roller',
  YOGA_MAT = 'yoga_mat',
  LIGHT_CARDIO = 'light_cardio',
  WALK = 'walk',
  SWIM = 'swim',
  
  // Sprint Equipment
  TRACK = 'track',
  HILL = 'hill',
  RESISTANCE_PARACHUTE = 'resistance_parachute',
  SPRINT_LANES = 'sprint_lanes',
  SLED = 'sled'
}

export interface WorkoutEquipmentConfig {
  type: WorkoutEquipmentType;
  label: string;
  displayName: string;
  description?: string;
  icon: string;
  metrics: {
    primary: 'watts' | 'pace' | 'speed' | 'count';
    secondary?: ('heartRate' | 'rpm' | 'calories' | 'distance' | 'watts' | 'strokeRate' | 'runCadence' | 'wattsPerKg' | 'split500m')[];
    supported: string[]; // All supported metric types for this equipment
  };
  units: {
    pace?: string;
    speed?: string;
    distance?: string;
    power?: string;
    cadence?: string;
  };
  zones?: {
    heartRate: { min: number; max: number; name: string }[];
    power?: { min: number; max: number; name: string }[];
  };
}

// Mode Configurations
export const CONDITIONING_MODE_CONFIGS: Record<ConditioningMode, ConditioningModeConfig> = {
  conditioning: {
    mode: 'conditioning',
    name: 'Conditioning',
    description: 'Traditional cardio training with mixed intensity zones',
    color: '#ef4444', // red
    icon: '🔥',
    equipmentTypes: [
      WorkoutEquipmentType.RUNNING,
      WorkoutEquipmentType.ROWING,
      WorkoutEquipmentType.SKIERG,
      WorkoutEquipmentType.BIKE_ERG,
      WorkoutEquipmentType.WATTBIKE,
      WorkoutEquipmentType.AIRBIKE,
      WorkoutEquipmentType.ROPE_JUMP,
      WorkoutEquipmentType.TREADMILL
    ],
    defaultZones: [3, 4, 5], // Aerobic, Threshold, Maximum
    intensityRange: { min: 70, max: 100 },
    durationRange: { min: 20, max: 90 },
    intervalDuration: { min: 30, max: 600 }, // 30 seconds to 10 minutes
    metrics: ['heartRate', 'watts', 'pace', 'calories', 'distance']
  },
  recovery: {
    mode: 'recovery',
    name: 'Recovery',
    description: 'Low-intensity active recovery focused on regeneration',
    color: '#10b981', // green
    icon: '🧘',
    equipmentTypes: [
      WorkoutEquipmentType.FOAM_ROLLER,
      WorkoutEquipmentType.YOGA_MAT,
      WorkoutEquipmentType.LIGHT_CARDIO,
      WorkoutEquipmentType.WALK,
      WorkoutEquipmentType.SWIM,
      WorkoutEquipmentType.ROWING, // light rowing
      WorkoutEquipmentType.BIKE_ERG, // easy spinning
    ],
    defaultZones: [1, 2], // Warm-up, Easy
    intensityRange: { min: 50, max: 70 },
    durationRange: { min: 20, max: 60 },
    intervalDuration: { min: 60, max: 1200 }, // 1-20 minutes
    metrics: ['heartRate', 'hrv', 'recoveryScore', 'rpe']
  },
  sprint: {
    mode: 'sprint',
    name: 'Sprint',
    description: 'High-intensity sprint intervals for speed and power',
    color: '#7c3aed', // purple
    icon: '⚡',
    equipmentTypes: [
      WorkoutEquipmentType.TRACK,
      WorkoutEquipmentType.HILL,
      WorkoutEquipmentType.RESISTANCE_PARACHUTE,
      WorkoutEquipmentType.SPRINT_LANES,
      WorkoutEquipmentType.SLED,
      WorkoutEquipmentType.RUNNING,
      WorkoutEquipmentType.TREADMILL
    ],
    defaultZones: [4, 5], // Threshold, Maximum
    intensityRange: { min: 80, max: 100 },
    durationRange: { min: 10, max: 45 },
    intervalDuration: { min: 10, max: 120 }, // 10 seconds to 2 minutes
    metrics: ['speed', 'acceleration', 'power', 'heartRate', 'splitTimes']
  }
};

export const EQUIPMENT_CONFIGS: Record<WorkoutEquipmentType, WorkoutEquipmentConfig> = {
  [WorkoutEquipmentType.RUNNING]: {
    type: WorkoutEquipmentType.RUNNING,
    label: 'Running',
    displayName: 'Running',
    description: 'Outdoor/track running with pace, cadence, and heart rate tracking',
    icon: '🏃',
    metrics: { 
      primary: 'pace', 
      secondary: ['heartRate', 'distance', 'calories', 'runCadence'],
      supported: ['heartRate', 'heartRateZone', 'pace', 'speed', 'distance', 'calories', 'runCadence', 'rpe']
    },
    units: { pace: 'min/km', speed: 'km/h', distance: 'm', cadence: 'spm' },
    zones: {
      heartRate: [
        { min: 50, max: 60, name: 'Zone 1 - Recovery' },
        { min: 60, max: 70, name: 'Zone 2 - Aerobic Base' },
        { min: 70, max: 80, name: 'Zone 3 - Aerobic' },
        { min: 80, max: 90, name: 'Zone 4 - Lactate Threshold' },
        { min: 90, max: 100, name: 'Zone 5 - VO2 Max' }
      ]
    }
  },
  [WorkoutEquipmentType.ROWING]: {
    type: WorkoutEquipmentType.ROWING,
    label: 'Rowing',
    displayName: 'Rowing',
    description: 'Indoor rowing with pace, watts, stroke rate, and damper setting',
    icon: '🚣',
    metrics: { 
      primary: 'pace', 
      secondary: ['heartRate', 'watts', 'calories', 'distance', 'strokeRate'],
      supported: ['heartRate', 'heartRateZone', 'watts', 'wattsPerKg', 'pace', 'split500m', 'distance', 'calories', 'strokeRate', 'damperSetting', 'rpe']
    },
    units: { pace: '/500m', distance: 'm', power: 'W', cadence: 'spm' },
    zones: {
      heartRate: [
        { min: 50, max: 60, name: 'Zone 1 - Recovery' },
        { min: 60, max: 70, name: 'Zone 2 - Aerobic Base' },
        { min: 70, max: 80, name: 'Zone 3 - Aerobic' },
        { min: 80, max: 90, name: 'Zone 4 - Lactate Threshold' },
        { min: 90, max: 100, name: 'Zone 5 - VO2 Max' }
      ],
      power: [
        { min: 0, max: 60, name: 'Zone 1 - Active Recovery' },
        { min: 60, max: 75, name: 'Zone 2 - Endurance' },
        { min: 75, max: 90, name: 'Zone 3 - Tempo' },
        { min: 90, max: 105, name: 'Zone 4 - Lactate Threshold' },
        { min: 105, max: 120, name: 'Zone 5 - VO2 Max' },
        { min: 120, max: 150, name: 'Zone 6 - Anaerobic' }
      ]
    }
  },
  [WorkoutEquipmentType.SKIERG]: {
    type: WorkoutEquipmentType.SKIERG,
    label: 'SkiErg',
    displayName: 'SkiErg',
    description: 'Nordic skiing simulation with pace, watts, and stroke rate',
    icon: '⛷️',
    metrics: { 
      primary: 'pace', 
      secondary: ['heartRate', 'watts', 'calories', 'distance'],
      supported: ['heartRate', 'heartRateZone', 'watts', 'wattsPerKg', 'pace', 'split500m', 'distance', 'calories', 'strokeRate', 'damperSetting', 'rpe']
    },
    units: { pace: '/500m', distance: 'm', power: 'W', cadence: 'spm' },
    zones: {
      heartRate: [
        { min: 50, max: 60, name: 'Zone 1 - Recovery' },
        { min: 60, max: 70, name: 'Zone 2 - Aerobic Base' },
        { min: 70, max: 80, name: 'Zone 3 - Aerobic' },
        { min: 80, max: 90, name: 'Zone 4 - Lactate Threshold' },
        { min: 90, max: 100, name: 'Zone 5 - VO2 Max' }
      ],
      power: [
        { min: 0, max: 60, name: 'Zone 1 - Active Recovery' },
        { min: 60, max: 75, name: 'Zone 2 - Endurance' },
        { min: 75, max: 90, name: 'Zone 3 - Tempo' },
        { min: 90, max: 105, name: 'Zone 4 - Lactate Threshold' },
        { min: 105, max: 120, name: 'Zone 5 - VO2 Max' },
        { min: 120, max: 150, name: 'Zone 6 - Anaerobic' }
      ]
    }
  },
  [WorkoutEquipmentType.BIKE_ERG]: {
    type: WorkoutEquipmentType.BIKE_ERG,
    label: 'Bike Erg',
    displayName: 'Bike Erg',
    description: 'Stationary bike with watts, RPM, and resistance tracking',
    icon: '🚴',
    metrics: { 
      primary: 'watts', 
      secondary: ['heartRate', 'rpm', 'calories', 'distance'],
      supported: ['heartRate', 'heartRateZone', 'watts', 'wattsPerKg', 'speed', 'distance', 'calories', 'rpm', 'resistance', 'rpe']
    },
    units: { speed: 'km/h', distance: 'km', power: 'W', cadence: 'rpm' },
    zones: {
      heartRate: [
        { min: 50, max: 60, name: 'Zone 1 - Recovery' },
        { min: 60, max: 70, name: 'Zone 2 - Aerobic Base' },
        { min: 70, max: 80, name: 'Zone 3 - Aerobic' },
        { min: 80, max: 90, name: 'Zone 4 - Lactate Threshold' },
        { min: 90, max: 100, name: 'Zone 5 - VO2 Max' }
      ],
      power: [
        { min: 0, max: 55, name: 'Zone 1 - Active Recovery' },
        { min: 56, max: 75, name: 'Zone 2 - Endurance' },
        { min: 76, max: 90, name: 'Zone 3 - Tempo' },
        { min: 91, max: 105, name: 'Zone 4 - Lactate Threshold' },
        { min: 106, max: 120, name: 'Zone 5 - VO2 Max' },
        { min: 121, max: 150, name: 'Zone 6 - Anaerobic' }
      ]
    }
  },
  [WorkoutEquipmentType.WATTBIKE]: {
    type: WorkoutEquipmentType.WATTBIKE,
    label: 'Wattbike',
    displayName: 'Wattbike',
    description: 'Professional cycling trainer with advanced power metrics',
    icon: '🚴‍♂️',
    metrics: { 
      primary: 'watts', 
      secondary: ['heartRate', 'rpm', 'calories', 'distance'],
      supported: ['heartRate', 'heartRateZone', 'watts', 'wattsPerKg', 'speed', 'distance', 'calories', 'rpm', 'resistance', 'rpe']
    },
    units: { speed: 'km/h', distance: 'km', power: 'W', cadence: 'rpm' },
    zones: {
      heartRate: [
        { min: 50, max: 60, name: 'Zone 1 - Recovery' },
        { min: 60, max: 70, name: 'Zone 2 - Aerobic Base' },
        { min: 70, max: 80, name: 'Zone 3 - Aerobic' },
        { min: 80, max: 90, name: 'Zone 4 - Lactate Threshold' },
        { min: 90, max: 100, name: 'Zone 5 - VO2 Max' }
      ],
      power: [
        { min: 0, max: 55, name: 'Zone 1 - Active Recovery' },
        { min: 56, max: 75, name: 'Zone 2 - Endurance' },
        { min: 76, max: 90, name: 'Zone 3 - Tempo' },
        { min: 91, max: 105, name: 'Zone 4 - Lactate Threshold' },
        { min: 106, max: 120, name: 'Zone 5 - VO2 Max' },
        { min: 121, max: 150, name: 'Zone 6 - Anaerobic' }
      ]
    }
  },
  [WorkoutEquipmentType.AIRBIKE]: {
    type: WorkoutEquipmentType.AIRBIKE,
    label: 'Air Bike',
    displayName: 'Air Bike',
    description: 'Full-body cardio with fan resistance, watts, and RPM tracking',
    icon: '💨',
    metrics: { 
      primary: 'watts', 
      secondary: ['heartRate', 'rpm', 'calories'],
      supported: ['heartRate', 'heartRateZone', 'watts', 'wattsPerKg', 'speed', 'calories', 'rpm', 'rpe']
    },
    units: { speed: 'km/h', power: 'W', cadence: 'rpm' },
    zones: {
      heartRate: [
        { min: 50, max: 60, name: 'Zone 1 - Recovery' },
        { min: 60, max: 70, name: 'Zone 2 - Aerobic Base' },
        { min: 70, max: 80, name: 'Zone 3 - Aerobic' },
        { min: 80, max: 90, name: 'Zone 4 - Lactate Threshold' },
        { min: 90, max: 100, name: 'Zone 5 - VO2 Max' }
      ]
    }
  },
  [WorkoutEquipmentType.ROPE_JUMP]: {
    type: WorkoutEquipmentType.ROPE_JUMP,
    label: 'Rope Jump',
    displayName: 'Rope Jump',
    description: 'Jump rope with count tracking and heart rate monitoring',
    icon: '🪢',
    metrics: { 
      primary: 'count', 
      secondary: ['heartRate', 'calories'],
      supported: ['heartRate', 'heartRateZone', 'calories', 'runCadence', 'rpe']
    },
    units: { cadence: 'jumps/min' },
    zones: {
      heartRate: [
        { min: 50, max: 60, name: 'Zone 1 - Recovery' },
        { min: 60, max: 70, name: 'Zone 2 - Aerobic Base' },
        { min: 70, max: 80, name: 'Zone 3 - Aerobic' },
        { min: 80, max: 90, name: 'Zone 4 - Lactate Threshold' },
        { min: 90, max: 100, name: 'Zone 5 - VO2 Max' }
      ]
    }
  },
  [WorkoutEquipmentType.TREADMILL]: {
    type: WorkoutEquipmentType.TREADMILL,
    label: 'Treadmill',
    displayName: 'Treadmill',
    description: 'Indoor running with speed, incline, and heart rate control',
    icon: '🏃‍♂️',
    metrics: { 
      primary: 'speed', 
      secondary: ['heartRate', 'distance', 'calories'],
      supported: ['heartRate', 'heartRateZone', 'pace', 'speed', 'distance', 'calories', 'incline', 'runCadence', 'rpe']
    },
    units: { speed: 'km/h', distance: 'km', pace: 'min/km', cadence: 'spm' },
    zones: {
      heartRate: [
        { min: 50, max: 60, name: 'Zone 1 - Recovery' },
        { min: 60, max: 70, name: 'Zone 2 - Aerobic Base' },
        { min: 70, max: 80, name: 'Zone 3 - Aerobic' },
        { min: 80, max: 90, name: 'Zone 4 - Lactate Threshold' },
        { min: 90, max: 100, name: 'Zone 5 - VO2 Max' }
      ]
    }
  },
  
  // Recovery Equipment
  [WorkoutEquipmentType.FOAM_ROLLER]: {
    type: WorkoutEquipmentType.FOAM_ROLLER,
    label: 'Foam Roller',
    displayName: 'Foam Rolling',
    description: 'Myofascial release and muscle recovery',
    icon: '🎳',
    metrics: {
      primary: 'count',
      secondary: ['heartRate', 'rpe'],
      supported: ['heartRate', 'rpe', 'duration', 'bodyPart']
    },
    units: { duration: 'min' },
    zones: {
      heartRate: [
        { min: 50, max: 65, name: 'Zone 1 - Recovery' }
      ]
    }
  },
  [WorkoutEquipmentType.YOGA_MAT]: {
    type: WorkoutEquipmentType.YOGA_MAT,
    label: 'Yoga Mat',
    displayName: 'Yoga/Stretching',
    description: 'Flexibility, mobility, and mindfulness practice',
    icon: '🧘‍♀️',
    metrics: {
      primary: 'count',
      secondary: ['heartRate', 'rpe'],
      supported: ['heartRate', 'rpe', 'duration', 'flexibility']
    },
    units: { duration: 'min' },
    zones: {
      heartRate: [
        { min: 50, max: 70, name: 'Zone 1-2 - Recovery/Easy' }
      ]
    }
  },
  [WorkoutEquipmentType.LIGHT_CARDIO]: {
    type: WorkoutEquipmentType.LIGHT_CARDIO,
    label: 'Light Cardio',
    displayName: 'Light Cardio',
    description: 'Easy-paced cardiovascular activity',
    icon: '💨',
    metrics: {
      primary: 'pace',
      secondary: ['heartRate', 'calories', 'distance'],
      supported: ['heartRate', 'heartRateZone', 'pace', 'speed', 'distance', 'calories', 'rpe']
    },
    units: { pace: 'min/km', speed: 'km/h', distance: 'm' },
    zones: {
      heartRate: [
        { min: 50, max: 65, name: 'Zone 1 - Recovery' },
        { min: 60, max: 70, name: 'Zone 2 - Aerobic Base' }
      ]
    }
  },
  [WorkoutEquipmentType.WALK]: {
    type: WorkoutEquipmentType.WALK,
    label: 'Walk',
    displayName: 'Walking',
    description: 'Low-impact walking for active recovery',
    icon: '🚶‍♀️',
    metrics: {
      primary: 'pace',
      secondary: ['heartRate', 'distance', 'calories'],
      supported: ['heartRate', 'heartRateZone', 'pace', 'speed', 'distance', 'calories', 'rpe']
    },
    units: { pace: 'min/km', speed: 'km/h', distance: 'm' },
    zones: {
      heartRate: [
        { min: 50, max: 60, name: 'Zone 1 - Recovery' },
        { min: 60, max: 70, name: 'Zone 2 - Aerobic Base' }
      ]
    }
  },
  [WorkoutEquipmentType.SWIM]: {
    type: WorkoutEquipmentType.SWIM,
    label: 'Swim',
    displayName: 'Swimming',
    description: 'Low-impact swimming for recovery',
    icon: '🏊‍♀️',
    metrics: {
      primary: 'pace',
      secondary: ['heartRate', 'distance', 'calories', 'strokeRate'],
      supported: ['heartRate', 'heartRateZone', 'pace', 'distance', 'calories', 'strokeRate', 'rpe']
    },
    units: { pace: '/100m', distance: 'm' },
    zones: {
      heartRate: [
        { min: 50, max: 65, name: 'Zone 1 - Recovery' },
        { min: 60, max: 75, name: 'Zone 2 - Aerobic Base' }
      ]
    }
  },
  
  // Sprint Equipment
  [WorkoutEquipmentType.TRACK]: {
    type: WorkoutEquipmentType.TRACK,
    label: 'Track',
    displayName: 'Track Running',
    description: 'Sprint intervals on athletic track',
    icon: '🏃‍♂️',
    metrics: {
      primary: 'speed',
      secondary: ['heartRate', 'acceleration', 'splitTimes', 'distance'],
      supported: ['heartRate', 'heartRateZone', 'speed', 'pace', 'distance', 'acceleration', 'splitTimes', 'maxSpeed', 'rpe']
    },
    units: { speed: 'm/s', pace: 'min/km', distance: 'm', acceleration: 'm/s²' },
    zones: {
      heartRate: [
        { min: 80, max: 90, name: 'Zone 4 - Lactate Threshold' },
        { min: 90, max: 100, name: 'Zone 5 - VO2 Max' }
      ]
    }
  },
  [WorkoutEquipmentType.HILL]: {
    type: WorkoutEquipmentType.HILL,
    label: 'Hill',
    displayName: 'Hill Sprints',
    description: 'Sprint intervals on inclined terrain',
    icon: '⛰️',
    metrics: {
      primary: 'speed',
      secondary: ['heartRate', 'power', 'incline', 'distance'],
      supported: ['heartRate', 'heartRateZone', 'speed', 'power', 'distance', 'incline', 'elevation', 'rpe']
    },
    units: { speed: 'm/s', distance: 'm', incline: '%', elevation: 'm' },
    zones: {
      heartRate: [
        { min: 80, max: 95, name: 'Zone 4-5 - Threshold/Max' }
      ]
    }
  },
  [WorkoutEquipmentType.RESISTANCE_PARACHUTE]: {
    type: WorkoutEquipmentType.RESISTANCE_PARACHUTE,
    label: 'Resistance Parachute',
    displayName: 'Parachute Sprints',
    description: 'Resistance sprint training with parachute',
    icon: '🪂',
    metrics: {
      primary: 'speed',
      secondary: ['heartRate', 'power', 'resistance', 'acceleration'],
      supported: ['heartRate', 'heartRateZone', 'speed', 'power', 'resistance', 'acceleration', 'distance', 'rpe']
    },
    units: { speed: 'm/s', distance: 'm', resistance: 'N', acceleration: 'm/s²' },
    zones: {
      heartRate: [
        { min: 85, max: 100, name: 'Zone 5 - Maximum' }
      ]
    }
  },
  [WorkoutEquipmentType.SPRINT_LANES]: {
    type: WorkoutEquipmentType.SPRINT_LANES,
    label: 'Sprint Lanes',
    displayName: 'Lane Sprints',
    description: 'Structured sprint intervals in marked lanes',
    icon: '🏁',
    metrics: {
      primary: 'speed',
      secondary: ['heartRate', 'splitTimes', 'acceleration', 'reactionTime'],
      supported: ['heartRate', 'heartRateZone', 'speed', 'pace', 'distance', 'splitTimes', 'acceleration', 'reactionTime', 'rpe']
    },
    units: { speed: 'm/s', distance: 'm', splitTimes: 's', acceleration: 'm/s²' },
    zones: {
      heartRate: [
        { min: 80, max: 90, name: 'Zone 4 - Lactate Threshold' },
        { min: 90, max: 100, name: 'Zone 5 - VO2 Max' }
      ]
    }
  },
  [WorkoutEquipmentType.SLED]: {
    type: WorkoutEquipmentType.SLED,
    label: 'Sled',
    displayName: 'Sled Pushes/Pulls',
    description: 'Heavy sled training for power and acceleration',
    icon: '🛷',
    metrics: {
      primary: 'speed',
      secondary: ['heartRate', 'power', 'force', 'distance'],
      supported: ['heartRate', 'heartRateZone', 'speed', 'power', 'force', 'distance', 'weight', 'rpe']
    },
    units: { speed: 'm/s', distance: 'm', force: 'N', weight: 'kg' },
    zones: {
      heartRate: [
        { min: 85, max: 100, name: 'Zone 5 - Maximum' }
      ]
    }
  }
};

export type IntervalType = 'warmup' | 'work' | 'rest' | 'cooldown' | 'active_recovery';

export interface TargetMetric {
  type: TargetMetricType;
  value: number | { min: number; max: number }; // Support for ranges
  reference?: TargetReference;
  zoneSystem?: 'garmin_hr' | 'lactate' | 'power' | 'custom'; // Which zone system to use
  testId?: string; // Reference to specific test result
  unit?: string; // Unit for display (bpm, watts, km/h, etc.)
  customZones?: { min: number; max: number; name: string }[]; // Custom zone definitions
}

// Add setConfig interface for interval sets
export interface IntervalSetConfig {
  numberOfSets: number;
  intervalsPerSet: number;
  restBetweenSets: number;
  restBetweenIntervals: number;
}

export interface IntervalSet {
  id: string;
  type: IntervalType;
  name?: string;
  targetType?: 'time' | 'distance' | 'calories';
  duration: number; // seconds (for time-based intervals)
  targetDistance?: number; // meters or km based on equipment
  targetCalories?: number; // target calories to burn
  equipment: WorkoutEquipmentType;
  targetMetrics: {
    // Heart Rate Metrics
    heartRate?: TargetMetric;
    heartRateZone?: number; // 1-5 for traditional zones, 1-7 for detailed zones
    
    // Recovery-specific metrics
    hrv?: TargetMetric; // Heart Rate Variability (ms)
    recoveryScore?: TargetMetric; // 0-100 recovery score
    
    // Sprint-specific metrics
    acceleration?: TargetMetric; // m/s²
    maxSpeed?: TargetMetric; // m/s or km/h
    splitTimes?: number[]; // array of split times in seconds
    reactionTime?: number; // milliseconds
    force?: TargetMetric; // Newtons
    weight?: number; // kg for sled work
    
    // Power/Watts Metrics
    watts?: TargetMetric;
    wattsPerKg?: TargetMetric; // Power-to-weight ratio
    
    // Pace/Speed Metrics
    pace?: TargetMetric; // For rowing (/500m), running (/km), etc.
    speed?: TargetMetric; // km/h or mph
    split500m?: TargetMetric; // Specific for rowing
    
    // Cadence/RPM Metrics
    rpm?: TargetMetric; // Now as TargetMetric for percentage-based targets
    strokeRate?: TargetMetric; // For rowing (strokes per minute)
    runCadence?: TargetMetric; // Steps per minute for running
    
    // Equipment-specific Metrics
    incline?: TargetMetric; // Treadmill incline percentage
    resistance?: TargetMetric; // Bike/equipment resistance level
    damperSetting?: number; // For erg machines
    
    // Output Metrics
    calories?: TargetMetric;
    distance?: TargetMetric;
    
    // Lactate Threshold Metrics
    lactateLevel?: TargetMetric; // mmol/L
    
    // Perceived Exertion
    rpe?: number; // 1-10 scale
  };
  notes?: string;
  color?: string; // For visual representation
  sourceIntervalId?: string; // For tracking expanded intervals from sets
  setConfig?: IntervalSetConfig; // Configuration for creating sets
}

export interface IntervalProgram {
  id: string;
  name: string;
  description?: string;
  mode?: ConditioningMode; // NEW: Mode support
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
  metadata?: {
    sessionId?: string | number;
    sessionType?: string;
    sessionDate?: string;
    sessionTime?: string;
    sessionLocation?: string;
    [key: string]: any;
  };
}

export interface PlayerTestResult {
  id: string;
  playerId: string;
  testType: 'vo2max' | 'lactate_threshold' | 'ftp' | 'max_hr' | 'max_watts' | 'vvo2max' | 'anaerobic_threshold' | 'lt1' | 'lt2' | 'ramp_test' | 'critical_power' | 'max_speed' | 'critical_speed';
  value: number;
  unit: string;
  testDate: Date;
  validUntil?: Date;
  notes?: string;
  conductedBy?: string;
  subValues?: { // For complex tests that produce multiple values
    [key: string]: number;
  };
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
  category: 'hiit' | 'steady_state' | 'pyramid' | 'fartlek' | 'recovery' | 'test' | 'custom' | 'sprint_intervals' | 'hill_repeats' | 'active_recovery' | 'hrv_guided';
  description: string;
  mode?: ConditioningMode; // NEW: Mode support  
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

// Enhanced Zone Calculation Functions
export const calculateMaxHR = (age: number, method: 'tanaka' | 'fox' | 'gellish' = 'tanaka'): number => {
  switch (method) {
    case 'tanaka':
      return 208 - (0.7 * age);
    case 'fox':
      return 220 - age;
    case 'gellish':
      return 207 - (0.7 * age);
    default:
      return 208 - (0.7 * age);
  }
};

export const getGarminZoneFromHR = (hr: number, maxHr: number): GarminHeartRateZone | null => {
  const percentage = (hr / maxHr) * 100;
  return GARMIN_HR_ZONES.find(zone => 
    percentage >= zone.percentage.min && percentage <= zone.percentage.max
  ) || null;
};

export const calculateZoneHRRange = (zone: number, maxHr: number, zoneSystem: 'garmin_hr' | 'lactate' = 'garmin_hr'): { min: number; max: number } => {
  if (zoneSystem === 'garmin_hr') {
    const garminZone = GARMIN_HR_ZONES.find(z => z.zone === zone);
    if (garminZone) {
      return {
        min: Math.round((garminZone.percentage.min / 100) * maxHr),
        max: Math.round((garminZone.percentage.max / 100) * maxHr)
      };
    }
  }
  
  // Fallback to basic zones
  const zones = [
    { min: 50, max: 60 },
    { min: 60, max: 70 },
    { min: 70, max: 80 },
    { min: 80, max: 90 },
    { min: 90, max: 100 }
  ];
  
  const zoneData = zones[zone - 1];
  if (zoneData) {
    return {
      min: Math.round((zoneData.min / 100) * maxHr),
      max: Math.round((zoneData.max / 100) * maxHr)
    };
  }
  
  return { min: maxHr * 0.6, max: maxHr * 0.7 };
};

export const calculateZonePowerRange = (zone: number, ftp: number): { min: number; max: number } => {
  const powerZone = POWER_ZONES.find(z => z.zone === zone);
  if (powerZone) {
    return {
      min: Math.round((powerZone.percentage.min / 100) * ftp),
      max: Math.round((powerZone.percentage.max / 100) * ftp)
    };
  }
  
  return { min: Math.round(ftp * 0.5), max: Math.round(ftp * 0.6) };
};

export const getPlayerMaxHR = (player: any, playerTests: PlayerTestResult[]): number => {
  // First, try to get from test results
  const maxHRTest = playerTests.find(test => 
    test.playerId === player.id && test.testType === 'max_hr'
  );
  
  if (maxHRTest) {
    return maxHRTest.value;
  }
  
  // Calculate from age if available
  if (player.age) {
    return calculateMaxHR(player.age);
  }
  
  // Default for athletes (typically higher than general population)
  return 190;
};

export const getPlayerFTP = (player: any, playerTests: PlayerTestResult[]): number | null => {
  const ftpTest = playerTests.find(test => 
    test.playerId === player.id && test.testType === 'ftp'
  );
  
  return ftpTest?.value || null;
};

export const getPlayerLactateThreshold = (player: any, playerTests: PlayerTestResult[], type: 'lt1' | 'lt2' = 'lt2'): number | null => {
  const ltTest = playerTests.find(test => 
    test.playerId === player.id && test.testType === type
  );
  
  return ltTest?.value || null;
};

export const calculatePersonalizedTargetEnhanced = (
  target: TargetMetric,
  player: any,
  playerTests: PlayerTestResult[]
): number | { min: number; max: number } | null => {
  if (target.type === 'absolute') {
    return typeof target.value === 'number' ? target.value : target.value;
  }
  
  if (target.type === 'zone') {
    const zoneNumber = typeof target.value === 'number' ? target.value : target.value.min;
    
    if (target.zoneSystem === 'garmin_hr' || !target.zoneSystem) {
      const maxHR = getPlayerMaxHR(player, playerTests);
      const range = calculateZoneHRRange(zoneNumber, maxHR, 'garmin_hr');
      return typeof target.value === 'number' ? range.min : range;
    }
    
    if (target.zoneSystem === 'power') {
      const ftp = getPlayerFTP(player, playerTests);
      if (ftp) {
        const range = calculateZonePowerRange(zoneNumber, ftp);
        return typeof target.value === 'number' ? range.min : range;
      }
    }
  }
  
  if (target.type === 'percentage' && target.reference) {
    const referenceValue = getReferenceValue(target.reference, player, playerTests);
    if (referenceValue) {
      const percentage = typeof target.value === 'number' ? target.value : target.value.min;
      return Math.round((referenceValue * percentage) / 100);
    }
  }
  
  return null;
};

const getReferenceValue = (reference: TargetReference, player: any, playerTests: PlayerTestResult[]): number | null => {
  switch (reference) {
    case 'max_hr':
      return getPlayerMaxHR(player, playerTests);
    case 'ftp':
      return getPlayerFTP(player, playerTests);
    case 'lt1':
      return getPlayerLactateThreshold(player, playerTests, 'lt1');
    case 'lt2':
      return getPlayerLactateThreshold(player, playerTests, 'lt2');
    case 'vo2max':
      const vo2Test = playerTests.find(test => 
        test.playerId === player.id && test.testType === 'vo2max'
      );
      return vo2Test?.value || null;
    default:
      return null;
  }
};

// Type alias for ConditioningTemplate (uses WorkoutTemplate)
export type ConditioningTemplate = WorkoutTemplate;

// Mode Helper Functions
export const getEquipmentForMode = (mode: ConditioningMode): WorkoutEquipmentType[] => {
  return CONDITIONING_MODE_CONFIGS[mode].equipmentTypes;
};

export const getModeConfig = (mode: ConditioningMode): ConditioningModeConfig => {
  return CONDITIONING_MODE_CONFIGS[mode];
};

export const getDefaultEquipmentForMode = (mode: ConditioningMode): WorkoutEquipmentType => {
  const config = CONDITIONING_MODE_CONFIGS[mode];
  return config.equipmentTypes[0]; // Return first equipment type as default
};

export const isEquipmentValidForMode = (equipment: WorkoutEquipmentType, mode: ConditioningMode): boolean => {
  return CONDITIONING_MODE_CONFIGS[mode].equipmentTypes.includes(equipment);
};

// Mode-specific template generators
export const generateModeTemplates = (mode: ConditioningMode): WorkoutTemplate[] => {
  const config = CONDITIONING_MODE_CONFIGS[mode];
  
  if (mode === 'recovery') {
    return [
      {
        id: 'recovery-active-recovery',
        name: 'Active Recovery Session',
        category: 'active_recovery',
        description: 'Low-intensity movement for recovery',
        mode,
        intervalProgram: {
          name: 'Active Recovery',
          description: 'Easy-paced movement to promote recovery',
          mode,
          equipment: WorkoutEquipmentType.LIGHT_CARDIO,
          intervals: [
            {
              id: 'warmup-1',
              type: 'warmup',
              name: 'Gentle Warm-up',
              duration: 300, // 5 min
              equipment: WorkoutEquipmentType.LIGHT_CARDIO,
              targetMetrics: { heartRate: { type: 'zone', value: 1, zoneSystem: 'garmin_hr' } },
              color: '#94a3b8'
            },
            {
              id: 'main-1',
              type: 'work',
              name: 'Easy Movement',
              duration: 1200, // 20 min
              equipment: WorkoutEquipmentType.LIGHT_CARDIO,
              targetMetrics: { 
                heartRate: { type: 'zone', value: 2, zoneSystem: 'garmin_hr' },
                rpe: 3
              },
              color: '#3b82f6'
            },
            {
              id: 'cooldown-1',
              type: 'cooldown',
              name: 'Cool Down',
              duration: 300, // 5 min
              equipment: WorkoutEquipmentType.YOGA_MAT,
              targetMetrics: { rpe: 2 },
              color: '#10b981'
            }
          ],
          totalDuration: 1800, // 30 min
          estimatedCalories: 150,
          difficulty: 'beginner'
        },
        recommendedFor: ['recovery', 'active_rest'],
        isPublic: true
      },
      {
        id: 'recovery-hrv-guided',
        name: 'HRV-Guided Recovery',
        category: 'hrv_guided',
        description: 'Heart rate variability guided recovery session',
        mode,
        intervalProgram: {
          name: 'HRV Recovery',
          description: 'Recovery intensity based on HRV readings',
          mode,
          equipment: WorkoutEquipmentType.WALK,
          intervals: [
            {
              id: 'main-1',
              type: 'work',
              name: 'HRV-Guided Movement',
              duration: 2400, // 40 min
              equipment: WorkoutEquipmentType.WALK,
              targetMetrics: { 
                heartRate: { type: 'zone', value: 1, zoneSystem: 'garmin_hr' },
                hrv: { type: 'percentage', value: 80, reference: 'threshold_hr' }
              },
              color: '#10b981'
            }
          ],
          totalDuration: 2400,
          estimatedCalories: 120,
          difficulty: 'beginner'
        },
        recommendedFor: ['post_competition', 'high_stress'],
        isPublic: true
      }
    ];
  } else if (mode === 'sprint') {
    return [
      {
        id: 'sprint-track-intervals',
        name: 'Track Sprint Intervals',
        category: 'sprint_intervals',
        description: 'Classic track sprint intervals (100m, 200m, 400m)',
        mode,
        intervalProgram: {
          name: 'Track Sprints',
          description: 'Progressive sprint distances with full recovery',
          mode,
          equipment: WorkoutEquipmentType.TRACK,
          intervals: [
            {
              id: 'warmup-1',
              type: 'warmup',
              name: 'Dynamic Warm-up',
              duration: 600, // 10 min
              equipment: WorkoutEquipmentType.TRACK,
              targetMetrics: { heartRate: { type: 'zone', value: 3, zoneSystem: 'garmin_hr' } },
              color: '#f59e0b'
            },
            {
              id: 'sprint-1',
              type: 'work',
              name: '100m Sprint',
              duration: 15,
              targetDistance: 100,
              equipment: WorkoutEquipmentType.TRACK,
              targetMetrics: { 
                heartRate: { type: 'zone', value: 5, zoneSystem: 'garmin_hr' },
                speed: { type: 'percentage', value: 95, reference: 'max_speed' }
              },
              color: '#ef4444'
            },
            {
              id: 'rest-1',
              type: 'rest',
              name: 'Full Recovery',
              duration: 180, // 3 min
              equipment: WorkoutEquipmentType.TRACK,
              targetMetrics: { heartRate: { type: 'zone', value: 2, zoneSystem: 'garmin_hr' } },
              color: '#3b82f6'
            },
            {
              id: 'sprint-2',
              type: 'work',
              name: '200m Sprint',
              duration: 30,
              targetDistance: 200,
              equipment: WorkoutEquipmentType.TRACK,
              targetMetrics: { 
                heartRate: { type: 'zone', value: 5, zoneSystem: 'garmin_hr' },
                speed: { type: 'percentage', value: 90, reference: 'max_speed' }
              },
              color: '#ef4444'
            },
            {
              id: 'rest-2',
              type: 'rest',
              name: 'Full Recovery',
              duration: 300, // 5 min
              equipment: WorkoutEquipmentType.TRACK,
              targetMetrics: { heartRate: { type: 'zone', value: 2, zoneSystem: 'garmin_hr' } },
              color: '#3b82f6'
            },
            {
              id: 'cooldown-1',
              type: 'cooldown',
              name: 'Easy Jog',
              duration: 600, // 10 min
              equipment: WorkoutEquipmentType.TRACK,
              targetMetrics: { heartRate: { type: 'zone', value: 2, zoneSystem: 'garmin_hr' } },
              color: '#10b981'
            }
          ],
          totalDuration: 1725, // ~29 min
          estimatedCalories: 350,
          difficulty: 'advanced'
        },
        recommendedFor: ['speed_development', 'power_training'],
        isPublic: true
      },
      {
        id: 'sprint-hill-repeats',
        name: 'Hill Sprint Repeats',
        category: 'hill_repeats',
        description: 'Hill sprint training for power and acceleration',
        mode,
        intervalProgram: {
          name: 'Hill Repeats',
          description: 'Short hill sprints with walking recovery',
          mode,
          equipment: WorkoutEquipmentType.HILL,
          intervals: [
            {
              id: 'warmup-1',
              type: 'warmup',
              name: 'Uphill Walk',
              duration: 600, // 10 min
              equipment: WorkoutEquipmentType.HILL,
              targetMetrics: { 
                heartRate: { type: 'zone', value: 3, zoneSystem: 'garmin_hr' },
                incline: { type: 'absolute', value: 8 }
              },
              color: '#f59e0b'
            },
            {
              id: 'sprint-1',
              type: 'work',
              name: 'Hill Sprint',
              duration: 20,
              equipment: WorkoutEquipmentType.HILL,
              targetMetrics: { 
                heartRate: { type: 'zone', value: 5, zoneSystem: 'garmin_hr' },
                power: { type: 'percentage', value: 90, reference: 'critical_power' },
                incline: { type: 'absolute', value: 12 }
              },
              color: '#7c3aed'
            },
            {
              id: 'recovery-1',
              type: 'active_recovery',
              name: 'Walk Down',
              duration: 120, // 2 min
              equipment: WorkoutEquipmentType.HILL,
              targetMetrics: { heartRate: { type: 'zone', value: 2, zoneSystem: 'garmin_hr' } },
              color: '#10b981'
            }
          ],
          totalDuration: 1860, // ~31 min (with 6 repeats)
          estimatedCalories: 400,
          difficulty: 'elite'
        },
        recommendedFor: ['power_endurance', 'acceleration'],
        isPublic: true
      }
    ];
  }
  
  // Return default conditioning templates for 'conditioning' mode
  return [];
};