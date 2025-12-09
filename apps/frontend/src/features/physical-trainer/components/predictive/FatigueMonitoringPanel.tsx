import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, AlertTriangle, Users, TrendingUp, Heart, Zap, Clock } from 'lucide-react';
import { LightweightLineChart, LightweightAreaChart, LightweightBarChart } from '../charts';

interface TeamFatigueData {
  teamAverage: number;
  playersAtRisk: number;
  totalPlayers: number;
  trendDirection: 'improving' | 'stable' | 'worsening';
  lastUpdate: Date;
}

interface PlayerFatigueStatus {
  playerId: string;
  playerName: string;
  position: string;
  currentFatigue: number;
  fatigueCategory: 'low' | 'moderate' | 'high' | 'critical';
  velocity: number; // change per day
  projectedPeak: Date;
  readiness: number;
  alerts: string[];
}

interface FatigueMonitoringPanelProps {
  teamId?: string;
  organizationId: string;
  className?: string;
}

export function FatigueMonitoringPanel({ 
  teamId, 
  organizationId, 
  className = '' 
}: FatigueMonitoringPanelProps) {
  const [teamData, setTeamData] = useState<TeamFatigueData | null>(null);
  const [playerStatuses, setPlayerStatuses] = useState<PlayerFatigueStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('24h');

  // Mock team fatigue data
  const mockTeamData: TeamFatigueData = {
    teamAverage: 58,
    playersAtRisk: 3,
    totalPlayers: 20,
    trendDirection: 'worsening',
    lastUpdate: new Date()
  };

  // Mock player statuses
  const mockPlayerStatuses: PlayerFatigueStatus[] = [
    {
      playerId: 'player1',
      playerName: 'Sidney Crosby',
      position: 'C',
      currentFatigue: 78,
      fatigueCategory: 'high',
      velocity: 4.2,
      projectedPeak: new Date(Date.now() + 24 * 60 * 60 * 1000),
      readiness: 65,
      alerts: ['High fatigue velocity', 'Approaching critical threshold']
    },
    {
      playerId: 'player2',
      playerName: 'Connor McDavid',
      position: 'C',
      currentFatigue: 45,
      fatigueCategory: 'moderate',
      velocity: 1.8,
      projectedPeak: new Date(Date.now() + 48 * 60 * 60 * 1000),
      readiness: 78,
      alerts: []
    },
    {
      playerId: 'player3',
      playerName: 'Nathan MacKinnon',
      position: 'C',
      currentFatigue: 32,
      fatigueCategory: 'low',
      velocity: -0.5,
      projectedPeak: new Date(Date.now() + 96 * 60 * 60 * 1000),
      readiness: 88,
      alerts: []
    },
    {
      playerId: 'player4',
      playerName: 'Leon Draisaitl',
      position: 'C',
      currentFatigue: 68,
      fatigueCategory: 'high',
      velocity: 2.1,
      projectedPeak: new Date(Date.now() + 36 * 60 * 60 * 1000),
      readiness: 72,
      alerts: ['Monitor closely']
    },
    {
      playerId: 'player5',
      playerName: 'Auston Matthews',
      position: 'C',
      currentFatigue: 42,
      fatigueCategory: 'moderate',
      velocity: 0.8,
      projectedPeak: new Date(Date.now() + 72 * 60 * 60 * 1000),
      readiness: 82,
      alerts: []
    }
  ];

  // Team fatigue trend data
  const teamTrendData = [
    { time: '24h ago', teamAverage: 45, atRisk: 1, critical: 0 },
    { time: '18h ago', teamAverage: 48, atRisk: 1, critical: 0 },
    { time: '12h ago', teamAverage: 52, atRisk: 2, critical: 0 },
    { time: '6h ago', teamAverage: 56, atRisk: 2, critical: 0 },
    { time: 'Now', teamAverage: 58, atRisk: 3, critical: 1 }
  ];

  // Fatigue distribution by position
  const positionFatigueData = [
    { position: 'Center', average: 62, count: 4 },
    { position: 'Left Wing', average: 54, count: 3 },
    { position: 'Right Wing', average: 51, count: 3 },
    { position: 'Defense', average: 58, count: 6 },
    { position: 'Goalie', average: 35, count: 2 }
  ];

  useEffect(() => {
    const fetchFatigueData = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1200));
        setTeamData(mockTeamData);
        setPlayerStatuses(mockPlayerStatuses);
      } catch (err) {
        setError('Failed to load fatigue monitoring data');
        console.error('Error fetching fatigue data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFatigueData();
  }, [teamId, organizationId]);

  // Simulate real-time updates
  useEffect(() => {
    if (!realTimeMode || !teamData) return;

    const interval = setInterval(() => {
      setPlayerStatuses(prev => prev.map(player => ({
        ...player,
        currentFatigue: Math.max(0, Math.min(100, 
          player.currentFatigue + (Math.random() - 0.5) * 3
        )),
        readiness: Math.max(0, Math.min(100,
          player.readiness + (Math.random() - 0.5) * 5
        ))
      })));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [realTimeMode, teamData]);

  const getFatigueColor = (level: number) => {
    if (level >= 80) return 'text-red-600 bg-red-100';
    if (level >= 65) return 'text-orange-600 bg-orange-100';
    if (level >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getFatigueCategory = (level: number) => {
    if (level >= 80) return 'Critical';
    if (level >= 65) return 'High';
    if (level >= 50) return 'Moderate';
    return 'Low';
  };

  const getVelocityIcon = (velocity: number) => {
    if (velocity > 2) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (velocity > 0) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    if (velocity < -1) return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />;
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Team Fatigue Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !teamData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Fatigue Monitoring Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error || 'No fatigue data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const highRiskPlayers = playerStatuses.filter(p => p.fatigueCategory === 'high' || p.fatigueCategory === 'critical');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Critical Alerts */}
      {highRiskPlayers.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>FATIGUE ALERT:</strong> {highRiskPlayers.length} player(s) showing high fatigue levels requiring immediate attention:
            <div className="mt-1">
              {highRiskPlayers.map(p => p.playerName).join(', ')}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Team Average</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{teamData.teamAverage}%</span>
              {teamData.trendDirection === 'worsening' && (
                <TrendingUp className="h-4 w-4 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">At Risk</span>
            </div>
            <span className="text-2xl font-bold text-red-600">
              {teamData.playersAtRisk}/{teamData.totalPlayers}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Ready</span>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {teamData.totalPlayers - teamData.playersAtRisk}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Last Update</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">
                {teamData.lastUpdate.toLocaleTimeString()}
              </span>
              <Button
                onClick={() => setRealTimeMode(!realTimeMode)}
                variant={realTimeMode ? "default" : "outline"}
                size="sm"
              >
                {realTimeMode ? "Live" : "Static"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Fatigue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Team Fatigue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 relative">
                  <LightweightAreaChart
                    data={teamTrendData}
                    dataKey="teamAverage"
                    secondaryDataKey="atRisk"
                    showGrid={true}
                    height={256}
                    fillColor="#3b82f6"
                    strokeColor="#3b82f6"
                    secondaryStrokeColor="#ef4444"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fatigue by Position */}
            <Card>
              <CardHeader>
                <CardTitle>Fatigue by Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <LightweightBarChart
                    data={positionFatigueData}
                    dataKey="average"
                    showGrid={true}
                    height={256}
                    barColor="#3b82f6"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="players" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Player Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {playerStatuses
                  .sort((a, b) => b.currentFatigue - a.currentFatigue)
                  .map((player) => (
                    <div key={player.playerId} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{player.playerName}</h3>
                          <p className="text-sm text-gray-600">{player.position}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getVelocityIcon(player.velocity)}
                          <Badge className={getFatigueColor(player.currentFatigue)}>
                            {getFatigueCategory(player.currentFatigue)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-600">Fatigue Level</span>
                          <div className="font-bold text-lg">{Math.round(player.currentFatigue)}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                player.currentFatigue >= 80 ? 'bg-red-500' :
                                player.currentFatigue >= 65 ? 'bg-orange-500' :
                                player.currentFatigue >= 50 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${player.currentFatigue}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-gray-600">Readiness</span>
                          <div className="font-bold text-lg">{Math.round(player.readiness)}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${player.readiness}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-gray-600">Velocity</span>
                          <div className="font-bold text-lg">
                            {player.velocity > 0 ? '+' : ''}{player.velocity.toFixed(1)}%/day
                          </div>
                          <div className="text-xs text-gray-500">
                            Peak: {player.projectedPeak.toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {player.alerts.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-red-600">Alerts:</span>
                          <div className="mt-1 space-y-1">
                            {player.alerts.map((alert, index) => (
                              <Badge key={index} variant="outline" className="text-red-600 border-red-600 mr-2">
                                {alert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-600 py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Detailed trend analysis coming soon...</p>
                <p className="text-sm">This will include multi-day trends, correlations, and predictive modeling.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-600 py-8">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Advanced analytics coming soon...</p>
                <p className="text-sm">This will include workload correlations, recovery patterns, and optimization recommendations.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}