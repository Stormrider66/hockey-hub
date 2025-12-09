import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Activity, AlertTriangle, TrendingUp, Users, Target, Zap, Shield } from 'lucide-react';

// Import the lazy loader for predictive analytics components
import { LazyPredictiveAnalyticsLoader } from '../loaders';

// Import the predictive analytics API hooks
import {
  useGetPredictiveDashboardQuery,
  useGetTeamRiskProfileQuery,
  useGetLoadManagementOptimizationQuery
} from '@/store/api/predictiveAnalyticsApi';

interface PredictiveAnalyticsTabProps {
  selectedTeamId?: string;
  organizationId: string;
  className?: string;
}

export function PredictiveAnalyticsTab({ 
  selectedTeamId, 
  organizationId,
  className = '' 
}: PredictiveAnalyticsTabProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'team' | 'individual'>('team');
  const [timeframe, setTimeframe] = useState<string>('week');

  // API queries
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError 
  } = useGetPredictiveDashboardQuery({
    organizationId,
    teamId: selectedTeamId,
    limit: 50
  });

  const { 
    data: teamRiskData, 
    isLoading: teamRiskLoading 
  } = useGetTeamRiskProfileQuery({
    teamId: selectedTeamId || 'default-team',
    organizationId
  }, {
    skip: !selectedTeamId
  });

  const { 
    data: loadOptimizationData, 
    isLoading: loadOptimizationLoading 
  } = useGetLoadManagementOptimizationQuery({
    teamId: selectedTeamId || 'default-team',
    timeframeWeeks: 4
  }, {
    skip: !selectedTeamId
  });

  // Mock team players for selection
  const teamPlayers = [
    { id: 'player1', name: 'Sidney Crosby', position: 'C' },
    { id: 'player2', name: 'Connor McDavid', position: 'C' },
    { id: 'player3', name: 'Nathan MacKinnon', position: 'C' },
    { id: 'player4', name: 'Leon Draisaitl', position: 'C' },
    { id: 'player5', name: 'Auston Matthews', position: 'C' }
  ];

  if (dashboardLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load predictive analytics data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const dashboard = dashboardData?.data;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">Predictive Analytics</h2>
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            AI-Powered Insights
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <Select value={selectedView} onValueChange={(value: 'team' | 'individual') => setSelectedView(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Team Overview</SelectItem>
                <SelectItem value="individual">Individual Player</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedView === 'individual' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Player:</span>
              <Select value={selectedPlayer || ''} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {teamPlayers.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} ({player.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Timeframe:</span>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Dashboard Overview Stats */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Players Monitored</span>
              </div>
              <span className="text-2xl font-bold">{dashboard.overview.totalPlayersMonitored}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">High Risk Players</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{dashboard.overview.highRiskPlayers}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Average Risk Score</span>
              </div>
              <span className="text-2xl font-bold">{dashboard.overview.averageRiskScore}%</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Improving Trends</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{dashboard.overview.trendsImproving}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert for High Risk Players */}
      {dashboard && dashboard.overview.highRiskPlayers > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>ATTENTION REQUIRED:</strong> {dashboard.overview.highRiskPlayers} player(s) showing elevated risk levels. 
            Immediate intervention and monitoring recommended.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fatigue">Fatigue</TabsTrigger>
          <TabsTrigger value="injury">Injury Risk</TabsTrigger>
          <TabsTrigger value="load">Load Management</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {selectedView === 'team' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Team Risk Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Team Risk Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">{dashboard.riskDistribution.low}</div>
                          <div className="text-sm text-green-700">Low Risk</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded">
                          <div className="text-2xl font-bold text-yellow-600">{dashboard.riskDistribution.moderate}</div>
                          <div className="text-sm text-yellow-700">Moderate Risk</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded">
                          <div className="text-2xl font-bold text-orange-600">{dashboard.riskDistribution.high}</div>
                          <div className="text-sm text-orange-700">High Risk</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded">
                          <div className="text-2xl font-bold text-red-600">{dashboard.riskDistribution.critical}</div>
                          <div className="text-sm text-red-700">Critical Risk</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Top Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard && (
                    <div className="space-y-3">
                      {dashboard.topRiskFactors.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium">{factor.factor}</span>
                          <Badge variant="outline">{factor.count} players</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Model Accuracy */}
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Model Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{dashboard.modelAccuracy.fatigue}%</div>
                        <div className="text-sm text-gray-600">Fatigue Prediction</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{dashboard.modelAccuracy.injury}%</div>
                        <div className="text-sm text-gray-600">Injury Risk</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{dashboard.modelAccuracy.performance}%</div>
                        <div className="text-sm text-gray-600">Performance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{dashboard.modelAccuracy.recovery}%</div>
                        <div className="text-sm text-gray-600">Recovery</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center text-gray-600 py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a player to view individual predictive insights</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="fatigue" className="mt-6">
          <LazyPredictiveAnalyticsLoader
            componentType="fatigueMonitoring"
            teamId={selectedTeamId} 
            organizationId={organizationId}
          />
        </TabsContent>

        <TabsContent value="injury" className="mt-6">
          <LazyPredictiveAnalyticsLoader
            componentType="injuryRisk"
            teamId={selectedTeamId} 
            organizationId={organizationId}
          />
        </TabsContent>

        <TabsContent value="load" className="mt-6">
          <LazyPredictiveAnalyticsLoader
            componentType="loadRecommendation"
            teamId={selectedTeamId} 
            organizationId={organizationId}
            timeframeWeeks={4}
          />
        </TabsContent>

        <TabsContent value="individual" className="mt-6">
          {selectedPlayer ? (
            <div className="space-y-6">
              {/* Individual Player Insights Panel */}
              <LazyPredictiveAnalyticsLoader
                componentType="predictiveInsights"
                playerId={selectedPlayer}
                organizationId={organizationId}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fatigue Monitor */}
                <LazyPredictiveAnalyticsLoader
                  componentType="fatigueMonitor"
                  playerId={selectedPlayer}
                  organizationId={organizationId}
                />

                {/* Injury Risk Indicator */}
                <LazyPredictiveAnalyticsLoader
                  componentType="injuryRiskIndicator"
                  playerId={selectedPlayer}
                  organizationId={organizationId}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recovery Recommendations */}
                <LazyPredictiveAnalyticsLoader
                  componentType="recoveryRecommendations"
                  playerId={selectedPlayer}
                />

                {/* Plateau Detection */}
                <LazyPredictiveAnalyticsLoader
                  componentType="plateauDetection"
                  playerId={selectedPlayer}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-600 py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a player from the dropdown above to view individual analytics</p>
              <div className="mt-4">
                <Select value={selectedPlayer || ''} onValueChange={setSelectedPlayer}>
                  <SelectTrigger className="w-64 mx-auto">
                    <SelectValue placeholder="Choose a player to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamPlayers.map(player => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} ({player.position})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer Information */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Predictive Analytics Engine:</span>
              <span>v3.2.0 - Ensemble Learning Models</span>
            </div>
            <div className="flex justify-between">
              <span>Data Sources:</span>
              <span>Training load, biometrics, injury history, performance metrics</span>
            </div>
            <div className="flex justify-between">
              <span>Update Frequency:</span>
              <span>Real-time monitoring with 5-minute batch processing</span>
            </div>
            <div className="flex justify-between">
              <span>Last Model Training:</span>
              <span>{new Date().toLocaleDateString()} - Continuous learning enabled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}