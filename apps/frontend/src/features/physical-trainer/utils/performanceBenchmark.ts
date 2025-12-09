import { performanceMonitor } from './performanceMonitor';

export interface PerformanceBenchmark {
  timestamp: string;
  environment: string;
  metrics: {
    component: string;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    renderCount: number;
  }[];
  webVitals: {
    FCP?: number;
    LCP?: number;
    TTFB?: number;
    CLS?: number;
    FID?: number;
  };
}

export class PerformanceBenchmarkRunner {
  private results: PerformanceBenchmark[] = [];
  
  constructor(private environment: string = 'development') {}

  /**
   * Run a complete benchmark of the dashboard
   */
  async runBenchmark(): Promise<PerformanceBenchmark> {
    console.log('🏃 Starting performance benchmark...');
    
    // Clear existing metrics
    performanceMonitor.clearMetrics();
    
    // Wait for dashboard to be fully loaded
    await this.waitForDashboardLoad();
    
    // Simulate user interactions
    await this.simulateUserInteractions();
    
    // Collect metrics
    const benchmark = this.collectBenchmarkData();
    
    // Store results
    this.results.push(benchmark);
    
    console.log('✅ Benchmark complete!');
    return benchmark;
  }

  /**
   * Wait for dashboard to be fully loaded
   */
  private async waitForDashboardLoad(): Promise<void> {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        const dashboardElement = document.querySelector('[data-testid="physical-trainer-dashboard"]');
        if (dashboardElement) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
  }

  /**
   * Simulate typical user interactions
   */
  private async simulateUserInteractions(): Promise<void> {
    const tabs = ['sessions', 'calendar', 'library', 'testing', 'status', 'templates'];
    
    for (const tabName of tabs) {
      const tabElement = document.querySelector(`[data-testid="tab-${tabName}"]`);
      if (tabElement) {
        (tabElement as HTMLElement).click();
        await this.wait(500); // Wait for tab to load
      }
    }
    
    // Return to overview tab
    const overviewTab = document.querySelector('[data-testid="tab-overview"]');
    if (overviewTab) {
      (overviewTab as HTMLElement).click();
    }
  }

  /**
   * Collect benchmark data
   */
  private collectBenchmarkData(): PerformanceBenchmark {
    const summary = performanceMonitor.getSummary();
    
    const metrics = Object.entries(summary).map(([component, data]) => ({
      component,
      avgDuration: data.avgDuration,
      minDuration: Math.min(...performanceMonitor.getMetrics(component).map(m => m.duration)),
      maxDuration: Math.max(...performanceMonitor.getMetrics(component).map(m => m.duration)),
      renderCount: data.count,
    }));

    // Collect Web Vitals if available
    const webVitals = this.collectWebVitals();

    return {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      metrics,
      webVitals,
    };
  }

  /**
   * Collect Web Vitals metrics
   */
  private collectWebVitals(): PerformanceBenchmark['webVitals'] {
    const vitals: PerformanceBenchmark['webVitals'] = {};
    
    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcp) vitals.FCP = fcp.startTime;
    
    // Get largest contentful paint
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      vitals.LCP = lcpEntries[lcpEntries.length - 1].startTime;
    }
    
    // Get navigation timing
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      vitals.TTFB = navEntries[0].responseStart - navEntries[0].requestStart;
    }
    
    return vitals;
  }

  /**
   * Compare current benchmark with baseline
   */
  compareWithBaseline(baseline: PerformanceBenchmark, current: PerformanceBenchmark): {
    component: string;
    baselineAvg: number;
    currentAvg: number;
    change: number;
    improved: boolean;
  }[] {
    const comparison = [];
    
    for (const currentMetric of current.metrics) {
      const baselineMetric = baseline.metrics.find(m => m.component === currentMetric.component);
      if (baselineMetric) {
        const change = ((currentMetric.avgDuration - baselineMetric.avgDuration) / baselineMetric.avgDuration) * 100;
        comparison.push({
          component: currentMetric.component,
          baselineAvg: baselineMetric.avgDuration,
          currentAvg: currentMetric.avgDuration,
          change,
          improved: change < 0,
        });
      }
    }
    
    return comparison;
  }

  /**
   * Generate performance report
   */
  generateReport(benchmark: PerformanceBenchmark): string {
    let report = `# Performance Benchmark Report\n`;
    report += `Date: ${new Date(benchmark.timestamp).toLocaleString()}\n`;
    report += `Environment: ${benchmark.environment}\n\n`;
    
    report += `## Component Metrics\n\n`;
    report += `| Component | Avg Duration | Min | Max | Renders |\n`;
    report += `|-----------|-------------|-----|-----|----------|\n`;
    
    // Sort by average duration (slowest first)
    const sortedMetrics = [...benchmark.metrics].sort((a, b) => b.avgDuration - a.avgDuration);
    
    for (const metric of sortedMetrics) {
      const status = metric.avgDuration > 100 ? '⚠️' : '✅';
      report += `| ${status} ${metric.component} | ${metric.avgDuration.toFixed(2)}ms | ${metric.minDuration.toFixed(2)}ms | ${metric.maxDuration.toFixed(2)}ms | ${metric.renderCount} |\n`;
    }
    
    report += `\n## Web Vitals\n\n`;
    report += `| Metric | Value | Status |\n`;
    report += `|--------|-------|--------|\n`;
    
    if (benchmark.webVitals.FCP) {
      const fcpStatus = benchmark.webVitals.FCP < 1800 ? '✅' : benchmark.webVitals.FCP < 3000 ? '⚠️' : '❌';
      report += `| FCP | ${benchmark.webVitals.FCP.toFixed(2)}ms | ${fcpStatus} |\n`;
    }
    
    if (benchmark.webVitals.LCP) {
      const lcpStatus = benchmark.webVitals.LCP < 2500 ? '✅' : benchmark.webVitals.LCP < 4000 ? '⚠️' : '❌';
      report += `| LCP | ${benchmark.webVitals.LCP.toFixed(2)}ms | ${lcpStatus} |\n`;
    }
    
    if (benchmark.webVitals.TTFB) {
      const ttfbStatus = benchmark.webVitals.TTFB < 800 ? '✅' : benchmark.webVitals.TTFB < 1800 ? '⚠️' : '❌';
      report += `| TTFB | ${benchmark.webVitals.TTFB.toFixed(2)}ms | ${ttfbStatus} |\n`;
    }
    
    return report;
  }

  /**
   * Save benchmark results to localStorage
   */
  saveBenchmark(benchmark: PerformanceBenchmark): void {
    const key = 'physicalTrainer_performanceBenchmarks';
    const existing = localStorage.getItem(key);
    const benchmarks = existing ? JSON.parse(existing) : [];
    benchmarks.push(benchmark);
    
    // Keep only last 10 benchmarks
    if (benchmarks.length > 10) {
      benchmarks.shift();
    }
    
    localStorage.setItem(key, JSON.stringify(benchmarks));
  }

  /**
   * Load benchmark history
   */
  loadBenchmarkHistory(): PerformanceBenchmark[] {
    const key = 'physicalTrainer_performanceBenchmarks';
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Utility wait function
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a singleton instance
export const benchmarkRunner = new PerformanceBenchmarkRunner();