import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { serviceWorker } from '@/utils/serviceWorker';

interface OfflineQueueItem {
  id: string;
  timestamp: number;
  type: 'workout' | 'session' | 'update';
  action: 'create' | 'update' | 'delete';
  data: any;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

interface UseOfflineModeReturn {
  isOnline: boolean;
  queueSize: number;
  queue: OfflineQueueItem[];
  addToQueue: (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  retryItem: (id: string) => void;
  syncQueue: () => Promise<void>;
  getQueuedItem: (type: string, dataId: string) => OfflineQueueItem | undefined;
}

const STORAGE_KEY = 'physicalTrainer_offlineQueue';
const SYNC_INTERVAL = 30000; // 30 seconds

export function useOfflineMode(): UseOfflineModeReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const { toast } = useToast();

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem(STORAGE_KEY);
    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue);
        setQueue(parsedQueue.filter((item: OfflineQueueItem) => item.status !== 'completed'));
      } catch (error) {
        console.error('Failed to parse offline queue:', error);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back Online',
        description: 'Your connection has been restored. Syncing queued changes...',
      });
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Offline Mode',
        description: 'You are working offline. Changes will be synced when connection is restored.',
        variant: 'warning',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check
    const interval = setInterval(() => {
      const wasOnline = isOnline;
      const nowOnline = navigator.onLine;
      
      if (wasOnline !== nowOnline) {
        setIsOnline(nowOnline);
        if (nowOnline) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  // Auto-sync when online
  useEffect(() => {
    if (!isOnline || queue.length === 0) return;

    const syncInterval = setInterval(() => {
      if (queue.some(item => item.status === 'pending')) {
        // Try service worker background sync first
        if (serviceWorker.isSupported()) {
          serviceWorker.scheduleSync().catch(() => {
            // Fallback to manual sync
            syncQueue();
          });
        } else {
          syncQueue();
        }
      }
    }, SYNC_INTERVAL);

    // Initial sync
    if (serviceWorker.isSupported()) {
      serviceWorker.scheduleSync().catch(() => {
        syncQueue();
      });
    } else {
      syncQueue();
    }

    return () => clearInterval(syncInterval);
  }, [isOnline, queue.length]);

  // Register service worker on mount
  useEffect(() => {
    if (serviceWorker.isSupported()) {
      serviceWorker.register().then(registered => {
        if (registered) {
          console.log('Offline sync service worker registered');
        }
      });
    }

    // Listen for service worker sync events
    const handleSyncStatus = (event: CustomEvent) => {
      const { status, data } = event.detail;
      
      switch (status) {
        case 'completed':
          toast({
            title: 'Sync Complete',
            description: 'All offline changes have been synced successfully.',
          });
          // Refresh queue to remove completed items
          const savedQueue = localStorage.getItem(STORAGE_KEY);
          if (savedQueue) {
            try {
              const parsedQueue = JSON.parse(savedQueue);
              setQueue(parsedQueue.filter((item: OfflineQueueItem) => item.status !== 'completed'));
            } catch (error) {
              console.error('Failed to refresh queue after sync:', error);
            }
          }
          break;
        case 'failed':
          toast({
            title: 'Sync Failed',
            description: 'Some changes could not be synced. Please check your connection and try again.',
            variant: 'destructive',
          });
          break;
        case 'progress':
          // Optional: show progress updates
          break;
      }
    };

    window.addEventListener('sw-sync-status', handleSyncStatus as EventListener);
    return () => {
      window.removeEventListener('sw-sync-status', handleSyncStatus as EventListener);
    };
  }, [toast]);

  const addToQueue = useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>) => {
    const newItem: OfflineQueueItem = {
      ...item,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
      maxRetries: item.maxRetries || 3,
    };

    setQueue(prev => {
      // Check for duplicate operations on the same data
      const existingIndex = prev.findIndex(
        q => q.type === newItem.type && 
        q.data.id === newItem.data.id && 
        q.status === 'pending'
      );

      if (existingIndex !== -1) {
        // Replace existing pending operation
        const updated = [...prev];
        updated[existingIndex] = newItem;
        return updated;
      }

      return [...prev, newItem];
    });

    if (!isOnline) {
      toast({
        title: 'Saved Offline',
        description: 'Your changes have been saved locally and will sync when online.',
      });
    }
  }, [isOnline, toast]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: 'Queue Cleared',
      description: 'All offline changes have been removed.',
    });
  }, [toast]);

  const retryItem = useCallback(async (id: string) => {
    if (!isOnline) {
      toast({
        title: 'Still Offline',
        description: 'Cannot retry while offline.',
        variant: 'warning',
      });
      return;
    }

    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'pending', error: undefined } : item
    ));

    await syncQueue();
  }, [isOnline, toast]);

  const syncQueue = useCallback(async () => {
    if (!isOnline) return;

    const pendingItems = queue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return;

    toast({
      title: 'Syncing',
      description: `Syncing ${pendingItems.length} queued changes...`,
    });

    for (const item of pendingItems) {
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'syncing' } : q
      ));

      try {
        // Simulate API call - replace with actual API integration
        await processQueueItem(item);

        setQueue(prev => prev.map(q => 
          q.id === item.id ? { ...q, status: 'completed' } : q
        ));
      } catch (error) {
        const newRetryCount = item.retryCount + 1;
        const shouldRetry = newRetryCount < item.maxRetries;

        setQueue(prev => prev.map(q => 
          q.id === item.id ? { 
            ...q, 
            status: shouldRetry ? 'pending' : 'failed',
            retryCount: newRetryCount,
            error: error instanceof Error ? error.message : 'Unknown error'
          } : q
        ));

        if (!shouldRetry) {
          toast({
            title: 'Sync Failed',
            description: `Failed to sync ${item.type}. Please retry manually.`,
            variant: 'destructive',
          });
        }
      }
    }

    // Clean up completed items
    setQueue(prev => prev.filter(item => item.status !== 'completed'));

    const remainingItems = queue.filter(item => item.status !== 'completed').length;
    if (remainingItems === 0) {
      toast({
        title: 'Sync Complete',
        description: 'All changes have been synced successfully.',
      });
    }
  }, [isOnline, queue, toast]);

  const getQueuedItem = useCallback((type: string, dataId: string) => {
    return queue.find(item => 
      item.type === type && 
      item.data.id === dataId && 
      item.status === 'pending'
    );
  }, [queue]);

  return {
    isOnline,
    queueSize: queue.filter(item => item.status === 'pending').length,
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    retryItem,
    syncQueue,
    getQueuedItem,
  };
}

// Placeholder for actual API processing
async function processQueueItem(item: OfflineQueueItem): Promise<void> {
  // This should be replaced with actual API calls based on item type and action
  // For now, simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate occasional failures for testing
  if (Math.random() < 0.1) {
    throw new Error('Network error');
  }
}

// IndexedDB operations for large data storage
export class OfflineStorage {
  private dbName = 'HockeyHubOffline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for different data types
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
          workoutStore.createIndex('timestamp', 'timestamp', { unique: false });
          workoutStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
          sessionStore.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  async saveWorkout(workout: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['workouts'], 'readwrite');
    const store = transaction.objectStore('workouts');
    
    await store.put({
      ...workout,
      timestamp: Date.now(),
      synced: false,
    });
  }

  async getUnsyncedWorkouts(): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['workouts'], 'readonly');
    const store = transaction.objectStore('workouts');
    const index = store.index('synced');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markWorkoutSynced(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['workouts'], 'readwrite');
    const store = transaction.objectStore('workouts');
    
    const workout = await store.get(id);
    if (workout) {
      workout.synced = true;
      await store.put(workout);
    }
  }

  async deleteWorkout(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['workouts'], 'readwrite');
    const store = transaction.objectStore('workouts');
    await store.delete(id);
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();