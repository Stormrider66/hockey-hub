import { Middleware, MiddlewareAPI } from '@reduxjs/toolkit';
import { 
  updateWorkoutData, 
  markForAutoSave, 
  saveWorkout,
  addToOfflineQueue,
  persistState
} from '../slices/workoutBuilderSlice';
import { RootState, AppDispatch } from '../store';

// Debounce utility
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout!);
      func(...args);
    };
    clearTimeout(timeout!);
    timeout = setTimeout(later, wait);
  };
};

// Auto-save middleware
export const autoSaveMiddleware: Middleware<{}, RootState> = 
  (store: MiddlewareAPI<AppDispatch, RootState>) => 
  (next) => 
  (action) => {
    const result = next(action);
    
    // Auto-save on workout data updates
    if (updateWorkoutData.match(action)) {
      const state = store.getState();
      const { workoutBuilder } = state;
      
      if (workoutBuilder.isAutoSaveEnabled) {
        store.dispatch(markForAutoSave(action.payload.id));
        
        // Debounced auto-save after 3 seconds of inactivity
        debouncedAutoSave(store, action.payload.id);
      }
    }
    
    return result;
  };

// Debounced auto-save function
const debouncedAutoSave = debounce((store: MiddlewareAPI<AppDispatch, RootState>, workoutId: string) => {
  const state = store.getState();
  const workout = state.workoutBuilder.workouts[workoutId];
  
  if (workout?.isDirty) {
    // Check if online
    if (navigator.onLine) {
      store.dispatch(saveWorkout(workoutId));
    } else {
      // Add to offline queue
      store.dispatch(addToOfflineQueue({
        workoutId,
        action: 'update',
        data: workout.data
      }));
    }
  }
}, 3000);

// Offline queue middleware
export const offlineQueueMiddleware: Middleware<{}, RootState> = 
  (store: MiddlewareAPI<AppDispatch, RootState>) => 
  (next) => 
  (action) => {
    const result = next(action);
    
    // Handle network state changes
    if (action.type === 'NETWORK_STATUS_CHANGED') {
      const { isOnline } = action.payload;
      
      if (isOnline) {
        // Process offline queue when coming back online
        const state = store.getState();
        const { offlineQueue } = state.workoutBuilder;
        
        // This would integrate with your API layer
        offlineQueue.forEach(async (item) => {
          try {
            // Process queued operations
            console.log('Processing offline queue item:', item);
            // await processOfflineItem(item);
            // store.dispatch(removeFromOfflineQueue(item.workoutId));
          } catch (error) {
            console.error('Failed to process offline item:', error);
          }
        });
      }
    }
    
    return result;
  };

// State persistence middleware
export const persistenceMiddleware: Middleware<{}, RootState> = 
  (store: MiddlewareAPI<AppDispatch, RootState>) => 
  (next) => 
  (action) => {
    const result = next(action);
    
    // Persist state on certain actions
    const persistActions = [
      updateWorkoutData.type,
      'workoutBuilder/addPlayer',
      'workoutBuilder/removePlayer',
      'workoutBuilder/addTeam',
      'workoutBuilder/removeTeam',
      'workoutBuilder/updateUIState'
    ];
    
    if (persistActions.includes(action.type)) {
      // Debounced persistence to avoid too frequent writes
      debouncedPersist(store.getState().workoutBuilder);
    }
    
    return result;
  };

// Debounced persistence function
const debouncedPersist = debounce((state: any) => {
  persistState(state);
}, 1000);

// Validation middleware
export const validationMiddleware: Middleware<{}, RootState> = 
  (store: MiddlewareAPI<AppDispatch, RootState>) => 
  (next) => 
  (action) => {
    const result = next(action);
    
    // Trigger validation on workout updates
    if (updateWorkoutData.match(action)) {
      const state = store.getState();
      const workout = state.workoutBuilder.workouts[action.payload.id];
      
      if (workout) {
        // Debounced validation to avoid excessive re-validation
        debouncedValidation(store, action.payload.id, workout);
      }
    }
    
    return result;
  };

