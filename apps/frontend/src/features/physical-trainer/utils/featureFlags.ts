/**
 * Feature Flag System for Physical Trainer Performance Optimization
 * Phase 0.2 of Performance Optimization V2
 * 
 * This system allows us to enable/disable optimizations without code changes
 */

export interface PerformanceFeatureFlags {
  // Phase 1: Safe Quick Wins
  OPTIMIZE_FONTS: boolean;
  OPTIMIZE_ICONS: boolean;
  
  // Phase 2: Component Optimization
  LAZY_LOAD_MODALS: boolean;
  PROGRESSIVE_TABS: boolean;
  DEFER_INITIALIZATION: boolean;
  DEFER_WEBSOCKET: boolean;
  DEFER_KEYBOARD_SHORTCUTS: boolean;
  
  // Phase 3: Advanced Optimizations
  LIGHTWEIGHT_CHARTS: boolean;
  VIRTUAL_SCROLLING: boolean;
  
  // Monitoring & Debug
  PERFORMANCE_MONITORING: boolean;
  PERFORMANCE_DASHBOARD: boolean;
  DEBUG_MODE: boolean;
}

// Default flag values (all disabled for safety)
const DEFAULT_FLAGS: PerformanceFeatureFlags = {
  // Phase 1
  OPTIMIZE_FONTS: false,
  OPTIMIZE_ICONS: false,
  
  // Phase 2
  LAZY_LOAD_MODALS: false,
  PROGRESSIVE_TABS: false,
  DEFER_INITIALIZATION: false,
  DEFER_WEBSOCKET: false,
  DEFER_KEYBOARD_SHORTCUTS: false,
  
  // Phase 3
  LIGHTWEIGHT_CHARTS: false,
  VIRTUAL_SCROLLING: false,
  
  // Monitoring
  PERFORMANCE_MONITORING: true, // Safe to enable
  PERFORMANCE_DASHBOARD: process.env.NODE_ENV === 'development',
  DEBUG_MODE: process.env.NODE_ENV === 'development'
};

class FeatureFlagService {
  private flags: PerformanceFeatureFlags;
  private storageKey = 'physicalTrainer_performanceFlags';
  private listeners: Set<(flags: PerformanceFeatureFlags) => void> = new Set();

  constructor() {
    this.flags = this.loadFlags();
  }

  /**
   * Get current value of a feature flag
   */
  getFlag<K extends keyof PerformanceFeatureFlags>(flag: K): PerformanceFeatureFlags[K] {
    return this.flags[flag];
  }

  /**
   * Set a feature flag value
   */
  setFlag<K extends keyof PerformanceFeatureFlags>(flag: K, value: PerformanceFeatureFlags[K]): void {
    this.flags[flag] = value;
    this.saveFlags();
    this.notifyListeners();
    
    if (this.flags.DEBUG_MODE) {
      console.log(`🚩 Feature flag "${flag}" set to:`, value);
    }
  }

  /**
   * Get all flags
   */
  getAllFlags(): PerformanceFeatureFlags {
    return { ...this.flags };
  }

  /**
   * Reset flags to defaults
   */
  resetFlags(): void {
    this.flags = { ...DEFAULT_FLAGS };
    this.saveFlags();
    this.notifyListeners();
    
    if (this.flags.DEBUG_MODE) {
      console.log('🚩 Feature flags reset to defaults');
    }
  }

  /**
   * Enable a set of flags for a specific phase
   */
  enablePhase(phase: 'phase1' | 'phase2' | 'phase3'): void {
    switch (phase) {
      case 'phase1':
        this.flags.OPTIMIZE_FONTS = true;
        this.flags.OPTIMIZE_ICONS = true;
        break;
      
      case 'phase2':
        // Include phase 1
        this.enablePhase('phase1');
        this.flags.LAZY_LOAD_MODALS = true;
        this.flags.PROGRESSIVE_TABS = true;
        break;
      
      case 'phase3':
        // Include phase 1 & 2
        this.enablePhase('phase2');
        this.flags.LIGHTWEIGHT_CHARTS = true;
        this.flags.VIRTUAL_SCROLLING = true;
        break;
    }
    
    this.saveFlags();
    this.notifyListeners();
    
    if (this.flags.DEBUG_MODE) {
      console.log(`🚩 Enabled ${phase} feature flags`);
    }
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(callback: (flags: PerformanceFeatureFlags) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Check if it's safe to proceed with optimizations
   */
  isSafeToOptimize(): boolean {
    // Check for any previous issues stored in localStorage
    const hasIssues = localStorage.getItem('physicalTrainer_performanceIssues');
    if (hasIssues) {
      console.warn('⚠️ Previous performance optimization issues detected');
      return false;
    }
    return true;
  }

  /**
   * Report an issue with a specific flag
   */
  reportIssue(flag: keyof PerformanceFeatureFlags, issue: string): void {
    console.error(`❌ Issue with flag "${flag}":`, issue);
    
    // Disable the problematic flag
    this.setFlag(flag, false as any);
    
    // Store issue for future reference
    const issues = JSON.parse(localStorage.getItem('physicalTrainer_performanceIssues') || '{}');
    issues[flag] = {
      issue,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('physicalTrainer_performanceIssues', JSON.stringify(issues));
  }

  /**
   * Clear all reported issues
   */
  clearIssues(): void {
    localStorage.removeItem('physicalTrainer_performanceIssues');
    console.log('✅ Performance issues cleared');
  }

  private loadFlags(): PerformanceFeatureFlags {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_FLAGS };
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all flags exist
        return { ...DEFAULT_FLAGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }

    return { ...DEFAULT_FLAGS };
  }

  private saveFlags(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.flags));
    } catch (error) {
      console.error('Failed to save feature flags:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getAllFlags()));
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagService();

// React hook for using feature flags
import { useState, useEffect } from 'react';

export function useFeatureFlag<K extends keyof PerformanceFeatureFlags>(
  flag: K
): PerformanceFeatureFlags[K] {
  const [value, setValue] = useState(() => featureFlags.getFlag(flag));

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = featureFlags.subscribe((flags) => {
      setValue(flags[flag]);
    });

    return unsubscribe;
  }, [flag]);

  return value;
}

/**
 * Hook to get all feature flags
 */
export function useFeatureFlags(): PerformanceFeatureFlags {
  const [flags, setFlags] = useState(() => featureFlags.getAllFlags());

  useEffect(() => {
    const unsubscribe = featureFlags.subscribe(setFlags);
    return unsubscribe;
  }, []);

  return flags;
}