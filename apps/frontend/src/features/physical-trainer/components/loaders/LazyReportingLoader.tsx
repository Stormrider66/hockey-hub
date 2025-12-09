'use client';

import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';
import { LoaderErrorBoundary } from './LoaderErrorBoundary';
import { PerformanceMonitor } from './PerformanceMonitor';

// Lazy load reporting components
const ReportBuilder = React.lazy(() => 
  Promise.resolve({ default: () => <div>ReportBuilder temporarily disabled - missing dependencies</div> })
);

const ReportTemplateLibrary = React.lazy(() => 
  import('../reporting/ReportTemplateLibrary')
);

const ReportScheduler = React.lazy(() => 
  import('../reporting/ReportScheduler')
);

// Also check for reports directory components
const ReportsReportBuilder = React.lazy(() => 
  Promise.resolve({ default: () => null })
);

export type ReportingComponentType = 'builder' | 'templateLibrary' | 'scheduler';

interface LazyReportingLoaderProps {
  componentType: ReportingComponentType;
  className?: string;
  [key: string]: any; // Allow additional props specific to each component
}

export const LazyReportingLoader = React.memo(function LazyReportingLoader({
  componentType,
  className,
  ...componentProps
}: LazyReportingLoaderProps) {
  const LoadingFallback = (
    <div className={`flex items-center justify-center min-h-[400px] ${className || ''}`}>
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <p className="text-muted-foreground">
          Loading reporting tools...
        </p>
      </div>
    </div>
  );

  return (
    <LoaderErrorBoundary componentName={componentType}>
      <PerformanceMonitor componentName={`Reporting-${componentType}`}>
        <Suspense fallback={LoadingFallback}>
          {componentType === 'builder' && (
            <ReportBuilder
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'templateLibrary' && (
            <ReportTemplateLibrary
              className={className}
              {...componentProps}
            />
          )}
          {componentType === 'scheduler' && (
            <ReportScheduler
              className={className}
              {...componentProps}
            />
          )}
        </Suspense>
      </PerformanceMonitor>
    </LoaderErrorBoundary>
  );
});