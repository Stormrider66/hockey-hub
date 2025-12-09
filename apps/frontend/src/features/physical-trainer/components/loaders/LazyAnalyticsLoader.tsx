'use client';

import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';
import { LoaderErrorBoundary } from './LoaderErrorBoundary';
import { PerformanceMonitor } from './PerformanceMonitor';

// Lazy load analytics components for code splitting
const PerformanceAnalyticsDashboard = React.lazy(() => 
  import('../analytics/PerformanceAnalyticsDashboard')
);

const AnalyticsDashboard = React.lazy(() => 
  import('../analytics/AnalyticsDashboard')
);

const TeamPerformanceView = React.lazy(() => 
  import('../analytics/TeamPerformanceView')
);

const IndividualPerformanceView = React.lazy(() => 
  import('../analytics/IndividualPerformanceView')
);

const WorkoutEffectivenessMetrics = React.lazy(() => 
  import('../analytics/WorkoutEffectivenessMetrics')
);

const PerformanceComparisonTool = React.lazy(() => 
  import('../analytics/PerformanceComparisonTool')
);

const LoadManagementPanel = React.lazy(() => 
  import('../analytics/LoadManagementPanel')
);

const PlayerAnalytics = React.lazy(() => 
  import('../analytics/PlayerAnalytics')
);

// Advanced analytics components
const AdvancedPerformanceAnalyticsDashboard = React.lazy(() => 
  import('../advanced/PerformanceAnalyticsDashboard')
);

export type AnalyticsComponentType = 
  | 'performanceDashboard' 
  | 'analyticsDashboard'
  | 'teamPerformance' 
  | 'individualPerformance' 
  | 'workoutEffectiveness' 
  | 'performanceComparison' 
  | 'loadManagement'
  | 'playerAnalytics'
  | 'advancedPerformance';

interface LazyAnalyticsLoaderProps {
  componentType: AnalyticsComponentType;
  className?: string;
  [key: string]: any; // Allow additional props specific to each component
}

export const LazyAnalyticsLoader = React.memo(function LazyAnalyticsLoader({
  componentType,
  className,
  ...componentProps
}: LazyAnalyticsLoaderProps) {
  const LoadingFallback = (
    <div className={`flex items-center justify-center min-h-[400px] ${className || ''}`}>
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <p className="text-muted-foreground">
          Loading analytics...
        </p>
      </div>
    </div>
  );

  return (
    <LoaderErrorBoundary componentName={componentType}>
      <PerformanceMonitor componentName={`Analytics-${componentType}`}>
        <Suspense fallback={LoadingFallback}>
          {componentType === 'performanceDashboard' && (
            <PerformanceAnalyticsDashboard
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'analyticsDashboard' && (
            <AnalyticsDashboard
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'teamPerformance' && (
            <TeamPerformanceView
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'individualPerformance' && (
            <IndividualPerformanceView
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'workoutEffectiveness' && (
            <WorkoutEffectivenessMetrics
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'performanceComparison' && (
            <PerformanceComparisonTool
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'loadManagement' && (
            <LoadManagementPanel
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'playerAnalytics' && (
            <PlayerAnalytics
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'advancedPerformance' && (
            <AdvancedPerformanceAnalyticsDashboard
              className={className}
              {...componentProps}
            />
          )}
        </Suspense>
      </PerformanceMonitor>
    </LoaderErrorBoundary>
  );
});