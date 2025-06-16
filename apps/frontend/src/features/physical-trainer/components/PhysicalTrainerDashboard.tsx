'use client';

import React, { useState } from 'react';
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import trainingSessionViewerReducer, { 
  setTeam, 
  setTeamName, 
  setSessionCategory, 
  setDisplayMode,
  setIntervals
} from '../../trainingSessionViewer/trainingSessionViewerSlice';
import { apiSlice } from '@/store/api/apiSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Activity, Calendar, Users, TrendingUp, Dumbbell, Clock, 
  Play, Library, TestTube2, BarChart3, User, FileText,
  Plus, ChevronRight, Timer, Heart, Zap, AlertCircle,
  CheckCircle2, ArrowUp, ArrowDown, Minus, ArrowLeft
} from 'lucide-react';
// Temporarily commenting out imports that don't exist yet
// import { useTestData } from '../hooks/useTestData';
// import PhysicalAnalysisCharts from '../../statistics-service/physical-analysis/PhysicalAnalysisCharts';
import PhysicalTestingForm from './PhysicalTestingForm';
import LaunchSessionButton from '../../trainingSessionViewer/LaunchSessionButton';
import TrainingSessionViewer from '../../trainingSessionViewer/TrainingSessionViewer';
// import TestCollectionDashboard from '../../statistics-service/physical-analysis/TestCollectionDashboard';

