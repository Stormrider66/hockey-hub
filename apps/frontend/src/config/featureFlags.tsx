/**
 * Feature Flags Configuration
 * Centralized feature flags system for managing application features,
 * including demo mode and data source toggles
 */

import * as React from 'react';

/**
 * Feature flag types for type safety
 */
export interface FeatureFlagsConfig {
  // Core application features
  calendar: boolean;
  chat: boolean;
  payments: boolean;
  analytics: boolean;
  aiCoach: boolean;
  bulkSessions: boolean;
  medical: boolean;
  
  // Tactical-specific features
  tactical: {
    enabled: boolean;
    useMockData: boolean;
    enableDemoMode: boolean;
    enableRealTimeUpdates: boolean;
    enableAIAnalysis: boolean;
    enableExports: boolean;
    enableAnimations: boolean;
  };
  
  // Data source flags
  dataSources: {
    planning: boolean;
    statistics: boolean;
    training: boolean;
    communication: boolean;
  };
  
  // Development features
  development: {
    debugMode: boolean;
    showDevTools: boolean;
    mockApi: boolean;
    enableMockAuth: boolean;
  };
  
  // UI features
  ui: {
    imageOptimization: boolean;
    lazyLoadImages: boolean;
    prefetchLinks: boolean;
  };
  
  // Performance features
  performance: {
    cacheTtl: number;
    staleWhileRevalidate: boolean;
  };
}

/**
 * Default feature flags configuration
 */
const defaultFeatureFlags: FeatureFlagsConfig = {
  // Core features from environment variables
  calendar: getEnvBoolean('NEXT_PUBLIC_FEATURE_CALENDAR', true),
  chat: getEnvBoolean('NEXT_PUBLIC_FEATURE_CHAT', true),
  payments: getEnvBoolean('NEXT_PUBLIC_FEATURE_PAYMENTS', true),
  analytics: getEnvBoolean('NEXT_PUBLIC_FEATURE_ANALYTICS', true),
  aiCoach: getEnvBoolean('NEXT_PUBLIC_FEATURE_AI_COACH', false),
  bulkSessions: getEnvBoolean('NEXT_PUBLIC_ENABLE_BULK_SESSIONS', true),
  medical: getEnvBoolean('NEXT_PUBLIC_ENABLE_MEDICAL', true),
  
  // Tactical features
  tactical: {
    enabled: getEnvBoolean('NEXT_PUBLIC_FEATURE_TACTICAL', true),
    useMockData: getEnvBoolean('NEXT_PUBLIC_TACTICAL_USE_MOCK_DATA', true),
    enableDemoMode: getEnvBoolean('NEXT_PUBLIC_TACTICAL_DEMO_MODE', true),
    enableRealTimeUpdates: getEnvBoolean('NEXT_PUBLIC_TACTICAL_REALTIME', true),
    enableAIAnalysis: getEnvBoolean('NEXT_PUBLIC_TACTICAL_AI_ANALYSIS', true),
    enableExports: getEnvBoolean('NEXT_PUBLIC_TACTICAL_EXPORTS', true),
    enableAnimations: getEnvBoolean('NEXT_PUBLIC_TACTICAL_ANIMATIONS', true),
  },
  
  // Data sources
  dataSources: {
    planning: getEnvBoolean('NEXT_PUBLIC_FEATURE_PLANNING_BACKEND', true),
    statistics: getEnvBoolean('NEXT_PUBLIC_FEATURE_STATISTICS_BACKEND', true),
    training: getEnvBoolean('NEXT_PUBLIC_FEATURE_TRAINING_BACKEND', true),
    communication: getEnvBoolean('NEXT_PUBLIC_FEATURE_COMMUNICATION_BACKEND', true),
  },
  
  // Development
  development: {
    debugMode: getEnvBoolean('NEXT_PUBLIC_DEBUG_MODE', false),
    showDevTools: getEnvBoolean('NEXT_PUBLIC_SHOW_DEV_TOOLS', false),
    mockApi: getEnvBoolean('NEXT_PUBLIC_MOCK_API', false),
    enableMockAuth: getEnvBoolean('NEXT_PUBLIC_ENABLE_MOCK_AUTH', false),
  },
  
  // UI features
  ui: {
    imageOptimization: getEnvBoolean('NEXT_PUBLIC_IMAGE_OPTIMIZATION', true),
    lazyLoadImages: getEnvBoolean('NEXT_PUBLIC_LAZY_LOAD_IMAGES', true),
    prefetchLinks: getEnvBoolean('NEXT_PUBLIC_PREFETCH_LINKS', true),
  },
  
  // Performance
  performance: {
    cacheTtl: getEnvNumber('NEXT_PUBLIC_CACHE_TTL', 300000),
    staleWhileRevalidate: getEnvBoolean('NEXT_PUBLIC_STALE_WHILE_REVALIDATE', true),
  },
};

/**
 * Runtime feature flags state
 * Allows for runtime toggling of certain features
 */
class FeatureFlagsManager {
  private flags: FeatureFlagsConfig;
  private listeners: Set<(flags: FeatureFlagsConfig) => void> = new Set();
  private storageKey = 'hockeyhub_feature_flags';

