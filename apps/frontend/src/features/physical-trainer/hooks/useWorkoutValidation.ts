import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';
import { WorkoutType } from '../types/workout.types';
import {
  validateWorkout,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  getValidationSummary,
  formatValidationMessages,
} from '../utils/workoutValidation';

// Custom validation rule type
export type CustomValidationRule = (
  value: any,
  fieldPath: string,
  workoutData: any
) => ValidationError | ValidationWarning | null;

export interface CustomValidationRules {
  [fieldPath: string]: CustomValidationRule | CustomValidationRule[];
}

// Field-level errors
export interface FieldErrors {
  [fieldPath: string]: string[];
}

// Hook configuration
export interface UseWorkoutValidationConfig {
  workoutType: WorkoutType;
  workoutData: any;
  validationRules?: CustomValidationRules;
  debounceMs?: number;
  validateOnMount?: boolean;
}

// Hook return interface
export interface UseWorkoutValidationReturn {
  // State
  isValid: boolean;
  isValidating: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fieldErrors: FieldErrors;

  // Actions
  validate: () => Promise<ValidationResult>;
  validateField: (fieldPath: string, value?: any) => Promise<void>;
  clearErrors: (fieldPath?: string) => void;
  setCustomError: (fieldPath: string, message: string) => void;

  // Status helpers
  hasErrors: boolean;
  hasWarnings: boolean;
  getFirstError: () => string | null;
  getFieldError: (fieldPath: string) => string | null;

  // Utils
  formatErrors: (separator?: string) => string;
  getValidationSummary: () => string;
}

export function useWorkoutValidation({
  workoutType,
  workoutData,
  validationRules = {},
  debounceMs = 500,
  validateOnMount = false,
}: UseWorkoutValidationConfig): UseWorkoutValidationReturn {
  const [isValid, setIsValid] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [customErrors, setCustomErrors] = useState<FieldErrors>({});

  // Track previous data for change detection
  const previousDataRef = useRef<any>(workoutData);
  const validationTimeoutRef = useRef<NodeJS.Timeout>();

  // Helper to get value at path
  const getValueAtPath = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.substring(0, key.indexOf('['));
        const index = parseInt(key.substring(key.indexOf('[') + 1, key.indexOf(']')));
        return current?.[arrayKey]?.[index];
      }
      return current?.[key];
    }, obj);
  };

  // Apply custom validation rules
  const applyCustomRules = useCallback(
    (data: any): { errors: ValidationError[]; warnings: ValidationWarning[] } => {
      const customErrorsList: ValidationError[] = [];
      const customWarningsList: ValidationWarning[] = [];

      Object.entries(validationRules).forEach(([fieldPath, rules]) => {
        const rulesArray = Array.isArray(rules) ? rules : [rules];
        const value = getValueAtPath(data, fieldPath);

        rulesArray.forEach((rule) => {
          const result = rule(value, fieldPath, data);
          if (result) {
            if (result.type === 'error') {
              customErrorsList.push(result as ValidationError);
            } else {
              customWarningsList.push(result as ValidationWarning);
            }
          }
        });
      });

      return { errors: customErrorsList, warnings: customWarningsList };
    },
    [validationRules]
  );

  // Main validation function
  const validate = useCallback(async (): Promise<ValidationResult> => {
    setIsValidating(true);

    try {
      // Run built-in validation
      const result = validateWorkout(workoutType, workoutData);

      // Apply custom validation rules
      const customResults = applyCustomRules(workoutData);

      // Combine results
      const allErrors = [...result.errors, ...customResults.errors];
      const allWarnings = [...result.warnings, ...customResults.warnings];

      // Add custom errors
      Object.entries(customErrors).forEach(([fieldPath, messages]) => {
        messages.forEach((message) => {
          allErrors.push({
            type: 'error',
            field: fieldPath,
            message,
            code: 'CUSTOM_ERROR',
          });
        });
      });

      // Update state
      setErrors(allErrors);
      setWarnings(allWarnings);
      setIsValid(allErrors.length === 0);

      // Build field errors map
      const newFieldErrors: FieldErrors = {};
      allErrors.forEach((error) => {
        if (error.field) {
          if (!newFieldErrors[error.field]) {
            newFieldErrors[error.field] = [];
          }
          newFieldErrors[error.field].push(error.message);
        }
      });
      setFieldErrors(newFieldErrors);

      return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
      };
    } finally {
      setIsValidating(false);
    }
  }, [workoutType, workoutData, validationRules, customErrors, applyCustomRules]);

  // Debounced validation
  const debouncedValidate = useMemo(
    () =>
      debounce(validate, debounceMs, {
        leading: false,
        trailing: true,
      }),
    [validate, debounceMs]
  );

  // Field-level validation
  const validateField = useCallback(
    async (fieldPath: string, value?: any) => {
      setIsValidating(true);

      try {
        // Get the value if not provided
        const fieldValue = value !== undefined ? value : getValueAtPath(workoutData, fieldPath);

        // Check custom rules for this field
        const rules = validationRules[fieldPath];
        if (rules) {
          const rulesArray = Array.isArray(rules) ? rules : [rules];
          const fieldErrorsList: string[] = [];

          rulesArray.forEach((rule) => {
            const result = rule(fieldValue, fieldPath, workoutData);
            if (result && result.type === 'error') {
              fieldErrorsList.push(result.message);
            }
          });

          setFieldErrors((prev) => ({
            ...prev,
            [fieldPath]: fieldErrorsList,
          }));
        }

        // Trigger full validation to update overall state
        await debouncedValidate();
      } finally {
        setIsValidating(false);
      }
    },
    [workoutData, validationRules, debouncedValidate]
  );

  // Clear errors
  const clearErrors = useCallback((fieldPath?: string) => {
    if (fieldPath) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
      setCustomErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    } else {
      setFieldErrors({});
      setCustomErrors({});
      setErrors([]);
      setWarnings([]);
    }
  }, []);

  // Set custom error
  const setCustomError = useCallback((fieldPath: string, message: string) => {
    setCustomErrors((prev) => ({
      ...prev,
      [fieldPath]: [...(prev[fieldPath] || []), message],
    }));
  }, []);

  // Status helpers
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  const getFirstError = useCallback((): string | null => {
    return errors.length > 0 ? errors[0].message : null;
  }, [errors]);

  const getFieldError = useCallback(
    (fieldPath: string): string | null => {
      const fieldErrorList = fieldErrors[fieldPath];
      return fieldErrorList && fieldErrorList.length > 0 ? fieldErrorList[0] : null;
    },
    [fieldErrors]
  );

  // Format errors for display
  const formatErrors = useCallback(
    (separator: string = '\n'): string => {
      return formatValidationMessages(errors, separator);
    },
    [errors]
  );

  // Get validation summary
  const getValidationSummaryString = useCallback((): string => {
    return getValidationSummary({ isValid, errors, warnings });
  }, [isValid, errors, warnings]);

  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      validate();
    }
  }, []); // Only on mount

  // Validate when data changes
  useEffect(() => {
    // Skip initial render unless validateOnMount is true
    if (previousDataRef.current === workoutData && !validateOnMount) {
      return;
    }

    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Set new timeout for validation
    validationTimeoutRef.current = setTimeout(() => {
      debouncedValidate();
    }, 100); // Small delay to batch multiple changes

    // Update ref
    previousDataRef.current = workoutData;

    // Cleanup
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [workoutData, debouncedValidate]);

  return {
    // State
    isValid,
    isValidating,
    errors,
    warnings,
    fieldErrors,

    // Actions
    validate,
    validateField,
    clearErrors,
    setCustomError,

    // Status
    hasErrors,
    hasWarnings,
    getFirstError,
    getFieldError,

    // Utils
    formatErrors,
    getValidationSummary: getValidationSummaryString,
  };
}

