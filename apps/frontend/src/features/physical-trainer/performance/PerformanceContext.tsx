import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { PerformanceMetric } from './usePerformanceMonitor';

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    byCategory: Record<string, number>;
    averageDurations: Record<string, number>;
    slowestOperations: PerformanceMetric[];
    timestamp: string;
  };
}

interface PerformanceContextValue {
  metrics: PerformanceMetric[];
  recordMetric: (metric: PerformanceMetric) => void;
  clearMetrics: () => void;
  exportMetrics: () => PerformanceReport;
  getMetricsByCategory: (category: PerformanceMetric['category']) => PerformanceMetric[];
  getMetricsByComponent: (componentName: string) => PerformanceMetric[];
  enableRecording: boolean;
  setEnableRecording: (enabled: boolean) => void;
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

interface PerformanceProviderProps {
  children: React.ReactNode;
  maxMetrics?: number;
  enableAutoCleanup?: boolean;
  cleanupInterval?: number;
  enableConsoleLogging?: boolean;
}

/**
 * Performance monitoring provider that collects and manages performance metrics
 * 
 * @example
 * ```tsx
 * <PerformanceProvider maxMetrics={1000} enableAutoCleanup>
 *   <App />
 * </PerformanceProvider>
 * ```
 */
export function PerformanceProvider({
  children,
  maxMetrics = 5000,
  enableAutoCleanup = true,
  cleanupInterval = 300000, // 5 minutes
  enableConsoleLogging = false
}: PerformanceProviderProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [enableRecording, setEnableRecording] = useState(true);
  const metricsRef = useRef<PerformanceMetric[]>([]);

  // Sync state with ref for performance
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // Auto cleanup old metrics
  useEffect(() => {
    if (!enableAutoCleanup) return;

    const cleanupOldMetrics = () => {
      const cutoffTime = new Date(Date.now() - cleanupInterval).toISOString();
      setMetrics(prev => prev.filter(metric => metric.timestamp > cutoffTime));
    };

    const interval = setInterval(cleanupOldMetrics, cleanupInterval);
    return () => clearInterval(interval);
  }, [enableAutoCleanup, cleanupInterval]);

  // Monitor performance observer for native browser metrics
  useEffect(() => {
    if (!enableRecording) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.name.includes('physical-trainer')) {
            // Already tracked by our system
            return;
          }

          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            recordMetric({
              name: 'page-navigation',
              category: 'custom',
              startTime: 0,
              duration: navEntry.loadEventEnd - navEntry.fetchStart,
              timestamp: new Date().toISOString(),
              metadata: {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                domInteractive: navEntry.domInteractive - navEntry.fetchStart,
                transferSize: navEntry.transferSize,
                decodedBodySize: navEntry.decodedBodySize
              }
            });
          }

          if (entry.entryType === 'largest-contentful-paint') {
            recordMetric({
              name: 'largest-contentful-paint',
              category: 'render',
              startTime: entry.startTime,
              duration: entry.startTime,
              timestamp: new Date().toISOString(),
              metadata: {
                element: (entry as any).element?.tagName,
                size: (entry as any).size
              }
            });
          }
        });
      });

      observer.observe({ 
        entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] 
      });

      return () => observer.disconnect();
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error);
    }
  }, [enableRecording]);

  const recordMetric = useCallback((metric: PerformanceMetric) => {
    if (!enableRecording) return;

    if (enableConsoleLogging) {
      console.log('[Performance]', metric.name, {
        duration: `${metric.duration.toFixed(2)}ms`,
        ...metric.metadata
      });
    }

    setMetrics(prev => {
      const newMetrics = [...prev, metric];
      // Keep only the most recent metrics if we exceed the limit
      if (newMetrics.length > maxMetrics) {
        return newMetrics.slice(-maxMetrics);
      }
      return newMetrics;
    });
  }, [enableRecording, enableConsoleLogging, maxMetrics]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  const getMetricsByCategory = useCallback((category: PerformanceMetric['category']) => {
    return metricsRef.current.filter(metric => metric.category === category);
  }, []);

  const getMetricsByComponent = useCallback((componentName: string) => {
    return metricsRef.current.filter(metric => 
      metric.name.toLowerCase().includes(componentName.toLowerCase())
    );
  }, []);

  const exportMetrics = useCallback((): PerformanceReport => {
    const currentMetrics = metricsRef.current;
    
    // Calculate summary statistics
    const byCategory = currentMetrics.reduce((acc, metric) => {
      acc[metric.category] = (acc[metric.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageDurations = Object.entries(
      currentMetrics.reduce((acc, metric) => {
        if (!acc[metric.category]) {
          acc[metric.category] = { total: 0, count: 0 };
        }
        acc[metric.category].total += metric.duration;
        acc[metric.category].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>)
    ).reduce((acc, [category, { total, count }]) => {
      acc[category] = total / count;
      return acc;
    }, {} as Record<string, number>);

    // Find slowest operations
    const slowestOperations = [...currentMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      metrics: currentMetrics,
      summary: {
        totalMetrics: currentMetrics.length,
        byCategory,
        averageDurations,
        slowestOperations,
        timestamp: new Date().toISOString()
      }
    };
  }, []);

  const value: PerformanceContextValue = {
    metrics,
    recordMetric,
    clearMetrics,
    exportMetrics,
    getMetricsByCategory,
    getMetricsByComponent,
    enableRecording,
    setEnableRecording
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

/**
 * Hook to access performance context
 * @throws Error if used outside of PerformanceProvider
 */
export function usePerformanceContext() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
}

/**
 * Export performance metrics to various formats
 */
export function exportPerformanceData(report: PerformanceReport, format: 'json' | 'csv' = 'json') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `performance-report-${timestamp}`;

  if (format === 'json') {
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
  } else if (format === 'csv') {
    const csvData = convertMetricsToCSV(report.metrics);
    const blob = new Blob([csvData], { type: 'text/csv' });
    downloadBlob(blob, `${filename}.csv`);
  }
}

function convertMetricsToCSV(metrics: PerformanceMetric[]): string {
  const headers = ['Name', 'Category', 'Start Time', 'Duration (ms)', 'Timestamp'];
  const rows = metrics.map(metric => [
    metric.name,
    metric.category,
    metric.startTime.toFixed(2),
    metric.duration.toFixed(2),
    metric.timestamp
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}