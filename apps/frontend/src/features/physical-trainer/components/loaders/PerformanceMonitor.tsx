'use client';

import React, { useEffect, useRef, ReactNode } from 'react';

interface PerformanceMonitorProps {
  componentName: string;
  children: ReactNode;
  onLoadTime?: (loadTime: number) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName,
  children,
  onLoadTime
}) => {
  const startTimeRef = useRef<number>(0);
  const hasReportedRef = useRef<boolean>(false);

  useEffect(() => {
    // Record component mount time
    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }

    // Report load time after a short delay to ensure content is rendered
    const timer = setTimeout(() => {
      if (!hasReportedRef.current && startTimeRef.current) {
        const loadTime = performance.now() - startTimeRef.current;
        console.log(`[Performance] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
        
        // Report to analytics or monitoring service
        if (onLoadTime) {
          onLoadTime(loadTime);
        }

        // You could also send this to an analytics service
        if (typeof window !== 'undefined' && (window as any).analytics) {
          (window as any).analytics.track('Component Load Time', {
            component: componentName,
            loadTime: Math.round(loadTime),
            timestamp: new Date().toISOString()
          });
        }

        hasReportedRef.current = true;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [componentName, onLoadTime]);

  return <>{children}</>;
};

// Hook to use performance monitoring
export const useComponentPerformance = (componentName: string) => {
  const startTime = useRef<number>(performance.now());

  useEffect(() => {
    const loadTime = performance.now() - startTime.current;
    console.log(`[Performance Hook] ${componentName} rendered in ${loadTime.toFixed(2)}ms`);
  }, [componentName]);

  return {
    measureOperation: (operationName: string, operation: () => void) => {
      const opStart = performance.now();
      operation();
      const opTime = performance.now() - opStart;
      console.log(`[Performance] ${componentName}.${operationName} took ${opTime.toFixed(2)}ms`);
    }
  };
};