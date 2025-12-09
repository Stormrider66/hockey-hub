'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, TrendingUp, TrendingDown, AlertCircle, 
  Download, Trash2, RefreshCw, BarChart3 
} from '@/components/icons';
import { performanceMonitor } from '../../utils/performanceMonitor';

interface PerformanceMetricDisplay {
  name: string;
  count: number;
  avgDuration: number;
  lastDuration?: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Performance Dashboard Component
 * Displays real-time performance metrics for the Physical Trainer dashboard
 * This is completely read-only and doesn't affect app functionality
 */
export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetricDisplay[]>([]);
  const [isMinimized, setIsMinimized] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Subscribe to metric updates
    const unsubscribe = performanceMonitor.subscribe(() => {
      updateMetrics();
    });

    // Initial load
    updateMetrics();

    // Auto-refresh every 2 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(updateMetrics, 2000);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const updateMetrics = () => {
    const summary = performanceMonitor.getSummary();
    const metricsArray: PerformanceMetricDisplay[] = [];

    Object.entries(summary).forEach(([name, data]) => {
      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (data.lastDuration && data.avgDuration) {
        const diff = data.lastDuration - data.avgDuration;
        const percentDiff = (diff / data.avgDuration) * 100;
        if (percentDiff > 10) trend = 'up';
        else if (percentDiff < -10) trend = 'down';
      }

      metricsArray.push({
        name,
        count: data.count,
        avgDuration: data.avgDuration,
        lastDuration: data.lastDuration,
        trend
      });
    });

    // Sort by average duration (slowest first)
    metricsArray.sort((a, b) => b.avgDuration - a.avgDuration);
    setMetrics(metricsArray);
  };

  const handleExport = () => {
    const data = performanceMonitor.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    performanceMonitor.clear();
    setMetrics([]);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (ms: number) => {
    if (ms < 16) return 'text-green-600'; // 60fps
    if (ms < 50) return 'text-yellow-600'; // Acceptable
    if (ms < 100) return 'text-orange-600'; // Slow
    return 'text-red-600'; // Very slow
  };

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="shadow-lg bg-background"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Performance Monitor
          {metrics.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {metrics.length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  // Full dashboard view
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] overflow-hidden">
      <Card className="shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="h-8 w-8"
              >
                <span className="text-lg">−</span>
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time component performance metrics
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {metrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No metrics collected yet</p>
              <p className="text-xs mt-1">Navigate around to see performance data</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto">
              {metrics.map((metric) => (
                <div
                  key={metric.name}
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-sm truncate flex-1">
                      {metric.name}
                    </h4>
                    <Badge variant="outline" className="text-xs ml-2">
                      {metric.count} calls
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Avg: </span>
                      <span className={getPerformanceColor(metric.avgDuration)}>
                        {formatDuration(metric.avgDuration)}
                      </span>
                    </div>
                    {metric.lastDuration !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Last: </span>
                        <span className={getPerformanceColor(metric.lastDuration)}>
                          {formatDuration(metric.lastDuration)}
                        </span>
                        {metric.trend === 'up' && (
                          <TrendingUp className="inline h-3 w-3 ml-1 text-red-500" />
                        )}
                        {metric.trend === 'down' && (
                          <TrendingDown className="inline h-3 w-3 ml-1 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Performance bar */}
                  <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        metric.avgDuration < 16 ? 'bg-green-500' :
                        metric.avgDuration < 50 ? 'bg-yellow-500' :
                        metric.avgDuration < 100 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min((metric.avgDuration / 100) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Fast (&lt;16ms)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  OK (&lt;50ms)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Slow (&gt;100ms)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to conditionally show performance dashboard
 */
export function usePerformanceDashboard(enabled: boolean = false) {
  const [showDashboard, setShowDashboard] = useState(enabled);

  useEffect(() => {
    // Listen for keyboard shortcut (Ctrl+Shift+P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowDashboard(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return { showDashboard, setShowDashboard };
}