/**
 * AI-Powered Player Distribution Panel
 * 
 * Provides intelligent player distribution recommendations using clustering algorithms
 * and fatigue prediction models.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  Brain,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Shuffle,
  Target,
  Zap,
  Clock
} from '@/components/icons';

import { 
  PlayerDistributionAI,
  type PlayerAIProfile,
  type DistributionStrategy,
  type DistributionResult,
  type PlayerGroup
} from '../../services/PlayerDistributionAI';
import { 
  FatiguePrediction,
  type ACWRCalculation,
  type RecoveryPrediction
} from '../../services/FatiguePrediction';
import type { PlayerData } from '../shared/PlayerTeamAssignment';
import type { PlayerReadiness, MedicalRestriction } from '../../types';
import { FatigueIndicator } from './FatigueIndicator';
import { LoadBalanceVisualization } from './LoadBalanceVisualization';

interface PlayerDistributionPanelProps {
  players: PlayerData[];
  readinessData?: PlayerReadiness[];
  medicalRestrictions?: MedicalRestriction[];
  onDistributionApply?: (groups: PlayerGroup[]) => void;
  onPlayersSelect?: (playerIds: string[]) => void;
  sessionCount?: number;
  isVisible?: boolean;
}

const distributionAI = new PlayerDistributionAI();
const fatiguePrediction = new FatiguePrediction();

export const PlayerDistributionPanel: React.FC<PlayerDistributionPanelProps> = ({
  players,
  readinessData = [],
  medicalRestrictions = [],
  onDistributionApply,
  onPlayersSelect,
  sessionCount = 2,
  isVisible = true
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<DistributionStrategy | null>(null);
  const [distributionResult, setDistributionResult] = useState<DistributionResult | null>(null);
  const [playerProfiles, setPlayerProfiles] = useState<PlayerAIProfile[]>([]);
  const [acwrData, setAcwrData] = useState<ACWRCalculation[]>([]);
  const [recoveryData, setRecoveryData] = useState<RecoveryPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState({
    maxPlayersPerSession: sessionCount > 2 ? 8 : 12,
    prioritizeRecovery: false,
    balancePositions: true,
    minFitnessVariation: 15
  });

  // Available strategies
  const strategies = useMemo(() => distributionAI.getAvailableStrategies(), []);

  // Initialize AI profiles and predictions
  useEffect(() => {
    if (players.length > 0) {
      const profiles = distributionAI.generatePlayerProfiles(
        players,
        readinessData,
        medicalRestrictions
      );
      setPlayerProfiles(profiles);

      // Initialize fatigue prediction service
      fatiguePrediction.initializePlayerHistory(profiles);

      // Calculate ACWR and recovery predictions
      const playerIds = profiles.map(p => p.id);
      const predictions = fatiguePrediction.getBatchPredictions(playerIds);
      setAcwrData(predictions.acwr);
      setRecoveryData(predictions.recovery);

      // Auto-select balanced strategy
      if (!selectedStrategy && strategies.length > 0) {
        setSelectedStrategy(strategies[0]);
      }
    }
  }, [players, readinessData, medicalRestrictions, strategies, selectedStrategy]);

  // Auto-generate distribution when strategy changes
  useEffect(() => {
    if (selectedStrategy && playerProfiles.length > 0) {
      generateDistribution();
    }
  }, [selectedStrategy, playerProfiles, sessionCount, advancedSettings]);

  const generateDistribution = async () => {
    if (!selectedStrategy || playerProfiles.length === 0) return;

    setIsAnalyzing(true);

    try {
      // Apply advanced settings to strategy
      const customizedStrategy: DistributionStrategy = {
        ...selectedStrategy,
        parameters: {
          ...selectedStrategy.parameters,
          ...advancedSettings
        }
      };

      const result = distributionAI.distributePlayersAcrossSessions(
        playerProfiles,
        customizedStrategy,
        sessionCount
      );

      setDistributionResult(result);
    } catch (error) {
      console.error('Distribution analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStrategyChange = (strategyName: string) => {
    const strategy = strategies.find(s => s.name === strategyName);
    if (strategy) {
      setSelectedStrategy(strategy);
    }
  };

  const handleApplyDistribution = () => {
    if (distributionResult && onDistributionApply) {
      onDistributionApply(distributionResult.sessionGroups);
    }
  };

  const handleSelectGroup = (group: PlayerGroup) => {
    if (onPlayersSelect) {
      onPlayersSelect(group.players.map(p => p.id));
    }
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIntensityColor = (intensity: string): string => {
    switch (intensity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI-Powered Player Distribution
          </CardTitle>
          <CardDescription>
            Intelligent player grouping using machine learning algorithms and fatigue prediction
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="strategy" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Strategy Selection */}
        <TabsContent value="strategy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribution Strategy</CardTitle>
              <CardDescription>
                Choose the AI algorithm for player grouping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedStrategy?.name || ''}
                onValueChange={handleStrategyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select distribution strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map(strategy => (
                    <SelectItem key={strategy.name} value={strategy.name}>
                      <div>
                        <div className="font-medium">{strategy.name}</div>
                        <div className="text-sm text-gray-500">
                          {strategy.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedStrategy && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Algorithm:</strong> {selectedStrategy.algorithm}<br />
                    <strong>Description:</strong> {selectedStrategy.description}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={generateDistribution}
                  disabled={!selectedStrategy || isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shuffle className="h-4 w-4 mr-2" />
                      Generate Distribution
                    </>
                  )}
                </Button>
                
                {distributionResult && (
                  <Button
                    variant="outline"
                    onClick={handleApplyDistribution}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Results */}
        <TabsContent value="distribution" className="space-y-4">
          {distributionResult && (
            <>
              {/* Confidence Score */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Confidence Score</Label>
                      <p className={`text-2xl font-bold ${getConfidenceColor(distributionResult.confidenceScore)}`}>
                        {distributionResult.confidenceScore}%
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-gray-400" />
                  </div>
                  <Progress 
                    value={distributionResult.confidenceScore} 
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              {/* Distribution Groups */}
              <div className="grid gap-4">
                {distributionResult.sessionGroups.map((group, index) => (
                  <Card key={group.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader 
                      className="pb-4"
                      onClick={() => handleSelectGroup(group)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {group.name}
                        </CardTitle>
                        <Badge className={getIntensityColor(group.recommendedIntensity)}>
                          {group.recommendedIntensity} intensity
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Group Stats */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{group.players.length}</p>
                          <p className="text-gray-500">Players</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{group.estimatedDuration}m</p>
                          <p className="text-gray-500">Duration</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{group.equipment.length}</p>
                          <p className="text-gray-500">Equipment</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Players */}
                      <ScrollArea className="h-32">
                        <div className="grid grid-cols-2 gap-2">
                          {group.players.map(player => (
                            <div key={player.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{player.name}</p>
                                <p className="text-xs text-gray-500">{player.position}</p>
                              </div>
                              <FatigueIndicator 
                                fatigue={player.fatigue}
                                size="sm"
                              />
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Notes */}
                      {group.notes.length > 0 && (
                        <div className="space-y-1">
                          {group.notes.map((note, noteIndex) => (
                            <p key={noteIndex} className="text-xs text-gray-600">
                              • {note}
                            </p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Reasoning */}
              {distributionResult.reasoning.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      AI Reasoning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {distributionResult.reasoning.map((reason, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {distributionResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {distributionResult.warnings.map((warning, index) => (
                        <p key={index}>• {warning}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Alternative Options */}
              {distributionResult.alternativeOptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Alternative Distributions</CardTitle>
                    <CardDescription>
                      Other AI-recommended grouping options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {distributionResult.alternativeOptions.map((alt, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{alt.name}</h4>
                            <Badge variant="outline">
                              Score: {alt.score}%
                            </Badge>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-green-700 mb-1">Pros:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {alt.pros.map((pro, proIndex) => (
                                  <li key={proIndex} className="text-green-600">{pro}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-red-700 mb-1">Cons:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {alt.cons.map((con, conIndex) => (
                                  <li key={conIndex} className="text-red-600">{con}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!distributionResult && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Distribution Generated
                  </h3>
                  <p className="text-gray-500">
                    Select a strategy and generate a distribution to see AI recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <LoadBalanceVisualization 
            playerProfiles={playerProfiles}
            acwrData={acwrData}
            recoveryData={recoveryData}
          />
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Settings</CardTitle>
              <CardDescription>
                Fine-tune the AI distribution algorithms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Max Players Per Session */}
              <div className="space-y-2">
                <Label>Maximum Players Per Session: {advancedSettings.maxPlayersPerSession}</Label>
                <Slider
                  value={[advancedSettings.maxPlayersPerSession]}
                  onValueChange={([value]) => 
                    setAdvancedSettings(prev => ({ ...prev, maxPlayersPerSession: value }))
                  }
                  max={20}
                  min={4}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Large groups will be automatically split
                </p>
              </div>

              {/* Minimum Fitness Variation */}
              <div className="space-y-2">
                <Label>Minimum Fitness Variation: {advancedSettings.minFitnessVariation}%</Label>
                <Slider
                  value={[advancedSettings.minFitnessVariation]}
                  onValueChange={([value]) => 
                    setAdvancedSettings(prev => ({ ...prev, minFitnessVariation: value }))
                  }
                  max={50}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Higher values create more diverse fitness groups
                </p>
              </div>

              {/* Toggle Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Prioritize Recovery</Label>
                    <p className="text-sm text-gray-500">Give higher weight to fatigue and recovery needs</p>
                  </div>
                  <Switch
                    checked={advancedSettings.prioritizeRecovery}
                    onCheckedChange={(checked) => 
                      setAdvancedSettings(prev => ({ ...prev, prioritizeRecovery: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Balance Positions</Label>
                    <p className="text-sm text-gray-500">Ensure equal position representation</p>
                  </div>
                  <Switch
                    checked={advancedSettings.balancePositions}
                    onCheckedChange={(checked) => 
                      setAdvancedSettings(prev => ({ ...prev, balancePositions: checked }))
                    }
                  />
                </div>
              </div>

              <Button onClick={generateDistribution} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Apply Settings & Regenerate
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlayerDistributionPanel;