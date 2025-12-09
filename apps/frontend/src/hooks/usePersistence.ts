import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  clearPersistedState, 
  clearSpecificPersistedState, 
  getPersistedStateSize, 
  checkStorageQuota,
  exportPersistedState,
  importPersistedState,
  monitorStorageChanges
} from '@/store/persistUtils';

interface StorageInfo {
  size: number;
  sizeInKB: number;
  sizeInMB: number;
}

interface QuotaInfo {
  used: number;
  quota: number;
  percentUsed: number;
  isNearQuota: boolean;
}

export const usePersistence = () => {
  const dispatch = useDispatch();
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({ size: 0, sizeInKB: 0, sizeInMB: 0 });
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo>({
    used: 0,
    quota: 0,
    percentUsed: 0,
    isNearQuota: false,
  });
  const [isClearing, setIsClearing] = useState(false);

  // Update storage info
  const updateStorageInfo = useCallback(async () => {
    const info = getPersistedStateSize();
    setStorageInfo(info);
    
    const quota = await checkStorageQuota();
    setQuotaInfo(quota);
  }, []);

  // Clear all persisted state
  const clearAll = useCallback(async () => {
    setIsClearing(true);
    try {
      await clearPersistedState();
      await updateStorageInfo();
      // Optionally reload the page to ensure clean state
      // window.location.reload();
    } finally {
      setIsClearing(false);
    }
  }, [updateStorageInfo]);

  // Clear specific reducer state
  const clearReducer = useCallback(async (reducerKey: string) => {
    setIsClearing(true);
    try {
      await clearSpecificPersistedState(reducerKey);
      await updateStorageInfo();
    } finally {
      setIsClearing(false);
    }
  }, [updateStorageInfo]);

  // Export state for debugging
  const exportState = useCallback(() => {
    const state = exportPersistedState();
    if (state) {
      const blob = new Blob([state], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hockey-hub-state-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  // Import state (use with caution)
  const importState = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      await importPersistedState(text);
    } catch (error) {
      console.error('Failed to import state:', error);
      throw error;
    }
  }, []);

  // Monitor storage changes from other tabs
  useEffect(() => {
    const cleanup = monitorStorageChanges((key, newValue) => {
      console.log('Storage changed in another tab:', key);
      // Optionally dispatch an action to sync state
      // dispatch({ type: 'persist/REHYDRATE' });
    });

    return cleanup;
  }, [dispatch]);

  // Update storage info on mount and periodically
  useEffect(() => {
    updateStorageInfo();
    
    const interval = setInterval(updateStorageInfo, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [updateStorageInfo]);

  return {
    storageInfo,
    quotaInfo,
    isClearing,
    clearAll,
    clearReducer,
    exportState,
    importState,
    updateStorageInfo,
  };
};

// Hook for monitoring specific API cache
export const useApiCacheMonitor = (apiName: string) => {
  const [cacheSize, setCacheSize] = useState(0);
  const [cacheEntries, setCacheEntries] = useState(0);

  useEffect(() => {
    const checkCache = () => {
      try {
        const persistedStateKey = `persist:hockey-hub-root`;
        const persistedState = localStorage.getItem(persistedStateKey);
        
        if (persistedState) {
          const parsed = JSON.parse(persistedState);
          const apiState = parsed[apiName];
          
          if (apiState) {
            const size = new Blob([apiState]).size;
            setCacheSize(size);
            
            // Try to count cache entries
            try {
              const apiData = JSON.parse(apiState);
              const queries = apiData.queries || {};
              setCacheEntries(Object.keys(queries).length);
            } catch {
              setCacheEntries(0);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check API cache:', error);
      }
    };

    checkCache();
    const interval = setInterval(checkCache, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [apiName]);

  return {
    cacheSize,
    cacheSizeKB: cacheSize / 1024,
    cacheEntries,
  };
};