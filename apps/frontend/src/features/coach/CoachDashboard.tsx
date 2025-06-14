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
import { cn } from "@/lib/utils";
import {
  Calendar, Clock, UserX, Video, Plus, MessageCircle, ChevronRight,
  Clipboard, Edit, Activity, AlertCircle, Target, TrendingUp,
  Users, Trophy, MapPin, Snowflake, Dumbbell, FileText, BarChart3,
  CheckCircle2, ArrowUp, ArrowDown, Minus, Play, Timer, Shield,
  Zap, Heart, Brain, Flag, Share2, Settings, Star, Gamepad2
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { useGetCoachOverviewQuery } from "@/store/api/coachApi";
import { 
  getEventTypeColor, 
  getStatusColor, 
  getEventTypeIconColor,
} from "@/lib/design-utils";

// Mock data for comprehensive dashboard
const mockPlayers = [
  { 
    id: 1, 
    name: "Erik Andersson", 
    position: "Forward", 
    number: "15", 
    status: "available", 
    goals: 12, 
    assists: 18, 
    plusMinus: 8,
    faceoffPercentage: 52.3,
    shots: 89,
    hits: 45,
    blocks: 12,
    pim: 16,
    toi: "18:32"
  },
  { 
    id: 2, 
    name: "Marcus Lindberg", 
    position: "Defense", 
    number: "7", 
    status: "limited", 
    goals: 3, 
    assists: 15, 
    plusMinus: 12,
    shots: 67,
    hits: 98,
    blocks: 87,
    pim: 28,
    toi: "22:15"
  },
  { 
    id: 3, 
    name: "Viktor Nilsson", 
    position: "Goalie", 
    number: "23", 
    status: "available", 
    gamesPlayed: 18,
    wins: 12, 
    losses: 4,
    otl: 2,
    gaa: 2.34,
    savePercentage: .918,
    shutouts: 2
  },
  { 
    id: 4, 
    name: "Johan Bergström", 
    position: "Forward", 
    number: "14", 
    status: "available", 
    goals: 8, 
    assists: 12, 
    plusMinus: 5,
    faceoffPercentage: 48.7,
    shots: 54,
    hits: 23,
    blocks: 8,
    pim: 6,
    toi: "15:23"
  },
  { 
    id: 5, 
    name: "Anders Johansson", 
    position: "Defense", 
    number: "22", 
    status: "unavailable", 
    goals: 2, 
    assists: 8, 
    plusMinus: -3,
    shots: 45,
    hits: 76,
    blocks: 92,
    pim: 32,
    toi: "19:45"
  }
];

const todaysSessions = [
  {
    id: 1,
    time: "06:00",
    duration: 60,
    type: "ice-training",
    title: "Morning Skate",
    location: "Main Rink",
    focus: "Power Play Practice",
    attendees: 18,
    status: "completed"
  },
  {
    id: 2,
    time: "10:00",
    duration: 45,
    type: "meeting",
    title: "Video Review",
    location: "Meeting Room",
    focus: "Opponent Analysis - Northern Knights",
    attendees: 22,
    status: "completed"
  },
  {
    id: 3,
    time: "16:00",
    duration: 90,
    type: "ice-training",
    title: "Full Team Practice",
    location: "Main Rink",
    focus: "Defensive Zone Coverage",
    attendees: 22,
    status: "upcoming"
  }
];

const teamPerformance = [
  { game: 1, goals: 3, goalsAgainst: 2, shots: 32, shotsAgainst: 28 },
  { game: 2, goals: 2, goalsAgainst: 3, shots: 29, shotsAgainst: 35 },
  { game: 3, goals: 5, goalsAgainst: 1, shots: 38, shotsAgainst: 22 },
  { game: 4, goals: 2, goalsAgainst: 2, shots: 31, shotsAgainst: 30 },
  { game: 5, goals: 4, goalsAgainst: 3, shots: 36, shotsAgainst: 27 }
];

const lineupCombinations = [
  {
    name: "Line 1",
    forwards: ["Erik Andersson", "Johan Bergström", "Lucas Holm"],
    iceTime: "18:45",
    goalsFor: 8,
    goalsAgainst: 3,
    corsi: 58.2
  },
  {
    name: "Line 2",
    forwards: ["Maria Andersson", "Alex Nilsson", "Filip Berg"],
    iceTime: "16:32",
    goalsFor: 6,
    goalsAgainst: 4,
    corsi: 52.1
  },
  {
    name: "Defense Pair 1",
    defense: ["Marcus Lindberg", "Anders Johansson"],
    iceTime: "22:15",
    goalsFor: 12,
    goalsAgainst: 6,
    corsi: 55.7
  }
];

const upcomingGames = [
  {
    id: 1,
    date: "2024-01-22",
    time: "19:00",
    opponent: "Northern Knights",
    location: "Away",
    venue: "North Arena",
    importance: "League",
    record: "W-L-W",
    keyPlayer: "Max Johnson - 23G, 31A"
  },
  {
    id: 2,
    date: "2024-01-25",
    time: "18:30",
    opponent: "Ice Breakers",
    location: "Home",
    venue: "Home Arena",
    importance: "Playoff",
    record: "W-W-L",
    keyPlayer: "Sarah Smith - .925 SV%"
  },
  {
    id: 3,
    date: "2024-02-01",
    time: "17:00",
    opponent: "Polar Bears",
    location: "Away",
    venue: "Polar Stadium",
    importance: "League",
    record: "L-W-W",
    keyPlayer: "Tom Wilson - 19G, 28A"
  }
];

const specialTeamsStats = {
  powerPlay: {
    percentage: 18.5,
    opportunities: 87,
    goals: 16,
    trend: "up"
  },
  penaltyKill: {
    percentage: 82.3,
    timesShorthanded: 79,
    goalsAllowed: 14,
    trend: "stable"
  }
};

const playerDevelopment = [
  {
    player: "Erik Andersson",
    goals: [
      { skill: "Shot Accuracy", target: 85, current: 72, progress: 84 },
      { skill: "Defensive Positioning", target: 80, current: 65, progress: 81 },
      { skill: "Faceoff Win %", target: 55, current: 52.3, progress: 95 }
    ]
  },
  {
    player: "Marcus Lindberg",
    goals: [
      { skill: "First Pass Success", target: 90, current: 82, progress: 91 },
      { skill: "Gap Control", target: 85, current: 78, progress: 92 },
      { skill: "Shot Blocking", target: 100, current: 87, progress: 87 }
    ]
  }
];

export default function CoachDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLineup, setSelectedLineup] = useState(null);
  const { data: apiData, isLoading } = useGetCoachOverviewQuery("senior");

  // Availability calculation
  const availabilityStats = {
    available: mockPlayers.filter(p => p.status === 'available').length,
    limited: mockPlayers.filter(p => p.status === 'limited').length,
    unavailable: mockPlayers.filter(p => p.status === 'unavailable').length
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Next Game</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">vs Northern Knights</div>
            <p className="text-xs text-muted-foreground mt-1">Tomorrow, 19:00</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Team Record</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">12-5-3</div>
            <p className="text-xs text-muted-foreground mt-1">2nd in division</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{availabilityStats.available}/{mockPlayers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{availabilityStats.limited} limited</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Goals/Game</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold">3.2</div>
              <Badge variant="outline" className="text-xs">
                <ArrowUp className="h-3 w-3 mr-1" />
                +0.3
              </Badge>
        </div>
            <p className="text-xs text-muted-foreground mt-1">Last 5 games</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Power Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{specialTeamsStats.powerPlay.percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {specialTeamsStats.powerPlay.goals}/{specialTeamsStats.powerPlay.opportunities}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Penalty Kill</CardTitle>
              </CardHeader>
              <CardContent>
            <div className="text-lg font-bold">{specialTeamsStats.penaltyKill.percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">14th in league</p>
          </CardContent>
        </Card>
                      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Today's Schedule</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Session
              </Button>
                    </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysSessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">{session.time}</div>
                      <div className="text-xs text-muted-foreground">{session.duration} min</div>
                        </div>
                    <div className={cn(
                      "h-10 w-1 rounded-full",
                      session.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    )} />
                    <div>
                      <div className="font-medium">{session.title}</div>
                      <div className="text-sm text-muted-foreground">{session.focus}</div>
                          </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {session.attendees}
                    </Badge>
                    {session.type === 'ice-training' && (
                      <Snowflake className="h-4 w-4 text-blue-500" />
                    )}
                    {session.type === 'meeting' && (
                      <Video className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                    </div>
              ))}
                </div>
              </CardContent>
            </Card>

        {/* Player Status Overview */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Player Availability</CardTitle>
              <Button variant="ghost" size="sm">
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
              </CardHeader>
              <CardContent>
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{availabilityStats.available}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">{availabilityStats.limited}</div>
                  <div className="text-xs text-muted-foreground">Limited</div>
                          </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{availabilityStats.unavailable}</div>
                  <div className="text-xs text-muted-foreground">Unavailable</div>
                        </div>
                    </div>
            </div>
            
            <div className="space-y-2">
              {mockPlayers.slice(0, 5).map(player => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{player.number}</AvatarFallback>
                          </Avatar>
                    <div>
                      <div className="text-sm font-medium">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.position}</div>
                          </div>
                        </div>
                  <Badge className={cn(
                    player.status === 'available' && 'bg-green-100 text-green-800',
                    player.status === 'limited' && 'bg-amber-100 text-amber-800',
                    player.status === 'unavailable' && 'bg-red-100 text-red-800'
                  )}>
                    {player.status}
                        </Badge>
                      </div>
              ))}
                </div>
              </CardContent>
            </Card>
      </div>

      {/* Recent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Trends</CardTitle>
          <CardDescription>Last 5 games analysis</CardDescription>
              </CardHeader>
              <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="game" label={{ value: 'Game', position: 'insideBottom', offset: -5 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="goals" stroke="#10b981" name="Goals For" strokeWidth={2} />
                <Line type="monotone" dataKey="goalsAgainst" stroke="#ef4444" name="Goals Against" strokeWidth={2} />
                <Line type="monotone" dataKey="shots" stroke="#3b82f6" name="Shots" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTeamManagementTab = () => (
    <div className="space-y-6">
      {/* Roster Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Team Roster</CardTitle>
              <CardDescription>Player statistics and availability</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Lines
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockPlayers.map(player => (
              <Card key={player.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{player.number}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{player.name}</h3>
                          <Badge variant="outline">{player.position}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn(
                            player.status === 'available' && 'bg-green-100 text-green-800',
                            player.status === 'limited' && 'bg-amber-100 text-amber-800',
                            player.status === 'unavailable' && 'bg-red-100 text-red-800'
                          )}>
                            {player.status}
                          </Badge>
                          {player.toi && (
                            <span className="text-xs text-muted-foreground">TOI: {player.toi}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-6 text-sm">
                      {player.position !== "Goalie" ? (
                        <>
                  <div className="text-center">
                            <div className="font-semibold">{player.goals}</div>
                            <div className="text-xs text-muted-foreground">Goals</div>
                  </div>
                  <div className="text-center">
                            <div className="font-semibold">{player.assists}</div>
                            <div className="text-xs text-muted-foreground">Assists</div>
                  </div>
                          <div className="text-center">
                            <div className="font-semibold">{(player.goals || 0) + (player.assists || 0)}</div>
                            <div className="text-xs text-muted-foreground">Points</div>
                </div>
                          <div className="text-center">
                            <div className="font-semibold">{player.plusMinus && player.plusMinus > 0 ? '+' : ''}{player.plusMinus || 0}</div>
                            <div className="text-xs text-muted-foreground">+/-</div>
                  </div>
                        </>
                      ) : (
                        <>
                          <div className="text-center">
                            <div className="font-semibold">{player.wins}-{player.losses}-{player.otl}</div>
                            <div className="text-xs text-muted-foreground">Record</div>
                  </div>
                          <div className="text-center">
                            <div className="font-semibold">{player.gaa}</div>
                            <div className="text-xs text-muted-foreground">GAA</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{player.savePercentage}</div>
                            <div className="text-xs text-muted-foreground">SV%</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{player.shutouts}</div>
                            <div className="text-xs text-muted-foreground">SO</div>
                          </div>
                        </>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Line Combinations */}
            <Card>
              <CardHeader>
          <CardTitle>Line Combinations & Performance</CardTitle>
          <CardDescription>Current lineup effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
            {lineupCombinations.map((line, index) => (
              <Card key={index} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                        <div>
                      <h4 className="font-semibold">{line.name}</h4>
                      <div className="text-sm text-muted-foreground mt-1">
                        {line.forwards ? line.forwards.join(" - ") : line.defense.join(" - ")}
                        </div>
                      </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{line.iceTime}</div>
                        <div className="text-xs text-muted-foreground">TOI/Game</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">+{line.goalsFor}</div>
                        <div className="text-xs text-muted-foreground">GF</div>
                    </div>
                      <div className="text-center">
                        <div className="font-semibold text-red-600">-{line.goalsAgainst}</div>
                        <div className="text-xs text-muted-foreground">GA</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{line.corsi}%</div>
                        <div className="text-xs text-muted-foreground">Corsi</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
    </div>
  );

  const renderTrainingPlansTab = () => (
    <div className="space-y-6">
      {/* Ice Training Sessions */}
            <Card>
              <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Ice Training Management</CardTitle>
              <CardDescription>Plan and organize on-ice practice sessions</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </div>
              </CardHeader>
              <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "Power Play Systems", duration: 45, drills: 6 },
                    { name: "Defensive Zone Coverage", duration: 60, drills: 8 },
                    { name: "Breakout Patterns", duration: 40, drills: 5 },
                    { name: "Special Teams Practice", duration: 50, drills: 7 },
                    { name: "Game Day Morning Skate", duration: 30, drills: 4 }
                  ].map((template, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                        <div>
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.duration} min • {template.drills} drills</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Play className="h-4 w-4" />
                      </Button>
                      </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Drill Library</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { category: "Offensive Drills", count: 24 },
                    { category: "Defensive Drills", count: 18 },
                    { category: "Transition Drills", count: 15 },
                    { category: "Goalie Drills", count: 12 },
                    { category: "Conditioning", count: 10 }
                  ].map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-2">
                      <span className="text-sm">{category.category}</span>
                      <Badge variant="outline">{category.count}</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Browse All Drills
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Sessions */}
          <div>
            <h3 className="font-semibold mb-3">This Week's Schedule</h3>
            <div className="space-y-2">
              {[
                { day: "Monday", time: "16:00", focus: "Power Play", rink: "Main" },
                { day: "Tuesday", time: "06:00", focus: "Morning Skate", rink: "Main" },
                { day: "Wednesday", time: "16:00", focus: "Full Practice", rink: "Main" },
                { day: "Thursday", time: "16:00", focus: "Special Teams", rink: "Practice" },
                { day: "Friday", time: "10:00", focus: "Pre-Game Skate", rink: "Main" }
              ].map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{session.day}</p>
                      <p className="text-sm text-muted-foreground">{session.time}</p>
                    </div>
                    <div>
                      <p className="text-sm">{session.focus}</p>
                      <p className="text-xs text-muted-foreground">{session.rink} Rink</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Planning Tools */}
          <Card>
            <CardHeader>
          <CardTitle>Practice Planning Tools</CardTitle>
          <CardDescription>Resources for effective training sessions</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              <Clipboard className="h-6 w-6" />
              <span className="text-xs">Drill Builder</span>
              </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              <Timer className="h-6 w-6" />
              <span className="text-xs">Session Timer</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              <Users className="h-6 w-6" />
              <span className="text-xs">Line Generator</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              <Share2 className="h-6 w-6" />
              <span className="text-xs">Share Plans</span>
            </Button>
          </div>
            </CardContent>
          </Card>
    </div>
  );

  const renderGamesTab = () => (
    <div className="space-y-6">
      {/* Upcoming Games */}
            <Card>
              <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Game Schedule & Preparation</CardTitle>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Full Schedule
            </Button>
          </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
            {upcomingGames.map(game => (
              <Card key={game.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          {new Date(game.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-2xl font-bold">
                          {new Date(game.date).getDate()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(game.date).toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                      </div>
                      <div className="h-16 w-0.5 bg-border" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{game.opponent}</h3>
                      <Badge variant={game.importance === "Playoff" ? "destructive" : "secondary"}>
                        {game.importance}
                      </Badge>
                    </div>
                        <p className="text-sm text-muted-foreground">
                          {game.location} • {game.venue} • {game.time}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recent form: {game.record} • Key player: {game.keyPlayer}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Video className="h-4 w-4 mr-2" />
                        Scout Report
                      </Button>
                      <Button size="sm">
                        <Gamepad2 className="h-4 w-4 mr-2" />
                        Game Plan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

      {/* Tactical Planning */}
      <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
            <CardTitle>Tactical Board</CardTitle>
            <CardDescription>Draw plays and strategies</CardDescription>
              </CardHeader>
              <CardContent>
            <div className="h-96 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Snowflake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Interactive tactical board</p>
                <Button className="mt-4">
                  Open Tactical Board
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Special Teams Analysis</CardTitle>
            <CardDescription>Power play and penalty kill performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                      <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Power Play</h4>
                  <Badge variant={specialTeamsStats.powerPlay.trend === 'up' ? 'default' : 'secondary'}>
                    {specialTeamsStats.powerPlay.percentage}%
                  </Badge>
                      </div>
                <Progress value={specialTeamsStats.powerPlay.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {specialTeamsStats.powerPlay.goals} goals on {specialTeamsStats.powerPlay.opportunities} opportunities
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Penalty Kill</h4>
                  <Badge variant="secondary">
                    {specialTeamsStats.penaltyKill.percentage}%
                      </Badge>
                </div>
                <Progress value={specialTeamsStats.penaltyKill.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {specialTeamsStats.penaltyKill.goalsAllowed} goals allowed on {specialTeamsStats.penaltyKill.timesShorthanded} times shorthanded
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">PP Rank</p>
                  <p className="text-xl font-bold">8th</p>
                  <p className="text-xs text-green-600">↑ 2 from last month</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">PK Rank</p>
                  <p className="text-xl font-bold">14th</p>
                  <p className="text-xs text-gray-600">— No change</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="space-y-6">
      {/* Team Performance Overview */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Goal Distribution</CardTitle>
            <CardDescription>Goals by period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: '1st Period', value: 22, fill: '#3b82f6' },
                      { name: '2nd Period', value: 28, fill: '#10b981' },
                      { name: '3rd Period', value: 31, fill: '#f59e0b' },
                      { name: 'Overtime', value: 3, fill: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {/* Cells defined inline above */}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shot Metrics</CardTitle>
            <CardDescription>Shooting effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Shots/Game</span>
                  <span className="font-medium">33.2</span>
                </div>
                <Progress value={66} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Shooting %</span>
                  <span className="font-medium">9.7%</span>
                </div>
                <Progress value={48} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>High-Danger Shots</span>
                  <span className="font-medium">12.4/game</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Shot Location Heat Map</p>
                <div className="h-20 bg-gradient-to-r from-blue-100 via-yellow-100 to-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Heat map visualization</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Metrics</CardTitle>
            <CardDescription>Team analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Corsi For %</span>
                <Badge variant="outline">52.3%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Fenwick For %</span>
                <Badge variant="outline">51.8%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">PDO</span>
                <Badge variant="outline">101.2</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Zone Starts (O/D)</span>
                <Badge variant="outline">52/48</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Faceoff Win %</span>
                <Badge variant="outline">48.9%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Penalty Minutes/Game</span>
                <Badge variant="outline">8.2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Performance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Player Performance Matrix</CardTitle>
          <CardDescription>Individual contributions and advanced stats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { stat: 'Goals', A: 85, B: 70, fullMark: 100 },
                { stat: 'Assists', A: 92, B: 85, fullMark: 100 },
                { stat: 'Shots', A: 78, B: 82, fullMark: 100 },
                { stat: 'Hits', A: 65, B: 88, fullMark: 100 },
                { stat: 'Blocks', A: 45, B: 92, fullMark: 100 },
                { stat: 'Faceoffs', A: 72, B: 0, fullMark: 100 },
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="stat" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Erik Andersson" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="Marcus Lindberg" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Historical Trends */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Season Trends</CardTitle>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { month: 'Oct', wins: 3, losses: 1, ties: 0 },
                { month: 'Nov', wins: 4, losses: 2, ties: 1 },
                { month: 'Dec', wins: 5, losses: 1, ties: 2 },
                { month: 'Jan', wins: 0, losses: 1, ties: 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wins" stackId="a" fill="#10b981" />
                <Bar dataKey="losses" stackId="a" fill="#ef4444" />
                <Bar dataKey="ties" stackId="a" fill="#6b7280" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDevelopmentTab = () => (
    <div className="space-y-6">
      {/* Player Development Goals */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Individual Development Plans</CardTitle>
              <CardDescription>Track player skill progression and goals</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {playerDevelopment.map((player, playerIndex) => (
              <Card key={playerIndex}>
                <CardHeader>
                  <CardTitle className="text-lg">{player.player}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {player.goals.map((goal, goalIndex) => (
                      <div key={goalIndex}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="font-medium text-sm">{goal.skill}</p>
                            <p className="text-xs text-muted-foreground">
                              Current: {goal.current} → Target: {goal.target}
                            </p>
                          </div>
                          <Badge variant="outline">{goal.progress}%</Badge>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill Development Programs */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skill Development Programs</CardTitle>
            <CardDescription>Structured improvement plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Shooting Accuracy Program", duration: "4 weeks", enrolled: 5 },
                { name: "Defensive Positioning", duration: "3 weeks", enrolled: 8 },
                { name: "Faceoff Specialist", duration: "2 weeks", enrolled: 3 },
                { name: "Goalie Fundamentals", duration: "6 weeks", enrolled: 2 },
                { name: "Power Skating", duration: "4 weeks", enrolled: 12 }
              ].map((program, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{program.name}</p>
                    <p className="text-xs text-muted-foreground">{program.duration} • {program.enrolled} players</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Schedule</CardTitle>
            <CardDescription>Upcoming skill evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: "Jan 25", type: "Shooting Test", players: "All forwards" },
                { date: "Jan 28", type: "Skating Speed", players: "Full team" },
                { date: "Feb 2", type: "Defensive Skills", players: "Defense" },
                { date: "Feb 5", type: "Goalie Evaluation", players: "Goalies" },
                { date: "Feb 10", type: "Team Fitness", players: "Full team" }
              ].map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {assessment.date.split(' ')[0]}
                      </p>
                      <p className="font-bold">
                        {assessment.date.split(' ')[1]}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{assessment.type}</p>
                      <p className="text-xs text-muted-foreground">{assessment.players}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Season Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Season Development Timeline</CardTitle>
          <CardDescription>Long-term planning and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-6">
              {[
                { phase: "Pre-Season", status: "completed", focus: "Fitness & Fundamentals", date: "Aug-Sep" },
                { phase: "Early Season", status: "completed", focus: "System Implementation", date: "Oct-Nov" },
                { phase: "Mid-Season", status: "active", focus: "Performance Optimization", date: "Dec-Jan" },
                { phase: "Late Season", status: "upcoming", focus: "Playoff Preparation", date: "Feb-Mar" },
                { phase: "Playoffs", status: "upcoming", focus: "Peak Performance", date: "Apr-May" }
              ].map((phase, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center z-10 bg-background",
                    phase.status === 'completed' && 'bg-green-100',
                    phase.status === 'active' && 'bg-blue-100',
                    phase.status === 'upcoming' && 'bg-gray-100'
                  )}>
                    {phase.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {phase.status === 'active' && <Zap className="h-4 w-4 text-blue-600" />}
                    {phase.status === 'upcoming' && <Clock className="h-4 w-4 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{phase.phase}</p>
                        <p className="text-sm text-muted-foreground">{phase.focus}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{phase.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full">{/* Removed padding and max-width since it's handled by parent */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Management
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Snowflake className="h-4 w-4" />
            Training Plans
          </TabsTrigger>
          <TabsTrigger value="games" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Games & Tactics
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Development
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          {renderTeamManagementTab()}
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          {renderTrainingPlansTab()}
        </TabsContent>

        <TabsContent value="games" className="mt-6">
          {renderGamesTab()}
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          {renderStatisticsTab()}
        </TabsContent>

        <TabsContent value="development" className="mt-6">
          {renderDevelopmentTab()}
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