'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFeatureFlag } from '../../utils/featureFlags';
import { performanceMonitor } from '../../utils/performanceMonitor';

interface ProgressiveTabProps {
  tabKey: string;
  isActive: boolean;
  children: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  preload?: boolean;
}

/**
 * Progressive Tab Loading Component
 * Phase 2.2 - Only render tab content when it's active or has been activated before
 */
export function ProgressiveTab({ 
  tabKey, 
  isActive, 
  children, 
  priority = 'medium',
  preload = false 
}: ProgressiveTabProps) {
  const isProgressiveTabsEnabled = useFeatureFlag('PROGRESSIVE_TABS');
  const [hasBeenActive, setHasBeenActive] = useState(isActive);
  const [shouldRender, setShouldRender] = useState(false);
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isProgressiveTabsEnabled) {
      // If feature flag is disabled, always render
      setShouldRender(true);
      return;
    }

    // Track if tab has ever been active
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
      performanceMonitor.startMeasure(`tab-${tabKey}-mount`);
      mountTimeRef.current = performance.now();
    }

    // Determine if we should render based on progressive loading strategy
    if (isActive || hasBeenActive || preload || priority === 'high') {
      setShouldRender(true);
    }
  }, [isActive, hasBeenActive, isProgressiveTabsEnabled, tabKey, priority, preload]);

  useEffect(() => {
    // Track tab mount performance
    if (shouldRender && mountTimeRef.current > 0) {
      performanceMonitor.endMeasure(`tab-${tabKey}-mount`);
      const duration = performance.now() - mountTimeRef.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Tab "${tabKey}" mounted in ${duration.toFixed(2)}ms`);
      }
      
      mountTimeRef.current = 0;
    }
  }, [shouldRender, tabKey]);

  // Don't render anything if progressive loading is enabled and conditions aren't met
  if (isProgressiveTabsEnabled && !shouldRender) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-pulse bg-gray-200 rounded-lg p-8 mb-4" />
          <p className="text-sm text-gray-500">Loading tab content...</p>
        </div>
      </div>
    );
  }

  // Render the tab content
  return (
    <div 
      className={isActive ? 'block' : 'hidden'}
      data-tab={tabKey}
      data-priority={priority}
    >
      {children}
    </div>
  );
}

/**
 * Hook to preload tabs based on user behavior
 */
export function useTabPreloading(currentTab: string) {
  const isProgressiveTabsEnabled = useFeatureFlag('PROGRESSIVE_TABS');
  const [preloadQueue, setPreloadQueue] = useState<string[]>([]);

  useEffect(() => {
    if (!isProgressiveTabsEnabled) return;

    // Predict next likely tab based on common user flows
    const tabPredictions: Record<string, string[]> = {
      'overview': ['sessions', 'calendar'],
      'calendar': ['sessions', 'overview'],
      'sessions': ['templates', 'library'],
      'library': ['sessions', 'templates'],
      'testing': ['status', 'overview'],
      'status': ['overview', 'testing'],
      'templates': ['sessions', 'library'],
    };

    const predictedTabs = tabPredictions[currentTab] || [];
    
    // Schedule preloading after a short delay
    const timer = setTimeout(() => {
      setPreloadQueue(predictedTabs);
    }, 1000); // Wait 1 second before preloading

    return () => clearTimeout(timer);
  }, [currentTab, isProgressiveTabsEnabled]);

  return preloadQueue;
}

/**
 * Tab loading priorities
 */
export const TAB_PRIORITIES: Record<string, 'high' | 'medium' | 'low'> = {
  'overview': 'high',      // Always load overview first
  'sessions': 'high',      // Core functionality
  'calendar': 'medium',    // Important but not critical
  'library': 'medium',     // Can be loaded on demand
  'testing': 'low',        // Less frequently used
  'status': 'medium',      // Important for some users
  'templates': 'low',      // Can be loaded on demand
  'medical': 'low',        // Specialized tab
  'analytics': 'low',      // Heavy tab, load on demand
  'ai': 'low',            // Heavy tab, load on demand
};

/**
 * Progressive tabs container
 */
interface ProgressiveTabsContainerProps {
  activeTab: string;
  children: React.ReactNode;
}

export function ProgressiveTabsContainer({ activeTab, children }: ProgressiveTabsContainerProps) {
  const isEnabled = useFeatureFlag('PROGRESSIVE_TABS');
  const preloadQueue = useTabPreloading(activeTab);

  if (!isEnabled) {
    return <>{children}</>;
  }

  // Clone children and inject progressive loading props
  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props.value) {
          const tabKey = child.props.value;
          const shouldPreload = preloadQueue.includes(tabKey);
          
          return React.cloneElement(child, {
            ...child.props,
            'data-preload': shouldPreload,
            'data-priority': TAB_PRIORITIES[tabKey] || 'medium',
          });
        }
        return child;
      })}
    </>
  );
}