  constructor(initialFlags: FeatureFlagsConfig) {
    this.flags = this.loadFromStorage(initialFlags);
  }

  /**
   * Load flags from localStorage, merging with defaults
   */
  private loadFromStorage(defaultFlags: FeatureFlagsConfig): FeatureFlagsConfig {
    if (typeof window === 'undefined') {
      return defaultFlags;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedFlags = JSON.parse(stored);
        return this.mergeFlags(defaultFlags, parsedFlags);
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
    }

    return defaultFlags;
  }

  /**
   * Deep merge feature flags
   */
  private mergeFlags(base: FeatureFlagsConfig, override: Partial<FeatureFlagsConfig>): FeatureFlagsConfig {
    return {
      ...base,
      tactical: {
        ...base.tactical,
        ...override.tactical,
      },
      dataSources: {
        ...base.dataSources,
        ...override.dataSources,
      },
      development: {
        ...base.development,
        ...override.development,
      },
      ui: {
        ...base.ui,
        ...override.ui,
      },
      performance: {
        ...base.performance,
        ...override.performance,
      },
    };
  }

  /**
   * Save current flags to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  /**
   * Get current feature flags
   */
  getFlags(): FeatureFlagsConfig {
    return { ...this.flags };
  }

  /**
   * Check if a specific feature is enabled
   */
  isEnabled(flagPath: string): boolean {
    const keys = flagPath.split('.');
    let value: any = this.flags;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return false;
      }
    }
    
    return Boolean(value);
  }

  /**
   * Update feature flags
   */
  updateFlags(updates: Partial<FeatureFlagsConfig>): void {
    this.flags = this.mergeFlags(this.flags, updates);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Toggle a specific flag
   */
  toggle(flagPath: string): void {
    const keys = flagPath.split('.');
    const updates = this.createNestedUpdate(keys, !this.isEnabled(flagPath));
    this.updateFlags(updates);
  }

  /**
   * Create nested object for updates
   */
  private createNestedUpdate(keys: string[], value: any): any {
    if (keys.length === 1) {
      return { [keys[0]]: value };
    }
    
    return { [keys[0]]: this.createNestedUpdate(keys.slice(1), value) };
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(listener: (flags: FeatureFlagsConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.flags));
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.flags = { ...defaultFeatureFlags };
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Get tactical demo mode status
   */
  isTacticalDemoMode(): boolean {
    return this.isEnabled('tactical.enableDemoMode') && this.isEnabled('tactical.useMockData');
  }

  /**
   * Enable/disable tactical demo mode
   */
  setTacticalDemoMode(enabled: boolean): void {
    this.updateFlags({
      tactical: {
        ...this.flags.tactical,
        enableDemoMode: enabled,
        useMockData: enabled,
      },
    });
  }
}

/**
 * Utility functions for environment variable parsing
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Global feature flags manager instance
 */
export const featureFlags = new FeatureFlagsManager(defaultFeatureFlags);

/**
 * React hook for using feature flags
 */
export function useFeatureFlags() {
  const [flags, setFlags] = React.useState<FeatureFlagsConfig>(featureFlags.getFlags());

  React.useEffect(() => {
    const unsubscribe = featureFlags.subscribe(setFlags);
    return unsubscribe;
  }, []);

  return {
    flags,
    isEnabled: featureFlags.isEnabled.bind(featureFlags),
    toggle: featureFlags.toggle.bind(featureFlags),
    updateFlags: featureFlags.updateFlags.bind(featureFlags),
    resetToDefaults: featureFlags.resetToDefaults.bind(featureFlags),
    isTacticalDemoMode: featureFlags.isTacticalDemoMode.bind(featureFlags),
    setTacticalDemoMode: featureFlags.setTacticalDemoMode.bind(featureFlags),
  };
}

/**
 * Utility function to check feature flags without hooks
 */
export function isFeatureEnabled(flagPath: string): boolean {
  return featureFlags.isEnabled(flagPath);
}

/**
 * Development-only feature flag panel component
 */
export function FeatureFlagPanel() {
  const { flags, toggle, resetToDefaults, setTacticalDemoMode, isTacticalDemoMode } = useFeatureFlags();

  // Only show in development
  if (!flags.development.debugMode) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border shadow-lg rounded-lg p-4 max-w-sm z-50">
      <h3 className="font-bold mb-2">Feature Flags</h3>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isTacticalDemoMode()}
              onChange={(e) => setTacticalDemoMode(e.target.checked)}
            />
            <span className="text-sm">Tactical Demo Mode</span>
          </label>
        </div>
        
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={flags.tactical.enableAIAnalysis}
              onChange={() => toggle('tactical.enableAIAnalysis')}
            />
            <span className="text-sm">AI Analysis</span>
          </label>
        </div>
        
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={flags.tactical.enableAnimations}
              onChange={() => toggle('tactical.enableAnimations')}
            />
            <span className="text-sm">Animations</span>
          </label>
        </div>
        
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={flags.tactical.enableExports}
              onChange={() => toggle('tactical.enableExports')}
            />
            <span className="text-sm">Exports</span>
          </label>
        </div>
        
        <button
          onClick={resetToDefaults}
          className="text-xs bg-gray-500 text-white px-2 py-1 rounded mt-2"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

export default featureFlags;