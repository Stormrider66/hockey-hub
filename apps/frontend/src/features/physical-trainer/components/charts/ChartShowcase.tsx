'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LightweightLineChart,
  LightweightBarChart,
  LightweightPieChart,
  LightweightAreaChart,
  LightweightRadialBar,
  PerformanceTrendChart,
  LoadDistributionChart,
  InjuryRiskGauge,
  MetricCardLightweight
} from './index';

// Sample data
const lineData = [
  { x: 'Jan', y: 65 },
  { x: 'Feb', y: 72 },
  { x: 'Mar', y: 68 },
  { x: 'Apr', y: 80 },
  { x: 'May', y: 85 },
  { x: 'Jun', y: 90 },
];

const barData = [
  { name: 'Strength', value: 85, color: '#3b82f6' },
  { name: 'Speed', value: 72, color: '#10b981' },
  { name: 'Endurance', value: 90, color: '#f59e0b' },
  { name: 'Agility', value: 78, color: '#8b5cf6' },
];

const pieData = [
  { name: 'Training', value: 35 },
  { name: 'Games', value: 25 },
  { name: 'Recovery', value: 20 },
  { name: 'Rest', value: 20 },
];

const areaData = [
  { x: 'Week 1', y: 20, y2: 15 },
  { x: 'Week 2', y: 35, y2: 25 },
  { x: 'Week 3', y: 45, y2: 30 },
  { x: 'Week 4', y: 30, y2: 20 },
  { x: 'Week 5', y: 40, y2: 35 },
];

const radialData = [
  { name: 'Fitness', value: 85, max: 100 },
  { name: 'Fatigue', value: 45, max: 100 },
  { name: 'Form', value: 72, max: 100 },
];

const trendData = [
  { date: '2025-01-01', values: { power: 250, speed: 28, endurance: 85 } },
  { date: '2025-01-08', values: { power: 260, speed: 29, endurance: 87 } },
  { date: '2025-01-15', values: { power: 255, speed: 28.5, endurance: 88 } },
  { date: '2025-01-22', values: { power: 270, speed: 30, endurance: 90 } },
  { date: '2025-01-29', values: { power: 275, speed: 31, endurance: 89 } },
];

const trendSeries = [
  { key: 'power', name: 'Power (W)', color: '#3b82f6' },
  { key: 'speed', name: 'Speed (km/h)', color: '#10b981' },
  { key: 'endurance', name: 'Endurance (%)', color: '#f59e0b', strokeDasharray: '5,5' },
];

const loadData = [
  { player: 'Crosby', acute: 850, chronic: 800, ratio: 1.06, status: 'optimal' as const },
  { player: 'MacKinnon', acute: 950, chronic: 750, ratio: 1.27, status: 'warning' as const },
  { player: 'McDavid', acute: 1100, chronic: 820, ratio: 1.34, status: 'warning' as const },
  { player: 'Matthews', acute: 720, chronic: 780, ratio: 0.92, status: 'optimal' as const },
  { player: 'Marner', acute: 650, chronic: 400, ratio: 1.63, status: 'danger' as const },
];

const metricData = {
  name: 'Average Power Output',
  value: 275,
  unit: 'W',
  change: 12.5,
  changeDirection: 'up' as const,
  isGood: true,
  target: 300,
  trend: [245, 250, 255, 260, 258, 265, 270, 275],
};

export function ChartShowcase() {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Lightweight Charts Showcase</h1>
        <p className="text-gray-600">
          High-performance chart components replacing recharts for the Physical Trainer dashboard
        </p>
      </div>

      {/* Basic Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Line Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <LightweightLineChart
              data={lineData}
              height={200}
              showDots={true}
              showGrid={true}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bar Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <LightweightBarChart
              data={barData}
              height={200}
              showLabels={true}
              showValues={true}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pie Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <LightweightPieChart
                data={pieData}
                width={300}
                height={250}
                showLegend={true}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Area Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <LightweightAreaChart
              data={areaData}
              height={200}
              gradient={true}
              showDots={false}
              yAxisLabel="Load (AU)"
              xAxisLabel="Time Period"
            />
          </CardContent>
        </Card>
      </div>

      {/* Specialized Charts */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceTrendChart
              data={trendData}
              series={trendSeries}
              height={300}
              showLegend={true}
              dateFormat="short"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Load Distribution Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadDistributionChart
              data={loadData}
              height={300}
              showRatioLine={true}
              showStatusColors={true}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Radial Bar Chart</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <LightweightRadialBar
                data={radialData}
                width={200}
                height={200}
                showLabels={true}
                showValue={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Injury Risk Gauge</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <InjuryRiskGauge
                value={72}
                size={200}
                showLabels={true}
                showValue={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Donut Chart</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <LightweightPieChart
                data={pieData}
                width={200}
                height={200}
                innerRadius={0.6}
                showLegend={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Metric Card Example */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCardLightweight metric={metricData} size="medium" />
          <MetricCardLightweight 
            metric={{ ...metricData, name: 'Heart Rate Variability', value: 65, unit: 'ms', change: -5.2, changeDirection: 'down', isGood: false }} 
            size="medium" 
          />
          <MetricCardLightweight 
            metric={{ ...metricData, name: 'Training Load', value: 850, unit: 'AU', target: 900, change: 8.3, changeDirection: 'up' }} 
            size="medium" 
          />
        </div>
      </div>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">82%</div>
              <div className="text-sm text-gray-600">Smaller Bundle</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">3x</div>
              <div className="text-sm text-gray-600">Faster Rendering</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">60%</div>
              <div className="text-sm text-gray-600">Less Memory</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600">Dependencies</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}