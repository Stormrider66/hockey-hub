/**
 * Performance Testing Utilities for Physical Trainer Dashboard
 * Provides utilities for measuring component performance, memory usage, and render times
 */

import { act, render, RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { performance, PerformanceObserver } from 'perf_hooks';

// Performance metrics interface
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  componentCount: number;
  domNodeCount: number;
  bundleSize?: number;
}

// Performance budget interface
export interface PerformanceBudget {
  maxRenderTime: number; // milliseconds
  maxMemoryUsage: number; // MB
  maxBundleSize: number; // KB
  maxDomNodes: number;
}

// Default performance budgets
export const DEFAULT_BUDGETS: PerformanceBudget = {
  maxRenderTime: 100, // 100ms
  maxMemoryUsage: 50, // 50MB
  maxBundleSize: 500, // 500KB
  maxDomNodes: 1500,
};

/**
 * Measure component render performance
 */
export async function measureRenderPerformance(
  renderFn: () => RenderResult
): Promise<PerformanceMetrics> {
  // Clear any existing marks
  performance.clearMarks();
  performance.clearMeasures();

  // Mark start
  performance.mark('render-start');

  // Initial memory snapshot
  const initialMemory = (performance as any).memory
    ? { ...(performance as any).memory }
    : { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };

  // Render component
  let result: RenderResult;
  await act(async () => {
    result = renderFn();
  });

  // Mark end
  performance.mark('render-end');

  // Measure render time
  performance.measure('render-time', 'render-start', 'render-end');
  const renderMeasure = performance.getEntriesByName('render-time')[0];
  const renderTime = renderMeasure.duration;

  // Final memory snapshot
  const finalMemory = (performance as any).memory
    ? { ...(performance as any).memory }
    : { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };

  // Count DOM nodes
  const domNodeCount = result!.container.querySelectorAll('*').length;

  // Count React components (approximate)
  const componentCount = result!.container.querySelectorAll('[data-testid]').length;

  return {
    renderTime,
    memoryUsage: {
      usedJSHeapSize: finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize,
      totalJSHeapSize: finalMemory.totalJSHeapSize,
      jsHeapSizeLimit: finalMemory.jsHeapSizeLimit,
    },
    componentCount,
    domNodeCount,
  };
}

/**
 * Measure multiple renders and return average
 */
export async function measureAveragePerformance(
  renderFn: () => RenderResult,
  iterations: number = 5
): Promise<PerformanceMetrics> {
  const metrics: PerformanceMetrics[] = [];

  for (let i = 0; i < iterations; i++) {
    // Clean up between iterations
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (global.gc) {
        global.gc();
      }
    }

    const metric = await measureRenderPerformance(renderFn);
    metrics.push(metric);
  }

  // Calculate averages
  return {
    renderTime: metrics.reduce((sum, m) => sum + m.renderTime, 0) / iterations,
    memoryUsage: {
      usedJSHeapSize:
        metrics.reduce((sum, m) => sum + m.memoryUsage.usedJSHeapSize, 0) / iterations,
      totalJSHeapSize:
        metrics.reduce((sum, m) => sum + m.memoryUsage.totalJSHeapSize, 0) / iterations,
      jsHeapSizeLimit: metrics[0].memoryUsage.jsHeapSizeLimit,
    },
    componentCount:
      metrics.reduce((sum, m) => sum + m.componentCount, 0) / iterations,
    domNodeCount: metrics.reduce((sum, m) => sum + m.domNodeCount, 0) / iterations,
  };
}

/**
 * Validate performance against budgets
 */
export function validatePerformanceBudget(
  metrics: PerformanceMetrics,
  budget: PerformanceBudget = DEFAULT_BUDGETS
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (metrics.renderTime > budget.maxRenderTime) {
    violations.push(
      `Render time (${metrics.renderTime.toFixed(2)}ms) exceeds budget (${
        budget.maxRenderTime
      }ms)`
    );
  }

  const memoryUsageMB = metrics.memoryUsage.usedJSHeapSize / (1024 * 1024);
  if (memoryUsageMB > budget.maxMemoryUsage) {
    violations.push(
      `Memory usage (${memoryUsageMB.toFixed(2)}MB) exceeds budget (${
        budget.maxMemoryUsage
      }MB)`
    );
  }

  if (metrics.domNodeCount > budget.maxDomNodes) {
    violations.push(
      `DOM node count (${metrics.domNodeCount}) exceeds budget (${budget.maxDomNodes})`
    );
  }

  if (metrics.bundleSize && metrics.bundleSize > budget.maxBundleSize) {
    violations.push(
      `Bundle size (${metrics.bundleSize}KB) exceeds budget (${budget.maxBundleSize}KB)`
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Create a mock store with performance optimizations
 */
export function createPerformanceTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      // Add your reducers here
      auth: (state = {}) => state,
      trainingApi: (state = {}) => state,
      userApi: (state = {}) => state,
      calendarApi: (state = {}) => state,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false, // Disable for performance testing
      }),
  });
}

