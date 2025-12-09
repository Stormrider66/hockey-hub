/**
 * Unified Validation Hooks
 * 
 * Custom hooks that provide real-time validation, debouncing, caching,
 * and error handling for all workout types.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  useValidateWorkoutMutation,
  useValidateWorkoutContentMutation,
  useValidatePlayerAssignmentsMutation,
  useValidateMedicalComplianceMutation,
  useValidateScheduleMutation,
  useValidateFieldMutation,
  useValidateFieldDependenciesMutation,
  useValidateProgressiveMutation,
  useValidateWithSuggestionsMutation,
  useGetValidationConfigQuery
} from '@/store/api/trainingApi';
import type {
  ValidationRequest,
  ValidationResponse,
  ValidationState,
  RealTimeValidationConfig,
  ValidationSummary
} from '../types/validation-api.types';
import type { WorkoutType } from '../types/validation.types';
import {
  validationUtils,
  ValidationDebouncer,
  ValidationCache,
  ProgressiveValidationManager
} from '../utils/validationUtils';

// ============================================================================
// Main Validation Hook
// ============================================================================

export const useWorkoutValidation = (workoutType: WorkoutType) => {
  const [validateWorkout] = useValidateWorkoutMutation();
  const [validateWithSuggestions] = useValidateWithSuggestionsMutation();
  
  const [validationState, setValidationState] = useState<ValidationState>({
    status: 'idle',
    pendingRequests: new Set(),
    cache: new Map(),
    config: {
      enabled: true,
      debounceMs: 300,
      fields: ['title', 'duration', 'playerIds', 'exercises'],
      triggers: ['field_change', 'player_assignment'],
      cache: {
        enabled: true,
        ttlMs: 300000,
        maxEntries: 100
      }
    }
  });

  const debouncerRef = useRef(new ValidationDebouncer(validationState.config.debounceMs));
  const cacheRef = useRef(new ValidationCache());

  const validate = useCallback(async (
    data: any,
    context: {
      userId: string;
      organizationId: string;
      teamId?: string;
      playerIds?: string[];
      scheduledDateTime?: string;
    },
    options?: {
      includeSuggestions?: boolean;
      useCache?: boolean;
      config?: Partial<ValidationRequest['config']>;
    }
  ): Promise<ValidationResponse> => {
    const request = validationUtils.createValidationRequest(
      workoutType,
      data,
      context,
      options?.config
    );

    // Check cache first
    if (options?.useCache !== false && validationState.config.cache?.enabled) {
      const cacheKey = cacheRef.current.generateKey(request);
      const cachedResponse = cacheRef.current.get(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    setValidationState(prev => ({
      ...prev,
      status: 'validating',
      pendingRequests: new Set([...prev.pendingRequests, request.requestId!])
    }));

    try {
      const mutation = options?.includeSuggestions 
        ? validateWithSuggestions 
        : validateWorkout;

      const result = await mutation({
        ...request,
        ...(options?.includeSuggestions && { includeSuggestions: true })
      }).unwrap();

      const response = options?.includeSuggestions 
        ? (result as any).validation 
        : result as ValidationResponse;

      // Cache the result
      if (validationState.config.cache?.enabled) {
        const cacheKey = cacheRef.current.generateKey(request);
        cacheRef.current.set(cacheKey, request, response);
      }

      setValidationState(prev => {
        const newPendingRequests = new Set(prev.pendingRequests);
        newPendingRequests.delete(request.requestId!);
        
        return {
          ...prev,
          status: 'completed',
          lastResult: response,
          pendingRequests: newPendingRequests
        };
      });

      return response;

    } catch (error: any) {
      setValidationState(prev => {
        const newPendingRequests = new Set(prev.pendingRequests);
        newPendingRequests.delete(request.requestId!);
        
        return {
          ...prev,
          status: 'error',
          error: validationUtils.formatValidationError(error).message,
          pendingRequests: newPendingRequests
        };
      });

      throw error;
    }
  }, [workoutType, validateWorkout, validateWithSuggestions, validationState.config]);

  const validateDebounced = useCallback((
    data: any,
    context: Parameters<typeof validate>[1],
    options?: Parameters<typeof validate>[2] & { debounceKey?: string }
  ) => {
    const debounceKey = options?.debounceKey || 'default';
    
    return new Promise<ValidationResponse>((resolve, reject) => {
      debouncerRef.current.debounce(
        debounceKey,
        async () => {
          try {
            const result = await validate(data, context, options);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        validationState.config.debounceMs
      )();
    });
  }, [validate, validationState.config.debounceMs]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return cacheRef.current.getStats();
  }, []);

  return {
    validate,
    validateDebounced,
    validationState,
    clearCache,
    getCacheStats,
    isValidating: validationState.status === 'validating',
    lastResult: validationState.lastResult,
    error: validationState.error
  };
};

// ============================================================================
// Real-time Field Validation Hook
// ============================================================================

export const useFieldValidation = (workoutType: WorkoutType) => {
  const [validateField] = useValidateFieldMutation();
  const [validateFieldDependencies] = useValidateFieldDependenciesMutation();
  
  const [fieldValidations, setFieldValidations] = useState<Record<string, {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    lastValidated: number;
  }>>({});

  const debouncerRef = useRef(new ValidationDebouncer(300));

  const validateSingleField = useCallback(async (
    field: string,
    value: any,
    context?: Record<string, any>
  ) => {
    // Immediate client-side validation
    const clientValidation = validationUtils.validateFieldValue(field, value, workoutType);
    
    // Update state immediately with client validation
    setFieldValidations(prev => ({
      ...prev,
      [field]: {
        ...clientValidation,
        lastValidated: Date.now()
      }
    }));

    // If client validation fails, no need for server validation
    if (!clientValidation.isValid) {
      return clientValidation;
    }

    // Server-side validation (debounced)
    try {
      const result = await validateField({
        field,
        value,
        workoutType: workoutType.toString(),
        context
      }).unwrap();

      setFieldValidations(prev => ({
        ...prev,
        [field]: {
          isValid: result.isValid,
          errors: result.errors.map(e => e.message),
          warnings: result.warnings.map(w => w.message),
          lastValidated: Date.now()
        }
      }));

      return {
        isValid: result.isValid,
        errors: result.errors.map(e => e.message),
        warnings: result.warnings.map(w => w.message)
      };

    } catch (error) {
      console.warn('Server field validation failed:', error);
      return clientValidation; // Fall back to client validation
    }
  }, [workoutType, validateField]);

  const validateFieldDebounced = useCallback((
    field: string,
    value: any,
    context?: Record<string, any>,
    delay?: number
  ) => {
    return new Promise<{ isValid: boolean; errors: string[]; warnings: string[] }>((resolve) => {
      debouncerRef.current.debounce(
        field,
        async () => {
          const result = await validateSingleField(field, value, context);
          resolve(result);
        },
        delay
      )();
    });
  }, [validateSingleField]);

  const validateMultipleFields = useCallback(async (
    fields: Record<string, any>,
    context?: Record<string, any>
  ) => {
    try {
      const result = await validateFieldDependencies({
        fields,
        workoutType: workoutType.toString(),
        context
      }).unwrap();

      // Update field validations with cross-field results
      const newValidations: typeof fieldValidations = {};
      
      result.errors.forEach(error => {
        if (!newValidations[error.field]) {
          newValidations[error.field] = {
            isValid: false,
            errors: [],
            warnings: [],
            lastValidated: Date.now()
          };
        }
        newValidations[error.field].errors.push(error.message);
        newValidations[error.field].isValid = false;
      });

      result.warnings.forEach(warning => {
        if (!newValidations[warning.field]) {
          newValidations[warning.field] = {
            isValid: true,
            errors: [],
            warnings: [],
            lastValidated: Date.now()
          };
        }
        newValidations[warning.field].warnings.push(warning.message);
      });

      // Set default valid state for fields without errors/warnings
      Object.keys(fields).forEach(field => {
        if (!newValidations[field]) {
          newValidations[field] = {
            isValid: true,
            errors: [],
            warnings: [],
            lastValidated: Date.now()
          };
        }
      });

      setFieldValidations(prev => ({
        ...prev,
        ...newValidations
      }));

      return {
        isValid: result.isValid,
        fieldResults: newValidations
      };

    } catch (error) {
      console.warn('Cross-field validation failed:', error);
      return {
        isValid: true,
        fieldResults: {}
      };
    }
  }, [workoutType, validateFieldDependencies]);

  const getFieldValidation = useCallback((field: string) => {
    return fieldValidations[field] || {
      isValid: true,
      errors: [],
      warnings: [],
      lastValidated: 0
    };
  }, [fieldValidations]);

  const clearFieldValidation = useCallback((field?: string) => {
    if (field) {
      setFieldValidations(prev => {
        const newValidations = { ...prev };
        delete newValidations[field];
        return newValidations;
      });
      debouncerRef.current.clear(field);
    } else {
      setFieldValidations({});
      debouncerRef.current.clear();
    }
  }, []);

  return {
    validateField: validateFieldDebounced,
    validateMultipleFields,
    getFieldValidation,
    clearFieldValidation,
    fieldValidations
  };
};

// ============================================================================
// Progressive Validation Hook
// ============================================================================

export const useProgressiveValidation = (
  workoutType: WorkoutType,
  steps: string[]
) => {
  const [validateProgressive] = useValidateProgressiveMutation();
  const managerRef = useRef(new ProgressiveValidationManager(steps));
  
  const [currentStep, setCurrentStep] = useState(steps[0]);
  const [progress, setProgress] = useState({ current: 1, total: steps.length, percentage: 14 });

  const validateCurrentStep = useCallback(async (
    data: Record<string, any>,
    context?: Record<string, any>
  ) => {
    try {
      const result = await validateProgressive({
        workoutType: workoutType.toString(),
        currentStep,
        data,
        context
      }).unwrap();

      managerRef.current.setStepData(currentStep, data);
      managerRef.current.setStepValidation(currentStep, {
        isValid: result.isValid,
        errors: result.errors.map(e => ({
          code: 'STEP_ERROR',
          message: e.message,
          field: e.field,
          severity: 'ERROR' as const,
          category: 'BUSINESS_RULE' as const
        })),
        warnings: result.warnings.map(w => ({
          code: 'STEP_WARNING',
          message: w.message,
          field: w.field,
          category: 'BUSINESS_RULE' as const,
          recommendation: '',
          impact: 'medium' as const,
          dismissible: true
        })),
        suggestions: [],
        metadata: {
          rulesApplied: [],
          performance: { totalTime: 0, breakdown: {} },
          score: result.isValid ? 100 : 50,
          confidence: 'medium' as const,
          engineVersion: '2.1.0'
        },
        timestamp: new Date().toISOString(),
        processingTime: 0
      });

      return {
        isValid: result.isValid,
        canProceed: result.canProceed,
        errors: result.errors,
        warnings: result.warnings,
        nextStepRequirements: result.nextStepRequirements
      };

    } catch (error) {
      console.warn('Progressive validation failed:', error);
      return {
        isValid: false,
        canProceed: false,
        errors: [{ step: currentStep, field: '', message: 'Validation failed' }],
        warnings: [],
        nextStepRequirements: []
      };
    }
  }, [workoutType, currentStep, validateProgressive]);

  const nextStep = useCallback(() => {
    const success = managerRef.current.nextStep();
    if (success) {
      const newStep = managerRef.current.getCurrentStep();
      const newProgress = managerRef.current.getProgress();
      setCurrentStep(newStep);
      setProgress(newProgress);
    }
    return success;
  }, []);

  const previousStep = useCallback(() => {
    const success = managerRef.current.previousStep();
    if (success) {
      const newStep = managerRef.current.getCurrentStep();
      const newProgress = managerRef.current.getProgress();
      setCurrentStep(newStep);
      setProgress(newProgress);
    }
    return success;
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      managerRef.current.currentStepIndex = stepIndex;
      const newStep = managerRef.current.getCurrentStep();
      const newProgress = managerRef.current.getProgress();
      setCurrentStep(newStep);
      setProgress(newProgress);
      return true;
    }
    return false;
  }, [steps.length]);

  const getOverallValidation = useCallback((): ValidationSummary => {
    return managerRef.current.getOverallValidation();
  }, []);

  const getAllData = useCallback(() => {
    return managerRef.current.getAllData();
  }, []);

  const reset = useCallback(() => {
    managerRef.current.reset();
    setCurrentStep(steps[0]);
    setProgress({ current: 1, total: steps.length, percentage: 14 });
  }, [steps]);

  return {
    currentStep,
    progress,
    validateCurrentStep,
    nextStep,
    previousStep,
    goToStep,
    getOverallValidation,
    getAllData,
    reset,
    canProceed: managerRef.current.canProceedToNext()
  };
};

// ============================================================================
// Specialized Validation Hooks
// ============================================================================

export const useContentValidation = (workoutType: WorkoutType) => {
  const [validateContent] = useValidateWorkoutContentMutation();

  const validate = useCallback(async (
    content: any,
    context: { organizationId: string; teamId?: string }
  ) => {
    try {
      const request = validationUtils.createContentValidationRequest(
        workoutType,
        content,
        context
      );

      const result = await validateContent(request).unwrap();
      return result;

    } catch (error) {
      throw validationUtils.formatValidationError(error);
    }
  }, [workoutType, validateContent]);

  return { validateContent: validate };
};

export const useAssignmentValidation = (workoutType: WorkoutType) => {
  const [validateAssignments] = useValidatePlayerAssignmentsMutation();

  const validate = useCallback(async (
    playerIds: string[],
    context: { organizationId: string; userId: string },
    teamId?: string,
    assignments?: any[]
  ) => {
    try {
      const request = validationUtils.createAssignmentValidationRequest(
        playerIds,
        workoutType,
        context,
        teamId,
        assignments
      );

      const result = await validateAssignments(request).unwrap();
      return result;

    } catch (error) {
      throw validationUtils.formatValidationError(error);
    }
  }, [workoutType, validateAssignments]);

  return { validateAssignments: validate };
};

export const useMedicalValidation = (workoutType: WorkoutType) => {
  const [validateMedical] = useValidateMedicalComplianceMutation();

  const validate = useCallback(async (
    playerIds: string[],
    context: { organizationId: string },
    options?: {
      exercises?: string[];
      intensityLevel?: number;
      duration?: number;
      equipment?: string[];
    }
  ) => {
    try {
      const request = validationUtils.createMedicalValidationRequest(
        playerIds,
        workoutType,
        context,
        options
      );

      const result = await validateMedical(request).unwrap();
      return result;

    } catch (error) {
      throw validationUtils.formatValidationError(error);
    }
  }, [workoutType, validateMedical]);

  return { validateMedical: validate };
};

export const useScheduleValidation = (workoutType: WorkoutType) => {
  const [validateSchedule] = useValidateScheduleMutation();

  const validate = useCallback(async (
    startDateTime: string,
    duration: number,
    context: { organizationId: string; userId: string },
    options?: {
      playerIds?: string[];
      teamId?: string;
      facilityId?: string;
    }
  ) => {
    try {
      const request = validationUtils.createScheduleValidationRequest(
        startDateTime,
        duration,
        workoutType,
        context,
        options
      );

      const result = await validateSchedule(request).unwrap();
      return result;

    } catch (error) {
      throw validationUtils.formatValidationError(error);
    }
  }, [workoutType, validateSchedule]);

  return { validateSchedule: validate };
};

// ============================================================================
// Configuration Hook
// ============================================================================

export const useValidationConfig = () => {
  const { data: config, isLoading, error } = useGetValidationConfigQuery();

  const defaultConfig: RealTimeValidationConfig = {
    enabled: true,
    debounceMs: 300,
    fields: ['title', 'duration', 'playerIds', 'exercises'],
    triggers: ['field_change', 'player_assignment'],
    cache: {
      enabled: true,
      ttlMs: 300000,
      maxEntries: 100
    }
  };

  return {
    config: config?.data || defaultConfig,
    isLoading,
    error
  };
};

// ============================================================================
// Combined Hook for Easy Usage
// ============================================================================

export const useWorkoutValidationSuite = (workoutType: WorkoutType) => {
  const mainValidation = useWorkoutValidation(workoutType);
  const fieldValidation = useFieldValidation(workoutType);
  const contentValidation = useContentValidation(workoutType);
  const assignmentValidation = useAssignmentValidation(workoutType);
  const medicalValidation = useMedicalValidation(workoutType);
  const scheduleValidation = useScheduleValidation(workoutType);
  const config = useValidationConfig();

  return {
    // Main validation
    validate: mainValidation.validate,
    validateDebounced: mainValidation.validateDebounced,
    isValidating: mainValidation.isValidating,
    lastResult: mainValidation.lastResult,
    validationError: mainValidation.error,

    // Field validation
    validateField: fieldValidation.validateField,
    validateMultipleFields: fieldValidation.validateMultipleFields,
    getFieldValidation: fieldValidation.getFieldValidation,
    clearFieldValidation: fieldValidation.clearFieldValidation,

    // Specialized validation
    validateContent: contentValidation.validateContent,
    validateAssignments: assignmentValidation.validateAssignments,
    validateMedical: medicalValidation.validateMedical,
    validateSchedule: scheduleValidation.validateSchedule,

    // Configuration
    config: config.config,
    configLoading: config.isLoading,

    // Utilities
    clearCache: mainValidation.clearCache,
    getCacheStats: mainValidation.getCacheStats
  };
};

export default useWorkoutValidationSuite;