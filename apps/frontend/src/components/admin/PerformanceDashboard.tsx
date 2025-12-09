"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PerformanceMonitor } from '@/services/performance/PerformanceMonitor';
import { PerformanceThresholds } from '@/services/performance/PerformanceThresholds';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertCircle, Download, RefreshCw, Smartphone, Monitor, Tablet } from 'lucide-react';

interface WebVitalData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PerformanceMetrics {
  webVitals: Record<string, WebVitalData[]>;
  apiStats: ReturnType<typeof PerformanceMonitor.getApiStats>;
  renderStats: ReturnType<typeof PerformanceMonitor.getRenderStats>;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    webVitals: {},
    apiStats: { count: 0, average: 0, median: 0, p95: 0, slowest: null },
    renderStats: { count: 0, average: 0, slowest: null, byComponent: {} }
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Fetch metrics
  const fetchMetrics = () => {
    const webVitals = PerformanceMonitor.getWebVitalsData();
    const apiStats = PerformanceMonitor.getApiStats();
    const renderStats = PerformanceMonitor.getRenderStats();

    setMetrics({ webVitals, apiStats, renderStats });
  };

  // Auto-refresh
  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, refreshInterval]);

  // Export data
  const handleExport = () => {
    const data = PerformanceMonitor.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear data
  const handleClear = () => {
    PerformanceMonitor.clearData();
    fetchMetrics();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Real-time application performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            Clear
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="webvitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="render">Render Performance</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <WebVitalCard
              title="LCP"
              description="Largest Contentful Paint"
              data={metrics.webVitals.LCP?.[metrics.webVitals.LCP.length - 1]}
            />
            <WebVitalCard
              title="FID"
              description="First Input Delay"
              data={metrics.webVitals.FID?.[metrics.webVitals.FID.length - 1]}
            />
            <WebVitalCard
              title="CLS"
              description="Cumulative Layout Shift"
              data={metrics.webVitals.CLS?.[metrics.webVitals.CLS.length - 1]}
            />
            <WebVitalCard
              title="TTFB"
              description="Time to First Byte"
              data={metrics.webVitals.TTFB?.[metrics.webVitals.TTFB.length - 1]}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>API Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Requests</span>
                    <span className="font-medium">{metrics.apiStats.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average Response</span>
                    <span className="font-medium">{metrics.apiStats.average.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">P95 Response</span>
                    <span className="font-medium">{metrics.apiStats.p95.toFixed(0)}ms</span>
                  </div>
                  {metrics.apiStats.slowest && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Slowest: {metrics.apiStats.slowest.method} {metrics.apiStats.slowest.url} ({metrics.apiStats.slowest.value.toFixed(0)}ms)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Render Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Renders</span>
                    <span className="font-medium">{metrics.renderStats.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average Render</span>
                    <span className="font-medium">{metrics.renderStats.average.toFixed(2)}ms</span>
                  </div>
                  {metrics.renderStats.slowest && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Slowest: {metrics.renderStats.slowest.component} ({metrics.renderStats.slowest.value.toFixed(2)}ms)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Web Vitals Tab */}
        <TabsContent value="webvitals" className="space-y-4">
          <WebVitalsChart data={metrics.webVitals} />
        </TabsContent>

        {/* API Performance Tab */}
        <TabsContent value="api" className="space-y-4">
          <ApiPerformanceView stats={metrics.apiStats} />
        </TabsContent>

        {/* Render Performance Tab */}
        <TabsContent value="render" className="space-y-4">
          <RenderPerformanceView stats={metrics.renderStats} />
        </TabsContent>

        {/* Thresholds Tab */}
        <TabsContent value="thresholds" className="space-y-4">
          <ThresholdsView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Web Vital Card Component
const WebVitalCard: React.FC<{
  title: string;
  description: string;
  data?: WebVitalData;
}> = ({ title, description, data }) => {
  const threshold = PerformanceThresholds.getThreshold(title);
  const status = data ? PerformanceThresholds.checkThreshold(title, data.value).status : 'good';

  const statusColor = {
    good: 'text-green-600',
    'needs-improvement': 'text-yellow-600',
    poor: 'text-red-600',
    critical: 'text-red-600'
  }[status];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {data ? (
            <span className={statusColor}>
              {title === 'CLS' ? data.value.toFixed(3) : `${data.value.toFixed(0)}ms`}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
        {data && (
          <Badge variant={status === 'good' ? 'default' : status === 'critical' ? 'destructive' : 'secondary'}>
            {data.rating}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

// Web Vitals Chart Component
const WebVitalsChart: React.FC<{ data: Record<string, WebVitalData[]> }> = ({ data }) => {
  const chartData = useMemo(() => {
    const timePoints = new Map<number, any>();
    
    Object.entries(data).forEach(([metric, values]) => {
      values.forEach(value => {
        const time = Math.floor(value.timestamp / 10000) * 10000; // Round to 10s
        if (!timePoints.has(time)) {
          timePoints.set(time, { time });
        }
        timePoints.get(time)[metric] = value.value;
      });
    });

    return Array.from(timePoints.values())
      .sort((a, b) => a.time - b.time)
      .slice(-20); // Last 20 data points
  }, [data]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No web vitals data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Web Vitals Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value as number).toLocaleTimeString()}
              formatter={(value: number) => `${value.toFixed(0)}ms`}
            />
            <Line type="monotone" dataKey="LCP" stroke="#8884d8" />
            <Line type="monotone" dataKey="FID" stroke="#82ca9d" />
            <Line type="monotone" dataKey="FCP" stroke="#ffc658" />
            <Line type="monotone" dataKey="TTFB" stroke="#ff7c7c" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// API Performance View
const ApiPerformanceView: React.FC<{ stats: PerformanceMetrics['apiStats'] }> = ({ stats }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Response Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Fast (&lt;200ms)</span>
                <span className="text-sm font-medium">
                  {stats.count > 0 ? Math.round((stats.median < 200 ? 50 : 0)) : 0}%
                </span>
              </div>
              <Progress value={stats.count > 0 ? (stats.median < 200 ? 50 : 0) : 0} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Acceptable (200-1000ms)</span>
                <span className="text-sm font-medium">
                  {stats.count > 0 ? Math.round((stats.median >= 200 && stats.median < 1000 ? 50 : 25)) : 0}%
                </span>
              </div>
              <Progress value={stats.count > 0 ? (stats.median >= 200 && stats.median < 1000 ? 50 : 25) : 0} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Slow (&gt;1000ms)</span>
                <span className="text-sm font-medium">
                  {stats.count > 0 ? Math.round((stats.median >= 1000 ? 50 : 0)) : 0}%
                </span>
              </div>
              <Progress value={stats.count > 0 ? (stats.median >= 1000 ? 50 : 0) : 0} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Render Performance View
const RenderPerformanceView: React.FC<{ stats: PerformanceMetrics['renderStats'] }> = ({ stats }) => {
  const componentData = Object.entries(stats.byComponent)
    .map(([name, data]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      count: data.count,
      average: data.average
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 10);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Component Render Times</CardTitle>
        </CardHeader>
        <CardContent>
          {componentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={componentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}ms`} />
                <Bar dataKey="average" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No render data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Thresholds View
const ThresholdsView: React.FC = () => {
  const thresholds = PerformanceThresholds.getBudgetSummary();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Thresholds</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {thresholds.map(({ metric, budget, unit }) => (
            <div key={metric} className="border-b pb-4 last:border-b-0">
              <h4 className="font-medium mb-2">{metric}</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Good:</span>
                  <span className="ml-2 font-medium text-green-600">
                    ≤ {budget.good}{unit}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Needs Improvement:</span>
                  <span className="ml-2 font-medium text-yellow-600">
                    ≤ {budget.needsImprovement}{unit}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Critical:</span>
                  <span className="ml-2 font-medium text-red-600">
                    &gt; {budget.critical}{unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceDashboard;