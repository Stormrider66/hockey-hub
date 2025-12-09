/**
 * Tactical Storage Service
 * Local storage manager with offline support, auto-save drafts, sync queue, and conflict resolution
 */

import type { TacticalPlay, Formation } from '../services/tacticalDataService';

// ============ Types and Interfaces ============

export interface StoredTacticalPlay extends TacticalPlay {
  localId?: string;
  isDraft: boolean;
  isModified: boolean;
  lastSyncAttempt?: string;
  syncError?: string;
  conflictResolution?: 'local' | 'server' | 'manual';
}

export interface StoredFormation extends Formation {
  localId?: string;
  isDraft: boolean;
  isModified: boolean;
  lastSyncAttempt?: string;
  syncError?: string;
  conflictResolution?: 'local' | 'server' | 'manual';
}

export interface SyncQueueItem {
  id: string;
  localId?: string;
  type: 'tactical_play' | 'formation';
  operation: 'create' | 'update' | 'delete';
  data?: any;
  timestamp: string;
  attempts: number;
  lastAttempt?: string;
  error?: string;
  priority: 'high' | 'normal' | 'low';
}

export interface ConflictItem {
  id: string;
  localId?: string;
  type: 'tactical_play' | 'formation';
  localData: any;
  serverData: any;
  conflictFields: string[];
  timestamp: string;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merge';
  mergedData?: any;
}

export interface StorageMetadata {
  version: string;
  lastSync: string;
  isOnline: boolean;
  syncInProgress: boolean;
  totalItems: number;
  pendingSync: number;
  conflicts: number;
  storageSize: number;
}

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  maxDrafts: number;
  retentionDays: number;
}

export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // milliseconds
  maxRetries: number;
  batchSize: number;
  conflictStrategy: 'manual' | 'server_wins' | 'local_wins' | 'timestamp';
}

// ============ Storage Keys ============

const STORAGE_KEYS = {
  TACTICAL_PLAYS: 'tactical_plays',
  FORMATIONS: 'formations',
  SYNC_QUEUE: 'sync_queue',
  CONFLICTS: 'conflicts',
  DRAFTS: 'drafts',
  METADATA: 'metadata',
  CONFIG: 'config',
  LAST_SYNC: 'last_sync',
  OFFLINE_CHANGES: 'offline_changes'
} as const;

// ============ Default Configurations ============

const DEFAULT_AUTOSAVE_CONFIG: AutoSaveConfig = {
  enabled: true,
  interval: 30000, // 30 seconds
  maxDrafts: 50,
  retentionDays: 7
};

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: true,
  autoSync: true,
  syncInterval: 60000, // 1 minute
  maxRetries: 3,
  batchSize: 10,
  conflictStrategy: 'manual'
};

// ============ Storage Utilities ============

class StorageUtils {
  static getStorageKey(key: string): string {
    return `hockey_hub_tactical_${key}`;
  }

  static isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  static getStorageSize(): number {
    if (!this.isStorageAvailable()) return 0;
    
    let total = 0;
    for (const key in localStorage) {
      if (key.startsWith('hockey_hub_tactical_')) {
        total += localStorage[key].length;
      }
    }
    return total;
  }

  static setItem<T>(key: string, value: T): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set storage item ${key}:`, error);
      return false;
    }
  }

  static getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const storageKey = this.getStorageKey(key);
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error(`Failed to get storage item ${key}:`, error);
      return defaultValue || null;
    }
  }

  static removeItem(key: string): void {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Failed to remove storage item ${key}:`, error);
    }
  }

  static clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (const key in localStorage) {
        if (key.startsWith('hockey_hub_tactical_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear tactical storage:', error);
    }
  }
}

// ============ Main Tactical Storage Service ============

export class TacticalStorageService {
  private autoSaveConfig: AutoSaveConfig;
  private syncConfig: SyncConfig;
  private autoSaveInterval?: NodeJS.Timeout;
  private syncInterval?: NodeJS.Timeout;
  private onlineStatusHandler?: () => void;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(
    autoSaveConfig: Partial<AutoSaveConfig> = {},
    syncConfig: Partial<SyncConfig> = {}
  ) {
    this.autoSaveConfig = { ...DEFAULT_AUTOSAVE_CONFIG, ...autoSaveConfig };
    this.syncConfig = { ...DEFAULT_SYNC_CONFIG, ...syncConfig };
    
    if (!StorageUtils.isStorageAvailable()) {
      console.warn('Local storage is not available. Tactical storage will not work.');
      return;
    }

    this.initialize();
  }

