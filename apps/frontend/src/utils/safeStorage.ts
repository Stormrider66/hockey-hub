/**
 * Safe localStorage wrapper that handles browser restrictions
 * (private browsing, SES/LavaMoat lockdown from crypto wallets, etc.)
 */

let storageAvailable: boolean | null = null;

/**
 * Check if localStorage is available and accessible
 */
function isStorageAvailable(): boolean {
  if (storageAvailable !== null) {
    return storageAvailable;
  }

  if (typeof window === 'undefined') {
    storageAvailable = false;
    return false;
  }

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
    return true;
  } catch (e) {
    storageAvailable = false;
    console.warn('[SafeStorage] localStorage is not available:', e);
    return false;
  }
}

/**
 * Safe localStorage access that won't throw errors
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isStorageAvailable()) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to get '${key}':`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isStorageAvailable()) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[SafeStorage] Failed to set '${key}':`, e);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (!isStorageAvailable()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[SafeStorage] Failed to remove '${key}':`, e);
      return false;
    }
  },

  key: (index: number): string | null => {
    if (!isStorageAvailable()) return null;
    try {
      return localStorage.key(index);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to get key at index ${index}:`, e);
      return null;
    }
  },

  get length(): number {
    if (!isStorageAvailable()) return 0;
    try {
      return localStorage.length;
    } catch (e) {
      console.warn('[SafeStorage] Failed to get length:', e);
      return 0;
    }
  },

  clear: (): boolean => {
    if (!isStorageAvailable()) return false;
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('[SafeStorage] Failed to clear:', e);
      return false;
    }
  },

  /**
   * Check if storage is available
   */
  isAvailable: (): boolean => isStorageAvailable(),

  /**
   * Iterate over all keys safely
   */
  keys: (): string[] => {
    if (!isStorageAvailable()) return [];
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch (e) {
      console.warn('[SafeStorage] Failed to get keys:', e);
      return [];
    }
  },

  /**
   * Get JSON parsed value with fallback
   */
  getJSON: <T>(key: string, fallback: T): T => {
    const value = safeLocalStorage.getItem(key);
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.warn(`[SafeStorage] Failed to parse JSON for '${key}':`, e);
      return fallback;
    }
  },

  /**
   * Set JSON stringified value
   */
  setJSON: <T>(key: string, value: T): boolean => {
    try {
      return safeLocalStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[SafeStorage] Failed to stringify for '${key}':`, e);
      return false;
    }
  }
};

export default safeLocalStorage;
