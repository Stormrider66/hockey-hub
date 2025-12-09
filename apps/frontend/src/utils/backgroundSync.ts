// Background Sync Utilities for Hockey Hub
import React from 'react';

export interface SyncQueueItem {
  id: string;
  timestamp: number;
  type: 'workout' | 'session' | 'message' | 'update';
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface BackgroundSyncOptions {
  maxRetries?: number;
  retryDelay?: number;
  priority?: 'high' | 'normal' | 'low';
}

class BackgroundSyncManager {
  private dbName = 'hockey-hub-sync';
  private dbVersion = 1;
  private storeName = 'sync-queue';
  private db: IDBDatabase | null = null;
  private syncInProgress = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDB();
    this.setupEventListeners();
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * Setup event listeners for online/offline status
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('Network is back online, syncing queued requests...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('Network is offline, requests will be queued');
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'sw-sync-success') {
          this.handleSyncSuccess(event.data.data);
        } else if (event.data.type === 'sw-sync-failed') {
          this.handleSyncFailure(event.data.data);
        }
      });
    }
  }

  /**
   * Add a request to the sync queue
   */
  async addToQueue(
    type: SyncQueueItem['type'],
    action: SyncQueueItem['action'],
    endpoint: string,
    method: SyncQueueItem['method'],
    data?: any,
    options?: BackgroundSyncOptions
  ): Promise<string> {
    const item: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: Date.now(),
      type,
      action,
      endpoint,
      method,
      data,
      headers: this.getDefaultHeaders(),
      retryCount: 0,
      maxRetries: options?.maxRetries || 3,
      status: 'pending'
    };

    await this.saveToIndexedDB(item);

    // If online, try to sync immediately
    if (navigator.onLine) {
      this.syncItem(item.id);
    } else {
      // Register for background sync if available
      this.registerBackgroundSync();
    }

    return item.id;
  }

  /**
   * Save item to IndexedDB
   */
  private async saveToIndexedDB(item: SyncQueueItem): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending items from the queue
   */
  async getPendingItems(): Promise<SyncQueueItem[]> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync a specific item
   */
  async syncItem(itemId: string): Promise<boolean> {
    try {
      const item = await this.getItem(itemId);
      if (!item || item.status !== 'pending') {
        return false;
      }

      // Update status to syncing
      await this.updateItemStatus(itemId, 'syncing');

      // Make the API request
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: item.headers,
        body: item.data ? JSON.stringify(item.data) : undefined,
      });

      if (response.ok) {
        // Success - remove from queue
        await this.removeItem(itemId);
        this.notifySuccess(item);
        return true;
      } else {
        // Handle failure
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Sync failed for item ${itemId}:`, error);
      await this.handleItemFailure(itemId, error);
      return false;
    }
  }

  /**
   * Sync all pending items
   */
  async syncAll(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingItems = await this.getPendingItems();
      console.log(`Syncing ${pendingItems.length} pending items...`);

      // Sort by timestamp (FIFO)
      pendingItems.sort((a, b) => a.timestamp - b.timestamp);

      // Process items sequentially
      for (const item of pendingItems) {
        await this.syncItem(item.id);
      }
    } catch (error) {
      console.error('Sync all failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get a specific item from the queue
   */
  private async getItem(itemId: string): Promise<SyncQueueItem | null> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(itemId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update item status
   */
  private async updateItemStatus(itemId: string, status: SyncQueueItem['status'], error?: string): Promise<void> {
    const item = await this.getItem(itemId);
    if (!item) return;

    item.status = status;
    if (error) {
      item.error = error;
    }

    await this.saveToIndexedDB(item);
  }

  /**
   * Remove item from queue
   */
  private async removeItem(itemId: string): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(itemId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Handle item failure
   */
  private async handleItemFailure(itemId: string, error: any): Promise<void> {
    const item = await this.getItem(itemId);
    if (!item) return;

    item.retryCount++;
    item.error = error.message;

    if (item.retryCount >= item.maxRetries) {
      // Max retries reached, mark as failed
      await this.updateItemStatus(itemId, 'failed', error.message);
      this.notifyFailure(item);
    } else {
      // Schedule retry
      await this.updateItemStatus(itemId, 'pending', error.message);
      this.scheduleRetry(itemId, item.retryCount);
    }
  }

  /**
   * Schedule a retry for a failed item
   */
  private scheduleRetry(itemId: string, retryCount: number): void {
    // Clear any existing timeout
    const existingTimeout = this.retryTimeouts.get(itemId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Exponential backoff: 2^retryCount seconds
    const delay = Math.min(Math.pow(2, retryCount) * 1000, 60000); // Max 1 minute

    const timeout = setTimeout(() => {
      this.retryTimeouts.delete(itemId);
      this.syncItem(itemId);
    }, delay);

    this.retryTimeouts.set(itemId, timeout);
  }

  /**
   * Register for background sync
   */
  private async registerBackgroundSync(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-api-requests');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }

  /**
   * Get default headers
   */
  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Notify success
   */
  private notifySuccess(item: SyncQueueItem): void {
    window.dispatchEvent(new CustomEvent('background-sync-success', {
      detail: { item }
    }));
  }

  /**
   * Notify failure
   */
  private notifyFailure(item: SyncQueueItem): void {
    window.dispatchEvent(new CustomEvent('background-sync-failed', {
      detail: { item }
    }));
  }

  /**
   * Handle sync success from service worker
   */
  private handleSyncSuccess(data: any): void {
    this.notifySuccess(data);
  }

  /**
   * Handle sync failure from service worker
   */
  private handleSyncFailure(data: any): void {
    this.notifyFailure(data);
  }

  /**
   * Clear all completed items
   */
  async clearCompleted(): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('status');
    const request = index.openCursor(IDBKeyRange.only('completed'));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    completed: number;
    total: number;
  }> {
    if (!this.db) {
      await this.initializeDB();
    }

    const stats = {
      pending: 0,
      syncing: 0,
      failed: 0,
      completed: 0,
      total: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const item = cursor.value as SyncQueueItem;
          stats[item.status]++;
          stats.total++;
          cursor.continue();
        } else {
          resolve(stats);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
export const backgroundSync = new BackgroundSyncManager();

// React hook for background sync
export function useBackgroundSync() {
  const [stats, setStats] = React.useState({
    pending: 0,
    syncing: 0,
    failed: 0,
    completed: 0,
    total: 0
  });

  React.useEffect(() => {
    // Load initial stats
    backgroundSync.getQueueStats().then(setStats);

    // Update stats on sync events
    const handleSyncEvent = () => {
      backgroundSync.getQueueStats().then(setStats);
    };

    window.addEventListener('background-sync-success', handleSyncEvent);
    window.addEventListener('background-sync-failed', handleSyncEvent);

    return () => {
      window.removeEventListener('background-sync-success', handleSyncEvent);
      window.removeEventListener('background-sync-failed', handleSyncEvent);
    };
  }, []);

  return {
    stats,
    addToQueue: backgroundSync.addToQueue.bind(backgroundSync),
    syncAll: backgroundSync.syncAll.bind(backgroundSync),
    clearCompleted: backgroundSync.clearCompleted.bind(backgroundSync),
  };
}