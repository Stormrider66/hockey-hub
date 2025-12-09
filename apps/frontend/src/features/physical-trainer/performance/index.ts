/**
 * Performance Monitoring System for Physical Trainer Dashboard
 * 
 * This module provides comprehensive performance tracking capabilities including:
 * - Component mount/unmount timing
 * - Render performance measurement
 * - API call duration tracking
 * - User interaction recording
 * - Custom performance marks and measures
 * 
 * @example
 * ```tsx
 * // Wrap your app with the performance provider
 * <PerformanceProvider enableAutoCleanup maxMetrics={5000}>
 *   <App />
 * </PerformanceProvider>
 * 
 * // Use in components
 * const perf = usePerformanceMonitor({
 *   componentName: 'MyComponent',
 *   enableAutoTracking: true
 * });
 * 
 * // Track API calls
 * const data = await perf.trackApiCall('fetch-data', 
 *   () => api.getData(),
 *   { endpoint: '/api/data' }
 * );
 * ```
 */

// Core exports
export { usePerformanceMonitor } from './usePerformanceMonitor';
export type { PerformanceMetric, UsePerformanceMonitorOptions } from './usePerformanceMonitor';

export { 
  PerformanceProvider, 
  usePerformanceContext,
  exportPerformanceData 
} from './PerformanceContext';

export { PerformanceMonitoringDashboard } from './PerformanceMonitoringDashboard';

// HOCs and specialized hooks
export {
  withPerformanceTracking,
  useChartPerformance,
  useTabPerformance,
  useWorkoutBuilderPerformance
} from './withPerformanceTracking';

// Re-export types
export type { PerformanceReport } from './PerformanceContext';