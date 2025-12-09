/**
 * Load Balance Visualization Component
 * 
 * Displays ACWR ratios, recovery predictions, and load distribution analytics
 * using lightweight charting components.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Users,
  Info
} from '@/components/icons';

import { LightweightBarChartAdapter } from '../charts/LightweightBarChartAdapter';
import { LightweightLineChartAdapter } from '../charts/LightweightLineChartAdapter';
import { LightweightPieChartAdapter } from '../charts/LightweightPieChartAdapter';
import type { PlayerAIProfile } from '../../services/PlayerDistributionAI';
import type { ACWRCalculation, RecoveryPrediction } from '../../services/FatiguePrediction';
import { FatigueIndicator } from './FatigueIndicator';

interface LoadBalanceVisualizationProps {
  playerProfiles: PlayerAIProfile[];
  acwrData: ACWRCalculation[];
  recoveryData: RecoveryPrediction[];
}

export const LoadBalanceVisualization: React.FC<LoadBalanceVisualizationProps> = ({
  playerProfiles,
  acwrData,
  recoveryData
}) => {
  // Calculate analytics
  const analytics = useMemo(() => {
    if (playerProfiles.length === 0) return null;

    // ACWR Distribution
    const acwrDistribution = acwrData.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Average metrics
    const avgFitness = playerProfiles.reduce((sum, p) => sum + p.fitnessLevel.overall, 0) / playerProfiles.length;
    const avgFatigue = playerProfiles.reduce((sum, p) => sum + p.fatigue, 0) / playerProfiles.length;
    const avgLoad = playerProfiles.reduce((sum, p) => sum + p.currentLoad, 0) / playerProfiles.length;

    // Risk distribution
    const riskLevels = playerProfiles.map(p => {
      if (p.injuryRisk <= 25) return 'low';
      if (p.injuryRisk <= 50) return 'moderate';
      if (p.injuryRisk <= 75) return 'high';
      return 'critical';
    });

    const riskDistribution = riskLevels.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Position distribution
    const positionDistribution = playerProfiles.reduce((acc, curr) => {
      const position = curr.position || 'Unknown';
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      acwrDistribution,
      riskDistribution,
      positionDistribution,
      averages: {
        fitness: avgFitness,
        fatigue: avgFatigue,
        load: avgLoad
      }
    };
  }, [playerProfiles, acwrData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analytics) return { acwr: [], risk: [], position: [], trends: [] };

    // ACWR chart data
    const acwrChart = Object.entries(analytics.acwrDistribution).map(([status, count]) => ({
      name: status.replace('-', ' '),
      value: count,
      color: 
        status === 'low-risk' ? '#10B981' :
        status === 'moderate-risk' ? '#F59E0B' :
        status === 'high-risk' ? '#F97316' : '#EF4444'
    }));

    // Risk distribution chart
    const riskChart = Object.entries(analytics.riskDistribution).map(([level, count]) => ({
      name: level,
      value: count,
      color:
        level === 'low' ? '#10B981' :
        level === 'moderate' ? '#F59E0B' :
        level === 'high' ? '#F97316' : '#EF4444'
    }));

    // Position distribution chart
    const positionChart = Object.entries(analytics.positionDistribution).map(([position, count], index) => ({
      name: position,
      value: count,
      color: `hsl(${index * 60}, 70%, 50%)`
    }));

    // Trends data (simulated)
    const trendsChart = playerProfiles.slice(0, 10).map((player, index) => ({
      name: player.name.split(' ')[0],
      fitness: player.fitnessLevel.overall,
      fatigue: player.fatigue,
      load: player.currentLoad
    }));

    return {
      acwr: acwrChart,
      risk: riskChart,
      position: positionChart,
      trends: trendsChart
    };
  }, [analytics, playerProfiles]);

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'low-risk': return 'text-green-600';
      case 'moderate-risk': return 'text-yellow-600';
      case 'high-risk': return 'text-orange-600';
      case 'very-high-risk': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'low-risk': return 'bg-green-100 text-green-800';
      case 'moderate-risk': return 'bg-yellow-100 text-yellow-800';
      case 'high-risk': return 'bg-orange-100 text-orange-800';
      case 'very-high-risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Analytics Data
            </h3>
            <p className="text-gray-500">
              Player profiles need to be generated to display load balance analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{Math.round(analytics.averages.fitness)}</p>
                <p className="text-sm text-gray-600">Avg Fitness Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{Math.round(analytics.averages.load)}%</p>
                <p className="text-sm text-gray-600">Avg Training Load</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{Math.round(analytics.averages.fatigue)}%</p>
                <p className="text-sm text-gray-600">Avg Fatigue Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="acwr">ACWR Analysis</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Injury Risk Distribution
                </CardTitle>
                <CardDescription>
                  Distribution of players by injury risk level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LightweightPieChartAdapter
                  data={chartData.risk}
                  height={200}
                />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {Object.entries(analytics.riskDistribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm capitalize">{level}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Position Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Position Distribution
                </CardTitle>
                <CardDescription>
                  Player count by position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LightweightPieChartAdapter
                  data={chartData.position}
                  height={200}
                />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {Object.entries(analytics.positionDistribution).map(([position, count]) => (
                    <div key={position} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{position}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Player Fitness vs Fatigue */}
          <Card>
            <CardHeader>
              <CardTitle>Fitness vs Fatigue vs Load</CardTitle>
              <CardDescription>
                Comparison of key metrics across players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LightweightBarChartAdapter
                data={chartData.trends}
                height={300}
                bars={[
                  { dataKey: 'fitness', fill: '#3B82F6', name: 'Fitness' },
                  { dataKey: 'fatigue', fill: '#EF4444', name: 'Fatigue' },
                  { dataKey: 'load', fill: '#F59E0B', name: 'Load %' }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACWR Analysis Tab */}
        <TabsContent value="acwr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ACWR Distribution</CardTitle>
              <CardDescription>
                Acute:Chronic Workload Ratio analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LightweightBarChartAdapter
                data={chartData.acwr.map(item => ({ ...item, count: item.value }))}
                height={200}
                bars={[{ dataKey: 'count', fill: '#3B82F6', name: 'Player Count' }]}
              />

              <div className="mt-6 space-y-2">
                <h4 className="font-medium">Risk Levels:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Low Risk (0.8-1.3): Safe training zone</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Moderate Risk (1.3-1.5): Monitor closely</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">High Risk (1.5+): Consider load reduction</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <TrendingDown className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Low Load (&lt;0.8): May need progression</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual ACWR Details */}
          <Card>
            <CardHeader>
              <CardTitle>Individual ACWR Status</CardTitle>
              <CardDescription>
                Detailed ACWR analysis for each player
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {acwrData.map((player) => (
                    <div key={player.playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{player.playerName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{player.playerName}</p>
                          <p className="text-sm text-gray-600">
                            Ratio: {player.ratio.toFixed(2)} 
                            {player.trend === 'increasing' && <TrendingUp className="h-3 w-3 text-red-600 inline ml-1" />}
                            {player.trend === 'decreasing' && <TrendingDown className="h-3 w-3 text-green-600 inline ml-1" />}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusBadgeColor(player.status)}>
                          {player.status.replace('-', ' ')}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {player.recommendedAction.substring(0, 30)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Tab */}
        <TabsContent value="recovery" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recoveryData.map((recovery) => (
              <Card key={recovery.playerId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{recovery.playerName}</span>
                    <FatigueIndicator 
                      fatigue={recovery.currentFatigue} 
                      variant="badge"
                      size="sm"
                    />
                  </CardTitle>
                  <CardDescription>
                    Recovery analysis and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recovery Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Readiness Score</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={recovery.readinessScore} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{recovery.readinessScore}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Recovery Time</Label>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        {recovery.estimatedRecoveryTime}h
                      </p>
                    </div>
                  </div>

                  {/* Next Session */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">Next Session</h5>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Earliest date:</span> {' '}
                        {new Date(recovery.nextSessionRecommendations.earliestDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Recommended intensity:</span> {' '}
                        <Badge variant="outline" className="ml-1">
                          {recovery.nextSessionRecommendations.recommendedIntensity}
                        </Badge>
                      </p>
                      {recovery.nextSessionRecommendations.restrictions.length > 0 && (
                        <div>
                          <p className="font-medium">Restrictions:</p>
                          <ul className="list-disc list-inside ml-2 space-y-1">
                            {recovery.nextSessionRecommendations.restrictions.map((restriction, index) => (
                              <li key={index} className="text-orange-700">{restriction}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {recovery.recommendations.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Recovery Recommendations</h5>
                      <div className="space-y-2">
                        {recovery.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded">
                            <Badge 
                              variant="outline" 
                              className={
                                rec.priority === 'high' ? 'border-red-200 text-red-700' :
                                rec.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                'border-green-200 text-green-700'
                              }
                            >
                              {rec.type}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium">{rec.description}</p>
                              <p className="text-gray-600">Duration: {rec.duration}</p>
                              <p className="text-gray-600">Expected impact: {rec.expectedImpact}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          {/* Load Distribution Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Training Load Distribution</CardTitle>
              <CardDescription>
                How training loads are distributed across the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Optimal distribution shows most players in the 70-90% load range with good variety
                  for progressive overload and recovery needs.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-3">Current Load Distribution</h5>
                  <div className="space-y-2">
                    {['40-60%', '60-80%', '80-100%', '100%+'].map((range, index) => {
                      const count = playerProfiles.filter(p => {
                        const load = p.currentLoad;
                        switch (range) {
                          case '40-60%': return load >= 40 && load < 60;
                          case '60-80%': return load >= 60 && load < 80;
                          case '80-100%': return load >= 80 && load <= 100;
                          case '100%+': return load > 100;
                          default: return false;
                        }
                      }).length;
                      
                      const percentage = (count / playerProfiles.length) * 100;
                      
                      return (
                        <div key={range} className="flex items-center justify-between">
                          <span className="text-sm">{range}</span>
                          <div className="flex items-center gap-2 flex-1 max-w-48">
                            <Progress value={percentage} className="h-2" />
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium mb-3">Recommendations</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <p>Maintain 60-80% load for base fitness development</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <p>Monitor players >100% load for overreaching</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p>Progress low-load players gradually</p>
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

export default LoadBalanceVisualization;