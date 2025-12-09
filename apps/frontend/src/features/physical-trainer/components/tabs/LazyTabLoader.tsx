'use client';

import React, { lazy, Suspense, useMemo, useRef, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

interface LazyTabLoaderProps {
  tabName: string;
  [key: string]: any;
}

// Map of tab names to their import functions
const tabImportMap: Record<string, () => Promise<any>> = {
  overview: () => import('./OverviewTab'),
  calendar: () => import('./CalendarTab'),
  sessions: () => import('./SessionsTab'),
  library: () => import('./ExerciseLibraryTab'),
  testing: () => import('./TestingTab'),
  status: () => import('./PlayerStatusTab'),
  templates: () => import('./TemplatesTab'),
  medical: () => import('./MedicalAnalyticsTab').then(mod => ({ default: mod.MedicalAnalyticsTab })),
  analytics: () => import('./PredictiveAnalyticsTab').then(mod => ({ default: mod.PredictiveAnalyticsTab })),
  'ai-optimization': () => import('./AIOptimizationTab').then(mod => ({ default: mod.AIOptimizationTab })),
};

// Cache for preloaded tab modules
const preloadedModules = new Map<string, Promise<any>>();

// Cache for rendered tab components with their props
interface CachedTab {
  component: React.ComponentType<any>;
  lastProps: any;
  lastRendered: number;
}

const renderedTabsCache = new Map<string, CachedTab>();

// Maximum age for cached tabs (5 minutes)
const CACHE_MAX_AGE = 5 * 60 * 1000;

// Cleanup old cached tabs
const cleanupCache = () => {
  const now = Date.now();
  renderedTabsCache.forEach((cached, key) => {
    if (now - cached.lastRendered > CACHE_MAX_AGE) {
      renderedTabsCache.delete(key);
    }
  });
};

// Preload a tab module
export const preloadTab = (tabName: string) => {
  if (!preloadedModules.has(tabName) && tabImportMap[tabName]) {
    const modulePromise = tabImportMap[tabName]();
    preloadedModules.set(tabName, modulePromise);
    
    // Preload the module but don't wait for it
    modulePromise.catch(err => {
      console.error(`Failed to preload tab ${tabName}:`, err);
      preloadedModules.delete(tabName);
    });
  }
};

// Preload multiple tabs
export const preloadTabs = (tabNames: string[]) => {
  tabNames.forEach(preloadTab);
};

export const LazyTabLoader: React.FC<LazyTabLoaderProps> = ({ tabName, ...props }) => {
  const cacheCleanupRef = useRef<NodeJS.Timeout>();
  
  // Cleanup cache periodically
  useEffect(() => {
    cacheCleanupRef.current = setInterval(cleanupCache, 60000); // Cleanup every minute
    return () => {
      if (cacheCleanupRef.current) {
        clearInterval(cacheCleanupRef.current);
      }
    };
  }, []);
  
  // Create or get the lazy component
  const TabComponent = useMemo(() => {
    const importFn = tabImportMap[tabName];
    if (!importFn) {
      return () => <div>Unknown tab: {tabName}</div>;
    }
    
    // Check if we already have a cached component
    const cached = renderedTabsCache.get(tabName);
    if (cached) {
      // Update last rendered time
      cached.lastRendered = Date.now();
      cached.lastProps = props;
      return cached.component;
    }
    
    // Create lazy component, use preloaded module if available
    const lazyComponent = lazy(() => {
      const preloaded = preloadedModules.get(tabName);
      if (preloaded) {
        return preloaded;
      }
      return importFn();
    });
    
    // Cache the component
    renderedTabsCache.set(tabName, {
      component: lazyComponent,
      lastProps: props,
      lastRendered: Date.now()
    });
    
    return lazyComponent;
  }, [tabName, props]);

  return (
    <Suspense fallback={<LoadingSpinner className="h-64" />}>
      <TabComponent {...props} />
    </Suspense>
  );
};