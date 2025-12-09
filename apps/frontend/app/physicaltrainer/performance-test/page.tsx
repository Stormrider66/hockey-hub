'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Download, RefreshCw, Activity, TrendingUp, AlertCircle } from '@/components/icons';
import { benchmarkRunner, PerformanceBenchmark } from '@/features/physical-trainer/utils/performanceBenchmark';
import { performanceMonitor } from '@/features/physical-trainer/utils/performanceMonitor';
import { SimplePerformanceTest, type SimplePerformanceResult } from '@/features/physical-trainer/utils/simplePerformanceTest';

export default function PerformanceTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentBenchmark, setCurrentBenchmark] = useState<PerformanceBenchmark | null>(null);
  const [simpleResult, setSimpleResult] = useState<SimplePerformanceResult | null>(null);
  const [benchmarkHistory, setBenchmarkHistory] = useState<PerformanceBenchmark[]>([]);
  const [testProgress, setTestProgress] = useState<string>('');

  useEffect(() => {
    // Load benchmark history on mount
    const history = benchmarkRunner.loadBenchmarkHistory();
    setBenchmarkHistory(history);
  }, []);

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setTestProgress('Starting performance benchmark...');

    try {
      // Clear existing metrics
      performanceMonitor.clearMetrics();
      
      setTestProgress('Loading Physical Trainer Dashboard...');
      
      // Open dashboard in new window
      const dashboardWindow = window.open('/physicaltrainer/monitored', '_blank', 'width=1920,height=1080');
      
      if (!dashboardWindow) {
        throw new Error('Could not open dashboard window. Please allow popups.');
      }

      // Wait for dashboard to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setTestProgress('Running benchmark tests...');
      
      // Run the benchmark
      const benchmark = await benchmarkRunner.runBenchmark();
      
      // Save results
      benchmarkRunner.saveBenchmark(benchmark);
      
      // Update state
      setCurrentBenchmark(benchmark);
      setBenchmarkHistory([...benchmarkHistory, benchmark]);
      
      setTestProgress('Benchmark complete!');
      
      // Close the dashboard window
      dashboardWindow.close();
      
    } catch (error) {
      console.error('Benchmark failed:', error);
      const message = (error as any)?.message ?? String(error);
      setTestProgress(`Error: ${message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runSimpleTest = () => {
    setIsRunning(true);
    setTestProgress('Running quick performance test...');
    
    try {
      // Run the simple test
      const result = SimplePerformanceTest.runTest();
      setSimpleResult(result);
      setTestProgress('Test complete!');
    } catch (error) {
      console.error('Simple test failed:', error);
      const message = (error as any)?.message ?? String(error);
      setTestProgress(`Error: ${message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadResults = () => {
    if (!currentBenchmark && !simpleResult) return;
    
    const report = simpleResult 
      ? SimplePerformanceTest.generateReport(simpleResult)
      : benchmarkRunner.generateReport(currentBenchmark as PerformanceBenchmark);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMetricStatus = (value: number, goodThreshold: number, poorThreshold: number) => {
    if (value <= goodThreshold) return { color: 'text-green-600', icon: '✅' };
    if (value <= poorThreshold) return { color: 'text-yellow-600', icon: '⚠️' };
    return { color: 'text-red-600', icon: '❌' };
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Physical Trainer Dashboard Performance Test</h1>
        <p className="text-muted-foreground">
          Run automated performance benchmarks to measure and track dashboard performance over time.
        </p>
      </div>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={runSimpleTest}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  Quick Test
                </>
              )}
            </Button>

            <Button
              onClick={runPerformanceTest}
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Full Test (New Window)
            </Button>
            
            <Button
              onClick={downloadResults}
              disabled={!currentBenchmark && !simpleResult}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
          
          {testProgress && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{testProgress}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Current Results */}
      {(currentBenchmark || simpleResult) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Latest Benchmark Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Web Vitals */}
              {simpleResult ? (
                <>
                  {simpleResult.webVitals?.FCP && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">First Contentful Paint (FCP)</div>
                      <div className={`text-2xl font-bold ${getMetricStatus(simpleResult.webVitals.FCP, 1800, 3000).color}`}>
                        {getMetricStatus(simpleResult.webVitals.FCP, 1800, 3000).icon} {simpleResult.webVitals.FCP.toFixed(0)}ms
                      </div>
                    </div>
                  )}
                  
                  {simpleResult.webVitals?.TTFB && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Time to First Byte (TTFB)</div>
                      <div className={`text-2xl font-bold ${getMetricStatus(simpleResult.webVitals.TTFB, 800, 1800).color}`}>
                        {getMetricStatus(simpleResult.webVitals.TTFB, 800, 1800).icon} {simpleResult.webVitals.TTFB.toFixed(0)}ms
                      </div>
                    </div>
                  )}
                  
                  {simpleResult.bundleSize && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Bundle Size</div>
                      <div className="text-2xl font-bold text-green-600">
                        📦 {simpleResult.bundleSize.estimated}KB (-{simpleResult.bundleSize.reduction}KB)
                      </div>
                    </div>
                  )}
                </>
              ) : currentBenchmark?.webVitals?.FCP && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">First Contentful Paint (FCP)</div>
                  <div className={`text-2xl font-bold ${getMetricStatus(currentBenchmark.webVitals.FCP, 1800, 3000).color}`}>
                    {getMetricStatus(currentBenchmark.webVitals.FCP, 1800, 3000).icon} {currentBenchmark.webVitals.FCP.toFixed(0)}ms
                  </div>
                </div>
              )}
              
              {currentBenchmark?.webVitals?.LCP && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Largest Contentful Paint (LCP)</div>
                  <div className={`text-2xl font-bold ${getMetricStatus(currentBenchmark.webVitals.LCP, 2500, 4000).color}`}>
                    {getMetricStatus(currentBenchmark.webVitals.LCP, 2500, 4000).icon} {currentBenchmark.webVitals.LCP.toFixed(0)}ms
                  </div>
                </div>
              )}
              
              {currentBenchmark?.webVitals?.TTFB && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Time to First Byte (TTFB)</div>
                  <div className={`text-2xl font-bold ${getMetricStatus(currentBenchmark.webVitals.TTFB, 800, 1800).color}`}>
                    {getMetricStatus(currentBenchmark.webVitals.TTFB, 800, 1800).icon} {currentBenchmark.webVitals.TTFB.toFixed(0)}ms
                  </div>
                </div>
              )}
            </div>

            {/* Component Metrics */}
            <div>
              <h3 className="font-semibold mb-3">Component Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Component</th>
                      <th className="text-right py-2">Avg Duration</th>
                      <th className="text-right py-2">Min</th>
                      <th className="text-right py-2">Max</th>
                      <th className="text-right py-2">Renders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(simpleResult?.componentMetrics || currentBenchmark?.metrics || [])
                      .sort((a, b) => b.avgDuration - a.avgDuration)
                      .slice(0, 10)
                      .map((metric) => (
                        <tr key={("component" in metric ? metric.component : metric.name)} className="border-b">
                          <td className="py-2">
                            {metric.avgDuration > 100 ? '⚠️' : '✅'} {"component" in metric ? metric.component : metric.name}
                          </td>
                          <td className="text-right py-2">{metric.avgDuration.toFixed(2)}ms</td>
                          <td className="text-right py-2">{("minDuration" in metric ? metric.minDuration.toFixed(2) : '-') }ms</td>
                          <td className="text-right py-2">{("maxDuration" in metric ? metric.maxDuration.toFixed(2) : '-') }ms</td>
                          <td className="text-right py-2">{metric.renderCount}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmark History */}
      {benchmarkHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Benchmark History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {benchmarkHistory.slice(-5).reverse().map((benchmark, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      {new Date(benchmark.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Environment: {benchmark.environment}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>FCP: {benchmark.webVitals?.FCP?.toFixed(0) || 'N/A'}ms</div>
                    <div>LCP: {benchmark.webVitals?.LCP?.toFixed(0) || 'N/A'}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> This test will open the Physical Trainer dashboard in a new window,
          simulate user interactions (switching between tabs), and collect performance metrics. The test takes
          about 30 seconds to complete. Make sure to allow popups for this test to work properly.
        </AlertDescription>
      </Alert>
    </div>
  );
}