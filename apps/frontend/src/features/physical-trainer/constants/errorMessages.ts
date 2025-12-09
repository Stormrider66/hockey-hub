/**
 * Standardized error messages for Physical Trainer workout builders
 * Each error includes user-friendly messages, technical details, and suggested actions
 */

export enum ErrorCategory {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  MEDICAL_ERROR = 'MEDICAL_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export enum ErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface ErrorMessage {
  code: string;
  category: ErrorCategory;
  userMessage: string;
  technicalMessage: string;
  helpText: string;
  action: string;
  severity: ErrorSeverity;
  helpLink?: string;
}

// Validation Errors
export const VALIDATION_ERRORS: Record<string, ErrorMessage> = {
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'There are validation errors in your input',
    technicalMessage: 'Request validation failed',
    helpText: 'Please review the highlighted fields and correct any issues',
    action: 'Fix the invalid fields',
    severity: ErrorSeverity.ERROR
  },
  WORKOUT_NAME_REQUIRED: {
    code: 'WORKOUT_NAME_REQUIRED',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Please enter a name for your workout',
    technicalMessage: 'workout.name is required',
    helpText: 'Give your workout a descriptive name that helps identify its purpose',
    action: 'Enter a workout name',
    severity: ErrorSeverity.ERROR
  },
  WORKOUT_NAME_TOO_SHORT: {
    code: 'WORKOUT_NAME_TOO_SHORT',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Workout name must be at least 3 characters',
    technicalMessage: 'workout.name.length < 3',
    helpText: 'Use a descriptive name that clearly identifies the workout',
    action: 'Enter a longer workout name',
    severity: ErrorSeverity.ERROR
  },
  WORKOUT_NAME_TOO_LONG: {
    code: 'WORKOUT_NAME_TOO_LONG',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Workout name cannot exceed 100 characters',
    technicalMessage: 'workout.name.length > 100',
    helpText: 'Keep the name concise while still being descriptive',
    action: 'Shorten the workout name',
    severity: ErrorSeverity.ERROR
  },
  NO_EXERCISES_SELECTED: {
    code: 'NO_EXERCISES_SELECTED',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Please add at least one exercise to the workout',
    technicalMessage: 'workout.exercises.length === 0',
    helpText: 'A workout must contain at least one exercise',
    action: 'Add exercises from the library',
    severity: ErrorSeverity.ERROR
  },
  NO_PLAYERS_ASSIGNED: {
    code: 'NO_PLAYERS_ASSIGNED',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Please assign at least one player to this session',
    technicalMessage: 'session.assignedPlayers.length === 0',
    helpText: 'Select players who will participate in this training session',
    action: 'Assign players to the session',
    severity: ErrorSeverity.ERROR
  },
  INVALID_DATE_RANGE: {
    code: 'INVALID_DATE_RANGE',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'End date must be after start date',
    technicalMessage: 'endDate <= startDate',
    helpText: 'Make sure your session end time is later than the start time',
    action: 'Adjust the date/time selection',
    severity: ErrorSeverity.ERROR
  },
  DUPLICATE_EXERCISE: {
    code: 'DUPLICATE_EXERCISE',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'This exercise is already in the workout',
    technicalMessage: 'Duplicate exercise ID detected',
    helpText: 'Each exercise should appear only once per workout',
    action: 'Choose a different exercise',
    severity: ErrorSeverity.WARNING
  },
  INVALID_SETS_VALUE: {
    code: 'INVALID_SETS_VALUE',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Sets must be between 1 and 10',
    technicalMessage: 'sets < 1 || sets > 10',
    helpText: 'Enter a reasonable number of sets for this exercise',
    action: 'Enter a valid number of sets',
    severity: ErrorSeverity.ERROR
  },
  INVALID_REPS_VALUE: {
    code: 'INVALID_REPS_VALUE',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Reps must be between 1 and 100',
    technicalMessage: 'reps < 1 || reps > 100',
    helpText: 'Enter a reasonable number of repetitions',
    action: 'Enter a valid number of reps',
    severity: ErrorSeverity.ERROR
  },
  INVALID_INTENSITY_VALUE: {
    code: 'INVALID_INTENSITY_VALUE',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Intensity must be between 1 and 100%',
    technicalMessage: 'intensity < 1 || intensity > 100',
    helpText: 'Enter the intensity as a percentage (1-100)',
    action: 'Enter a valid intensity percentage',
    severity: ErrorSeverity.ERROR
  },
  NO_INTERVALS_DEFINED: {
    code: 'NO_INTERVALS_DEFINED',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Please add at least one interval to the conditioning workout',
    technicalMessage: 'intervals.length === 0',
    helpText: 'A conditioning workout needs at least one work interval',
    action: 'Add intervals to your workout',
    severity: ErrorSeverity.ERROR
  },
  NO_DRILLS_DEFINED: {
    code: 'NO_DRILLS_DEFINED',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Please add at least one drill to the agility workout',
    technicalMessage: 'drills.length === 0',
    helpText: 'An agility workout needs at least one drill to practice',
    action: 'Add drills to your workout',
    severity: ErrorSeverity.ERROR
  },
  NO_BLOCKS_DEFINED: {
    code: 'NO_BLOCKS_DEFINED',
    category: ErrorCategory.VALIDATION_ERROR,
    userMessage: 'Please add at least one block to the hybrid workout',
    technicalMessage: 'blocks.length === 0',
    helpText: 'A hybrid workout needs at least one exercise or interval block',
    action: 'Add blocks to your workout',
    severity: ErrorSeverity.ERROR
  }
};