  // ============ Initialization ============

  private initialize(): void {
    this.loadConfigurations();
    this.setupOnlineStatusMonitoring();
    this.startAutoSave();
    this.startAutoSync();
    this.cleanupOldDrafts();
  }

  private loadConfigurations(): void {
    const storedAutoSaveConfig = StorageUtils.getItem<AutoSaveConfig>('autosave_config');
    const storedSyncConfig = StorageUtils.getItem<SyncConfig>('sync_config');

    if (storedAutoSaveConfig) {
      this.autoSaveConfig = { ...this.autoSaveConfig, ...storedAutoSaveConfig };
    }

    if (storedSyncConfig) {
      this.syncConfig = { ...this.syncConfig, ...storedSyncConfig };
    }
  }

  private setupOnlineStatusMonitoring(): void {
    this.onlineStatusHandler = () => {
      const isOnline = navigator.onLine;
      this.updateMetadata({ isOnline });
      
      if (isOnline && this.syncConfig.autoSync) {
        this.syncPendingChanges().catch(console.error);
      }
      
      this.emit('online_status_changed', isOnline);
    };

    window.addEventListener('online', this.onlineStatusHandler);
    window.addEventListener('offline', this.onlineStatusHandler);
  }

  // ============ Event System ============

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ============ Tactical Plays Storage ============

  async saveTacticalPlay(play: TacticalPlay, isDraft = false): Promise<boolean> {
    try {
      const storedPlay: StoredTacticalPlay = {
        ...play,
        localId: play.localId || this.generateLocalId(),
        isDraft,
        isModified: true,
        lastSyncAttempt: isDraft ? undefined : new Date().toISOString()
      };

      const existingPlays = this.getTacticalPlays();
      const existingIndex = existingPlays.findIndex(p => 
        p.id === play.id || p.localId === storedPlay.localId
      );

      if (existingIndex >= 0) {
        existingPlays[existingIndex] = storedPlay;
      } else {
        existingPlays.push(storedPlay);
      }

      const success = StorageUtils.setItem(STORAGE_KEYS.TACTICAL_PLAYS, existingPlays);
      
      if (success && !isDraft) {
        await this.addToSyncQueue({
          id: play.id || storedPlay.localId!,
          localId: storedPlay.localId,
          type: 'tactical_play',
          operation: play.id ? 'update' : 'create',
          data: play,
          timestamp: new Date().toISOString(),
          attempts: 0,
          priority: 'normal'
        });
      }

      this.updateMetadata();
      this.emit('tactical_play_saved', storedPlay, isDraft);
      
      return success;
    } catch (error) {
      console.error('Failed to save tactical play:', error);
      return false;
    }
  }

  getTacticalPlays(includeDeleted = false): StoredTacticalPlay[] {
    const plays = StorageUtils.getItem<StoredTacticalPlay[]>(STORAGE_KEYS.TACTICAL_PLAYS, []);
    return includeDeleted ? plays : plays.filter(play => !play.deletedAt);
  }

  getTacticalPlay(id: string): StoredTacticalPlay | null {
    const plays = this.getTacticalPlays();
    return plays.find(play => play.id === id || play.localId === id) || null;
  }

  async deleteTacticalPlay(id: string): Promise<boolean> {
    try {
      const plays = this.getTacticalPlays(true);
      const playIndex = plays.findIndex(play => play.id === id || play.localId === id);
      
      if (playIndex < 0) {
        return false;
      }

      const play = plays[playIndex];
      
      // Mark as deleted instead of removing
      plays[playIndex] = {
        ...play,
        deletedAt: new Date().toISOString(),
        isModified: true
      };

      const success = StorageUtils.setItem(STORAGE_KEYS.TACTICAL_PLAYS, plays);
      
      if (success) {
        await this.addToSyncQueue({
          id: play.id || play.localId!,
          localId: play.localId,
          type: 'tactical_play',
          operation: 'delete',
          timestamp: new Date().toISOString(),
          attempts: 0,
          priority: 'normal'
        });
      }

      this.updateMetadata();
      this.emit('tactical_play_deleted', play);
      
      return success;
    } catch (error) {
      console.error('Failed to delete tactical play:', error);
      return false;
    }
  }

  // ============ Formations Storage ============

