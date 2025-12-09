import { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
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
  persistState,
  loadPersistedState,
  cleanupPersistedState
} from '../slices/workoutBuilderSlice';
import { 
  WorkoutType,
  WorkoutSession,
  Player,
  Team,
  ValidationResult
} from '@/features/physical-trainer/types';
import { RootState, AppDispatch } from '../store';

// Hook for managing a specific workout
export const useWorkout = (workoutId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const workout = useSelector((state: RootState) => selectWorkoutById(workoutId)(state));
  const assignedPlayers = useSelector((state: RootState) => selectAssignedPlayers(workoutId)(state));
  const assignedTeams = useSelector((state: RootState) => selectAssignedTeams(workoutId)(state));
  const validationErrors = useSelector((state: RootState) => selectValidationErrors(workoutId)(state));
  const completeness = useSelector((state: RootState) => selectWorkoutCompleteness(workoutId)(state));
  const totalAssignedPlayers = useSelector((state: RootState) => selectTotalAssignedPlayers(workoutId)(state));

  const updateData = useCallback((updates: Partial<WorkoutSession>) => {
    dispatch(updateWorkoutData({ id: workoutId, updates }));
  }, [dispatch, workoutId]);

  const save = useCallback(() => {
    dispatch(saveWorkout(workoutId));
  }, [dispatch, workoutId]);

  const remove = useCallback(() => {
    dispatch(deleteWorkout(workoutId));
  }, [dispatch, workoutId]);

  const addPlayerToWorkout = useCallback((player: Player) => {
    dispatch(addPlayer({ workoutId, player }));
  }, [dispatch, workoutId]);

  const removePlayerFromWorkout = useCallback((playerId: string) => {
    dispatch(removePlayer({ workoutId, playerId }));
  }, [dispatch, workoutId]);

  const addTeamToWorkout = useCallback((team: Team) => {
    dispatch(addTeam({ workoutId, team }));
  }, [dispatch, workoutId]);

  const removeTeamFromWorkout = useCallback((teamId: string) => {
    dispatch(removeTeam({ workoutId, teamId }));
  }, [dispatch, workoutId]);

  const setValidation = useCallback((results: ValidationResult) => {
    dispatch(setValidationResults({ workoutId, results }));
  }, [dispatch, workoutId]);

  const markForSave = useCallback(() => {
    dispatch(markForAutoSave(workoutId));
  }, [dispatch, workoutId]);

  return {
    workout,
    assignedPlayers,
    assignedTeams,
    validationErrors,
    completeness,
    totalAssignedPlayers,
    isValid: validationErrors.length === 0,
    isDirty: workout?.isDirty || false,
    actions: {
      updateData,
      save,
      remove,
      addPlayer: addPlayerToWorkout,
      removePlayer: removePlayerFromWorkout,
      addTeam: addTeamToWorkout,
      removeTeam: removeTeamFromWorkout,
      setValidation,
      markForSave
    }
  };
};

