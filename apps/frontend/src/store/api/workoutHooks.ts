/**
 * Standardized workout hooks that provide consistent interfaces
 * across all workout types with automatic migration support
 */

import { useCallback } from 'react';
import {
  useListWorkoutsQuery,
  useGetWorkoutQuery,
  useCreateWorkoutMutation,
  useUpdateWorkoutMutation,
  useDeleteWorkoutMutation,
  useBatchWorkoutsMutation,
  useDuplicateWorkoutMutation,
  useValidateWorkoutMutation,
  useGetWorkoutStatisticsQuery,
  useWorkoutList,
  useWorkoutById,
  useWorkoutMutations,
  useWorkoutValidation,
  useWorkoutsByType,
  usePlayerWorkouts,
  useTeamWorkouts,
  buildListRequest,
  getErrorMessage,
  isErrorCode,
} from './unifiedTrainingApi';

import {
  // Legacy hooks for backward compatibility
  useGetWorkoutSessionsQuery,
  useGetWorkoutSessionByIdQuery,
  useCreateWorkoutSessionMutation,
  useUpdateWorkoutSessionMutation,
  useDeleteWorkoutSessionMutation,
  useGetSessionsQuery,
  CreateWorkoutRequest as LegacyCreateWorkoutRequest,
  UpdateWorkoutRequest as LegacyUpdateWorkoutRequest,
} from './trainingApi';

import {
  transformLegacyCreateRequest,
  transformLegacyUpdateRequest,
  transformLegacyWorkoutSession,
  transformToLegacyWorkoutSession,
  isLegacyRequest,
} from './migrationUtils';

import {
  ListWorkoutsRequest,
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
  WorkoutType,
  UnifiedWorkout,
  WorkoutErrorCode,
} from '../../features/physical-trainer/types/api.types';

// ============================================
// Primary Hooks (Recommended for new code)
// ============================================

/**
 * Enhanced hook for listing workouts with comprehensive filtering
 */
export const useWorkouts = (filters?: Partial<ListWorkoutsRequest['filters']>, pagination?: Partial<ListWorkoutsRequest['pagination']>) => {
  const request = buildListRequest(filters, pagination);
  return useWorkoutList(request);
};

/**
 * Enhanced hook for getting a single workout with transformation
 */
export const useWorkout = (id: string, options?: { include?: string[] }) => {
  return useWorkoutById(id, options?.include);
};

/**
 * Enhanced hook for all workout mutations with error handling
 */
export const useWorkoutActions = () => {
  const mutations = useWorkoutMutations();
  const validation = useWorkoutValidation();
  
  const createWorkout = useCallback(async (request: CreateWorkoutRequest) => {
    // Validate before creating
    const validationResult = await validation.validateWorkout({
      workout: request.workout as any,
      type: request.type,
      context: {
        playerIds: request.workout.assignedPlayerIds,
        teamIds: request.workout.assignedTeamIds,
        scheduledDate: request.workout.scheduledDate?.toISOString(),
      }
    });
    
    if (!validationResult.valid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }
    
    return mutations.createWorkout(request).unwrap();
  }, [mutations.createWorkout, validation.validateWorkout]);
  
  const updateWorkout = useCallback(async (request: UpdateWorkoutRequest) => {
    // Validate before updating if workout data provided
    if (request.workout && Object.keys(request.workout).length > 0) {
      const validationResult = await validation.validateWorkout({
        workout: request.workout as any,
        type: request.type,
        context: {
          playerIds: request.workout.assignedPlayerIds,
          teamIds: request.workout.assignedTeamIds,
          scheduledDate: request.workout.scheduledDate?.toISOString(),
        }
      });
      
      if (!validationResult.valid) {
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }
    }
    
    return mutations.updateWorkout(request).unwrap();
  }, [mutations.updateWorkout, validation.validateWorkout]);
  
  return {
    createWorkout,
    updateWorkout,
    deleteWorkout: (id: string) => mutations.deleteWorkout({ id }).unwrap(),
    duplicateWorkout: (sourceId: string, options?: { modifications?: any; includeAssignments?: boolean }) => 
      mutations.duplicateWorkout({ sourceId, ...options }).unwrap(),
    batchOperations: mutations.batchWorkouts,
    
    // Status flags
    isLoading: mutations.isLoading || validation.isValidating,
    hasError: mutations.hasError,
    
    // Individual mutation states
    createResult: mutations.createResult,
    updateResult: mutations.updateResult,
    deleteResult: mutations.deleteResult,
    duplicateResult: mutations.duplicateResult,
    batchResult: mutations.batchResult,
  };
};

