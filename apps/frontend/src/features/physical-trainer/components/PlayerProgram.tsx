'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, User, Heart, Zap, Activity, Timer, 
  Dumbbell, Target, CheckCircle2, Clock
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  status: 'active' | 'rest' | 'injured';
  heartRate?: number;
  watts?: number;
  heartRateZone?: 1 | 2 | 3 | 4 | 5;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps?: number | string;
  weight?: string;
  duration?: number;
  rest: number;
  completed: boolean;
}

interface PlayerProgramProps {
  player: Player;
  onBack: () => void;
  className?: string;
}

// Mock program data - in real app, this would come from API
const MOCK_PROGRAM = {
  sessionName: 'Strength & Conditioning',
  phase: 'In-Season Maintenance',
  duration: 60,
  warmup: [
    { id: '1', name: 'Dynamic Stretching', duration: 5, completed: true },
    { id: '2', name: 'Activation Drills', duration: 5, completed: true },
  ],
  mainProgram: [
    { id: '3', name: 'Barbell Squats', sets: 4, reps: 8, weight: '80% 1RM', rest: 90, completed: true },
    { id: '4', name: 'Bench Press', sets: 4, reps: 10, weight: '75% 1RM', rest: 90, completed: true },
    { id: '5', name: 'Romanian Deadlifts', sets: 3, reps: 12, weight: '70% 1RM', rest: 60, completed: false },
    { id: '6', name: 'Pull-ups', sets: 3, reps: 'Max', weight: 'BW', rest: 60, completed: false },
    { id: '7', name: 'Core Circuit', sets: 3, duration: 45, rest: 30, completed: false },
  ],
  cooldown: [
    { id: '8', name: 'Static Stretching', duration: 10, completed: false },
  ],
};

export default function PlayerProgram({ player, onBack, className }: PlayerProgramProps) {
  const completedExercises = MOCK_PROGRAM.mainProgram.filter(ex => ex.completed).length;
  const totalExercises = MOCK_PROGRAM.mainProgram.length;
  const progress = (completedExercises / totalExercises) * 100;

  const getZoneColor = (zone?: number) => {
    if (!zone) return '';
    const colors = {
      1: 'text-blue-600 bg-blue-100',
      2: 'text-green-600 bg-green-100',
      3: 'text-yellow-600 bg-yellow-100',
      4: 'text-orange-600 bg-orange-100',
      5: 'text-red-600 bg-red-100',
    };
    return colors[zone as keyof typeof colors] || '';
  };

  return (
    <div className={cn("h-full flex flex-col p-8", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-12 w-12"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold">{player.number}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{player.name}</h1>
              <p className="text-lg text-muted-foreground">{player.position}</p>
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        {player.status === 'active' && (
          <div className="flex items-center gap-6">
            {player.heartRate && (
              <Card>
                <CardContent className="pt-4 px-6">
                  <div className="flex items-center gap-3">
                    <Heart className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{player.heartRate}</p>
                      <p className="text-sm text-muted-foreground">bpm</p>
                    </div>
                    {player.heartRateZone && (
                      <Badge className={cn("ml-2", getZoneColor(player.heartRateZone))}>
                        Zone {player.heartRateZone}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {player.watts && (
              <Card>
                <CardContent className="pt-4 px-6">
                  <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{player.watts}</p>
                      <p className="text-sm text-muted-foreground">watts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Program Overview */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{MOCK_PROGRAM.sessionName}</CardTitle>
              <CardDescription>{MOCK_PROGRAM.phase}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg">{MOCK_PROGRAM.duration} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg">{completedExercises}/{totalExercises} completed</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Program Details */}
      <div className="flex-1 overflow-auto space-y-6">
        {/* Warmup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Warmup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_PROGRAM.warmup.map(exercise => (
                <div key={exercise.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {exercise.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={cn(
                      "font-medium",
                      exercise.completed && "line-through text-muted-foreground"
                    )}>
                      {exercise.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    {exercise.duration} min
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Program */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Main Program</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_PROGRAM.mainProgram.map((exercise, index) => (
                <div key={exercise.id} className={cn(
                  "p-4 border rounded-lg",
                  exercise.completed && "bg-muted/50"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        exercise.completed ? "bg-green-600 text-white" : "bg-gray-200"
                      )}>
                        {exercise.completed ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                      </div>
                      <h4 className="text-lg font-semibold">{exercise.name}</h4>
                    </div>
                    <Badge variant={exercise.completed ? "secondary" : "default"}>
                      {exercise.completed ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground ml-11">
                    <div className="flex items-center gap-1">
                      <Dumbbell className="h-4 w-4" />
                      {exercise.sets} sets
                      {exercise.reps && ` × ${exercise.reps}`}
                      {exercise.weight && ` @ ${exercise.weight}`}
                    </div>
                    {exercise.duration && (
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        {exercise.duration}s
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Rest: {exercise.rest}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cooldown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Cooldown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_PROGRAM.cooldown.map(exercise => (
                <div key={exercise.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {exercise.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={cn(
                      "font-medium",
                      exercise.completed && "line-through text-muted-foreground"
                    )}>
                      {exercise.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    {exercise.duration} min
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}