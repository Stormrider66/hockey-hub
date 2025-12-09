import { useEffect } from 'react';
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';
import { PerformanceMonitor } from '@/services/performance/PerformanceMonitor';

export interface WebVitalsConfig {
  enabled?: boolean;
  reportHandler?: (metric: Metric) => void;
  thresholds?: {
    LCP?: number;
    FID?: number;
    CLS?: number;
    FCP?: number;
    TTFB?: number;
  };
}

/**
 * Hook to measure and report Core Web Vitals
 * @param config Configuration options for web vitals measurement
 */
export function useWebVitals(config: WebVitalsConfig = {}) {
  const { 
    enabled = true, 
    reportHandler,
    thresholds 
  } = config;

  useEffect(() => {
    if (!enabled) return;

    const handleMetric = (metric: Metric) => {
      // Log to performance monitor
      PerformanceMonitor.recordWebVital(metric);

      // Check against thresholds
      if (thresholds) {
        const threshold = thresholds[metric.name as keyof typeof thresholds];
        if (threshold && metric.value > threshold) {
          console.warn(`Performance warning: ${metric.name} (${metric.value}ms) exceeded threshold (${threshold}ms)`);
        }
      }

      // Call custom handler if provided
      if (reportHandler) {
        reportHandler(metric);
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vital] ${metric.name}:`, {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id
        });
      }
    };

    // Measure all Core Web Vitals
    getCLS(handleMetric);
    getFCP(handleMetric);
    getFID(handleMetric);
    getLCP(handleMetric);
    getTTFB(handleMetric);
  }, [enabled, reportHandler, thresholds]);
}

/**
 * Get web vitals data from the performance monitor
 */
export function getWebVitalsData() {
  return PerformanceMonitor.getWebVitalsData();
}