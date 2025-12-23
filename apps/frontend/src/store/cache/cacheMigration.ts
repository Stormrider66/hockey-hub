/**
 * Cache Migration System
 *
 * Handles migration of cached data between different versions
 * to maintain compatibility when data structures change.
 */

import {
  CACHE_VERSION,
  getCurrentCacheVersion,
  setCacheVersion,
  getMigrationPath,
  needsCacheMigration,
  CACHE_VERSION_KEY
} from './cacheVersion';
import { safeLocalStorage } from '@/utils/safeStorage';

export interface MigrationResult {
  success: boolean;
  migratedFrom?: string;
  migratedTo: string;
  errors?: string[];
  migratedKeys?: string[];
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  version?: string;
}

/**
 * Migration function type
 */
type MigrationFunction = (data: any) => any;

// Import actual migration functions
import { migrateToV100 } from './migrations/v1.0.0';

/**
 * Migration registry - maps version transitions to migration functions
 */
const MIGRATIONS: Record<string, MigrationFunction> = {
  // Migration from 0.9.0 to 1.0.0
  '0.9.0->1.0.0': (data) => {
    // Use the actual migration function but only on the data part
    const tempEntry: CacheEntry = { data, timestamp: Date.now() };
    const migrated = migrateToV100(tempEntry);
    return migrated.data;
  },
  
  // Add more migrations as needed
  '1.0.0->1.1.0': (data) => {
    // Example: Add new analytics structure
    if (data.analytics) {
      data.analytics = {
        ...data.analytics,
        version: '1.1.0',
        metrics: data.analytics.metrics || {}
      };
    }
    return data;
  }
};

/**
 * Apply a single migration
 */
function applyMigration(data: any, fromVersion: string, toVersion: string): any {
  const migrationKey = `${fromVersion}->${toVersion}`;
  const migrationFn = MIGRATIONS[migrationKey];
  
  if (!migrationFn) {
    console.warn(`No migration function for ${migrationKey}`);
    return data;
  }
  
  try {
    return migrationFn(data);
  } catch (error) {
    console.error(`Migration ${migrationKey} failed:`, error);
    throw error;
  }
}

/**
 * Migrate a single cache entry
 */
function migrateCacheEntry(entry: CacheEntry, targetVersion: string): CacheEntry {
  const entryVersion = entry.version || '0.9.0'; // Default to 0.9.0 for old entries
  
  if (entryVersion === targetVersion) {
    return entry;
  }
  
  try {
    const migrationPath = getMigrationPath(entryVersion, targetVersion);
    let migratedData = entry.data;
    let currentVersion = entryVersion;
    
    for (const nextVersion of migrationPath) {
      migratedData = applyMigration(migratedData, currentVersion, nextVersion);
      currentVersion = nextVersion;
    }
    
    return {
      ...entry,
      data: migratedData,
      version: targetVersion,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Failed to migrate cache entry:', error);
    throw error;
  }
}

/**
 * Get all RTK Query cache keys from localStorage
 */
function getRTKQueryCacheKeys(): string[] {
  const keys: string[] = [];
  const allKeys = safeLocalStorage.keys();

  for (const key of allKeys) {
    if (key.startsWith('rtkq:')) {
      keys.push(key);
    }
  }

  return keys;
}

/**
 * Migrate all cached data to current version
 */
export async function migrateCache(): Promise<MigrationResult> {
  const currentVersionInfo = getCurrentCacheVersion();
  const fromVersion = currentVersionInfo?.version || '0.9.0';
  const errors: string[] = [];
  const migratedKeys: string[] = [];
  
  if (!needsCacheMigration()) {
    return {
      success: true,
      migratedTo: CACHE_VERSION,
      migratedFrom: fromVersion
    };
  }
  
  try {
    const cacheKeys = getRTKQueryCacheKeys();

    for (const key of cacheKeys) {
      try {
        const rawData = safeLocalStorage.getItem(key);
        if (!rawData) continue;

        const cacheEntry: CacheEntry = JSON.parse(rawData);
        const migratedEntry = migrateCacheEntry(cacheEntry, CACHE_VERSION);

        safeLocalStorage.setItem(key, JSON.stringify(migratedEntry));
        migratedKeys.push(key);
      } catch (error) {
        const errorMsg = `Failed to migrate key ${key}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);

        // Remove corrupted entry
        safeLocalStorage.removeItem(key);
      }
    }
    
    // Update cache version
    setCacheVersion(CACHE_VERSION, fromVersion);
    
    return {
      success: errors.length === 0,
      migratedFrom: fromVersion,
      migratedTo: CACHE_VERSION,
      errors: errors.length > 0 ? errors : undefined,
      migratedKeys
    };
  } catch (error) {
    console.error('Cache migration failed:', error);
    return {
      success: false,
      migratedTo: CACHE_VERSION,
      errors: [`Migration failed: ${error}`]
    };
  }
}

/**
 * Check cache compatibility and migrate if needed
 */
export async function ensureCacheCompatibility(): Promise<boolean> {
  try {
    if (needsCacheMigration()) {
      const result = await migrateCache();
      
      if (!result.success) {
        console.error('Cache migration failed, clearing cache');
        clearAllCache();
        return false;
      }
      
      console.log(`Cache migrated from ${result.migratedFrom} to ${result.migratedTo}`);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to ensure cache compatibility:', error);
    return false;
  }
}

/**
 * Clear all cache data
 */
export function clearAllCache(): void {
  const cacheKeys = getRTKQueryCacheKeys();

  for (const key of cacheKeys) {
    safeLocalStorage.removeItem(key);
  }

  // Also clear version info to force fresh start
  safeLocalStorage.removeItem(CACHE_VERSION_KEY);
}