/**
 * Cache Version Management
 * 
 * This module manages cache versioning to ensure compatibility
 * when data structures change between application versions.
 */

export const CACHE_VERSION = '1.0.0';
export const CACHE_VERSION_KEY = 'hockey-hub-cache-version';

export interface CacheVersionInfo {
  version: string;
  timestamp: number;
  lastMigration?: string;
}

/**
 * Version comparison utility
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * Get current cache version from localStorage
 */
export function getCurrentCacheVersion(): CacheVersionInfo | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const versionData = localStorage.getItem(CACHE_VERSION_KEY);
      return versionData ? JSON.parse(versionData) : null;
    }
    return null;
  } catch (error) {
    console.error('Failed to read cache version:', error);
    return null;
  }
}

/**
 * Set cache version in localStorage
 */
export function setCacheVersion(version: string, lastMigration?: string): void {
  const versionInfo: CacheVersionInfo = {
    version,
    timestamp: Date.now(),
    lastMigration
  };
  
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHE_VERSION_KEY, JSON.stringify(versionInfo));
    }
  } catch (error) {
    console.error('Failed to set cache version:', error);
  }
}

/**
 * Check if cache needs migration
 */
export function needsCacheMigration(): boolean {
  const currentVersion = getCurrentCacheVersion();
  
  if (!currentVersion) {
    // No version info means old cache format
    return true;
  }
  
  return compareVersions(currentVersion.version, CACHE_VERSION) < 0;
}

/**
 * Migration strategies for different version transitions
 */
export const MIGRATION_STRATEGIES: Record<string, string[]> = {
  '0.9.0': ['1.0.0'], // Can migrate from 0.9.0 to 1.0.0
  '1.0.0': ['1.1.0', '1.2.0'], // Can migrate to 1.1.0 or 1.2.0
  // Add more migration paths as needed
};

/**
 * Check if migration path exists
 */
export function canMigrate(fromVersion: string, toVersion: string): boolean {
  const strategies = MIGRATION_STRATEGIES[fromVersion];
  return strategies ? strategies.includes(toVersion) : false;
}

/**
 * Get migration path from one version to another
 */
export function getMigrationPath(fromVersion: string, toVersion: string): string[] {
  const path: string[] = [];
  let currentVersion = fromVersion;
  
  while (currentVersion !== toVersion) {
    const strategies = MIGRATION_STRATEGIES[currentVersion];
    if (!strategies) {
      throw new Error(`No migration path from ${fromVersion} to ${toVersion}`);
    }
    
    // Find the next version in the path
    let nextVersion: string | undefined;
    for (const strategy of strategies) {
      if (compareVersions(strategy, toVersion) <= 0) {
        nextVersion = strategy;
        break;
      }
    }
    
    if (!nextVersion) {
      throw new Error(`Cannot find migration path from ${currentVersion} to ${toVersion}`);
    }
    
    path.push(nextVersion);
    currentVersion = nextVersion;
  }
  
  return path;
}