'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useFeatureFlag } from '../utils/featureFlags';
import { performanceMonitor } from '../utils/performanceMonitor';

interface DeferredInitOptions {
  timeout?: number;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Hook for deferring non-critical initialization
 * Phase 2.3 - Defer initialization of features until browser is idle
 */
export function useDeferredInitialization(
  initCallback: () => void | (() => void),
  dependencies: React.DependencyList = [],
  options: DeferredInitOptions = {}
) {
  const { timeout = 5000, priority = 'normal' } = options;
  const isDeferEnabled = useFeatureFlag('DEFER_INITIALIZATION');
  const [isInitialized, setIsInitialized] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If feature flag is disabled, initialize immediately
    if (!isDeferEnabled) {
      performanceMonitor.startMeasure('immediate-init');
      const cleanup = initCallback();
      performanceMonitor.endMeasure('immediate-init');
      
      if (typeof cleanup === 'function') {
        cleanupRef.current = cleanup;
      }
      setIsInitialized(true);
      return;
    }

    // Different defer strategies based on priority
    const deferInit = () => {
      performanceMonitor.startMeasure(`deferred-init-${priority}`);
      
      const runInit = () => {
        const cleanup = initCallback();
        if (typeof cleanup === 'function') {
          cleanupRef.current = cleanup;
        }
        setIsInitialized(true);
        performanceMonitor.endMeasure(`deferred-init-${priority}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 Deferred initialization completed (priority: ${priority})`);
        }
      };

      switch (priority) {
        case 'high':
          // High priority: Use setTimeout with short delay
          timeoutRef.current = setTimeout(runInit, 100);
          break;
          
        case 'low':
          // Low priority: Wait for idle or timeout
          if ('requestIdleCallback' in window) {
            const idleCallbackId = window.requestIdleCallback(runInit, { timeout });
            // Store cleanup for idle callback
            cleanupRef.current = () => {
              if ('cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleCallbackId);
              }
            };
          } else {
            timeoutRef.current = setTimeout(runInit, timeout);
          }
          break;
          
        case 'normal':
        default:
          // Normal priority: Use requestIdleCallback with shorter timeout
          if ('requestIdleCallback' in window) {
            const idleCallbackId = window.requestIdleCallback(runInit, { timeout: timeout / 2 });
            cleanupRef.current = () => {
              if ('cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleCallbackId);
              }
            };
          } else {
            timeoutRef.current = setTimeout(runInit, 1000);
          }
          break;
      }
    };

    deferInit();

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [...dependencies, isDeferEnabled, priority, timeout]);

  return isInitialized;
}


/**
 * Hook for managing multiple deferred initializations
 * This hook returns a component that can be rendered to handle initializations
 */
export function useDeferredInitializations() {
  const isDeferEnabled = useFeatureFlag('DEFER_INITIALIZATION');
  const [initializedSystems, setInitializedSystems] = useState<Set<string>>(new Set());
  const [pendingSystems, setPendingSystems] = useState<Array<{
    systemName: string;
    initCallback: () => void | (() => void);
    options: DeferredInitOptions;
  }>>([]);

  const handleInitialized = useCallback((systemName: string) => {
    setInitializedSystems(prev => new Set(prev).add(systemName));
  }, []);

  const deferInit = useCallback((
    systemName: string,
    initCallback: () => void | (() => void),
    options: DeferredInitOptions = {}
  ) => {
    // Add to pending systems if not already initialized
    if (!initializedSystems.has(systemName)) {
      setPendingSystems(prev => {
        // Check if already pending
        if (prev.some(s => s.systemName === systemName)) {
          return prev;
        }
        return [...prev, { systemName, initCallback, options }];
      });
    }
  }, [initializedSystems]);

  const isSystemInitialized = useCallback((systemName: string) => {
    return !isDeferEnabled || initializedSystems.has(systemName);
  }, [isDeferEnabled, initializedSystems]);

  // Since we can't use JSX in a .ts file, we'll use effects directly
  useEffect(() => {
    pendingSystems.forEach(({ systemName, initCallback, options }) => {
      if (!initializedSystems.has(systemName)) {
        const { timeout = 5000, priority = 'normal' } = options;
        
        // If feature flag is disabled, initialize immediately
        if (!isDeferEnabled) {
          performanceMonitor.startMeasure(`immediate-init-${systemName}`);
          const cleanup = initCallback();
          performanceMonitor.endMeasure(`immediate-init-${systemName}`);
          
          if (typeof cleanup === 'function') {
            // Store cleanup function for later
          }
          handleInitialized(systemName);
          return;
        }

        // Different defer strategies based on priority
        const runInit = () => {
          performanceMonitor.startMeasure(`deferred-init-${systemName}-${priority}`);
          const cleanup = initCallback();
          if (typeof cleanup === 'function') {
            // Store cleanup function for later
          }
          handleInitialized(systemName);
          performanceMonitor.endMeasure(`deferred-init-${systemName}-${priority}`);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Deferred initialization completed: ${systemName} (priority: ${priority})`);
          }
        };

        switch (priority) {
          case 'high':
            setTimeout(runInit, 100);
            break;
            
          case 'low':
            if ('requestIdleCallback' in window) {
              window.requestIdleCallback(runInit, { timeout });
            } else {
              setTimeout(runInit, timeout);
            }
            break;
            
          case 'normal':
          default:
            if ('requestIdleCallback' in window) {
              window.requestIdleCallback(runInit, { timeout: timeout / 2 });
            } else {
              setTimeout(runInit, 1000);
            }
            break;
        }
      }
    });
  }, [pendingSystems, initializedSystems, isDeferEnabled, handleInitialized]);

  return {
    deferInit,
    isSystemInitialized,
    initializedSystems: Array.from(initializedSystems),
  };
}

/**
 * Common non-critical systems that can be deferred
 */
export const DEFERRED_SYSTEMS = {
  KEYBOARD_SHORTCUTS: 'keyboard-shortcuts',
  ANALYTICS: 'analytics',
  HELP_SYSTEM: 'help-system',
  TOOLTIPS: 'tooltips',
  TOUR: 'tour',
  NOTIFICATIONS: 'notifications',
  WEBSOCKET: 'websocket',
  PERFORMANCE_MONITORING: 'performance-monitoring',
} as const;

export type DeferredSystem = typeof DEFERRED_SYSTEMS[keyof typeof DEFERRED_SYSTEMS];