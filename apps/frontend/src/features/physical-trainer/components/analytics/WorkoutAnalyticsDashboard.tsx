import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExportManager } from './ExportManager';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Heart, 
  BarChart3,
  Target,
  Award,
  AlertTriangle,
  Download,
  FileText,
  Settings
} from '@/components/icons';

interface WorkoutSessionSummary {
  sessionId: string;
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  participantCount: number;
  completionRate: number;
  averageAdherence: number;
  duration: number;
  teamMetrics: {
    averageHeartRate: number;
    maxHeartRate: number;
    totalCalories: number;
    averageIntensity: number;
  };
  insights: {
    topPerformers: string[];
    strugglingPlayers: string[];
    teamStrengths: string[];
    areasForImprovement: string[];
  };
}

interface PlayerProgressProfile {
  playerId: string;
  playerName: string;
  overallProgress: {
    currentLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
    progressScore: number;
    improvementRate: number;
    consistencyScore: number;
    totalWorkouts: number;
  };
  milestones: Array<{
    title: string;
    description: string;
    achievedDate: string;
    category: string;
    significance: 'minor' | 'major' | 'breakthrough';
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedBenefit: string;
  }>;
}

interface TeamPerformanceReport {
  teamId: string;
  teamName: string;
  overallMetrics: {
    totalSessions: number;
    totalParticipants: number;
    averageCompletionRate: number;
    averageAdherenceScore: number;
    totalTrainingHours: number;
  };
  playerRankings: Array<{
    playerId: string;
    playerName: string;
    rank: number;
    overallScore: number;
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  }>;
  teamStrengths: string[];
  improvementAreas: string[];
  recommendations: string[];
}

