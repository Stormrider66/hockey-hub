# Redux Persist Configuration

This directory contains the Redux Persist configuration for the Hockey Hub frontend. Redux Persist automatically saves and rehydrates the Redux store to/from localStorage.

## Files

- **persistConfig.ts** - Main configuration file defining what to persist
- **persistGate.tsx** - React component that delays rendering until rehydration is complete
- **persistUtils.ts** - Utility functions for managing persisted state
- **persistMigrations.ts** - Version migration handlers for updating persisted state structure

## What Gets Persisted

The following Redux slices are persisted to localStorage:

### API Slices
- `authApi` - Authentication data (no timeout)
- `userApi` - User profile data
- `dashboardApi` - Dashboard preferences
- `notificationApi` - Notification settings
- `calendarApi` - Calendar data (1 hour timeout)
- `recentWorkoutsApi` - Recent workouts (30 minute timeout)
- `facilityApi` - Facility data (rarely changes)
- `playerApi` - Player data for offline access
- `trainingApi` - Training templates
- `unifiedTrainingApi` - Unified training data
- `workoutBuilderApi` - Workout builder templates

### Regular Reducers
- `auth` - Authentication state
- `workoutBuilder` - Workout builder state with undo/redo history

## What Does NOT Get Persisted

The following are explicitly blacklisted:
- `socket` - WebSocket connections
- `chat` - Active chat connections
- `trainingSessionViewer` - Temporary session viewing state
- Loading states and validation errors

## Usage

### In Components

```typescript
import { usePersistence } from '@/hooks/usePersistence';

function MyComponent() {
  const { 
    storageInfo, 
    quotaInfo, 
    clearAll, 
    exportState 
  } = usePersistence();

  // Check storage usage
  console.log(`Using ${storageInfo.sizeInKB} KB of storage`);
  
  // Clear all persisted state
  const handleClearCache = async () => {
    await clearAll();
    window.location.reload();
  };
}
```

### Debug Panel

In development, press `Ctrl+Shift+P` to open the persistence debug panel.

### Manual Management

```typescript
import { clearPersistedState, exportPersistedState } from '@/store/persistUtils';

// Clear all persisted state
await clearPersistedState();

// Export current state
const stateJson = exportPersistedState();
```

## Storage Limits

- localStorage typically has a 5-10MB limit
- The app monitors storage usage and warns when approaching limits
- Old cache entries should be cleared periodically

## Migrations

When updating the persisted state structure:

1. Increment the version in `persistConfig.ts`
2. Add a migration function in `persistMigrations.ts`
3. The migration will run automatically on app load

## Troubleshooting

If you encounter issues:

1. **Clear persisted state**: Use the debug panel or call `clearPersistedState()`
2. **Check storage quota**: Use `checkStorageQuota()` to see available space
3. **Export state for debugging**: Use the debug panel's export feature
4. **Check browser console**: Redux Persist logs debug info in development mode

## Performance Considerations

- Persistence is throttled to write at most once per second
- Large API caches can slow down initial load
- Consider clearing old cache entries periodically
- Monitor storage size with the debug panel