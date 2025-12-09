'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading';
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
  ReferenceLine,
  ComposedChart
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Heart,
  Clock,
  Target,
  User,
  Users,
  Calendar,
  Zap,
  RefreshCw,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from '@/components/icons';

import { 
  AnalyticsDashboardFilters,
  PlayerPerformanceData,
  LoadManagementData,
  LoadHistoryPoint,
  RiskFactor,
  LoadRecommendation
} from '../../types/performance-analytics.types';

interface LoadManagementPanelProps {
  players: PlayerPerformanceData[];
  loadData: LoadManagementData[];
  filters: AnalyticsDashboardFilters;
  isLoading: boolean;
  error: string | null;
  onPlayerSelect: (playerId: string) => void;
}

type ViewMode = 'overview' | 'individual' | 'team' | 'alerts';
type LoadMetric = 'acute' | 'chronic' | 'ratio' | 'wellness' | 'performance';
type RiskLevel = 'low' | 'moderate' | 'high';

export function LoadManagementPanel({
  players,
  loadData,
  filters,
  isLoading,
  error,
  onPlayerSelect
}: LoadManagementPanelProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<LoadMetric>('ratio');
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '28d'>('14d');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');

  // Process load data with risk categorization
  const processedLoadData = useMemo(() => {
    return loadData.map(data => {
      const player = players.find(p => p.playerId === data.playerId);
      const ratio = data.currentLoad.ratio;
      
      let riskLevel: RiskLevel = 'low';
      let riskDescription = 'Optimal load balance';
      
      if (ratio > 1.5) {
        riskLevel = 'high';
        riskDescription = 'Very high acute load - injury risk elevated';
      } else if (ratio > 1.3) {
        riskLevel = 'high';
        riskDescription = 'High acute load - monitor closely';
      } else if (ratio > 1.1) {
        riskLevel = 'moderate';
        riskDescription = 'Elevated load - manage carefully';
      } else if (ratio < 0.8) {
        riskLevel = 'moderate';
        riskDescription = 'Low load - may be detraining';
      }

      return {
        ...data,
        player,
        riskLevel,
        riskDescription,
        wellness: data.loadHistory[0]?.wellness || 7,
        performance: data.loadHistory[0]?.performance || 7
      };
    }).filter(data => 
      riskFilter === 'all' || data.riskLevel === riskFilter
    );
  }, [loadData, players, riskFilter]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = processedLoadData.length;
    const highRisk = processedLoadData.filter(d => d.riskLevel === 'high').length;
    const moderateRisk = processedLoadData.filter(d => d.riskLevel === 'moderate').length;
    const lowRisk = processedLoadData.filter(d => d.riskLevel === 'low').length;
    
    const avgRatio = processedLoadData.reduce((sum, d) => sum + d.currentLoad.ratio, 0) / total || 0;
    const avgWellness = processedLoadData.reduce((sum, d) => sum + d.wellness, 0) / total || 0;
    
    const needsAttention = processedLoadData.filter(d => 
      d.riskLevel === 'high' || d.riskFactors.length > 0
    );

    return {
      total,
      highRisk,
      moderateRisk,
      lowRisk,
      avgRatio,
      avgWellness,
      needsAttention: needsAttention.length,
      overreaching: processedLoadData.filter(d => d.adaptationStatus === 'overreaching').length,
      declining: processedLoadData.filter(d => d.adaptationStatus === 'declining').length
    };
  }, [processedLoadData]);

  // Generate team overview data for chart
  const teamOverviewData = useMemo(() => {
    const days = parseInt(timeRange.replace('d', ''));
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toISOString().split('T')[0];
    });

    return dates.map(date => {
      const dayData = processedLoadData.reduce((acc, playerData) => {
        const historyPoint = playerData.loadHistory.find(h => 
          h.date.startsWith(date)
        );
        
        if (historyPoint) {
          acc.totalPlayers++;
          acc.avgAcute += historyPoint.acuteLoad;
          acc.avgChronic += historyPoint.chronicLoad;
          acc.avgRatio += historyPoint.ratio;
          acc.avgWellness += historyPoint.wellness;
          acc.avgPerformance += historyPoint.performance;
          
          if (historyPoint.ratio > 1.3) acc.highRiskCount++;
          else if (historyPoint.ratio > 1.1) acc.moderateRiskCount++;
        }
        
        return acc;
      }, {
        date,
        totalPlayers: 0,
        avgAcute: 0,
        avgChronic: 0,
        avgRatio: 0,
        avgWellness: 0,
        avgPerformance: 0,
        highRiskCount: 0,
        moderateRiskCount: 0
      });

      if (dayData.totalPlayers > 0) {
        dayData.avgAcute /= dayData.totalPlayers;
        dayData.avgChronic /= dayData.totalPlayers;
        dayData.avgRatio /= dayData.totalPlayers;
        dayData.avgWellness /= dayData.totalPlayers;
        dayData.avgPerformance /= dayData.totalPlayers;
      }

      return dayData;
    });
  }, [processedLoadData, timeRange]);

  // Get individual player data for detailed view
  const selectedPlayerData = useMemo(() => {
    if (!selectedPlayerId) return null;
    return processedLoadData.find(d => d.playerId === selectedPlayerId);
  }, [processedLoadData, selectedPlayerId]);

  // Generate recommendations based on current load state
  const generateRecommendations = useCallback((playerData: typeof processedLoadData[0]) => {
    const recommendations: string[] = [];
    const ratio = playerData.currentLoad.ratio;
    
    if (ratio > 1.5) {
      recommendations.push('Immediate load reduction required (25-30%)');
      recommendations.push('Implement recovery protocols');
      recommendations.push('Monitor wellness daily');
    } else if (ratio > 1.3) {
      recommendations.push('Reduce training volume by 15-20%');
      recommendations.push('Focus on recovery and regeneration');
    } else if (ratio > 1.1) {
      recommendations.push('Monitor closely and consider slight load reduction');
      recommendations.push('Emphasize sleep and nutrition');
    } else if (ratio < 0.8) {
      recommendations.push('Consider increasing training stimulus');
      recommendations.push('Ensure adequate progression');
    } else {
      recommendations.push('Maintain current load');
      recommendations.push('Continue monitoring');
    }

    return recommendations;
  }, []);

  // Risk color mapping
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'high': return <XCircle className="h-4 w-4" />;
      case 'moderate': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingSpinner 
            size="md" 
            text={t('common:loading')} 
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              {t('physicalTrainer:analytics.loadManagement.title')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={riskFilter} onValueChange={(value: any) => setRiskFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="moderate">Moderate Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summaryStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Players</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summaryStats.highRisk}</div>
              <div className="text-sm text-muted-foreground">High Risk</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{summaryStats.moderateRisk}</div>
              <div className="text-sm text-muted-foreground">Moderate Risk</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summaryStats.lowRisk}</div>
              <div className="text-sm text-muted-foreground">Low Risk</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{summaryStats.avgRatio.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Avg Ratio</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{summaryStats.needsAttention}</div>
              <div className="text-sm text-muted-foreground">Need Attention</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="individual">
            <User className="h-4 w-4 mr-2" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team Trends
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts ({summaryStats.needsAttention})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">High Risk</span>
                    <span className="text-sm text-red-600">{summaryStats.highRisk} players</span>
                  </div>
                  <Progress value={(summaryStats.highRisk / summaryStats.total) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Moderate Risk</span>
                    <span className="text-sm text-yellow-600">{summaryStats.moderateRisk} players</span>
                  </div>
                  <Progress value={(summaryStats.moderateRisk / summaryStats.total) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Low Risk</span>
                    <span className="text-sm text-green-600">{summaryStats.lowRisk} players</span>
                  </div>
                  <Progress value={(summaryStats.lowRisk / summaryStats.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Player Load Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Player Load Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {processedLoadData.slice(0, 10).map(playerData => (
                    <div 
                      key={playerData.playerId}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${getRiskColor(playerData.riskLevel)}`}
                      onClick={() => {
                        setSelectedPlayerId(playerData.playerId);
                        setViewMode('individual');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRiskIcon(playerData.riskLevel)}
                          <span className="font-medium">{playerData.player?.playerName}</span>
                        </div>
                        <Badge 
                          variant={playerData.riskLevel === 'high' ? 'destructive' : 
                                 playerData.riskLevel === 'moderate' ? 'default' : 'secondary'}
                        >
                          {playerData.currentLoad.ratio.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {playerData.riskDescription}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Individual Tab */}
        <TabsContent value="individual" className="mt-6">
          <div className="space-y-6">
            {/* Player Selection */}
            <Card>
              <CardContent className="p-4">
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a player..." />
                  </SelectTrigger>
                  <SelectContent>
                    {processedLoadData.map(playerData => (
                      <SelectItem key={playerData.playerId} value={playerData.playerId}>
                        <div className="flex items-center gap-2">
                          {getRiskIcon(playerData.riskLevel)}
                          {playerData.player?.playerName}
                          <Badge variant="outline" className="ml-auto">
                            {playerData.currentLoad.ratio.toFixed(2)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Individual Player Details */}
            {selectedPlayerData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getRiskIcon(selectedPlayerData.riskLevel)}
                      {selectedPlayerData.player?.playerName} - Current Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded">
                        <div className="text-2xl font-bold">{selectedPlayerData.currentLoad.acute.toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">Acute Load</div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="text-2xl font-bold">{selectedPlayerData.currentLoad.chronic.toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">Chronic Load</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Acute:Chronic Ratio</span>
                        <span className={`text-xl font-bold ${
                          selectedPlayerData.currentLoad.ratio > 1.3 ? 'text-red-600' :
                          selectedPlayerData.currentLoad.ratio > 1.1 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {selectedPlayerData.currentLoad.ratio.toFixed(2)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(selectedPlayerData.currentLoad.ratio * 50, 100)} 
                        className="h-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Wellness Score:</span>
                        <span className="font-medium">{selectedPlayerData.wellness.toFixed(1)}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adaptation Status:</span>
                        <Badge variant={
                          selectedPlayerData.adaptationStatus === 'positive' ? 'default' :
                          selectedPlayerData.adaptationStatus === 'overreaching' ? 'destructive' : 'secondary'
                        }>
                          {selectedPlayerData.adaptationStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Load Recommendation */}
                      <Alert>
                        <Target className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{selectedPlayerData.currentLoad.recommendation.action.toUpperCase()}</strong>: 
                          {selectedPlayerData.currentLoad.recommendation.reasoning}
                        </AlertDescription>
                      </Alert>

                      {/* Generated Recommendations */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Action Items:</h4>
                        <ul className="space-y-1">
                          {generateRecommendations(selectedPlayerData).map((rec, index) => (
                            <li key={index} className="text-sm flex items-center gap-2">
                              <Target className="h-3 w-3 text-blue-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Risk Factors */}
                      {selectedPlayerData.riskFactors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-red-600">Risk Factors:</h4>
                          {selectedPlayerData.riskFactors.map((factor, index) => (
                            <Alert key={index} className="border-red-200">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>{factor.type}:</strong> {factor.description}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Load History Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Load History (Last 28 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={selectedPlayerData.loadHistory.slice(-28)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
                        />
                        <Legend />
                        <ReferenceLine y={1.3} stroke="red" strokeDasharray="5 5" label="High Risk" />
                        <ReferenceLine y={1.1} stroke="orange" strokeDasharray="5 5" label="Moderate Risk" />
                        <Line 
                          type="monotone" 
                          dataKey="ratio" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="A:C Ratio"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="wellness" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Wellness"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Team Trends Tab */}
        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Load Trends</CardTitle>
                <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="14d">Last 14 days</SelectItem>
                    <SelectItem value="28d">Last 28 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={teamOverviewData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="avgRatio" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    stroke="#3b82f6"
                    name="Average A:C Ratio"
                  />
                  <Bar dataKey="highRiskCount" fill="#ef4444" name="High Risk Players" />
                  <Bar dataKey="moderateRiskCount" fill="#f59e0b" name="Moderate Risk Players" />
                  <ReferenceLine y={1.3} stroke="red" strokeDasharray="5 5" />
                  <ReferenceLine y={1.1} stroke="orange" strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <div className="space-y-4">
            {processedLoadData
              .filter(d => d.riskLevel === 'high' || d.riskFactors.length > 0)
              .map(playerData => (
                <Card key={playerData.playerId} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold">{playerData.player?.playerName}</h3>
                        <Badge variant="destructive">
                          Ratio: {playerData.currentLoad.ratio.toFixed(2)}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onPlayerSelect(playerData.playerId)}
                      >
                        View Details
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {playerData.riskDescription}
                      </p>
                      
                      {playerData.riskFactors.map((factor, index) => (
                        <Alert key={index} className="border-yellow-200">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>{factor.type}:</strong> {factor.description}
                          </AlertDescription>
                        </Alert>
                      ))}
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {generateRecommendations(playerData).slice(0, 2).map((rec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}