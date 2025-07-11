'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Heart, 
  Zap, 
  Activity,
  Calculator,
  AlertTriangle,
  CheckCircle,
  User,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { 
  IntervalSet, 
  PlayerTestResult,
  PersonalizedInterval,
  WorkoutEquipmentType
} from '../../types/conditioning.types';
import { calculatePersonalizedTarget, formatPace } from '../../types/conditioning.types';
import { useGetPlayersQuery } from '@/store/api/playerApi';

interface TestBasedTargetsProps {
  intervals: IntervalSet[];
  playerTests: PlayerTestResult[];
  selectedPlayers: string[];
  onUpdateIntervals: (intervals: IntervalSet[]) => void;
}

interface PlayerTestSummary {
  playerId: string;
  playerName: string;
  maxHr?: number;
  lactateThreshold?: number;
  ftp?: number;
  vo2max?: number;
  maxWatts?: number;
  lastTestDate?: Date;
  hasValidTests: boolean;
}

export default function TestBasedTargets({
  intervals,
  playerTests,
  selectedPlayers,
  onUpdateIntervals
}: TestBasedTargetsProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(selectedPlayers[0] || '');
  const [showCalculations, setShowCalculations] = useState(false);

  // Fetch player data
  const { data: playersData } = useGetPlayersQuery({
    teamId: undefined // Get all players for now
  });

  const players = Array.isArray(playersData) ? playersData : playersData?.data || [];

  // Process test data for selected players
  const playerTestSummaries = useMemo(() => {
    return selectedPlayers.map(playerId => {
      const player = players.find(p => p.id === playerId);
      const playerTestResults = playerTests.filter(test => test.playerId === playerId);
      
      const summary: PlayerTestSummary = {
        playerId,
        playerName: player ? `${player.firstName} ${player.lastName}` : `Player ${playerId}`,
        hasValidTests: playerTestResults.length > 0
      };

      // Extract latest test values
      playerTestResults.forEach(test => {
        switch (test.testType) {
          case 'max_hr':
            summary.maxHr = test.value;
            break;
          case 'lactate_threshold':
            summary.lactateThreshold = test.value;
            break;
          case 'ftp':
            summary.ftp = test.value;
            break;
          case 'vo2max':
            summary.vo2max = test.value;
            break;
          case 'max_watts':
            summary.maxWatts = test.value;
            break;
        }
        if (!summary.lastTestDate || test.testDate > summary.lastTestDate) {
          summary.lastTestDate = test.testDate;
        }
      });

      return summary;
    });
  }, [selectedPlayers, players, playerTests]);

  // Calculate personalized intervals for selected player
  const personalizedIntervals = useMemo(() => {
    if (!selectedPlayerId) return intervals;

    const playerTestResults = playerTests.filter(test => test.playerId === selectedPlayerId);
    
    return intervals.map(interval => {
      const personalized: PersonalizedInterval = {
        ...interval,
        playerId: selectedPlayerId,
        personalizedTargets: {}
      };

      // Calculate heart rate target
      if (interval.targetMetrics.heartRate) {
        const hrValue = calculatePersonalizedTarget(
          interval.targetMetrics.heartRate,
          playerTestResults
        );
        if (hrValue) {
          personalized.personalizedTargets.heartRate = Math.round(hrValue);
        }
      }

      // Calculate watts target
      if (interval.targetMetrics.watts) {
        const wattsValue = calculatePersonalizedTarget(
          interval.targetMetrics.watts,
          playerTestResults
        );
        if (wattsValue) {
          personalized.personalizedTargets.watts = Math.round(wattsValue);
        }
      }

      // Calculate pace (if applicable)
      if (interval.targetMetrics.pace && personalized.personalizedTargets.watts) {
        // Convert watts to pace (rough estimation)
        const metersPerSecond = Math.sqrt(personalized.personalizedTargets.watts / 2.8);
        personalized.personalizedTargets.pace = formatPace(metersPerSecond, '/500m');
      }

      personalized.basedOnTests = playerTestResults;

      return personalized;
    });
  }, [selectedPlayerId, intervals, playerTests]);

  const selectedPlayerSummary = playerTestSummaries.find(p => p.playerId === selectedPlayerId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('physicalTrainer:conditioning.personalization.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('physicalTrainer:conditioning.personalization.description')}
          </p>

          {selectedPlayers.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('physicalTrainer:conditioning.personalization.noPlayers')}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {selectedPlayers.length} {t('physicalTrainer:conditioning.personalization.playersSelected')}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCalculations(!showCalculations)}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {showCalculations ? 'Hide' : 'Show'} Calculations
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPlayers.length > 0 && (
        <>
          {/* Player Tabs */}
          <Tabs value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-6">
              {playerTestSummaries.slice(0, 6).map(player => (
                <TabsTrigger key={player.playerId} value={player.playerId}>
                  <div className="flex items-center gap-1">
                    {player.hasValidTests ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    )}
                    <span className="truncate max-w-[100px]">{player.playerName}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {playerTestSummaries.map(player => (
              <TabsContent key={player.playerId} value={player.playerId}>
                {/* Player Test Summary */}
                <Card className="mb-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{player.playerName}</CardTitle>
                      {player.lastTestDate && (
                        <Badge variant="outline">
                          Last tested: {new Date(player.lastTestDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {player.hasValidTests ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {player.maxHr && (
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
                            <p className="text-2xl font-bold">{player.maxHr}</p>
                            <p className="text-xs text-muted-foreground">Max HR</p>
                          </div>
                        )}
                        {player.lactateThreshold && (
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <Activity className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                            <p className="text-2xl font-bold">{player.lactateThreshold}</p>
                            <p className="text-xs text-muted-foreground">LT HR</p>
                          </div>
                        )}
                        {player.ftp && (
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                            <p className="text-2xl font-bold">{player.ftp}W</p>
                            <p className="text-xs text-muted-foreground">FTP</p>
                          </div>
                        )}
                        {player.maxWatts && (
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <Zap className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                            <p className="text-2xl font-bold">{player.maxWatts}W</p>
                            <p className="text-xs text-muted-foreground">Max Power</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          No test data available for this player. Using generic targets.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Personalized Intervals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Personalized Targets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {personalizedIntervals.map((interval, index) => (
                        <div key={interval.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <span className="font-medium">{interval.name || interval.type}</span>
                            </div>
                            <Badge variant="secondary">
                              {Math.floor(interval.duration / 60)}:{(interval.duration % 60).toString().padStart(2, '0')}
                            </Badge>
                          </div>

                          {showCalculations && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {interval.targetMetrics.heartRate && (
                                <div className="p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                    <Heart className="h-3 w-3" />
                                    <span>Heart Rate</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      {interval.personalizedTargets?.heartRate || 'N/A'} BPM
                                    </span>
                                    {interval.targetMetrics.heartRate.type === 'percentage' && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({interval.targetMetrics.heartRate.value}% of {interval.targetMetrics.heartRate.reference})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {interval.targetMetrics.watts && (
                                <div className="p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                    <Zap className="h-3 w-3" />
                                    <span>Power</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      {interval.personalizedTargets?.watts || 'N/A'} W
                                    </span>
                                    {interval.targetMetrics.watts.type === 'percentage' && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({interval.targetMetrics.watts.value}% of {interval.targetMetrics.watts.reference})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {!showCalculations && (
                            <div className="flex gap-2">
                              {interval.personalizedTargets?.heartRate && (
                                <Badge variant="outline">
                                  <Heart className="h-3 w-3 mr-1" />
                                  {interval.personalizedTargets.heartRate} BPM
                                </Badge>
                              )}
                              {interval.personalizedTargets?.watts && (
                                <Badge variant="outline">
                                  <Zap className="h-3 w-3 mr-1" />
                                  {interval.personalizedTargets.watts} W
                                </Badge>
                              )}
                              {interval.personalizedTargets?.pace && (
                                <Badge variant="outline">
                                  <Activity className="h-3 w-3 mr-1" />
                                  {interval.personalizedTargets.pace}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}