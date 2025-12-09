'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  User, 
  Trophy,
  Target,
  BarChart3,
  Activity,
  Calendar,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw
} from 'lucide-react';

import { 
  AnalyticsDashboardFilters,
  PerformanceComparisonFilter,
  ComparisonResult,
  ComparisonMetric,
  PlayerPerformanceData,
  TeamPerformanceData,
  WorkoutType
} from '../../types/performance-analytics.types';

interface PerformanceComparisonToolProps {
  data: {
    players: PlayerPerformanceData[];
    teams: TeamPerformanceData[];
  } | null;
  filters: AnalyticsDashboardFilters;
  isLoading: boolean;
  error: string | null;
  onFilterChange: (filters: Partial<AnalyticsDashboardFilters>) => void;
}

export function PerformanceComparisonTool({
  data,
  filters,
  isLoading,
  error,
  onFilterChange
}: PerformanceComparisonToolProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Comparison configuration state
  const [comparisonType, setComparisonType] = useState<PerformanceComparisonFilter['type']>('player-vs-player');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['strengthIndex', 'vo2Max', 'sessionAttendance']);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'radar'>('chart');
  const [normalizationMethod, setNormalizationMethod] = useState<'raw' | 'percentile' | 'z-score'>('raw');

  // Available metrics for comparison
  const availableMetrics = [
    { key: 'strengthIndex', label: 'Strength Index', category: 'strength' },
    { key: 'powerOutput', label: 'Power Output', category: 'strength' },
    { key: 'vo2Max', label: 'VO2 Max', category: 'conditioning' },
    { key: 'lactateThreshold', label: 'Lactate Threshold', category: 'conditioning' },
    { key: 'reactionTime', label: 'Reaction Time', category: 'agility' },
    { key: 'changOfDirectionSpeed', label: 'Change of Direction', category: 'agility' },
    { key: 'sessionAttendance', label: 'Session Attendance', category: 'attendance' },
    { key: 'completionRate', label: 'Completion Rate', category: 'attendance' },
    { key: 'wellnessScore', label: 'Wellness Score', category: 'recovery' },
    { key: 'acuteChronicRatio', label: 'Load Ratio', category: 'load' }
  ];

  // Generate comparison data
  const comparisonResults = useMemo(() => {
    if (!data || selectedEntities.length < 2) return [];

    const results: ComparisonResult[] = [];

    if (comparisonType === 'player-vs-player') {
      for (let i = 0; i < selectedEntities.length - 1; i++) {
        for (let j = i + 1; j < selectedEntities.length; j++) {
          const player1 = data.players.find(p => p.playerId === selectedEntities[i]);
          const player2 = data.players.find(p => p.playerId === selectedEntities[j]);
          
          if (player1 && player2) {
            results.push(generatePlayerComparison(player1, player2));
          }
        }
      }
    } else if (comparisonType === 'team-vs-team') {
      for (let i = 0; i < selectedEntities.length - 1; i++) {
        for (let j = i + 1; j < selectedEntities.length; j++) {
          const team1 = data.teams.find(t => t.teamId === selectedEntities[i]);
          const team2 = data.teams.find(t => t.teamId === selectedEntities[j]);
          
          if (team1 && team2) {
            results.push(generateTeamComparison(team1, team2));
          }
        }
      }
    }

    return results;
  }, [data, selectedEntities, comparisonType, selectedMetrics, normalizationMethod]);

  // Generate comparison between two players
  const generatePlayerComparison = useCallback((player1: PlayerPerformanceData, player2: PlayerPerformanceData): ComparisonResult => {
    const metrics: ComparisonMetric[] = selectedMetrics.map(metricKey => {
      const value1 = getMetricValue(player1.metrics, metricKey);
      const value2 = getMetricValue(player2.metrics, metricKey);
      const difference = value1 - value2;
      const percentageDifference = ((value1 - value2) / value2) * 100;

      return {
        name: availableMetrics.find(m => m.key === metricKey)?.label || metricKey,
        entity1Value: value1,
        entity2Value: value2,
        difference,
        percentageDifference,
        significance: Math.abs(percentageDifference) > 20 ? 'high' : 
                     Math.abs(percentageDifference) > 10 ? 'moderate' : 'low',
        trend: difference > 0 ? 'improving' : difference < 0 ? 'declining' : 'stable'
      };
    });

    const winnerMetrics = metrics.filter(m => m.entity1Value > m.entity2Value).length;
    const totalMetrics = metrics.length;

    return {
      entity1: player1.playerName,
      entity2: player2.playerName,
      metrics,
      summary: `${player1.playerName} leads in ${winnerMetrics}/${totalMetrics} metrics`,
      winner: winnerMetrics > totalMetrics / 2 ? player1.playerName : 
             winnerMetrics < totalMetrics / 2 ? player2.playerName : undefined,
      improvements: generateImprovementSuggestions(metrics, player1.playerName, player2.playerName)
    };
  }, [selectedMetrics]);

  // Generate comparison between two teams
  const generateTeamComparison = useCallback((team1: TeamPerformanceData, team2: TeamPerformanceData): ComparisonResult => {
    const metrics: ComparisonMetric[] = selectedMetrics.map(metricKey => {
      const value1 = getTeamMetricValue(team1.metrics, metricKey);
      const value2 = getTeamMetricValue(team2.metrics, metricKey);
      const difference = value1 - value2;
      const percentageDifference = ((value1 - value2) / value2) * 100;

      return {
        name: availableMetrics.find(m => m.key === metricKey)?.label || metricKey,
        entity1Value: value1,
        entity2Value: value2,
        difference,
        percentageDifference,
        significance: Math.abs(percentageDifference) > 15 ? 'high' : 
                     Math.abs(percentageDifference) > 5 ? 'moderate' : 'low',
        trend: difference > 0 ? 'improving' : difference < 0 ? 'declining' : 'stable'
      };
    });

    const winnerMetrics = metrics.filter(m => m.entity1Value > m.entity2Value).length;
    const totalMetrics = metrics.length;

    return {
      entity1: team1.teamName,
      entity2: team2.teamName,
      metrics,
      summary: `${team1.teamName} leads in ${winnerMetrics}/${totalMetrics} metrics`,
      winner: winnerMetrics > totalMetrics / 2 ? team1.teamName : 
             winnerMetrics < totalMetrics / 2 ? team2.teamName : undefined,
      improvements: generateTeamImprovementSuggestions(metrics, team1.teamName, team2.teamName)
    };
  }, [selectedMetrics]);

  // Helper functions
  const getMetricValue = (metrics: any, key: string): number => {
    const value = metrics[key];
    return typeof value === 'number' ? value : 0;
  };

  const getTeamMetricValue = (metrics: any, key: string): number => {
    // Map player metrics to team metrics
    const mapping: Record<string, string> = {
      'sessionAttendance': 'averageAttendance',
      'completionRate': 'averageCompletionRate',
      'wellnessScore': 'averageWellness'
    };
    
    const teamKey = mapping[key] || key;
    const value = metrics[teamKey];
    return typeof value === 'number' ? value : 0;
  };

  const generateImprovementSuggestions = (metrics: ComparisonMetric[], entity1: string, entity2: string): string[] => {
    const suggestions: string[] = [];
    
    metrics.forEach(metric => {
      if (metric.significance === 'high') {
        if (metric.entity1Value < metric.entity2Value) {
          suggestions.push(`${entity1} should focus on improving ${metric.name.toLowerCase()}`);
        } else {
          suggestions.push(`${entity2} should focus on improving ${metric.name.toLowerCase()}`);
        }
      }
    });
    
    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  };

  const generateTeamImprovementSuggestions = (metrics: ComparisonMetric[], team1: string, team2: string): string[] => {
    const suggestions: string[] = [];
    
    metrics.forEach(metric => {
      if (metric.significance === 'high') {
        if (metric.entity1Value < metric.entity2Value) {
          suggestions.push(`${team1} should implement strategies to improve ${metric.name.toLowerCase()}`);
        }
      }
    });
    
    return suggestions.slice(0, 3);
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (comparisonResults.length === 0) return [];

    return comparisonResults.map(result => {
      const dataPoint: any = {
        comparison: `${result.entity1} vs ${result.entity2}`
      };

      result.metrics.forEach(metric => {
        dataPoint[`${metric.name}_1`] = metric.entity1Value;
        dataPoint[`${metric.name}_2`] = metric.entity2Value;
      });

      return dataPoint;
    });
  }, [comparisonResults]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (comparisonResults.length === 0) return [];

    const result = comparisonResults[0]; // Use first comparison for radar chart
    return result.metrics.map(metric => ({
      metric: metric.name,
      [result.entity1]: metric.entity1Value,
      [result.entity2]: metric.entity2Value
    }));
  }, [comparisonResults]);

  // Handle entity selection
  const handleEntitySelection = useCallback((entityId: string) => {
    setSelectedEntities(prev => {
      if (prev.includes(entityId)) {
        return prev.filter(id => id !== entityId);
      } else {
        return [...prev, entityId].slice(0, 4); // Limit to 4 entities
      }
    });
  }, []);

  // Handle metric selection
  const handleMetricSelection = useCallback((metricKey: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricKey)) {
        return prev.filter(key => key !== metricKey);
      } else {
        return [...prev, metricKey];
      }
    });
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>{t('common:loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{t('common:error')}: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>{t('physicalTrainer:analytics.comparison.noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('physicalTrainer:analytics.comparison.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comparison Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('physicalTrainer:analytics.comparison.type')}
              </label>
              <Select value={comparisonType} onValueChange={(value: any) => setComparisonType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player-vs-player">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t('physicalTrainer:analytics.comparison.playerVsPlayer')}
                    </div>
                  </SelectItem>
                  <SelectItem value="team-vs-team">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('physicalTrainer:analytics.comparison.teamVsTeam')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('physicalTrainer:analytics.comparison.viewMode')}
              </label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chart">
                    <div className="flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      {t('physicalTrainer:analytics.comparison.chart')}
                    </div>
                  </SelectItem>
                  <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {t('physicalTrainer:analytics.comparison.table')}
                    </div>
                  </SelectItem>
                  <SelectItem value="radar">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {t('physicalTrainer:analytics.comparison.radar')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('physicalTrainer:analytics.comparison.normalization')}
              </label>
              <Select value={normalizationMethod} onValueChange={(value: any) => setNormalizationMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">Raw Values</SelectItem>
                  <SelectItem value="percentile">Percentile</SelectItem>
                  <SelectItem value="z-score">Z-Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entity Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {comparisonType.includes('player') ? 
                t('physicalTrainer:analytics.comparison.selectPlayers') : 
                t('physicalTrainer:analytics.comparison.selectTeams')
              }
            </label>
            <div className="flex flex-wrap gap-2">
              {comparisonType.includes('player') ? 
                data.players.slice(0, 8).map(player => (
                  <Button
                    key={player.playerId}
                    variant={selectedEntities.includes(player.playerId) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleEntitySelection(player.playerId)}
                    className="flex items-center gap-2"
                  >
                    <User className="h-3 w-3" />
                    {player.playerName}
                  </Button>
                )) :
                data.teams.map(team => (
                  <Button
                    key={team.teamId}
                    variant={selectedEntities.includes(team.teamId) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleEntitySelection(team.teamId)}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-3 w-3" />
                    {team.teamName}
                  </Button>
                ))
              }
            </div>
            {selectedEntities.length < 2 && (
              <p className="text-sm text-muted-foreground mt-2">
                {t('physicalTrainer:analytics.comparison.selectAtLeastTwo')}
              </p>
            )}
          </div>

          {/* Metric Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('physicalTrainer:analytics.comparison.selectMetrics')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {availableMetrics.map(metric => (
                <Button
                  key={metric.key}
                  variant={selectedMetrics.includes(metric.key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMetricSelection(metric.key)}
                  className="text-xs"
                >
                  {metric.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {selectedEntities.length >= 2 && comparisonResults.length > 0 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonResults.slice(0, 3).map((result, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-2">
                      {result.entity1} vs {result.entity2}
                    </h3>
                    {result.winner && (
                      <Badge variant="default" className="mb-2">
                        <Award className="h-3 w-3 mr-1" />
                        {result.winner} {t('physicalTrainer:analytics.comparison.leads')}
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {result.summary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Visualization */}
          <Card>
            <CardContent className="p-6">
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                  <TabsTrigger value="chart">
                    <BarChart className="h-4 w-4 mr-2" />
                    Chart
                  </TabsTrigger>
                  <TabsTrigger value="table">
                    <Trophy className="h-4 w-4 mr-2" />
                    Table
                  </TabsTrigger>
                  <TabsTrigger value="radar">
                    <Target className="h-4 w-4 mr-2" />
                    Radar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chart" className="mt-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="comparison" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {selectedMetrics.map((metric, index) => {
                        const metricLabel = availableMetrics.find(m => m.key === metric)?.label || metric;
                        return (
                          <Bar 
                            key={`${metric}_1`}
                            dataKey={`${metricLabel}_1`}
                            fill={`hsl(${index * 60}, 70%, 50%)`}
                            name={`${metricLabel} (First)`}
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="table" className="mt-6">
                  <div className="space-y-4">
                    {comparisonResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4 text-center">
                          {result.entity1} vs {result.entity2}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Metric</th>
                                <th className="text-center p-2">{result.entity1}</th>
                                <th className="text-center p-2">{result.entity2}</th>
                                <th className="text-center p-2">Difference</th>
                                <th className="text-center p-2">Trend</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.metrics.map((metric, metricIndex) => (
                                <tr key={metricIndex} className="border-b">
                                  <td className="p-2 font-medium">{metric.name}</td>
                                  <td className="text-center p-2">
                                    {metric.entity1Value.toFixed(1)}
                                  </td>
                                  <td className="text-center p-2">
                                    {metric.entity2Value.toFixed(1)}
                                  </td>
                                  <td className="text-center p-2">
                                    <div className="flex items-center justify-center gap-1">
                                      {metric.difference > 0 ? (
                                        <ArrowUp className="h-3 w-3 text-green-500" />
                                      ) : metric.difference < 0 ? (
                                        <ArrowDown className="h-3 w-3 text-red-500" />
                                      ) : (
                                        <Minus className="h-3 w-3 text-gray-500" />
                                      )}
                                      {Math.abs(metric.percentageDifference).toFixed(1)}%
                                    </div>
                                  </td>
                                  <td className="text-center p-2">
                                    <Badge 
                                      variant={
                                        metric.significance === 'high' ? 'destructive' :
                                        metric.significance === 'moderate' ? 'default' : 'secondary'
                                      }
                                      className="text-xs"
                                    >
                                      {metric.significance}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {result.improvements.length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">
                              {t('physicalTrainer:analytics.comparison.improvements')}
                            </h4>
                            <ul className="text-sm space-y-1">
                              {result.improvements.map((improvement, impIndex) => (
                                <li key={impIndex} className="flex items-center gap-2">
                                  <TrendingUp className="h-3 w-3 text-blue-500" />
                                  {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="radar" className="mt-6">
                  {radarData.length > 0 && comparisonResults.length > 0 && (
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis />
                        <Radar
                          name={comparisonResults[0].entity1}
                          dataKey={comparisonResults[0].entity1}
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.3}
                        />
                        <Radar
                          name={comparisonResults[0].entity2}
                          dataKey={comparisonResults[0].entity2}
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.3}
                        />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}