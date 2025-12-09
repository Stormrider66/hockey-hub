// Validation Types for Physical Trainer Module

export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export enum ValidationCategory {
  REQUIRED_FIELD = 'required_field',
  FORMAT = 'format',
  BUSINESS_RULE = 'business_rule',
  MEDICAL_COMPLIANCE = 'medical_compliance',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  PERFORMANCE_LIMIT = 'performance_limit',
  SAFETY = 'safety'
}

export interface ValidationMessage {
  field: string;
  message: string;
  severity: ValidationSeverity;
  category: ValidationCategory;
  code: string;
  suggestion?: string;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  info: ValidationMessage[];
  timestamp: string;
  validatedBy: string;
}

export interface FieldValidationRequest {
  field: string;
  value: any;
  context?: {
    workoutType: WorkoutType;
    playerId?: string;
    sessionId?: string;
    teamId?: string;
  };
}

export interface FieldValidationResult {
  field: string;
  valid: boolean;
  messages: ValidationMessage[];
}

export interface MedicalValidationRequest {
  playerId: string;
  exercises?: string[];
  movements?: string[];
  intensity?: number;
  duration?: number;
  workoutType: WorkoutType;
}

export interface MedicalValidationResult {
  compliant: boolean;
  restrictions: {
    exerciseId: string;
    restriction: string;
    severity: 'prohibited' | 'limited' | 'caution';
    alternatives: string[];
  }[];
  warnings: ValidationMessage[];
  recommendations: string[];
}

export interface ScheduleValidationRequest {
  playerId?: string;
  teamId?: string;
  startTime: string;
  endTime: string;
  facilityId?: string;
  sessionType: string;
}

export interface ScheduleConflict {
  type: 'player' | 'team' | 'facility' | 'trainer';
  conflictingEvent: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    type: string;
  };
  severity: 'hard' | 'soft';
  resolution?: string;
}

export interface ScheduleValidationResult {
  available: boolean;
  conflicts: ScheduleConflict[];
  suggestions: {
    startTime: string;
    endTime: string;
    reason: string;
  }[];
}

export interface BatchValidationRequest {
  items: {
    id: string;
    type: 'workout' | 'session' | 'exercise';
    data: any;
  }[];
  validationRules?: string[];
}

export interface BatchValidationResult {
  results: {
    id: string;
    validation: ValidationResult;
  }[];
  summary: {
    total: number;
    valid: number;
    errors: number;
    warnings: number;
  };
}

// Workout-specific validation types
export interface WorkoutValidationRequest {
  workoutType: WorkoutType;
  data: any; // Type-specific data
  players?: string[];
  scheduledDate?: string;
  validateMedical?: boolean;
  validateSchedule?: boolean;
}

// Custom validation rules
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  field?: string;
  condition: {
    operator: 'equals' | 'notEquals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'regex' | 'custom';
    value?: any;
    customFunction?: string;
  };
  action: {
    type: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
  };
  enabled: boolean;
  workoutTypes?: WorkoutType[];
}

export interface ValidationConfig {
  rules: ValidationRule[];
  realTimeValidation: boolean;
  debounceMs: number;
  cacheResults: boolean;
  cacheTTL: number;
  strictMode: boolean;
}

// Validation context for different workout types
export interface StrengthValidationContext {
  maxSets?: number;
  maxReps?: number;
  maxWeight?: number;
  restPeriodRange?: [number, number];
  techniqueRequirements?: string[];
}

export interface ConditioningValidationContext {
  maxHeartRate?: number;
  maxDuration?: number;
  minRestRatio?: number;
  equipmentAvailable?: string[];
  targetZones?: {
    zone: number;
    minPercentage: number;
    maxPercentage: number;
  }[];
}

export interface AgilityValidationContext {
  spaceRequirements?: {
    minLength: number;
    minWidth: number;
  };
  equipmentRequired?: string[];
  surfaceType?: string[];
  maxIntensity?: number;
}

export interface HybridValidationContext {
  maxBlocks?: number;
  blockTypeRatio?: {
    exercise: number;
    interval: number;
    transition: number;
  };
  totalDuration?: number;
  transitionTime?: [number, number];
}

// Validation result helpers
export interface ValidationSummary {
  hasErrors: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  byCategory: Record<ValidationCategory, number>;
  byField: Record<string, ValidationMessage[]>;
}

// Enums
export enum WorkoutType {
  STRENGTH = 'STRENGTH',
  CONDITIONING = 'CONDITIONING',
  AGILITY = 'AGILITY',
  HYBRID = 'HYBRID',
  RECOVERY = 'RECOVERY',
  TESTING = 'TESTING'
}

export enum ValidationErrorCode {
  // General
  REQUIRED_FIELD = 'VAL001',
  INVALID_FORMAT = 'VAL002',
  OUT_OF_RANGE = 'VAL003',
  
  // Medical
  MEDICAL_RESTRICTION = 'MED001',
  INJURY_CONFLICT = 'MED002',
  LOAD_LIMIT_EXCEEDED = 'MED003',
  
  // Schedule
  TIME_CONFLICT = 'SCH001',
  FACILITY_UNAVAILABLE = 'SCH002',
  REST_PERIOD_VIOLATION = 'SCH003',
  
  // Workout specific
  INVALID_EXERCISE = 'WRK001',
  PROGRESSION_ERROR = 'WRK002',
  EQUIPMENT_UNAVAILABLE = 'WRK003',
  
  // Performance
  INTENSITY_TOO_HIGH = 'PERF001',
  VOLUME_EXCEEDED = 'PERF002',
  INSUFFICIENT_RECOVERY = 'PERF003'
}

// Validation cache types
export interface ValidationCache {
  key: string;
  result: ValidationResult;
  timestamp: number;
  ttl: number;
}

// Real-time validation state
export interface ValidationState {
  isValidating: boolean;
  lastValidation?: ValidationResult;
  pendingValidations: Set<string>;
  cache: Map<string, ValidationCache>;
}