// Network Errors
export const NETWORK_ERRORS: Record<string, ErrorMessage> = {
  CONNECTION_FAILED: {
    code: 'CONNECTION_FAILED',
    category: ErrorCategory.NETWORK_ERROR,
    userMessage: 'Unable to connect to the server',
    technicalMessage: 'Network connection failed',
    helpText: 'Check your internet connection and try again',
    action: 'Retry the operation',
    severity: ErrorSeverity.ERROR
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    category: ErrorCategory.NETWORK_ERROR,
    userMessage: 'The request took too long to complete',
    technicalMessage: 'Request timeout exceeded',
    helpText: 'The server may be busy. Please try again in a moment',
    action: 'Retry the operation',
    severity: ErrorSeverity.ERROR
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    category: ErrorCategory.NETWORK_ERROR,
    userMessage: 'An error occurred on the server',
    technicalMessage: 'HTTP 500 - Internal Server Error',
    helpText: 'This is a temporary issue. Our team has been notified',
    action: 'Try again later',
    severity: ErrorSeverity.ERROR
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    category: ErrorCategory.NETWORK_ERROR,
    userMessage: 'The requested resource was not found',
    technicalMessage: 'HTTP 404 - Not Found',
    helpText: 'The workout or session may have been deleted',
    action: 'Return to the dashboard',
    severity: ErrorSeverity.ERROR
  }
};

// Permission Errors
export const PERMISSION_ERRORS: Record<string, ErrorMessage> = {
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    category: ErrorCategory.PERMISSION_ERROR,
    userMessage: 'You are not authorized to perform this action',
    technicalMessage: 'HTTP 401 - Unauthorized',
    helpText: 'Your session may have expired. Please log in again',
    action: 'Log in again',
    severity: ErrorSeverity.ERROR
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    category: ErrorCategory.PERMISSION_ERROR,
    userMessage: 'You do not have permission to access this resource',
    technicalMessage: 'HTTP 403 - Forbidden',
    helpText: 'Contact your administrator if you need access',
    action: 'Contact administrator',
    severity: ErrorSeverity.ERROR
  },
  INSUFFICIENT_ROLE: {
    code: 'INSUFFICIENT_ROLE',
    category: ErrorCategory.PERMISSION_ERROR,
    userMessage: 'Your role does not allow this action',
    technicalMessage: 'User role insufficient for operation',
    helpText: 'Only Physical Trainers can manage workouts',
    action: 'Contact administrator',
    severity: ErrorSeverity.ERROR
  }
};

// Conflict Errors
export const CONFLICT_ERRORS: Record<string, ErrorMessage> = {
  SCHEDULE_CONFLICT: {
    code: 'SCHEDULE_CONFLICT',
    category: ErrorCategory.CONFLICT_ERROR,
    userMessage: 'This time slot conflicts with another session',
    technicalMessage: 'Session time overlap detected',
    helpText: 'Check the calendar for available time slots',
    action: 'Choose a different time',
    severity: ErrorSeverity.ERROR
  },
  PLAYER_UNAVAILABLE: {
    code: 'PLAYER_UNAVAILABLE',
    category: ErrorCategory.CONFLICT_ERROR,
    userMessage: 'One or more players are not available at this time',
    technicalMessage: 'Player scheduling conflict',
    helpText: 'Some players have conflicting schedules',
    action: 'Check player availability',
    severity: ErrorSeverity.WARNING
  },
  DUPLICATE_SESSION: {
    code: 'DUPLICATE_SESSION',
    category: ErrorCategory.CONFLICT_ERROR,
    userMessage: 'A similar session already exists at this time',
    technicalMessage: 'Duplicate session detected',
    helpText: 'You may have already created this session',
    action: 'Review existing sessions',
    severity: ErrorSeverity.ERROR
  },
  RESOURCE_LOCKED: {
    code: 'RESOURCE_LOCKED',
    category: ErrorCategory.CONFLICT_ERROR,
    userMessage: 'This workout is currently being edited by another user',
    technicalMessage: 'Resource lock conflict',
    helpText: 'Wait a moment and try again',
    action: 'Try again later',
    severity: ErrorSeverity.WARNING
  }
};

