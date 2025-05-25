"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  MapPin,
  Target,
  Dumbbell,
  Zap,
  Heart,
  AlertTriangle,
  CheckCircle,
  Plus,
  BarChart3,
  Timer,
  Award,
  Loader2,
  Send,
  User,
  Trophy,
  AlertCircle,
  Settings,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { 
  useGetTrainerOverviewQuery,
  useCreateTrainingSessionMutation,
  useRecordTestResultMutation,
  useUpdateReadinessNotesMutation
} from "@/store/api/physicalTrainerApi";
import { 
  getEventTypeColor, 
  getStatusColor, 
  getPriorityColor,
  spacing,
  grids,
  a11y,
  shadows
} from "@/lib/design-utils";

export default function PhysicalTrainerDashboard() {
  const [tab, setTab] = useState("overview");
  const [newSessionForm, setNewSessionForm] = useState({
    title: "",
    type: "",
    location: "",
    date: "",
    time: "",
    players: 0,
    focus: "",
    equipment: [] as string[],
    notes: "",
  });
  const [testForm, setTestForm] = useState({
    player: "",
    test: "",
    result: "",
    category: "",
    notes: "",
  });

  const teamId = "senior";
  const { data: apiData, isLoading, error } = useGetTrainerOverviewQuery(teamId);
  const [createSession, { isLoading: isCreatingSession }] = useCreateTrainingSessionMutation();
  const [recordTest, { isLoading: isRecordingTest }] = useRecordTestResultMutation();
  const [updateNotes] = useUpdateReadinessNotesMutation();

  // Enhanced fallback data matching API structure
  const todaysSchedule = apiData?.todaysSchedule ?? [
    { time: "16:00 - 17:30", title: "Strength Training", location: "Weight Room", type: "strength" as const, players: 18, priority: "High" as const, notes: "Lower body focus" },
    { time: "17:45 - 18:30", title: "Power Development", location: "Training Hall", type: "power" as const, players: 15, priority: "Medium" as const, notes: "Plyometric exercises" },
  ];

  const teamReadiness = apiData?.teamReadiness ?? {
    overall: 82,
    trend: "stable" as const,
    riskPlayers: 2,
    readyPlayers: 16,
    averageLoad: 7.2
  };  const playerReadiness = apiData?.playerReadiness ?? [
    {
      player: "Erik Johansson",
      score: 88,
      trend: "up" as const,
      hrv: 45,
      sleepScore: 8.5,
      loadStatus: "optimal" as const,
      riskLevel: "low" as const,
      recommendations: ["Continue current load"],
    },
    {
      player: "Maria Andersson",
      score: 75,
      trend: "down" as const,
      hrv: 38,
      sleepScore: 6.2,
      loadStatus: "moderate" as const,
      riskLevel: "medium" as const,
      recommendations: ["Reduce intensity"],
    },
  ];  const weeklyLoadData = apiData?.weeklyLoadData ?? [
    { day: "Mon", planned: 750, actual: 720, rpe: 7.2, recovery: 8.1 },
    { day: "Tue", planned: 500, actual: 480, rpe: 5.8, recovery: 8.5 },
    { day: "Wed", planned: 650, actual: 620, rpe: 6.9, recovery: 7.8 },
    { day: "Thu", planned: 550, actual: 540, rpe: 6.2, recovery: 8.2 },
    { day: "Fri", planned: 800, actual: 780, rpe: 8.1, recovery: 7.4 },
    { day: "Sat", planned: 350, actual: 340, rpe: 4.5, recovery: 9.1 },
    { day: "Sun", planned: 0, actual: 0, rpe: 0, recovery: 9.0 },
  ];

  const upcomingSessions = apiData?.upcomingSessions ?? [
    { date: "Tomorrow", time: "16:00 - 17:30", title: "Upper Body Strength", type: "strength" as const, location: "Weight Room", players: 20, focus: "Bench press progression", equipment: ["Barbells"], estimatedLoad: 680 },
  ];

  const recentTestResults = apiData?.recentTestResults ?? [
    { player: "Erik Johansson", test: "Vertical Jump", result: "68 cm", previous: "65 cm", change: "+3 cm", percentile: 85, date: "May 15", category: "Power" as const },
  ];

  const exerciseLibrary = apiData?.exerciseLibrary ?? [
    { name: "Back Squat", category: "Strength" as const, targetMuscle: "Lower Body" as const, difficulty: "Intermediate" as const, equipment: "Barbell", usage: 45, lastUsed: "Today" },
  ];

  const loadManagement = apiData?.loadManagement ?? {
    weeklyTarget: 3500,
    currentLoad: 3240,
    compliance: 92.6,
    highRiskPlayers: 2,
    recommendations: ["Monitor high-risk players", "Consider recovery session"]
  };

  const handleCreateSession = async () => {
    try {
      const result = await createSession(newSessionForm).unwrap();
      console.log("Session created:", result);
      // Reset form
      setNewSessionForm({
        title: "",
        type: "",
        location: "",
        date: "",
        time: "",
        players: 0,
        focus: "",
        equipment: [],
        notes: "",
      });
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleRecordTest = async () => {
    try {
      const result = await recordTest(testForm).unwrap();
      console.log("Test recorded:", result);
      // Reset form
      setTestForm({
        player: "",
        test: "",
        result: "",
        category: "",
        notes: "",
      });
    } catch (error) {
      console.error("Failed to record test:", error);
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" aria-hidden="true" />;
    }
  };

  const getRiskLevelColor = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  if (error) {
    return (
      <div className={`p-6 ${spacing.section}`} role="alert">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load physical trainer dashboard data. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 ${spacing.section}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-bold">PT</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Physical Trainer Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge>Senior Team</Badge>
              <Badge variant="outline">Performance Specialist</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Managing training for {teamReadiness.readyPlayers + teamReadiness.riskPlayers} athletes
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className={a11y.focusVisible}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button size="sm" className={a11y.focusVisible}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
        </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" aria-hidden="true" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{teamReadiness.overall}</p>
                <p className="text-xs text-muted-foreground">Team Readiness</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" aria-hidden="true" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{teamReadiness.readyPlayers}</p>
                <p className="text-xs text-muted-foreground">Ready Players</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden="true" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{teamReadiness.riskPlayers}</p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" aria-hidden="true" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{loadManagement.compliance.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Load Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className={spacing.card}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ───────────  OVERVIEW  ─────────── */}
        <TabsContent value="overview" className={spacing.card} role="tabpanel" aria-labelledby="overview-tab">
          <div className={grids.dashboard}>
            {/* Today's Schedule */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                  Today's Training Schedule
                </CardTitle>
                <CardDescription>Monday, May 19, 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={spacing.card} role="list" aria-label="Today's training sessions">
                  {isLoading ? (
                    <div className="py-8 text-center" role="status" aria-live="polite">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <span className={a11y.srOnly}>Loading schedule...</span>
                    </div>
                  ) : (
                    todaysSchedule.map((session, index) => (
                      <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0" role="listitem">
                        <div className={`p-2 rounded-md ${getEventTypeColor(session.type)}`}>
                          <Dumbbell className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <p className="font-medium text-sm">{session.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(session.priority)}>
                                {session.priority}
                              </Badge>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {session.time}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              {session.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" aria-hidden="true" />
                              {session.players} players
                            </span>
                          </div>
                          {session.notes && (
                            <p className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              <span className={a11y.srOnly}>Note: </span>
                              {session.notes}
                            </p>
                          )}
                    </div>
                  </div>
                    ))
                  )}
                  </div>
              </CardContent>
            </Card>

            {/* Team Load Overview */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" aria-hidden="true" />
                  Weekly Training Load
                </CardTitle>
                <CardDescription>Planned vs Actual Load Distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyLoadData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="planned" fill="#94a3b8" name="Planned Load" />
                    <Bar dataKey="actual" fill="#3b82f6" name="Actual Load" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" aria-hidden="true" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>Next training activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingSessions.map((session, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{session.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.date} • {session.time}
                          </p>
                        </div>
                        <Badge className={getEventTypeColor(session.type)}>
                          {session.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>📍 {session.location} • 👥 {session.players} players</p>
                        <p>🎯 {session.focus}</p>
                        <p>🏋️ Load: {session.estimatedLoad} AU</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Plan New Session
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* ───────────  READINESS  ─────────── */}
        <TabsContent value="readiness" className={spacing.card} role="tabpanel" aria-labelledby="readiness-tab">
          <div className={grids.cards}>
            {/* Player Readiness */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" aria-hidden="true" />
                  Player Readiness Overview
                </CardTitle>
                <CardDescription>Individual player wellness and training readiness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playerReadiness.map((player, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{player.player.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.player}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getTrendIcon(player.trend)}
                              <Badge className={getRiskLevelColor(player.riskLevel)}>
                                {player.riskLevel} risk
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{player.score}</p>
                          <p className="text-xs text-muted-foreground">Readiness</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">HRV</p>
                          <p className="font-medium">{player.hrv} ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sleep</p>
                          <p className="font-medium">{player.sleepScore}/10</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Load</p>
                          <p className="font-medium capitalize">{player.loadStatus}</p>
                        </div>
                      </div>

                      <Progress value={player.score} className="mb-3" aria-label={`${player.player} readiness: ${player.score}%`} />
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Recommendations:</p>
                        {player.recommendations.map((rec, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {rec}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Load Management */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" aria-hidden="true" />
                  Load Management
                </CardTitle>
                <CardDescription>Weekly training load overview</CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{Math.round((loadManagement.currentLoad / loadManagement.weeklyTarget) * 100)}%</p>
                  <p className="text-sm text-muted-foreground">of weekly target</p>
                  <Progress value={(loadManagement.currentLoad / loadManagement.weeklyTarget) * 100} className="mt-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-600">{loadManagement.currentLoad}</p>
                    <p className="text-xs text-muted-foreground">Current Load</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-600">{loadManagement.weeklyTarget}</p>
                    <p className="text-xs text-muted-foreground">Target Load</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Recommendations</h4>
                  {loadManagement.recommendations.map((rec, index) => (
                    <p key={index} className="text-xs text-muted-foreground">• {rec}</p>
              ))}
                </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* ───────────  TESTING  ─────────── */}
        <TabsContent value="testing" className={spacing.card} role="tabpanel" aria-labelledby="testing-tab">
          <div className={grids.cards}>
            {/* Recent Test Results */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" aria-hidden="true" />
                  Recent Test Results
                </CardTitle>
                <CardDescription>Latest physical assessments and improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTestResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{result.player.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{result.player}</p>
                          <p className="text-xs text-muted-foreground">{result.test}</p>
                          <p className="text-xs text-muted-foreground">{result.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{result.result}</p>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs ${result.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {result.change}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {result.percentile}th
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Record Test Form */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  Record Test Result
                </CardTitle>
                <CardDescription>Add new performance data</CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-player">Player</Label>
                  <Select value={testForm.player} onValueChange={(value) => setTestForm(prev => ({ ...prev, player: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {playerReadiness.map((player) => (
                        <SelectItem key={player.player} value={player.player}>
                          {player.player}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="test-type">Test Type</Label>
                  <Select value={testForm.test} onValueChange={(value) => setTestForm(prev => ({ ...prev, test: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertical-jump">Vertical Jump</SelectItem>
                      <SelectItem value="broad-jump">Broad Jump</SelectItem>
                      <SelectItem value="5-10-5">5-10-5 Agility</SelectItem>
                      <SelectItem value="squat-1rm">1RM Back Squat</SelectItem>
                      <SelectItem value="vo2-max">VO2 Max</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="test-result">Result</Label>
                  <Input
                    id="test-result"
                    value={testForm.result}
                    onChange={(e) => setTestForm(prev => ({ ...prev, result: e.target.value }))}
                    placeholder="e.g., 68 cm, 4.32 s"
                  />
                </div>

                <div>
                  <Label htmlFor="test-category">Category</Label>
                  <Select value={testForm.category} onValueChange={(value) => setTestForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Power">Power</SelectItem>
                      <SelectItem value="Speed">Speed</SelectItem>
                      <SelectItem value="Strength">Strength</SelectItem>
                      <SelectItem value="Endurance">Endurance</SelectItem>
                      <SelectItem value="Agility">Agility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="test-notes">Notes</Label>
                  <Textarea
                    id="test-notes"
                    value={testForm.notes}
                    onChange={(e) => setTestForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional observations..."
                    rows={3}
                  />
                </div>
            </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleRecordTest} 
                  disabled={isRecordingTest || !testForm.player || !testForm.test || !testForm.result}
                  className="w-full"
                >
                  {isRecordingTest ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Record Result
                    </>
                  )}
                </Button>
              </CardFooter>
          </Card>
          </div>
        </TabsContent>

        {/* ───────────  ANALYTICS  ─────────── */}
        <TabsContent value="analytics" className={spacing.card} role="tabpanel" aria-labelledby="analytics-tab">
          <div className={grids.cards}>
            {/* RPE & Recovery Trends */}
            <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" aria-hidden="true" />
                  RPE & Recovery Trends
                </CardTitle>
                <CardDescription>Weekly perceived exertion and recovery patterns</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyLoadData}>
                    <defs>
                      <linearGradient id="rpeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                    <YAxis />
                  <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="rpe" 
                      stroke="#ef4444" 
                      fillOpacity={1}
                      fill="url(#rpeGradient)"
                      name="RPE" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="recovery" 
                      stroke="#22c55e" 
                      fillOpacity={1}
                      fill="url(#recoveryGradient)"
                      name="Recovery Score" 
                    />
                  </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

            {/* Exercise Library Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" aria-hidden="true" />
                  Exercise Library
                </CardTitle>
                <CardDescription>Most used exercises</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exerciseLibrary.map((exercise, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{exercise.name}</p>
                        <p className="text-xs text-muted-foreground">{exercise.targetMuscle}</p>
                        <p className="text-xs text-muted-foreground">Last: {exercise.lastUsed}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getEventTypeColor(exercise.category.toLowerCase())}>
                          {exercise.category}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{exercise.usage} uses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  View Full Library
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 