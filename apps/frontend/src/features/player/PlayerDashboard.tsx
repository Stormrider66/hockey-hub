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
import { Slider } from "@/components/ui/slider";
import {
  Calendar,
  MessageCircle,
  Dumbbell,
  Clock,
  MapPin,
  Target,
  Activity,
  Heart,
  Moon,
  Zap,
  Smile,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  User,
  Trophy,
  Send,
  Loader2,
  Plus,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { 
  useGetPlayerOverviewQuery,
  useSubmitWellnessMutation,
  useCompleteTrainingMutation
} from "@/store/api/playerApi";
import { 
  getEventTypeColor, 
  getStatusColor, 
  getPriorityColor,
  spacing,
  grids,
  a11y,
  shadows
} from "@/lib/design-utils";

export default function PlayerDashboard() {
  const [tab, setTab] = useState("today");
  const [wellnessForm, setWellnessForm] = useState({
    sleepHours: 8,
    sleepQuality: 7,
    energyLevel: 7,
    mood: 7,
    motivation: 8,
    stressLevel: 3,
    soreness: 3,
    hydration: 7,
    nutrition: 7,
    bodyWeight: 180,
    restingHeartRate: 55,
    notes: "",
    symptoms: [] as string[],
    injuries: [] as string[],
  });

  const playerId = 10; // Erik Johansson's ID
  const { data: apiData, isLoading, error } = useGetPlayerOverviewQuery(playerId);
  const [submitWellness, { isLoading: isSubmittingWellness }] = useSubmitWellnessMutation();
  const [completeTraining] = useCompleteTrainingMutation();

  // Rich fallback data matching API structure
  const playerInfo = apiData?.playerInfo ?? {
    name: "Erik Johansson",
    number: 10,
    position: "Forward",
    team: "Senior Team",
    age: 22,
    height: "5'11\"",
    weight: "180 lbs"
  };

  const schedule = apiData?.schedule ?? [
    { time: "15:00", title: "Team Meeting", location: "Video Room", type: "meeting" as const, mandatory: true, notes: "Game plan review" },
    { time: "16:00", title: "Ice Practice", location: "Main Rink", type: "ice-training" as const, mandatory: true, notes: "Power play focus" },
  ];

  const upcoming = apiData?.upcoming ?? [
    { date: "Tomorrow", title: "Team Practice", time: "16:00", location: "Main Rink", type: "ice-training" as const, importance: "High" as const },
    { date: "Wed", title: "Gym – Upper Body", time: "17:00", location: "Weight Room", type: "physical-training" as const, importance: "Medium" as const },
  ];

  const training = apiData?.training ?? [
    { title: "Leg Strength", due: "Today", progress: 40, type: "strength" as const, description: "Focus on quad development", assignedBy: "Physical Trainer", estimatedTime: "45 min" },
    { title: "Core Stability", due: "Tomorrow", progress: 10, type: "strength" as const, description: "Planks and stability work", assignedBy: "Physical Trainer", estimatedTime: "30 min" },
  ];

  const developmentGoals = apiData?.developmentGoals ?? [
    { goal: "Improve shot accuracy", progress: 75, target: "Jun 15", category: "technical" as const, priority: "High" as const, notes: "Focus on wrist shot technique" },
    { goal: "Increase skating speed", progress: 60, target: "Jun 30", category: "physical" as const, priority: "Medium" as const, notes: "Work on stride length" },
  ];

  const readiness = apiData?.readiness ?? [
    { date: "Mon", value: 78, sleepQuality: 7, energyLevel: 8, mood: 7, motivation: 9 },
    { date: "Tue", value: 82, sleepQuality: 8, energyLevel: 8, mood: 8, motivation: 8 },
    { date: "Wed", value: 85, sleepQuality: 9, energyLevel: 9, mood: 8, motivation: 9 },
    { date: "Thu", value: 80, sleepQuality: 7, energyLevel: 8, mood: 8, motivation: 8 },
    { date: "Fri", value: 88, sleepQuality: 9, energyLevel: 9, mood: 9, motivation: 9 },
  ];

  const wellnessStats = apiData?.wellnessStats ?? {
    weeklyAverage: { sleepQuality: 8.2, energyLevel: 8.4, mood: 8.0, readinessScore: 83 },
    trends: [
      { metric: "Sleep Quality", direction: "up" as const, change: 0.5 },
      { metric: "Energy Level", direction: "stable" as const, change: 0.1 },
      { metric: "Mood", direction: "up" as const, change: 0.3 }
    ],
    recommendations: [
      "Great job maintaining consistent sleep schedule",
      "Consider adding more recovery time between intense sessions"
    ]
  };

  const handleWellnessSubmit = async () => {
    try {
      const result = await submitWellness({
        playerId,
        entry: wellnessForm
      }).unwrap();
      
      // Reset form or show success message
      console.log("Wellness submitted:", result);
    } catch (error) {
      console.error("Failed to submit wellness:", error);
    }
  };

  const handleTrainingComplete = async (trainingTitle: string) => {
    try {
      await completeTraining({
        playerId,
        trainingId: trainingTitle.toLowerCase().replace(/\s+/g, '-'),
        completionNotes: `Completed ${trainingTitle}`
      }).unwrap();
    } catch (error) {
      console.error("Failed to complete training:", error);
    }
  };

  const updateWellnessField = (field: string, value: any) => {
    setWellnessForm(prev => ({ ...prev, [field]: value }));
  };

  if (error) {
    return (
      <div className={`p-6 ${spacing.section}`} role="alert">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load player dashboard data. Please try again.</p>
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
            <AvatarFallback className="text-lg font-bold">{playerInfo.number}</AvatarFallback>
          </Avatar>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold">{playerInfo.name}</h1>
          <div className="flex items-center gap-2 mt-1">
              <Badge>#{playerInfo.number}</Badge>
              <Badge variant="outline">{playerInfo.position}</Badge>
              <Badge variant="outline">{playerInfo.team}</Badge>
            </div>
            {playerInfo.age && (
              <p className="text-sm text-muted-foreground mt-1">
                Age {playerInfo.age} • {playerInfo.height} • {playerInfo.weight}
              </p>
            )}
          </div>
        </div>
        <Button size="sm" variant="outline" className={a11y.focusVisible}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Message Coach
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className={spacing.card}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="wellness">Wellness</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* ───────────  TODAY  ─────────── */}
        <TabsContent value="today" className={spacing.card} role="tabpanel" aria-labelledby="today-tab">
          <div className={grids.dashboard}>
            {/* Today's Schedule */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>Monday, May 19, 2025</CardDescription>
            </CardHeader>
              <CardContent>
                <div className={spacing.card} role="list" aria-label="Today's events">
              {isLoading ? (
                    <div className="py-8 text-center" role="status" aria-live="polite">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <span className={a11y.srOnly}>Loading schedule...</span>
                    </div>
                  ) : (
                    schedule.map((event, index) => (
                      <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0" role="listitem">
                        <div className={`p-2 rounded-md ${getEventTypeColor(event.type || '')}`}>
                          <Clock className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <p className="font-medium text-sm">{event.title}</p>
                            <div className="flex items-center gap-2">
                              {event.mandatory && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {event.time}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {event.location}
                          </p>
                          {event.notes && (
                            <p className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              <span className={a11y.srOnly}>Note: </span>
                              {event.notes}
                            </p>
                          )}
                        </div>
                  </div>
                ))
              )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>This week's activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={spacing.card} role="list" aria-label="Upcoming events">
                  {upcoming.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg" role="listitem">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-md ${getEventTypeColor(event.type || '')}`}>
                          <Calendar className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.date} • {event.time}
                          </p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground">{event.location}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={getPriorityColor(event.importance || 'Medium')}>
                        {event.importance}
                      </Badge>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>

            {/* Quick Actions */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-start">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message Coach
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Heart className="mr-2 h-4 w-4" />
                    Daily Wellness Check
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Performance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───────────  TRAINING  ─────────── */}
        <TabsContent value="training" className={spacing.card} role="tabpanel" aria-labelledby="training-tab">
          <div className={grids.cards}>
            {/* Assigned Training */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" aria-hidden="true" />
                  Assigned Training
                </CardTitle>
                <CardDescription>Current training assignments</CardDescription>
            </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {training.map((t, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getEventTypeColor(t.type)}>
                              {t.type}
                            </Badge>
                            <p className="font-medium">{t.title}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{t.description}</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Due: {t.due} • Estimated: {t.estimatedTime}</p>
                            <p>Assigned by: {t.assignedBy}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{t.progress}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Progress value={t.progress} className="h-2" aria-label={`Progress: ${t.progress}%`} />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleTrainingComplete(t.title)}
                            disabled={t.progress === 100}
                          >
                            {t.progress === 100 ? (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Completed
                              </>
                            ) : (
                              <>
                                <Plus className="mr-1 h-3 w-3" />
                                Mark Complete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>

            {/* Development Goals */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" aria-hidden="true" />
                  Development Goals
                </CardTitle>
                <CardDescription>Personal improvement targets</CardDescription>
            </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {developmentGoals.map((goal, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPriorityColor(goal.priority)}>
                              {goal.priority}
                            </Badge>
                            <Badge variant="outline">
                              {goal.category}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{goal.goal}</p>
                          <p className="text-xs text-muted-foreground mt-1">Target: {goal.target}</p>
                          {goal.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{goal.notes}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" aria-label={`Goal progress: ${goal.progress}%`} />
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* ───────────  WELLNESS  ─────────── */}
        <TabsContent value="wellness" className={spacing.card} role="tabpanel" aria-labelledby="wellness-tab">
          <div className={grids.cards}>
            {/* Wellness Form */}
            <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" aria-hidden="true" />
                  Daily Wellness Check
                </CardTitle>
                <CardDescription>
                  Rate your wellness on a scale of 1-10 to help optimize your training
                </CardDescription>
            </CardHeader>
              <CardContent className="space-y-6">
                {/* Sleep */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sleep-hours">Sleep Hours</Label>
                    <Input
                      id="sleep-hours"
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={wellnessForm.sleepHours}
                      onChange={(e) => updateWellnessField('sleepHours', parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sleep-quality">Sleep Quality: {wellnessForm.sleepQuality}/10</Label>
                    <div className="mt-2">
                      <Slider
                        value={[wellnessForm.sleepQuality]}
                        onValueChange={(value) => updateWellnessField('sleepQuality', value[0] || 1)}
                        min={1}
                        max={10}
                        step={1}
                        aria-label="Sleep Quality"
                      />
                    </div>
                  </div>
                </div>

                {/* Energy & Mood */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Energy Level: {wellnessForm.energyLevel}/10</Label>
                    <div className="mt-2">
                      <Slider
                        value={[wellnessForm.energyLevel]}
                        onValueChange={(value) => updateWellnessField('energyLevel', value[0] || 1)}
                        min={1}
                        max={10}
                        step={1}
                        aria-label="Energy Level"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Mood: {wellnessForm.mood}/10</Label>
                    <div className="mt-2">
                      <Slider
                        value={[wellnessForm.mood]}
                        onValueChange={(value) => updateWellnessField('mood', value[0] || 1)}
                        min={1}
                        max={10}
                        step={1}
                        aria-label="Mood"
                      />
                    </div>
                  </div>
                </div>

                {/* Motivation & Stress */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Motivation: {wellnessForm.motivation}/10</Label>
                    <div className="mt-2">
                      <Slider
                        value={[wellnessForm.motivation]}
                        onValueChange={(value) => updateWellnessField('motivation', value[0] || 1)}
                        min={1}
                        max={10}
                        step={1}
                        aria-label="Motivation"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Stress Level: {wellnessForm.stressLevel}/10</Label>
                    <div className="mt-2">
                      <Slider
                        value={[wellnessForm.stressLevel]}
                        onValueChange={(value) => updateWellnessField('stressLevel', value[0] || 1)}
                        min={1}
                        max={10}
                        step={1}
                        aria-label="Stress Level"
                      />
                    </div>
                  </div>
                </div>

                {/* Soreness & Hydration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Soreness: {wellnessForm.soreness}/10</Label>
                    <div className="mt-2">
                      <Slider
                        value={[wellnessForm.soreness]}
                        onValueChange={(value) => updateWellnessField('soreness', value[0] || 1)}
                        min={1}
                        max={10}
                        step={1}
                        aria-label="Soreness Level"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Hydration: {wellnessForm.hydration}/10</Label>
                    <div className="mt-2">
                      <Slider
                        value={[wellnessForm.hydration]}
                        onValueChange={(value) => updateWellnessField('hydration', value[0] || 1)}
                        min={1}
                        max={10}
                        step={1}
                        aria-label="Hydration Level"
                      />
                    </div>
                  </div>
                </div>

                {/* Nutrition & Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Nutrition: {wellnessForm.nutrition}/10</Label>
                    <div className="mt-2">
                      <Slider
                        value={[wellnessForm.nutrition]}
                        onValueChange={(value) => updateWellnessField('nutrition', value[0] || 1)}
                        min={1}
                        max={10}
                        step={1}
                        aria-label="Nutrition Quality"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="body-weight">Body Weight (lbs)</Label>
                    <Input
                      id="body-weight"
                      type="number"
                      value={wellnessForm.bodyWeight}
                      onChange={(e) => updateWellnessField('bodyWeight', parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resting-hr">Resting HR (bpm)</Label>
                    <Input
                      id="resting-hr"
                      type="number"
                      value={wellnessForm.restingHeartRate}
                      onChange={(e) => updateWellnessField('restingHeartRate', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="wellness-notes">Additional Notes</Label>
                  <Textarea
                    id="wellness-notes"
                    value={wellnessForm.notes}
                    onChange={(e) => updateWellnessField('notes', e.target.value)}
                    placeholder="Any additional comments about how you're feeling..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
            </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleWellnessSubmit} 
                  disabled={isSubmittingWellness}
                  className="w-full"
                >
                  {isSubmittingWellness ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Wellness Check
                    </>
                  )}
                </Button>
              </CardFooter>
          </Card>

            {/* Wellness Stats */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  Weekly Summary
                </CardTitle>
                <CardDescription>Your wellness trends</CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{wellnessStats.weeklyAverage.sleepQuality}</p>
                    <p className="text-xs text-muted-foreground">Sleep Quality</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{wellnessStats.weeklyAverage.energyLevel}</p>
                    <p className="text-xs text-muted-foreground">Energy Level</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{wellnessStats.weeklyAverage.mood}</p>
                    <p className="text-xs text-muted-foreground">Mood</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{wellnessStats.weeklyAverage.readinessScore}</p>
                    <p className="text-xs text-muted-foreground">Readiness</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Recommendations</h4>
                  {wellnessStats.recommendations.map((rec, index) => (
                    <p key={index} className="text-xs text-muted-foreground">• {rec}</p>
              ))}
                </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* ───────────  PERFORMANCE  ─────────── */}
        <TabsContent value="performance" className={spacing.card} role="tabpanel" aria-labelledby="performance-tab">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" aria-hidden="true" />
                Readiness Trend
              </CardTitle>
              <CardDescription>Your daily readiness score over time</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={readiness}>
                  <defs>
                    <linearGradient id="readinessGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[60, 100]} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fillOpacity={1}
                    fill="url(#readinessGradient)"
                    name="Readiness Score" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 