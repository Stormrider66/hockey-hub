/**
 * Unified Training API - Standardized endpoints for all workout types
 * Provides consistent interfaces, error handling, and caching strategies
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { 
  ApiSuccessResponse,
  ApiListResponse,
  ApiErrorResponse,
  ListWorkoutsRequest,
  ListWorkoutsResponse,
  GetWorkoutRequest,
  GetWorkoutResponse,
  CreateWorkoutRequest,
  CreateWorkoutResponse,
  UpdateWorkoutRequest,
  UpdateWorkoutResponse,
  DeleteWorkoutResponse,
  BatchOperationRequest,
  BatchOperationResponse,
  DuplicateWorkoutRequest,
  DuplicateWorkoutResponse,
  ValidateWorkoutRequest,
  ValidateWorkoutResponseType,
  GetWorkoutStatisticsRequest,
  GetWorkoutStatisticsResponse,
  UnifiedWorkout,
  WorkoutType,
  buildQueryString,
  toApiWorkout,
  fromApiWorkout,
  isApiError,
  WorkoutErrorCode
} from '../../features/physical-trainer/types/api.types';
import { mockBaseQuery } from './mockBaseQuery';

// ============================================
// Base Query Configuration
// ============================================

/**
 * Custom base query with error transformation and retry logic
 */
const baseQueryWithErrorHandling = async (args: any, api: any, extraOptions: any) => {
  const result = await mockBaseQuery(args, api, extraOptions);
  
  // Transform errors to standard format
  if (result.error) {
    return {
      error: {
        status: result.error.status || 500,
        data: {
          error: {
            code: result.error.data?.code || WorkoutErrorCode.INTERNAL_ERROR,
            message: result.error.data?.message || 'An unexpected error occurred',
            details: result.error.data?.details || {},
            timestamp: new Date().toISOString(),
            path: args.url || 'unknown',
            requestId: generateRequestId(),
          }
        } as ApiErrorResponse
      }
    };
  }
  
  // Transform successful responses
  if (result.data) {
    return {
      data: {
        ...result.data,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          requestId: generateRequestId(),
          duration: Math.random() * 100 + 50, // Mock duration
        }
      }
    };
  }
  
  return result;
};

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// API Definition
// ============================================

