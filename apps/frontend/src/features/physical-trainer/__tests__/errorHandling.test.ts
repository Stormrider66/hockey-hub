/**
 * Test suite for Physical Trainer error handling system
 * Demonstrates how to test error formatting, validation, and display
 */

import { renderHook, act } from '@testing-library/react';
import { 
  getErrorMessage, 
  parseApiError, 
  formatErrorSummary,
  ErrorSeverity,
  ErrorCategory 
} from '../utils/errorFormatting';
import { useErrorHandler, validationRules, commonValidations } from '../hooks/useErrorHandler';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Simple mock translation
      const translations: Record<string, string> = {
        'physicalTrainer:errors.WORKOUT_NAME_REQUIRED.message': 'Please enter a name for your workout',
        'physicalTrainer:errors.WORKOUT_NAME_TOO_SHORT.message': 'Workout name must be at least 3 characters',
        'physicalTrainer:errors.summary.errors': '{{count}} error(s) found',
        'physicalTrainer:errors.summary.warnings': '{{count}} warning(s) found'
      };
      
      let result = translations[key] || key;
      if (options) {
        Object.keys(options).forEach(optionKey => {
          result = result.replace(`{{${optionKey}}}`, options[optionKey]);
        });
      }
      return result;
    }
  })
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

describe('Error Message System', () => {
  describe('getErrorMessage', () => {
    it('should return formatted error for valid code', () => {
      const error = getErrorMessage('WORKOUT_NAME_REQUIRED');
      
      expect(error).toBeDefined();
      expect(error?.code).toBe('WORKOUT_NAME_REQUIRED');
      expect(error?.message).toBe('Please enter a name for your workout');
      expect(error?.severity).toBe(ErrorSeverity.ERROR);
      expect(error?.supportCode).toMatch(/^VAL-/); // Should start with validation prefix
    });

    it('should return null for invalid error code', () => {
      const error = getErrorMessage('INVALID_ERROR_CODE');
      expect(error).toBeDefined(); // Should fallback to UNKNOWN_ERROR
      expect(error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should include context in error', () => {
      const context = { field: 'workoutName', value: 'ab' };
      const error = getErrorMessage('WORKOUT_NAME_TOO_SHORT', context);
      
      expect(error?.context).toEqual(context);
    });
  });

  describe('parseApiError', () => {
    it('should parse RTK Query error correctly', () => {
      const apiError = {
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            details: { field: 'name' }
          }
        }
      };

      const error = parseApiError(apiError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context?.details).toEqual({ field: 'name' });
    });

    it('should handle HTTP status codes', () => {
      const httpError = { status: 404 };
      const error = parseApiError(httpError);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should fallback to UNKNOWN_ERROR', () => {
      const unknownError = { message: 'Something went wrong' };
      const error = parseApiError(unknownError, 'CUSTOM_FALLBACK');
      expect(error.code).toBe('CUSTOM_FALLBACK');
    });
  });

  describe('formatErrorSummary', () => {
    it('should format single error correctly', () => {
      const errors = ['WORKOUT_NAME_REQUIRED'];
      const mockT = jest.fn().mockReturnValue('1 error(s) found');
      
      const summary = formatErrorSummary(errors, mockT);
      expect(summary.summary).toBe('1 error(s) found');
      expect(summary.hasErrors).toBe(true);
      expect(summary.hasWarnings).toBe(false);
    });

    it('should handle mixed errors and warnings', () => {
      const errorObj = getErrorMessage('WORKOUT_NAME_REQUIRED')!;
      const warningObj = { ...errorObj, severity: ErrorSeverity.WARNING };
      
      const summary = formatErrorSummary([errorObj, warningObj]);
      expect(summary.hasErrors).toBe(true);
      expect(summary.hasWarnings).toBe(true);
    });
  });
});

describe('Validation Rules', () => {
  describe('validationRules', () => {
    it('should validate required fields', () => {
      expect(validationRules.required('')).toBe(false);
      expect(validationRules.required(null)).toBe(false);
      expect(validationRules.required(undefined)).toBe(false);
      expect(validationRules.required('value')).toBe(true);
      expect(validationRules.required(0)).toBe(true);
    });

    it('should validate string length', () => {
      expect(validationRules.minLength(3)('ab')).toBe(false);
      expect(validationRules.minLength(3)('abc')).toBe(true);
      expect(validationRules.maxLength(5)('toolong')).toBe(false);
      expect(validationRules.maxLength(5)('short')).toBe(true);
    });

    it('should validate number ranges', () => {
      expect(validationRules.between(1, 10)(0)).toBe(false);
      expect(validationRules.between(1, 10)(5)).toBe(true);
      expect(validationRules.between(1, 10)(11)).toBe(false);
    });

    it('should validate email format', () => {
      expect(validationRules.email('invalid')).toBe(false);
      expect(validationRules.email('user@example.com')).toBe(true);
      expect(validationRules.email('')).toBe(true); // Optional
    });
  });

  describe('commonValidations', () => {
    it('should provide workout name validation', () => {
      const validation = commonValidations.workoutName('Valid Name');
      expect(validation.field).toBe('name');
      expect(validation.validations).toHaveLength(3);
      
      // Test each validation rule
      const [required, minLength, maxLength] = validation.validations;
      expect(required.condition).toBe(true);
      expect(minLength.condition).toBe(true);
      expect(maxLength.condition).toBe(true);
    });

    it('should provide exercise parameters validation', () => {
      const validation = commonValidations.exerciseParams(3, 10, 75);
      expect(validation.validations).toHaveLength(3);
      
      validation.validations.forEach(v => {
        expect(v.condition).toBe(true);
      });
    });
  });
});