/**
 * Generate large dataset for performance testing
 */
export function generateLargeDataset(size: number) {
  return {
    players: Array.from({ length: size }, (_, i) => ({
      id: `player-${i}`,
      name: `Player ${i}`,
      team: `Team ${Math.floor(i / 20)}`,
      position: ['Forward', 'Defense', 'Goalie'][i % 3],
      status: ['active', 'injured', 'limited'][i % 3],
      metrics: {
        attendance: Math.random() * 100,
        performance: Math.random() * 100,
        fitness: Math.random() * 100,
      },
    })),
    sessions: Array.from({ length: size }, (_, i) => ({
      id: `session-${i}`,
      name: `Session ${i}`,
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
      type: ['strength', 'conditioning', 'hybrid', 'agility'][i % 4],
      duration: 60 + (i % 30),
      participants: Array.from({ length: 20 }, (_, j) => `player-${i * 20 + j}`),
    })),
    exercises: Array.from({ length: size * 5 }, (_, i) => ({
      id: `exercise-${i}`,
      name: `Exercise ${i}`,
      category: ['strength', 'cardio', 'flexibility', 'balance'][i % 4],
      equipment: ['barbell', 'dumbbell', 'machine', 'bodyweight'][i % 4],
      difficulty: ['beginner', 'intermediate', 'advanced'][i % 3],
    })),
  };
}

/**
 * Mock heavy operations for testing
 */
export function mockHeavyOperation(duration: number = 1000): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    while (Date.now() - start < duration) {
      // Simulate heavy computation
      Math.sqrt(Math.random() * 1000000);
    }
    resolve();
  });
}

/**
 * Measure chart rendering performance
 */
export async function measureChartPerformance(
  chartComponent: React.ReactElement,
  dataPoints: number
): Promise<PerformanceMetrics> {
  // Generate chart data
  const chartData = Array.from({ length: dataPoints }, (_, i) => ({
    x: i,
    y: Math.random() * 100,
    label: `Point ${i}`,
  }));

  // Create component with data
  const componentWithData = React.cloneElement(chartComponent, { data: chartData });

  // Measure render performance
  return measureRenderPerformance(() =>
    render(
      <Provider store={createPerformanceTestStore()}>
        {componentWithData}
      </Provider>
    )
  );
}

/**
 * Test lazy loading behavior
 */
export async function testLazyLoadingPerformance(
  lazyComponent: React.LazyExoticComponent<any>
): Promise<{ loadTime: number; renderTime: number }> {
  performance.mark('lazy-load-start');

  let loadTime = 0;
  let renderTime = 0;

  // Wrap in Suspense
  const TestComponent = () => (
    <React.Suspense fallback={<div>Loading...</div>}>
      <lazyComponent />
    </React.Suspense>
  );

  // Measure initial render (loading state)
  performance.mark('initial-render-start');
  const { rerender } = render(
    <Provider store={createPerformanceTestStore()}>
      <TestComponent />
    </Provider>
  );
  performance.mark('initial-render-end');

  // Wait for lazy component to load
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  performance.mark('lazy-load-end');
  performance.measure('lazy-load-time', 'lazy-load-start', 'lazy-load-end');
  const loadMeasure = performance.getEntriesByName('lazy-load-time')[0];
  loadTime = loadMeasure.duration;

  // Measure final render
  performance.mark('final-render-start');
  rerender(
    <Provider store={createPerformanceTestStore()}>
      <TestComponent />
    </Provider>
  );
  performance.mark('final-render-end');
  performance.measure('final-render-time', 'final-render-start', 'final-render-end');
  const renderMeasure = performance.getEntriesByName('final-render-time')[0];
  renderTime = renderMeasure.duration;

  return { loadTime, renderTime };
}

/**
 * Performance reporter for CI/CD
 */
export class PerformanceReporter {
  private results: Map<string, PerformanceMetrics> = new Map();

  record(testName: string, metrics: PerformanceMetrics) {
    this.results.set(testName, metrics);
  }

  generateReport(): string {
    let report = '# Performance Test Report\n\n';
    report += '| Test | Render Time (ms) | Memory (MB) | DOM Nodes | Status |\n';
    report += '|------|------------------|-------------|-----------|--------|\n';

    this.results.forEach((metrics, testName) => {
      const validation = validatePerformanceBudget(metrics);
      const status = validation.passed ? '✅' : '❌';
      const memoryMB = metrics.memoryUsage.usedJSHeapSize / (1024 * 1024);

      report += `| ${testName} | ${metrics.renderTime.toFixed(2)} | ${memoryMB.toFixed(
        2
      )} | ${metrics.domNodeCount} | ${status} |\n`;
    });

    return report;
  }

  saveToFile(filepath: string) {
    const fs = require('fs');
    fs.writeFileSync(filepath, this.generateReport());
  }
}