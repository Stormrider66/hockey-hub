import { performanceMonitor } from './performanceMonitor';

export interface SimplePerformanceResult {
  timestamp: string;
  componentMetrics: {
    name: string;
    avgDuration: number;
    renderCount: number;
  }[];
  webVitals: {
    FCP?: number;
    LCP?: number;
    TTFB?: number;
  };
  bundleSize?: {
    estimated: number;
    reduction: number;
  };
}

/**
 * Simple performance test that runs in the same window
 */
export class SimplePerformanceTest {
  
  /**
   * Run a simple performance test based on current metrics
   */
  static runTest(): SimplePerformanceResult {
    console.log('🏃 Running simple performance test...');
    
    // Get current performance metrics
    const summary = performanceMonitor.getSummary();
    
    // Get Web Vitals
    const webVitals = this.collectWebVitals();
    
    // Convert summary to array format
    const componentMetrics = Object.entries(summary).map(([name, data]) => ({
      name,
      avgDuration: data.avgDuration,
      renderCount: data.count
    }));
    
    // Estimate bundle size impact based on enabled flags
    const bundleSize = this.estimateBundleSize();
    
    const result: SimplePerformanceResult = {
      timestamp: new Date().toISOString(),
      componentMetrics,
      webVitals,
      bundleSize
    };
    
    console.log('✅ Performance test complete!', result);
    return result;
  }
  
  /**
   * Collect Web Vitals from Performance API
   */
  private static collectWebVitals(): SimplePerformanceResult['webVitals'] {
    const vitals: SimplePerformanceResult['webVitals'] = {};
    
    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcp) vitals.FCP = fcp.startTime;
    
    // Get navigation timing for TTFB
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      vitals.TTFB = navEntries[0].responseStart - navEntries[0].requestStart;
    }
    
    // Try to get LCP from observer (may not be available)
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        vitals.LCP = lcpEntries[lcpEntries.length - 1].startTime;
      }
    } catch (e) {
      // LCP might not be available
    }
    
    return vitals;
  }
  
  /**
   * Estimate bundle size reduction based on feature flags
   */
  private static estimateBundleSize(): SimplePerformanceResult['bundleSize'] {
    // Check which optimizations are enabled by looking at localStorage
    const flags = JSON.parse(localStorage.getItem('physicalTrainer_performanceFlags') || '{}');
    
    let reduction = 0;
    
    if (flags.OPTIMIZE_FONTS) {
      // Font optimization doesn't reduce bundle but improves load time
      reduction += 0;
    }
    
    if (flags.REMOVE_UNUSED_IMPORTS) {
      reduction += 200; // 200KB reduction
    }
    
    if (flags.OPTIMIZE_ICONS) {
      reduction += 150; // 150KB reduction
    }
    
    const baseSize = 1400; // Base bundle size in KB
    
    return {
      estimated: baseSize - reduction,
      reduction
    };
  }
  
  /**
   * Generate a simple report
   */
  static generateReport(result: SimplePerformanceResult): string {
    let report = `# Performance Test Report\n\n`;
    report += `**Date**: ${new Date(result.timestamp).toLocaleString()}\n\n`;
    
    report += `## Component Performance\n\n`;
    report += `| Component | Avg Duration | Renders |\n`;
    report += `|-----------|-------------|----------|\n`;
    
    result.componentMetrics
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .forEach(metric => {
        const status = metric.avgDuration > 100 ? '⚠️' : '✅';
        report += `| ${status} ${metric.name} | ${metric.avgDuration.toFixed(2)}ms | ${metric.renderCount} |\n`;
      });
    
    report += `\n## Web Vitals\n\n`;
    if (result.webVitals.FCP) {
      report += `- **FCP**: ${result.webVitals.FCP.toFixed(0)}ms\n`;
    }
    if (result.webVitals.LCP) {
      report += `- **LCP**: ${result.webVitals.LCP.toFixed(0)}ms\n`;
    }
    if (result.webVitals.TTFB) {
      report += `- **TTFB**: ${result.webVitals.TTFB.toFixed(0)}ms\n`;
    }
    
    if (result.bundleSize) {
      report += `\n## Bundle Size\n\n`;
      report += `- **Estimated Size**: ${result.bundleSize.estimated}KB\n`;
      report += `- **Reduction**: ${result.bundleSize.reduction}KB\n`;
    }
    
    return report;
  }
}