/**
 * Hook for workout statistics with filtering
 */
export const useWorkoutStats = (filters?: {
  dateFrom?: string;
  dateTo?: string;
  playerIds?: string[];
  teamIds?: string[];
}) => {
  return useGetWorkoutStatisticsQuery(filters || {});
};

/**
 * Type-specific hooks for easier filtering
 */
export const useStrengthWorkouts = (filters?: Partial<ListWorkoutsRequest['filters']>) => {
  return useWorkoutsByType('STRENGTH', filters);
};

export const useConditioningWorkouts = (filters?: Partial<ListWorkoutsRequest['filters']>) => {
  return useWorkoutsByType('CONDITIONING', filters);
};

export const useHybridWorkouts = (filters?: Partial<ListWorkoutsRequest['filters']>) => {
  return useWorkoutsByType('HYBRID', filters);
};

export const useAgilityWorkouts = (filters?: Partial<ListWorkoutsRequest['filters']>) => {
  return useWorkoutsByType('AGILITY', filters);
};

// ============================================
// Assignment-specific hooks
// ============================================

/**
 * Get workouts assigned to specific player
 */
export const usePlayerAssignedWorkouts = (playerId: string) => {
  return usePlayerWorkouts(playerId);
};

/**
 * Get workouts assigned to specific team
 */
export const useTeamAssignedWorkouts = (teamId: string) => {
  return useTeamWorkouts(teamId);
};

// ============================================
// Validation hooks
// ============================================

/**
 * Hook for real-time workout validation
 */
export const useWorkoutValidator = () => {
  return useWorkoutValidation();
};

// ============================================
// Legacy Compatibility Hooks
// ============================================

/**
 * Legacy-compatible hook that automatically migrates old data
 */
export const useLegacyWorkouts = (params?: any) => {
  const legacyResult = useGetWorkoutSessionsQuery(params || {});
  
  return {
    ...legacyResult,
    data: legacyResult.data ? {
      ...legacyResult.data,
      data: legacyResult.data.data?.map(transformLegacyWorkoutSession) || []
    } : undefined,
  };
};

/**
 * Legacy-compatible workout creation with automatic migration
 */
export const useLegacyWorkoutActions = () => {
  const [legacyCreate] = useCreateWorkoutSessionMutation();
  const [legacyUpdate] = useUpdateWorkoutSessionMutation();
  const [legacyDelete] = useDeleteWorkoutSessionMutation();
  
  const { createWorkout: unifiedCreate, updateWorkout: unifiedUpdate } = useWorkoutActions();
  
  const createWorkout = useCallback(async (request: LegacyCreateWorkoutRequest | CreateWorkoutRequest) => {
    if (isLegacyRequest(request)) {
      // Use legacy API for old format
      return legacyCreate(request as LegacyCreateWorkoutRequest).unwrap();
    } else {
      // Use new unified API
      return unifiedCreate(request as CreateWorkoutRequest);
    }
  }, [legacyCreate, unifiedCreate]);
  
  const updateWorkout = useCallback(async (request: any) => {
    if (isLegacyRequest(request)) {
      // Use legacy API for old format
      return legacyUpdate(request).unwrap();
    } else {
      // Use new unified API
      return unifiedUpdate(request);
    }
  }, [legacyUpdate, unifiedUpdate]);
  
  return {
    createWorkout,
    updateWorkout,
    deleteWorkout: (id: string) => legacyDelete(id).unwrap(),
  };
};

// ============================================
// Utility hooks
// ============================================

/**
 * Hook for error handling with standardized messages
 */
export const useWorkoutErrors = () => {
  return {
    getErrorMessage,
    isErrorCode,
    
    // Common error checks
    isValidationError: (error: any) => isErrorCode(error, WorkoutErrorCode.INVALID_FIELD_VALUE),
    isMedicalRestriction: (error: any) => isErrorCode(error, WorkoutErrorCode.MEDICAL_RESTRICTION),
    isSchedulingConflict: (error: any) => isErrorCode(error, WorkoutErrorCode.SCHEDULING_CONFLICT),
    isUnauthorized: (error: any) => isErrorCode(error, WorkoutErrorCode.UNAUTHORIZED),
  };
};

