"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Plus,
  Calendar,
  CalendarDays,
  Clock,
  User,
  Activity,
  TrendingUp,
  FileText,
  ChevronRight,
  Search,
  X,
  Target
} from "lucide-react";

interface DailySession {
  id: string;
  playerId: string;
  playerName: string;
  injuryId?: string;
  injuryType?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  sessionType: 'rehabilitation' | 'assessment' | 'maintenance' | 'evaluation' | 'ice-training' | 'physical-training';
  exercises: Exercise[];
  painLevel?: {
    before: number; // 0-10 scale
    after: number;
  };
  notes: string;
  staffMember: string;
  nextSession?: string;
  status: 'completed' | 'partial' | 'cancelled';
  // Training specific fields
  trainingIntensity?: 'light' | 'moderate' | 'high' | 'max';
  coachNotes?: string;
  performanceRating?: number; // 1-10 scale
}

// Training session interface for ice and physical training
interface TrainingSession {
  id: string;
  playerId: string;
  playerName: string;
  date: string;
  sessionType: 'ice-training' | 'physical-training';
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  activities: TrainingActivity[];
  intensity: 'light' | 'moderate' | 'high' | 'max';
  coach: string;
  performanceRating?: number;
  notes: string;
  attendance: 'present' | 'absent' | 'late' | 'partial';
}

interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: number; // minutes
  intensity: 'low' | 'moderate' | 'high';
  equipment?: string;
  notes?: string;
  completed: boolean;
}

interface TrainingActivity {
  id: string;
  name: string;
  category: 'skating' | 'shooting' | 'passing' | 'drills' | 'scrimmage' | 'strength' | 'cardio' | 'agility' | 'conditioning';
  duration?: number; // minutes
  intensity: 'light' | 'moderate' | 'high' | 'max';
  description?: string;
  playerPerformance?: number; // 1-10 rating
  completed: boolean;
}

const COMMON_EXERCISES = [
  { name: "Range of Motion - Knee Extension", category: "mobility" },
  { name: "Range of Motion - Knee Flexion", category: "mobility" },
  { name: "Quadriceps Strengthening", category: "strength" },
  { name: "Hamstring Strengthening", category: "strength" },
  { name: "Balance Training", category: "stability" },
  { name: "Proprioception Exercises", category: "stability" },
  { name: "Gait Training", category: "functional" },
  { name: "Plyometric Drills", category: "functional" },
  { name: "Sport-Specific Movements", category: "functional" },
  { name: "Manual Therapy", category: "treatment" },
  { name: "Soft Tissue Mobilization", category: "treatment" },
  { name: "Joint Mobilization", category: "treatment" }
];

// Mock training sessions data
const mockTrainingSessions: TrainingSession[] = [
  {
    id: "t1",
    playerId: "15",
    playerName: "Erik Andersson (#15)",
    date: "2024-06-08",
    sessionType: "physical-training",
    title: "Lower Body Strength & Conditioning",
    startTime: "16:00",
    endTime: "17:30",
    duration: 90,
    activities: [
      {
        id: "a1",
        name: "Squats",
        category: "strength",
        duration: 20,
        intensity: "moderate",
        description: "3 sets x 12 reps at 70% 1RM",
        playerPerformance: 7,
        completed: true
      },
      {
        id: "a2", 
        name: "Agility Ladder",
        category: "agility",
        duration: 15,
        intensity: "high",
        description: "Various footwork patterns",
        playerPerformance: 8,
        completed: true
      }
    ],
    intensity: "moderate",
    coach: "Physical Trainer Mike Johnson",
    performanceRating: 8,
    notes: "Good effort, avoided any knee stress. Cleared for progression next week.",
    attendance: "present"
  },
  {
    id: "t2",
    playerId: "7",
    playerName: "Marcus Lindberg (#7)",
    date: "2024-06-09",
    sessionType: "ice-training",
    title: "Skills & Light Skating",
    startTime: "10:00",
    endTime: "11:00", 
    duration: 60,
    activities: [
      {
        id: "a3",
        name: "Light Skating",
        category: "skating",
        duration: 30,
        intensity: "light",
        description: "Easy pace, no sudden direction changes",
        playerPerformance: 9,
        completed: true
      },
      {
        id: "a4",
        name: "Stick Handling",
        category: "drills",
        duration: 20,
        intensity: "light",
        description: "Stationary puck control drills",
        playerPerformance: 8,
        completed: true
      }
    ],
    intensity: "light",
    coach: "Coach Erik Vikström",
    performanceRating: 9,
    notes: "No issues with hamstring. Able to participate in light activities without discomfort.",
    attendance: "present"
  },
  {
    id: "t3",
    playerId: "23",
    playerName: "Viktor Nilsson (#23)",
    date: "2024-06-07",
    sessionType: "physical-training",
    title: "Return to Activity - Light Training",
    startTime: "14:00",
    endTime: "14:45",
    duration: 45,
    activities: [
      {
        id: "a5",
        name: "Stationary Bike",
        category: "cardio",
        duration: 20,
        intensity: "light",
        description: "Low intensity cardiovascular work",
        playerPerformance: 6,
        completed: true
      },
      {
        id: "a6",
        name: "Balance Training",
        category: "agility", 
        duration: 15,
        intensity: "light",
        description: "Basic balance and coordination exercises",
        playerPerformance: 7,
        completed: true
      }
    ],
    intensity: "light",
    coach: "Physical Trainer Sarah Wilson",
    performanceRating: 7,
    notes: "Completed light activity as part of concussion protocol. No symptoms reported during or after exercise.",
    attendance: "present"
  }
];

