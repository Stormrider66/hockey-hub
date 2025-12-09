// Workout Builder State Management - Barrel Exports
// Central entry point for all workout builder state functionality

// Core slice exports
export {
  // Actions
  createWorkout,
  updateWorkoutData,
  saveWorkout,
  deleteWorkout,
  addPlayer,
  removePlayer,
  addTeam,
  removeTeam,
  undo,
  redo,
  setValidationResults,
  updateUIState,
  toggleAutoSave,
  markForAutoSave,
  addToOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
  importWorkouts,
  clearAllWorkouts,
  
  // Selectors
  selectWorkoutById,
  selectActiveWorkouts,
  selectWorkoutsByType,
  selectAssignedPlayers,
  selectAssignedTeams,
  selectValidationErrors,
  selectUnsavedChanges,
  selectCanUndo,
  selectCanRedo,
  selectUIState,
  selectIsAutoSaveEnabled,
  selectPendingSaves,
  selectOfflineQueue,
  selectWorkoutCompleteness,
  selectTotalAssignedPlayers,
  
  // Utilities
  persistState,
  loadPersistedState,
  cleanupPersistedState,
  
  // Default reducer
  default as workoutBuilderReducer
} from '../slices/workoutBuilderSlice';

// Hooks exports
export {
  useWorkout,
  useWorkoutBuilder,
  useWorkoutsByType,
  useWorkoutValidation,
  useOfflineWorkoutBuilder
} from '../hooks/useWorkoutBuilderState';

// Middleware exports
export {
  autoSaveMiddleware,
  offlineQueueMiddleware,
  persistenceMiddleware,
  validationMiddleware,
  conflictResolutionMiddleware,
  performanceMiddleware,
  errorHandlingMiddleware,
  workoutBuilderMiddlewares,
  initializeWorkoutBuilderMiddleware,
  cleanupWorkoutBuilderMiddleware
} from '../middleware/workoutBuilderMiddleware';

// API integration exports
export {
  workoutBuilderApi,
  useCreateWorkoutMutation,
  useUpdateWorkoutMutation,
  useDeleteWorkoutMutationMutation,
  useBulkCreateWorkoutsMutation,
  useGetWorkoutTemplatesQuery,
  useSaveAsTemplateMutation,
  useValidateWorkoutMutation,
  useCheckConflictsMutation,
  useGetPlayerAvailabilityQuery,
  useGetTeamRosterQuery,
  useAssignWorkoutMutation,
  useDuplicateWorkoutMutation,
  useExportWorkoutsMutation,
  useImportWorkoutsMutation,
  useWorkoutBuilderWithAPI,
  syncOfflineQueue,
  createAutoSaveEffect,
  createOptimisticUpdate
} from '../utils/workoutBuilderIntegration';

// Type exports for convenience
export type {
  WorkoutType,
  WorkoutSession,
  Player,
  Team,
  ValidationResult,
  ValidationError
} from '@/features/physical-trainer/types';

// Configuration and setup utilities
export const configureWorkoutBuilder = () => {
  // Initialize middleware
  initializeWorkoutBuilderMiddleware();
  
  // Load persisted state
  const persistedState = loadPersistedState();
  
  // Cleanup old data
  cleanupPersistedState();
  
  return persistedState;
};

// Cleanup function for app unmount
export const cleanupWorkoutBuilder = () => {
  cleanupWorkoutBuilderMiddleware();
};

// Re-export commonly used patterns
export const WorkoutBuilderPatterns = {
  // Pattern for creating a new workout with auto-save
  createWithAutoSave: (type: string, initialData = {}) => ({
    type: 'workoutBuilder/createWorkout',
    payload: { type, data: { ...initialData, autoSave: true } }
  }),
  
  // Pattern for bulk operations
  bulkUpdate: (updates: Array<{ id: string; data: any }>) => 
    updates.map(({ id, data }) => ({
      type: 'workoutBuilder/updateWorkoutData',
      payload: { id, updates: data }
    })),
  
  // Pattern for safe deletion with confirmation
  safeDelete: (workoutId: string, confirmation: boolean = false) => {
    if (!confirmation) {
      throw new Error('Deletion requires explicit confirmation');
    }
    return {
      type: 'workoutBuilder/deleteWorkout',
      payload: workoutId
    };
  },
  
  // Pattern for batch player assignment
  batchAssignPlayers: (workoutIds: string[], players: any[]) =>
    workoutIds.flatMap(workoutId =>
      players.map(player => ({
        type: 'workoutBuilder/addPlayer',
        payload: { workoutId, player }
      }))
    ),
};

