import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, TrendingUp, Zap, Activity, Brain, CheckCircle, AlertTriangle } from 'lucide-react';
import { LightweightBarChart, LightweightAreaChart, LightweightLineChart } from '@/features/physical-trainer/components/charts';

interface LoadRecommendation {
  playerId: string;
  playerName: string;
  position: string;
  currentLoad: number;
  recommendedLoad: number;
  adjustmentPercentage: number;
  adjustmentType: 'increase' | 'decrease' | 'maintain';
  reasoning: string[];
  confidence: number;
  timeframe: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  riskFactors: string[];
  expectedOutcomes: {
    performanceGain: number;
    injuryRiskChange: number;
    fatigueImpact: number;
  };
}

interface TeamLoadOptimization {
  overallEfficiency: number;
  playersOptimized: number;
  totalPlayers: number;
  projectedOutcomes: {
    performanceImprovement: number;
    injuryRiskReduction: number;
    fatigueOptimization: number;
  };
  implementationComplexity: 'low' | 'medium' | 'high';
  lastOptimization: Date;
}

interface LoadRecommendationWidgetProps {
  teamId?: string;
  organizationId: string;
  timeframeWeeks?: number;
  className?: string;
}

export function LoadRecommendationWidget({ 
  teamId, 
  organizationId, 
  timeframeWeeks = 4,
  className = '' 
}: LoadRecommendationWidgetProps) {
  const [recommendations, setRecommendations] = useState<LoadRecommendation[]>([]);
  const [teamOptimization, setTeamOptimization] = useState<TeamLoadOptimization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [implementationStatus, setImplementationStatus] = useState<Record<string, boolean>>({});

  // Mock load recommendations
  const mockRecommendations: LoadRecommendation[] = [
    {
      playerId: 'player1',
      playerName: 'Sidney Crosby',
      position: 'C',
      currentLoad: 850,
      recommendedLoad: 680,
      adjustmentPercentage: -20,
      adjustmentType: 'decrease',
      reasoning: [
        'High fatigue accumulation detected',
        'Injury risk elevated due to recent workload spike',
        'Performance plateau suggests overreaching'
      ],
      confidence: 92,
      timeframe: 'Next 2 weeks',
      priority: 'urgent',
      riskFactors: ['Recent groin injury', 'Poor sleep quality', 'High training monotony'],
      expectedOutcomes: {
        performanceGain: 8,
        injuryRiskChange: -35,
        fatigueImpact: -25
      }
    },
    {
      playerId: 'player2',
      playerName: 'Connor McDavid',
      position: 'C',
      currentLoad: 720,
      recommendedLoad: 790,
      adjustmentPercentage: 10,
      adjustmentType: 'increase',
      reasoning: [
        'Strong recovery indicators',
        'Performance trending upward',
        'Low injury risk profile'
      ],
      confidence: 87,
      timeframe: 'Next 3 weeks',
      priority: 'medium',
      riskFactors: [],
      expectedOutcomes: {
        performanceGain: 12,
        injuryRiskChange: 5,
        fatigueImpact: 15
      }
    },
    {
      playerId: 'player3',
      playerName: 'Nathan MacKinnon',
      position: 'C',
      currentLoad: 680,
      recommendedLoad: 680,
      adjustmentPercentage: 0,
      adjustmentType: 'maintain',
      reasoning: [
        'Optimal load-response relationship',
        'Balanced fatigue and recovery',
        'Performance steady and consistent'
      ],
      confidence: 85,
      timeframe: 'Current approach',
      priority: 'low',
      riskFactors: [],
      expectedOutcomes: {
        performanceGain: 2,
        injuryRiskChange: 0,
        fatigueImpact: 0
      }
    },
    {
      playerId: 'player4',
      playerName: 'Leon Draisaitl',
      position: 'C',
      currentLoad: 740,
      recommendedLoad: 650,
      adjustmentPercentage: -12,
      adjustmentType: 'decrease',
      reasoning: [
        'Back strain history requires load management',
        'Fatigue accumulation above optimal range',
        'Performance declining despite high load'
      ],
      confidence: 89,
      timeframe: 'Next 10 days',
      priority: 'high',
      riskFactors: ['Back strain history', 'Poor movement quality'],
      expectedOutcomes: {
        performanceGain: 6,
        injuryRiskChange: -20,
        fatigueImpact: -18
      }
    }
  ];

  // Mock team optimization data
  const mockTeamOptimization: TeamLoadOptimization = {
    overallEfficiency: 78,
    playersOptimized: 15,
    totalPlayers: 20,
    projectedOutcomes: {
      performanceImprovement: 8.5,
      injuryRiskReduction: 22,
      fatigueOptimization: 15
    },
    implementationComplexity: 'medium',
    lastOptimization: new Date(Date.now() - 2 * 60 * 60 * 1000)
  };

  // Load distribution data for visualization
  const loadDistributionData = mockRecommendations.map(rec => ({
    player: rec.playerName.split(' ')[1], // Last name only
    current: rec.currentLoad,
    recommended: rec.recommendedLoad,
    adjustment: rec.adjustmentPercentage
  }));

  // Optimization timeline data
  const optimizationTimelineData = [
    { week: 'Week 1', performance: 82, injuryRisk: 28, fatigue: 65 },
    { week: 'Week 2', performance: 85, injuryRisk: 24, fatigue: 58 },
    { week: 'Week 3', performance: 88, injuryRisk: 20, fatigue: 52 },
    { week: 'Week 4', performance: 91, injuryRisk: 18, fatigue: 48 }
  ];

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRecommendations(mockRecommendations);
        setTeamOptimization(mockTeamOptimization);
      } catch (err) {
        setError('Failed to load load recommendations');
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [teamId, organizationId, timeframeWeeks]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'increase': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case 'maintain': return <Target className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleImplementRecommendation = (playerId: string) => {
    setImplementationStatus(prev => ({
      ...prev,
      [playerId]: true
    }));
  };

  const filteredRecommendations = recommendations.filter(rec => 
    selectedPriority === 'all' || rec.priority === selectedPriority
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Load Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !teamOptimization) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Load Optimization Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error || 'No optimization data available'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Team Optimization Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Team Load Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{teamOptimization.overallEfficiency}%</div>
              <div className="text-sm text-gray-600">Overall Efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {teamOptimization.playersOptimized}/{teamOptimization.totalPlayers}
              </div>
              <div className="text-sm text-gray-600">Players Optimized</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                +{teamOptimization.projectedOutcomes.performanceImprovement}%
              </div>
              <div className="text-sm text-gray-600">Performance Gain</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                -{teamOptimization.projectedOutcomes.injuryRiskReduction}%
              </div>
              <div className="text-sm text-gray-600">Injury Risk</div>
            </div>
          </div>

          {/* Projected Outcomes Chart */}
          <div className="h-48 relative">
            {/* Performance area */}
            <div className="absolute inset-0">
              <LightweightAreaChart
                data={optimizationTimelineData.map(d => ({
                  x: d.week,
                  y: d.performance
                }))}
                height={192}
                color="#8b5cf6"
                opacity={0.3}
                showGrid={true}
                gradient={true}
              />
            </div>
            {/* Injury Risk line overlay */}
            <div className="absolute inset-0">
              <LightweightLineChart
                data={optimizationTimelineData.map(d => ({
                  x: d.week,
                  y: d.injuryRisk
                }))}
                height={192}
                color="#ef4444"
                strokeWidth={2}
                showGrid={false}
                showDots={true}
              />
            </div>
            {/* Legend */}
            <div className="absolute top-2 right-2 flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>Performance %</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Injury Risk %</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Individual Load Recommendations</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Filter by priority:</span>
                  <select 
                    value={selectedPriority} 
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecommendations.map((rec) => (
                  <Card key={rec.playerId} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{rec.playerName}</h3>
                        <p className="text-sm text-gray-600">{rec.position}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getAdjustmentIcon(rec.adjustmentType)}
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {rec.confidence}% confidence
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600">Current Load</div>
                        <div className="text-lg font-bold">{rec.currentLoad}</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-sm text-gray-600">Recommended Load</div>
                        <div className="text-lg font-bold text-blue-600">{rec.recommendedLoad}</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <div className="text-sm text-gray-600">Adjustment</div>
                        <div className={`text-lg font-bold ${
                          rec.adjustmentPercentage > 0 ? 'text-green-600' : 
                          rec.adjustmentPercentage < 0 ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {rec.adjustmentPercentage > 0 ? '+' : ''}{rec.adjustmentPercentage}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">AI Reasoning:</span>
                        <ul className="mt-1 space-y-1">
                          {rec.reasoning.map((reason, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              • {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {rec.riskFactors.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-red-600">Risk Factors:</span>
                          <div className="mt-1 space-y-1">
                            {rec.riskFactors.map((factor, index) => (
                              <Badge key={index} variant="outline" className="text-red-600 border-red-600 mr-2">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Performance:</span>
                          <span className={`ml-1 font-bold ${
                            rec.expectedOutcomes.performanceGain >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {rec.expectedOutcomes.performanceGain >= 0 ? '+' : ''}{rec.expectedOutcomes.performanceGain}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Injury Risk:</span>
                          <span className={`ml-1 font-bold ${
                            rec.expectedOutcomes.injuryRiskChange <= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {rec.expectedOutcomes.injuryRiskChange > 0 ? '+' : ''}{rec.expectedOutcomes.injuryRiskChange}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Fatigue:</span>
                          <span className={`ml-1 font-bold ${
                            rec.expectedOutcomes.fatigueImpact <= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {rec.expectedOutcomes.fatigueImpact > 0 ? '+' : ''}{rec.expectedOutcomes.fatigueImpact}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-600">
                          Timeframe: {rec.timeframe}
                        </span>
                        {implementationStatus[rec.playerId] ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Implemented
                          </Badge>
                        ) : (
                          <Button 
                            onClick={() => handleImplementRecommendation(rec.playerId)}
                            size="sm"
                            variant={rec.priority === 'urgent' ? 'default' : 'outline'}
                          >
                            Implement Recommendation
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Load Distribution Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-6">
                {/* Convert data for grouped bar chart */}
                <div className="flex items-end gap-4 h-full px-4">
                  {loadDistributionData.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end gap-2">
                      <div className="flex gap-1 items-end w-full">
                        {/* Current Load Bar */}
                        <div className="flex-1 flex flex-col items-center justify-end">
                          <span className="text-xs text-gray-600 mb-1">{item.current}</span>
                          <div
                            className="w-full bg-gray-400 rounded-t transition-all duration-300"
                            style={{
                              height: `${(item.current / Math.max(...loadDistributionData.map(d => Math.max(d.current, d.recommended)))) * 200}px`
                            }}
                            title={`Current: ${item.current}`}
                          />
                        </div>
                        {/* Recommended Load Bar */}
                        <div className="flex-1 flex flex-col items-center justify-end">
                          <span className="text-xs text-gray-600 mb-1">{item.recommended}</span>
                          <div
                            className="w-full bg-blue-500 rounded-t transition-all duration-300"
                            style={{
                              height: `${(item.recommended / Math.max(...loadDistributionData.map(d => Math.max(d.current, d.recommended)))) * 200}px`
                            }}
                            title={`Recommended: ${item.recommended}`}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-700 mt-2">{item.player}</span>
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <span>Current Load</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Recommended Load</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold text-green-600 mb-2">Optimization Benefits</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 8.5% average performance improvement</li>
                    <li>• 22% reduction in injury risk</li>
                    <li>• 15% better fatigue management</li>
                    <li>• Improved load distribution across team</li>
                  </ul>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold text-blue-600 mb-2">Implementation Impact</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Medium complexity implementation</li>
                    <li>• 2-3 week adaptation period</li>
                    <li>• Requires monitoring adjustments</li>
                    <li>• Gradual progression recommended</li>
                  </ul>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold text-orange-600 mb-2">Risk Considerations</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Monitor player adaptation closely</li>
                    <li>• Adjust based on weekly feedback</li>
                    <li>• Watch for overcompensation effects</li>
                    <li>• Maintain injury prevention protocols</li>
                  </ul>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-600 py-8">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Implementation tracking coming soon...</p>
                <p className="text-sm">This will include progress monitoring, compliance tracking, and outcome measurement.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}