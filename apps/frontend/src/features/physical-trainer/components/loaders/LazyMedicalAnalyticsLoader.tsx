'use client';

import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';
import { LoaderErrorBoundary } from './LoaderErrorBoundary';
import { PerformanceMonitor } from './PerformanceMonitor';

// Lazy load medical analytics components
const InjuryPatternAnalyzer = React.lazy(() => 
  import('../medical-analytics/InjuryPatternAnalyzer').then(module => ({
    default: module.InjuryPatternAnalyzer
  }))
);

const ReturnToPlayDashboard = React.lazy(() => 
  import('../medical-analytics/ReturnToPlayDashboard').then(module => ({
    default: module.ReturnToPlayDashboard
  }))
);

const MedicalAnalyticsDashboard = React.lazy(() => 
  import('../medical-analytics/MedicalAnalyticsDashboard').then(module => ({
    default: module.MedicalAnalyticsDashboard
  }))
);

export type MedicalAnalyticsType = 'injuryPattern' | 'returnToPlay' | 'medicalDashboard';

interface LazyMedicalAnalyticsLoaderProps {
  componentType: MedicalAnalyticsType;
  className?: string;
  [key: string]: any; // Allow additional props specific to each component
}

export const LazyMedicalAnalyticsLoader = React.memo(function LazyMedicalAnalyticsLoader({
  componentType,
  className,
  ...componentProps
}: LazyMedicalAnalyticsLoaderProps) {
  const LoadingFallback = (
    <div className={`flex items-center justify-center min-h-[400px] ${className || ''}`}>
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <p className="text-muted-foreground">
          Loading medical analytics...
        </p>
      </div>
    </div>
  );

  return (
    <LoaderErrorBoundary componentName={componentType}>
      <PerformanceMonitor componentName={`MedicalAnalytics-${componentType}`}>
        <Suspense fallback={LoadingFallback}>
          {componentType === 'injuryPattern' && (
            <InjuryPatternAnalyzer
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'returnToPlay' && (
            <ReturnToPlayDashboard
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'medicalDashboard' && (
            <MedicalAnalyticsDashboard
              className={className}
              {...componentProps}
            />
          )}
        </Suspense>
      </PerformanceMonitor>
    </LoaderErrorBoundary>
  );
});