  async saveFormation(formation: Formation, isDraft = false): Promise<boolean> {
    try {
      const storedFormation: StoredFormation = {
        ...formation,
        localId: formation.localId || this.generateLocalId(),
        isDraft,
        isModified: true,
        lastSyncAttempt: isDraft ? undefined : new Date().toISOString()
      };

      const existingFormations = this.getFormations();
      const existingIndex = existingFormations.findIndex(f => 
        f.id === formation.id || f.localId === storedFormation.localId
      );

      if (existingIndex >= 0) {
        existingFormations[existingIndex] = storedFormation;
      } else {
        existingFormations.push(storedFormation);
      }

      const success = StorageUtils.setItem(STORAGE_KEYS.FORMATIONS, existingFormations);
      
      if (success && !isDraft) {
        await this.addToSyncQueue({
          id: formation.id || storedFormation.localId!,
          localId: storedFormation.localId,
          type: 'formation',
          operation: formation.id ? 'update' : 'create',
          data: formation,
          timestamp: new Date().toISOString(),
          attempts: 0,
          priority: 'normal'
        });
      }

      this.updateMetadata();
      this.emit('formation_saved', storedFormation, isDraft);
      
      return success;
    } catch (error) {
      console.error('Failed to save formation:', error);
      return false;
    }
  }

  getFormations(includeDeleted = false): StoredFormation[] {
    const formations = StorageUtils.getItem<StoredFormation[]>(STORAGE_KEYS.FORMATIONS, []);
    return includeDeleted ? formations : formations.filter(formation => !formation.deletedAt);
  }

  getFormation(id: string): StoredFormation | null {
    const formations = this.getFormations();
    return formations.find(formation => formation.id === id || formation.localId === id) || null;
  }

  async deleteFormation(id: string): Promise<boolean> {
    try {
      const formations = this.getFormations(true);
      const formationIndex = formations.findIndex(formation => formation.id === id || formation.localId === id);
      
      if (formationIndex < 0) {
        return false;
      }

      const formation = formations[formationIndex];
      
      // Mark as deleted instead of removing
      formations[formationIndex] = {
        ...formation,
        deletedAt: new Date().toISOString(),
        isModified: true
      };

      const success = StorageUtils.setItem(STORAGE_KEYS.FORMATIONS, formations);
      
      if (success) {
        await this.addToSyncQueue({
          id: formation.id || formation.localId!,
          localId: formation.localId,
          type: 'formation',
          operation: 'delete',
          timestamp: new Date().toISOString(),
          attempts: 0,
          priority: 'normal'
        });
      }

      this.updateMetadata();
      this.emit('formation_deleted', formation);
      
      return success;
    } catch (error) {
      console.error('Failed to delete formation:', error);
      return false;
    }
  }

  // ============ Drafts Management ============

  getDrafts(): { tacticalPlays: StoredTacticalPlay[]; formations: StoredFormation[] } {
    const tacticalPlays = this.getTacticalPlays().filter(play => play.isDraft);
    const formations = this.getFormations().filter(formation => formation.isDraft);
    
    return { tacticalPlays, formations };
  }

  async saveDraft(type: 'tactical_play' | 'formation', data: any, localId?: string): Promise<string> {
    const id = localId || this.generateLocalId();
    
    if (type === 'tactical_play') {
      await this.saveTacticalPlay({ ...data, localId: id }, true);
    } else {
      await this.saveFormation({ ...data, localId: id }, true);
    }
    
    this.emit('draft_saved', type, data, id);
    return id;
  }

  async deleteDraft(localId: string): Promise<boolean> {
    const tacticalPlays = this.getTacticalPlays(true);
    const formations = this.getFormations(true);
    
    let found = false;
    
    // Remove from tactical plays
    const playIndex = tacticalPlays.findIndex(play => play.localId === localId && play.isDraft);
    if (playIndex >= 0) {
      tacticalPlays.splice(playIndex, 1);
      StorageUtils.setItem(STORAGE_KEYS.TACTICAL_PLAYS, tacticalPlays);
      found = true;
    }
    
    // Remove from formations
    const formationIndex = formations.findIndex(formation => formation.localId === localId && formation.isDraft);
    if (formationIndex >= 0) {
      formations.splice(formationIndex, 1);
      StorageUtils.setItem(STORAGE_KEYS.FORMATIONS, formations);
      found = true;
    }
    
    if (found) {
      this.updateMetadata();
      this.emit('draft_deleted', localId);
    }
    
    return found;
  }

  private cleanupOldDrafts(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.autoSaveConfig.retentionDays);
    
    const tacticalPlays = this.getTacticalPlays(true);
    const formations = this.getFormations(true);
    
