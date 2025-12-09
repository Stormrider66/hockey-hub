/**
 * Utility to clear persisted Redux state
 * Use this if you encounter persistence issues
 */

export const clearPersistedState = (): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.warn('clearPersistedState: Not in browser environment');
    return;
  }

  try {
    // Clear the main persisted state
    localStorage.removeItem('persist:hockey-hub-root');
    
    // Clear any other persistence keys that might exist
    const keysToRemove: string[] = [];
    
    // Find all keys that might be related to redux-persist
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('persist:') || key.includes('redux'))) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all found keys
    keysToRemove.forEach(key => {
      console.log(`Removing persisted key: ${key}`);
      localStorage.removeItem(key);
    });
    
    console.log('✅ Persisted state cleared successfully');
    console.log('Please refresh the page to reinitialize the application');
  } catch (error) {
    console.error('Failed to clear persisted state:', error);
  }
};

/**
 * Utility to inspect persisted state
 */
export const inspectPersistedState = (): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.warn('inspectPersistedState: Not in browser environment');
    return;
  }

  try {
    const persistedState = localStorage.getItem('persist:hockey-hub-root');
    
    if (!persistedState) {
      console.log('No persisted state found');
      return;
    }
    
    const parsed = JSON.parse(persistedState);
    console.log('Persisted state keys:', Object.keys(parsed));
    
    // Check for API slices
    const apiSlices = Object.keys(parsed).filter(key => key.endsWith('Api'));
    if (apiSlices.length > 0) {
      console.warn('⚠️ Found RTK Query API slices in persisted state:', apiSlices);
      console.warn('These should not be persisted and may cause issues');
    }
    
    // Check for _persist keys in nested objects
    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof value === 'string') {
        try {
          const nestedParsed = JSON.parse(value);
          if (nestedParsed._persist) {
            console.warn(`⚠️ Found _persist key in ${key}`);
          }
        } catch {
          // Not JSON, ignore
        }
      }
    });
    
    console.log('Full persisted state:', parsed);
  } catch (error) {
    console.error('Failed to inspect persisted state:', error);
  }
};

/**
 * Fix persisted state by removing problematic keys
 */
export const fixPersistedState = (): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.warn('fixPersistedState: Not in browser environment');
    return;
  }

  try {
    const persistedState = localStorage.getItem('persist:hockey-hub-root');
    
    if (!persistedState) {
      console.log('No persisted state found');
      return;
    }
    
    const parsed = JSON.parse(persistedState);
    let modified = false;
    
    // Remove all API slices
    Object.keys(parsed).forEach(key => {
      if (key.endsWith('Api')) {
        console.log(`Removing ${key} from persisted state`);
        delete parsed[key];
        modified = true;
      }
    });
    
    // Remove problematic keys
    const problematicKeys = ['socket', 'chat', 'trainingSessionViewer'];
    problematicKeys.forEach(key => {
      if (parsed[key]) {
        console.log(`Removing ${key} from persisted state`);
        delete parsed[key];
        modified = true;
      }
    });
    
    if (modified) {
      // Save the cleaned state back
      localStorage.setItem('persist:hockey-hub-root', JSON.stringify(parsed));
      console.log('✅ Persisted state fixed. Please refresh the page.');
    } else {
      console.log('No problematic keys found in persisted state');
    }
  } catch (error) {
    console.error('Failed to fix persisted state:', error);
  }
};

// Export utilities to window for easy access in console
if (typeof window !== 'undefined') {
  (window as any).clearPersistedState = clearPersistedState;
  (window as any).inspectPersistedState = inspectPersistedState;
  (window as any).fixPersistedState = fixPersistedState;
  
  console.log(`
Redux Persist Utilities Available:
- window.clearPersistedState() - Clear all persisted state
- window.inspectPersistedState() - Inspect current persisted state
- window.fixPersistedState() - Fix persisted state by removing problematic keys
  `);
}