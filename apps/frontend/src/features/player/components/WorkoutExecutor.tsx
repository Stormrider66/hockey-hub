'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetWorkoutSessionByIdQuery,
  useStartWorkoutExecutionMutation,
  useUpdateExecutionProgressMutation,
  useCompleteExerciseSetMutation,
  useCompleteWorkoutExecutionMutation,
} from '@/store/api/trainingApi';
import { useTrainingSocket } from '@/contexts/TrainingSocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Activity,
  Timer,
  Zap,
  SkipForward,
  Check,
  Pause,
  Play,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkoutSession, Exercise, WorkoutExecution } from '@hockey-hub/shared-lib';

interface WorkoutExecutorProps {
  sessionId: string;
  playerId: string;
}

export function WorkoutExecutor({ sessionId, playerId }: WorkoutExecutorProps) {
  const router = useRouter();
  const { joinSession, leaveSession, completeExercise, updateMetrics } = useTrainingSocket();
  
  // API hooks
  const { data: sessionData } = useGetWorkoutSessionByIdQuery(sessionId);
  const [startExecution] = useStartWorkoutExecutionMutation();
  const [updateProgress] = useUpdateExecutionProgressMutation();
  const [completeSet] = useCompleteExerciseSetMutation();
  const [completeExecution] = useCompleteWorkoutExecutionMutation();

  const session = sessionData?.data;
  const playerLoad = session?.playerLoads.find(load => load.playerId === playerId);

  // Local state
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [actualPerformance, setActualPerformance] = useState<{
    reps?: number;
    weight?: number;
    duration?: number;
    distance?: number;
    power?: number;
  }>({});

  // Get current exercise with player modifications
  const getCurrentExercise = useCallback((): Exercise | null => {
    if (!session) return null;
    const exercise = session.exercises[currentExerciseIndex];
    if (!exercise) return null;

    // Apply player-specific modifications if any
    if (playerLoad?.exerciseModifications?.[exercise.id]) {
      const mods = playerLoad.exerciseModifications[exercise.id];
      return {
        ...exercise,
        sets: mods.sets ?? exercise.sets,
        reps: mods.reps ?? exercise.reps,
        duration: mods.duration ?? exercise.duration,
        targetValue: mods.targetValue ?? exercise.targetValue,
        restDuration: mods.restDuration ?? exercise.restDuration,
      };
    }

    // Apply load modifier to target value
    if (playerLoad?.loadModifier && exercise.targetValue) {
      return {
        ...exercise,
        targetValue: Math.round(exercise.targetValue * playerLoad.loadModifier),
      };
    }

    return exercise;
  }, [session, currentExerciseIndex, playerLoad]);

  const currentExercise = getCurrentExercise();

  // Join session on mount
  useEffect(() => {
    joinSession(sessionId);
    return () => leaveSession(sessionId);
  }, [sessionId, joinSession, leaveSession]);

  // Timer logic
  useEffect(() => {
    if (isPaused || !executionId) return;

    const interval = setInterval(() => {
      if (isResting && restTimer > 0) {
        setRestTimer(prev => prev - 1);
        if (restTimer === 1) {
          setIsResting(false);
          setRestTimer(0);
        }
      } else if (!isResting && currentExercise?.duration) {
        setTimer(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isResting, restTimer, currentExercise, executionId]);

  // Update progress periodically
  useEffect(() => {
    if (!executionId || isPaused) return;

    const interval = setInterval(() => {
      const totalExercises = session?.exercises.length || 1;
      const completionPercentage = Math.round(
        ((currentExerciseIndex + (currentSetNumber - 1) / (currentExercise?.sets || 1)) / totalExercises) * 100
      );

      updateProgress({
        executionId,
        currentExerciseIndex,
        currentSetNumber,
        completionPercentage,
        metrics: {
          heartRate: Math.round(120 + Math.random() * 60), // Mock data
          power: Math.round(150 + Math.random() * 100), // Mock data
        },
      });

      updateMetrics({
        sessionId,
        playerId,
        metrics: {
          heartRate: Math.round(120 + Math.random() * 60),
          power: Math.round(150 + Math.random() * 100),
        },
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [executionId, isPaused, currentExerciseIndex, currentSetNumber, currentExercise, session, updateProgress, updateMetrics, sessionId, playerId]);

  const handleStartWorkout = async () => {
    try {
      const result = await startExecution({ workoutSessionId: sessionId, playerId });
      if ('data' in result && result.data.data) {
        setExecutionId(result.data.data.id);
      }
    } catch (error) {
      console.error('Failed to start workout:', error);
    }
  };

  const handleCompleteSet = async () => {
    if (!executionId || !currentExercise) return;

    try {
      await completeSet({
        executionId,
        exerciseId: currentExercise.id,
        exerciseName: currentExercise.name,
        setNumber: currentSetNumber,
        ...actualPerformance,
        performanceMetrics: { rpe },
        notes,
      });

      completeExercise({
        sessionId,
        playerId,
        exerciseId: currentExercise.id,
        setNumber: currentSetNumber,
      });

      // Reset for next set
      setActualPerformance({});
      setTimer(0);
      setNotes('');

      // Check if exercise is complete
      if (currentSetNumber >= (currentExercise.sets || 1)) {
        handleNextExercise();
      } else {
        // Start rest period
        setCurrentSetNumber(prev => prev + 1);
        if (currentExercise.restDuration) {
          setIsResting(true);
          setRestTimer(currentExercise.restDuration);
        }
      }
    } catch (error) {
      console.error('Failed to complete set:', error);
    }
  };

  const handleNextExercise = () => {
    if (!session) return;

    if (currentExerciseIndex < session.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetNumber(1);
      setTimer(0);
      setActualPerformance({});
    } else {
      setShowCompleteDialog(true);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSetNumber(1);
      setTimer(0);
      setActualPerformance({});
    }
  };

  const handleSkipSet = () => {
    if (currentSetNumber >= (currentExercise?.sets || 1)) {
      handleNextExercise();
    } else {
      setCurrentSetNumber(prev => prev + 1);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!executionId) return;

    try {
      await completeExecution(executionId);
      router.push('/player');
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  };

  if (!session) {
    return <div>Loading workout...</div>;
  }

  if (!executionId) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{session.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{session.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Type</p>
              <p className="text-muted-foreground capitalize">{session.type}</p>
            </div>
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-muted-foreground">{session.estimatedDuration} min</p>
            </div>
            <div>
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground">{session.location}</p>
            </div>
            <div>
              <p className="font-medium">Exercises</p>
              <p className="text-muted-foreground">{session.exercises.length}</p>
            </div>
          </div>
          {playerLoad && playerLoad.loadModifier !== 1 && (
            <Badge variant="outline">
              Load adjusted to {Math.round(playerLoad.loadModifier * 100)}%
            </Badge>
          )}
          <Button onClick={handleStartWorkout} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Start Workout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Overall Progress</p>
              <p className="text-sm text-muted-foreground">
                Exercise {currentExerciseIndex + 1} of {session.exercises.length}
              </p>
            </div>
            <Progress 
              value={((currentExerciseIndex + (currentSetNumber - 1) / (currentExercise?.sets || 1)) / session.exercises.length) * 100} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Exercise Display */}
      {currentExercise && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentExercise.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkipSet}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Exercise Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentExercise.sets && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Set</p>
                  <p className="text-3xl font-bold">
                    {currentSetNumber} / {currentExercise.sets}
                  </p>
                </div>
              )}
              {currentExercise.reps && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Reps</p>
                  <p className="text-3xl font-bold">{currentExercise.reps}</p>
                </div>
              )}
              {currentExercise.targetValue && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Target</p>
                  <p className="text-3xl font-bold">
                    {currentExercise.targetValue} {currentExercise.unit}
                  </p>
                </div>
              )}
              {currentExercise.duration && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="text-3xl font-bold">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              )}
            </div>

            {/* Rest Timer */}
            {isResting && (
              <div className="bg-muted rounded-lg p-6 text-center">
                <p className="text-lg font-medium mb-2">Rest Period</p>
                <p className="text-4xl font-bold">
                  {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                </p>
              </div>
            )}

            {/* Instructions */}
            {currentExercise.instructions && (
              <div>
                <p className="text-sm font-medium mb-1">Instructions</p>
                <p className="text-sm text-muted-foreground">{currentExercise.instructions}</p>
              </div>
            )}

            {/* Performance Input */}
            {!isResting && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {currentExercise.reps && (
                    <div>
                      <label className="text-sm font-medium">Actual Reps</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={actualPerformance.reps || ''}
                        onChange={(e) => setActualPerformance(prev => ({ 
                          ...prev, 
                          reps: parseInt(e.target.value) || undefined 
                        }))}
                      />
                    </div>
                  )}
                  {currentExercise.unit === 'kilograms' && (
                    <div>
                      <label className="text-sm font-medium">Weight (kg)</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={actualPerformance.weight || ''}
                        onChange={(e) => setActualPerformance(prev => ({ 
                          ...prev, 
                          weight: parseFloat(e.target.value) || undefined 
                        }))}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">RPE (1-10)</label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[rpe]}
                      onValueChange={([value]) => setRpe(value)}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-bold">{rpe}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="Any notes about this set..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousExercise}
                disabled={currentExerciseIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={handleCompleteSet}
                disabled={isResting}
              >
                <Check className="h-4 w-4 mr-2" />
                Complete Set
              </Button>

              <Button
                variant="outline"
                onClick={handleNextExercise}
                disabled={currentExerciseIndex === session.exercises.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Workout Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Workout?</DialogTitle>
            <DialogDescription>
              Great job! You\'ve completed all exercises in this workout.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteWorkout}>
              <Check className="h-4 w-4 mr-2" />
              Complete Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}