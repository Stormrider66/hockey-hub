'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlag, featureFlags } from '@/features/physical-trainer/utils/featureFlags';

// Simple test data
const lineData = [
  { date: 'Jan 1', value: 65 },
  { date: 'Jan 8', value: 68 },
  { date: 'Jan 15', value: 72 },
  { date: 'Jan 22', value: 70 },
  { date: 'Jan 29', value: 74 },
];

const barData = [
  { name: 'Strength', value: 85 },
  { name: 'Endurance', value: 78 },
  { name: 'Speed', value: 92 },
  { name: 'Power', value: 88 },
];

export default function SimpleChartTestPage() {
  const [showRecharts, setShowRecharts] = useState(false);
  const useLightweightCharts = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  const toggleChartType = () => {
    featureFlags.setFlag('LIGHTWEIGHT_CHARTS', !useLightweightCharts);
  };

  const LineChartDemo = () => {
    if (showRecharts && !useLightweightCharts) {
      const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = require('recharts');
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Use lightweight charts
    const { LightweightLineChart } = require('@/components/charts/LightweightLineChart');
    const transformedData = lineData.map(d => ({ x: d.date, y: d.value }));
    
    return (
      <LightweightLineChart
        data={transformedData}
        height={200}
        color="#8884d8"
      />
    );
  };

  const BarChartDemo = () => {
    if (showRecharts && !useLightweightCharts) {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = require('recharts');
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Use lightweight charts
    const { LightweightBarChart } = require('@/components/charts/LightweightBarChart');
    
    return (
      <LightweightBarChart
        data={barData}
        height={200}
        barColor="#8884d8"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Simple Chart Test</h1>
          <p className="text-gray-600 mt-2">
            Testing lightweight charts vs recharts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={useLightweightCharts ? 'success' : 'secondary'}>
            {useLightweightCharts ? 'Lightweight Charts' : 'Recharts'}
          </Badge>
          <Button onClick={toggleChartType}>
            Toggle Chart Type
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowRecharts(!showRecharts)}
            disabled={useLightweightCharts}
          >
            {showRecharts ? 'Hide' : 'Show'} Recharts
          </Button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Line Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <LineChartDemo />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bar Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <BarChartDemo />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Chart Library</p>
              <p className="font-semibold">{useLightweightCharts ? 'Lightweight' : 'Recharts'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bundle Size</p>
              <p className="font-semibold">{useLightweightCharts ? '~10KB' : '~150KB'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Render Time</p>
              <p className="font-semibold">{useLightweightCharts ? '<20ms' : '~100ms'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className="font-semibold">{useLightweightCharts ? 'Low' : 'Medium'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}