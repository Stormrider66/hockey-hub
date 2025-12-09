'use client';

import React, { ReactNode } from 'react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface PerformanceMonitorWrapperProps {
  /**
   * Component name for tracking
   */
  componentName: string;
  
  /**
   * Children to render
   */
  children: ReactNode;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
  
  /**
   * Whether to enable monitoring (useful for feature flags)
   */
  enabled?: boolean;
  
  /**
   * Whether to log to console
   */
  debug?: boolean;
}

/**
 * Wrapper component for performance monitoring
 * This is a non-intrusive wrapper that doesn't affect functionality
 * 
 * @example
 * ```tsx
 * <PerformanceMonitorWrapper componentName="SessionsTab" debug>
 *   <SessionsTab {...props} />
 * </PerformanceMonitorWrapper>
 * ```
 */
export function PerformanceMonitorWrapper({
  componentName,
  children,
  metadata,
  enabled = true,
  debug = false
}: PerformanceMonitorWrapperProps) {
  usePerformanceMonitor({
    componentName,
    metadata,
    logToConsole: debug,
    enabled
  });

  // Simply render children - no functionality changes
  return <>{children}</>;
}

/**
 * Higher-order component for performance monitoring
 * 
 * @example
 * ```tsx
 * const MonitoredComponent = withPerformanceMonitor(MyComponent, 'MyComponent');
 * ```
 */
export function withPerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  options?: {
    metadata?: Record<string, any>;
    debug?: boolean;
  }
) {
  const WrappedComponent = (props: P) => {
    return (
      <PerformanceMonitorWrapper
        componentName={componentName}
        metadata={options?.metadata}
        debug={options?.debug}
      >
        <Component {...props} />
      </PerformanceMonitorWrapper>
    );
  };

  WrappedComponent.displayName = `withPerformanceMonitor(${componentName})`;
  
  return WrappedComponent;
}