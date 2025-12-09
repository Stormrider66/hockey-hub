/**
 * Live Session Monitor Component
 * 
 * Demonstrates real-time workout session monitoring with live metrics,
 * zone compliance, and performance tracking.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Zap, 
  Activity, 
  Timer, 
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Users,
  PlayCircle,
  PauseCircle,
  BarChart3
} from '@/components/icons';

interface LiveMetrics {
  heartRate: number;
  targetHeartRate: number;
  watts?: number;
  targetWatts?: number;
  pace?: string;
  targetPace?: string;
  rpm?: number;
  compliance: number;
  zone: number;
  targetZone: number;
  effortLevel: number;
}

interface ParticipantData {
  playerId: string;
  name: string;
  status: 'active' | 'resting' | 'paused';
  currentInterval: string;
  timeInInterval: number;
  liveMetrics: LiveMetrics;
  intervalProgress: {
    completed: number;
    current: number;
    total: number;
    timeRemaining: number;
  };
  recentTrend: 'up' | 'down' | 'stable';
  alerts?: string[];
}

interface LiveSessionData {
  id: string;
  name: string;
  type: 'CONDITIONING' | 'STRENGTH' | 'HYBRID' | 'AGILITY';
  status: 'active' | 'paused' | 'completed';
  startTime: Date;
  estimatedEndTime: Date;
  currentPhase: string;
  participants: ParticipantData[];
  sessionMetrics: {
    averageCompliance: number;
    currentZoneDistribution: Record<string, number>;
    alerts: Array<{ playerId: string; type: string; message: string; severity: string }>;
  };
}

export const LiveSessionMonitor: React.FC = () => {
  const [sessionData, setSessionData] = useState<LiveSessionData>({
    id: 'session-live-demo',
    name: 'VO2 Max Development Protocol',
    type: 'CONDITIONING',
    status: 'active',
    startTime: new Date(Date.now() - 25 * 60 * 1000), // Started 25 minutes ago
    estimatedEndTime: new Date(Date.now() + 35 * 60 * 1000), // 35 minutes remaining
    currentPhase: 'work-3',
    participants: [
      {
        playerId: 'player-002',
        name: 'Nathan MacKinnon',
        status: 'active',
        currentInterval: 'work-3',
        timeInInterval: 180, // 3 minutes into 4-minute interval
        liveMetrics: {
          heartRate: 185,
          targetHeartRate: 178,
          watts: 285,
          targetWatts: 295,
          pace: '1:52',
          targetPace: '1:50',
          rpm: 28,
          compliance: 92,
          zone: 5,
          targetZone: 5,
          effortLevel: 8.5
        },
        intervalProgress: {
          completed: 2,
          current: 3,
          total: 4,
          timeRemaining: 60
        },
        recentTrend: 'stable'
      },
      {
        playerId: 'player-003',
        name: 'Connor McDavid',
        status: 'active',
        currentInterval: 'work-3',
        timeInInterval: 180,
        liveMetrics: {
          heartRate: 188,
          targetHeartRate: 180,
          watts: 298,
          targetWatts: 292,
          pace: '1:49',
          targetPace: '1:48',
          rpm: 30,
          compliance: 96,
          zone: 5,
          targetZone: 5,
          effortLevel: 8.8
        },
        intervalProgress: {
          completed: 2,
          current: 3,
          total: 4,
          timeRemaining: 60
        },
        recentTrend: 'up'
      },
      {
        playerId: 'player-004',
        name: 'Auston Matthews',
        status: 'active',
        currentInterval: 'work-3',
        timeInInterval: 180,
        liveMetrics: {
          heartRate: 172,
          targetHeartRate: 173,
          watts: 265,
          targetWatts: 265,
          pace: '1:55',
          targetPace: '1:53',
          rpm: 26,
          compliance: 87,
          zone: 4,
          targetZone: 5,
          effortLevel: 7.8
        },
        intervalProgress: {
          completed: 2,
          current: 3,
          total: 4,
          timeRemaining: 60
        },
        recentTrend: 'down',
        alerts: ['Below target zone - increase intensity']
      }
    ],
    sessionMetrics: {
      averageCompliance: 92,
      currentZoneDistribution: {
        zone1: 5,
        zone2: 10,
        zone3: 15,
        zone4: 25,
        zone5: 45
      },
      alerts: [
        {
          playerId: 'player-004',
          type: 'performance',
          message: 'Heart rate below target zone',
          severity: 'medium'
        }
      ]
    }
  });

  const [isSimulating, setIsSimulating] = useState(true);

  // Simulate real-time data updates
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSessionData(prev => ({
        ...prev,
        participants: prev.participants.map(participant => {
          // Generate realistic variations
          const hrVariation = Math.floor(Math.random() * 8) - 4; // ±4 bpm
          const wattsVariation = Math.floor(Math.random() * 20) - 10; // ±10 watts
          const complianceVariation = Math.floor(Math.random() * 6) - 3; // ±3%

          const newHeartRate = Math.max(120, Math.min(200, participant.liveMetrics.heartRate + hrVariation));
          const newWatts = participant.liveMetrics.watts ? 
            Math.max(100, Math.min(400, participant.liveMetrics.watts + wattsVariation)) : undefined;
          const newCompliance = Math.max(75, Math.min(100, participant.liveMetrics.compliance + complianceVariation));

          // Determine trend
          let recentTrend: 'up' | 'down' | 'stable' = 'stable';
          if (hrVariation > 2) recentTrend = 'up';
          else if (hrVariation < -2) recentTrend = 'down';

          // Update zone based on heart rate
          const hrPercentage = (newHeartRate / participant.liveMetrics.targetHeartRate) * 100;
          let currentZone = 5;
          if (hrPercentage < 85) currentZone = 4;
          if (hrPercentage < 75) currentZone = 3;
          if (hrPercentage < 65) currentZone = 2;
          if (hrPercentage < 55) currentZone = 1;

          // Generate alerts
          const alerts: string[] = [];
          if (currentZone < participant.liveMetrics.targetZone) {
            alerts.push('Below target zone - increase intensity');
          }
          if (newHeartRate > participant.liveMetrics.targetHeartRate * 1.1) {
            alerts.push('Heart rate above safe threshold');
          }

          return {
            ...participant,
            timeInInterval: participant.timeInInterval + 2, // Progress time
            liveMetrics: {
              ...participant.liveMetrics,
              heartRate: newHeartRate,
              watts: newWatts,
              compliance: newCompliance,
              zone: currentZone,
              pace: newWatts ? `${Math.floor(500 / (newWatts / 2.8) / 60)}:${String(Math.floor((500 / (newWatts / 2.8)) % 60)).padStart(2, '0')}` : participant.liveMetrics.pace
            },
            intervalProgress: {
              ...participant.intervalProgress,
              timeRemaining: Math.max(0, participant.intervalProgress.timeRemaining - 2)
            },
            recentTrend,
            alerts: alerts.length > 0 ? alerts : undefined
          };
        }),
        sessionMetrics: {
          ...prev.sessionMetrics,
          averageCompliance: Math.round(
            prev.participants.reduce((sum, p) => sum + p.liveMetrics.compliance, 0) / prev.participants.length
          )
        }
      }));
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  const getZoneColor = (zone: number) => {
    switch (zone) {
      case 1: return 'text-gray-600 bg-gray-100';
      case 2: return 'text-blue-600 bg-blue-100';
      case 3: return 'text-green-600 bg-green-100';
      case 4: return 'text-yellow-600 bg-yellow-100';
      case 5: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 90) return 'text-green-600';
    if (compliance >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const sessionDuration = Math.floor((Date.now() - sessionData.startTime.getTime()) / 1000);
  const totalDuration = Math.floor((sessionData.estimatedEndTime.getTime() - sessionData.startTime.getTime()) / 1000);
  const progressPercentage = (sessionDuration / totalDuration) * 100;

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <PlayCircle className="h-6 w-6 text-red-600 mr-2" />
              <span>{sessionData.name} (LIVE)</span>
              <Badge variant="outline" className="ml-2 text-red-600 border-red-600">
                {sessionData.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <Timer className="h-4 w-4 inline mr-1" />
                {formatTime(sessionDuration)} / {formatTime(totalDuration)}
              </div>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                {isSimulating ? <PauseCircle className="h-4 w-4 mr-1" /> : <PlayCircle className="h-4 w-4 mr-1" />}
                {isSimulating ? 'Pause' : 'Resume'} Simulation
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Session Progress */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Session Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Current Phase */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Current Phase: </span>
                <Badge variant="outline">{sessionData.currentPhase}</Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Average Compliance</div>
                <div className={`text-2xl font-bold ${getComplianceColor(sessionData.sessionMetrics.averageCompliance)}`}>
                  {sessionData.sessionMetrics.averageCompliance}%
                </div>
              </div>
            </div>

            {/* Active Alerts */}
            {sessionData.sessionMetrics.alerts.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {sessionData.sessionMetrics.alerts.length} active alert(s) - Monitor players closely
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participant Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sessionData.participants.map((participant) => (
          <Card key={participant.playerId} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg font-bold">{participant.name}</span>
                  {getTrendIcon(participant.recentTrend)}
                </div>
                <Badge className={getZoneColor(participant.liveMetrics.zone)}>
                  Zone {participant.liveMetrics.zone}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Interval Progress */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Interval {participant.intervalProgress.current} of {participant.intervalProgress.total}</span>
                  <span>{formatTime(participant.intervalProgress.timeRemaining)} remaining</span>
                </div>
                <Progress 
                  value={((240 - participant.intervalProgress.timeRemaining) / 240) * 100} 
                  className="h-2" 
                />
              </div>

              {/* Live Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Heart Rate */}
                <div className="text-center p-3 border rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Heart className="h-4 w-4 text-red-600 mr-1" />
                    <span className="text-xs font-medium">Heart Rate</span>
                  </div>
                  <div className="text-xl font-bold text-red-600">
                    {participant.liveMetrics.heartRate}
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: {participant.liveMetrics.targetHeartRate}
                  </div>
                  <div className="text-xs mt-1">
                    <Progress 
                      value={(participant.liveMetrics.heartRate / participant.liveMetrics.targetHeartRate) * 100} 
                      className="h-1" 
                    />
                  </div>
                </div>

                {/* Power */}
                {participant.liveMetrics.watts && (
                  <div className="text-center p-3 border rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Zap className="h-4 w-4 text-yellow-600 mr-1" />
                      <span className="text-xs font-medium">Power</span>
                    </div>
                    <div className="text-xl font-bold text-yellow-600">
                      {participant.liveMetrics.watts}W
                    </div>
                    <div className="text-xs text-gray-500">
                      Target: {participant.liveMetrics.targetWatts}W
                    </div>
                    <div className="text-xs mt-1">
                      <Progress 
                        value={(participant.liveMetrics.watts / (participant.liveMetrics.targetWatts || 300)) * 100} 
                        className="h-1" 
                      />
                    </div>
                  </div>
                )}

                {/* Pace */}
                {participant.liveMetrics.pace && (
                  <div className="text-center p-3 border rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Timer className="h-4 w-4 text-blue-600 mr-1" />
                      <span className="text-xs font-medium">Pace</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {participant.liveMetrics.pace}
                    </div>
                    <div className="text-xs text-gray-500">
                      Target: {participant.liveMetrics.targetPace}
                    </div>
                  </div>
                )}

                {/* Compliance */}
                <div className="text-center p-3 border rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs font-medium">Compliance</span>
                  </div>
                  <div className={`text-xl font-bold ${getComplianceColor(participant.liveMetrics.compliance)}`}>
                    {participant.liveMetrics.compliance}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Zone adherence
                  </div>
                  <div className="text-xs mt-1">
                    <Progress value={participant.liveMetrics.compliance} className="h-1" />
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {participant.alerts && participant.alerts.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {participant.alerts[0]}
                  </AlertDescription>
                </Alert>
              )}

              {/* RPM (if available) */}
              {participant.liveMetrics.rpm && (
                <div className="text-center text-sm text-gray-600">
                  <Activity className="h-4 w-4 inline mr-1" />
                  {participant.liveMetrics.rpm} RPM
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Zone Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Session Zone Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(sessionData.sessionMetrics.currentZoneDistribution).map(([zone, percentage]) => (
              <div key={zone} className="flex items-center">
                <div className="w-16 text-sm font-medium text-gray-700">
                  {zone.replace('zone', 'Zone ')}
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

      {/* Session Info */}
      <div className="text-center text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
        <Activity className="h-5 w-5 inline mr-2" />
        Live session data updates every 2 seconds • 
        <Users className="h-4 w-4 inline mx-2" />
        {sessionData.participants.length} participants actively monitored
      </div>
    </div>
  );
};