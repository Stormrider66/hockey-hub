/**
 * Tactical Analytics Dashboard
 * Comprehensive analytics dashboard for tactical play performance and insights
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Activity, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Eye,
  Filter,
  RefreshCw
} from '@/components/icons';
import { 
  tacticalDataService,
  type PlayUsageStats,
  type FormationAnalytics,
  type PlayerTacticalRating,
  type TacticalTrendAnalysis,
  type GameTacticalAnalysis
} from '../../services/tacticalDataService';
import { useFeatureFlags } from '@/config/featureFlags';

interface TacticalAnalyticsDashboardProps {
  teamId?: string;
  dateRange?: { start: string; end: string };
  className?: string;
}

export const TacticalAnalyticsDashboard: React.FC<TacticalAnalyticsDashboardProps> = ({
  teamId,
  dateRange,
  className = ''
}) => {
  const { isTacticalDemoMode, isEnabled } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [playStats, setPlayStats] = useState<PlayUsageStats[]>([]);
  const [formationStats, setFormationStats] = useState<FormationAnalytics[]>([]);
  const [playerRatings, setPlayerRatings] = useState<PlayerTacticalRating[]>([]);
  const [trends, setTrends] = useState<TacticalTrendAnalysis | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [teamId, dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboard, plays, formations, players, trendData] = await Promise.all([
        tacticalDataService.getDashboardOverview({ teamId }),
        tacticalDataService.getPlayUsageStats({ teamId, dateRange }),
        tacticalDataService.getFormationAnalytics({ teamId, dateRange }),
        tacticalDataService.getPlayerTacticalRatings({ dateRange }),
        tacticalDataService.getTacticalTrends({ period: 'monthly', teamId })
      ]);

      setDashboardData(dashboard);
      setPlayStats(plays);
      setFormationStats(formations);
      setPlayerRatings(players);
      setTrends(trendData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    // Check if exports are enabled
    if (!isEnabled('tactical.enableExports')) {
      console.warn('Tactical exports are disabled');
      return;
    }

    setIsExporting(true);
    try {
      // For mock data, simulate export
      if (isTacticalDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const fileName = `tactical-analytics-demo-${new Date().toISOString().split('T')[0]}.${format}`;
        console.log(`Demo export generated: ${fileName}`);
        // In a real implementation, would generate and download demo data
      } else {
        // Use real export functionality (would be implemented in API adapter)
        console.log('Real export not yet implemented');
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 80) return 'text-green-600';
    if (rating >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading tactical analytics...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Export Controls */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Tactical Analytics Dashboard</h2>
            {isTacticalDemoMode() && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Demo Mode
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            {isTacticalDemoMode() 
              ? 'Performance insights and strategic analysis (using demo data)'
              : 'Performance insights and strategic analysis'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => loadDashboardData()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Alert Notifications */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <div className="space-y-2">
          {dashboardData.alerts.map((alert: any, index: number) => (
            <div
              key={index}
              className={`flex items-center p-3 rounded-lg ${
                alert.type === 'success' ? 'bg-green-50 border border-green-200' :
                alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}
            >
              {alert.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              ) : alert.type === 'warning' ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              )}
              <span className="font-medium">{alert.message}</span>
              <span className="ml-auto text-sm text-gray-500">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plays">Play Performance</TabsTrigger>
          <TabsTrigger value="players">Player Execution</TabsTrigger>
          <TabsTrigger value="trends">Trends & Predictions</TabsTrigger>
          <TabsTrigger value="export">Reports & Export</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.overview.totalPlays || 0}</div>
                <p className="text-xs text-gray-600">Active in system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.overview.avgSuccessRate || 0}%
                </div>
                <div className="flex items-center">
                  {getTrendIcon(dashboardData?.overview.recentTrend)}
                  <span className="text-xs text-gray-600 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Formations</CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.overview.totalFormations || 0}</div>
                <p className="text-xs text-gray-600">In rotation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Rating</CardTitle>
                <Users className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85.7</div>
                <p className="text-xs text-gray-600">Execution score</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Plays */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-blue-600" />
                  Top Performing Plays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playStats.slice(0, 5).map((play, index) => (
                    <div key={play.playId} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{play.playName}</div>
                        <div className="text-sm text-gray-600">
                          {play.totalExecutions} executions
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={play.successRate} className="w-20" />
                        <span className={`font-bold ${getPerformanceColor(play.successRate)}`}>
                          {play.successRate.toFixed(1)}%
                        </span>
                        {getTrendIcon(play.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Formation Effectiveness */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-purple-600" />
                  Formation Effectiveness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formationStats.slice(0, 3).map((formation) => (
                    <div key={formation.formationId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{formation.formationName}</div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            +/- {formation.plusMinus > 0 ? '+' : ''}{formation.plusMinus}
                          </Badge>
                          <span className={`font-bold ${getPerformanceColor(formation.successRate)}`}>
                            {formation.successRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{formation.goalsFor}</div>
                          <div className="text-xs text-gray-600">Goals For</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{formation.goalsAgainst}</div>
                          <div className="text-xs text-gray-600">Goals Against</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{formation.usageCount}</div>
                          <div className="text-xs text-gray-600">Uses</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Play Performance Tab */}
        <TabsContent value="plays" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Detailed Play Performance
                </span>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {playStats.map((play) => (
                  <div key={play.playId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{play.playName}</h3>
                        <p className="text-sm text-gray-600">
                          Last used: {new Date(play.lastUsed).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={play.trend === 'up' ? 'default' : 
                                 play.trend === 'down' ? 'destructive' : 'secondary'}
                        >
                          {getTrendIcon(play.trend)}
                          {play.trendPercentage > 0 ? '+' : ''}{play.trendPercentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{play.totalExecutions}</div>
                        <div className="text-sm text-gray-600">Total Executions</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getPerformanceColor(play.successRate)}`}>
                          {play.successRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{play.gameExecutions}</div>
                        <div className="text-sm text-gray-600">In Games</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{play.avgExecutionTime.toFixed(1)}s</div>
                        <div className="text-sm text-gray-600">Avg Time</div>
                      </div>
                    </div>

                    <Progress value={play.successRate} className="mb-2" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Games: {play.gameExecutions}</span>
                      <span>Practice: {play.practiceExecutions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Player Execution Tab */}
        <TabsContent value="players" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-orange-600" />
                Player Tactical Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {playerRatings.map((player) => (
                  <div key={player.playerId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{player.playerName}</h3>
                        <p className="text-sm text-gray-600">{player.position}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`text-2xl font-bold ${getPerformanceColor(player.overallRating)}`}>
                          {player.overallRating.toFixed(1)}
                        </div>
                        <Badge variant={
                          player.improvementTrend === 'improving' ? 'default' :
                          player.improvementTrend === 'declining' ? 'destructive' : 'secondary'
                        }>
                          {player.improvementTrend}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium text-gray-600">Execution</div>
                        <div className="text-lg font-bold">{player.playExecutionRating.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Positioning</div>
                        <div className="text-lg font-bold">{player.positioningAccuracy.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Awareness</div>
                        <div className="text-lg font-bold">{player.tacticalAwareness.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Consistency</div>
                        <div className="text-lg font-bold">{player.consistencyScore.toFixed(1)}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Strengths: </span>
                        {player.keyStrengths.map((strength, index) => (
                          <Badge key={index} variant="secondary" className="mr-1">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends & Predictions Tab */}
        <TabsContent value="trends" className="space-y-6">
          {trends && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChart className="h-5 w-5 mr-2 text-green-600" />
                    Tactical Trends ({trends.period})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(trends.keyMetrics).map(([key, metric]) => (
                      <div key={key} className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          {getTrendIcon(metric.change > 0 ? 'up' : metric.change < 0 ? 'down' : 'stable')}
                        </div>
                        <div className="text-2xl font-bold">{metric.current.toFixed(1)}</div>
                        <div className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                        <div className={`text-sm font-medium ${
                          metric.change > 0 ? 'text-green-600' : 
                          metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-blue-600" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trends.insights.map((insight, index) => (
                        <div key={index} className="flex items-start">
                          <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 mr-3 flex-shrink-0" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trends.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start">
                          <div className="h-2 w-2 rounded-full bg-yellow-600 mt-2 mr-3 flex-shrink-0" />
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2 text-purple-600" />
                Reports & Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Export Formats</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF Report
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleExport('excel')}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Excel Workbook
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleExport('csv')}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV Data
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Quick Reports</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Clock className="h-4 w-4 mr-2" />
                      Weekly Summary
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Player Analysis
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      Play Effectiveness
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Scheduled Reports</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Setup Schedule
                    </Button>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Weekly tactical summary</div>
                      <div>• Monthly trend report</div>
                      <div>• Game analysis reports</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TacticalAnalyticsDashboard;