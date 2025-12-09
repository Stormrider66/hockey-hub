#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface BenchmarkResult {
  timestamp: string;
  url: string;
  metrics: {
    FCP: number;
    LCP: number;
    TTFB: number;
    domContentLoaded: number;
    load: number;
  };
  componentMetrics: Record<string, { avg: number; count: number }>;
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  };
}

async function runBenchmark(): Promise<BenchmarkResult> {
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable performance metrics collection
  await page.evaluateOnNewDocument(() => {
    window.performanceMetrics = {
      components: {},
      vitals: {}
    };
  });

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('📊 Starting Physical Trainer Dashboard performance benchmark...\n');

  try {
    // Navigate to the monitored dashboard
    const url = process.env.APP_URL || 'http://localhost:3010/physicaltrainer/monitored';
    console.log(`🌐 Navigating to ${url}...`);
    
    const navigationStart = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const navigationEnd = Date.now();
    
    console.log(`✅ Page loaded in ${navigationEnd - navigationStart}ms`);

    // Wait for dashboard to be fully rendered
    await page.waitForSelector('[data-testid="physical-trainer-dashboard"]', { timeout: 30000 });
    
    // Collect initial metrics
    const initialMetrics = await collectMetrics(page);
    console.log('\n📈 Initial load metrics collected');

    // Simulate user interactions
    console.log('\n🤖 Simulating user interactions...');
    await simulateTabSwitching(page);
    
    // Collect final metrics
    const finalMetrics = await collectMetrics(page);
    
    // Get component performance data
    const componentMetrics = await page.evaluate(() => {
      // Access the performance monitor data if available
      const performanceData = (window as any).__PERFORMANCE_DATA__ || {};
      return performanceData;
    });

    // Prepare results
    const result: BenchmarkResult = {
      timestamp: new Date().toISOString(),
      url,
      metrics: finalMetrics,
      componentMetrics,
      memoryUsage: await page.evaluate(() => ({
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
      }))
    };

    // Generate report
    generateReport(result);
    
    // Save results
    saveResults(result);

    return result;

  } finally {
    await browser.close();
  }
}

async function collectMetrics(page: puppeteer.Page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    // Get LCP
    let lcp = 0;
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      lcp = lcpEntries[lcpEntries.length - 1].startTime;
    }

    return {
      FCP: fcp?.startTime || 0,
      LCP: lcp,
      TTFB: navigation.responseStart - navigation.requestStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
    };
  });
}

async function simulateTabSwitching(page: puppeteer.Page) {
  const tabs = ['sessions', 'calendar', 'library', 'testing', 'status'];
  
  for (const tab of tabs) {
    try {
      console.log(`  📍 Switching to ${tab} tab...`);
      await page.click(`[role="tab"][aria-label*="${tab}" i]`);
      await page.waitForTimeout(1000); // Wait for tab content to load
    } catch (e) {
      console.log(`  ⚠️  Could not switch to ${tab} tab`);
    }
  }
  
  // Return to overview
  await page.click('[role="tab"][aria-label*="overview" i]');
}

function generateReport(result: BenchmarkResult) {
  console.log('\n📊 PERFORMANCE BENCHMARK RESULTS');
  console.log('================================\n');
  
  console.log('🎯 Core Web Vitals:');
  console.log(`  FCP:  ${formatMetric(result.metrics.FCP, 1800, 3000)}ms`);
  console.log(`  LCP:  ${formatMetric(result.metrics.LCP, 2500, 4000)}ms`);
  console.log(`  TTFB: ${formatMetric(result.metrics.TTFB, 800, 1800)}ms`);
  
  console.log('\n⏱️  Page Load Metrics:');
  console.log(`  DOM Content Loaded: ${result.metrics.domContentLoaded.toFixed(2)}ms`);
  console.log(`  Page Load Complete: ${result.metrics.load.toFixed(2)}ms`);
  
  console.log('\n💾 Memory Usage:');
  const heapUsage = (result.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2);
  const totalHeap = (result.memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2);
  console.log(`  JS Heap: ${heapUsage}MB / ${totalHeap}MB`);
  
  console.log('\n🚀 Performance Summary:');
  const score = calculatePerformanceScore(result);
  console.log(`  Overall Score: ${getScoreEmoji(score)} ${score}/100`);
}

function formatMetric(value: number, goodThreshold: number, poorThreshold: number): string {
  const formatted = value.toFixed(2);
  if (value <= goodThreshold) return `✅ ${formatted}`;
  if (value <= poorThreshold) return `⚠️  ${formatted}`;
  return `❌ ${formatted}`;
}

function calculatePerformanceScore(result: BenchmarkResult): number {
  let score = 100;
  
  // Deduct points for poor metrics
  if (result.metrics.FCP > 3000) score -= 20;
  else if (result.metrics.FCP > 1800) score -= 10;
  
  if (result.metrics.LCP > 4000) score -= 30;
  else if (result.metrics.LCP > 2500) score -= 15;
  
  if (result.metrics.TTFB > 1800) score -= 20;
  else if (result.metrics.TTFB > 800) score -= 10;
  
  // Memory usage penalty
  const heapUsageMB = result.memoryUsage.usedJSHeapSize / 1024 / 1024;
  if (heapUsageMB > 150) score -= 15;
  else if (heapUsageMB > 100) score -= 5;
  
  return Math.max(0, score);
}

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  if (score >= 50) return '🟠';
  return '🔴';
}

function saveResults(result: BenchmarkResult) {
  const filename = `benchmark-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
  const filepath = join(process.cwd(), 'performance-reports', filename);
  
  try {
    writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${filepath}`);
  } catch (e) {
    console.log('\n⚠️  Could not save results to file');
  }
}

// Run the benchmark
runBenchmark()
  .then(() => {
    console.log('\n✅ Benchmark completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  });