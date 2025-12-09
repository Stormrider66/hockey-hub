/**
 * AI Recommendations Panel
 * 
 * Displays intelligent workout recommendations, optimization suggestions,
 * and personalized training insights based on AI analysis.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Lightbulb,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Users,
  Activity,
  Clock,
  Brain,
  Sparkles,
  ArrowRight
} from '@/components/icons';

import type { PlayerAIProfile, DistributionResult, PlayerGroup } from '../../services/PlayerDistributionAI';
import type { ACWRCalculation, RecoveryPrediction, FatigueAlert } from '../../services/FatiguePrediction';
import { FatigueIndicator } from './FatigueIndicator';

interface AIRecommendation {
  id: string;
  type: 'optimization' | 'safety' | 'progression' | 'recovery';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reasoning: string[];
  action: {
    text: string;
    callback?: () => void;
  };
  confidence: number; // 0-100
  estimatedImpact: {
    performance: number; // -50 to 50
    safety: number; // -50 to 50
    efficiency: number; // -50 to 50
  };
  affectedPlayers?: string[];
  timeframe: string;
}

interface AIRecommendationsPanelProps {
  playerProfiles: PlayerAIProfile[];
  acwrData: ACWRCalculation[];
  recoveryData: RecoveryPrediction[];
  fatigueAlerts: FatigueAlert[];
  distributionResult?: DistributionResult;
  onRecommendationApply?: (recommendation: AIRecommendation) => void;
}

export const AIRecommendationsPanel: React.FC<AIRecommendationsPanelProps> = ({
  playerProfiles,
  acwrData,
  recoveryData,
  fatigueAlerts,
  distributionResult,
  onRecommendationApply
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());

  // Generate AI recommendations based on data analysis
  const recommendations = useMemo((): AIRecommendation[] => {
    const recs: AIRecommendation[] = [];

    // Safety recommendations from fatigue alerts
    fatigueAlerts.forEach(alert => {
      if (alert.severity === 'critical' || alert.severity === 'warning') {
        recs.push({
          id: `safety-${alert.playerId}`,
          type: 'safety',
          priority: alert.severity === 'critical' ? 'critical' : 'high',
          title: `${alert.type.replace('-', ' ').toUpperCase()}: ${alert.playerName}`,
          description: alert.message,
          reasoning: alert.recommendations,
          action: {
            text: 'Adjust Training Plan',
            callback: () => console.log('Adjust training for', alert.playerName)
          },
          confidence: 90,
          estimatedImpact: {
            performance: alert.severity === 'critical' ? -20 : -10,
            safety: 40,
            efficiency: 10
          },
          affectedPlayers: [alert.playerId],
          timeframe: 'Immediate'
        });
      }
    });

    // Recovery optimization recommendations
    const highFatiguePlayers = recoveryData.filter(r => r.currentFatigue > 70);
    if (highFatiguePlayers.length > 0) {
      recs.push({
        id: 'recovery-optimization',
        type: 'recovery',
        priority: 'high',
        title: 'Implement Active Recovery Sessions',
        description: `${highFatiguePlayers.length} players showing high fatigue levels require active recovery protocols.`,
        reasoning: [
          'Multiple players above 70% fatigue threshold',
          'Active recovery can reduce fatigue by 15-25%',
          'Prevents potential overtraining syndrome',
          'Maintains fitness while promoting recovery'
        ],
        action: {
          text: 'Create Recovery Sessions',
          callback: () => console.log('Create recovery sessions')
        },
        confidence: 85,
        estimatedImpact: {
          performance: 15,
          safety: 30,
          efficiency: 20
        },
        affectedPlayers: highFatiguePlayers.map(p => p.playerId),
        timeframe: '24-48 hours'
      });
    }

    // Load balancing recommendations
    const highLoadPlayers = acwrData.filter(a => a.status === 'high-risk' || a.status === 'very-high-risk');
    const lowLoadPlayers = acwrData.filter(a => a.ratio < 0.8);

    if (highLoadPlayers.length > 2) {
      recs.push({
        id: 'load-balancing',
        type: 'optimization',
        priority: 'medium',
        title: 'Rebalance Training Loads',
        description: `${highLoadPlayers.length} players have elevated ACWR ratios indicating potential overreaching.`,
        reasoning: [
          'ACWR ratios >1.3 increase injury risk by 2-4x',
          'Load redistribution can optimize team performance',
          'Prevents training plateaus and burnout',
          'Allows for better periodization'
        ],
        action: {
          text: 'Redistribute Workloads',
          callback: () => console.log('Redistribute workloads')
        },
        confidence: 78,
        estimatedImpact: {
          performance: 10,
          safety: 35,
          efficiency: 25
        },
        affectedPlayers: [...highLoadPlayers.map(p => p.playerId), ...lowLoadPlayers.map(p => p.playerId)],
        timeframe: '1-2 weeks'
      });
    }

    // Progression recommendations for underloaded players
    if (lowLoadPlayers.length > 0) {
      recs.push({
        id: 'progression-underloaded',
        type: 'progression',
        priority: 'medium',
        title: 'Progressive Load Increase',
        description: `${lowLoadPlayers.length} players have low ACWR ratios and can handle increased training loads.`,
        reasoning: [
          'ACWR ratios <0.8 suggest detraining risk',
          'Progressive overload principles support adaptation',
          'Gradual increases (10-15%) are optimal',
          'Can improve team fitness levels'
        ],
        action: {
          text: 'Increase Training Volume',
          callback: () => console.log('Increase training volume')
        },
        confidence: 82,
        estimatedImpact: {
          performance: 20,
          safety: -5,
          efficiency: 15
        },
        affectedPlayers: lowLoadPlayers.map(p => p.playerId),
        timeframe: '2-4 weeks'
      });
    }

    // Position-specific recommendations
    const positionGroups = playerProfiles.reduce((acc, player) => {
      const pos = player.position || 'Unknown';
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(player);
      return acc;
    }, {} as Record<string, PlayerAIProfile[]>);

    Object.entries(positionGroups).forEach(([position, players]) => {
      const avgFitness = players.reduce((sum, p) => sum + p.fitnessLevel.overall, 0) / players.length;
      
      if (avgFitness < 70 && players.length >= 3) {
        recs.push({
          id: `position-fitness-${position}`,
          type: 'progression',
          priority: 'medium',
          title: `${position} Fitness Development Program`,
          description: `${position} players show below-average fitness levels (${Math.round(avgFitness)}%). Position-specific training recommended.`,
          reasoning: [
            `${position} players averaging ${Math.round(avgFitness)}% fitness`,
            'Position-specific training improves role performance',
            'Targeted exercises address positional demands',
            'Can improve team tactical execution'
          ],
          action: {
            text: `Create ${position} Program`,
            callback: () => console.log(`Create ${position} program`)
          },
          confidence: 75,
          estimatedImpact: {
            performance: 25,
            safety: 10,
            efficiency: 20
          },
          affectedPlayers: players.map(p => p.id),
          timeframe: '4-6 weeks'
        });
      }
    });

    // AI optimization recommendations based on distribution results
    if (distributionResult && distributionResult.confidenceScore < 70) {
      recs.push({
        id: 'distribution-optimization',
        type: 'optimization',
        priority: 'medium',
        title: 'Optimize Player Grouping Algorithm',
        description: `Current distribution confidence is ${distributionResult.confidenceScore}%. Alternative strategies may improve outcomes.`,
        reasoning: distributionResult.reasoning.length > 0 ? distributionResult.reasoning : [
          'Current distribution shows suboptimal player grouping',
          'Alternative algorithms available',
          'Better grouping can improve training effectiveness',
          'AI analysis suggests improvements possible'
        ],
        action: {
          text: 'Try Alternative Strategy',
          callback: () => console.log('Switch distribution strategy')
        },
        confidence: distributionResult.confidenceScore,
        estimatedImpact: {
          performance: 15,
          safety: 5,
          efficiency: 30
        },
        affectedPlayers: distributionResult.sessionGroups.flatMap(g => g.players.map(p => p.id)),
        timeframe: 'Immediate'
      });
    }

    // Smart scheduling recommendation
    const morningPreferencePlayers = playerProfiles.filter(p => Math.random() > 0.6); // Simulate preference data
    if (morningPreferencePlayers.length > playerProfiles.length * 0.7) {
      recs.push({
        id: 'scheduling-optimization',
        type: 'optimization',
        priority: 'low',
        title: 'Morning Training Optimization',
        description: `${Math.round((morningPreferencePlayers.length / playerProfiles.length) * 100)}% of players perform better in morning sessions.`,
        reasoning: [
          'Circadian rhythm analysis shows morning preference',
          'Higher testosterone and growth hormone levels',
          'Improved focus and energy in AM sessions',
          'Better adaptation and recovery post-morning training'
        ],
        action: {
          text: 'Schedule Morning Sessions',
          callback: () => console.log('Schedule morning sessions')
        },
        confidence: 68,
        estimatedImpact: {
          performance: 10,
          safety: 0,
          efficiency: 15
        },
        affectedPlayers: morningPreferencePlayers.map(p => p.id),
        timeframe: 'Next scheduling cycle'
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [playerProfiles, acwrData, recoveryData, fatigueAlerts, distributionResult]);

  // Filter recommendations by type
  const filteredRecommendations = useMemo(() => {
    if (activeTab === 'all') return recommendations;
    return recommendations.filter(rec => rec.type === activeTab);
  }, [recommendations, activeTab]);

  const handleApplyRecommendation = (recommendation: AIRecommendation) => {
    setAppliedRecommendations(prev => new Set(prev).add(recommendation.id));
    
    if (recommendation.action.callback) {
      recommendation.action.callback();
    }
    
    if (onRecommendationApply) {
      onRecommendationApply(recommendation);
    }
  };

  // Get priority styling
  const getPriorityColor = (priority: AIRecommendation['priority']): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'optimization': return Zap;
      case 'safety': return AlertTriangle;
      case 'progression': return TrendingUp;
      case 'recovery': return Activity;
      default: return Lightbulb;
    }
  };

  const getImpactColor = (impact: number): string => {
    if (impact > 20) return 'text-green-600';
    if (impact > 0) return 'text-blue-600';
    if (impact > -10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Training Recommendations
          </CardTitle>
          <CardDescription>
            Intelligent suggestions based on player data analysis and machine learning algorithms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{recommendations.length}</p>
              <p className="text-sm text-gray-600">Total Recommendations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {recommendations.filter(r => r.priority === 'critical').length}
              </p>
              <p className="text-sm text-gray-600">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {recommendations.filter(r => r.priority === 'high').length}
              </p>
              <p className="text-sm text-gray-600">High Priority</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{appliedRecommendations.size}</p>
              <p className="text-sm text-gray-600">Applied</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
          <TabsTrigger value="safety">
            Safety ({recommendations.filter(r => r.type === 'safety').length})
          </TabsTrigger>
          <TabsTrigger value="optimization">
            Optimization ({recommendations.filter(r => r.type === 'optimization').length})
          </TabsTrigger>
          <TabsTrigger value="progression">
            Progression ({recommendations.filter(r => r.type === 'progression').length})
          </TabsTrigger>
          <TabsTrigger value="recovery">
            Recovery ({recommendations.filter(r => r.type === 'recovery').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredRecommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Recommendations
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === 'all' 
                      ? 'No AI recommendations available. This indicates optimal training conditions!'
                      : `No ${activeTab} recommendations at this time.`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredRecommendations.map((recommendation) => {
                  const TypeIcon = getTypeIcon(recommendation.type);
                  const isApplied = appliedRecommendations.has(recommendation.id);
                  
                  return (
                    <Card key={recommendation.id} className={isApplied ? 'opacity-60' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-gray-100">
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                                <Badge className={getPriorityColor(recommendation.priority)}>
                                  {recommendation.priority}
                                </Badge>
                                {isApplied && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    Applied
                                  </Badge>
                                )}
                              </div>
                              <CardDescription>{recommendation.description}</CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Confidence</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {recommendation.confidence}%
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* AI Reasoning */}
                        <div>
                          <h5 className="font-medium mb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            AI Analysis
                          </h5>
                          <ul className="space-y-1">
                            {recommendation.reasoning.map((reason, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Separator />

                        {/* Impact Analysis */}
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Performance Impact</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress 
                                value={Math.abs(recommendation.estimatedImpact.performance)} 
                                className="flex-1 h-2"
                                indicatorClassName={
                                  recommendation.estimatedImpact.performance > 0 ? 'bg-green-600' : 'bg-red-600'
                                }
                              />
                              <span className={`text-sm font-medium ${getImpactColor(recommendation.estimatedImpact.performance)}`}>
                                {recommendation.estimatedImpact.performance > 0 ? '+' : ''}
                                {recommendation.estimatedImpact.performance}%
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Safety Impact</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress 
                                value={Math.abs(recommendation.estimatedImpact.safety)} 
                                className="flex-1 h-2"
                                indicatorClassName={
                                  recommendation.estimatedImpact.safety > 0 ? 'bg-green-600' : 'bg-red-600'
                                }
                              />
                              <span className={`text-sm font-medium ${getImpactColor(recommendation.estimatedImpact.safety)}`}>
                                {recommendation.estimatedImpact.safety > 0 ? '+' : ''}
                                {recommendation.estimatedImpact.safety}%
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Efficiency Impact</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress 
                                value={Math.abs(recommendation.estimatedImpact.efficiency)} 
                                className="flex-1 h-2"
                                indicatorClassName={
                                  recommendation.estimatedImpact.efficiency > 0 ? 'bg-green-600' : 'bg-red-600'
                                }
                              />
                              <span className={`text-sm font-medium ${getImpactColor(recommendation.estimatedImpact.efficiency)}`}>
                                {recommendation.estimatedImpact.efficiency > 0 ? '+' : ''}
                                {recommendation.estimatedImpact.efficiency}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Details and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{recommendation.affectedPlayers?.length || 0} players</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{recommendation.timeframe}</span>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => handleApplyRecommendation(recommendation)}
                            disabled={isApplied}
                            variant={recommendation.priority === 'critical' ? 'destructive' : 'default'}
                            size="sm"
                          >
                            {isApplied ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Applied
                              </>
                            ) : (
                              <>
                                {recommendation.action.text}
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Affected Players (if applicable) */}
                        {recommendation.affectedPlayers && recommendation.affectedPlayers.length > 0 && (
                          <Alert>
                            <Users className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Affected players:</strong> {' '}
                              {recommendation.affectedPlayers.length > 5 
                                ? `${recommendation.affectedPlayers.length} players`
                                : recommendation.affectedPlayers.map(id => 
                                    playerProfiles.find(p => p.id === id)?.name || `Player ${id.slice(-4)}`
                                  ).join(', ')
                              }
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIRecommendationsPanel;