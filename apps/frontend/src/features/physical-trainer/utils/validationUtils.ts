/**
 * Validation Utilities
 * 
 * Helper functions for unified validation system across all workout types.
 * Provides debouncing, caching, error handling, and response formatting.
 */

import type {
  ValidationRequest,
  ValidationResponse,
  ValidationError,
  ValidationWarning,
  ValidationSuggestion,
  ValidationSummary,
  ValidationCache,
  RealTimeValidationConfig,
  ValidationState
} from '../types/validation-api.types';
import type { WorkoutType } from '../types/validation.types';

// ============================================================================
// Validation Request Builders
// ============================================================================

export const createValidationRequest = (
  workoutType: WorkoutType,
  data: any,
  context: {
    userId: string;
    organizationId: string;
    teamId?: string;
    playerIds?: string[];
    scheduledDateTime?: string;
  },
  config?: Partial<ValidationRequest['config']>
): ValidationRequest => {
  return {
    requestId: `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    workoutType,
    context: {
      ...context,
      facility: context.teamId ? {
        id: `facility_${context.teamId}`,
        name: 'Main Training Facility',
        capacity: 30,
        equipment: ['weights', 'cardio_machines', 'mats', 'agility_cones']
      } : undefined
    },
    config: {
      strictness: 'normal',
      includeMedical: true,
      includeScheduling: true,
      includeFacility: true,
      includePerformance: true,
      includeSuggestions: true,
      timeout: 10000,
      ...config
    },
    data
  };
};

export const createContentValidationRequest = (
  workoutType: WorkoutType,
  content: any,
  context: { organizationId: string; teamId?: string }
) => ({
  workoutType,
  content,
  context
});

export const createAssignmentValidationRequest = (
  playerIds: string[],
  workoutType: WorkoutType,
  context: { organizationId: string; userId: string },
  teamId?: string,
  assignments?: any[]
) => ({
  playerIds,
  teamId,
  workoutType,
  assignments,
  context
});

export const createMedicalValidationRequest = (
  playerIds: string[],
  workoutType: WorkoutType,
  context: { organizationId: string },
  options?: {
    exercises?: string[];
    intensityLevel?: number;
    duration?: number;
    equipment?: string[];
  }
) => ({
  playerIds,
  workoutType,
  context,
  ...options
});

export const createScheduleValidationRequest = (
  startDateTime: string,
  duration: number,
  workoutType: WorkoutType,
  context: { organizationId: string; userId: string },
  options?: {
    playerIds?: string[];
    teamId?: string;
    facilityId?: string;
  }
) => ({
  startDateTime,
  duration,
  workoutType,
  context,
  ...options
});

// ============================================================================
// Validation Response Helpers
// ============================================================================

export const getValidationSummary = (response: ValidationResponse): ValidationSummary => {
  const errorCounts = response.errors.reduce((acc, error) => {
    acc[error.severity] = (acc[error.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const warningCounts = response.warnings.reduce((acc, warning) => {
    acc[warning.category] = (acc[warning.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topIssues = [
    ...response.errors.slice(0, 3).map(e => e.message),
    ...response.warnings.slice(0, 2).map(w => w.message)
  ];

  const recommendations = response.suggestions
    .filter(s => s.priority === 'high')
    .slice(0, 3)
    .map(s => s.title);

  return {
    status: response.isValid ? 'valid' : response.errors.length > 0 ? 'invalid' : 'warning',
    score: response.metadata.score,
    errors: errorCounts,
    warnings: warningCounts,
    topIssues,
    recommendations
  };
};

export const hasBlockingErrors = (response: ValidationResponse): boolean => {
  return response.errors.some(error => 
    error.severity === 'ERROR' && 
    ['REQUIRED_FIELD', 'MEDICAL_COMPLIANCE', 'SAFETY'].includes(error.category)
  );
};

export const getHighPriorityIssues = (response: ValidationResponse) => {
  const criticalErrors = response.errors.filter(e => e.severity === 'ERROR');
  const highPriorityWarnings = response.warnings.filter(w => 
    w.category === 'MEDICAL_COMPLIANCE' || w.impact === 'high'
  );
  
  return [...criticalErrors, ...highPriorityWarnings];
};

export const getSuggestionsByType = (response: ValidationResponse, type?: string) => {
  if (!type) return response.suggestions;
  return response.suggestions.filter(s => s.type === type);
};

// ============================================================================
// Real-time Validation Helpers
// ============================================================================

export class ValidationDebouncer {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private defaultDelay: number;

  constructor(defaultDelay = 300) {
    this.defaultDelay = defaultDelay;
  }

  debounce<T extends any[]>(
    key: string,
    fn: (...args: T) => void,
    delay?: number
  ) {
    return (...args: T) => {
      // Clear existing timeout
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        fn(...args);
        this.timeouts.delete(key);
      }, delay || this.defaultDelay);

      this.timeouts.set(key, timeout);
    };
  }

  clear(key?: string) {
    if (key) {
      const timeout = this.timeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
        this.timeouts.delete(key);
      }
    } else {
      // Clear all timeouts
      this.timeouts.forEach(timeout => clearTimeout(timeout));
      this.timeouts.clear();
    }
  }
}

export class ValidationCache {
  private cache: Map<string, ValidationCache> = new Map();
  private maxEntries: number;
  private defaultTTL: number;

  constructor(maxEntries = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutes
    this.maxEntries = maxEntries;
    this.defaultTTL = defaultTTL;
  }

  generateKey(request: ValidationRequest): string {
    // Create a deterministic key based on request content
    const keyData = {
      workoutType: request.workoutType,
      data: JSON.stringify(request.data),
      context: JSON.stringify(request.context),
      config: JSON.stringify(request.config)
    };
    
    return btoa(JSON.stringify(keyData)).slice(0, 32);
  }

  set(key: string, request: ValidationRequest, response: ValidationResponse, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const cacheEntry: ValidationCache = {
      key,
      request,
      response,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0
    };

    this.cache.set(key, cacheEntry);
  }

  get(key: string): ValidationResponse | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit count
    entry.hits++;
    
    return entry.response;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const averageAge = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length
      : 0;

    return {
      totalEntries: entries.length,
      totalHits,
      averageAge: Math.round(averageAge / 1000), // in seconds
      hitRate: totalHits / Math.max(entries.length, 1)
    };
  }
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

export const formatValidationError = (error: any): ValidationError => {
  if (error.code && error.message) {
    return error as ValidationError;
  }

  // Handle different error formats
  if (typeof error === 'string') {
    return {
      code: 'VALIDATION_ERROR',
      message: error,
      severity: 'ERROR',
      category: 'BUSINESS_RULE'
    };
  }

  if (error.response?.data?.message) {
    return {
      code: error.response.status?.toString() || 'API_ERROR',
      message: error.response.data.message,
      severity: 'ERROR',
      category: 'BUSINESS_RULE'
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected validation error occurred',
    severity: 'ERROR',
    category: 'BUSINESS_RULE'
  };
};

export const isTimeoutError = (error: any): boolean => {
  return error.code === 'VALIDATION_TIMEOUT' || 
         error.message?.includes('timeout') ||
         error.name === 'TimeoutError';
};

export const isNetworkError = (error: any): boolean => {
  return error.code === 'VALIDATION_NETWORK_ERROR' ||
         error.message?.includes('network') ||
         error.message?.includes('fetch') ||
         !window.navigator.onLine;
};

export const shouldRetryValidation = (error: any): boolean => {
  return isTimeoutError(error) || 
         isNetworkError(error) ||
         (error.status >= 500 && error.status < 600);
};

// ============================================================================
// Field Validation Helpers
// ============================================================================

export const validateFieldValue = (
  field: string,
  value: any,
  workoutType: WorkoutType
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (field) {
    case 'title':
      if (!value || value.trim().length === 0) {
        errors.push('Title is required');
      } else if (value.trim().length < 3) {
        errors.push('Title must be at least 3 characters long');
      } else if (value.length > 100) {
        warnings.push('Consider shortening the title for better readability');
      }
      break;

    case 'estimatedDuration':
      if (!value || value <= 0) {
        errors.push('Duration must be greater than 0');
      } else if (value > 300) { // 5 hours
        warnings.push('Very long sessions may cause excessive fatigue');
      } else if (value < 15) {
        warnings.push('Very short sessions may not be effective');
      }
      break;

    case 'playerIds':
      if (!value || !Array.isArray(value) || value.length === 0) {
        errors.push('At least one player must be assigned');
      } else if (value.length > 30) {
        warnings.push('Large groups may be difficult to manage effectively');
      }
      break;

    case 'location':
      if (!value || value.trim().length === 0) {
        errors.push('Location is required');
      }
      break;

    case 'scheduledDate':
      if (!value) {
        errors.push('Scheduled date is required');
      } else {
        const date = new Date(value);
        const now = new Date();
        if (date < now) {
          errors.push('Scheduled date cannot be in the past');
        } else if (date > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
          warnings.push('Scheduling more than a year in advance');
        }
      }
      break;

    default:
      // No validation for unknown fields
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ============================================================================
// Progressive Validation State Manager
// ============================================================================

export class ProgressiveValidationManager {
  private steps: string[];
  private currentStepIndex: number = 0;
  private stepData: Map<string, any> = new Map();
  private stepValidations: Map<string, ValidationResponse> = new Map();

  constructor(steps: string[]) {
    this.steps = steps;
  }

  setStepData(step: string, data: any): void {
    this.stepData.set(step, data);
  }

  getStepData(step: string): any {
    return this.stepData.get(step);
  }

  setStepValidation(step: string, validation: ValidationResponse): void {
    this.stepValidations.set(step, validation);
  }

  getStepValidation(step: string): ValidationResponse | undefined {
    return this.stepValidations.get(step);
  }

  getCurrentStep(): string {
    return this.steps[this.currentStepIndex];
  }

  canProceedToNext(): boolean {
    const currentStep = this.getCurrentStep();
    const validation = this.getStepValidation(currentStep);
    
    if (!validation) return false;
    
    // Check for blocking errors
    return !hasBlockingErrors(validation);
  }

  nextStep(): boolean {
    if (this.canProceedToNext() && this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      return true;
    }
    return false;
  }

  previousStep(): boolean {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      return true;
    }
    return false;
  }

  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.currentStepIndex + 1,
      total: this.steps.length,
      percentage: Math.round(((this.currentStepIndex + 1) / this.steps.length) * 100)
    };
  }

  getAllData(): Record<string, any> {
    const allData: Record<string, any> = {};
    this.stepData.forEach((data, step) => {
      allData[step] = data;
    });
    return allData;
  }

  getOverallValidation(): ValidationSummary {
    const allValidations = Array.from(this.stepValidations.values());
    
    if (allValidations.length === 0) {
      return {
        status: 'valid',
        score: 0,
        errors: {},
        warnings: {},
        topIssues: [],
        recommendations: []
      };
    }

    const allErrors = allValidations.flatMap(v => v.errors);
    const allWarnings = allValidations.flatMap(v => v.warnings);
    const averageScore = allValidations.reduce((sum, v) => sum + v.metadata.score, 0) / allValidations.length;

    return {
      status: allErrors.length > 0 ? 'invalid' : allWarnings.length > 0 ? 'warning' : 'valid',
      score: Math.round(averageScore),
      errors: allErrors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      warnings: allWarnings.reduce((acc, warning) => {
        acc[warning.category] = (acc[warning.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      topIssues: [...allErrors.slice(0, 3).map(e => e.message), ...allWarnings.slice(0, 2).map(w => w.message)],
      recommendations: allValidations.flatMap(v => v.suggestions).filter(s => s.priority === 'high').slice(0, 3).map(s => s.title)
    };
  }

  reset(): void {
    this.currentStepIndex = 0;
    this.stepData.clear();
    this.stepValidations.clear();
  }
}

// ============================================================================
// Export utilities
// ============================================================================

export const validationUtils = {
  createValidationRequest,
  createContentValidationRequest,
  createAssignmentValidationRequest,
  createMedicalValidationRequest,
  createScheduleValidationRequest,
  getValidationSummary,
  hasBlockingErrors,
  getHighPriorityIssues,
  getSuggestionsByType,
  formatValidationError,
  isTimeoutError,
  isNetworkError,
  shouldRetryValidation,
  validateFieldValue,
  ValidationDebouncer,
  ValidationCache,
  ProgressiveValidationManager
};

export default validationUtils;