// Preset validation rules for common scenarios
export const commonValidationRules = {
  // Positive number validation
  positiveNumber: (fieldName: string): CustomValidationRule => {
    return (value, fieldPath) => {
      if (value !== undefined && value !== null && value <= 0) {
        return {
          type: 'error',
          field: fieldPath,
          message: `${fieldName} must be greater than 0`,
          code: 'POSITIVE_NUMBER',
        };
      }
      return null;
    };
  },

  // Range validation
  numberRange: (fieldName: string, min: number, max: number): CustomValidationRule => {
    return (value, fieldPath) => {
      if (value !== undefined && value !== null) {
        if (value < min || value > max) {
          return {
            type: 'error',
            field: fieldPath,
            message: `${fieldName} must be between ${min} and ${max}`,
            code: 'NUMBER_RANGE',
          };
        }
      }
      return null;
    };
  },

  // Required field validation
  required: (fieldName: string): CustomValidationRule => {
    return (value, fieldPath) => {
      if (value === undefined || value === null || value === '') {
        return {
          type: 'error',
          field: fieldPath,
          message: `${fieldName} is required`,
          code: 'REQUIRED',
        };
      }
      return null;
    };
  },

  // Array minimum length
  minArrayLength: (fieldName: string, minLength: number): CustomValidationRule => {
    return (value, fieldPath) => {
      if (Array.isArray(value) && value.length < minLength) {
        return {
          type: 'error',
          field: fieldPath,
          message: `${fieldName} must have at least ${minLength} item${minLength > 1 ? 's' : ''}`,
          code: 'MIN_ARRAY_LENGTH',
        };
      }
      return null;
    };
  },

  // Cross-field validation example
  totalDurationLimit: (maxMinutes: number): CustomValidationRule => {
    return (value, fieldPath, workoutData) => {
      // Example: Check if total workout duration exceeds limit
      let totalDuration = 0;

      if (workoutData.exercises) {
        workoutData.exercises.forEach((exercise: any) => {
          if (exercise.sets && exercise.restBetweenSets) {
            totalDuration += exercise.sets * exercise.restBetweenSets;
          }
        });
      }

      if (totalDuration > maxMinutes * 60) {
        return {
          type: 'warning',
          field: fieldPath,
          message: `Total rest time exceeds ${maxMinutes} minutes`,
          code: 'DURATION_WARNING',
        };
      }

      return null;
    };
  },
};

// Export types for external use
export type { ValidationResult, ValidationError, ValidationWarning };