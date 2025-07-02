'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dumbbell, 
  User, 
  CheckCircle2, 
  Circle,
  Play,
  Pause,
  RotateCw,
  ChevronRight,
  Timer,
  TrendingUp,
  AlertCircle,
  Edit2,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTrainingSocket } from '@/contexts/TrainingSocketContext';
import type { WorkoutSession, WorkoutExecution, Exercise } from '@hockey-hub/shared-lib';

interface StrengthSessionDashboardProps {
  session: WorkoutSession;
  executions: WorkoutExecution[];
  isTrainerView?: boolean;
}

interface PlayerProgress {
  playerId: string;
  playerName: string;
  playerNumber: number;
  currentExerciseIndex: number;
  currentSetNumber: number;
  completedSets: number;
  totalSets: number;
  completionPercentage: number;
  lastUpdate: Date;
  status: 'not_started' | 'in_progress' | 'resting' | 'completed';
  currentExercise?: Exercise;
  performanceData: {
    exerciseId: string;
    sets: Array<{
      setNumber: number;
      targetReps: number;
      actualReps?: number;
      targetWeight: number;
      actualWeight?: number;
      rpe?: number;
      completed: boolean;
    }>;
  }[];
}

export function StrengthSessionDashboard({ 
  session, 
  executions,
  isTrainerView = true 
}: StrengthSessionDashboardProps) {
  const { socket } = useTrainingSocket();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [playerProgress, setPlayerProgress] = useState<Record<string, PlayerProgress>>({});
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [editingLoad, setEditingLoad] = useState<{ playerId: string; exerciseId: string } | null>(null);
  const [loadModifications, setLoadModifications] = useState<Record<string, number>>({});

  // Initialize player progress
  useEffect(() => {
    const initialProgress: Record<string, PlayerProgress> = {};
    
    session.playerIds?.forEach((playerId, index) => {
      const playerExecution = executions.find(e => e.playerId === playerId);
      
      initialProgress[playerId] = {
        playerId,
        playerName: `Player ${index + 1}`, // In production, fetch from player data
        playerNumber: Math.floor(Math.random() * 99) + 1,
        currentExerciseIndex: playerExecution?.currentExerciseIndex || 0,
        currentSetNumber: playerExecution?.currentSetNumber || 1,
        completedSets: 0,
        totalSets: session.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0),
        completionPercentage: playerExecution?.completionPercentage || 0,
        lastUpdate: new Date(),
        status: playerExecution ? 'in_progress' : 'not_started',
        currentExercise: session.exercises[0],
        performanceData: session.exercises.map(exercise => ({
          exerciseId: exercise.id,
          sets: Array.from({ length: exercise.sets || 0 }, (_, i) => ({
            setNumber: i + 1,
            targetReps: exercise.reps || 0,
            targetWeight: exercise.targetWeight || 0,
            completed: false,
          })),
        })),
      };
    });
    
    setPlayerProgress(initialProgress);
    
    // Auto-select first player
    if (session.playerIds?.[0] && !selectedPlayerId) {
      setSelectedPlayerId(session.playerIds[0]);
    }
  }, [session, executions, selectedPlayerId]);

  // Listen for socket updates
  useEffect(() => {
    if (!socket) return;

    const handleProgressUpdate = (data: any) => {
      setPlayerProgress(prev => ({
        ...prev,
        [data.playerId]: {
          ...prev[data.playerId],
          currentExerciseIndex: data.currentExerciseIndex,
          currentSetNumber: data.currentSetNumber,
          completionPercentage: data.completionPercentage,
          lastUpdate: new Date(),
          status: data.status || 'in_progress',
          currentExercise: session.exercises[data.currentExerciseIndex],
        }
      }));
    };

    const handleExerciseCompleted = (data: any) => {
      setPlayerProgress(prev => {
        const player = prev[data.playerId];
        if (!player) return prev;
        
        const updatedPerformance = [...player.performanceData];
        const exerciseData = updatedPerformance.find(p => p.exerciseId === data.exerciseId);
        
        if (exerciseData) {
          const setData = exerciseData.sets.find(s => s.setNumber === data.setNumber);
          if (setData) {
            setData.actualReps = data.actualReps;
            setData.actualWeight = data.actualWeight;
            setData.rpe = data.rpe;
            setData.completed = true;
          }
        }
        
        return {
          ...prev,
          [data.playerId]: {
            ...player,
            performanceData: updatedPerformance,
            completedSets: player.completedSets + 1,
          }
        };
      });
    };

    socket.on('execution:progress', handleProgressUpdate);
    socket.on('exercise:completed', handleExerciseCompleted);

    return () => {
      socket.off('execution:progress', handleProgressUpdate);
      socket.off('exercise:completed', handleExerciseCompleted);
    };
  }, [socket, session]);

  const toggleSession = () => {
    setIsSessionActive(!isSessionActive);
    if (!isSessionActive) {
      // Start session for all players
      session.playerIds?.forEach(playerId => {
        socket?.emit('execution:start', { 
          sessionId: session.id,
          playerId 
        });
      });
    } else {
      socket?.emit('session:pause', { sessionId: session.id });
    }
  };

  const handleLoadModification = (playerId: string, exerciseId: string, percentage: number) => {
    setLoadModifications(prev => ({
      ...prev,
      [`${playerId}-${exerciseId}`]: percentage,
    }));
  };

  const saveLoadModification = () => {
    if (!editingLoad) return;
    
    const key = `${editingLoad.playerId}-${editingLoad.exerciseId}`;
    const percentage = loadModifications[key] || 100;
    
    // Emit load modification
    socket?.emit('load:modify', {
      sessionId: session.id,
      playerId: editingLoad.playerId,
      exerciseId: editingLoad.exerciseId,
      loadPercentage: percentage,
    });
    
    setEditingLoad(null);
  };

  const selectedPlayer = selectedPlayerId ? playerProgress[selectedPlayerId] : null;

  const getExerciseProgress = (playerId: string, exerciseId: string) => {
    const player = playerProgress[playerId];
    if (!player) return 0;
    
    const exerciseData = player.performanceData.find(p => p.exerciseId === exerciseId);
    if (!exerciseData) return 0;
    
    const completedSets = exerciseData.sets.filter(s => s.completed).length;
    return (completedSets / exerciseData.sets.length) * 100;
  };

  return (
    <div className="flex h-full">
      {/* Player List Sidebar */}
      <div className="w-80 border-r bg-muted/10">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Players ({Object.keys(playerProgress).length})
          </h3>
        </div>
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-4 space-y-2">
            {Object.values(playerProgress).map(player => {
              const isSelected = selectedPlayerId === player.playerId;
              const statusColor = {
                not_started: 'text-muted-foreground',
                in_progress: 'text-blue-600',
                resting: 'text-yellow-600',
                completed: 'text-green-600',
              }[player.status];
              
              return (
                <Card
                  key={player.playerId}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedPlayerId(player.playerId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{player.playerNumber}</Badge>
                        <span className="font-medium">{player.playerName}</span>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        isSelected && "rotate-90"
                      )} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={statusColor}>{player.status.replace('_', ' ')}</span>
                        <span className="text-muted-foreground">
                          {player.completedSets}/{player.totalSets} sets
                        </span>
                      </div>
                      
                      <Progress value={player.completionPercentage} className="h-2" />
                      
                      {player.currentExercise && player.status === 'in_progress' && (
                        <p className="text-xs text-muted-foreground truncate">
                          Current: {player.currentExercise.name}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{session.title}</h2>
            <p className="text-muted-foreground">Strength Training Session</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={toggleSession}
              size="lg"
              variant={isSessionActive ? "destructive" : "default"}
            >
              {isSessionActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start All
                </>
              )}
            </Button>
          </div>
        </div>

        {selectedPlayer ? (
          <div className="space-y-6">
            {/* Player Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      #{selectedPlayer.playerNumber}
                    </Badge>
                    <span>{selectedPlayer.playerName}</span>
                  </div>
                  <Badge className={cn(
                    "capitalize",
                    selectedPlayer.status === 'completed' && "bg-green-600",
                    selectedPlayer.status === 'in_progress' && "bg-blue-600",
                    selectedPlayer.status === 'resting' && "bg-yellow-600"
                  )}>
                    {selectedPlayer.status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Exercise List */}
            <div className="space-y-4">
              {session.exercises.map((exercise, index) => {
                const isCurrentExercise = selectedPlayer.currentExerciseIndex === index;
                const exerciseProgress = getExerciseProgress(selectedPlayer.playerId, exercise.id);
                const playerExerciseData = selectedPlayer.performanceData.find(
                  p => p.exerciseId === exercise.id
                );
                const loadKey = `${selectedPlayer.playerId}-${exercise.id}`;
                const loadPercentage = loadModifications[loadKey] || 100;

                return (
                  <Card 
                    key={exercise.id}
                    className={cn(
                      "transition-all",
                      isCurrentExercise && "ring-2 ring-primary"
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            exerciseProgress === 100 ? "bg-green-100 text-green-700" :
                            isCurrentExercise ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-500"
                          )}>
                            {exerciseProgress === 100 ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              <span className="font-bold">{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg">{exercise.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {exercise.sets} sets × {exercise.reps} reps
                              {exercise.targetWeight && ` @ ${exercise.targetWeight}kg`}
                            </p>
                          </div>
                        </CardTitle>
                        
                        {isTrainerView && (
                          <div className="flex items-center gap-2">
                            {editingLoad?.playerId === selectedPlayer.playerId && 
                             editingLoad?.exerciseId === exercise.id ? (
                              <>
                                <Input
                                  type="number"
                                  value={loadPercentage}
                                  onChange={(e) => handleLoadModification(
                                    selectedPlayer.playerId,
                                    exercise.id,
                                    parseInt(e.target.value)
                                  )}
                                  className="w-20"
                                  min="0"
                                  max="150"
                                />
                                <span className="text-sm">%</span>
                                <Button
                                  size="sm"
                                  onClick={saveLoadModification}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Badge variant="outline">
                                  Load: {loadPercentage}%
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingLoad({ 
                                    playerId: selectedPlayer.playerId, 
                                    exerciseId: exercise.id 
                                  })}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    {(isCurrentExercise || exerciseProgress > 0) && playerExerciseData && (
                      <CardContent>
                        <div className="space-y-3">
                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{Math.round(exerciseProgress)}%</span>
                            </div>
                            <Progress value={exerciseProgress} />
                          </div>
                          
                          {/* Sets Details */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {playerExerciseData.sets.map(set => (
                              <div
                                key={set.setNumber}
                                className={cn(
                                  "p-3 rounded-lg border text-center",
                                  set.completed ? "bg-green-50 border-green-200" :
                                  isCurrentExercise && set.setNumber === selectedPlayer.currentSetNumber ? 
                                    "bg-blue-50 border-blue-200" : 
                                    "bg-gray-50 border-gray-200"
                                )}
                              >
                                <p className="text-xs text-muted-foreground mb-1">
                                  Set {set.setNumber}
                                </p>
                                {set.completed ? (
                                  <>
                                    <p className="font-medium">
                                      {set.actualReps}/{set.targetReps}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {set.actualWeight}kg
                                    </p>
                                    {set.rpe && (
                                      <Badge variant="outline" className="mt-1">
                                        RPE {set.rpe}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium text-muted-foreground">
                                      {set.targetReps} reps
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {Math.round(set.targetWeight * (loadPercentage / 100))}kg
                                    </p>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Exercise Notes */}
                          {exercise.notes && (
                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                <span>{exercise.notes}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a player to view their workout</p>
          </div>
        )}
      </div>
    </div>
  );
}