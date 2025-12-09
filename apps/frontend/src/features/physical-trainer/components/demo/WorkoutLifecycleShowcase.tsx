/**
 * Workout Lifecycle Showcase Component
 * 
 * This component demonstrates the complete Hockey Hub workout lifecycle
 * from creation through analytics and exports.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Calendar, 
  Users, 
  TrendingUp, 
  Heart, 
  Zap, 
  Timer,
  FileText,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  BarChart3,
  Download,
  Monitor,
  Brain
} from '@/components/icons';
import { LiveSessionMonitor } from './LiveSessionMonitor';
import { AnalyticsShowcase } from './AnalyticsShowcase';

interface ShowcaseData {
  players: any[];
  workouts: any;
  activeSessions: any[];
  calendarEvents: any[];
  analytics: any;
  exports: any;
}

export const WorkoutLifecycleShowcase: React.FC = () => {
  const [showcaseData, setShowcaseData] = useState<ShowcaseData | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Simulate API call to get comprehensive demo data
  useEffect(() => {
    const fetchShowcaseData = async () => {
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll use the mock data directly
        const mockData = {
          players: [
            {
              id: 'player-001',
              name: 'Sidney Crosby',
              team: 'Pittsburgh Penguins',
              medicalStatus: 'injured',
              injury: { type: 'Lower Back Strain', severity: 'moderate' },
              fitnessProfile: { vo2Max: 58.5, ftp: 280, maxHR: 195 }
            },
            {
              id: 'player-002',
              name: 'Nathan MacKinnon',
              team: 'Colorado Avalanche',
              medicalStatus: 'limited',
              injury: { type: 'Minor Shoulder Impingement', severity: 'mild' },
              fitnessProfile: { vo2Max: 62.1, ftp: 310, maxHR: 198 }
            },
            {
              id: 'player-003',
              name: 'Connor McDavid',
              team: 'Edmonton Oilers',
              medicalStatus: 'healthy',
              fitnessProfile: { vo2Max: 65.2, ftp: 325, maxHR: 200 }
            }
          ],
          workouts: {
            strength: {
              id: 'workout-strength-001',
              name: 'Elite Hockey Power Development',
              type: 'STRENGTH',
              estimatedDuration: 90,
              phases: ['Dynamic Warm-up', 'Power Development', 'Hockey-Specific Power'],
              medicalCompliance: { restrictions: ['player-001'] }
            },
            conditioning: {
              id: 'workout-conditioning-001',
              name: 'VO2 Max Development Protocol',
              type: 'CONDITIONING',
              estimatedDuration: 60,
              equipment: 'rowing',
              targetZones: { zone5: 20 }
            },
            hybrid: {
              id: 'workout-hybrid-001',
              name: 'CrossFit Hockey Circuit',
              type: 'HYBRID',
              estimatedDuration: 75,
              blocks: ['Power Complex', 'Metabolic Blast', 'Functional Power']
            },
            agility: {
              id: 'workout-agility-001',
              name: 'Elite Speed & Reaction Training',
              type: 'AGILITY',
              estimatedDuration: 60,
              drills: ['5-10-5 Pro Agility', 'T-Drill', 'Reaction Training']
            }
          },
          activeSessions: [
            {
              id: 'session-live-001',
              name: 'VO2 Max Development Protocol',
              type: 'CONDITIONING',
              status: 'active',
              participants: [
                {
                  playerId: 'player-002',
                  name: 'Nathan MacKinnon',
                  liveMetrics: {
                    heartRate: 185,
                    targetHeartRate: 178,
                    watts: 285,
                    compliance: 92,
                    zone: 5
                  }
                },
                {
                  playerId: 'player-003',
                  name: 'Connor McDavid',
                  liveMetrics: {
                    heartRate: 188,
                    targetHeartRate: 180,
                    watts: 298,
                    compliance: 96,
                    zone: 5
                  }
                }
              ]
            }
          ],
          calendarEvents: [
            {
              id: 'cal-event-001',
              title: 'Elite Hockey Power Development',
              workoutType: 'STRENGTH',
              start: new Date(Date.now() + 2 * 60 * 60 * 1000),
              participants: ['Sidney Crosby', 'Nathan MacKinnon', 'Connor McDavid'],
              medicalAlerts: ['Sidney Crosby - modified program']
            },
            {
              id: 'cal-event-002',
              title: 'VO2 Max Development Protocol',
              workoutType: 'CONDITIONING',
              start: new Date(Date.now() + 25 * 60 * 60 * 1000),
              participants: ['Nathan MacKinnon', 'Connor McDavid']
            }
          ],
          analytics: {
            teamOverview: {
              totalWorkouts: 156,
              thisWeek: 12,
              averageIntensity: 7.8,
              complianceRate: 94.2,
              injuryRate: 3.8
            },
            workoutTypeAnalytics: {
              STRENGTH: { totalSessions: 45, averageIntensity: 8.1 },
              CONDITIONING: { totalSessions: 52, averageIntensity: 8.5 },
              HYBRID: { totalSessions: 38, averageIntensity: 8.7 },
              AGILITY: { totalSessions: 21, averageIntensity: 7.8 }
            }
          },
          exports: {
            weeklyTeamReport: {
              title: 'Weekly Team Performance Report',
              totalWorkouts: 12,
              complianceRate: 94.2
            }
          }
        };

        setShowcaseData(mockData);
        setActiveSession(mockData.activeSessions[0]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching showcase data:', error);
        setLoading(false);
      }
    };

    fetchShowcaseData();
  }, []);

  // Simulate real-time updates for active session
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      setActiveSession((prev: any) => ({
        ...prev,
        participants: prev.participants.map((p: any) => ({
          ...p,
          liveMetrics: {
            ...p.liveMetrics,
            heartRate: p.liveMetrics.heartRate + Math.floor(Math.random() * 6) - 3,
            watts: p.liveMetrics.watts + Math.floor(Math.random() * 10) - 5,
            compliance: Math.min(100, Math.max(80, p.liveMetrics.compliance + Math.floor(Math.random() * 4) - 2))
          }
        }))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [activeSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!showcaseData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load showcase data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'STRENGTH': return 'bg-blue-100 text-blue-800';
      case 'CONDITIONING': return 'bg-red-100 text-red-800';
      case 'HYBRID': return 'bg-purple-100 text-purple-800';
      case 'AGILITY': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMedicalStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'injured': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Hockey Hub Workout Lifecycle Showcase
        </h1>
        <p className="text-lg text-gray-600">
          Comprehensive demonstration of all workout features from creation through analytics
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Players</p>
                <p className="text-2xl font-bold text-gray-900">{showcaseData.players.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Workouts</p>
                <p className="text-2xl font-bold text-gray-900">{showcaseData.analytics.teamOverview.totalWorkouts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <PlayCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{showcaseData.activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Compliance</p>
                <p className="text-2xl font-bold text-gray-900">{showcaseData.analytics.teamOverview.complianceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Showcase Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="live">Live Sessions</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitor</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Player Profiles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Player Profiles & Medical Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {showcaseData.players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{player.name}</h4>
                        <p className="text-sm text-gray-600">{player.team}</p>
                        {player.injury && (
                          <p className="text-sm text-gray-500">{player.injury.type}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className={getMedicalStatusColor(player.medicalStatus)}>
                          {player.medicalStatus}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          VO2: {player.fitnessProfile.vo2Max} ml/kg/min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workout Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Workout Types Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(showcaseData.workouts).map(([key, workout]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{workout.name}</h4>
                        <p className="text-sm text-gray-600">Duration: {workout.estimatedDuration} min</p>
                        {workout.medicalCompliance?.restrictions.length > 0 && (
                          <div className="flex items-center mt-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
                            <span className="text-xs text-yellow-600">Medical restrictions</span>
                          </div>
                        )}
                      </div>
                      <Badge className={getWorkoutTypeColor(workout.type)}>
                        {workout.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workouts Tab */}
        <TabsContent value="workouts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(showcaseData.workouts).map(([key, workout]: [string, any]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{workout.name}</span>
                    <Badge className={getWorkoutTypeColor(workout.type)}>
                      {workout.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Timer className="h-4 w-4 mr-2" />
                      {workout.estimatedDuration} minutes
                    </div>
                    
                    {workout.phases && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Phases:</p>
                        <div className="space-y-1">
                          {workout.phases.map((phase: string, index: number) => (
                            <div key={index} className="text-sm text-gray-600 ml-4">
                              • {phase}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {workout.blocks && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Blocks:</p>
                        <div className="space-y-1">
                          {workout.blocks.map((block: string, index: number) => (
                            <div key={index} className="text-sm text-gray-600 ml-4">
                              • {block}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {workout.drills && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Drills:</p>
                        <div className="space-y-1">
                          {workout.drills.map((drill: string, index: number) => (
                            <div key={index} className="text-sm text-gray-600 ml-4">
                              • {drill}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {workout.equipment && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Zap className="h-4 w-4 mr-2" />
                        Equipment: {workout.equipment}
                      </div>
                    )}

                    {workout.medicalCompliance?.restrictions.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Medical restrictions apply for {workout.medicalCompliance.restrictions.length} player(s)
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button className="w-full mt-4">
                      View Full Workout Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Live Sessions Tab */}
        <TabsContent value="live" className="space-y-6">
          {showcaseData.activeSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <PlayCircle className="h-5 w-5 mr-2 text-red-600" />
                    {session.name} (LIVE)
                  </span>
                  <Badge className={getWorkoutTypeColor(session.type)}>
                    {session.type}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      Session is currently active with real-time metrics updating every 2 seconds
                    </AlertDescription>
                  </Alert>

                  {session.participants.map((participant: any) => (
                    <div key={participant.playerId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{participant.name}</h4>
                        <Badge variant="outline">Zone {participant.liveMetrics.zone}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Heart className="h-4 w-4 text-red-600 mr-1" />
                            <span className="text-sm font-medium">Heart Rate</span>
                          </div>
                          <div className="text-2xl font-bold text-red-600">
                            {participant.liveMetrics.heartRate}
                          </div>
                          <div className="text-xs text-gray-500">
                            Target: {participant.liveMetrics.targetHeartRate}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Zap className="h-4 w-4 text-yellow-600 mr-1" />
                            <span className="text-sm font-medium">Power</span>
                          </div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {participant.liveMetrics.watts}W
                          </div>
                          <div className="text-xs text-gray-500">
                            Target: {participant.liveMetrics.targetWatts || 'N/A'}W
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-sm font-medium">Compliance</span>
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {participant.liveMetrics.compliance}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Zone adherence
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                            <span className="text-sm font-medium">Zone</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {participant.liveMetrics.zone}
                          </div>
                          <div className="text-xs text-gray-500">
                            Current training zone
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Workout Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {showcaseData.calendarEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <Badge className={getWorkoutTypeColor(event.workoutType)}>
                        {event.workoutType}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {new Date(event.start).toLocaleString()}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Users className="h-4 w-4 mr-2" />
                      {event.participants.join(', ')}
                    </div>

                    {event.medicalAlerts && event.medicalAlerts.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {event.medicalAlerts[0]}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Team Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Workouts</span>
                    <span className="font-semibold">{showcaseData.analytics.teamOverview.totalWorkouts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Week</span>
                    <span className="font-semibold">{showcaseData.analytics.teamOverview.thisWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Intensity</span>
                    <span className="font-semibold">{showcaseData.analytics.teamOverview.averageIntensity}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compliance Rate</span>
                    <span className="font-semibold text-green-600">{showcaseData.analytics.teamOverview.complianceRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Injury Rate</span>
                    <span className="font-semibold text-yellow-600">{showcaseData.analytics.teamOverview.injuryRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workout Type Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(showcaseData.analytics.workoutTypeAnalytics).map(([type, data]: [string, any]) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <Badge className={getWorkoutTypeColor(type)} variant="outline">
                          {type}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {data.totalSessions} sessions
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {data.averageIntensity}/10
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg Intensity
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Monitor Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Session Monitoring</h3>
            <p className="text-gray-600">
              Experience live workout session monitoring with real-time metrics, zone compliance, and performance tracking.
            </p>
          </div>
          <LiveSessionMonitor />
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Analytics & Insights</h3>
            <p className="text-gray-600">
              Advanced analytics dashboard with predictive insights, injury risk assessment, and performance optimization.
            </p>
          </div>
          <AnalyticsShowcase />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Available Reports & Exports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {showcaseData.exports.weeklyTeamReport.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Total workouts: {showcaseData.exports.weeklyTeamReport.totalWorkouts}
                      </p>
                      <p className="text-sm text-gray-600">
                        Compliance: {showcaseData.exports.weeklyTeamReport.complianceRate}%
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Individual Progress Report</h4>
                      <p className="text-sm text-gray-600">
                        Detailed performance metrics and improvement tracking
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Medical Compliance Report</h4>
                      <p className="text-sm text-gray-600">
                        Injury management and restriction compliance tracking
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              This showcase demonstrates the complete Hockey Hub workout lifecycle with realistic NHL player data.
            </p>
            <p>
              Features include: Comprehensive workout creation • Real-time session monitoring • 
              Medical integration • Performance analytics • Automated reporting
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};