    const filteredPlays = tacticalPlays.filter(play => {
      if (!play.isDraft) return true;
      const playDate = new Date(play.updatedAt || play.createdAt);
      return playDate > cutoffDate;
    });
    
    const filteredFormations = formations.filter(formation => {
      if (!formation.isDraft) return true;
      const formationDate = new Date(formation.updatedAt || formation.createdAt);
      return formationDate > cutoffDate;
    });
    
    StorageUtils.setItem(STORAGE_KEYS.TACTICAL_PLAYS, filteredPlays);
    StorageUtils.setItem(STORAGE_KEYS.FORMATIONS, filteredFormations);
    
    this.updateMetadata();
  }

  // ============ Sync Queue Management ============

  private async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<void> {
    const queue = this.getSyncQueue();
    const queueItem: SyncQueueItem = {
      id: this.generateLocalId(),
      ...item
    };
    
    // Check if similar item already exists
    const existingIndex = queue.findIndex(queueItem => 
      queueItem.localId === item.localId && 
      queueItem.type === item.type && 
      queueItem.operation === item.operation
    );
    
    if (existingIndex >= 0) {
      // Update existing item
      queue[existingIndex] = { ...queue[existingIndex], ...queueItem };
    } else {
      queue.push(queueItem);
    }
    
    StorageUtils.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
    this.updateMetadata();
    this.emit('sync_queue_updated', queue.length);
  }

  getSyncQueue(): SyncQueueItem[] {
    return StorageUtils.getItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  }

  async syncPendingChanges(): Promise<{ success: number; failed: number; errors: string[] }> {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }

    const queue = this.getSyncQueue();
    if (queue.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }

    this.updateMetadata({ syncInProgress: true });
    this.emit('sync_started', queue.length);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process queue in batches
    const batchSize = this.syncConfig.batchSize;
    const batches = [];
    
    for (let i = 0; i < queue.length; i += batchSize) {
      batches.push(queue.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (item) => {
        try {
          await this.syncItem(item);
          success++;
          return { success: true, item };
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${item.type}(${item.id}): ${errorMessage}`);
          return { success: false, item, error: errorMessage };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Remove successful items from queue
      const remainingQueue = this.getSyncQueue().filter(queueItem => {
        return !batchResults.some(result => 
          result.status === 'fulfilled' && 
          result.value.success && 
          result.value.item.id === queueItem.id
        );
      });

      StorageUtils.setItem(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);
    }

    this.updateMetadata({ 
      syncInProgress: false,
      lastSync: new Date().toISOString()
    });
    
    this.emit('sync_completed', { success, failed, errors });

    return { success, failed, errors };
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    // This would integrate with the tacticalApiClient
    // For now, we'll simulate the sync operation
    
    // Update attempt count
    const queue = this.getSyncQueue();
    const queueItem = queue.find(q => q.id === item.id);
    
    if (queueItem) {
      queueItem.attempts += 1;
      queueItem.lastAttempt = new Date().toISOString();
      
      if (queueItem.attempts > this.syncConfig.maxRetries) {
        queueItem.error = 'Max retry attempts exceeded';
        StorageUtils.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
        throw new Error('Max retry attempts exceeded');
      }
      
      StorageUtils.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation, this would call tacticalApiClient methods
    // based on item.type and item.operation
    
    console.log(`Synced ${item.type} ${item.operation}:`, item.id);
  }

  // ============ Conflict Resolution ============

  getConflicts(): ConflictItem[] {
    return StorageUtils.getItem<ConflictItem[]>(STORAGE_KEYS.CONFLICTS, []);
  }

  async resolveConflict(
    conflictId: string, 
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ): Promise<boolean> {
    const conflicts = this.getConflicts();
    const conflict = conflicts.find(c => c.id === conflictId);
    
    if (!conflict) {
      return false;
    }

    conflict.resolved = true;
    conflict.resolution = resolution;
    
    if (resolution === 'merge' && mergedData) {
      conflict.mergedData = mergedData;
    }

    const dataToSave = resolution === 'local' ? conflict.localData :
                      resolution === 'server' ? conflict.serverData :
                      mergedData || conflict.localData;

    // Save resolved data
    if (conflict.type === 'tactical_play') {
      await this.saveTacticalPlay(dataToSave);
    } else {
      await this.saveFormation(dataToSave);
    }

    StorageUtils.setItem(STORAGE_KEYS.CONFLICTS, conflicts);
    this.updateMetadata();
    this.emit('conflict_resolved', conflict, resolution);

    return true;
  }

  // ============ Auto-save Management ============

  private startAutoSave(): void {
    if (!this.autoSaveConfig.enabled) return;

    this.autoSaveInterval = setInterval(() => {
      this.cleanupOldDrafts();
    }, this.autoSaveConfig.interval);
  }

  private startAutoSync(): void {
    if (!this.syncConfig.enabled || !this.syncConfig.autoSync) return;

    this.syncInterval = setInterval(async () => {
      if (navigator.onLine && !this.getMetadata().syncInProgress) {
        try {
          await this.syncPendingChanges();
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    }, this.syncConfig.syncInterval);
  }

  // ============ Metadata Management ============

  private updateMetadata(updates: Partial<StorageMetadata> = {}): void {
    const currentMetadata = this.getMetadata();
    const tacticalPlays = this.getTacticalPlays();
    const formations = this.getFormations();
    const syncQueue = this.getSyncQueue();
    const conflicts = this.getConflicts();

    const metadata: StorageMetadata = {
      ...currentMetadata,
      ...updates,
      totalItems: tacticalPlays.length + formations.length,
      pendingSync: syncQueue.length,
      conflicts: conflicts.filter(c => !c.resolved).length,
      storageSize: StorageUtils.getStorageSize()
    };

    StorageUtils.setItem(STORAGE_KEYS.METADATA, metadata);
    this.emit('metadata_updated', metadata);
  }

  getMetadata(): StorageMetadata {
    return StorageUtils.getItem<StorageMetadata>(STORAGE_KEYS.METADATA, {
      version: '1.0.0',
      lastSync: '',
      isOnline: navigator.onLine,
      syncInProgress: false,
      totalItems: 0,
      pendingSync: 0,
      conflicts: 0,
      storageSize: 0
    });
  }

  // ============ Utility Methods ============

  private generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============ Public Configuration Methods ============

  updateAutoSaveConfig(config: Partial<AutoSaveConfig>): void {
    this.autoSaveConfig = { ...this.autoSaveConfig, ...config };
    StorageUtils.setItem('autosave_config', this.autoSaveConfig);
    
    // Restart auto-save with new config
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.startAutoSave();
  }

  updateSyncConfig(config: Partial<SyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
    StorageUtils.setItem('sync_config', this.syncConfig);
    
    // Restart auto-sync with new config
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.startAutoSync();
  }

  // ============ Import/Export ============

  export(): { tacticalPlays: StoredTacticalPlay[]; formations: StoredFormation[]; metadata: StorageMetadata } {
    return {
      tacticalPlays: this.getTacticalPlays(),
      formations: this.getFormations(),
      metadata: this.getMetadata()
    };
  }

  async import(data: { 
    tacticalPlays?: StoredTacticalPlay[]; 
    formations?: StoredFormation[]; 
    replaceExisting?: boolean;
  }): Promise<boolean> {
    try {
      if (data.tacticalPlays) {
        const existingPlays = data.replaceExisting ? [] : this.getTacticalPlays();
        const mergedPlays = data.replaceExisting ? 
          data.tacticalPlays : 
          [...existingPlays, ...data.tacticalPlays.filter(newPlay => 
            !existingPlays.some(existing => existing.id === newPlay.id || existing.localId === newPlay.localId)
          )];
        
        StorageUtils.setItem(STORAGE_KEYS.TACTICAL_PLAYS, mergedPlays);
      }

      if (data.formations) {
        const existingFormations = data.replaceExisting ? [] : this.getFormations();
        const mergedFormations = data.replaceExisting ? 
          data.formations : 
          [...existingFormations, ...data.formations.filter(newFormation => 
            !existingFormations.some(existing => existing.id === newFormation.id || existing.localId === newFormation.localId)
          )];
        
        StorageUtils.setItem(STORAGE_KEYS.FORMATIONS, mergedFormations);
      }

      this.updateMetadata();
      this.emit('data_imported', data);
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // ============ Cleanup ============

  clear(): void {
    StorageUtils.clear();
    this.updateMetadata();
    this.emit('storage_cleared');
  }

  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.onlineStatusHandler) {
      window.removeEventListener('online', this.onlineStatusHandler);
      window.removeEventListener('offline', this.onlineStatusHandler);
    }
    
    this.eventListeners.clear();
  }
}

// ============ Global Instance ============

export const tacticalStorageService = new TacticalStorageService();

// Export types for external use
export type {
  StoredTacticalPlay,
  StoredFormation,
  SyncQueueItem,
  ConflictItem,
  StorageMetadata,
  AutoSaveConfig,
  SyncConfig
};