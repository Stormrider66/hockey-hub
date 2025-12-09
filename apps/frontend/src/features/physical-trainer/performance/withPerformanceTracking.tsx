import React, { ComponentType, useEffect } from 'react';
import { usePerformanceMonitor } from './usePerformanceMonitor';

/**
 * Higher-order component that adds automatic performance tracking to any component
 * 
 * @example
 * ```tsx
 * const TrackedDashboard = withPerformanceTracking(PhysicalTrainerDashboard, {
 *   trackRenders: true,
 *   enableAutoTracking: true
 * });
 * ```
 */
export function withPerformanceTracking<P extends object>(
  Component: ComponentType<P>,
  options?: {
    componentName?: string;
    trackRenders?: boolean;
    enableAutoTracking?: boolean;
  }
) {
  const componentName = options?.componentName || Component.displayName || Component.name || 'Unknown';
  
  const TrackedComponent = (props: P) => {
    const perf = usePerformanceMonitor({
      componentName,
      trackRenders: options?.trackRenders ?? true,
      enableAutoTracking: options?.enableAutoTracking ?? true
    });

    // Track specific props changes
    useEffect(() => {
      perf.trackInteraction('props-change', {
        propsKeys: Object.keys(props as any)
      });
    }, [props, perf]);

    return <Component {...props} />;
  };

  TrackedComponent.displayName = `withPerformanceTracking(${componentName})`;
  
  return TrackedComponent;
}

/**
 * Hook for tracking chart rendering performance
 * 
 * @example
 * ```tsx
 * const chartPerf = useChartPerformance('player-stats-chart');
 * 
 * useEffect(() => {
 *   chartPerf.startRender();
 *   // ... render chart
 *   chartPerf.endRender({ dataPoints: data.length });
 * }, [data]);
 * ```
 */
export function useChartPerformance(chartName: string) {
  const perf = usePerformanceMonitor({
    componentName: `Chart-${chartName}`,
    enableAutoTracking: true
  });

  return {
    startRender: () => perf.startMeasure('render'),
    endRender: (metadata?: Record<string, any>) => perf.endMeasure('render', metadata),
    trackDataLoad: (dataSize: number) => perf.trackInteraction('data-load', { dataSize }),
    trackInteraction: (type: string, metadata?: Record<string, any>) => 
      perf.trackInteraction(type, metadata)
  };
}

/**
 * Hook for tracking tab switching performance
 * 
 * @example
 * ```tsx
 * const tabPerf = useTabPerformance('physical-trainer-tabs');
 * 
 * const handleTabChange = (newTab: string) => {
 *   tabPerf.trackSwitch(currentTab, newTab);
 *   setCurrentTab(newTab);
 * };
 * ```
 */
export function useTabPerformance(tabGroupName: string) {
  const perf = usePerformanceMonitor({
    componentName: `TabGroup-${tabGroupName}`,
    enableAutoTracking: false
  });

  const trackSwitch = (fromTab: string, toTab: string) => {
    perf.startMeasure(`tab-switch-${fromTab}-to-${toTab}`);
    
    // Set up a listener for when the new tab content is rendered
    requestAnimationFrame(() => {
      perf.endMeasure(`tab-switch-${fromTab}-to-${toTab}`, {
        fromTab,
        toTab,
        timestamp: new Date().toISOString()
      });
    });
  };

  return {
    trackSwitch,
    trackTabLoad: (tabName: string) => {
      perf.startMeasure(`tab-load-${tabName}`);
      return () => perf.endMeasure(`tab-load-${tabName}`);
    }
  };
}

/**
 * Hook for tracking workout builder performance
 * 
 * @example
 * ```tsx
 * const builderPerf = useWorkoutBuilderPerformance('conditioning');
 * 
 * // Track exercise addition
 * builderPerf.trackExerciseAdd(exercise);
 * 
 * // Track save operation
 * await builderPerf.trackSave(async () => {
 *   return await saveWorkout(data);
 * });
 * ```
 */
export function useWorkoutBuilderPerformance(builderType: string) {
  const perf = usePerformanceMonitor({
    componentName: `WorkoutBuilder-${builderType}`,
    enableAutoTracking: true
  });

  return {
    trackExerciseAdd: (exercise: any) => {
      perf.trackInteraction('exercise-add', {
        exerciseName: exercise.name,
        exerciseType: exercise.type
      });
    },
    
    trackExerciseRemove: (exerciseId: string) => {
      perf.trackInteraction('exercise-remove', { exerciseId });
    },
    
    trackDragDrop: (fromIndex: number, toIndex: number) => {
      perf.trackInteraction('drag-drop', { fromIndex, toIndex });
    },
    
    trackSave: async <T,>(saveOperation: () => Promise<T>) => {
      return perf.trackApiCall('save-workout', saveOperation, {
        builderType
      });
    },
    
    trackLoad: async <T,>(loadOperation: () => Promise<T>) => {
      return perf.trackApiCall('load-workout', loadOperation, {
        builderType
      });
    },
    
    trackValidation: () => {
      const stop = perf.startMeasure('validation');
      return () => perf.endMeasure('validation');
    }
  };
}