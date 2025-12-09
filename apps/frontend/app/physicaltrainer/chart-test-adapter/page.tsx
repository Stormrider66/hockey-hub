'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeatureFlagDashboard } from '@/features/physical-trainer/components/shared/FeatureFlagDashboard';
import { useFeatureFlag } from '@/features/physical-trainer/utils/featureFlags';

// Import adapters directly
import { LightweightLineChartAdapter } from '@/features/physical-trainer/components/charts/LightweightLineChartAdapter';
import { LightweightBarChartAdapter } from '@/features/physical-trainer/components/charts/LightweightBarChartAdapter';
import { LightweightAreaChartAdapter } from '@/features/physical-trainer/components/charts/LightweightAreaChartAdapter';
import { LightweightPieChartAdapter } from '@/features/physical-trainer/components/charts/LightweightPieChartAdapter';

export default function ChartTestAdapterPage() {
  const [showFeatureFlags, setShowFeatureFlags] = useState(false);
  const useLightweightCharts = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  // Sample data for testing
  const lineData = [
    { date: 'Jan 1', value: 65, baseline: 60, goal: 75 },
    { date: 'Jan 8', value: 68, baseline: 60, goal: 75 },
    { date: 'Jan 15', value: 72, baseline: 60, goal: 75 },
    { date: 'Jan 22', value: 70, baseline: 60, goal: 75 },
    { date: 'Jan 29', value: 74, baseline: 60, goal: 75 },
    { date: 'Feb 5', value: 76, baseline: 60, goal: 75 },
  ];

  const barData = [
    { name: 'Strength', value: 85, average: 75 },
    { name: 'Endurance', value: 78, average: 80 },
    { name: 'Speed', value: 92, average: 85 },
    { name: 'Power', value: 88, average: 82 },
    { name: 'Recovery', value: 72, average: 70 },
  ];

  const pieData = [
    { name: 'Strength', value: 30, color: '#8884d8' },
    { name: 'Conditioning', value: 25, color: '#82ca9d' },
    { name: 'Agility', value: 20, color: '#ffc658' },
    { name: 'Recovery', value: 15, color: '#ff7c7c' },
    { name: 'Other', value: 10, color: '#8dd1e1' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart Adapter Test</h1>
          <p className="text-gray-600 mt-2">
            Testing lightweight chart adapters directly
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={useLightweightCharts ? 'success' : 'secondary'}>
            {useLightweightCharts ? 'Lightweight Charts' : 'Recharts'}
          </Badge>
          <Button onClick={() => setShowFeatureFlags(!showFeatureFlags)}>
            Toggle Feature Flags
          </Button>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Line Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {useLightweightCharts ? (
                <LightweightLineChartAdapter
                  data={lineData}
                  width="100%"
                  height={250}
                  lines={[
                    { dataKey: 'value', stroke: '#8884d8', strokeWidth: 2 },
                    { dataKey: 'baseline', stroke: '#82ca9d', strokeWidth: 1, strokeDasharray: '5 5' },
                    { dataKey: 'goal', stroke: '#ffc658', strokeWidth: 1, strokeDasharray: '5 5' }
                  ]}
                />
              ) : (
                <div>Recharts would render here when flag is disabled</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Area Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {useLightweightCharts ? (
                <LightweightAreaChartAdapter
                  data={lineData}
                  width="100%"
                  height={250}
                  areas={[
                    { dataKey: 'value', stroke: '#8884d8', fill: '#8884d8', fillOpacity: 0.6 },
                    { dataKey: 'baseline', stroke: '#82ca9d', fill: '#82ca9d', fillOpacity: 0.3 }
                  ]}
                />
              ) : (
                <div>Recharts would render here when flag is disabled</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Bar Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {useLightweightCharts ? (
                <LightweightBarChartAdapter
                  data={barData}
                  width="100%"
                  height={250}
                  bars={[
                    { dataKey: 'value', fill: '#8884d8' },
                    { dataKey: 'average', fill: '#82ca9d' }
                  ]}
                />
              ) : (
                <div>Recharts would render here when flag is disabled</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pie Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {useLightweightCharts ? (
                <LightweightPieChartAdapter
                  data={pieData}
                  width="100%"
                  height={250}
                />
              ) : (
                <div>Recharts would render here when flag is disabled</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Chart Type</p>
              <p className="text-lg font-semibold">
                {useLightweightCharts ? 'Lightweight Charts' : 'Recharts'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bundle Size Impact</p>
              <p className="text-lg font-semibold">
                {useLightweightCharts ? '~50KB' : '~150KB'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Render Time</p>
              <p className="text-lg font-semibold">
                {useLightweightCharts ? 'Fast (<50ms)' : 'Normal (~150ms)'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className="text-lg font-semibold">
                {useLightweightCharts ? 'Low' : 'Medium'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flag Dashboard */}
      {showFeatureFlags && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Feature Flag Dashboard</h2>
              <Button variant="ghost" onClick={() => setShowFeatureFlags(false)}>
                Close
              </Button>
            </div>
            <div className="p-4">
              <FeatureFlagDashboard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}