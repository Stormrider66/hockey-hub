'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Heart, 
  Zap, 
  TrendingUp, 
  Timer,
  Users,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTrainingSocket } from '@/contexts/TrainingSocketContext';
import type { WorkoutSession, WorkoutExecution } from '@hockey-hub/shared-lib';
import type { PerformanceMetrics } from '../types';

interface CardioSessionDashboardProps {
  session: WorkoutSession;
  executions: WorkoutExecution[];
  isTrainerView?: boolean;
}

interface PlayerMetrics {
  playerId: string;
  playerName: string;
  playerNumber: number;
  heartRate: number;
  maxHeartRate: number;
  avgHeartRate: number;
  currentZone: number;
  power: number;
  avgPower: number;
  maxPower: number;
  calories: number;
  duration: number;
  distance?: number;
  cadence?: number;
}

// Heart rate zones
const HR_ZONES = [
  { zone: 1, name: 'Recovery', color: 'bg-blue-500', range: '50-60%' },
  { zone: 2, name: 'Aerobic', color: 'bg-green-500', range: '60-70%' },
  { zone: 3, name: 'Threshold', color: 'bg-yellow-500', range: '70-80%' },
  { zone: 4, name: 'VO2 Max', color: 'bg-orange-500', range: '80-90%' },
  { zone: 5, name: 'Max', color: 'bg-red-500', range: '90-100%' },
];

function getHRZone(hr: number, maxHr: number): number {
  const percentage = (hr / maxHr) * 100;
  if (percentage < 60) return 1;
  if (percentage < 70) return 2;
  if (percentage < 80) return 3;
  if (percentage < 90) return 4;
  return 5;
}

