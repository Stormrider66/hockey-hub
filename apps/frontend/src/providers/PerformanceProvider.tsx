'use client';

import React, { useEffect } from 'react';
import { useWebVitals } from '@/hooks/useWebVitals';
import { ErrorTracker } from '@/services/error/ErrorTracker';
import { PerformanceMonitor } from '@/services/performance/PerformanceMonitor';
import { PerformanceThresholds } from '@/services/performance/PerformanceThresholds';
import { createTimedFetch } from '@/utils/performance/trackApiTiming';
import { usePathname } from 'next/navigation';

interface PerformanceProviderProps {
  children: React.ReactNode;
  config?: {
    enableWebVitals?: boolean;
    enableErrorTracking?: boolean;
    enableApiTracking?: boolean;
    environment?: string;
    userId?: string;
  };
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const {
    enableWebVitals = true,
    enableErrorTracking = true,
    enableApiTracking = true,
    environment = process.env.NODE_ENV,
    userId
  } = config;

  const pathname = usePathname();

  // Initialize error tracking
  useEffect(() => {
    if (enableErrorTracking) {
      ErrorTracker.init({
        enabled: true,
        environment,
        release: process.env.NEXT_PUBLIC_APP_VERSION,
        sampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
      });

      // Set user context if available
      if (userId) {
        ErrorTracker.setUser({ id: userId });
      }
    }
  }, [enableErrorTracking, environment, userId]);

  // Track web vitals
  useWebVitals({
    enabled: enableWebVitals,
    thresholds: {
      LCP: PerformanceThresholds.WEB_VITALS.LCP.critical,
      FID: PerformanceThresholds.WEB_VITALS.FID.critical,
      CLS: PerformanceThresholds.WEB_VITALS.CLS.critical,
      FCP: PerformanceThresholds.WEB_VITALS.FCP.critical,
      TTFB: PerformanceThresholds.WEB_VITALS.TTFB.critical
    },
    reportHandler: (metric) => {
      // Custom handling for critical metrics
      if (metric.rating === 'poor') {
        ErrorTracker.addBreadcrumb({
          type: 'custom',
          category: 'performance',
          message: `Poor ${metric.name}: ${metric.value}`,
          level: 'warning',
          data: { metric: metric.name, value: metric.value, rating: metric.rating }
        });
      }
    }
  });

  // Track route changes
  useEffect(() => {
    const startTime = performance.now();
    
    // Mark route change
    PerformanceMonitor.mark('route-change', {
      path: pathname,
      previousPath: document.referrer
    });

    // Add breadcrumb
    ErrorTracker.addBreadcrumb({
      type: 'navigation',
      category: 'navigation',
      message: `Navigated to ${pathname}`,
      level: 'info',
      data: { path: pathname }
    });

    // Measure route transition time
    return () => {
      const duration = performance.now() - startTime;
      if (duration > 100) {
        console.log(`[Performance] Route ${pathname} took ${duration.toFixed(0)}ms to render`);
      }
    };
  }, [pathname]);

  // Replace global fetch with timed version
  useEffect(() => {
    if (enableApiTracking && typeof window !== 'undefined') {
      // Check if fetch is already wrapped
      if ((window.fetch as any).__isTimedFetch) {
        return; // Already wrapped, skip
      }
      
      // Store original fetch
      const originalFetch = window.fetch;
      
      // Replace with timed version
      window.fetch = createTimedFetch({
        includePayloadSize: true,
        slowThreshold: PerformanceThresholds.API.slow,
        logSlowRequests: process.env.NODE_ENV === 'development'
      });

      // Cleanup
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [enableApiTracking]);

  // Log performance budget warnings
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const checkBudgets = () => {
        const stats = PerformanceMonitor.getApiStats();
        const renderStats = PerformanceMonitor.getRenderStats();

        if (stats.p95 > PerformanceThresholds.API.slow) {
          console.warn(
            `[Performance Budget] API P95 response time (${stats.p95.toFixed(0)}ms) exceeds budget (${PerformanceThresholds.API.slow}ms)`
          );
        }

        if (renderStats.average > PerformanceThresholds.RENDER.slow) {
          console.warn(
            `[Performance Budget] Average render time (${renderStats.average.toFixed(2)}ms) exceeds budget (${PerformanceThresholds.RENDER.slow}ms)`
          );
        }
      };

      // Check every 30 seconds
      const interval = setInterval(checkBudgets, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  return <>{children}</>;
};