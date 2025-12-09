'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, MapPin, Users, Dumbbell, Heart, AlertCircle, CheckCircle, Circle, CheckCircle2, Timer, Target, Activity } from '@/components/icons';
import { cn } from "@/lib/utils";
import type { TodaySession } from '../types';

interface SessionBriefingViewProps {
  session: TodaySession;
  players: any[];
  onBack: () => void;
}

// Mock workout data for different session types
const mockWorkouts: Record<string, any> = {
  'session-001': { // Max Strength Testing
    name: 'Max Strength Testing Protocol',
    type: 'strength',
    warmup: {
      duration: 10,
      exercises: [
        'Dynamic stretching - 3 minutes',
        'Arm circles and leg swings - 2 minutes',
        'Light barbell warm-up - 5 minutes'
      ]
    },
    mainWorkout: {
      exercises: [
        {
          name: 'Back Squat 1RM Test',
          sets: 'Work up to 1RM',
          reps: '5-3-2-1-1-1',
          rest: '3-5 minutes',
          notes: 'Start at 50%, increase by 10-20kg per set'
        },
        {
          name: 'Bench Press 1RM Test',
          sets: 'Work up to 1RM',
          reps: '5-3-2-1-1-1',
          rest: '3-5 minutes',
          notes: 'Ensure spotter present'
        },
        {
          name: 'Deadlift 1RM Test',
          sets: 'Work up to 1RM',
          reps: '5-3-2-1-1',
          rest: '5 minutes',
          notes: 'Reset between each rep'
        }
      ]
    },
    cooldown: {
      duration: 10,
      exercises: [
        'Static stretching - 5 minutes',
        'Foam rolling - 5 minutes'
      ]
    }
  },
  'session-002': { // VO2 Max Intervals
    name: 'VO2 Max Interval Training',
    type: 'conditioning',
    warmup: {
      duration: 15,
      exercises: [
        'Easy jog - 5 minutes',
        'Dynamic stretching - 5 minutes',
        'Progressive runs 60-70-80% - 5 minutes'
      ]
    },
    mainWorkout: {
      intervals: [
        {
          name: 'VO2 Max Intervals',
          rounds: 4,
          work: '4 minutes @ 90-95% Max HR',
          rest: '3 minutes @ 50% Max HR',
          target: 'Maintain 170-180 BPM during work'
        }
      ],
      totalDuration: 28
    },
    cooldown: {
      duration: 10,
      exercises: [
        'Easy jog - 5 minutes',
        'Walking - 3 minutes',
        'Static stretching - 2 minutes'
      ]
    }
  },
  'session-003': { // Elite Power Circuit
    name: 'Elite Power Development Circuit',
    type: 'hybrid',
    warmup: {
      duration: 12,
      exercises: [
        'Jump rope - 3 minutes',
        'Dynamic stretching - 4 minutes',
        'Medicine ball throws - 5 minutes'
      ]
    },
    mainWorkout: {
      blocks: [
        {
          name: 'Power Block',
          exercises: [
            { name: 'Box Jumps', sets: 4, reps: 5, rest: '90s' },
            { name: 'Medicine Ball Slams', sets: 4, reps: 8, rest: '60s' }
          ]
        },
        {
          name: 'Conditioning Block',
          duration: 10,
          description: 'Bike intervals: 30s sprint / 30s recovery x 10'
        },
        {
          name: 'Strength-Endurance Block',
          exercises: [
            { name: 'Kettlebell Swings', sets: 3, reps: 20, rest: '45s' },
            { name: 'Battle Ropes', sets: 3, reps: '30s', rest: '45s' }
          ]
        }
      ]
    },
    cooldown: {
      duration: 8,
      exercises: [
        'Light rowing - 3 minutes',
        'Stretching - 5 minutes'
      ]
    }
  }
};

// Mock player workout assignments
const mockPlayerWorkouts: Record<string, Record<string, any>> = {
  'session-001': {
    '1': { squat: '180kg target', bench: '120kg target', deadlift: '200kg target' },
    '2': { squat: '160kg target', bench: '100kg target', deadlift: '180kg target' },
    '3': { squat: '140kg target', bench: '90kg target', deadlift: '160kg target' },
    '5': { squat: '150kg target', bench: '95kg target', deadlift: '170kg target' }
  },
  'session-002': {
    '1': { targetHR: '175-180 BPM', pace: '4:00/km', notes: 'Monitor closely - returning from injury' },
    '4': { targetHR: '170-175 BPM', pace: '4:15/km', notes: 'Good conditioning base' },
    '6': { targetHR: '165-170 BPM', pace: '4:30/km', notes: 'Build gradually' }
  },
  'session-003': {
    '2': { boxHeight: '24 inch', bikeWatts: '350W', notes: 'Focus on landing mechanics' },
    '3': { boxHeight: '20 inch', bikeWatts: '300W', notes: 'Explosive power development' },
    '5': { boxHeight: '24 inch', bikeWatts: '325W', notes: 'Maintain form throughout' }
  }
};