export function CardioSessionDashboard({ 
  session, 
  executions,
  isTrainerView = true 
}: CardioSessionDashboardProps) {
  const { socket } = useTrainingSocket();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [playerMetrics, setPlayerMetrics] = useState<Record<string, PlayerMetrics>>({});
  const [selectedMetric, setSelectedMetric] = useState<'heartRate' | 'power'>('heartRate');
  const [showAverages, setShowAverages] = useState(false);

  // Mock data for demonstration - in production, this would come from real-time socket updates
  useEffect(() => {
    // Initialize player metrics from session data
    const initialMetrics: Record<string, PlayerMetrics> = {};
    
    session.playerIds?.forEach((playerId, index) => {
      initialMetrics[playerId] = {
        playerId,
        playerName: `Player ${index + 1}`, // In production, fetch from player data
        playerNumber: Math.floor(Math.random() * 99) + 1,
        heartRate: 120 + Math.floor(Math.random() * 40),
        maxHeartRate: 180 + Math.floor(Math.random() * 20),
        avgHeartRate: 140 + Math.floor(Math.random() * 20),
        currentZone: 2,
        power: 150 + Math.floor(Math.random() * 100),
        avgPower: 200 + Math.floor(Math.random() * 50),
        maxPower: 300 + Math.floor(Math.random() * 100),
        calories: Math.floor(Math.random() * 300),
        duration: 0,
        distance: Math.floor(Math.random() * 10),
        cadence: 70 + Math.floor(Math.random() * 30),
      };
      
      initialMetrics[playerId].currentZone = getHRZone(
        initialMetrics[playerId].heartRate, 
        initialMetrics[playerId].maxHeartRate
      );
    });
    
    setPlayerMetrics(initialMetrics);
  }, [session]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      setPlayerMetrics(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(playerId => {
          const metrics = updated[playerId];
          // Simulate HR fluctuation
          metrics.heartRate = Math.max(80, Math.min(200, 
            metrics.heartRate + (Math.random() - 0.5) * 10
          ));
          // Update zone
          metrics.currentZone = getHRZone(metrics.heartRate, metrics.maxHeartRate);
          // Simulate power fluctuation
          metrics.power = Math.max(50, Math.min(400, 
            metrics.power + (Math.random() - 0.5) * 20
          ));
          // Update averages
          metrics.avgHeartRate = Math.round((metrics.avgHeartRate * 0.95) + (metrics.heartRate * 0.05));
          metrics.avgPower = Math.round((metrics.avgPower * 0.95) + (metrics.power * 0.05));
          // Update calories
          metrics.calories += Math.round(metrics.power / 60);
          // Update distance
          if (metrics.distance !== undefined) {
            metrics.distance += 0.05;
          }
        });
        return updated;
      });
      
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Listen for socket updates
  useEffect(() => {
    if (!socket) return;

    const handleMetricsUpdate = (data: {
      playerId: string;
      metrics: Partial<PlayerMetrics>;
    }) => {
      setPlayerMetrics(prev => ({
        ...prev,
        [data.playerId]: {
          ...prev[data.playerId],
          ...data.metrics,
          currentZone: getHRZone(data.metrics.heartRate, prev[data.playerId].maxHeartRate),
        }
      }));
    };

    socket.on('metrics:updated', handleMetricsUpdate);
    return () => {
      socket.off('metrics:updated', handleMetricsUpdate);
    };
  }, [socket]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSession = () => {
    setIsSessionActive(!isSessionActive);
    if (!isSessionActive) {
      // Emit session start event
      socket?.emit('session:start', { sessionId: session.id });
    } else {
      // Emit session pause event
      socket?.emit('session:pause', { sessionId: session.id });
    }
  };

  const resetSession = () => {
    setIsSessionActive(false);
    setElapsedTime(0);
    // Reset metrics
    setPlayerMetrics(prev => {
      const reset = { ...prev };
      Object.keys(reset).forEach(playerId => {
        reset[playerId].calories = 0;
        reset[playerId].duration = 0;
        reset[playerId].distance = 0;
      });
      return reset;
    });
  };

  const sortedPlayers = Object.values(playerMetrics).sort((a, b) => {
    if (selectedMetric === 'heartRate') {
      return b.heartRate - a.heartRate;
    }
    return b.power - a.power;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{session.title}</h2>
          <p className="text-muted-foreground">Cardio Training Session</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={toggleSession}
              size="lg"
              variant={isSessionActive ? "destructive" : "default"}
            >
              {isSessionActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            
            <Button
              onClick={resetSession}
              size="lg"
              variant="outline"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Zone Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Zone Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {HR_ZONES.map(zone => {
              const playersInZone = Object.values(playerMetrics).filter(
                p => p.currentZone === zone.zone
              ).length;
              return (
                <div key={zone.zone} className="text-center">
                  <div className={cn(
                    "h-20 rounded-lg flex items-center justify-center text-white font-bold text-2xl",
                    zone.color
                  )}>
                    {playersInZone}
                  </div>
                  <p className="text-sm font-medium mt-1">Zone {zone.zone}</p>
                  <p className="text-xs text-muted-foreground">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">{zone.range}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Controls */}
      <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as 'heartRate' | 'power')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="heartRate" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Heart Rate
          </TabsTrigger>
          <TabsTrigger value="power" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Power (Watts)
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 flex items-center gap-4">
          <Button
            variant={showAverages ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAverages(!showAverages)}
          >
            Show Averages
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {Object.keys(playerMetrics).length} Players Active
          </div>
        </div>
      </Tabs>

      {/* Player Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedPlayers.map(player => {
          const currentValue = selectedMetric === 'heartRate' ? player.heartRate : player.power;
          const avgValue = selectedMetric === 'heartRate' ? player.avgHeartRate : player.avgPower;
          const maxValue = selectedMetric === 'heartRate' ? player.maxHeartRate : player.maxPower;
          const percentage = selectedMetric === 'heartRate' 
            ? (player.heartRate / player.maxHeartRate) * 100
            : (player.power / 400) * 100; // Assuming 400W as max for display

          return (
            <Card key={player.playerId} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{player.playerNumber}</Badge>
                    <span className="font-medium text-sm">{player.playerName}</span>
                  </div>
                  {selectedMetric === 'heartRate' && (
                    <Badge 
                      className={cn(
                        "text-white",
                        HR_ZONES[player.currentZone - 1].color
                      )}
                    >
                      Z{player.currentZone}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Current Value */}
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {showAverages ? avgValue : currentValue}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMetric === 'heartRate' ? 'BPM' : 'Watts'}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={percentage} className="h-2" />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Avg</p>
                      <p className="font-medium">{avgValue}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max</p>
                      <p className="font-medium">{maxValue}</p>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Calories</span>
                      <span className="font-medium">{player.calories}</span>
                    </div>
                    {player.distance !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Distance</span>
                        <span className="font-medium">{player.distance.toFixed(1)} km</span>
                      </div>
                    )}
                    {player.cadence !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Cadence</span>
                        <span className="font-medium">{player.cadence} rpm</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team Averages */}
      {Object.keys(playerMetrics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Team Averages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.round(
                    Object.values(playerMetrics).reduce((sum, p) => sum + p.avgHeartRate, 0) / 
                    Object.keys(playerMetrics).length
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Avg HR (BPM)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.round(
                    Object.values(playerMetrics).reduce((sum, p) => sum + p.avgPower, 0) / 
                    Object.keys(playerMetrics).length
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Avg Power (W)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Object.values(playerMetrics).reduce((sum, p) => sum + p.calories, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Calories</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Object.values(playerMetrics).filter(p => p.currentZone >= 3).length}
                </p>
                <p className="text-sm text-muted-foreground">In High Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}