/**
 * Hook for workout filtering and searching
 */
export const useWorkoutFilters = () => {
  return {
    buildListRequest,
    
    // Common filter builders
    buildPlayerFilter: (playerIds: string[]) => ({ playerIds }),
    buildTeamFilter: (teamIds: string[]) => ({ teamIds }),
    buildTypeFilter: (types: WorkoutType[]) => ({ types }),
    buildDateRangeFilter: (dateFrom: string, dateTo: string) => ({ dateFrom, dateTo }),
    buildSearchFilter: (search: string) => ({ search }),
    
    // Combined filters
    buildPlayerWorkoutsFilter: (playerId: string, types?: WorkoutType[]) => ({
      playerIds: [playerId],
      ...(types && { types })
    }),
    
    buildTeamWorkoutsFilter: (teamId: string, types?: WorkoutType[]) => ({
      teamIds: [teamId],
      ...(types && { types })
    }),
  };
};

/**
 * Hook for workout type management
 */
export const useWorkoutTypes = () => {
  const allTypes: WorkoutType[] = ['STRENGTH', 'CONDITIONING', 'HYBRID', 'AGILITY'];
  
  return {
    allTypes,
    getTypeLabel: (type: WorkoutType) => {
      const labels: Record<WorkoutType, string> = {
        'STRENGTH': 'Strength Training',
        'CONDITIONING': 'Conditioning',
        'HYBRID': 'Hybrid Training',
        'AGILITY': 'Agility Training',
      };
      return labels[type];
    },
    getTypeColor: (type: WorkoutType) => {
      const colors: Record<WorkoutType, string> = {
        'STRENGTH': 'blue',
        'CONDITIONING': 'red',
        'HYBRID': 'purple',
        'AGILITY': 'orange',
      };
      return colors[type];
    },
    getTypeIcon: (type: WorkoutType) => {
      const icons: Record<WorkoutType, string> = {
        'STRENGTH': 'dumbbell',
        'CONDITIONING': 'heart',
        'HYBRID': 'layers',
        'AGILITY': 'zap',
      };
      return icons[type];
    },
  };
};

// ============================================
// Performance hooks
// ============================================

/**
 * Hook for caching and performance optimization
 */
export const useWorkoutCache = () => {
  return {
    // Prefetch commonly accessed workouts
    prefetchPlayerWorkouts: (playerId: string) => {
      // Implementation would depend on RTK Query's prefetch capabilities
    },
    
    prefetchTeamWorkouts: (teamId: string) => {
      // Implementation would depend on RTK Query's prefetch capabilities
    },
    
    // Clear cache when needed
    clearWorkoutCache: () => {
      // Implementation would clear relevant cache entries
    },
  };
};

// ============================================
// Re-export core hooks for convenience
// ============================================

export {
  // Core unified API hooks
  useListWorkoutsQuery,
  useGetWorkoutQuery,
  useCreateWorkoutMutation,
  useUpdateWorkoutMutation,
  useDeleteWorkoutMutation,
  useBatchWorkoutsMutation,
  useDuplicateWorkoutMutation,
  useValidateWorkoutMutation,
  useGetWorkoutStatisticsQuery,
  
  // Enhanced hooks
  useWorkoutList,
  useWorkoutById,
  useWorkoutMutations,
  useWorkoutValidation,
  useWorkoutsByType,
  usePlayerWorkouts,
  useTeamWorkouts,
  
  // Utility functions
  buildListRequest,
  getErrorMessage,
  isErrorCode,
} from './unifiedTrainingApi';

// ============================================
// Default export with most commonly used hooks
// ============================================

export default {
  // Primary hooks
  useWorkouts,
  useWorkout,
  useWorkoutActions,
  useWorkoutStats,
  
  // Type-specific hooks
  useStrengthWorkouts,
  useConditioningWorkouts,
  useHybridWorkouts,
  useAgilityWorkouts,
  
  // Assignment hooks
  usePlayerAssignedWorkouts,
  useTeamAssignedWorkouts,
  
  // Utility hooks
  useWorkoutValidator,
  useWorkoutErrors,
  useWorkoutFilters,
  useWorkoutTypes,
  useWorkoutCache,
  
  // Legacy compatibility
  useLegacyWorkouts,
  useLegacyWorkoutActions,
};