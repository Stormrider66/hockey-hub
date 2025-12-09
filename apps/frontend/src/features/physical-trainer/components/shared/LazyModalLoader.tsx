'use client';

import React, { lazy, Suspense } from 'react';
import { useFeatureFlag } from '../../utils/featureFlags';
import { performanceMonitor } from '../../utils/performanceMonitor';

/**
 * Optimized Lazy Modal Loader
 * Phase 2.1 - Feature flag controlled lazy loading for modals
 */

// Loading fallback component
function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    </div>
  );
}

interface LazyModalProps {
  isOpen: boolean;
  modalName: string;
  children: React.ReactNode;
}

/**
 * Wrapper to track modal loading performance
 */
export function LazyModalWrapper({ isOpen, modalName, children }: LazyModalProps) {
  const isLazyLoadEnabled = useFeatureFlag('LAZY_LOAD_MODALS');

  React.useEffect(() => {
    if (isOpen && isLazyLoadEnabled) {
      performanceMonitor.startMeasure(`modal-${modalName}-load`);
      
      return () => {
        performanceMonitor.endMeasure(`modal-${modalName}-load`);
      };
    }
  }, [isOpen, isLazyLoadEnabled, modalName]);

  if (!isLazyLoadEnabled || !isOpen) {
    return <>{isOpen && children}</>;
  }

  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      {children}
    </Suspense>
  );
}

// Export lazy loaded modal components
export const LazyWorkoutSuccessModal = lazy(() => 
  import('./WorkoutSuccessModal').then(module => ({ 
    default: module.WorkoutSuccessModal 
  }))
);

export const LazyWorkoutDetailsModal = lazy(() => 
  import('../WorkoutDetailsModal').then(module => ({ 
    default: module.WorkoutDetailsModal 
  }))
);

export const LazyCreateSessionModal = lazy(() => 
  import('../CreateSessionModal')
);

export const LazyHelpModal = lazy(() => 
  import('./HelpModal').then(module => ({ 
    default: module.HelpModal 
  }))
);

export const LazySettingsModal = lazy(() => 
  import('./SettingsModal').then(module => ({ 
    default: module.SettingsModal 
  }))
);

export const LazyExerciseFormModal = lazy(() => 
  import('../ExerciseFormModal')
);

export const LazyMedicalReportModal = lazy(() => 
  import('../SessionBuilder/MedicalReportModal')
);

export const LazyExportOptionsModal = lazy(() => 
  import('../analytics/ExportOptionsModal').then(module => ({ 
    default: module.ExportOptionsModal 
  }))
);

// Preload function for critical modals (without hook dependency)
export function preloadCriticalModals() {
  // Preload modals that are likely to be used
  import('./WorkoutSuccessModal').catch(() => {});
  import('../WorkoutDetailsModal').catch(() => {});
}