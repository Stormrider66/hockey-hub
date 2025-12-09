import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import {
  FormattedError,
  getErrorMessage,
  parseApiError,
  formatErrorSummary,
  getErrorNotificationOptions,
  ErrorSeverity
} from '../utils/errorFormatting';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  showTechnicalDetails?: boolean;
  fallbackErrorCode?: string;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { t } = useTranslation('physicalTrainer');
  const [errors, setErrors] = useState<FormattedError[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, FormattedError>>({});
  
  const {
    showToast = true,
    showTechnicalDetails = false,
    fallbackErrorCode = 'UNKNOWN_ERROR'
  } = options;

  // Add a single error
  const addError = useCallback((
    errorCode: string | any,
    context?: any
  ) => {
    let formattedError: FormattedError;
    
    if (typeof errorCode === 'string') {
      formattedError = getErrorMessage(errorCode, context, t)!;
    } else {
      // Assume it's an API error
      formattedError = parseApiError(errorCode, fallbackErrorCode, t);
    }

    setErrors(prev => [...prev, formattedError]);

    // Show toast notification if enabled
    if (showToast && formattedError.severity === ErrorSeverity.ERROR) {
      const notificationOptions = getErrorNotificationOptions(formattedError);
      toast(notificationOptions);
    }

    return formattedError;
  }, [t, showToast, fallbackErrorCode]);

  // Add a field-specific error
  const addFieldError = useCallback((
    field: string,
    errorCode: string,
    context?: any
  ) => {
    const formattedError = getErrorMessage(errorCode, { ...context, field }, t)!;
    setFieldErrors(prev => ({
      ...prev,
      [field]: formattedError
    }));
    return formattedError;
  }, [t]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
    setFieldErrors({});
  }, []);

  // Clear specific field error
  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Remove a specific error by index
  const removeError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Validate multiple fields
  const validateFields = useCallback((
    validations: Array<{
      field: string;
      condition: boolean;
      errorCode: string;
      context?: any;
    }>
  ): boolean => {
    let isValid = true;
    const newFieldErrors: Record<string, FormattedError> = {};

    validations.forEach(({ field, condition, errorCode, context }) => {
      if (!condition) {
        isValid = false;
        newFieldErrors[field] = getErrorMessage(errorCode, { ...context, field }, t)!;
      }
    });

    setFieldErrors(newFieldErrors);
    return isValid;
  }, [t]);

  // Handle API error response
  const handleApiError = useCallback((error: any) => {
    const formattedError = parseApiError(error, fallbackErrorCode, t);
    
    // Check if it's a validation error with field details
    if (error?.data?.errors && Array.isArray(error.data.errors)) {
      error.data.errors.forEach((fieldError: any) => {
        if (fieldError.field) {
          addFieldError(fieldError.field, fieldError.code || 'VALIDATION_ERROR', {
            value: fieldError.value,
            details: fieldError
          });
        }
      });
    } else {
      addError(formattedError);
    }
  }, [addError, addFieldError, fallbackErrorCode, t]);

  // Get error summary
  const getErrorSummary = useCallback(() => {
    const allErrors = [
      ...errors,
      ...Object.values(fieldErrors)
    ];
    return formatErrorSummary(allErrors, t);
  }, [errors, fieldErrors, t]);

  // Check if there are any errors
  const hasErrors = errors.length > 0 || Object.keys(fieldErrors).length > 0;
  
  // Check if there are any warnings
  const hasWarnings = errors.some(e => e.severity === ErrorSeverity.WARNING) ||
    Object.values(fieldErrors).some(e => e.severity === ErrorSeverity.WARNING);

  return {
    errors,
    fieldErrors,
    addError,
    addFieldError,
    clearErrors,
    clearFieldError,
    removeError,
    validateFields,
    handleApiError,
    getErrorSummary,
    hasErrors,
    hasWarnings
  };
}

// Validation helpers
export const validationRules = {
  required: (value: any) => value !== null && value !== undefined && value !== '',
  minLength: (min: number) => (value: string) => value && value.length >= min,
  maxLength: (max: number) => (value: string) => !value || value.length <= max,
  min: (min: number) => (value: number) => value >= min,
  max: (max: number) => (value: number) => value <= max,
  between: (min: number, max: number) => (value: number) => value >= min && value <= max,
  pattern: (regex: RegExp) => (value: string) => !value || regex.test(value),
  email: (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  url: (value: string) => !value || /^https?:\/\/.+/.test(value)
};

// Common validation patterns
export const commonValidations = {
  workoutName: (name: string) => ({
    field: 'name',
    validations: [
      {
        condition: validationRules.required(name),
        errorCode: 'WORKOUT_NAME_REQUIRED'
      },
      {
        condition: validationRules.minLength(3)(name),
        errorCode: 'WORKOUT_NAME_TOO_SHORT'
      },
      {
        condition: validationRules.maxLength(100)(name),
        errorCode: 'WORKOUT_NAME_TOO_LONG'
      }
    ]
  }),
  
  exerciseParams: (sets: number, reps: number, intensity: number) => ({
    validations: [
      {
        field: 'sets',
        condition: validationRules.between(1, 10)(sets),
        errorCode: 'INVALID_SETS_VALUE',
        context: { value: sets }
      },
      {
        field: 'reps',
        condition: validationRules.between(1, 100)(reps),
        errorCode: 'INVALID_REPS_VALUE',
        context: { value: reps }
      },
      {
        field: 'intensity',
        condition: validationRules.between(1, 100)(intensity),
        errorCode: 'INVALID_INTENSITY_VALUE',
        context: { value: intensity }
      }
    ]
  })
};