export const WorkoutAnalyticsDashboard: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<string>('team-1');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [sessionSummary, setSessionSummary] = useState<WorkoutSessionSummary | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProgressProfile | null>(null);
  const [teamReport, setTeamReport] = useState<TeamPerformanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [currentExportFilters, setCurrentExportFilters] = useState<any>({});

  const mockSessionSummary: WorkoutSessionSummary = {
    sessionId: 'session-123',
    workoutType: 'conditioning',
    participantCount: 18,
    completionRate: 87.5,
    averageAdherence: 82.3,
    duration: 45,
    teamMetrics: {
      averageHeartRate: 145,
      maxHeartRate: 178,
      totalCalories: 8640,
      averageIntensity: 78.2,
    },
    insights: {
      topPerformers: ['Sidney Crosby', 'Connor McDavid', 'Nathan MacKinnon'],
      strugglingPlayers: ['Player A', 'Player B'],
      teamStrengths: ['High training intensity maintained', 'Excellent team completion rates'],
      areasForImprovement: ['Some players struggling with adherence', 'Monitor for overexertion'],
    },
  };

  const mockPlayerProfile: PlayerProgressProfile = {
    playerId: 'player-123',
    playerName: 'Sidney Crosby',
    overallProgress: {
      currentLevel: 'Elite',
      progressScore: 92,
      improvementRate: 8.5,
      consistencyScore: 89,
      totalWorkouts: 156,
    },
    milestones: [
      {
        title: '100 Workouts Complete',
        description: 'Reached 100 total workouts - showing excellent dedication',
        achievedDate: '2025-01-15',
        category: 'consistency',
        significance: 'major',
      },
      {
        title: 'Major Performance Improvement',
        description: 'Improved performance by 15% over tracking period',
        achievedDate: '2025-01-10',
        category: 'improvement',
        significance: 'breakthrough',
      },
    ],
    recommendations: [
      {
        priority: 'high',
        title: 'Focus on Strength Training',
        description: 'Cardio performance is excellent, but strength metrics could be improved',
        expectedBenefit: 'More balanced overall fitness development',
      },
      {
        priority: 'medium',
        title: 'Vary Workout Intensity',
        description: 'Consider adding more high-intensity interval sessions',
        expectedBenefit: 'Break through performance plateau',
      },
    ],
  };

  const mockTeamReport: TeamPerformanceReport = {
    teamId: 'team-1',
    teamName: 'Pittsburgh Penguins',
    overallMetrics: {
      totalSessions: 84,
      totalParticipants: 22,
      averageCompletionRate: 85.7,
      averageAdherenceScore: 81.2,
      totalTrainingHours: 126.5,
    },
    playerRankings: [
      { playerId: 'p1', playerName: 'Sidney Crosby', rank: 1, overallScore: 92, performanceGrade: 'A' },
      { playerId: 'p2', playerName: 'Evgeni Malkin', rank: 2, overallScore: 88, performanceGrade: 'A' },
      { playerId: 'p3', playerName: 'Kris Letang', rank: 3, overallScore: 85, performanceGrade: 'B' },
      { playerId: 'p4', playerName: 'Jake Guentzel', rank: 4, overallScore: 82, performanceGrade: 'B' },
      { playerId: 'p5', playerName: 'Bryan Rust', rank: 5, overallScore: 78, performanceGrade: 'C' },
    ],
    teamStrengths: [
      'Excellent leadership from veteran players',
      'High participation rates in training',
      'Strong adherence to conditioning protocols',
    ],
    improvementAreas: [
      'Some younger players need additional support',
      'Strength training consistency could be improved',
      'Recovery protocols need better adherence',
    ],
    recommendations: [
      'Implement mentorship program for struggling players',
      'Consider increasing strength training frequency',
      'Add recovery monitoring and education sessions',
    ],
  };

  useEffect(() => {
    if (selectedSession) {
      setSessionSummary(mockSessionSummary);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedPlayer) {
      setPlayerProfile(mockPlayerProfile);
    }
  }, [selectedPlayer]);

  useEffect(() => {
    if (selectedTeam) {
      setTeamReport(mockTeamReport);
    }
  }, [selectedTeam]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Elite': return 'bg-purple-100 text-purple-800';
      case 'Advanced': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Beginner': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportSession = () => {
    setCurrentExportFilters({
      sessionId: selectedSession,
      type: 'workout-summary',
      includeCharts: true
    });
    setExportModalOpen(true);
  };

  const handleExportPlayer = () => {
    setCurrentExportFilters({
      playerId: selectedPlayer,
      teamId: selectedTeam,
      type: 'player-progress',
      includeMedicalData: true
    });
    setExportModalOpen(true);
  };

  const handleExportTeam = () => {
    setCurrentExportFilters({
      teamId: selectedTeam,
      type: 'team-performance',
      includePlayerBreakdown: true,
      includeCharts: true
    });
    setExportModalOpen(true);
  };

  const availableTeams = [
    { id: 'team-1', name: 'Pittsburgh Penguins' },
    { id: 'team-2', name: 'Boston Bruins' },
    { id: 'team-3', name: 'Toronto Maple Leafs' }
  ];

  const availablePlayers = [
    { id: 'player-123', name: 'Sidney Crosby', teamId: 'team-1' },
    { id: 'player-124', name: 'Evgeni Malkin', teamId: 'team-1' },
    { id: 'player-125', name: 'Kris Letang', teamId: 'team-1' }
  ];

  const availableSessions = [
    { id: 'session-123', name: 'Conditioning Session', date: '2025-01-22', type: 'conditioning' },
    { id: 'session-124', name: 'Strength Session', date: '2025-01-21', type: 'strength' },
    { id: 'session-125', name: 'Hybrid Session', date: '2025-01-20', type: 'hybrid' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workout Analytics</h2>
          <p className="text-muted-foreground">
            Real-time insights and comprehensive performance analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team-1">Pittsburgh Penguins</SelectItem>
              <SelectItem value="team-2">Boston Bruins</SelectItem>
              <SelectItem value="team-3">Toronto Maple Leafs</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Export Analytics</DialogTitle>
                <DialogDescription>
                  Generate and download comprehensive analytics reports
                </DialogDescription>
              </DialogHeader>
              <ExportManager
                initialFilters={currentExportFilters}
                availableTeams={availableTeams}
                availablePlayers={availablePlayers}
                availableSessions={availableSessions}
                onExportComplete={(result) => {
                  console.log('Export completed:', result);
                  setExportModalOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="session-summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="session-summary">Session Summary</TabsTrigger>
          <TabsTrigger value="player-progress">Player Progress</TabsTrigger>
          <TabsTrigger value="team-report">Team Report</TabsTrigger>
          <TabsTrigger value="live-metrics">Live Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="session-summary" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Session Analytics
                </CardTitle>
                <CardDescription>
                  Select a recent session to view detailed analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a session" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session-123">Conditioning Session - Jan 22, 2025</SelectItem>
                      <SelectItem value="session-124">Strength Session - Jan 21, 2025</SelectItem>
                      <SelectItem value="session-125">Hybrid Session - Jan 20, 2025</SelectItem>
                    </SelectContent>
                  </Select>

                  {sessionSummary && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">Participants</p>
                              <p className="text-2xl font-bold">{sessionSummary.participantCount}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">Completion Rate</p>
                              <p className="text-2xl font-bold">{sessionSummary.completionRate}%</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Heart className="h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-sm font-medium">Avg Heart Rate</p>
                              <p className="text-2xl font-bold">{sessionSummary.teamMetrics.averageHeartRate}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium">Duration</p>
                              <p className="text-2xl font-bold">{sessionSummary.duration}min</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {sessionSummary && (
                    <>
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleExportSession}
                          disabled={!selectedSession}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Export Session Report
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Team Strengths</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {sessionSummary.insights.teamStrengths.map((strength, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {sessionSummary.insights.areasForImprovement.map((area, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm">{area}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="player-progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Individual Progress Analysis
              </CardTitle>
              <CardDescription>
                Detailed progress tracking and personalized insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player-123">Sidney Crosby</SelectItem>
                    <SelectItem value="player-124">Evgeni Malkin</SelectItem>
                    <SelectItem value="player-125">Kris Letang</SelectItem>
                  </SelectContent>
                </Select>

                {playerProfile && (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleExportPlayer}
                        disabled={!selectedPlayer}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export Player Report
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <Badge className={getLevelColor(playerProfile.overallProgress.currentLevel)}>
                              {playerProfile.overallProgress.currentLevel}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">Current Level</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{playerProfile.overallProgress.progressScore}</p>
                            <p className="text-sm text-muted-foreground">Progress Score</p>
                            <Progress value={playerProfile.overallProgress.progressScore} className="mt-2" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <p className="text-2xl font-bold">+{playerProfile.overallProgress.improvementRate}%</p>
                            </div>
                            <p className="text-sm text-muted-foreground">Improvement Rate</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{playerProfile.overallProgress.totalWorkouts}</p>
                            <p className="text-sm text-muted-foreground">Total Workouts</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-600" />
                            Recent Milestones
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {playerProfile.milestones.map((milestone, index) => (
                              <div key={index} className="border-l-4 border-yellow-400 pl-4">
                                <h4 className="font-semibold">{milestone.title}</h4>
                                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(milestone.achievedDate).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {playerProfile.recommendations.map((rec, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={getPriorityColor(rec.priority)}>
                                    {rec.priority.toUpperCase()}
                                  </Badge>
                                  <h4 className="font-semibold text-sm">{rec.title}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">{rec.description}</p>
                                <p className="text-xs text-green-600">{rec.expectedBenefit}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team-report" className="space-y-4">
          {teamReport && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleExportTeam}
                  disabled={!selectedTeam}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export Team Report
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{teamReport.overallMetrics.totalSessions}</p>
                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{teamReport.overallMetrics.totalParticipants}</p>
                      <p className="text-sm text-muted-foreground">Active Players</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{teamReport.overallMetrics.averageCompletionRate}%</p>
                      <p className="text-sm text-muted-foreground">Avg Completion</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{teamReport.overallMetrics.averageAdherenceScore}%</p>
                      <p className="text-sm text-muted-foreground">Avg Adherence</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{teamReport.overallMetrics.totalTrainingHours}h</p>
                      <p className="text-sm text-muted-foreground">Training Hours</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Player Rankings</CardTitle>
                  <CardDescription>Performance rankings based on completion, adherence, and consistency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {teamReport.playerRankings.map((player) => (
                      <div key={player.playerId} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{player.rank}</Badge>
                          <span className="font-medium">{player.playerName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{player.overallScore}%</span>
                          <Badge className={getGradeColor(player.performanceGrade)}>
                            {player.performanceGrade}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">Team Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {teamReport.teamStrengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-yellow-600">Improvement Areas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {teamReport.improvementAreas.map((area, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {teamReport.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="live-metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Session Metrics</CardTitle>
              <CardDescription>
                Real-time monitoring of active training sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active sessions</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Real-time metrics will appear here when players start workouts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};