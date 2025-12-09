import type { Metric } from 'web-vitals';
import { PerformanceReporter } from './PerformanceReporter';
import { PerformanceThresholds } from './PerformanceThresholds';

export interface PerformanceEntry {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface WebVitalEntry extends PerformanceEntry {
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

export interface ApiTimingEntry extends PerformanceEntry {
  method: string;
  url: string;
  status?: number;
  size?: number;
}

export interface RenderTimingEntry extends PerformanceEntry {
  component: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
}

class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private webVitals: Map<string, WebVitalEntry[]> = new Map();
  private apiTimings: ApiTimingEntry[] = [];
  private renderTimings: RenderTimingEntry[] = [];
  private customMarks: PerformanceEntry[] = [];
  private reporter: PerformanceReporter;
  private startTime: number;
  private sessionId: string;

  private constructor() {
    this.reporter = new PerformanceReporter();
    this.startTime = Date.now();
    this.sessionId = this.generateSessionId();
    this.initializePerformanceObserver();
  }

  static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService();
    }
    return PerformanceMonitorService.instance;
  }

  /**
   * Record a web vital metric
   */
  recordWebVital(metric: Metric): void {
    const entry: WebVitalEntry = {
      name: metric.name,
      value: metric.value,
      timestamp: Date.now(),
      rating: metric.rating || 'needs-improvement',
      delta: metric.delta,
      id: metric.id,
      metadata: {
        navigationType: metric.navigationType,
        entries: metric.entries?.length || 0
      }
    };

    const entries = this.webVitals.get(metric.name) || [];
    entries.push(entry);
    this.webVitals.set(metric.name, entries);

    // Check against thresholds
    this.checkThreshold(metric.name, metric.value);

    // Report if needed
    if (this.shouldReport()) {
      this.reporter.reportWebVital(entry);
    }
  }

  /**
   * Record API timing
   */
  recordApiTiming(
    method: string,
    url: string,
    duration: number,
    status?: number,
    size?: number
  ): void {
    const entry: ApiTimingEntry = {
      name: 'api-call',
      value: duration,
      timestamp: Date.now(),
      method,
      url,
      status,
      size,
      metadata: {
        sessionId: this.sessionId
      }
    };

    this.apiTimings.push(entry);

    // Keep only last 100 entries to prevent memory issues
    if (this.apiTimings.length > 100) {
      this.apiTimings.shift();
    }

    // Check against thresholds
    this.checkThreshold('api-response', duration);

    // Report slow APIs
    if (duration > PerformanceThresholds.API.slow) {
      this.reporter.reportSlowApi(entry);
    }
  }

  /**
   * Record component render timing
   */
  recordRenderTiming(
    component: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number
  ): void {
    const entry: RenderTimingEntry = {
      name: 'component-render',
      value: actualDuration,
      timestamp: Date.now(),
      component,
      phase,
      actualDuration,
      baseDuration,
      metadata: {
        sessionId: this.sessionId
      }
    };

    this.renderTimings.push(entry);

    // Keep only last 200 entries
    if (this.renderTimings.length > 200) {
      this.renderTimings.shift();
    }

    // Report slow renders
    if (actualDuration > PerformanceThresholds.RENDER.slow) {
      this.reporter.reportSlowRender(entry);
    }
  }

  /**
   * Create a custom performance mark
   */
  mark(name: string, metadata?: Record<string, any>): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }

    const entry: PerformanceEntry = {
      name,
      value: Date.now() - this.startTime,
      timestamp: Date.now(),
      metadata
    };

    this.customMarks.push(entry);
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    try {
      if (endMark) {
        window.performance.measure(name, startMark, endMark);
      } else {
        window.performance.measure(name, startMark);
      }

      const measures = window.performance.getEntriesByName(name, 'measure');
      const lastMeasure = measures[measures.length - 1];
      
      if (lastMeasure) {
        this.recordCustomMeasure(name, lastMeasure.duration);
        return lastMeasure.duration;
      }
    } catch (error) {
      console.error('Performance measure error:', error);
    }

    return null;
  }

  /**
   * Get all web vitals data
   */
  getWebVitalsData(): Record<string, WebVitalEntry[]> {
    const data: Record<string, WebVitalEntry[]> = {};
    this.webVitals.forEach((entries, name) => {
      data[name] = [...entries];
    });
    return data;
  }

  /**
   * Get API timing statistics
   */
  getApiStats(): {
    count: number;
    average: number;
    median: number;
    p95: number;
    slowest: ApiTimingEntry | null;
  } {
    if (this.apiTimings.length === 0) {
      return { count: 0, average: 0, median: 0, p95: 0, slowest: null };
    }

    const sorted = [...this.apiTimings].sort((a, b) => a.value - b.value);
    const sum = sorted.reduce((acc, entry) => acc + entry.value, 0);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      count: sorted.length,
      average: sum / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)].value,
      p95: sorted[p95Index].value,
      slowest: sorted[sorted.length - 1]
    };
  }

  /**
   * Get render timing statistics
   */
  getRenderStats(): {
    count: number;
    average: number;
    slowest: RenderTimingEntry | null;
    byComponent: Record<string, { count: number; average: number }>;
  } {
    if (this.renderTimings.length === 0) {
      return { count: 0, average: 0, slowest: null, byComponent: {} };
    }

    const sum = this.renderTimings.reduce((acc, entry) => acc + entry.value, 0);
    const slowest = [...this.renderTimings].sort((a, b) => b.value - a.value)[0];

    // Group by component
    const byComponent: Record<string, { count: number; total: number }> = {};
    this.renderTimings.forEach(entry => {
      if (!byComponent[entry.component]) {
        byComponent[entry.component] = { count: 0, total: 0 };
      }
      byComponent[entry.component].count++;
      byComponent[entry.component].total += entry.value;
    });

    const componentStats: Record<string, { count: number; average: number }> = {};
    Object.entries(byComponent).forEach(([component, stats]) => {
      componentStats[component] = {
        count: stats.count,
        average: stats.total / stats.count
      };
    });

    return {
      count: this.renderTimings.length,
      average: sum / this.renderTimings.length,
      slowest,
      byComponent: componentStats
    };
  }

  /**
   * Clear all collected data
   */
  clearData(): void {
    this.webVitals.clear();
    this.apiTimings = [];
    this.renderTimings = [];
    this.customMarks = [];
  }

  /**
   * Export all performance data
   */
  exportData(): {
    sessionId: string;
    startTime: number;
    duration: number;
    webVitals: Record<string, WebVitalEntry[]>;
    apiTimings: ApiTimingEntry[];
    renderTimings: RenderTimingEntry[];
    customMarks: PerformanceEntry[];
    stats: {
      api: ReturnType<typeof this.getApiStats>;
      render: ReturnType<typeof this.getRenderStats>;
    };
  } {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      webVitals: this.getWebVitalsData(),
      apiTimings: [...this.apiTimings],
      renderTimings: [...this.renderTimings],
      customMarks: [...this.customMarks],
      stats: {
        api: this.getApiStats(),
        render: this.getRenderStats()
      }
    };
  }

  /**
   * Initialize Performance Observer for resource timing
   */
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.name.includes('/api/')) {
            // Track API calls from resource timing
            this.recordApiTiming(
              'GET', // Default to GET for resource timing
              entry.name,
              entry.duration
            );
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });

      // Observe long tasks
      const taskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            this.reporter.reportLongTask({
              name: 'long-task',
              value: entry.duration,
              timestamp: Date.now(),
              metadata: {
                startTime: entry.startTime
              }
            });
          }
        }
      });

      if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        taskObserver.observe({ entryTypes: ['longtask'] });
      }
    } catch (error) {
      console.error('Failed to initialize PerformanceObserver:', error);
    }
  }

  /**
   * Check if a metric exceeds its threshold
   */
  private checkThreshold(metric: string, value: number): void {
    const threshold = PerformanceThresholds.getThreshold(metric);
    if (threshold && value > threshold.critical) {
      this.reporter.reportThresholdViolation(metric, value, threshold.critical);
    }
  }

  /**
   * Determine if we should report metrics
   */
  private shouldReport(): boolean {
    // Always report in production
    if (process.env.NODE_ENV === 'production') {
      return true;
    }

    // In development, only report if explicitly enabled
    return process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_REPORTING === 'true';
  }

  /**
   * Record a custom measure
   */
  private recordCustomMeasure(name: string, duration: number): void {
    const entry: PerformanceEntry = {
      name: `measure:${name}`,
      value: duration,
      timestamp: Date.now(),
      metadata: {
        type: 'measure'
      }
    };

    this.customMarks.push(entry);
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const PerformanceMonitor = PerformanceMonitorService.getInstance();