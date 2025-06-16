"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dumbbell, Activity, Target, TrendingUp, Users, Calendar,
  Clock, CheckCircle2, AlertCircle, BarChart3, Plus, Edit,
  Heart, Zap, Timer, Award, User, FileText
} from "lucide-react";

export function PhysicalTrainerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for physical training
  const trainingStats = {
    activePrograms: 12,
    totalPlayers: 156,
    weeklySessionsCompleted: 48,
    averageFitnessScore: 78,
    injuryRate: 2.1,
    programCompletionRate: 89
  };

  const fitnessPrograms = [
    { 
      name: "Pre-Season Conditioning", 
      players: 25, 
      duration: "8 weeks", 
      progress: 75, 
      status: "active",
      nextSession: "Tomorrow 08:00"
    },
    { 
      name: "In-Season Maintenance", 
      players: 45, 
      duration: "Ongoing", 
      progress: 60, 
      status: "active",
      nextSession: "Today 16:00"
    },
    { 
      name: "Injury Prevention", 
      players: 32, 
      duration: "6 weeks", 
      progress: 40, 
      status: "active",
      nextSession: "Wednesday 10:00"
    },
    { 
      name: "Power Development", 
      players: 18, 
      duration: "4 weeks", 
      progress: 90, 
      status: "active",
      nextSession: "Friday 14:00"
    },
    { 
      name: "Endurance Training", 
      players: 28, 
      duration: "12 weeks", 
      progress: 25, 
      status: "active",
      nextSession: "Monday 09:00"
    }
  ];

  const playerAssessments = [
    { name: "Erik Lindqvist", team: "Senior A", fitnessScore: 92, lastTest: "2 days ago", status: "excellent" },
    { name: "Anna Svensson", team: "Senior A", fitnessScore: 88, lastTest: "1 week ago", status: "good" },
    { name: "Lars Andersson", team: "Junior A", fitnessScore: 75, lastTest: "3 days ago", status: "average" },
    { name: "Maria Johansson", team: "Junior A", fitnessScore: 82, lastTest: "5 days ago", status: "good" },
    { name: "Per Nilsson", team: "Youth U16", fitnessScore: 68, lastTest: "1 week ago", status: "needs_improvement" }
  ];

  const upcomingSessions = [
    { time: "08:00", program: "Pre-Season Conditioning", players: 25, location: "Gym A", type: "strength" },
    { time: "10:00", program: "Injury Prevention", players: 15, location: "Gym B", type: "mobility" },
    { time: "14:00", program: "Power Development", players: 18, location: "Gym A", type: "power" },
    { time: "16:00", program: "In-Season Maintenance", players: 22, location: "Gym C", type: "conditioning" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'needs_improvement': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-red-100 text-red-800';
      case 'conditioning': return 'bg-blue-100 text-blue-800';
      case 'power': return 'bg-purple-100 text-purple-800';
      case 'mobility': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats.activePrograms}</div>
            <p className="text-xs text-muted-foreground mt-1">Running programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground mt-1">Under training</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Weekly Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats.weeklySessionsCompleted}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+6 from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Fitness Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats.averageFitnessScore}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+3 points</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Injury Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats.injuryRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Below target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats.programCompletionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Program adherence</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Sessions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Today's Training Sessions</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingSessions.map((session, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">{session.time}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">{session.program}</h3>
                    <p className="text-sm text-muted-foreground">{session.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getTypeColor(session.type)}>
                    {session.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {session.players} players
                  </span>
                  <Button variant="outline" size="sm">
                    Start Session
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Player Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Player Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {playerAssessments.map((player, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{player.name}</h3>
                    <p className="text-sm text-muted-foreground">{player.team}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold">{player.fitnessScore}</p>
                    <p className="text-xs text-muted-foreground">Fitness Score</p>
                  </div>
                  <Badge className={getStatusColor(player.status)}>
                    {player.status.replace('_', ' ')}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{player.lastTest}</p>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProgramsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Training Programs</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fitnessPrograms.map((program, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{program.name}</h3>
                    <p className="text-sm text-muted-foreground">Duration: {program.duration}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {program.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Players</p>
                    <p className="font-medium">{program.players}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="font-medium">{program.progress}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Session</p>
                    <p className="font-medium">{program.nextSession}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <Progress value={program.progress} className="h-2" />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="h-3 w-3 mr-1" />
                    Manage Players
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    View Progress
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="programs">Programs</TabsTrigger>
        <TabsTrigger value="assessments">Assessments</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        {renderOverviewTab()}
      </TabsContent>

      <TabsContent value="programs">
        {renderProgramsTab()}
      </TabsContent>

      <TabsContent value="assessments">
        <Card>
          <CardHeader>
            <CardTitle>Player Fitness Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Assessment management features coming soon</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytics">
        <Card>
          <CardHeader>
            <CardTitle>Training Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Analytics dashboard coming soon</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 