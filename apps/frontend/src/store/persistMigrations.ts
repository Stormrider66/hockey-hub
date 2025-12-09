import { PersistedState } from 'redux-persist';
import { RootState } from './store';

/**
 * Redux Persist Migration Configuration
 * 
 * Migrations are run when the persisted state version is less than the current version.
 * Each migration function receives the state and should return the migrated state.
 */

// Current version is defined in persistConfig.ts as version: 1

/**
 * Migration from version 0 (or undefined) to version 1
 * This migration removes RTK Query API slices from persistence
 * as they should not be persisted and cause issues
 */
const migration0to1 = (state: PersistedState): PersistedState => {
  console.log('Running migration from version 0 to 1');
  
  if (!state) return state;
  
  const migratedState = { ...state };
  
  // Remove all RTK Query API slices from persisted state
  const apiSlicesToRemove = [
    'playerApi', 'authApi', 'medicalApi', 'trainingApi', 'unifiedTrainingApi',
    'statisticsApi', 'calendarApi', 'notificationApi', 'chatApi', 'dashboardApi',
    'privacyApi', 'scheduledMessageApi', 'fileApi', 'communicationApi',
    'parentCommunicationApi', 'paymentApi', 'userApi', 'scheduleClarificationApi',
    'urgentMedicalApi', 'medicalDiscussionApi', 'appointmentReminderApi',
    'systemAnnouncementApi', 'moderationApi', 'eventConversationApi',
    'performanceApi', 'coachApi', 'facilityApi', 'workoutBuilderApi',
    'recentWorkoutsApi', 'predictiveAnalyticsApi', 'adminApi', 'medicalAnalyticsApi'
  ];
  
  apiSlicesToRemove.forEach(apiSlice => {
    if (migratedState[apiSlice]) {
      console.log(`Removing ${apiSlice} from persisted state`);
      delete migratedState[apiSlice];
    }
  });
  
  // Also clean up any _persist keys in API slices that might have been nested
  Object.keys(migratedState).forEach(key => {
    if (key.endsWith('Api') && migratedState[key]) {
      delete migratedState[key];
    }
  });
  
  return migratedState;
};

/**
 * Example migration from version 1 to version 2
 * Uncomment and modify when needed
 */
// const migration1to2 = (state: PersistedState): PersistedState => {
//   console.log('Running migration from version 1 to 2');
//   const migratedState = { ...state };
//   
//   // Add migration logic here
//   
//   return migratedState;
// };

/**
 * Create migrations object for redux-persist
 * The key is the version number to migrate TO
 */
export const migrations = {
  1: migration0to1,
  // 2: migration1to2, // Uncomment when needed
};

/**
 * Helper function to clean up obsolete data from persisted state
 */
export const cleanupObsoleteData = (state: any): any => {
  try {
    // Deep clone the state to avoid mutations, handling circular references
    const seen = new WeakSet();
    const cleaned = JSON.parse(JSON.stringify(state, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return undefined; // Remove circular references
        }
        seen.add(value);
      }
      
      // Remove any obvious problematic data
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      
      // Remove functions from state
      if (typeof value === 'function') {
        return undefined;
      }
      
      return value;
    }));
    
    // Remove any keys that are no longer used
    const obsoleteKeys = [
      // Add obsolete reducer keys here as the app evolves
      // 'oldReducerName',
    ];
    
    obsoleteKeys.forEach(key => {
      delete cleaned[key];
    });
    
    // Remove any RTK Query API slices that shouldn't be persisted
    Object.keys(cleaned).forEach(key => {
      if (key.endsWith('Api') && key !== 'api') {
        delete cleaned[key];
      }
    });
    
    // Ensure required structure exists
    if (!cleaned.auth) cleaned.auth = {};
    if (!cleaned.workoutBuilder) cleaned.workoutBuilder = {};
    
    return cleaned;
  } catch (error) {
    console.error('Error cleaning up state:', error);
    // Return minimal valid state on error
    return {
      auth: {},
      workoutBuilder: {},
      _persist: state._persist || { version: 2, rehydrated: true }
    };
  }
};

/**
 * Helper to validate persisted state structure
 */
export const validatePersistedState = (state: any): boolean => {
  try {
    // Check if state is an object
    if (typeof state !== 'object' || state === null) {
      return false;
    }
    
    // Check for _persist key
    if (!state._persist || typeof state._persist.version !== 'number') {
      return false;
    }
    
    // Check for required slices - be more lenient
    // Only fail if critical slices are missing or corrupted
    const hasAuth = state.auth && typeof state.auth === 'object';
    const hasWorkoutBuilder = state.workoutBuilder && typeof state.workoutBuilder === 'object';
    
    if (!hasAuth && !hasWorkoutBuilder) {
      console.warn('Missing all required state slices, state may be corrupted');
      return false;
    }
    
    // Try to stringify to check for circular references
    // Use a replacer to handle circular references gracefully
    try {
      const seen = new WeakSet();
      JSON.stringify(state, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch (e) {
      console.error('State serialization failed:', e);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('State validation failed:', error);
    return false;
  }
};

/**
 * Create a transform to handle migration errors gracefully
 */
export const createMigrationErrorHandler = () => {
  return {
    in: (state: any) => state,
    out: (state: any) => {
      try {
        // If state is null or undefined, return a clean initial state
        if (!state) {
          return {};
        }
        
        // Validate state before saving
        if (!validatePersistedState(state)) {
          console.warn('Invalid state detected, returning clean state');
          // Return a minimal valid state structure with correct version
          return {
            auth: {},
            workoutBuilder: {},
            _persist: {
              version: 2, // Use the current version from persistConfig
              rehydrated: true
            }
          };
        }
        
        // Clean up obsolete data
        return cleanupObsoleteData(state);
      } catch (error) {
        console.error('Error in persistence transform:', error);
        // Return a minimal valid state on error
        return {
          auth: {},
          workoutBuilder: {},
          _persist: {
            version: 2, // Use the current version from persistConfig
            rehydrated: true
          }
        };
      }
    },
  };
};