export default function SessionBriefingView({ session, players, onBack }: SessionBriefingViewProps) {
  const { t } = useTranslation('physicalTrainer');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  // Get workout data for this session
  const workout = mockWorkouts[session.id] || mockWorkouts['session-001'];
  const playerWorkouts = mockPlayerWorkouts[session.id] || {};
  
  // Get players with workout status
  const playersWithStatus = useMemo(() => {
    return players.map(player => ({
      ...player,
      hasWorkout: !!playerWorkouts[player.id],
      workoutDetails: playerWorkouts[player.id]
    }));
  }, [players, playerWorkouts]);
  
  const assignedCount = Object.keys(playerWorkouts).length;
  const unassignedCount = players.length - assignedCount;
  
  const getPositionAbbr = (position: string) => {
    switch(position.toLowerCase()) {
      case 'forward': return 'F';
      case 'defense': return 'D';
      case 'goalie': return 'G';
      default: return position.charAt(0);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'injured':
        return <Heart className="h-3 w-3 text-red-500" />;
      case 'limited':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      default:
        return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{session.team} - Session Briefing</h1>
                <p className="text-sm text-muted-foreground">
                  {t(`training.sessionTypes.${session.type}`)} • {session.time} • {t(`training.locations.${session.location}`)}
                </p>
              </div>
            </div>
            <Badge 
              variant={
                session.intensity === 'high' ? 'destructive' : 
                session.intensity === 'medium' ? 'default' : 'secondary'
              }
              className="text-lg px-4 py-2"
            >
              {t(`training.intensity.${session.intensity}`)} Intensity
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Session Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{session.duration || 90}</p>
                    <p className="text-sm text-muted-foreground">Minutes</p>
                  </div>
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{session.players}</p>
                    <p className="text-sm text-muted-foreground">Players</p>
                  </div>
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-lg font-bold">{t(`training.locations.${session.location}`)}</p>
                    <p className="text-sm text-muted-foreground">Location</p>
                  </div>
                  <div className="text-center">
                    <Dumbbell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-lg font-bold">{t(`training.sessionTypes.${session.type}`)}</p>
                    <p className="text-sm text-muted-foreground">Type</p>
                  </div>
                </div>
                {session.description && (
                  <p className="mt-4 text-sm text-muted-foreground border-t pt-4">
                    {session.description}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Workout Details */}
            <Card>
              <CardHeader>
                <CardTitle>{workout.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="warmup">Warm-up</TabsTrigger>
                    <TabsTrigger value="cooldown">Cool-down</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-4 space-y-4">
                    {workout.type === 'strength' && workout.mainWorkout.exercises && (
                      <div className="space-y-4">
                        {workout.mainWorkout.exercises.map((exercise: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">{exercise.name}</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Sets:</span> {exercise.sets}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Reps:</span> {exercise.reps}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Rest:</span> {exercise.rest}
                              </div>
                            </div>
                            {exercise.notes && (
                              <p className="mt-2 text-sm text-muted-foreground">{exercise.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {workout.type === 'conditioning' && workout.mainWorkout.intervals && (
                      <div className="space-y-4">
                        {workout.mainWorkout.intervals.map((interval: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">{interval.name}</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Rounds:</span> {interval.rounds}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total Time:</span> {workout.mainWorkout.totalDuration} min
                              </div>
                              <div>
                                <span className="text-muted-foreground">Work:</span> {interval.work}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Rest:</span> {interval.rest}
                              </div>
                            </div>
                            {interval.target && (
                              <p className="mt-2 text-sm text-muted-foreground">Target: {interval.target}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {workout.type === 'hybrid' && workout.mainWorkout.blocks && (
                      <div className="space-y-4">
                        {workout.mainWorkout.blocks.map((block: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">{block.name}</h4>
                            {block.exercises ? (
                              <div className="space-y-2">
                                {block.exercises.map((exercise: any, idx: number) => (
                                  <div key={idx} className="pl-4 text-sm">
                                    <span className="font-medium">{exercise.name}:</span> {exercise.sets}x{exercise.reps} - Rest {exercise.rest}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm">{block.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="warmup" className="mt-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-3">Duration: {workout.warmup.duration} minutes</p>
                      {workout.warmup.exercises.map((exercise: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm text-muted-foreground">{index + 1}.</span>
                          <span className="text-sm">{exercise}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="cooldown" className="mt-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-3">Duration: {workout.cooldown.duration} minutes</p>
                      {workout.cooldown.exercises.map((exercise: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm text-muted-foreground">{index + 1}.</span>
                          <span className="text-sm">{exercise}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Team Roster */}
          <div className="space-y-6">
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Roster
                  </CardTitle>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      {assignedCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Circle className="h-3 w-3 text-red-500" />
                      {unassignedCount}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs font-medium text-muted-foreground border-b sticky top-0 bg-card">
                      <div className="col-span-1">#</div>
                      <div className="col-span-5">Name</div>
                      <div className="col-span-2">Pos</div>
                      <div className="col-span-2 text-center">Ready</div>
                      <div className="col-span-2 text-right">Status</div>
                    </div>
                    
                    {/* Player rows */}
                    {playersWithStatus.map((player) => (
                      <div
                        key={player.id}
                        className={cn(
                          "grid grid-cols-12 gap-2 px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors rounded cursor-pointer",
                          selectedPlayer === player.id && "bg-accent",
                          player.status === 'injured' && "bg-red-50/50 hover:bg-red-50",
                          player.status === 'limited' && "bg-yellow-50/50 hover:bg-yellow-50"
                        )}
                        onClick={() => setSelectedPlayer(player.id)}
                      >
                        <div className="col-span-1 font-medium text-muted-foreground">
                          {player.number || '--'}
                        </div>
                        <div className="col-span-5 font-medium truncate">
                          {player.name}
                        </div>
                        <div className="col-span-2 text-muted-foreground">
                          {getPositionAbbr(player.position)}
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {player.hasWorkout ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          {getStatusIcon(player.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Selected Player Workout */}
            {selectedPlayer && playerWorkouts[selectedPlayer] && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Player Workout Details
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {playersWithStatus.find(p => p.id === selectedPlayer)?.name}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(playerWorkouts[selectedPlayer]).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}