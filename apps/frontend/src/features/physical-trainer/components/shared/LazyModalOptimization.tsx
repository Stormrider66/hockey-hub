'use client';

import React, { lazy, Suspense } from 'react';
import { useFeatureFlag } from '../../utils/featureFlags';

/**
 * Lazy Modal Optimization Wrapper
 * Phase 2.1 - Lazy Load Heavy Modals
 * 
 * This component provides feature-flag controlled lazy loading for modals
 */

interface LazyModalConfig {
  name: string;
  importPath: () => Promise<any>;
  extractDefault?: boolean;
}

// Configuration for all modals that should be lazy loaded
export const LAZY_MODAL_CONFIGS: Record<string, LazyModalConfig> = {
  CreateSessionModal: {
    name: 'CreateSessionModal',
    importPath: () => import('../CreateSessionModal'),
    extractDefault: true,
  },
  HelpModal: {
    name: 'HelpModal',
    importPath: () => import('./HelpModal').then(m => ({ default: m.HelpModal })),
  },
  SettingsModal: {
    name: 'SettingsModal',
    importPath: () => import('./SettingsModal').then(m => ({ default: m.SettingsModal })),
  },
  WorkoutDetailsModal: {
    name: 'WorkoutDetailsModal',
    importPath: () => import('../WorkoutDetailsModal').then(m => ({ default: m.WorkoutDetailsModal })),
  },
  ExerciseFormModal: {
    name: 'ExerciseFormModal',
    importPath: () => import('../ExerciseFormModal'),
    extractDefault: true,
  },
  MedicalReportModal: {
    name: 'MedicalReportModal',
    importPath: () => import('../SessionBuilder/MedicalReportModal'),
    extractDefault: true,
  },
  VideoPlayerModal: {
    name: 'VideoPlayerModal',
    importPath: () => import('../VideoPlayerModal'),
    extractDefault: true,
  },
  ExportOptionsModal: {
    name: 'ExportOptionsModal',
    importPath: () => import('../analytics/ExportOptionsModal'),
    extractDefault: true,
  },
};

/**
 * Create a lazy-loaded modal component with feature flag control
 */
export function createLazyModal<T extends React.ComponentType<any>>(
  config: LazyModalConfig
): React.LazyExoticComponent<T> {
  const isLazyLoadEnabled = useFeatureFlag('LAZY_LOAD_MODALS');
  
  if (!isLazyLoadEnabled) {
    // If feature flag is disabled, return a component that imports synchronously
    // This is for testing and rollback purposes
    return lazy(async () => {
      console.warn(`Lazy loading disabled for ${config.name}, loading synchronously`);
      return config.importPath();
    });
  }
  
  // Normal lazy loading
  return lazy(config.importPath);
}

/**
 * Modal Loading Fallback Component
 */
export function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper component for lazy-loaded modals
 */
export function LazyModalWrapper({ 
  children, 
  fallback = <ModalLoadingFallback /> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlag('LAZY_LOAD_MODALS');
  
  if (!isEnabled) {
    // If lazy loading is disabled, render children directly
    return <>{children}</>;
  }
  
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * Hook to track modal loading performance
 */
export function useModalLoadingMetrics(modalName: string) {
  const isEnabled = useFeatureFlag('LAZY_LOAD_MODALS');
  
  React.useEffect(() => {
    if (!isEnabled) return;
    
    // Mark when modal starts loading
    performance.mark(`modal-${modalName}-load-start`);
    
    return () => {
      // Mark when modal finishes loading
      performance.mark(`modal-${modalName}-load-end`);
      try {
        performance.measure(
          `modal-${modalName}-load`,
          `modal-${modalName}-load-start`,
          `modal-${modalName}-load-end`
        );
        
        const measure = performance.getEntriesByName(`modal-${modalName}-load`)[0];
        if (measure && process.env.NODE_ENV === 'development') {
          console.log(`📊 Modal "${modalName}" loaded in ${measure.duration.toFixed(2)}ms`);
        }
      } catch (e) {
        // Ignore measurement errors
      }
    };
  }, [isEnabled, modalName]);
}

/**
 * Preload a modal (useful for modals likely to be opened)
 */
export function preloadModal(modalName: keyof typeof LAZY_MODAL_CONFIGS) {
  const config = LAZY_MODAL_CONFIGS[modalName];
  if (config) {
    config.importPath().catch(() => {
      console.error(`Failed to preload modal: ${modalName}`);
    });
  }
}