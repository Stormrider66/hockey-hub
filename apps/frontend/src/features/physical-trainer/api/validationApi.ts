// Validation API for Physical Trainer Module

import { createApi } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from '../../../store/api/mockBaseQuery';
import {
  ValidationResult,
  FieldValidationRequest,
  FieldValidationResult,
  MedicalValidationRequest,
  MedicalValidationResult,
  ScheduleValidationRequest,
  ScheduleValidationResult,
  BatchValidationRequest,
  BatchValidationResult,
  WorkoutValidationRequest,
  ValidationRule,
  ValidationConfig
} from '../types/validation.types';

export const validationApi = createApi({
  reducerPath: 'validationApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['Validation', 'ValidationRule', 'ValidationConfig'],
  endpoints: (builder) => ({
    // Real-time validation
    validateWorkout: builder.mutation<ValidationResult, WorkoutValidationRequest>({
      query: (request) => ({
        url: '/api/workouts/validate',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Validation'],
    }),

    // Field-level validation
    validateField: builder.mutation<FieldValidationResult, FieldValidationRequest>({
      query: (request) => ({
        url: '/api/workouts/validate/field',
        method: 'POST',
        body: request,
      }),
    }),

    // Medical compliance validation
    validateMedicalCompliance: builder.mutation<MedicalValidationResult, MedicalValidationRequest>({
      query: (request) => ({
        url: '/api/workouts/validate/medical',
        method: 'POST',
        body: request,
      }),
    }),

    // Schedule conflict validation
    validateSchedule: builder.mutation<ScheduleValidationResult, ScheduleValidationRequest>({
      query: (request) => ({
        url: '/api/workouts/validate/schedule',
        method: 'POST',
        body: request,
      }),
    }),

    // Batch validation
    validateBatch: builder.mutation<BatchValidationResult, BatchValidationRequest>({
      query: (request) => ({
        url: '/api/workouts/validate/batch',
        method: 'POST',
        body: request,
      }),
    }),

    // Validation rules management
    getValidationRules: builder.query<ValidationRule[], { workoutType?: string }>({
      query: ({ workoutType }) => ({
        url: `/api/validation/rules${workoutType ? `?workoutType=${workoutType}` : ''}`,
        method: 'GET',
      }),
      providesTags: ['ValidationRule'],
    }),

    createValidationRule: builder.mutation<ValidationRule, Omit<ValidationRule, 'id'>>({
      query: (rule) => ({
        url: '/api/validation/rules',
        method: 'POST',
        body: rule,
      }),
      invalidatesTags: ['ValidationRule'],
    }),

    updateValidationRule: builder.mutation<ValidationRule, ValidationRule>({
      query: ({ id, ...rule }) => ({
        url: `/api/validation/rules/${id}`,
        method: 'PUT',
        body: rule,
      }),
      invalidatesTags: ['ValidationRule'],
    }),

    deleteValidationRule: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/validation/rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ValidationRule'],
    }),

    // Validation configuration
    getValidationConfig: builder.query<ValidationConfig, void>({
      query: () => ({
        url: '/api/validation/config',
        method: 'GET',
      }),
      providesTags: ['ValidationConfig'],
    }),

    updateValidationConfig: builder.mutation<ValidationConfig, Partial<ValidationConfig>>({
      query: (config) => ({
        url: '/api/validation/config',
        method: 'PUT',
        body: config,
      }),
      invalidatesTags: ['ValidationConfig'],
    }),

    // Validation history and analytics
    getValidationHistory: builder.query<ValidationResult[], {
      startDate?: string;
      endDate?: string;
      workoutType?: string;
      playerId?: string;
      limit?: number;
    }>({
      query: (params) => ({
        url: '/api/validation/history',
        method: 'GET',
        params,
      }),
    }),

    getValidationStats: builder.query<{
      totalValidations: number;
      errorRate: number;
      warningRate: number;
      commonErrors: { code: string; count: number; message: string }[];
      trendData: { date: string; validations: number; errors: number }[];
    }, {
      startDate?: string;
      endDate?: string;
      workoutType?: string;
    }>({
      query: (params) => ({
        url: '/api/validation/stats',
        method: 'GET',
        params,
      }),
    }),
  }),
});

export const {
  useValidateWorkoutMutation,
  useValidateFieldMutation,
  useValidateMedicalComplianceMutation,
  useValidateScheduleMutation,
  useValidateBatchMutation,
  useGetValidationRulesQuery,
  useCreateValidationRuleMutation,
  useUpdateValidationRuleMutation,
  useDeleteValidationRuleMutation,
  useGetValidationConfigQuery,
  useUpdateValidationConfigMutation,
  useGetValidationHistoryQuery,
  useGetValidationStatsQuery,
} = validationApi;

// Utility functions for validation
export const validateWorkoutData = async (
  workoutType: string,
  data: any,
  options: {
    validateMedical?: boolean;
    validateSchedule?: boolean;
    playerId?: string;
    teamId?: string;
  } = {}
): Promise<ValidationResult> => {
  // This would be called by the mutation
  // Implementation depends on the actual API setup
  return {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
    timestamp: new Date().toISOString(),
    validatedBy: 'system'
  };
};

export const debounceValidation = <T extends any[]>(
  fn: (...args: T) => Promise<any>,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: T): Promise<any> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

// Validation result helpers
export const hasErrors = (result: ValidationResult): boolean => {
  return result.errors.length > 0;
};

export const hasWarnings = (result: ValidationResult): boolean => {
  return result.warnings.length > 0;
};

export const getErrorsByField = (result: ValidationResult): Record<string, string[]> => {
  const errorsByField: Record<string, string[]> = {};
  result.errors.forEach(error => {
    if (!errorsByField[error.field]) {
      errorsByField[error.field] = [];
    }
    errorsByField[error.field].push(error.message);
  });
  return errorsByField;
};

export const getFirstError = (result: ValidationResult, field?: string): string | null => {
  if (field) {
    const fieldError = result.errors.find(error => error.field === field);
    return fieldError?.message || null;
  }
  return result.errors[0]?.message || null;
};

export const combineValidationResults = (...results: ValidationResult[]): ValidationResult => {
  const combined: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
    timestamp: new Date().toISOString(),
    validatedBy: 'combined'
  };

  results.forEach(result => {
    combined.errors.push(...result.errors);
    combined.warnings.push(...result.warnings);
    combined.info.push(...result.info);
  });

  combined.valid = combined.errors.length === 0;
  return combined;
};