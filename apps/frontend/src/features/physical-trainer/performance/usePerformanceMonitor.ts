import { useEffect, useRef, useCallback } from 'react';
import { usePerformanceContext } from './PerformanceContext';

export interface PerformanceMetric {
  name: string;
  category: 'component' | 'api' | 'interaction' | 'render' | 'custom';
  startTime: number;
  duration: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface UsePerformanceMonitorOptions {
  componentName: string;
  enableAutoTracking?: boolean;
  trackRenders?: boolean;
}

/**
 * Hook for monitoring performance metrics in components
 * 
 * @example
 * ```tsx
 * const perf = usePerformanceMonitor({
 *   componentName: 'PhysicalTrainerDashboard',
 *   enableAutoTracking: true
 * });
 * 
 * // Track API calls
 * const fetchData = async () => {
 *   perf.startMeasure('api-fetch-sessions');
 *   const data = await api.getSessions();
 *   perf.endMeasure('api-fetch-sessions', { recordCount: data.length });
 * };
 * ```
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions) {
  const { componentName, enableAutoTracking = true, trackRenders = true } = options;
  const { recordMetric } = usePerformanceContext();
  const measurementMap = useRef<Map<string, number>>(new Map());
  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);

  // Track component mount time
  useEffect(() => {
    if (!enableAutoTracking) return;

    mountTime.current = performance.now();
    const mountMark = `${componentName}-mount`;
    performance.mark(mountMark);

    return () => {
      const unmountMark = `${componentName}-unmount`;
      performance.mark(unmountMark);
      
      try {
        performance.measure(
          `${componentName}-lifetime`,
          mountMark,
          unmountMark
        );
        
        const measure = performance.getEntriesByName(`${componentName}-lifetime`)[0];
        if (measure) {
          recordMetric({
            name: `${componentName}-lifetime`,
            category: 'component',
            startTime: measure.startTime,
            duration: measure.duration,
            timestamp: new Date().toISOString(),
            metadata: {
              renderCount: renderCount.current
            }
          });
        }
      } catch (error) {
        console.warn('Failed to measure component lifetime:', error);
      }
      
      // Cleanup
      performance.clearMarks(mountMark);
      performance.clearMarks(unmountMark);
      performance.clearMeasures(`${componentName}-lifetime`);
    };
  }, [componentName, enableAutoTracking, recordMetric]);

  // Track renders
  useEffect(() => {
    if (!trackRenders || !enableAutoTracking) return;
    
    renderCount.current += 1;
    const renderTime = performance.now() - mountTime.current;
    
    recordMetric({
      name: `${componentName}-render`,
      category: 'render',
      startTime: mountTime.current,
      duration: renderTime,
      timestamp: new Date().toISOString(),
      metadata: {
        renderNumber: renderCount.current
      }
    });
  });

  /**
   * Start measuring a performance metric
   */
  const startMeasure = useCallback((measureName: string) => {
    const markName = `${componentName}-${measureName}-start`;
    performance.mark(markName);
    measurementMap.current.set(measureName, performance.now());
  }, [componentName]);

  /**
   * End measuring a performance metric and record it
   */
  const endMeasure = useCallback((
    measureName: string,
    metadata?: Record<string, any>
  ) => {
    const startTime = measurementMap.current.get(measureName);
    if (!startTime) {
      console.warn(`No start measurement found for ${measureName}`);
      return;
    }

    const endMarkName = `${componentName}-${measureName}-end`;
    performance.mark(endMarkName);
    
    const duration = performance.now() - startTime;
    
    try {
      performance.measure(
        `${componentName}-${measureName}`,
        `${componentName}-${measureName}-start`,
        endMarkName
      );
    } catch (error) {
      console.warn('Failed to create performance measure:', error);
    }

    recordMetric({
      name: `${componentName}-${measureName}`,
      category: detectCategory(measureName),
      startTime,
      duration,
      timestamp: new Date().toISOString(),
      metadata
    });

    // Cleanup
    measurementMap.current.delete(measureName);
    performance.clearMarks(`${componentName}-${measureName}-start`);
    performance.clearMarks(endMarkName);
    performance.clearMeasures(`${componentName}-${measureName}`);
  }, [componentName, recordMetric]);

  /**
   * Track a user interaction
   */
  const trackInteraction = useCallback((
    interactionType: string,
    metadata?: Record<string, any>
  ) => {
    const now = performance.now();
    recordMetric({
      name: `${componentName}-${interactionType}`,
      category: 'interaction',
      startTime: now,
      duration: 0,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        interactionType
      }
    });
  }, [componentName, recordMetric]);

  /**
   * Track an API call with automatic timing
   */
  const trackApiCall = useCallback(async <T,>(
    apiName: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const startTime = performance.now();
    const markName = `${componentName}-api-${apiName}`;
    performance.mark(`${markName}-start`);

    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      performance.mark(`${markName}-end`);
      performance.measure(markName, `${markName}-start`, `${markName}-end`);

      recordMetric({
        name: markName,
        category: 'api',
        startTime,
        duration,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          success: true,
          apiName
        }
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      recordMetric({
        name: markName,
        category: 'api',
        startTime,
        duration,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          apiName
        }
      });

      throw error;
    } finally {
      performance.clearMarks(`${markName}-start`);
      performance.clearMarks(`${markName}-end`);
      performance.clearMeasures(markName);
    }
  }, [componentName, recordMetric]);

  /**
   * Create a custom performance mark
   */
  const mark = useCallback((markName: string) => {
    performance.mark(`${componentName}-${markName}`);
  }, [componentName]);

  /**
   * Measure between two marks
   */
  const measureBetweenMarks = useCallback((
    measureName: string,
    startMark: string,
    endMark: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const fullStartMark = `${componentName}-${startMark}`;
      const fullEndMark = `${componentName}-${endMark}`;
      const fullMeasureName = `${componentName}-${measureName}`;
      
      performance.measure(fullMeasureName, fullStartMark, fullEndMark);
      
      const measure = performance.getEntriesByName(fullMeasureName)[0];
      if (measure) {
        recordMetric({
          name: fullMeasureName,
          category: 'custom',
          startTime: measure.startTime,
          duration: measure.duration,
          timestamp: new Date().toISOString(),
          metadata
        });
      }
      
      // Cleanup
      performance.clearMeasures(fullMeasureName);
    } catch (error) {
      console.warn('Failed to measure between marks:', error);
    }
  }, [componentName, recordMetric]);

  return {
    startMeasure,
    endMeasure,
    trackInteraction,
    trackApiCall,
    mark,
    measureBetweenMarks,
    renderCount: renderCount.current
  };
}

/**
 * Detect metric category based on name patterns
 */
function detectCategory(measureName: string): PerformanceMetric['category'] {
  if (measureName.includes('api') || measureName.includes('fetch')) {
    return 'api';
  }
  if (measureName.includes('render') || measureName.includes('paint')) {
    return 'render';
  }
  if (measureName.includes('click') || measureName.includes('input')) {
    return 'interaction';
  }
  if (measureName.includes('mount') || measureName.includes('unmount')) {
    return 'component';
  }
  return 'custom';
}