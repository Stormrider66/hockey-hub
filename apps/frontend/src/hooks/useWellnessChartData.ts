import { useEffect, useRef, useCallback, useMemo } from 'react';
import { optimizeChartData } from '@/utils/chartOptimization';

interface ChartDataOptions {
  maxDataPoints?: number;
  updateInterval?: number;
  enableAutoCleanup?: boolean;
  optimizationMethod?: 'lttb' | 'uniform' | 'aggregate';
  xKey?: string;
  yKey?: string;
  aggregateInterval?: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Custom hook to manage wellness chart data with memory leak prevention
 * - Limits data points to prevent unbounded growth
 * - Cleans up event listeners and observers
 * - Provides memoized data for performance
 * - Uses advanced downsampling algorithms
 */
export function useWellnessChartData(
  data: any[],
  options: ChartDataOptions = {}
) {
  const {
    maxDataPoints = 100,
    updateInterval = 0,
    enableAutoCleanup = true,
    optimizationMethod = 'lttb',
    xKey = 'date',
    yKey = 'value',
    aggregateInterval = 'day'
  } = options;

  const dataRef = useRef(data);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Optimize data points using advanced algorithms
  const optimizedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return optimizeChartData(data, maxDataPoints, {
      xKey,
      yKey,
      method: optimizationMethod,
      aggregateInterval,
      valueKeys: [yKey]
    });
  }, [data, maxDataPoints, optimizationMethod, xKey, yKey, aggregateInterval]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear any intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Disconnect resize observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // Clear data reference to help garbage collection
    if (enableAutoCleanup) {
      dataRef.current = [];
    }
  }, [enableAutoCleanup]);

  // Setup and cleanup
  useEffect(() => {
    // Update data reference
    dataRef.current = optimizedData;

    // Setup interval if needed
    if (updateInterval > 0) {
      intervalRef.current = setInterval(() => {
        // Force re-render or update logic here if needed
      }, updateInterval);
    }

    // Cleanup on unmount
    return cleanup;
  }, [optimizedData, updateInterval, cleanup]);

  // Handle visibility change to pause/resume charts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    data: optimizedData,
    cleanup,
    originalSize: data.length,
    optimizedSize: optimizedData.length
  };
}

/**
 * Hook to optimize Recharts rendering with proper cleanup
 */
export function useOptimizedChart(containerRef: React.RefObject<HTMLDivElement>) {
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Debounced resize handler
    const handleResize = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        // Force chart re-render on resize
        if (containerRef.current) {
          const event = new Event('resize');
          window.dispatchEvent(event);
        }
      });
    };

    // Create resize observer with proper cleanup
    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [containerRef]);
}