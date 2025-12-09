import { useEffect, useRef, Profiler, ProfilerOnRenderCallback } from 'react';
import { PerformanceMonitor } from '@/services/performance/PerformanceMonitor';

export interface RenderTimeOptions {
  threshold?: number;
  logToConsole?: boolean;
  trackMounts?: boolean;
  trackUpdates?: boolean;
}

/**
 * Hook to track component render times
 */
export function useRenderTime(
  componentName: string,
  options: RenderTimeOptions = {}
): void {
  const {
    threshold = 16, // 60fps threshold
    logToConsole = process.env.NODE_ENV === 'development',
    trackMounts = true,
    trackUpdates = true
  } = options;

  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    
    // Track mount time
    if (renderCount.current === 1 && trackMounts) {
      const mountDuration = performance.now() - mountTime.current;
      
      PerformanceMonitor.recordRenderTiming(
        componentName,
        'mount',
        mountDuration,
        mountDuration
      );

      if (logToConsole && mountDuration > threshold) {
        console.warn(
          `[Render Performance] ${componentName} mount took ${mountDuration.toFixed(2)}ms`
        );
      }
    }
  });
}

/**
 * React Profiler callback for detailed render tracking
 */
export const createProfilerCallback = (
  componentName: string,
  options: RenderTimeOptions = {}
): ProfilerOnRenderCallback => {
  const { threshold = 16, logToConsole = process.env.NODE_ENV === 'development' } = options;

  return (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number,
    interactions: Set<any>
  ) => {
    // Record render timing
    PerformanceMonitor.recordRenderTiming(
      componentName || id,
      phase,
      actualDuration,
      baseDuration
    );

    // Log slow renders
    if (logToConsole && actualDuration > threshold) {
      console.warn(
        `[Render Performance] ${componentName || id} ${phase} took ${actualDuration.toFixed(2)}ms`,
        {
          baseDuration: baseDuration.toFixed(2),
          commitTime: commitTime.toFixed(2),
          interactions: interactions.size
        }
      );
    }
  };
};

/**
 * Higher-order component to wrap components with Profiler
 */
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
  options?: RenderTimeOptions
) {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  const callback = createProfilerCallback(displayName, options);

  const ProfiledComponent: React.FC<P> = (props: P) => (
    <Profiler id={displayName} onRender={callback}>
      <Component {...props} />
    </Profiler>
  );

  ProfiledComponent.displayName = `withRenderTracking(${displayName})`;

  return ProfiledComponent;
}

/**
 * Hook to report render metrics for the current render cycle
 */
export function useReportRenderMetrics(componentName: string) {
  const renderStartTime = useRef<number>();
  const isFirstRender = useRef(true);

  // Capture render start time synchronously
  if (!renderStartTime.current) {
    renderStartTime.current = performance.now();
  }

  useEffect(() => {
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime.current!;
    const phase = isFirstRender.current ? 'mount' : 'update';

    // Record the render
    PerformanceMonitor.recordRenderTiming(
      componentName,
      phase,
      renderDuration,
      renderDuration // We don't have base duration in this approach
    );

    // Reset for next render
    renderStartTime.current = undefined;
    isFirstRender.current = false;
  });

  return {
    markRenderStart: () => {
      renderStartTime.current = performance.now();
    },
    markRenderEnd: () => {
      if (renderStartTime.current) {
        const duration = performance.now() - renderStartTime.current;
        PerformanceMonitor.recordRenderTiming(
          componentName,
          isFirstRender.current ? 'mount' : 'update',
          duration,
          duration
        );
      }
    }
  };
}

/**
 * Batch render tracking for lists
 */
export function useBatchRenderTracking(
  componentName: string,
  itemCount: number,
  options: RenderTimeOptions = {}
) {
  const startTime = useRef(performance.now());
  const { threshold = 100, logToConsole = process.env.NODE_ENV === 'development' } = options;

  useEffect(() => {
    const duration = performance.now() - startTime.current;
    
    PerformanceMonitor.recordRenderTiming(
      `${componentName}-batch`,
      'mount',
      duration,
      duration
    );

    if (logToConsole && duration > threshold) {
      console.warn(
        `[Render Performance] ${componentName} batch render (${itemCount} items) took ${duration.toFixed(2)}ms`,
        `Average: ${(duration / itemCount).toFixed(2)}ms per item`
      );
    }
  }, [componentName, itemCount, threshold, logToConsole]);
}