// Medical Errors
export const MEDICAL_ERRORS: Record<string, ErrorMessage> = {
  MEDICAL_RESTRICTION: {
    code: 'MEDICAL_RESTRICTION',
    category: ErrorCategory.MEDICAL_ERROR,
    userMessage: 'This exercise is restricted for some players',
    technicalMessage: 'Medical restriction violation',
    helpText: 'Check player medical reports for exercise restrictions',
    action: 'Review medical restrictions',
    severity: ErrorSeverity.WARNING
  },
  INJURY_RISK: {
    code: 'INJURY_RISK',
    category: ErrorCategory.MEDICAL_ERROR,
    userMessage: 'This workout may pose injury risk for some players',
    technicalMessage: 'High injury risk detected',
    helpText: 'Consider modifying intensity or choosing alternative exercises',
    action: 'Modify workout parameters',
    severity: ErrorSeverity.WARNING
  },
  NO_MEDICAL_CLEARANCE: {
    code: 'NO_MEDICAL_CLEARANCE',
    category: ErrorCategory.MEDICAL_ERROR,
    userMessage: 'Some players need medical clearance for this activity',
    technicalMessage: 'Medical clearance required',
    helpText: 'Contact medical staff for player clearance',
    action: 'Request medical clearance',
    severity: ErrorSeverity.ERROR
  },
  RECOVERY_PERIOD: {
    code: 'RECOVERY_PERIOD',
    category: ErrorCategory.MEDICAL_ERROR,
    userMessage: 'Player is still in recovery period',
    technicalMessage: 'Recovery period not completed',
    helpText: 'This player needs more recovery time before intense training',
    action: 'Schedule for later date',
    severity: ErrorSeverity.WARNING
  }
};

// System Errors
export const SYSTEM_ERRORS: Record<string, ErrorMessage> = {
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    category: ErrorCategory.SYSTEM_ERROR,
    userMessage: 'An unexpected error occurred',
    technicalMessage: 'Unknown system error',
    helpText: 'Please try again. If the problem persists, contact support',
    action: 'Contact support',
    severity: ErrorSeverity.ERROR,
    helpLink: '/support/contact'
  },
  DATA_CORRUPTION: {
    code: 'DATA_CORRUPTION',
    category: ErrorCategory.SYSTEM_ERROR,
    userMessage: 'Data integrity issue detected',
    technicalMessage: 'Data validation failed',
    helpText: 'Your data may be corrupted. Please contact support',
    action: 'Contact support immediately',
    severity: ErrorSeverity.ERROR,
    helpLink: '/support/data-recovery'
  },
  FEATURE_DISABLED: {
    code: 'FEATURE_DISABLED',
    category: ErrorCategory.SYSTEM_ERROR,
    userMessage: 'This feature is temporarily disabled',
    technicalMessage: 'Feature flag disabled',
    helpText: 'This feature is undergoing maintenance',
    action: 'Check back later',
    severity: ErrorSeverity.INFO
  },
  MAINTENANCE_MODE: {
    code: 'MAINTENANCE_MODE',
    category: ErrorCategory.SYSTEM_ERROR,
    userMessage: 'System is under maintenance',
    technicalMessage: 'System in maintenance mode',
    helpText: 'We are performing scheduled maintenance',
    action: 'Try again in 30 minutes',
    severity: ErrorSeverity.INFO
  }
};

// Combine all errors
export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  ...VALIDATION_ERRORS,
  ...NETWORK_ERRORS,
  ...PERMISSION_ERRORS,
  ...CONFLICT_ERRORS,
  ...MEDICAL_ERRORS,
  ...SYSTEM_ERRORS
};

// Help link base URL (can be configured per environment)
export const HELP_BASE_URL = '/help';

// Error code prefixes for support
export const ERROR_CODE_PREFIX = {
  [ErrorCategory.VALIDATION_ERROR]: 'VAL',
  [ErrorCategory.NETWORK_ERROR]: 'NET',
  [ErrorCategory.PERMISSION_ERROR]: 'PRM',
  [ErrorCategory.CONFLICT_ERROR]: 'CNF',
  [ErrorCategory.MEDICAL_ERROR]: 'MED',
  [ErrorCategory.SYSTEM_ERROR]: 'SYS'
};