// Error boundaries and recovery utilities
export const WorkoutBuilderErrorRecovery = {
  // Recover from corrupted state
  recoverFromError: (errorState: any) => {
    console.error('Workout builder state corrupted, attempting recovery:', errorState);
    
    // Clear corrupted data
    localStorage.removeItem('workoutBuilder_drafts');
    sessionStorage.removeItem('workoutBuilder_ui');
    
    // Return clean state
    return {
      type: 'workoutBuilder/clearAllWorkouts'
    };
  },
  
  // Backup current state
  createBackup: (state: any) => {
    const backup = {
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state))
    };
    
    localStorage.setItem('workoutBuilder_backup', JSON.stringify(backup));
    return backup;
  },
  
  // Restore from backup
  restoreFromBackup: () => {
    try {
      const backup = localStorage.getItem('workoutBuilder_backup');
      if (backup) {
        const parsed = JSON.parse(backup);
        return parsed.state;
      }
    } catch (error) {
      console.error('Failed to restore from backup:', error);
    }
    return null;
  }
};

// Performance monitoring utilities
export const WorkoutBuilderPerformance = {
  // Monitor state size
  getStateSize: (state: any) => {
    const size = new Blob([JSON.stringify(state)]).size;
    return {
      bytes: size,
      kb: Math.round(size / 1024),
      mb: Math.round(size / (1024 * 1024))
    };
  },
  
  // Monitor action frequency
  createActionMonitor: () => {
    const actionCounts: Record<string, number> = {};
    const actionTimes: Record<string, number[]> = {};
    
    return {
      track: (actionType: string) => {
        actionCounts[actionType] = (actionCounts[actionType] || 0) + 1;
        actionTimes[actionType] = actionTimes[actionType] || [];
        actionTimes[actionType].push(Date.now());
      },
      
      getStats: () => ({
        counts: actionCounts,
        rates: Object.entries(actionTimes).reduce((acc, [type, times]) => {
          const recentTimes = times.filter(t => Date.now() - t < 60000); // Last minute
          acc[type] = recentTimes.length;
          return acc;
        }, {} as Record<string, number>)
      })
    };
  }
};

// Development utilities (only available in development)
export const WorkoutBuilderDevTools = process.env.NODE_ENV === 'development' ? {
  // Debug state changes
  debugStateChanges: true,
  
  // Log all actions
  logActions: true,
  
  // Performance warnings
  performanceWarnings: true,
  
  // State inspection helpers
  inspectWorkout: (workoutId: string, state: any) => {
    const workout = state.workoutBuilder.workouts[workoutId];
    console.group(`Workout ${workoutId} Inspection`);
    console.log('Data:', workout?.data);
    console.log('Players:', workout?.players);
    console.log('Teams:', workout?.teams);
    console.log('Validation:', workout?.validationResults);
    console.log('Status:', { isDirty: workout?.isDirty, lastModified: workout?.lastModified });
    console.groupEnd();
    return workout;
  },
  
  // Performance profiler
  profileAction: (actionName: string, fn: () => any) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${actionName} took ${end - start} milliseconds`);
    return result;
  }
} : {};

// Main export - complete workout builder system
export default {
  // Core functionality
  actions: {
    createWorkout,
    updateWorkoutData,
    saveWorkout,
    deleteWorkout,
    addPlayer,
    removePlayer,
    addTeam,
    removeTeam,
    undo,
    redo
  },
  
  // Hooks for components
  hooks: {
    useWorkout,
    useWorkoutBuilder,
    useWorkoutsByType,
    useWorkoutValidation,
    useOfflineWorkoutBuilder,
    useWorkoutBuilderWithAPI
  },
  
  // Configuration
  configure: configureWorkoutBuilder,
  cleanup: cleanupWorkoutBuilder,
  
  // Utilities
  patterns: WorkoutBuilderPatterns,
  errorRecovery: WorkoutBuilderErrorRecovery,
  performance: WorkoutBuilderPerformance,
  devTools: WorkoutBuilderDevTools
};