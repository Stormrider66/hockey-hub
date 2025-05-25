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
import {
  Calendar,
  Clock,
  UserX,
  Video,
  Plus,
  MessageCircle,
  ChevronRight,
  Clipboard,
  Edit,
  Activity,
  AlertCircle,
  Target,
  TrendingUp,
  Users,
  Trophy,
  MapPin,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useGetCoachOverviewQuery } from "@/store/api/coachApi";
import { 
  getEventTypeColor, 
  getStatusColor, 
  getEventTypeIconColor,
  spacing,
  grids,
  a11y,
  shadows
} from "@/lib/design-utils";

/**
 * CoachDashboard – Enhanced version with design-utils integration and accessibility improvements
 */
export default function CoachDashboard() {
  const [tab, setTab] = useState<string>("today");

  const { data: apiData, isLoading, error } = useGetCoachOverviewQuery("senior");

  // Fallback data with richer structure
  const teamStats = apiData?.teamStats ?? { 
    wins: 12, 
    losses: 5, 
    ties: 3, 
    goalsFor: 68, 
    goalsAgainst: 42,
    goalsPerGame: 3.4,
    powerPlayPercentage: 18.5,
    penaltyKillPercentage: 82.3
  };
  
  const availabilityStats = apiData?.availabilityStats ?? { 
    available: 18, 
    limited: 4, 
    unavailable: 2 
  };

  const players = apiData?.players ?? [
    { id: 1, name: "Erik Johansson", position: "Forward", number: "10", status: "available", goals: 8, assists: 12 },
    { id: 2, name: "Maria Andersson", position: "Forward", number: "21", status: "available", goals: 6, assists: 15 },
    { id: 3, name: "Johan Berg", position: "Defense", number: "5", status: "limited", goals: 2, assists: 8 },
    { id: 4, name: "Anna Nilsson", position: "Goalie", number: "1", status: "available", saves: 245, savePercentage: 0.916 },
    { id: 5, name: "Lucas Holm", position: "Forward", number: "18", status: "available", goals: 4, assists: 7 },
    { id: 6, name: "Oskar Lind", position: "Defense", number: "4", status: "unavailable", goals: 1, assists: 3 },
  ];

  const todaysSchedule = apiData?.todaysSchedule ?? [
    { time: "15:00 - 15:45", title: "Team Meeting", location: "Video Room", type: "meeting", note: "Review game footage from last match" },
    { time: "16:00 - 17:30", title: "Ice Practice", location: "Main Rink", type: "ice-training", note: "Focus on powerplay formations" },
    { time: "17:45 - 18:30", title: "Gym Session", location: "Weight Room", type: "physical-training", note: "Lower body strength" },
  ];

  const upcomingGames = apiData?.upcomingGames ?? [
    { date: "May 22", opponent: "Northern Knights", location: "Away", time: "19:00", venue: "North Arena", importance: "League" },
    { date: "May 25", opponent: "Ice Breakers", location: "Home", time: "18:30", venue: "Home Arena", importance: "Playoff" },
    { date: "June 1", opponent: "Polar Bears", location: "Away", time: "17:00", venue: "Polar Stadium", importance: "League" },
  ];

  const recentPerformance = apiData?.recentPerformance ?? [
    { game: "vs Ice Hawks", result: "Win 4-2", date: "May 15" },
    { game: "@ Storm", result: "Loss 1-3", date: "May 12" },
    { game: "vs Thunder", result: "Win 5-1", date: "May 8" },
    { game: "@ Lightning", result: "Tie 2-2", date: "May 5" }
  ];

  const developmentGoals = apiData?.developmentGoals ?? [
    { player: "Erik Johansson", goal: "Improve shot accuracy", progress: 75, target: "85% accuracy" },
    { player: "Maria Andersson", goal: "Increase skating speed", progress: 60, target: "Sub 6.5s" },
    { player: "Johan Berg", goal: "Defensive positioning", progress: 80, target: "Reduce giveaways" },
    { player: "Anna Nilsson", goal: "Rebound control", progress: 65, target: "90% rebound control" }
  ];

  if (error) {
    return (
      <div className={`p-6 ${spacing.section}`} role="alert">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load dashboard data. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ──────────────────────────────  RENDER  ───────────────────────────── */
  return (
    <div className={`p-4 md:p-6 ${spacing.section}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Coach Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Senior Team</span>
          <Button size="sm" variant="outline" className={a11y.focusVisible}>
            Change Team
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className={spacing.card}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>

        {/* ───────────  TODAY  ─────────── */}
        <TabsContent value="today" className={spacing.card} role="tabpanel" aria-labelledby="today-tab">
          <div className={grids.dashboard}>
            {/* Schedule */}
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
                    todaysSchedule.map((ev, index) => (
                      <div 
                        key={`${ev.title}-${index}`}
                        className="flex items-start space-x-4 border-b pb-3 last:border-0"
                        role="listitem"
                      >
                        <div className={`p-2 rounded-md ${getEventTypeColor(ev.type || '')}`}>
                        <Calendar
                            className={`h-4 w-4 ${getEventTypeIconColor(ev.type || '')}`}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <p className="font-medium truncate">{ev.title}</p>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {ev.time}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {ev.location}
                          </p>
                        {ev.note && (
                            <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              <span className={a11y.srOnly}>Note: </span>
                              {ev.note}
                            </p>
                        )}
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className={a11y.focusVisible}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Add Event
                </Button>
              </CardFooter>
            </Card>

            {/* Availability */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" aria-hidden="true" />
                  Player Availability
                </CardTitle>
                <CardDescription>Current team status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <StatLabel label="Available" value={availabilityStats.available} color="green" />
                  <StatLabel label="Limited" value={availabilityStats.limited} color="amber" />
                  <StatLabel label="Unavailable" value={availabilityStats.unavailable} color="red" />
                </div>
                <div className="h-48 overflow-y-auto space-y-3" role="list" aria-label="Player list">
                  {isLoading ? (
                    <div className="space-y-3" aria-live="polite">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                      <span className={a11y.srOnly}>Loading players...</span>
                    </div>
                  ) : (
                    players.map((p) => (
                      <div key={p.id} className="flex items-center justify-between" role="listitem">
                        <div className="flex items-center min-w-0 flex-1">
                          <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
                            <AvatarFallback className="text-xs">{p.number}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.position}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(p.status)} aria-label={`Status: ${p.status}`}>
                          {p.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Stats */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" aria-hidden="true" />
                  Team Performance
                </CardTitle>
                <CardDescription>Season statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{teamStats.wins}</p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{teamStats.losses}</p>
                    <p className="text-xs text-muted-foreground">Losses</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Goals/Game:</span>
                    <span className="font-medium">{teamStats.goalsPerGame}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Power Play:</span>
                    <span className="font-medium">{teamStats.powerPlayPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Penalty Kill:</span>
                    <span className="font-medium">{teamStats.penaltyKillPercentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───────────  TEAM  ─────────── */}
        <TabsContent value="team" className={spacing.card} role="tabpanel" aria-labelledby="team-tab">
          <div className={grids.cards}>
            <Card>
              <CardHeader>
                <CardTitle>Team Roster</CardTitle>
                <CardDescription>Complete player information and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{player.number}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-sm text-muted-foreground">{player.position}</p>
                        </div>
                      </div>
                      <div className="text-right space-x-4">
                        {player.goals !== undefined && (
                          <span className="text-sm">G: {player.goals}</span>
                        )}
                        {player.assists !== undefined && (
                          <span className="text-sm">A: {player.assists}</span>
                        )}
                        <Badge className={getStatusColor(player.status)}>
                          {player.status}
                      </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Development Goals</CardTitle>
                <CardDescription>Individual player progress tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {developmentGoals.map((goal, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{goal.player}</p>
                          <p className="text-xs text-muted-foreground">{goal.goal}</p>
                          <p className="text-xs text-muted-foreground">Target: {goal.target}</p>
                      </div>
                        <span className="text-sm font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───────────  TRAINING  ─────────── */}
        <TabsContent value="training" className={spacing.card} role="tabpanel" aria-labelledby="training-tab">
          <Card>
            <CardHeader>
              <CardTitle>Training Management</CardTitle>
              <CardDescription>Plan and track training sessions</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Training management features coming soon</p>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Training Plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────────  GAMES  ─────────── */}
        <TabsContent value="games" className={spacing.card} role="tabpanel" aria-labelledby="games-tab">
          <div className={grids.cards}>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Games</CardTitle>
                <CardDescription>Schedule and game preparation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingGames.map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{game.opponent}</p>
                        <p className="text-sm text-muted-foreground">
                          {game.date} at {game.time}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {game.location} • {game.venue}
                        </p>
                      </div>
                      <Badge variant={game.importance === "Playoff" ? "destructive" : "secondary"}>
                        {game.importance}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
                <CardDescription>Last 4 games</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPerformance.map((game, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{game.game}</p>
                        <p className="text-xs text-muted-foreground">{game.date}</p>
                      </div>
                      <Badge variant={game.result.includes("Win") ? "secondary" : 
                                     game.result.includes("Loss") ? "destructive" : "outline"}>
                        {game.result}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatLabel({ label, value, color }: { label: string; value: number; color: "green" | "amber" | "red" }) {
  const colorClasses = {
    green: "text-green-600",
    amber: "text-amber-600",
    red: "text-red-600"
  };

  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${colorClasses[color]}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
} 