// Hook for managing workout builder global state
export const useWorkoutBuilder = () => {
  const dispatch = useDispatch<AppDispatch>();
  const activeWorkouts = useSelector(selectActiveWorkouts);
  const unsavedChanges = useSelector(selectUnsavedChanges);
  const canUndo = useSelector(selectCanUndo);
  const canRedo = useSelector(selectCanRedo);
  const uiState = useSelector(selectUIState);
  const isAutoSaveEnabled = useSelector(selectIsAutoSaveEnabled);
  const pendingSaves = useSelector(selectPendingSaves);
  const offlineQueue = useSelector(selectOfflineQueue);

  const createNewWorkout = useCallback((type: WorkoutType, data?: Partial<WorkoutSession>) => {
    dispatch(createWorkout({ type, data }));
  }, [dispatch]);

  const undoLastAction = useCallback(() => {
    dispatch(undo());
  }, [dispatch]);

  const redoLastAction = useCallback(() => {
    dispatch(redo());
  }, [dispatch]);

  const updateUI = useCallback((updates: Partial<typeof uiState>) => {
    dispatch(updateUIState(updates));
  }, [dispatch]);

  const toggleAutoSaveMode = useCallback(() => {
    dispatch(toggleAutoSave());
  }, [dispatch]);

  const addToQueue = useCallback((workoutId: string, action: 'create' | 'update' | 'delete', data: any) => {
    dispatch(addToOfflineQueue({ workoutId, action, data }));
  }, [dispatch]);

  const removeFromQueue = useCallback((workoutId: string) => {
    dispatch(removeFromOfflineQueue(workoutId));
  }, [dispatch]);

  const clearQueue = useCallback(() => {
    dispatch(clearOfflineQueue());
  }, [dispatch]);

  const importFromFile = useCallback((workouts: any[]) => {
    dispatch(importWorkouts(workouts));
  }, [dispatch]);

  const clearAll = useCallback(() => {
    dispatch(clearAllWorkouts());
  }, [dispatch]);

  // Auto-save effect
  useEffect(() => {
    if (!isAutoSaveEnabled || pendingSaves.length === 0) return;

    const timer = setTimeout(() => {
      pendingSaves.forEach(workoutId => {
        dispatch(saveWorkout(workoutId));
      });
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [pendingSaves, isAutoSaveEnabled, dispatch]);

  // State persistence effect
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = {
        workouts: activeWorkouts.reduce((acc, workout) => {
          acc[workout.id] = workout;
          return acc;
        }, {} as any),
        ui: uiState,
        offlineQueue,
        pendingSaves,
        isAutoSaveEnabled,
        lastAutoSave: Date.now(),
        history: { past: [], future: [], currentIndex: -1 }
      };
      persistState(state);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeWorkouts, uiState, offlineQueue, pendingSaves, isAutoSaveEnabled]);

  // Cleanup old persisted data on mount
  useEffect(() => {
    cleanupPersistedState();
  }, []);

  return {
    activeWorkouts,
    unsavedChanges,
    canUndo,
    canRedo,
    uiState,
    isAutoSaveEnabled,
    pendingSaves,
    offlineQueue,
    hasUnsavedChanges: unsavedChanges.length > 0,
    hasOfflineChanges: offlineQueue.length > 0,
    actions: {
      createWorkout: createNewWorkout,
      undo: undoLastAction,
      redo: redoLastAction,
      updateUI,
      toggleAutoSave: toggleAutoSaveMode,
      addToOfflineQueue: addToQueue,
      removeFromOfflineQueue: removeFromQueue,
      clearOfflineQueue: clearQueue,
      importWorkouts: importFromFile,
      clearAllWorkouts: clearAll
    }
  };
};

// Hook for specific workout types
export const useWorkoutsByType = (type: WorkoutType) => {
  const workouts = useSelector((state: RootState) => selectWorkoutsByType(type)(state));
  
  return {
    workouts,
    count: workouts.length,
    activeCount: workouts.filter(w => w.isDirty).length,
    completedCount: workouts.filter(w => !w.isDirty).length
  };
};

// Hook for workout validation
export const useWorkoutValidation = (workoutId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const validationErrors = useSelector((state: RootState) => selectValidationErrors(workoutId)(state));
  const workout = useSelector((state: RootState) => selectWorkoutById(workoutId)(state));

  const validate = useCallback(async () => {
    if (!workout) return;

    // This would integrate with your validation system
    const errors = [];
    
    // Basic validation
    if (!workout.data.name?.trim()) {
      errors.push({ field: 'name', message: 'Workout name is required' });
    }
    
    if (!workout.data.date) {
      errors.push({ field: 'date', message: 'Workout date is required' });
    }

    // Medical compliance validation would go here
    // Integration with useMedicalCompliance hook

    const results: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };

    dispatch(setValidationResults({ workoutId, results }));
    return results;
  }, [workout, workoutId, dispatch]);

  return {
    validationErrors,
    isValid: validationErrors.length === 0,
    validate
  };
};

// Hook for offline state management
export const useOfflineWorkoutBuilder = () => {
  const dispatch = useDispatch<AppDispatch>();
  const offlineQueue = useSelector(selectOfflineQueue);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineChanges = useCallback(async () => {
    if (!isOnline || offlineQueue.length === 0) return;

    // Process offline queue
    for (const item of offlineQueue) {
      try {
        // This would integrate with your API
        switch (item.action) {
          case 'create':
            // await createWorkoutAPI(item.data);
            break;
          case 'update':
            // await updateWorkoutAPI(item.workoutId, item.data);
            break;
          case 'delete':
            // await deleteWorkoutAPI(item.workoutId);
            break;
        }
        dispatch(removeFromOfflineQueue(item.workoutId));
      } catch (error) {
        console.error('Failed to sync offline change:', error);
        // Handle sync failure - maybe retry later
      }
    }
  }, [isOnline, offlineQueue, dispatch]);

  useEffect(() => {
    if (isOnline) {
      syncOfflineChanges();
    }
  }, [isOnline, syncOfflineChanges]);

  return {
    isOnline,
    offlineQueue,
    pendingChanges: offlineQueue.length,
    syncOfflineChanges
  };
};

