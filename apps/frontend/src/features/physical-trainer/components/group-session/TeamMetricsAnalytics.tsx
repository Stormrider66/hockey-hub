'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  TrendingDown,
  Heart,
  Zap,
  Activity,
  Target,
  Users,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Gauge,
  Award,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { RealTimePlayerMetrics, TeamAggregateMetrics } from '../../hooks/useGroupSessionBroadcast';

interface TeamMetricsAnalyticsProps {
  teamMetrics: TeamAggregateMetrics;
  playerMetrics: RealTimePlayerMetrics[];
  workoutType: 'conditioning' | 'strength' | 'hybrid' | 'agility';
  sessionDuration: number; // in seconds
}

interface PerformanceDistribution {
  excellent: number; // 90-100%
  good: number;      // 75-89%
  fair: number;      // 60-74%
  poor: number;      // < 60%
}

interface ZoneDistribution {
  zone1: number;
  zone2: number;
  zone3: number;
  zone4: number;
  zone5: number;
}

export default function TeamMetricsAnalytics({
  teamMetrics,
  playerMetrics,
  workoutType,
  sessionDuration
}: TeamMetricsAnalyticsProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'5m' | '15m' | '30m' | 'session'>('15m');
  
  // Calculate performance distribution
  const performanceDistribution = useMemo((): PerformanceDistribution => {
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    
    playerMetrics.forEach(player => {
      const compliance = player.zoneCompliance || 0;
      if (compliance >= 90) distribution.excellent++;
      else if (compliance >= 75) distribution.good++;
      else if (compliance >= 60) distribution.fair++;
      else distribution.poor++;
    });
    
    return distribution;
  }, [playerMetrics]);
  
  // Calculate heart rate zone distribution (mock data for visualization)
  const hrZoneDistribution = useMemo((): ZoneDistribution => {
    // In a real implementation, this would be calculated from historical data
    return {
      zone1: Math.round(playerMetrics.length * 0.1),
      zone2: Math.round(playerMetrics.length * 0.15),
      zone3: Math.round(playerMetrics.length * 0.35),
      zone4: Math.round(playerMetrics.length * 0.25),
      zone5: Math.round(playerMetrics.length * 0.15)
    };
  }, [playerMetrics.length]);
  
  // Calculate workout-specific metrics
  const workoutSpecificMetrics = useMemo(() => {
    switch (workoutType) {
      case 'conditioning':
        return {
          primaryMetric: 'Average Heart Rate',
          primaryValue: `${teamMetrics.averageHeartRate} BPM`,
          primaryIcon: Heart,
          primaryColor: 'text-red-500',
          secondaryMetric: 'Average Power',
          secondaryValue: teamMetrics.averageWatts ? `${Math.round(teamMetrics.averageWatts)} W` : 'N/A',
          secondaryIcon: Zap,
          secondaryColor: 'text-yellow-500',
          focusArea: 'Cardiovascular Endurance'
        };
      case 'strength':
        return {
          primaryMetric: 'Average Load',
          primaryValue: 'Mixed Weights',
          primaryIcon: Activity,
          primaryColor: 'text-blue-500',
          secondaryMetric: 'Volume Completed',
          secondaryValue: `${Math.round(teamMetrics.sessionProgress)}%`,
          secondaryIcon: Target,
          secondaryColor: 'text-green-500',
          focusArea: 'Muscular Strength'
        };
      case 'hybrid':
        return {
          primaryMetric: 'Combined Score',
          primaryValue: `${Math.round(teamMetrics.averageZoneCompliance)}%`,
          primaryIcon: Target,
          primaryColor: 'text-purple-500',
          secondaryMetric: 'Heart Rate',
          secondaryValue: `${teamMetrics.averageHeartRate} BPM`,
          secondaryIcon: Heart,
          secondaryColor: 'text-red-500',
          focusArea: 'Mixed Training'
        };
      case 'agility':
        return {
          primaryMetric: 'Average Speed',
          primaryValue: 'Variable',
          primaryIcon: Activity,
          primaryColor: 'text-orange-500',
          secondaryMetric: 'Completion Rate',
          secondaryValue: `${Math.round(teamMetrics.sessionProgress)}%`,
          secondaryIcon: CheckCircle,
          secondaryColor: 'text-green-500',
          focusArea: 'Speed & Agility'
        };
      default:
        return {
          primaryMetric: 'Heart Rate',
          primaryValue: `${teamMetrics.averageHeartRate} BPM`,
          primaryIcon: Heart,
          primaryColor: 'text-red-500',
          secondaryMetric: 'Progress',
          secondaryValue: `${Math.round(teamMetrics.sessionProgress)}%`,
          secondaryIcon: Target,
          secondaryColor: 'text-green-500',
          focusArea: 'General Fitness'
        };
    }
  }, [workoutType, teamMetrics]);
  
  // Calculate trends (mock data - in real implementation would compare with historical)
  const trends = useMemo(() => {
    const baseHR = teamMetrics.averageHeartRate;
    const basePower = teamMetrics.averageWatts || 0;
    const baseCompliance = teamMetrics.averageZoneCompliance;
    
    return {
      heartRate: {
        value: Math.round((Math.random() - 0.5) * 10), // Mock trend
        isPositive: Math.random() > 0.5
      },
      power: {
        value: Math.round((Math.random() - 0.5) * 20),
        isPositive: Math.random() > 0.5
      },
      compliance: {
        value: Math.round((Math.random() - 0.5) * 5),
        isPositive: Math.random() > 0.5
      }
    };
  }, [teamMetrics]);
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get performance color
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Players</p>
                <p className="text-2xl font-bold">
                  {teamMetrics.connectedPlayers}/{teamMetrics.totalPlayers}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{workoutSpecificMetrics.primaryMetric}</p>
                <p className="text-2xl font-bold">{workoutSpecificMetrics.primaryValue}</p>
                {trends.heartRate.value !== 0 && (
                  <div className={cn(
                    "flex items-center text-xs",
                    trends.heartRate.isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {trends.heartRate.isPositive ? 
                      <TrendingUp className="h-3 w-3 mr-1" /> : 
                      <TrendingDown className="h-3 w-3 mr-1" />
                    }
                    {Math.abs(trends.heartRate.value)}
                  </div>
                )}
              </div>
              <workoutSpecificMetrics.primaryIcon className={cn("h-8 w-8", workoutSpecificMetrics.primaryColor)} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Zone Compliance</p>
                <p className="text-2xl font-bold">{Math.round(teamMetrics.averageZoneCompliance)}%</p>
                {trends.compliance.value !== 0 && (
                  <div className={cn(
                    "flex items-center text-xs",
                    trends.compliance.isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {trends.compliance.isPositive ? 
                      <TrendingUp className="h-3 w-3 mr-1" /> : 
                      <TrendingDown className="h-3 w-3 mr-1" />
                    }
                    {Math.abs(trends.compliance.value)}%
                  </div>
                )}
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Session Progress</p>
                <p className="text-2xl font-bold">{Math.round(teamMetrics.sessionProgress)}%</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(teamMetrics.estimatedTimeRemaining)} remaining
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Excellent (90-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{performanceDistribution.excellent}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round((performanceDistribution.excellent / teamMetrics.totalPlayers) * 100)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm">Good (75-89%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{performanceDistribution.good}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round((performanceDistribution.good / teamMetrics.totalPlayers) * 100)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-sm">Fair (60-74%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{performanceDistribution.fair}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round((performanceDistribution.fair / teamMetrics.totalPlayers) * 100)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm">Needs Attention (&lt;60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{performanceDistribution.poor}</span>
                  <Badge variant="destructive" className="text-xs">
                    {Math.round((performanceDistribution.poor / teamMetrics.totalPlayers) * 100)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Team Effort Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Average Team Effort</span>
                  <span className="font-medium">{Math.round(teamMetrics.averageEffort)}/10</span>
                </div>
                <Progress value={teamMetrics.averageEffort * 10} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Players in Target Zone</span>
                  <span className="font-medium">
                    {teamMetrics.playersInTargetZone}/{teamMetrics.totalPlayers}
                  </span>
                </div>
                <Progress 
                  value={(teamMetrics.playersInTargetZone / teamMetrics.totalPlayers) * 100} 
                  className="h-2" 
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Session Completion</span>
                  <span className="font-medium">{Math.round(teamMetrics.sessionProgress)}%</span>
                </div>
                <Progress value={teamMetrics.sessionProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="zones">Zone Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Workout Focus: {workoutSpecificMetrics.focusArea}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <workoutSpecificMetrics.primaryIcon className={cn("h-5 w-5", workoutSpecificMetrics.primaryColor)} />
                      <span>{workoutSpecificMetrics.primaryMetric}</span>
                    </div>
                    <span className="font-bold">{workoutSpecificMetrics.primaryValue}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <workoutSpecificMetrics.secondaryIcon className={cn("h-5 w-5", workoutSpecificMetrics.secondaryColor)} />
                      <span>{workoutSpecificMetrics.secondaryMetric}</span>
                    </div>
                    <span className="font-bold">{workoutSpecificMetrics.secondaryValue}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span>Total Calories</span>
                    </div>
                    <span className="font-bold">{teamMetrics.totalCalories}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Session Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Session performance timeline</p>
                    <p className="text-sm">Real-time metrics over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Zone Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(hrZoneDistribution).map(([zone, count], index) => (
                  <div key={zone} className="flex items-center justify-between">
                    <span className="text-sm">Zone {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-red-500"
                          style={{ width: `${(count / teamMetrics.totalPlayers) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Performance trends chart</p>
                  <p className="text-sm">Historical comparison and projections</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Active Alerts ({teamMetrics.playersNeedingAttention})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamMetrics.playersNeedingAttention > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Players below target compliance</span>
                    </div>
                    <Badge variant="outline" className="text-yellow-700">
                      {teamMetrics.playersNeedingAttention} players
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Connection issues detected</span>
                    </div>
                    <Badge variant="outline" className="text-red-700">
                      {teamMetrics.totalPlayers - teamMetrics.connectedPlayers} players
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No active alerts</p>
                    <p className="text-sm">All players performing within parameters</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}