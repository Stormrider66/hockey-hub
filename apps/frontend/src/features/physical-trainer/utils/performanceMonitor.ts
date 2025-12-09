/**
 * Non-intrusive performance monitoring utilities for Physical Trainer dashboard
 * Phase 0.1 of Performance Optimization V2
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitorService {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: Set<(metrics: Map<string, PerformanceMetric[]>) => void> = new Set();
  private maxMetricsPerComponent = 100; // Prevent memory leaks

  /**
   * Start measuring a component or operation
   */
  startMeasure(name: string, metadata?: Record<string, any>): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const componentMetrics = this.metrics.get(name)!;
    componentMetrics.push(metric);

    // Prevent memory leaks by limiting stored metrics
    if (componentMetrics.length > this.maxMetricsPerComponent) {
      componentMetrics.shift();
    }

    // Also use native Performance API
    try {
      performance.mark(`${name}-start`);
    } catch (e) {
      // Ignore if mark already exists
    }
  }

  /**
   * End measuring a component or operation
   */
  endMeasure(name: string): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const componentMetrics = this.metrics.get(name);
    if (!componentMetrics || componentMetrics.length === 0) return;

    const lastMetric = componentMetrics[componentMetrics.length - 1];
    if (!lastMetric.endTime) {
      lastMetric.endTime = performance.now();
      lastMetric.duration = lastMetric.endTime - lastMetric.startTime;
    }

    // Use native Performance API
    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    } catch (e) {
      // Ignore errors
    }

    // Notify observers
    this.notifyObservers();
  }

  /**
   * Get metrics for a specific component
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.metrics);
  }

  /**
   * Get average duration for a component
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetrics(name);
    const completedMetrics = metrics.filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) return 0;
    
    const sum = completedMetrics.reduce((acc, m) => acc + m.duration!, 0);
    return sum / completedMetrics.length;
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; avgDuration: number; lastDuration?: number }> {
    const summary: Record<string, { count: number; avgDuration: number; lastDuration?: number }> = {};
    
    this.metrics.forEach((metrics, name) => {
      const completedMetrics = metrics.filter(m => m.duration !== undefined);
      const avgDuration = this.getAverageDuration(name);
      const lastMetric = completedMetrics[completedMetrics.length - 1];
      
      summary[name] = {
        count: completedMetrics.length,
        avgDuration,
        lastDuration: lastMetric?.duration
      };
    });
    
    return summary;
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(callback: (metrics: Map<string, PerformanceMetric[]>) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.notifyObservers();
  }

  /**
   * Clear all metrics (alias for backward compatibility)
   */
  clearMetrics(): void {
    this.clear();
  }

  /**
   * Clear metrics for a specific component
   */
  clearComponent(name: string): void {
    this.metrics.delete(name);
    this.notifyObservers();
  }

  private notifyObservers(): void {
    this.observers.forEach(callback => callback(this.getAllMetrics()));
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: Object.fromEntries(this.metrics),
      summary: this.getSummary()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Log current performance summary to console
   */
  logSummary(): void {
    const summary = this.getSummary();
    console.group('🎯 Performance Summary');
    
    Object.entries(summary).forEach(([name, data]) => {
      console.log(
        `📊 ${name}: ${data.count} renders, avg: ${data.avgDuration.toFixed(2)}ms, last: ${data.lastDuration?.toFixed(2)}ms`
      );
    });
    
    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitorService();

// Export for use in components
export type { PerformanceMetric };
export { PerformanceMonitorService };