'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
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
} from 'lucide-react';

import { 
  AnalyticsDashboardFilters,
  PlayerPerformanceData,
  TeamPerformanceData,
  TrendData,
  TeamTrendData,
  WorkoutType
} from '../../types/performance-analytics.types';

interface PerformanceTrendsChartProps {
  data: {
    players: PlayerPerformanceData[];
    teams: TeamPerformanceData[];
  } | null;
  filters: AnalyticsDashboardFilters;
  onFilterChange: (filters: Partial<AnalyticsDashboardFilters>) => void;
}

type ChartType = 'line' | 'area' | 'bar' | 'scatter' | 'composed';
type TrendMetric = 'strength' | 'conditioning' | 'agility' | 'recovery' | 'attendance' | 'load';
type TimeRange = '7d' | '30d' | '90d' | '180d' | '1y';
type AggregationType = 'individual' | 'team' | 'position' | 'comparison';

export function PerformanceTrendsChart({
  data,
  filters,
  onFilterChange
}: PerformanceTrendsChartProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Chart configuration state
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>('strength');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [aggregationType, setAggregationType] = useState<AggregationType>('team');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(false);
  const [smoothing, setSmoothing] = useState<'none' | 'moving-average' | 'exponential'>('none');

  // Available metrics
  const availableMetrics = [
    { key: 'strength' as TrendMetric, label: 'Strength', icon: Award, color: '#3b82f6' },
    { key: 'conditioning' as TrendMetric, label: 'Conditioning', icon: Heart, color: '#ef4444' },
    { key: 'agility' as TrendMetric, label: 'Agility', icon: Zap, color: '#f59e0b' },
    { key: 'recovery' as TrendMetric, label: 'Recovery', icon: Clock, color: '#10b981' },
    { key: 'attendance' as TrendMetric, label: 'Attendance', icon: Users, color: '#8b5cf6' },
    { key: 'load' as TrendMetric, label: 'Training Load', icon: Activity, color: '#f97316' }
  ];

  // Process trend data based on current settings
  const chartData = useMemo(() => {
    if (!data) return [];

    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365
    }[timeRange];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    if (aggregationType === 'team') {
      // Aggregate team data
      const teamTrendMap = new Map<string, any[]>();

      data.teams.forEach(team => {
        const metricTrend = team.performanceTrends[selectedMetric as keyof typeof team.performanceTrends];
        if (metricTrend) {
          metricTrend
            .filter(point => new Date(point.date) >= cutoffDate)
            .forEach(point => {
              const dateKey = point.date.split('T')[0];
              if (!teamTrendMap.has(dateKey)) {
                teamTrendMap.set(dateKey, []);
              }
              teamTrendMap.get(dateKey)!.push({
                date: dateKey,
                value: 'average' in point ? point.average : point.average || 0,
                teamId: team.teamId,
                teamName: team.teamName
              });
            });
        }
      });

      // Convert to chart format
      const chartPoints: any[] = [];
      teamTrendMap.forEach((points, date) => {
        const chartPoint: any = { date };
        
        // Group by team
        const teamGroups = points.reduce((acc, point) => {
          if (!acc[point.teamName]) acc[point.teamName] = [];
          acc[point.teamName].push(point.value);
          return acc;
        }, {} as Record<string, number[]>);

        // Calculate averages for each team
        Object.entries(teamGroups).forEach(([teamName, values]) => {
          chartPoint[teamName] = values.reduce((sum, val) => sum + val, 0) / values.length;
        });

        chartPoints.push(chartPoint);
      });

      return chartPoints
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-days);

    } else if (aggregationType === 'individual') {
      // Individual player trends
      const playerTrendMap = new Map<string, any[]>();

      const selectedPlayers = selectedEntities.length > 0 
        ? data.players.filter(p => selectedEntities.includes(p.playerId))
        : data.players.slice(0, 5); // Limit to first 5 if none selected

      selectedPlayers.forEach(player => {
        const metricTrend = player.progressTrends[selectedMetric];
        if (metricTrend) {
          metricTrend
            .filter(point => new Date(point.date) >= cutoffDate)
            .forEach(point => {
              const dateKey = point.date.split('T')[0];
              if (!playerTrendMap.has(dateKey)) {
                playerTrendMap.set(dateKey, []);
              }
              playerTrendMap.get(dateKey)!.push({
                date: dateKey,
                value: point.value,
                playerId: player.playerId,
                playerName: player.playerName
              });
            });
        }
      });

      // Convert to chart format
      const chartPoints: any[] = [];
      playerTrendMap.forEach((points, date) => {
        const chartPoint: any = { date };
        
        // Group by player
        const playerGroups = points.reduce((acc, point) => {
          if (!acc[point.playerName]) acc[point.playerName] = [];
          acc[point.playerName].push(point.value);
          return acc;
        }, {} as Record<string, number[]>);

        // Calculate averages for each player
        Object.entries(playerGroups).forEach(([playerName, values]) => {
          chartPoint[playerName] = values.reduce((sum, val) => sum + val, 0) / values.length;
        });

        chartPoints.push(chartPoint);
      });

      return chartPoints
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-days);

    } else if (aggregationType === 'position') {
      // Group by position
      const positionTrendMap = new Map<string, any[]>();

      data.players.forEach(player => {
        const metricTrend = player.progressTrends[selectedMetric];
        if (metricTrend) {
          metricTrend
            .filter(point => new Date(point.date) >= cutoffDate)
            .forEach(point => {
              const dateKey = point.date.split('T')[0];
              if (!positionTrendMap.has(dateKey)) {
                positionTrendMap.set(dateKey, []);
              }
              positionTrendMap.get(dateKey)!.push({
                date: dateKey,
                value: point.value,
                position: player.position
              });
            });
        }
      });

      // Convert to chart format
      const chartPoints: any[] = [];
      positionTrendMap.forEach((points, date) => {
        const chartPoint: any = { date };
        
        // Group by position
        const positionGroups = points.reduce((acc, point) => {
          if (!acc[point.position]) acc[point.position] = [];
          acc[point.position].push(point.value);
          return acc;
        }, {} as Record<string, number[]>);

        // Calculate averages for each position
        Object.entries(positionGroups).forEach(([position, values]) => {
          chartPoint[position] = values.reduce((sum, val) => sum + val, 0) / values.length;
        });

        chartPoints.push(chartPoint);
      });

      return chartPoints
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-days);
    }

    return [];
  }, [data, selectedMetric, timeRange, aggregationType, selectedEntities]);

  // Apply smoothing if enabled
  const smoothedData = useMemo(() => {
    if (smoothing === 'none' || chartData.length === 0) return chartData;

    const windowSize = smoothing === 'moving-average' ? 3 : 2;
    
    return chartData.map((point, index) => {
      const smoothedPoint = { ...point };
      
      Object.keys(point).forEach(key => {
        if (key !== 'date' && typeof point[key] === 'number') {
          const values: number[] = [];
          
          for (let i = Math.max(0, index - windowSize + 1); i <= index; i++) {
            if (chartData[i] && typeof chartData[i][key] === 'number') {
              values.push(chartData[i][key]);
            }
          }
          
          if (values.length > 0) {
            if (smoothing === 'moving-average') {
              smoothedPoint[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
            } else {
              // Exponential smoothing
              const alpha = 0.3;
              smoothedPoint[key] = values.reduce((acc, val, idx) => {
                return idx === 0 ? val : alpha * val + (1 - alpha) * acc;
              });
            }
          }
        }
      });
      
      return smoothedPoint;
    });
  }, [chartData, smoothing]);

  // Get data keys for chart series
  const dataKeys = useMemo(() => {
    if (smoothedData.length === 0) return [];
    return Object.keys(smoothedData[0]).filter(key => key !== 'date');
  }, [smoothedData]);

  // Generate colors for series
  const seriesColors = useMemo(() => {
    const baseColors = [
      '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', 
      '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'
    ];
    
    return dataKeys.reduce((acc, key, index) => {
      acc[key] = baseColors[index % baseColors.length];
      return acc;
    }, {} as Record<string, string>);
  }, [dataKeys]);

  // Calculate trend statistics
  const trendStats = useMemo(() => {
    if (smoothedData.length < 2) return {};
    
    const stats: Record<string, {
      trend: 'up' | 'down' | 'stable';
      change: number;
      changePercent: number;
    }> = {};
    
    dataKeys.forEach(key => {
      const firstValue = smoothedData[0][key];
      const lastValue = smoothedData[smoothedData.length - 1][key];
      
      if (typeof firstValue === 'number' && typeof lastValue === 'number' && firstValue !== 0) {
        const change = lastValue - firstValue;
        const changePercent = (change / firstValue) * 100;
        
        stats[key] = {
          trend: Math.abs(changePercent) < 2 ? 'stable' : change > 0 ? 'up' : 'down',
          change,
          changePercent
        };
      }
    });
    
    return stats;
  }, [smoothedData, dataKeys]);

  // Handle entity selection for individual view
  const handleEntitySelection = useCallback((entityId: string) => {
    setSelectedEntities(prev => {
      if (prev.includes(entityId)) {
        return prev.filter(id => id !== entityId);
      } else {
        return [...prev, entityId].slice(0, 6); // Limit to 6 entities
      }
    });
  }, []);

  // Format tooltip
  const formatTooltip = useCallback((value: any, name: string, props: any) => {
    if (typeof value === 'number') {
      return [value.toFixed(2), name];
    }
    return [value, name];
  }, []);

  // Format date for x-axis
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (timeRange === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  }, [timeRange]);

  const currentMetric = availableMetrics.find(m => m.key === selectedMetric);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {currentMetric && <currentMetric.icon className="h-5 w-5" style={{ color: currentMetric.color }} />}
            {t('physicalTrainer:analytics.trends.title')} - {currentMetric?.label}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('common:actions.export')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Controls */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
          {/* Metric Selection */}
          <div>
            <label className="text-xs font-medium mb-1 block">Metric</label>
            <Select value={selectedMetric} onValueChange={(value: TrendMetric) => setSelectedMetric(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMetrics.map(metric => (
                  <SelectItem key={metric.key} value={metric.key}>
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-3 w-3" style={{ color: metric.color }} />
                      {metric.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Range */}
          <div>
            <label className="text-xs font-medium mb-1 block">Time Range</label>
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="180d">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aggregation Type */}
          <div>
            <label className="text-xs font-medium mb-1 block">View By</label>
            <Select value={aggregationType} onValueChange={(value: AggregationType) => setAggregationType(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Teams</SelectItem>
                <SelectItem value="individual">Players</SelectItem>
                <SelectItem value="position">Positions</SelectItem>
                <SelectItem value="comparison">Comparison</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chart Type */}
          <div>
            <label className="text-xs font-medium mb-1 block">Chart Type</label>
            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="scatter">Scatter Plot</SelectItem>
                <SelectItem value="composed">Combined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Smoothing */}
          <div>
            <label className="text-xs font-medium mb-1 block">Smoothing</label>
            <Select value={smoothing} onValueChange={(value: any) => setSmoothing(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="moving-average">Moving Average</SelectItem>
                <SelectItem value="exponential">Exponential</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Entity Selection for Individual View */}
        {aggregationType === 'individual' && data && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <label className="text-sm font-medium mb-2 block">
              Select Players (max 6):
            </label>
            <div className="flex flex-wrap gap-2">
              {data.players.slice(0, 12).map(player => (
                <Button
                  key={player.playerId}
                  variant={selectedEntities.includes(player.playerId) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEntitySelection(player.playerId)}
                  className="text-xs"
                >
                  {player.playerName}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Trend Statistics */}
        {Object.keys(trendStats).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(trendStats).slice(0, 4).map(([key, stats]) => (
              <div key={key} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{key}</span>
                  {stats.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : stats.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <Target className="h-3 w-3 text-gray-500" />
                  )}
                </div>
                <div className="text-sm font-semibold">
                  {stats.changePercent > 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' && (
              <LineChart data={smoothedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={(value) => `Date: ${formatDate(value as string)}`}
                />
                <Legend />
                {dataKeys.map(key => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={seriesColors[key]}
                    strokeWidth={2}
                    dot={{ fill: seriesColors[key], strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            )}

            {chartType === 'area' && (
              <AreaChart data={smoothedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={(value) => `Date: ${formatDate(value as string)}`}
                />
                <Legend />
                {dataKeys.map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId={index < 3 ? "1" : "2"}
                    stroke={seriesColors[key]}
                    fill={seriesColors[key]}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            )}

            {chartType === 'bar' && (
              <BarChart data={smoothedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={(value) => `Date: ${formatDate(value as string)}`}
                />
                <Legend />
                {dataKeys.map(key => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={seriesColors[key]}
                  />
                ))}
              </BarChart>
            )}

            {chartType === 'scatter' && (
              <ScatterChart data={smoothedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="category"
                  dataKey="date"
                  tickFormatter={formatDate}
                />
                <YAxis type="number" />
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={(value) => `Date: ${formatDate(value as string)}`}
                />
                <Legend />
                {dataKeys.map(key => (
                  <Scatter
                    key={key}
                    dataKey={key}
                    fill={seriesColors[key]}
                  />
                ))}
              </ScatterChart>
            )}

            {chartType === 'composed' && (
              <ComposedChart data={smoothedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={(value) => `Date: ${formatDate(value as string)}`}
                />
                <Legend />
                {dataKeys.map((key, index) => 
                  index % 2 === 0 ? (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={seriesColors[key]}
                      strokeWidth={2}
                    />
                  ) : (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={seriesColors[key]}
                      fillOpacity={0.6}
                    />
                  )
                )}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend with Trend Indicators */}
        {dataKeys.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-4 border-t">
            {dataKeys.map(key => {
              const stats = trendStats[key];
              return (
                <div key={key} className="flex items-center gap-2 p-2 rounded">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: seriesColors[key] }}
                  />
                  <span className="text-sm font-medium flex-1">{key}</span>
                  {stats && (
                    <Badge 
                      variant={stats.trend === 'up' ? 'default' : stats.trend === 'down' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {stats.trend === 'up' ? '↗' : stats.trend === 'down' ? '↘' : '→'}
                      {Math.abs(stats.changePercent).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}