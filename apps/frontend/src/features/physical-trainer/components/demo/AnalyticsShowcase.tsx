/**
 * Analytics Showcase Component
 * 
 * Demonstrates advanced analytics, predictive insights, and performance tracking
 * with realistic data and trends.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  AlertTriangle,
  CheckCircle,
  Target,
  Award,
  Brain,
  Heart,
  Zap,
  Activity,
  Users,
  Calendar,
  Download
} from '@/components/icons';

interface PlayerAnalytics {
  id: string;
  name: string;
  team: string;
  workoutsCompleted: number;
  averageIntensity: number;
  complianceRate: number;
  improvementTrend: 'improving' | 'declining' | 'stable' | 'peak_form' | 'recovering';
  keyMetrics: {
    strengthGains: number;
    cardioFitness: number;
    powerOutput: number;
    mobility: number;
    recoveryRate: number;
  };
  medicalStatus?: {
    currentInjury?: string;
    daysInjured?: number;
    complianceWithRestrictions: number;
    injuryRisk: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  };
  predictions: {
    nextMonthPerformance: number;
    injuryRisk: number;
    peakPerformanceDate?: string;
  };
}

interface TeamAnalytics {
  totalWorkouts: number;
  thisWeek: number;
  averageIntensity: number;
  complianceRate: number;
  injuryRate: number;
  trends: {
    workoutVolume: Array<{ week: string; volume: number }>;
    averageIntensity: Array<{ week: string; intensity: number }>;
    injuryRates: Array<{ week: string; rate: number }>;
  };
  workoutTypeDistribution: Record<string, number>;
  topPerformers: string[];
  riskyPlayers: string[];
}

interface PredictiveInsights {
  injuryRisk: Record<string, {
    risk: 'low' | 'moderate' | 'high' | 'very_high';
    factors: string[];
    recommendation: string;
    confidence: number;
  }>;
  performancePredictions: Record<string, {
    metric: string;
    currentValue: number;
    predictedValue: number;
    timeframe: string;
    confidence: number;
  }>;
  teamRecommendations: string[];
}

export const AnalyticsShowcase: React.FC = () => {
  const [selectedView, setSelectedView] = useState('team');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // Mock analytics data
  const teamAnalytics: TeamAnalytics = {
    totalWorkouts: 156,
    thisWeek: 12,
    averageIntensity: 7.8,
    complianceRate: 94.2,
    injuryRate: 3.8,
    trends: {
      workoutVolume: [
        { week: '2025-01-08', volume: 85 },
        { week: '2025-01-15', volume: 92 },
        { week: '2025-01-22', volume: 88 },
        { week: '2025-01-29', volume: 94 }
      ],
      averageIntensity: [
        { week: '2025-01-08', intensity: 7.2 },
        { week: '2025-01-15', intensity: 7.8 },
        { week: '2025-01-22', intensity: 7.6 },
        { week: '2025-01-29', intensity: 8.1 }
      ],
      injuryRates: [
        { week: '2025-01-08', rate: 2.1 },
        { week: '2025-01-15', rate: 1.8 },
        { week: '2025-01-22', rate: 4.2 },
        { week: '2025-01-29', rate: 3.8 }
      ]
    },
    workoutTypeDistribution: {
      'STRENGTH': 35,
      'CONDITIONING': 40,
      'HYBRID': 18,
      'AGILITY': 7
    },
    topPerformers: ['Connor McDavid', 'Nathan MacKinnon', 'Leon Draisaitl'],
    riskyPlayers: ['Sidney Crosby', 'Auston Matthews']
  };

  const playerAnalytics: PlayerAnalytics[] = [
    {
      id: 'player-001',
      name: 'Sidney Crosby',
      team: 'Pittsburgh Penguins',
      workoutsCompleted: 18,
      averageIntensity: 6.8,
      complianceRate: 100,
      improvementTrend: 'recovering',
      keyMetrics: {
        strengthGains: -5,
        cardioFitness: -2,
        powerOutput: -8,
        mobility: 15,
        recoveryRate: 82
      },
      medicalStatus: {
        currentInjury: 'Lower Back Strain',
        daysInjured: 14,
        complianceWithRestrictions: 100,
        injuryRisk: 'high'
      },
      predictions: {
        nextMonthPerformance: 75,
        injuryRisk: 25,
        peakPerformanceDate: '2025-03-15'
      }
    },
    {
      id: 'player-002',
      name: 'Nathan MacKinnon',
      team: 'Colorado Avalanche',
      workoutsCompleted: 22,
      averageIntensity: 8.4,
      complianceRate: 96.8,
      improvementTrend: 'improving',
      keyMetrics: {
        strengthGains: 8,
        cardioFitness: 12,
        powerOutput: 15,
        mobility: 6,
        recoveryRate: 91
      },
      medicalStatus: {
        currentInjury: 'Minor Shoulder Impingement',
        daysInjured: 7,
        complianceWithRestrictions: 95,
        injuryRisk: 'low'
      },
      predictions: {
        nextMonthPerformance: 94,
        injuryRisk: 8,
        peakPerformanceDate: '2025-02-28'
      }
    },
    {
      id: 'player-003',
      name: 'Connor McDavid',
      team: 'Edmonton Oilers',
      workoutsCompleted: 24,
      averageIntensity: 8.9,
      complianceRate: 98.2,
      improvementTrend: 'peak_form',
      keyMetrics: {
        strengthGains: 12,
        cardioFitness: 18,
        powerOutput: 22,
        mobility: 8,
        recoveryRate: 95
      },
      medicalStatus: {
        injuryRisk: 'very_low'
      },
      predictions: {
        nextMonthPerformance: 98,
        injuryRisk: 3,
        peakPerformanceDate: '2025-02-15'
      }
    }
  ];

  const predictiveInsights: PredictiveInsights = {
    injuryRisk: {
      'player-001': {
        risk: 'high',
        factors: ['current injury', 'training load spike', 'age'],
        recommendation: 'Continue modified program, focus on mobility',
        confidence: 87
      },
      'player-002': {
        risk: 'moderate',
        factors: ['minor shoulder issue', 'high training volume'],
        recommendation: 'Monitor shoulder exercises, ensure adequate rest',
        confidence: 72
      },
      'player-003': {
        risk: 'low',
        factors: ['excellent form', 'good recovery patterns'],
        recommendation: 'Maintain current training approach',
        confidence: 94
      }
    },
    performancePredictions: {
      'player-003': {
        metric: 'VO2 Max',
        currentValue: 65.2,
        predictedValue: 67.5,
        timeframe: '6-8 weeks',
        confidence: 89
      }
    },
    teamRecommendations: [
      'Increase agility training frequency by 15%',
      'Add more hybrid sessions for work capacity',
      'Focus on recovery protocols for high-load players'
    ]
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-100';
      case 'peak_form': return 'text-blue-600 bg-blue-100';
      case 'declining': return 'text-red-600 bg-red-100';
      case 'recovering': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'very_low': return 'text-green-600 bg-green-100';
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'very_high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'strengthGains': return <Award className="h-4 w-4" />;
      case 'cardioFitness': return <Heart className="h-4 w-4" />;
      case 'powerOutput': return <Zap className="h-4 w-4" />;
      case 'mobility': return <Activity className="h-4 w-4" />;
      case 'recoveryRate': return <CheckCircle className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive performance insights and predictive analytics</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team">Team Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="predictive">Predictive AI</TabsTrigger>
          <TabsTrigger value="workouts">Workout Analysis</TabsTrigger>
        </TabsList>

        {/* Team Overview Tab */}
        <TabsContent value="team" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Workouts</p>
                    <p className="text-2xl font-bold text-gray-900">{teamAnalytics.totalWorkouts}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8% this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Avg Intensity</p>
                    <p className="text-2xl font-bold text-gray-900">{teamAnalytics.averageIntensity}/10</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +0.3 vs last week
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Compliance</p>
                    <p className="text-2xl font-bold text-gray-900">{teamAnalytics.complianceRate}%</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +2.1% improvement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Injury Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{teamAnalytics.injuryRate}%</p>
                    <p className="text-xs text-red-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +0.4% vs last week
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workout Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Workout Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(teamAnalytics.workoutTypeDistribution).map(([type, percentage]) => (
                    <div key={type} className="flex items-center">
                      <div className="w-20 text-sm font-medium text-gray-700">
                        {type}
                      </div>
                      <div className="flex-1 mx-3">
                        <Progress value={percentage} className="h-3" />
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">
                        {percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-2">Top Performers</h4>
                    {teamAnalytics.topPerformers.map((player, index) => (
                      <div key={player} className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="ml-2 text-sm">{player}</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Excellent
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t">
                    <h4 className="text-sm font-medium text-red-700 mb-2">Needs Attention</h4>
                    {teamAnalytics.riskyPlayers.map((player) => (
                      <div key={player} className="flex items-center justify-between py-2">
                        <span className="text-sm">{player}</span>
                        <Badge className="bg-red-100 text-red-800">
                          High Risk
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trends Chart Simulation */}
          <Card>
            <CardHeader>
              <CardTitle>Training Volume Trends (Last 4 Weeks)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end space-x-4">
                {teamAnalytics.trends.workoutVolume.map((week, index) => (
                  <div key={week.week} className="flex-1 flex flex-col items-center">
                    <div 
                      className="bg-blue-500 w-full rounded-t"
                      style={{ height: `${(week.volume / 100) * 120}px` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2 text-center">
                      Week {index + 1}
                    </div>
                    <div className="text-xs font-semibold text-gray-800">
                      {week.volume}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Analytics Tab */}
        <TabsContent value="individual" className="space-y-6">
          {/* Player Selection */}
          <div className="flex space-x-2 mb-6">
            {playerAnalytics.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPlayer === player.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {player.name}
              </button>
            ))}
          </div>

          {/* Individual Player Analytics */}
          {selectedPlayer && (
            <div className="space-y-6">
              {(() => {
                const player = playerAnalytics.find(p => p.id === selectedPlayer)!;
                return (
                  <>
                    {/* Player Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{player.name} - Performance Overview</span>
                          <div className="flex items-center space-x-2">
                            <Badge className={getTrendColor(player.improvementTrend)}>
                              {player.improvementTrend.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {player.medicalStatus?.injuryRisk && (
                              <Badge className={getRiskColor(player.medicalStatus.injuryRisk)}>
                                {player.medicalStatus.injuryRisk.replace('_', ' ').toUpperCase()} RISK
                              </Badge>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{player.workoutsCompleted}</div>
                            <div className="text-sm text-gray-600">Workouts Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{player.averageIntensity}/10</div>
                            <div className="text-sm text-gray-600">Average Intensity</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{player.complianceRate}%</div>
                            <div className="text-sm text-gray-600">Compliance Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{player.predictions.nextMonthPerformance}%</div>
                            <div className="text-sm text-gray-600">Predicted Performance</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Key Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Metrics (% Change)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(player.keyMetrics).map(([metric, value]) => (
                            <div key={metric} className="flex items-center p-3 border rounded-lg">
                              <div className={`p-2 rounded-full mr-3 ${value >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                {getMetricIcon(metric)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">
                                  {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </div>
                                <div className={`text-xl font-bold flex items-center ${
                                  value >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {value >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                                  {value > 0 ? '+' : ''}{value}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Medical Status */}
                    {player.medicalStatus?.currentInjury && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Heart className="h-5 w-5 mr-2 text-red-600" />
                            Medical Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm font-medium text-gray-700">Current Injury</div>
                              <div className="text-lg font-semibold text-red-600">{player.medicalStatus.currentInjury}</div>
                              <div className="text-sm text-gray-600">{player.medicalStatus.daysInjured} days</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">Restriction Compliance</div>
                              <div className="text-lg font-semibold text-green-600">{player.medicalStatus.complianceWithRestrictions}%</div>
                              <Progress value={player.medicalStatus.complianceWithRestrictions} className="h-2 mt-1" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">Injury Risk Level</div>
                              <Badge className={getRiskColor(player.medicalStatus.injuryRisk)}>
                                {player.medicalStatus.injuryRisk.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {!selectedPlayer && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a player above to view detailed analytics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Predictive AI Tab */}
        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-600" />
                AI-Powered Injury Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(predictiveInsights.injuryRisk).map(([playerId, data]) => {
                  const player = playerAnalytics.find(p => p.id === playerId);
                  return (
                    <div key={playerId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{player?.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRiskColor(data.risk)}>
                            {data.risk.replace('_', ' ').toUpperCase()} RISK
                          </Badge>
                          <div className="text-sm text-gray-600">
                            {data.confidence}% confidence
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Risk Factors</div>
                          <div className="space-y-1">
                            {data.factors.map((factor, index) => (
                              <div key={index} className="text-sm text-gray-600 flex items-center">
                                <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                                {factor}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">AI Recommendation</div>
                          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                            {data.recommendation}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                Performance Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(predictiveInsights.performancePredictions).map(([playerId, data]) => {
                const player = playerAnalytics.find(p => p.id === playerId);
                return (
                  <div key={playerId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{player?.name}</h4>
                      <div className="text-sm text-gray-600">
                        {data.confidence}% confidence
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700">Metric</div>
                        <div className="text-lg font-semibold text-gray-900">{data.metric}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700">Current</div>
                        <div className="text-lg font-semibold text-blue-600">{data.currentValue}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700">Predicted</div>
                        <div className="text-lg font-semibold text-green-600 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {data.predictedValue}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-center">
                      <div className="text-sm text-gray-600">
                        Expected improvement in {data.timeframe}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Team Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictiveInsights.teamRecommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-.5" />
                    <div className="text-sm text-gray-700">{recommendation}</div>
                  </div>
                ))}
              </div>
            </CardContent>  
          </Card>
        </TabsContent>

        {/* Workout Analysis Tab */}
        <TabsContent value="workouts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workout Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Workout Type Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'STRENGTH', sessions: 45, intensity: 8.1, improvement: 14 },
                    { type: 'CONDITIONING', sessions: 52, intensity: 8.5, improvement: 12 },
                    { type: 'HYBRID', sessions: 38, intensity: 8.7, improvement: 20 },
                    { type: 'AGILITY', sessions: 21, intensity: 7.8, improvement: 18 }
                  ].map((workout) => (
                    <div key={workout.type} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{workout.type}</div>
                        <Badge variant="outline">{workout.sessions} sessions</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Avg Intensity</div>
                          <div className="font-semibold">{workout.intensity}/10</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Improvement</div>
                          <div className="font-semibold text-green-600">+{workout.improvement}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular Exercises */}
            <Card>
              <CardHeader>
                <CardTitle>Most Effective Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Squat Variations', frequency: 42, effectiveness: 94 },
                    { name: 'Power Clean', frequency: 28, effectiveness: 91 },
                    { name: 'VO2 Max Intervals', frequency: 35, effectiveness: 88 },
                    { name: 'Agility Ladders', frequency: 22, effectiveness: 86 }
                  ].map((exercise, index) => (
                    <div key={exercise.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs mr-3">
                          {index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium text-gray-900">{exercise.name}</div>
                          <div className="text-sm text-gray-600">{exercise.frequency} uses</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{exercise.effectiveness}%</div>
                        <div className="text-xs text-gray-600">effectiveness</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 bg-purple-50 p-4 rounded-lg">
        <Brain className="h-5 w-5 inline mr-2" />
        AI analytics powered by machine learning models trained on 10,000+ hockey workouts • 
        <Activity className="h-4 w-4 inline mx-2" />
        Real-time performance tracking and predictive insights
      </div>
    </div>
  );
};