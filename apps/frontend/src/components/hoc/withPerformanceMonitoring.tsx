import React, { Component, ComponentType, FC, useEffect, useRef } from 'react';
import { PerformanceMonitor } from '@/services/performance/PerformanceMonitor';

export interface PerformanceMonitoringOptions {
  trackRender?: boolean;
  trackMount?: boolean;
  trackErrors?: boolean;
  slowThreshold?: number;
  componentName?: string;
}

/**
 * HOC to add performance monitoring to class components
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: PerformanceMonitoringOptions = {}
) {
  const {
    trackRender = true,
    trackMount = true,
    trackErrors = true,
    slowThreshold = 16,
    componentName
  } = options;

  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  // For functional components
  if (!WrappedComponent.prototype?.render) {
    const FunctionalWrapper: FC<P> = (props) => {
      const renderStartTime = useRef<number>();
      const mountTime = useRef<number>();
      const isMounted = useRef(false);

      // Track render start
      if (trackRender && !renderStartTime.current) {
        renderStartTime.current = performance.now();
      }

      // Track mount
      useEffect(() => {
        if (!isMounted.current && trackMount) {
          isMounted.current = true;
          mountTime.current = performance.now();
        }

        // Track render completion
        if (trackRender && renderStartTime.current) {
          const renderDuration = performance.now() - renderStartTime.current;
          const phase = isMounted.current ? 'update' : 'mount';

          PerformanceMonitor.recordRenderTiming(
            displayName,
            phase,
            renderDuration,
            renderDuration
          );

          if (renderDuration > slowThreshold) {
            console.warn(
              `[Performance] Slow ${phase} in ${displayName}: ${renderDuration.toFixed(2)}ms`
            );
          }

          renderStartTime.current = undefined;
        }

        // Track mount completion
        if (mountTime.current && !isMounted.current) {
          const mountDuration = performance.now() - mountTime.current;
          
          if (mountDuration > slowThreshold) {
            console.warn(
              `[Performance] Slow mount in ${displayName}: ${mountDuration.toFixed(2)}ms`
            );
          }
        }
      });

      return <WrappedComponent {...props} />;
    };

    FunctionalWrapper.displayName = `withPerformanceMonitoring(${displayName})`;
    return FunctionalWrapper;
  }

  // For class components
  class PerformanceMonitoredComponent extends Component<P> {
    renderStartTime?: number;
    mountStartTime: number;
    renderCount: number = 0;

    constructor(props: P) {
      super(props);
      this.mountStartTime = performance.now();
    }

    override componentDidMount() {
      if (trackMount) {
        const mountDuration = performance.now() - this.mountStartTime;
        
        PerformanceMonitor.recordRenderTiming(
          displayName,
          'mount',
          mountDuration,
          mountDuration
        );

        if (mountDuration > slowThreshold) {
          console.warn(
            `[Performance] Slow mount in ${displayName}: ${mountDuration.toFixed(2)}ms`
          );
        }
      }
    }

    override componentDidUpdate() {
      if (trackRender && this.renderStartTime) {
        const renderDuration = performance.now() - this.renderStartTime;
        
        PerformanceMonitor.recordRenderTiming(
          displayName,
          'update',
          renderDuration,
          renderDuration
        );

        if (renderDuration > slowThreshold) {
          console.warn(
            `[Performance] Slow update in ${displayName}: ${renderDuration.toFixed(2)}ms`
          );
        }

        this.renderStartTime = undefined;
      }
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      if (trackErrors) {
        PerformanceMonitor.mark(`${displayName}-error`, {
          error: error.message,
          componentStack: errorInfo.componentStack
        });

        console.error(`[Performance] Error in ${displayName}:`, error);
      }
    }

    override render() {
      if (trackRender) {
        this.renderStartTime = performance.now();
        this.renderCount++;
      }

      return <WrappedComponent {...this.props} />;
    }
  }

  (PerformanceMonitoredComponent as any).displayName = `withPerformanceMonitoring(${displayName})`;
  
  return PerformanceMonitoredComponent;
}