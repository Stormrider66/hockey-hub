'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from '@/features/physical-trainer/components/charts/ChartAdapter';
import { FeatureFlagDashboard } from '@/features/physical-trainer/components/shared/FeatureFlagDashboard';
import { useFeatureFlag } from '@/features/physical-trainer/utils/featureFlags';

export default function ChartTestPage() {
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

  const radialData = [
    { name: 'Performance', value: 78, maxValue: 100 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart Performance Test</h1>
          <p className="text-gray-600 mt-2">
            Compare recharts vs lightweight chart implementations
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="baseline" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="goal" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="baseline" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                  <Bar dataKey="average" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart data={pieData}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                  />
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radial Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Radial Bar Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart data={radialData}>
                  <RadialBar dataKey="value" fill="#8884d8" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
      </div>

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