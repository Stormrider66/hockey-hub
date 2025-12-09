import { persistor } from './store';

/**
 * Utility functions for managing redux-persist state
 */

/**
 * Clear all persisted state
 */
export const clearPersistedState = async (): Promise<void> => {
  try {
    await persistor.purge();
    console.log('Successfully cleared all persisted state');
  } catch (error) {
    console.error('Failed to clear persisted state:', error);
    throw error;
  }
};

/**
 * Clear specific reducer's persisted state
 * @param reducerKey The key of the reducer to clear
 */
export const clearSpecificPersistedState = async (reducerKey: string): Promise<void> => {
  try {
    // This requires accessing localStorage directly
    const persistedStateKey = `persist:hockey-hub-root`;
    const persistedState = localStorage.getItem(persistedStateKey);
    
    if (persistedState) {
      const parsedState = JSON.parse(persistedState);
      delete parsedState[reducerKey];
      localStorage.setItem(persistedStateKey, JSON.stringify(parsedState));
      
      // Force persistor to reload
      await persistor.flush();
      console.log(`Successfully cleared persisted state for: ${reducerKey}`);
    }
  } catch (error) {
    console.error(`Failed to clear persisted state for ${reducerKey}:`, error);
    throw error;
  }
};

/**
 * Get the size of persisted state in localStorage
 */
export const getPersistedStateSize = (): { size: number; sizeInKB: number; sizeInMB: number } => {
  try {
    const persistedStateKey = `persist:hockey-hub-root`;
    const persistedState = localStorage.getItem(persistedStateKey);
    
    if (persistedState) {
      const size = new Blob([persistedState]).size;
      return {
        size,
        sizeInKB: size / 1024,
        sizeInMB: size / (1024 * 1024),
      };
    }
    
    return { size: 0, sizeInKB: 0, sizeInMB: 0 };
  } catch (error) {
    console.error('Failed to get persisted state size:', error);
    return { size: 0, sizeInKB: 0, sizeInMB: 0 };
  }
};

/**
 * Check if we're approaching localStorage quota
 */
export const checkStorageQuota = async (): Promise<{
  used: number;
  quota: number;
  percentUsed: number;
  isNearQuota: boolean;
}> => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
      
      return {
        used: usage,
        quota,
        percentUsed,
        isNearQuota: percentUsed > 80, // Consider >80% as near quota
      };
    }
    
    // Fallback for browsers that don't support storage.estimate
    const stateSize = getPersistedStateSize();
    const estimatedQuota = 10 * 1024 * 1024; // 10MB fallback estimate
    const percentUsed = (stateSize.size / estimatedQuota) * 100;
    
    return {
      used: stateSize.size,
      quota: estimatedQuota,
      percentUsed,
      isNearQuota: percentUsed > 80,
    };
  } catch (error) {
    console.error('Failed to check storage quota:', error);
    return {
      used: 0,
      quota: 0,
      percentUsed: 0,
      isNearQuota: false,
    };
  }
};

/**
 * Export persisted state as JSON for debugging
 */
export const exportPersistedState = (): string | null => {
  try {
    const persistedStateKey = `persist:hockey-hub-root`;
    const persistedState = localStorage.getItem(persistedStateKey);
    
    if (persistedState) {
      const parsed = JSON.parse(persistedState);
      return JSON.stringify(parsed, null, 2);
    }
    
    return null;
  } catch (error) {
    console.error('Failed to export persisted state:', error);
    return null;
  }
};

/**
 * Import persisted state from JSON (use with caution)
 */
export const importPersistedState = async (jsonState: string): Promise<void> => {
  try {
    const persistedStateKey = `persist:hockey-hub-root`;
    const parsedState = JSON.parse(jsonState);
    
    // Validate that it looks like valid persisted state
    if (typeof parsedState !== 'object' || !parsedState._persist) {
      throw new Error('Invalid persisted state format');
    }
    
    localStorage.setItem(persistedStateKey, JSON.stringify(parsedState));
    
    // Force reload to apply imported state
    window.location.reload();
  } catch (error) {
    console.error('Failed to import persisted state:', error);
    throw error;
  }
};

/**
 * Monitor storage events for changes in other tabs
 */
export const monitorStorageChanges = (callback: (key: string, newValue: string | null) => void): (() => void) => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'persist:hockey-hub-root') {
      callback(event.key, event.newValue);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};