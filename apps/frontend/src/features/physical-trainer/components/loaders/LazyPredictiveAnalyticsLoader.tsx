'use client';

import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';
import { LoaderErrorBoundary } from './LoaderErrorBoundary';
import { PerformanceMonitor } from './PerformanceMonitor';

// Lazy load predictive analytics components
const FatigueMonitoringPanel = React.lazy(() => 
  import('../predictive/FatigueMonitoringPanel')
);

const InjuryRiskDashboard = React.lazy(() => 
  import('../predictive/InjuryRiskDashboard')
);

const FatigueMonitor = React.lazy(() => 
  import('../predictive/FatigueMonitor')
);

const InjuryRiskIndicator = React.lazy(() => 
  import('../predictive/InjuryRiskIndicator')
);

const LoadRecommendationWidget = React.lazy(() => 
  import('../predictive/LoadRecommendationWidget')
);

const PlateauDetectionAlert = React.lazy(() => 
  import('../predictive/PlateauDetectionAlert')
);

const PredictiveInsightsPanel = React.lazy(() => 
  import('../predictive/PredictiveInsightsPanel')
);

const RecoveryRecommendations = React.lazy(() => 
  import('../predictive/RecoveryRecommendations')
);

const RiskFactorsBreakdown = React.lazy(() => 
  import('../predictive/RiskFactorsBreakdown')
);

export type PredictiveAnalyticsType = 
  | 'fatigueMonitoring' 
  | 'injuryRisk' 
  | 'fatigueMonitor' 
  | 'injuryRiskIndicator' 
  | 'loadRecommendation' 
  | 'plateauDetection' 
  | 'predictiveInsights' 
  | 'recoveryRecommendations' 
  | 'riskFactors';

interface LazyPredictiveAnalyticsLoaderProps {
  componentType: PredictiveAnalyticsType;
  className?: string;
  [key: string]: any; // Allow additional props specific to each component
}

export const LazyPredictiveAnalyticsLoader = React.memo(function LazyPredictiveAnalyticsLoader({
  componentType,
  className,
  ...componentProps
}: LazyPredictiveAnalyticsLoaderProps) {
  const LoadingFallback = (
    <div className={`flex items-center justify-center min-h-[200px] ${className || ''}`}>
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <p className="text-muted-foreground">
          Loading predictive analytics...
        </p>
      </div>
    </div>
  );

  return (
    <LoaderErrorBoundary componentName={componentType}>
      <PerformanceMonitor componentName={`PredictiveAnalytics-${componentType}`}>
        <Suspense fallback={LoadingFallback}>
          {componentType === 'fatigueMonitoring' && (
            <FatigueMonitoringPanel
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'injuryRisk' && (
            <InjuryRiskDashboard
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'fatigueMonitor' && (
            <FatigueMonitor
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'injuryRiskIndicator' && (
            <InjuryRiskIndicator
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'loadRecommendation' && (
            <LoadRecommendationWidget
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'plateauDetection' && (
            <PlateauDetectionAlert
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'predictiveInsights' && (
            <PredictiveInsightsPanel
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'recoveryRecommendations' && (
            <RecoveryRecommendations
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'riskFactors' && (
            <RiskFactorsBreakdown
              className={className}
              {...componentProps}
            />
          )}
        </Suspense>
      </PerformanceMonitor>
    </LoaderErrorBoundary>
  );
});