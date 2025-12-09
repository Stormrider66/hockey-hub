import { useEffect, useRef } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';

interface UsePerformanceMonitorOptions {
  /**
   * Component or operation name to track
   */
  componentName: string;
  
  /**
   * Additional metadata to store with the metric
   */
  metadata?: Record<string, any>;
  
  /**
   * Whether to log the measurement to console
   */
  logToConsole?: boolean;
  
  /**
   * Whether monitoring is enabled (useful for feature flags)
   */
  enabled?: boolean;
}

/**
 * Hook to monitor component performance
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePerformanceMonitor({ 
 *     componentName: 'PhysicalTrainerDashboard',
 *     metadata: { tabCount: 10 }
 *   });
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePerformanceMonitor({
  componentName,
  metadata,
  logToConsole = false,
  enabled = true
}: UsePerformanceMonitorOptions): void {
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Start measurement
    performanceMonitor.startMeasure(componentName, metadata);

    // Cleanup function runs on unmount
    return () => {
      performanceMonitor.endMeasure(componentName);
      
      if (logToConsole && !hasLoggedRef.current) {
        const metrics = performanceMonitor.getMetrics(componentName);
        const lastMetric = metrics[metrics.length - 1];
        
        if (lastMetric?.duration) {
          console.log(
            `⏱️ [${componentName}] Render time: ${lastMetric.duration.toFixed(2)}ms`,
            metadata ? metadata : ''
          );
          hasLoggedRef.current = true;
        }
      }
    };
  }, [componentName, metadata, logToConsole, enabled]);
}

/**
 * Hook to measure specific operations within a component
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const measureOp = useOperationMonitor('MyComponent');
 *   
 *   const handleClick = async () => {
 *     const endMeasure = measureOp('fetchData');
 *     await fetchSomeData();
 *     endMeasure();
 *   };
 * }
 * ```
 */
export function useOperationMonitor(componentName: string) {
  return (operationName: string, metadata?: Record<string, any>) => {
    const fullName = `${componentName}.${operationName}`;
    performanceMonitor.startMeasure(fullName, metadata);
    
    return () => {
      performanceMonitor.endMeasure(fullName);
    };
  };
}

/**
 * Hook to track render count and performance over time
 */
export function useRenderTracking(componentName: string) {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);

  useEffect(() => {
    renderCountRef.current += 1;
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      renderTimesRef.current.push(renderTime);
      
      // Keep only last 10 render times
      if (renderTimesRef.current.length > 10) {
        renderTimesRef.current.shift();
      }

      // Log if render time is unusually high
      const avgRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
      if (renderTime > avgRenderTime * 2 && renderTime > 16) { // 16ms = 60fps threshold
        console.warn(
          `⚠️ [${componentName}] Slow render detected: ${renderTime.toFixed(2)}ms (avg: ${avgRenderTime.toFixed(2)}ms)`
        );
      }
    };
  });

  return {
    renderCount: renderCountRef.current,
    averageRenderTime: renderTimesRef.current.length > 0
      ? renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
      : 0
  };
}