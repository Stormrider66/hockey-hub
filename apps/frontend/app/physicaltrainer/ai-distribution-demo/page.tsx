/**
 * AI Distribution Demo Page
 * 
 * Demonstrates the AI-powered player distribution system with
 * fatigue prediction, clustering algorithms, and intelligent recommendations.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain,
  Users,
  Activity,
  TrendingUp,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Clock,
  Heart,
  Shuffle,
  Sparkles
} from '@/components/icons';

import { 
  PlayerDistributionPanel,
  FatigueIndicator,
  LoadBalanceVisualization,
  AIRecommendationsPanel
} from '@/features/physical-trainer/components/ai';

import {
  PlayerDistributionAI,
  type PlayerAIProfile,
  type DistributionResult
} from '@/features/physical-trainer/services/PlayerDistributionAI';

import {
  FatiguePrediction,
  type ACWRCalculation,
  type RecoveryPrediction,
  type FatigueAlert
} from '@/features/physical-trainer/services/FatiguePrediction';

import type { PlayerData } from '@/features/physical-trainer/components/shared/PlayerTeamAssignment';

// Demo data
const DEMO_PLAYERS: PlayerData[] = [
  { id: '1', name: 'Sidney Crosby', position: 'Center', team: 'Pittsburgh Penguins', wellness: { status: 'injured' } },
  { id: '2', name: 'Nathan MacKinnon', position: 'Center', team: 'Colorado Avalanche', wellness: { status: 'limited' } },
  { id: '3', name: 'Connor McDavid', position: 'Center', team: 'Edmonton Oilers', wellness: { status: 'healthy' } },
  { id: '4', name: 'Leon Draisaitl', position: 'Center', team: 'Edmonton Oilers', wellness: { status: 'healthy' } },
  { id: '5', name: 'Erik Karlsson', position: 'Defense', team: 'San Jose Sharks', wellness: { status: 'healthy' } },
  { id: '6', name: 'Cale Makar', position: 'Defense', team: 'Colorado Avalanche', wellness: { status: 'healthy' } },
  { id: '7', name: 'Victor Hedman', position: 'Defense', team: 'Tampa Bay Lightning', wellness: { status: 'limited' } },
  { id: '8', name: 'David Pastrnak', position: 'Right Wing', team: 'Boston Bruins', wellness: { status: 'healthy' } },
  { id: '9', name: 'Mikko Rantanen', position: 'Right Wing', team: 'Colorado Avalanche', wellness: { status: 'healthy' } },
  { id: '10', name: 'Brad Marchand', position: 'Left Wing', team: 'Boston Bruins', wellness: { status: 'healthy' } },
  { id: '11', name: 'Alex Ovechkin', position: 'Left Wing', team: 'Washington Capitals', wellness: { status: 'healthy' } },
  { id: '12', name: 'Igor Shesterkin', position: 'Goalie', team: 'New York Rangers', wellness: { status: 'healthy' } },
  { id: '13', name: 'Andrei Vasilevskiy', position: 'Goalie', team: 'Tampa Bay Lightning', wellness: { status: 'healthy' } },
  { id: '14', name: 'Auston Matthews', position: 'Center', team: 'Toronto Maple Leafs', wellness: { status: 'healthy' } },
  { id: '15', name: 'Mitch Marner', position: 'Right Wing', team: 'Toronto Maple Leafs', wellness: { status: 'healthy' } },
  { id: '16', name: 'William Nylander', position: 'Right Wing', team: 'Toronto Maple Leafs', wellness: { status: 'healthy' } }
];

// Initialize AI services
const distributionAI = new PlayerDistributionAI();
const fatiguePrediction = new FatiguePrediction();

export default function AIDistributionDemoPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [distributionResult, setDistributionResult] = useState<DistributionResult | null>(null);
  const [playerProfiles, setPlayerProfiles] = useState<PlayerAIProfile[]>([]);
  const [acwrData, setAcwrData] = useState<ACWRCalculation[]>([]);
  const [recoveryData, setRecoveryData] = useState<RecoveryPrediction[]>([]);
  const [fatigueAlerts, setFatigueAlerts] = useState<FatigueAlert[]>([]);
  const [activeDemo, setActiveDemo] = useState<'distribution' | 'analytics' | 'recommendations'>('distribution');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate demo data
  const initializeDemoData = async () => {
    setIsAnalyzing(true);
    
    try {
      // Generate AI profiles
      const profiles = distributionAI.generatePlayerProfiles(DEMO_PLAYERS);
      setPlayerProfiles(profiles);

      // Initialize fatigue prediction
      fatiguePrediction.initializePlayerHistory(profiles);

      // Get batch predictions
      const predictions = fatiguePrediction.getBatchPredictions(profiles.map(p => p.id));
      setAcwrData(predictions.acwr);
      setRecoveryData(predictions.recovery);
      setFatigueAlerts(predictions.alerts);

      // Auto-select balanced strategy and generate distribution
      const strategies = distributionAI.getAvailableStrategies();
      if (strategies.length > 0) {
        setSelectedStrategy(strategies[0].name);
        const result = distributionAI.distributePlayersAcrossSessions(profiles, strategies[0], 3);
        setDistributionResult(result);
      }
    } catch (error) {
      console.error('Failed to initialize demo data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initialize demo data on component mount
  React.useEffect(() => {
    initializeDemoData();
  }, []);

  // Demo statistics
  const demoStats = useMemo(() => {
    if (!playerProfiles.length) return null;

    return {
      totalPlayers: playerProfiles.length,
      averageFitness: Math.round(playerProfiles.reduce((sum, p) => sum + p.fitnessLevel.overall, 0) / playerProfiles.length),
      highRiskPlayers: acwrData.filter(a => a.status === 'high-risk' || a.status === 'very-high-risk').length,
      alertCount: fatigueAlerts.length,
      confidenceScore: distributionResult?.confidenceScore || 0
    };
  }, [playerProfiles, acwrData, fatigueAlerts, distributionResult]);

  const handleStrategyTest = async (strategyName: string) => {
    if (!playerProfiles.length) return;

    setIsAnalyzing(true);
    setSelectedStrategy(strategyName);

    try {
      const strategies = distributionAI.getAvailableStrategies();
      const strategy = strategies.find(s => s.name === strategyName);
      
      if (strategy) {
        const result = distributionAI.distributePlayersAcrossSessions(playerProfiles, strategy, 3);
        setDistributionResult(result);
      }
    } catch (error) {
      console.error('Strategy test failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
            <Brain className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Distribution System Demo</h1>
            <p className="text-lg text-gray-600">
              Intelligent player distribution with fatigue prediction and machine learning
            </p>
          </div>
        </div>
        
        {/* Demo Stats */}
        {demoStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{demoStats.totalPlayers}</p>
                  <p className="text-sm text-gray-600">Players</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{demoStats.averageFitness}%</p>
                  <p className="text-sm text-gray-600">Avg Fitness</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{demoStats.highRiskPlayers}</p>
                  <p className="text-sm text-gray-600">High Risk</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Heart className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{demoStats.alertCount}</p>
                  <p className="text-sm text-gray-600">Alerts</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{demoStats.confidenceScore}%</p>
                  <p className="text-sm text-gray-600">AI Confidence</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Demo Navigation */}
      <Tabs value={activeDemo} onValueChange={(value) => setActiveDemo(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <Shuffle className="h-4 w-4" />
            Player Distribution
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics & ACWR
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Distribution Demo */}
        <TabsContent value="distribution" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Distribution Strategies Demo
              </CardTitle>
              <CardDescription>
                Test different AI algorithms for player grouping and load balancing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {distributionAI.getAvailableStrategies().map((strategy) => (
                  <Card 
                    key={strategy.name} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStrategy === strategy.name ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleStrategyTest(strategy.name)}
                  >
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Zap className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-medium mb-2">{strategy.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {strategy.algorithm}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {isAnalyzing && (
                <div className="mt-6 text-center">
                  <Activity className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">AI is analyzing player data and generating optimal distributions...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribution Results */}
          {distributionResult && !isAnalyzing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Distribution Results
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={distributionResult.confidenceScore} className="w-24 h-2" />
                    <span className="text-sm font-medium">{distributionResult.confidenceScore}%</span>
                  </div>
                </CardTitle>
                <CardDescription>
                  AI-generated player groups with {selectedStrategy} algorithm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-3 gap-4 mb-6">
                  {distributionResult.sessionGroups.map((group, index) => (
                    <Card key={group.id} className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          {group.name}
                          <Badge className={
                            group.recommendedIntensity === 'high' ? 'bg-red-100 text-red-800' :
                            group.recommendedIntensity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {group.recommendedIntensity}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-medium">{group.players.length}</p>
                              <p className="text-gray-500">Players</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{group.estimatedDuration}m</p>
                              <p className="text-gray-500">Duration</p>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            {group.players.slice(0, 4).map((player) => (
                              <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <p className="text-sm font-medium">{player.name}</p>
                                  <p className="text-xs text-gray-500">{player.position}</p>
                                </div>
                                <FatigueIndicator 
                                  fatigue={player.fatigue}
                                  variant="minimal"
                                  size="sm"
                                />
                              </div>
                            ))}
                            {group.players.length > 4 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{group.players.length - 4} more players
                              </p>
                            )}
                          </div>

                          {group.notes.length > 0 && (
                            <div className="pt-2 border-t">
                              {group.notes.map((note, noteIndex) => (
                                <p key={noteIndex} className="text-xs text-gray-600">• {note}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* AI Reasoning */}
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">AI Analysis Results:</p>
                      <ul className="space-y-1">
                        {distributionResult.reasoning.map((reason, index) => (
                          <li key={index} className="text-sm">• {reason}</li>
                        ))}
                      </ul>
                      {distributionResult.warnings.length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium text-orange-700">Warnings:</p>
                          <ul className="space-y-1">
                            {distributionResult.warnings.map((warning, index) => (
                              <li key={index} className="text-sm text-orange-600">• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Demo */}
        <TabsContent value="analytics" className="mt-6">
          {playerProfiles.length > 0 ? (
            <LoadBalanceVisualization 
              playerProfiles={playerProfiles}
              acwrData={acwrData}
              recoveryData={recoveryData}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading analytics data...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Demo */}
        <TabsContent value="recommendations" className="mt-6">
          {playerProfiles.length > 0 ? (
            <AIRecommendationsPanel
              playerProfiles={playerProfiles}
              acwrData={acwrData}
              recoveryData={recoveryData}
              fatigueAlerts={fatigueAlerts}
              distributionResult={distributionResult || undefined}
              onRecommendationApply={(recommendation) => {
                console.log('Applied recommendation:', recommendation.title);
                // In real implementation, this would trigger actual changes
              }}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Brain className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600">Generating AI recommendations...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Demo Footer */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI-Powered Training Optimization</h3>
            <p className="text-gray-600 mb-4">
              This demo showcases advanced machine learning algorithms including k-means clustering, 
              ACWR analysis, EWMA smoothing, and predictive analytics for intelligent player management.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline">K-Means Clustering</Badge>
              <Badge variant="outline">ACWR Analysis</Badge>
              <Badge variant="outline">EWMA Smoothing</Badge>
              <Badge variant="outline">Linear Regression</Badge>
              <Badge variant="outline">Fatigue Prediction</Badge>
              <Badge variant="outline">Risk Assessment</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}