describe('useErrorHandler Hook', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    expect(result.current.errors).toEqual([]);
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.hasWarnings).toBe(false);
  });

  it('should add and clear errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.addError('WORKOUT_NAME_REQUIRED');
    });
    
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.hasErrors).toBe(true);
    
    act(() => {
      result.current.clearErrors();
    });
    
    expect(result.current.errors).toEqual([]);
    expect(result.current.hasErrors).toBe(false);
  });

  it('should add and clear field errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.addFieldError('workoutName', 'WORKOUT_NAME_REQUIRED');
    });
    
    expect(result.current.fieldErrors.workoutName).toBeDefined();
    expect(result.current.hasErrors).toBe(true);
    
    act(() => {
      result.current.clearFieldError('workoutName');
    });
    
    expect(result.current.fieldErrors.workoutName).toBeUndefined();
    expect(result.current.hasErrors).toBe(false);
  });

  it('should validate multiple fields', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    let isValid = true;
    act(() => {
      isValid = result.current.validateFields([
        {
          field: 'name',
          condition: false,
          errorCode: 'WORKOUT_NAME_REQUIRED'
        },
        {
          field: 'exercises',
          condition: true,
          errorCode: 'NO_EXERCISES_SELECTED'
        }
      ]);
    });
    
    expect(isValid).toBe(false);
    expect(result.current.fieldErrors.name).toBeDefined();
    expect(result.current.fieldErrors.exercises).toBeUndefined();
  });

  it('should handle API errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const apiError = {
      status: 400,
      data: {
        errors: [
          { field: 'name', code: 'WORKOUT_NAME_REQUIRED' }
        ]
      }
    };
    
    act(() => {
      result.current.handleApiError(apiError);
    });
    
    expect(result.current.fieldErrors.name).toBeDefined();
  });

  it('should provide error summary', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.addError('WORKOUT_NAME_REQUIRED');
      result.current.addFieldError('exercises', 'NO_EXERCISES_SELECTED');
    });
    
    const summary = result.current.getErrorSummary();
    expect(summary.errors).toHaveLength(2);
    expect(summary.hasErrors).toBe(true);
  });

  it('should remove specific errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.addError('WORKOUT_NAME_REQUIRED');
      result.current.addError('NO_EXERCISES_SELECTED');
    });
    
    expect(result.current.errors).toHaveLength(2);
    
    act(() => {
      result.current.removeError(0);
    });
    
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].code).toBe('NO_EXERCISES_SELECTED');
  });
});

describe('Error Integration', () => {
  it('should handle complete validation workflow', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    // Simulate form validation
    const workoutName = '';
    const exercises: any[] = [];
    const sets = 0;
    
    act(() => {
      // Validate workout name
      const nameValidation = commonValidations.workoutName(workoutName);
      result.current.validateFields(nameValidation.validations.map(v => ({
        field: nameValidation.field,
        condition: v.condition,
        errorCode: v.errorCode
      })));
      
      // Validate exercises
      if (exercises.length === 0) {
        result.current.addFieldError('exercises', 'NO_EXERCISES_SELECTED');
      }
      
      // Validate sets
      if (!validationRules.between(1, 10)(sets)) {
        result.current.addFieldError('sets', 'INVALID_SETS_VALUE', { value: sets });
      }
    });
    
    // Should have multiple field errors
    expect(Object.keys(result.current.fieldErrors)).toHaveLength(3);
    expect(result.current.fieldErrors.name).toBeDefined();
    expect(result.current.fieldErrors.exercises).toBeDefined();
    expect(result.current.fieldErrors.sets).toBeDefined();
    
    // Get comprehensive error summary
    const summary = result.current.getErrorSummary();
    expect(summary.hasErrors).toBe(true);
    expect(summary.errors.length).toBeGreaterThan(0);
  });
});