// Convert training sessions to daily sessions format for unified display
const convertTrainingToDailySession = (training: TrainingSession): DailySession => ({
  id: training.id,
  playerId: training.playerId,
  playerName: training.playerName,
  date: training.date,
  startTime: training.startTime,
  endTime: training.endTime,
  duration: training.duration,
  sessionType: training.sessionType,
  exercises: training.activities.map(activity => ({
    id: activity.id,
    name: activity.name,
    duration: activity.duration,
    intensity: activity.intensity === 'max' ? 'high' : activity.intensity as 'low' | 'moderate' | 'high',
    notes: activity.description,
    completed: activity.completed
  })),
  notes: training.notes,
  staffMember: training.coach,
  status: training.attendance === 'present' ? 'completed' : 'partial',
  trainingIntensity: training.intensity,
  performanceRating: training.performanceRating,
  coachNotes: training.notes
});

// Mock rehabilitation sessions data
const mockSessions: DailySession[] = [
  {
    id: "1",
    playerId: "15",
    playerName: "Erik Andersson (#15)",
    injuryId: "1",
    injuryType: "ACL Tear - Right Knee",
    date: "2024-06-09",
    startTime: "14:00",
    endTime: "15:30",
    duration: 90,
    sessionType: "rehabilitation",
    exercises: [
      {
        id: "1",
        name: "Range of Motion - Knee Extension",
        sets: 3,
        reps: 15,
        intensity: "moderate",
        equipment: "Exercise mat",
        completed: true
      },
      {
        id: "2", 
        name: "Quadriceps Strengthening",
        sets: 3,
        reps: 12,
        intensity: "moderate",
        equipment: "Resistance band",
        completed: true
      }
    ],
    painLevel: { before: 4, after: 3 },
    notes: "Good progress on ROM. Patient reports less stiffness. Continue current protocol.",
    staffMember: "Dr. Sarah Johnson",
    nextSession: "2024-06-11",
    status: "completed"
  },
  {
    id: "2",
    playerId: "7",
    playerName: "Marcus Lindberg (#7)",
    injuryId: "2", 
    injuryType: "Hamstring Strain - Grade 2",
    date: "2024-06-09",
    startTime: "10:00",
    endTime: "11:00",
    duration: 60,
    sessionType: "rehabilitation",
    exercises: [
      {
        id: "3",
        name: "Hamstring Strengthening",
        sets: 2,
        reps: 10,
        intensity: "low",
        equipment: "Resistance band",
        completed: true
      }
    ],
    painLevel: { before: 2, after: 1 },
    notes: "Minimal discomfort. Ready to progress to moderate intensity next session.",
    staffMember: "Physical Therapist Lisa Chen",
    nextSession: "2024-06-10",
    status: "completed"
  }
];

