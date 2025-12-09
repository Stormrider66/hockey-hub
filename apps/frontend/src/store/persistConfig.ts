import { PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { RootState } from './store';
import { migrations, createMigrationErrorHandler } from './persistMigrations';

// RTK Query APIs should NOT be persisted as they manage their own cache
// and contain internal state that causes serialization issues
// Instead, RTK Query has its own persistence mechanism via extractRehydrationInfo

// Non-API reducers that should be persisted
const persistedReducers = [
  'auth', // Auth state
  'workoutBuilder', // Workout builder state with undo/redo history
];

// Only persist regular reducers, not RTK Query APIs
export const whitelist = persistedReducers;

// Blacklist certain sub-states within whitelisted reducers
// These are typically transient states that shouldn't be persisted
export const blacklistedPaths = [
  // Don't persist active socket connections
  'socket',
  'chat.activeConnections',
  
  // Don't persist loading states
  'trainingSessionViewer.isLoading',
  
  // Don't persist temporary UI states
  'workoutBuilder.validationErrors',
  'workoutBuilder.isSaving',
  'workoutBuilder.isLoading',
  'workoutBuilder.error',
  
  // Don't persist auth loading/error states
  'auth.isLoading',
  'auth.error',
];

// Transform to handle non-serializable data and migration errors
const transforms: any[] = [
  createMigrationErrorHandler(),
];

// Main persist configuration
export const persistConfig: PersistConfig<RootState> = {
  key: 'hockey-hub-root',
  version: 2, // Bump version to force migration
  storage,
  whitelist,
  blacklist: ['socket', 'chat', 'trainingSessionViewer'], // These should never be persisted
  transforms,
  migrate: (state: any, version: number) => {
    // Run migration from any version less than 2
    if (version < 2) {
      console.log('Running migration to version 2');
      // Use migration 1 which removes API slices
      return Promise.resolve(migrations[1](state));
    }
    return Promise.resolve(state);
  },
  // Throttle writes to storage (ms)
  throttle: 1000,
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
};

// Note: RTK Query APIs handle their own caching and persistence
// They should not be persisted through redux-persist as it causes issues
// with internal state management and the "_persist" key

// Utility to check if a reducer should be persisted
export const shouldPersistReducer = (reducerPath: string): boolean => {
  // Only persist regular reducers, not RTK Query APIs
  return whitelist.includes(reducerPath) && !reducerPath.endsWith('Api');
};