// Create store for session viewer with RTK-Query middleware - moved outside component
const sessionViewerStore = configureStore({
  reducer: {
    trainingSessionViewer: trainingSessionViewerReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Mock data for now
const mockTestData = {
  players: [
    { id: '1', name: 'Erik Andersson', number: 15, position: 'Forward' },
    { id: '2', name: 'Marcus Lindberg', number: 7, position: 'Defenseman' },
    { id: '3', name: 'Viktor Nilsson', number: 23, position: 'Goalie' }
  ],
  testBatches: [
    { id: 1, name: 'Pre-Season 2024', date: '2024-01-15', completedTests: 45, totalTests: 50 }
  ],
  testResults: []
};

export default function PhysicalTrainerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSessionViewer, setShowSessionViewer] = useState(false);
  const [currentSession, setCurrentSession] = useState<{ team: string; type: string; teamId: string } | null>(null);
  
  // Use mock data instead of hook for now
  const { players, testBatches, testResults } = mockTestData;

  // Helper function to launch session with proper Redux state
  const launchSession = (session: any) => {
    // Set the session data
    setCurrentSession({ 
      team: session.team, 
      type: session.type,
      teamId: session.id.toString()
    });
    
    // Dispatch Redux actions to set the team and display mode
    sessionViewerStore.dispatch(setTeamName(session.team));
    sessionViewerStore.dispatch(setTeam(session.id.toString()));
    sessionViewerStore.dispatch(setSessionCategory(session.type));
    
    // Route to appropriate display mode based on session type
    if (session.type === 'Strength Training') {
      sessionViewerStore.dispatch(setDisplayMode('strength-training'));
    } else if (session.type === 'Cardio Intervals') {
      // Set intervals for 8x4min with 2min rest
      const cardioIntervals = [];
      for (let i = 0; i < 8; i++) {
        cardioIntervals.push({ phase: 'work' as const, duration: 240 }); // 4 minutes work
        if (i < 7) { // Don't add rest after the last work interval
          cardioIntervals.push({ phase: 'rest' as const, duration: 120 }); // 2 minutes rest
        }
      }
      sessionViewerStore.dispatch(setIntervals(cardioIntervals));
      sessionViewerStore.dispatch(setDisplayMode('interval-timer')); // Show interval interface with team roster
    } else {
      sessionViewerStore.dispatch(setDisplayMode('player-list'));
    }
    
    setShowSessionViewer(true);
  };

  // Today's sessions mock data
  const todaysSessions = [
    {
      id: 3,
      time: '07:30',
      team: 'A-Team',
      type: 'Recovery Session',
      location: 'Gym',
      players: 22,
      status: 'completed',
      intensity: 'low',
      description: 'Active recovery & mobility'
    },
    {
      id: 2,
      time: '09:00',
      team: 'J20 Team',
      type: 'Strength Training',
      location: 'Weight Room',
      players: 18,
      status: 'active',
      intensity: 'high',
      description: 'Olympic lifts & plyometrics'
    },
    {
      id: 1,
      time: '11:00',
      team: 'A-Team',
      type: 'Cardio Intervals',
      location: 'Field',
      players: 20,
      status: 'upcoming',
      intensity: 'high',
      description: 'High-intensity interval training'
    },
    {
      id: 4,
      time: '14:00',
      team: 'U18 Team',
      type: 'Speed & Agility',
      location: 'Field',
      players: 16,
      status: 'upcoming',
      intensity: 'medium',
      description: 'Sprint drills & ladder work'
    },
    {
      id: 5,
      time: '15:30',
      team: 'U16 Team',
      type: 'Power Development',
      location: 'Weight Room',
      players: 14,
      status: 'upcoming',
      intensity: 'medium',
      description: 'Explosive power training'
    },
    {
      id: 6,
      time: '17:00',
      team: 'Individual',
      type: 'Sprint Training',
      location: 'Track',
      players: 3,
      status: 'upcoming',
      intensity: 'high',
      description: 'Individual sprint intervals'
    }
  ];

  // Player readiness data
  const playerReadiness = [
    { id: 1, name: 'Erik Andersson', status: 'ready', load: 85, fatigue: 'low', trend: 'up' },
    { id: 2, name: 'Marcus Lindberg', status: 'caution', load: 95, fatigue: 'medium', trend: 'stable' },
    { id: 3, name: 'Viktor Nilsson', status: 'rest', load: 110, fatigue: 'high', trend: 'down' },
    { id: 4, name: 'Johan Bergström', status: 'ready', load: 78, fatigue: 'low', trend: 'up' },
    { id: 5, name: 'Anders Johansson', status: 'caution', load: 92, fatigue: 'medium', trend: 'stable' }
  ];

  // Exercise library stats
  const exerciseLibraryStats = {
    total: 247,
    byCategory: {
      strength: 85,
      conditioning: 62,
      agility: 45,
      mobility: 35,
      recovery: 20
    },
    recentlyAdded: 12,
    withVideos: 198
  };

  // Session templates
  const sessionTemplates = [
    { id: 1, name: 'Pre-Season Strength', category: 'Strength', duration: 60, exercises: 8, lastUsed: '2 days ago' },
    { id: 2, name: 'In-Season Maintenance', category: 'Mixed', duration: 45, exercises: 6, lastUsed: '1 week ago' },
    { id: 3, name: 'Recovery Protocol', category: 'Recovery', duration: 30, exercises: 5, lastUsed: 'Yesterday' },
    { id: 4, name: 'Speed Development', category: 'Speed', duration: 50, exercises: 7, lastUsed: '3 days ago' }
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysSessions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todaysSessions.reduce((acc, s) => acc + s.players, 0)} total players
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todaysSessions.filter(s => s.status === 'active').reduce((acc, s) => acc + s.players, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {todaysSessions.find(s => s.status === 'active')?.team || 'No active session'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Player Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">78%</div>
              <Badge variant="outline" className="text-xs">
                <ArrowUp className="h-3 w-3 mr-1" />
                +5%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Team average</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todaysSessions.filter(s => s.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {todaysSessions.filter(s => s.status === 'upcoming').length} upcoming
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Sessions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Today's Training Sessions</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todaysSessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold">{session.time}</div>
                    <div className="text-xs text-muted-foreground">{session.location}</div>
                  </div>
                  <div className={cn(
                    "h-12 w-1 rounded-full",
                    session.status === 'active' ? 'bg-green-500' : 
                    session.status === 'completed' ? 'bg-gray-500' : 'bg-gray-300'
                  )} />
                  <div>
                    <div className="font-medium">{session.type}</div>
                    <div className="text-sm text-muted-foreground">{session.team}</div>
                    {session.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">{session.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={
                    session.intensity === 'high' ? 'destructive' : 
                    session.intensity === 'medium' ? 'default' : 'secondary'
                  }>
                    {session.intensity} intensity
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {session.players}
                  </div>
                  {session.status === 'completed' ? (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : session.status === 'active' ? (
                    <LaunchSessionButton
                      sessionType="team"
                      teamId={session.id.toString()}
                      teamName={session.team}
                      sessionCategory={session.type}
                      size="sm"
                      onLaunch={() => launchSession(session)}
                    />
                  ) : (
                    <LaunchSessionButton
                      sessionType="team"
                      teamId={session.id.toString()}
                      teamName={session.team}
                      sessionCategory={session.type}
                      size="sm"
                      variant="outline"
                      onLaunch={() => launchSession(session)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player Readiness Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Player Readiness Status</CardTitle>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {playerReadiness.slice(0, 5).map(player => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    player.status === 'ready' ? 'bg-green-100' : 
                    player.status === 'caution' ? 'bg-amber-100' : 'bg-red-100'
                  )}>
                    {player.status === 'ready' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : player.status === 'caution' ? (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Training load: {player.load}% | Fatigue: {player.fatigue}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {player.trend === 'up' ? (
                      <ArrowUp className="h-3 w-3 mr-1 text-green-600" />
                    ) : player.trend === 'down' ? (
                      <ArrowDown className="h-3 w-3 mr-1 text-red-600" />
                    ) : (
                      <Minus className="h-3 w-3 mr-1" />
                    )}
                    {player.trend}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTrainingSessionsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Training Session Management</CardTitle>
              <CardDescription>Create, schedule and manage physical training sessions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Session
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Session builder interface would go here */}
          <div className="h-96 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Session builder interface</p>
              <p className="text-sm text-muted-foreground">Drag and drop exercises, set intensity based on test data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExerciseLibraryTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Exercise Library</CardTitle>
              <CardDescription>Manage your exercise database with videos and instructions</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {Object.entries(exerciseLibraryStats.byCategory).map(([category, count]) => (
              <Card key={category}>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground capitalize">{category} exercises</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <Library className="h-3 w-3 mr-1" />
                {exerciseLibraryStats.total} total exercises
              </Badge>
              <Badge variant="outline">
                <Play className="h-3 w-3 mr-1" />
                {exerciseLibraryStats.withVideos} with videos
              </Badge>
            </div>
            <Input 
              placeholder="Search exercises..." 
              className="max-w-sm"
            />
          </div>

          {/* Exercise list would go here */}
          <div className="h-64 border rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Exercise list with filters and search</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTestingTab = () => (
    <div className="space-y-6">
      <Tabs defaultValue="collection" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collection">Test Collection</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="form">New Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="collection" className="mt-6">
          {/* TestCollectionDashboard would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Test Collection Dashboard</CardTitle>
              <CardDescription>Recent test sessions and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 border rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TestTube2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Test collection interface</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-6">
          {/* PhysicalAnalysisCharts would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>Charts and analytics for test results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 border rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Analysis charts interface</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="form" className="mt-6">
          <PhysicalTestingForm 
            players={players}
            onSubmit={(data) => console.log('Test data submitted:', data)}
            onSaveDraft={(data) => console.log('Draft saved:', data)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderPlayerStatusTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Player Physical Status Overview</CardTitle>
          <CardDescription>Monitor training load, recovery, and readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playerReadiness.map(player => (
              <Card key={player.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        player.status === 'ready' ? 'bg-green-100' : 
                        player.status === 'caution' ? 'bg-amber-100' : 'bg-red-100'
                      )}>
                        {player.status === 'ready' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : player.status === 'caution' ? (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Status: {player.status} | Fatigue: {player.fatigue}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Training Load</span>
                      <span className="font-medium">{player.load}%</span>
                    </div>
                    <Progress value={player.load} className="h-2" />
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-xs text-muted-foreground">HR Variability</div>
                        <div className="text-sm font-medium">Normal</div>
                      </div>
                      <div className="text-center">
                        <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-xs text-muted-foreground">Power Output</div>
                        <div className="text-sm font-medium">95%</div>
                      </div>
                      <div className="text-center">
                        <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-xs text-muted-foreground">Recovery</div>
                        <div className="text-sm font-medium">Good</div>
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

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Session Templates</CardTitle>
              <CardDescription>Pre-built training sessions for different objectives</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {sessionTemplates.map(template => (
              <Card key={template.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="outline" className="mt-1">{template.category}</Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span>{template.duration} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exercises</span>
                      <span>{template.exercises}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last used</span>
                      <span>{template.lastUsed}</span>
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

  // If showing session viewer, render it instead of the dashboard
  if (showSessionViewer) {
    return (
      <Provider store={sessionViewerStore}>
        <div className="h-screen flex flex-col">
          <div className="border-b px-4 py-3 flex items-center justify-between bg-background">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSessionViewer(false);
                  setCurrentSession(null);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              {currentSession && (
                <div className="text-sm text-muted-foreground">
                  {currentSession.type} • {currentSession.team}
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Training Session Viewer
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <TrainingSessionViewer />
          </div>
        </div>
      </Provider>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Physical Training Dashboard"
        subtitle="Manage training sessions, monitor player readiness, and track performance"
        role="physicaltrainer"
      />
      <div className="p-6 max-w-7xl mx-auto">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Training Sessions
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Exercise Library
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube2 className="h-4 w-4" />
            Testing & Analytics
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Player Status
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          {renderTrainingSessionsTab()}
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          {renderExerciseLibraryTab()}
        </TabsContent>

        <TabsContent value="testing" className="mt-6">
          {renderTestingTab()}
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          {renderPlayerStatusTab()}
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          {renderTemplatesTab()}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
} 