export function DailySessionsManager() {
  // Combine rehabilitation sessions with training sessions
  const combinedSessions = [
    ...mockSessions,
    ...mockTrainingSessions.map(convertTrainingToDailySession)
  ].sort((a, b) => new Date(b.date + ' ' + b.startTime).getTime() - new Date(a.date + ' ' + a.startTime).getTime());

  const [sessions, setSessions] = useState<DailySession[]>(combinedSessions);
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState<DailySession | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>("all");
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>("all");

  // Get unique players for the dropdown
  const uniquePlayers = Array.from(new Set(sessions.map(session => session.playerName)))
    .sort()
    .map(name => ({
      name,
      id: sessions.find(s => s.playerName === name)?.playerId || '',
      recentActivity: sessions.filter(s => s.playerName === name).length
    }));

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchTerm === "" || (
      session.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.injuryType && session.injuryType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      session.staffMember.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesDate = !filterDate || session.date === filterDate;
    const matchesType = sessionTypeFilter === "all" || 
                       (sessionTypeFilter === "rehabilitation" && ['rehabilitation', 'assessment', 'maintenance', 'evaluation'].includes(session.sessionType)) ||
                       (sessionTypeFilter === "training" && ['ice-training', 'physical-training'].includes(session.sessionType)) ||
                       session.sessionType === sessionTypeFilter;
    const matchesPlayer = selectedPlayerFilter === "all" || session.playerName === selectedPlayerFilter;
    return matchesSearch && matchesDate && matchesType && matchesPlayer;
  });

  const todaysDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const weekAgoDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }, []);

  const todaysSessions = filteredSessions.filter(session => 
    session.date === todaysDate
  );

  const recentSessions = filteredSessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate >= weekAgoDate;
  });

  const getPainLevelColor = (level: number) => {
    if (level <= 2) return "text-green-600 bg-green-100";
    if (level <= 5) return "text-yellow-600 bg-yellow-100"; 
    if (level <= 7) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'rehabilitation': return "bg-blue-100 text-blue-800";
      case 'assessment': return "bg-purple-100 text-purple-800";
      case 'maintenance': return "bg-green-100 text-green-800";
      case 'evaluation': return "bg-amber-100 text-amber-800";
      case 'ice-training': return "bg-cyan-100 text-cyan-800";
      case 'physical-training': return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'rehabilitation': return "Rehabilitation";
      case 'assessment': return "Assessment";
      case 'maintenance': return "Maintenance";
      case 'evaluation': return "Evaluation";
      case 'ice-training': return "Ice Training";
      case 'physical-training': return "Physical Training";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Daily Activity Tracking</h3>
          <p className="text-muted-foreground">Track rehabilitation sessions, physical training, and ice workouts</p>
        </div>
        <Button onClick={() => setShowNewSession(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Enhanced Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Find Player Activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Search for specific players to review their recent rehabilitation and training activities
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Player Quick Select */}
            <div>
              <Label htmlFor="player-filter">Select Player</Label>
              <Select value={selectedPlayerFilter} onValueChange={setSelectedPlayerFilter}>
                <SelectTrigger>
                  <SelectValue>
                    {selectedPlayerFilter === "all" ? "All players" : selectedPlayerFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  {uniquePlayers.map((player) => (
                    <SelectItem key={player.name} value={player.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{player.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({player.recentActivity} sessions)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enhanced Search */}
            <div>
              <Label htmlFor="search">Search Activities</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search notes, injuries, staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Session Type Filter */}
            <div>
              <Label htmlFor="session-type-filter">Activity Type</Label>
              <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
                <SelectTrigger>
                  <SelectValue>
                    {sessionTypeFilter === "all" ? "All activities" :
                     sessionTypeFilter === "rehabilitation" ? "Medical/Rehab" :
                     sessionTypeFilter === "training" ? "All Training" :
                     sessionTypeFilter === "ice-training" ? "Ice Training" :
                     sessionTypeFilter === "physical-training" ? "Physical Training" :
                     sessionTypeFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="rehabilitation">Medical/Rehab</SelectItem>
                  <SelectItem value="training">All Training</SelectItem>
                  <SelectItem value="ice-training">Ice Training</SelectItem>
                  <SelectItem value="physical-training">Physical Training</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div>
              <Label htmlFor="date-filter">Specific Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                placeholder="All dates"
              />
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedPlayerFilter("all");
                setSessionTypeFilter("rehabilitation");
                setFilterDate("");
              }}
            >
              <Activity className="h-4 w-4 mr-2" />
              Show Rehab Only
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedPlayerFilter("all");
                setSessionTypeFilter("training");
                setFilterDate("");
              }}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Show Training Only
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setFilterDate(weekAgoDate.toISOString().split('T')[0]);
                setSearchTerm("");
                setSelectedPlayerFilter("all");
                setSessionTypeFilter("all");
              }}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Last Week
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedPlayerFilter("all");
                setSessionTypeFilter("all");
                setFilterDate("");
              }}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {(selectedPlayerFilter !== "all" || searchTerm || sessionTypeFilter !== "all" || filterDate) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Search Results</h4>
                <p className="text-sm text-muted-foreground">
                  Found {filteredSessions.length} activities
                  {selectedPlayerFilter !== "all" && ` for ${selectedPlayerFilter}`}
                  {sessionTypeFilter !== "all" && ` (${sessionTypeFilter})`}
                  {filterDate && ` on ${filterDate}`}
                </p>
              </div>
              {filteredSessions.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No activities found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Activities ({todaysSessions.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent (7 days) ({recentSessions.length})</TabsTrigger>
          <TabsTrigger value="all">All Activities ({filteredSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todaysSessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {(selectedPlayerFilter !== "all" || sessionTypeFilter !== "all") 
                    ? "No activities found matching your search criteria for today" 
                    : "No activities scheduled for today"}
                </p>
                {(selectedPlayerFilter !== "all" || sessionTypeFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      setSelectedPlayerFilter("all");
                      setSessionTypeFilter("all");
                      setSearchTerm("");
                    }}
                  >
                    Clear filters to see all activities
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {todaysSessions.map((session) => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  onClick={() => setSelectedSession(session)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4">
            {recentSessions.map((session) => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onClick={() => setSelectedSession(session)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {filteredSessions.map((session) => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onClick={() => setSelectedSession(session)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Session Details Modal */}
      {selectedSession && (
        <SessionDetailsModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)}
        />
      )}

      {/* New Session Modal */}
      {showNewSession && (
        <NewSessionModal 
          onClose={() => setShowNewSession(false)}
          onSave={(newSession) => {
            setSessions(prev => [newSession, ...prev]);
            setShowNewSession(false);
          }}
        />
      )}
    </div>
  );
}

// Session Card Component
function SessionCard({ session, onClick }: { session: DailySession; onClick: () => void }) {
  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'rehabilitation': return "bg-blue-100 text-blue-800";
      case 'assessment': return "bg-purple-100 text-purple-800";
      case 'maintenance': return "bg-green-100 text-green-800";
      case 'evaluation': return "bg-amber-100 text-amber-800";
      case 'ice-training': return "bg-cyan-100 text-cyan-800";
      case 'physical-training': return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'rehabilitation': return "Rehabilitation";
      case 'assessment': return "Assessment";
      case 'maintenance': return "Maintenance";
      case 'evaluation': return "Evaluation";
      case 'ice-training': return "Ice Training";
      case 'physical-training': return "Physical Training";
      default: return type;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{session.playerName}</span>
                <Badge variant="outline" className={getSessionTypeColor(session.sessionType)}>
                  {getSessionTypeLabel(session.sessionType)}
                </Badge>
              </div>
              {session.injuryType ? (
                <p className="text-sm text-muted-foreground mt-1">{session.injuryType}</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">General training activity</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{session.duration} min</span>
            </div>
            
            {session.painLevel ? (
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pain: {session.painLevel.before}→{session.painLevel.after}</span>
              </div>
            ) : session.performanceRating ? (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Performance: {session.performanceRating}/10</span>
              </div>
            ) : null}
            
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {session.date} at {session.startTime}
          </span>
          <span className="text-sm font-medium">{session.staffMember}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Session Details Modal Component
function SessionDetailsModal({ session, onClose }: { session: DailySession; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session Details - {session.playerName}</DialogTitle>
          <DialogDescription>
            {session.injuryType || 'Training Activity'} • {session.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{session.duration}</p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{session.exercises.length}</p>
                  <p className="text-sm text-muted-foreground">Exercises</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold">{session.painLevel?.before || 0}→{session.painLevel?.after || 0}</p>
                  <p className="text-sm text-muted-foreground">Pain Level</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Badge className={cn("text-lg px-3 py-1", getSessionTypeColor(session.sessionType))}>
                    {session.sessionType}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">Session Type</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exercises */}
          <Card>
            <CardHeader>
              <CardTitle>Exercises Performed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.exercises.map((exercise) => (
                  <div key={exercise.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{exercise.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {exercise.sets && <span>{exercise.sets} sets</span>}
                        {exercise.reps && <span>{exercise.reps} reps</span>}
                        {exercise.duration && <span>{exercise.duration} min</span>}
                        <Badge variant="outline" className={
                          exercise.intensity === 'low' ? 'bg-green-100 text-green-800' :
                          exercise.intensity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {exercise.intensity}
                        </Badge>
                      </div>
                      {exercise.equipment && (
                        <p className="text-sm text-muted-foreground mt-1">Equipment: {exercise.equipment}</p>
                      )}
                    </div>
                    <Badge variant={exercise.completed ? "default" : "secondary"}>
                      {exercise.completed ? "Completed" : "Partial"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Session Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{session.notes}</p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Staff Member:</strong> {session.staffMember}
                </p>
                {session.nextSession && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Next Session:</strong> {session.nextSession}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// New Session Modal Component (simplified for now)
function NewSessionModal({ onClose, onSave }: { onClose: () => void; onSave: (session: DailySession) => void }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Rehabilitation Session</DialogTitle>
          <DialogDescription>
            Create a new session log entry
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">New session form will be implemented next</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get session type color
function getSessionTypeColor(type: string) {
  switch (type) {
    case 'rehabilitation': return "bg-blue-100 text-blue-800";
    case 'assessment': return "bg-purple-100 text-purple-800";
    case 'maintenance': return "bg-green-100 text-green-800";
    case 'evaluation': return "bg-amber-100 text-amber-800";
    default: return "bg-gray-100 text-gray-800";
  }
} 