// Debounced validation function
const debouncedValidation = debounce((
  store: MiddlewareAPI<AppDispatch, RootState>, 
  workoutId: string, 
  workout: any
) => {
  // This would integrate with your validation system
  const errors = [];
  
  // Basic validation
  if (!workout.data.name?.trim()) {
    errors.push({ field: 'name', message: 'Workout name is required' });
  }
  
  if (!workout.data.date) {
    errors.push({ field: 'date', message: 'Workout date is required' });
  }
  
  // Type-specific validation would go here
  
  const validationResult = {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
  
  store.dispatch({
    type: 'workoutBuilder/setValidationResults',
    payload: { workoutId, results: validationResult }
  });
}, 500);

// Conflict resolution middleware
export const conflictResolutionMiddleware: Middleware<{}, RootState> = 
  (store: MiddlewareAPI<AppDispatch, RootState>) => 
  (next) => 
  (action) => {
    const result = next(action);
    
    // Handle potential conflicts when saving workouts
    if (saveWorkout.match(action)) {
      const state = store.getState();
      const workout = state.workoutBuilder.workouts[action.payload];
      
      if (workout) {
        // Check for scheduling conflicts
        const conflictingWorkouts = Object.values(state.workoutBuilder.workouts)
          .filter(w => 
            w.id !== workout.id &&
            w.data.date === workout.data.date &&
            w.data.startTime === workout.data.startTime &&
            // Check if they share players or teams
            (w.players.some(p => workout.players.some(wp => wp.id === p.id)) ||
             w.teams.some(t => workout.teams.some(wt => wt.id === t.id)))
          );
        
        if (conflictingWorkouts.length > 0) {
          console.warn('Scheduling conflict detected:', conflictingWorkouts);
          // You could dispatch an action to show a conflict resolution modal
        }
      }
    }
    
    return result;
  };

// Performance monitoring middleware
export const performanceMiddleware: Middleware<{}, RootState> = 
  (store: MiddlewareAPI<AppDispatch, RootState>) => 
  (next) => 
  (action) => {
    const start = performance.now();
    const result = next(action);
    const end = performance.now();
    
    // Log slow actions (> 10ms)
    if (end - start > 10) {
      console.warn(`Slow action detected: ${action.type} took ${end - start}ms`);
    }
    
    // Track state size
    const state = store.getState();
    const workoutBuilderSize = JSON.stringify(state.workoutBuilder).length;
    
    if (workoutBuilderSize > 1024 * 1024) { // 1MB
      console.warn(`Large workout builder state: ${workoutBuilderSize} bytes`);
    }
    
    return result;
  };

// Error handling middleware
export const errorHandlingMiddleware: Middleware<{}, RootState> = 
  (store: MiddlewareAPI<AppDispatch, RootState>) => 
  (next) => 
  (action) => {
    try {
      return next(action);
    } catch (error) {
      console.error('Error in workout builder action:', action.type, error);
      
      // Dispatch error action or show notification
      // store.dispatch(showErrorNotification({ 
      //   message: 'An error occurred while processing workout data',
      //   error 
      // }));
      
      // Return the error so it doesn't break the middleware chain
      throw error;
    }
  };

// Network status tracker
export const createNetworkStatusMiddleware = () => {
  let isOnline = navigator.onLine;
  
  const handleOnline = () => {
    if (!isOnline) {
      isOnline = true;
      // Dispatch network status change
      store.dispatch({ type: 'NETWORK_STATUS_CHANGED', payload: { isOnline: true } });
    }
  };
  
  const handleOffline = () => {
    if (isOnline) {
      isOnline = false;
      // Dispatch network status change
      store.dispatch({ type: 'NETWORK_STATUS_CHANGED', payload: { isOnline: false } });
    }
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return { cleanup: () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }};
};

// Combined middleware array for easy integration
export const workoutBuilderMiddlewares = [
  autoSaveMiddleware,
  offlineQueueMiddleware,
  persistenceMiddleware,
  validationMiddleware,
  conflictResolutionMiddleware,
  performanceMiddleware,
  errorHandlingMiddleware
];

// Initialize network status tracking
let networkStatusTracker: { cleanup: () => void } | null = null;

export const initializeWorkoutBuilderMiddleware = () => {
  networkStatusTracker = createNetworkStatusMiddleware();
};

export const cleanupWorkoutBuilderMiddleware = () => {
  networkStatusTracker?.cleanup();
};