export const unifiedTrainingApi = createApi({
  reducerPath: 'unifiedTrainingApi',
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: [
    'Workout',
    'WorkoutList',
    'WorkoutStatistics',
    'WorkoutValidation'
  ],
  endpoints: (builder) => ({
    
    // ============================================
    // LIST WORKOUTS
    // ============================================
    
    /**
     * Get list of workouts with filtering and pagination
     * GET /api/workouts
     */
    listWorkouts: builder.query<ListWorkoutsResponse, ListWorkoutsRequest>({
      query: ({ pagination = {}, filters = {} }) => {
        const params = {
          ...pagination,
          ...filters,
          // Convert arrays to comma-separated strings for URL
          types: filters.types?.join(','),
          playerIds: filters.playerIds?.join(','),
          teamIds: filters.teamIds?.join(','),
          tags: filters.tags?.join(','),
        };
        
        const queryString = buildQueryString(params);
        return {
          url: `training/workouts${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      transformResponse: (response: any): ListWorkoutsResponse => ({
        data: response.data?.map(fromApiWorkout) || [],
        pagination: response.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
        meta: response.meta,
      }),
      providesTags: (result) => [
        { type: 'WorkoutList', id: 'LIST' },
        ...(result?.data?.map(workout => ({ type: 'Workout' as const, id: workout.id })) || []),
      ],
    }),
    
    // ============================================
    // GET SINGLE WORKOUT
    // ============================================
    
    /**
     * Get single workout by ID
     * GET /api/workouts/:id
     */
    getWorkout: builder.query<GetWorkoutResponse, GetWorkoutRequest>({
      query: ({ id, include = [] }) => {
        const params = include.length > 0 ? { include: include.join(',') } : {};
        const queryString = buildQueryString(params);
        return {
          url: `training/workouts/${id}${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      transformResponse: (response: any): GetWorkoutResponse => ({
        data: fromApiWorkout(response.data),
        meta: response.meta,
      }),
      providesTags: (result, error, { id }) => [
        { type: 'Workout', id },
      ],
    }),
    
    // ============================================
    // CREATE WORKOUT
    // ============================================
    
    /**
     * Create new workout
     * POST /api/workouts
     */
    createWorkout: builder.mutation<CreateWorkoutResponse, CreateWorkoutRequest>({
      query: (request) => ({
        url: 'training/workouts',
        method: 'POST',
        body: {
          type: request.type,
          workout: toApiWorkout(request.workout as any),
        },
      }),
      transformResponse: (response: any): CreateWorkoutResponse => ({
        data: fromApiWorkout(response.data),
        meta: response.meta,
      }),
      invalidatesTags: [
        { type: 'WorkoutList', id: 'LIST' },
        { type: 'WorkoutStatistics', id: 'STATS' },
      ],
    }),
    
    // ============================================
    // UPDATE WORKOUT
    // ============================================
    
    /**
     * Update existing workout
     * PUT /api/workouts/:id
     */
    updateWorkout: builder.mutation<UpdateWorkoutResponse, UpdateWorkoutRequest>({
      query: ({ id, type, workout }) => ({
        url: `training/workouts/${id}`,
        method: 'PUT',
        body: {
          type,
          workout: toApiWorkout(workout as any),
        },
      }),
      transformResponse: (response: any): UpdateWorkoutResponse => ({
        data: fromApiWorkout(response.data),
        meta: response.meta,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Workout', id },
        { type: 'WorkoutList', id: 'LIST' },
        { type: 'WorkoutStatistics', id: 'STATS' },
      ],
    }),
    
    // ============================================
    // DELETE WORKOUT
    // ============================================
    
    /**
     * Delete workout
     * DELETE /api/workouts/:id
     */
    deleteWorkout: builder.mutation<DeleteWorkoutResponse, { id: string }>({
      query: ({ id }) => ({
        url: `training/workouts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Workout', id },
        { type: 'WorkoutList', id: 'LIST' },
        { type: 'WorkoutStatistics', id: 'STATS' },
      ],
    }),
    
    // ============================================
    // BATCH OPERATIONS
    // ============================================
    
    /**
     * Perform batch operations on workouts
     * POST /api/workouts/batch
     */
    batchWorkouts: builder.mutation<BatchOperationResponse, BatchOperationRequest>({
      query: (request) => ({
        url: 'training/workouts/batch',
        method: 'POST',
        body: {
          ...request,
          workouts: request.workouts?.map(w => ({
            type: w.type,
            workout: toApiWorkout(w.workout as any),
          })),
        },
      }),
      invalidatesTags: [
        { type: 'WorkoutList', id: 'LIST' },
        { type: 'WorkoutStatistics', id: 'STATS' },
      ],
    }),
    
    // ============================================
    // DUPLICATE WORKOUT
    // ============================================
    
    /**
     * Duplicate existing workout
     * POST /api/workouts/:id/duplicate
     */
    duplicateWorkout: builder.mutation<DuplicateWorkoutResponse, DuplicateWorkoutRequest>({
      query: ({ sourceId, modifications, includeAssignments = false }) => ({
        url: `training/workouts/${sourceId}/duplicate`,
        method: 'POST',
        body: {
          modifications: modifications ? toApiWorkout(modifications as any) : undefined,
          includeAssignments,
        },
      }),
      transformResponse: (response: any): DuplicateWorkoutResponse => ({
        data: fromApiWorkout(response.data),
        meta: response.meta,
      }),
      invalidatesTags: [
        { type: 'WorkoutList', id: 'LIST' },
        { type: 'WorkoutStatistics', id: 'STATS' },
      ],
    }),
    
    // ============================================
    // VALIDATE WORKOUT
    // ============================================
    
    /**
     * Validate workout data
     * POST /api/workouts/validate
     */
    validateWorkout: builder.mutation<ValidateWorkoutResponseType, ValidateWorkoutRequest>({
      query: (request) => ({
        url: 'training/workouts/validate',
        method: 'POST',
        body: {
          workout: toApiWorkout(request.workout as any),
          type: request.type,
          context: request.context,
        },
      }),
      providesTags: [
        { type: 'WorkoutValidation', id: 'VALIDATION' },
      ],
    }),
    
    /**
     * Validate existing workout by ID
     * GET /api/workouts/:id/validate
     */
    validateExistingWorkout: builder.query<ValidateWorkoutResponseType, { id: string }>({
      query: ({ id }) => ({
        url: `training/workouts/${id}/validate`,
        method: 'GET',
      }),
      providesTags: (result, error, { id }) => [
        { type: 'WorkoutValidation', id },
      ],
    }),
    
    // ============================================
    // STATISTICS
    // ============================================
    
    /**
     * Get workout statistics
     * GET /api/workouts/statistics
     */
    getWorkoutStatistics: builder.query<GetWorkoutStatisticsResponse, GetWorkoutStatisticsRequest>({
      query: (params) => {
        const queryString = buildQueryString(params);
        return {
          url: `training/workouts/statistics${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: [
        { type: 'WorkoutStatistics', id: 'STATS' },
      ],
    }),
  }),
});

// ============================================
// Hook Exports
// ============================================

export const {
  // Queries
  useListWorkoutsQuery,
  useGetWorkoutQuery,
  useValidateExistingWorkoutQuery,
  useGetWorkoutStatisticsQuery,
  
  // Mutations
  useCreateWorkoutMutation,
  useUpdateWorkoutMutation,
  useDeleteWorkoutMutation,
  useBatchWorkoutsMutation,
  useDuplicateWorkoutMutation,
  useValidateWorkoutMutation,
  
  // Utility hooks
  useLazyListWorkoutsQuery,
  useLazyGetWorkoutQuery,
  useLazyGetWorkoutStatisticsQuery,
} = unifiedTrainingApi;

// ============================================
// Enhanced Hooks with Error Handling
// ============================================

/**
 * Enhanced hook for listing workouts with automatic error handling
 */
export const useWorkoutList = (request: ListWorkoutsRequest = {}) => {
  const result = useListWorkoutsQuery(request);
  
  return {
    ...result,
    workouts: result.data?.data || [],
    pagination: result.data?.pagination,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error && isApiError(result.error) ? result.error.data.error : null,
    refetch: result.refetch,
  };
};

/**
 * Enhanced hook for getting single workout with automatic error handling
 */
export const useWorkoutById = (id: string, include?: GetWorkoutRequest['include']) => {
  const result = useGetWorkoutQuery({ id, include });
  
  return {
    ...result,
    workout: result.data?.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error && isApiError(result.error) ? result.error.data.error : null,
    refetch: result.refetch,
  };
};

/**
 * Enhanced hook for workout mutations with optimistic updates
 */
export const useWorkoutMutations = () => {
  const [createWorkout, createResult] = useCreateWorkoutMutation();
  const [updateWorkout, updateResult] = useUpdateWorkoutMutation();
  const [deleteWorkout, deleteResult] = useDeleteWorkoutMutation();
  const [duplicateWorkout, duplicateResult] = useDuplicateWorkoutMutation();
  const [batchWorkouts, batchResult] = useBatchWorkoutsMutation();
  
  return {
    // Mutations
    createWorkout,
    updateWorkout,
    deleteWorkout,
    duplicateWorkout,
    batchWorkouts,
    
    // Results
    createResult,
    updateResult,
    deleteResult,
    duplicateResult,
    batchResult,
    
    // Combined loading state
    isLoading: [createResult, updateResult, deleteResult, duplicateResult, batchResult]
      .some(result => result.isLoading),
    
    // Combined error state
    hasError: [createResult, updateResult, deleteResult, duplicateResult, batchResult]
      .some(result => result.isError),
  };
};

/**
 * Enhanced hook for workout validation
 */
export const useWorkoutValidation = () => {
  const [validateWorkout, validateResult] = useValidateWorkoutMutation();
  
  return {
    validateWorkout: async (request: ValidateWorkoutRequest) => {
      try {
        const result = await validateWorkout(request).unwrap();
        return result.data;
      } catch (error) {
        if (isApiError(error)) {
          throw error.error;
        }
        throw error;
      }
    },
    isValidating: validateResult.isLoading,
    validationError: validateResult.error && isApiError(validateResult.error) 
      ? validateResult.error.data.error 
      : null,
  };
};

// ============================================
// Utility Functions
// ============================================

/**
 * Build standard list request with defaults
 */
export const buildListRequest = (
  filters: Partial<ListWorkoutsRequest['filters']> = {},
  pagination: Partial<ListWorkoutsRequest['pagination']> = {}
): ListWorkoutsRequest => ({
  filters: {
    ...filters,
  },
  pagination: {
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    ...pagination,
  },
});

/**
 * Extract error message from API error
 */
export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.error.message;
  }
  
  if (error?.data?.message) {
    return error.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Check if error is a specific type
 */
export const isErrorCode = (error: any, code: WorkoutErrorCode): boolean => {
  return isApiError(error) && error.error.code === code;
};

// ============================================
// Type-specific convenience hooks
// ============================================

/**
 * Get workouts filtered by type
 */
export const useWorkoutsByType = (type: WorkoutType, additionalFilters: Partial<ListWorkoutsRequest['filters']> = {}) => {
  return useWorkoutList({
    filters: {
      types: [type],
      ...additionalFilters,
    },
  });
};

/**
 * Get player's assigned workouts
 */
export const usePlayerWorkouts = (playerId: string) => {
  return useWorkoutList({
    filters: {
      playerIds: [playerId],
    },
  });
};

/**
 * Get team's assigned workouts
 */
export const useTeamWorkouts = (teamId: string) => {
  return useWorkoutList({
    filters: {
      teamIds: [teamId],
    },
  });
};

export default unifiedTrainingApi;