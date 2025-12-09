'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Use simple chart adapters
import { 
  SimpleLineChart, 
  SimpleAreaChart, 
  SimpleBarChart 
} from '../charts/SimpleChartAdapter';

// Import from custom icons
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  Calendar,
  BarChart3,
  Users,
  Zap,
  Heart,
  Clock,
  Award,
  RefreshCw,
  Filter,
  Download
} from '@/components/icons';

import { 
  AnalyticsDashboardFilters,
  PlayerPerformanceData,
  TeamPerformanceData,
  TrendData,
  TeamTrendData,
  WorkoutType
} from '../../types/performance-analytics.types';

interface PerformanceTrendsChartProps {
  data: PlayerPerformanceData | TeamPerformanceData;
  filters: AnalyticsDashboardFilters;
  onFilterChange?: (filters: Partial<AnalyticsDashboardFilters>) => void;
  viewType: 'player' | 'team';
  className?: string;
}

export const PerformanceTrendsChartSimple: React.FC<PerformanceTrendsChartProps> = ({
  data,
  filters,
  onFilterChange,
  viewType,
  className
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState('month');

  // Process trend data based on selected metric
  const chartData = useMemo(() => {
    if (viewType === 'player') {
      const playerData = data as PlayerPerformanceData;
      const trends = playerData.trends || [];
      
      return trends.map(trend => ({
        date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: trend[selectedMetric as keyof TrendData] || 0,
        baseline: playerData.baseline?.[selectedMetric as keyof TrendData] || 0,
        goal: playerData.goals?.[selectedMetric as keyof TrendData] || 0
      }));
    } else {
      const teamData = data as TeamPerformanceData;
      const trends = teamData.trends || [];
      
      return trends.map(trend => ({
        date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        name: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: trend.averageMetrics[selectedMetric as keyof TeamTrendData['averageMetrics']] || 0,
        participation: trend.teamParticipation,
        range: trend.metricRanges?.[selectedMetric as keyof TeamTrendData['metricRanges']]
      }));
    }
  }, [data, selectedMetric, viewType]);

  // Calculate trend percentage
  const trendPercentage = useMemo(() => {
    if (chartData.length < 2) return 0;
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    return ((lastValue - firstValue) / firstValue * 100).toFixed(1);
  }, [chartData]);

  const isPositiveTrend = Number(trendPercentage) > 0;

  // Metric options
  const metricOptions = [
    { value: 'overall', label: t('analytics.metrics.overall'), icon: Activity },
    { value: 'strength', label: t('analytics.metrics.strength'), icon: Zap },
    { value: 'endurance', label: t('analytics.metrics.endurance'), icon: Heart },
    { value: 'speed', label: t('analytics.metrics.speed'), icon: Clock },
    { value: 'power', label: t('analytics.metrics.power'), icon: Target },
    { value: 'recovery', label: t('analytics.metrics.recovery'), icon: RefreshCw }
  ];

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <SimpleAreaChart
            data={chartData}
            height={250}
            areas={
              viewType === 'player' ? [
                { dataKey: 'value', stroke: '#8884d8', fill: '#8884d8', fillOpacity: 0.6, name: t(`analytics.metrics.${selectedMetric}`) },
                { dataKey: 'baseline', stroke: '#82ca9d', fill: '#82ca9d', fillOpacity: 0.3, name: t('analytics.baseline') },
                { dataKey: 'goal', stroke: '#ffc658', fill: '#ffc658', fillOpacity: 0.3, name: t('analytics.goal') }
              ] : [
                { dataKey: 'value', stroke: '#8884d8', fill: '#8884d8', fillOpacity: 0.6, name: t(`analytics.metrics.${selectedMetric}`) }
              ]
            }
          />
        );

      case 'bar':
        return (
          <SimpleBarChart
            data={chartData}
            height={250}
            bars={
              viewType === 'team' ? [
                { dataKey: 'value', fill: '#8884d8', name: t(`analytics.metrics.${selectedMetric}`) },
                { dataKey: 'participation', fill: '#82ca9d', name: t('analytics.participation') }
              ] : [
                { dataKey: 'value', fill: '#8884d8', name: t(`analytics.metrics.${selectedMetric}`) }
              ]
            }
          />
        );

      default: // line
        return (
          <SimpleLineChart
            data={chartData}
            height={250}
            lines={
              viewType === 'player' ? [
                { dataKey: 'value', stroke: '#8884d8', strokeWidth: 2, name: t(`analytics.metrics.${selectedMetric}`) },
                { dataKey: 'baseline', stroke: '#82ca9d', strokeWidth: 1, strokeDasharray: '5 5', name: t('analytics.baseline') },
                { dataKey: 'goal', stroke: '#ffc658', strokeWidth: 1, strokeDasharray: '5 5', name: t('analytics.goal') }
              ] : [
                { dataKey: 'value', stroke: '#8884d8', strokeWidth: 2, name: t(`analytics.metrics.${selectedMetric}`) }
              ]
            }
          />
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>{t('analytics.performanceTrends')}</CardTitle>
            <Badge variant={isPositiveTrend ? 'success' : 'destructive'}>
              <span className="flex items-center gap-1">
                {isPositiveTrend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendPercentage}%
              </span>
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">{t('analytics.chartTypes.line')}</SelectItem>
                <SelectItem value="area">{t('analytics.chartTypes.area')}</SelectItem>
                <SelectItem value="bar">{t('analytics.chartTypes.bar')}</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {renderChart()}
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">{t('analytics.current')}</p>
            <p className="text-lg font-semibold">
              {chartData[chartData.length - 1]?.value.toFixed(1) || 0}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">{t('analytics.average')}</p>
            <p className="text-lg font-semibold">
              {(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1) || 0}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">{t('analytics.peak')}</p>
            <p className="text-lg font-semibold">
              {Math.max(...chartData.map(d => d.value)).toFixed(1) || 0}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">{t('analytics.consistency')}</p>
            <p className="text-lg font-semibold">
              {calculateConsistency(chartData)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate consistency
function calculateConsistency(data: any[]): number {
  if (data.length < 2) return 100;
  
  const values = data.map(d => d.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / mean) * 100;
  
  // Convert to consistency score (lower CV = higher consistency)
  return Math.max(0, Math.min(100, 100 - coefficientOfVariation));
}