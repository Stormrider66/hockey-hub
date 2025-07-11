'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Dumbbell,
  Activity,
  Timer,
  Coffee,
  Clock,
  Zap,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseBlock {
  id: string;
  type: 'exercise';
  name: string;
  exercises: Array<{
    exerciseId: string;
    name: string;
    sets: number;
    reps: number;
    unit?: string;
    load?: string;
    intensity?: string;
    perSide?: boolean;
  }>;
  duration: number;
  order: number;
}

interface IntervalBlock {
  id: string;
  type: 'interval';
  name: string;
  equipment: string;
  intervals: Array<{
    duration: number;
    intensity: string;
    targetPower?: number;
    targetBPM?: number;
    targetPace?: string;
    targetRPM?: number;
  }>;
  totalDuration: number;
  order: number;
}

interface TransitionBlock {
  id: string;
  type: 'transition';
  name: string;
  duration: number;
  activities: string[];
  order: number;
}

type Block = ExerciseBlock | IntervalBlock | TransitionBlock;

interface HybridWorkout {
  id: string;
  name: string;
  type: 'HYBRID';
  description: string;
  duration: number;
  blocks: Block[];
  equipment: string[];
  targetPlayers: string;
  intensity: string;
  tags: string[];
}

export function PlayerHybridViewer() {
  const router = useRouter();
  
  // Get workout data from sessionStorage
  const [workoutData, setWorkoutData] = useState<any>(null);
  const [hybridWorkout, setHybridWorkout] = useState<HybridWorkout | null>(null);
  
  // Workout state
  const [isRunning, setIsRunning] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [intervalTimeRemaining, setIntervalTimeRemaining] = useState(0);
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [blockTimeElapsed, setBlockTimeElapsed] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);

  useEffect(() => {
    // Load workout data from sessionStorage
    const storedData = sessionStorage.getItem('currentWorkout');
    if (storedData) {
      const data = JSON.parse(storedData);
      setWorkoutData(data);
      if (data.hybridWorkout) {
        setHybridWorkout(data.hybridWorkout);
        // Initialize timer for first block
        const firstBlock = data.hybridWorkout.blocks[0];
        if (firstBlock.type === 'interval') {
          setIntervalTimeRemaining(firstBlock.intervals[0].duration);
        }
      }
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isRunning || isCompleted || !hybridWorkout) return;

    const timer = setInterval(() => {
      const currentBlock = hybridWorkout.blocks[currentBlockIndex];
      
      if (currentBlock.type === 'interval') {
        setIntervalTimeRemaining(prev => {
          if (prev <= 1) {
            // Move to next interval or block
            const intervals = (currentBlock as IntervalBlock).intervals;
            if (currentIntervalIndex < intervals.length - 1) {
              setCurrentIntervalIndex(prev => prev + 1);
              return intervals[currentIntervalIndex + 1].duration;
            } else {
              handleNextBlock();
              return 0;
            }
          }
          return prev - 1;
        });
      } else if (isResting) {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }
      
      setBlockTimeElapsed(prev => prev + 1);
      setTotalTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, currentBlockIndex, currentIntervalIndex, isResting, isCompleted, hybridWorkout]);

  const handleNextBlock = () => {
    if (!hybridWorkout) return;
    
    if (currentBlockIndex < hybridWorkout.blocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
      setCurrentExerciseIndex(0);
      setCurrentSetNumber(1);
      setCurrentIntervalIndex(0);
      setBlockTimeElapsed(0);
      
      // Initialize timer for next block if it's an interval block
      const nextBlock = hybridWorkout.blocks[currentBlockIndex + 1];
      if (nextBlock.type === 'interval') {
        setIntervalTimeRemaining((nextBlock as IntervalBlock).intervals[0].duration);
      }
    } else {
      handleComplete();
    }
  };

  const handleCompleteExerciseSet = () => {
    const currentBlock = hybridWorkout?.blocks[currentBlockIndex] as ExerciseBlock;
    const currentExercise = currentBlock.exercises[currentExerciseIndex];
    
    if (currentSetNumber < currentExercise.sets) {
      setCurrentSetNumber(prev => prev + 1);
      // Start rest period
      setIsResting(true);
      setRestTimeRemaining(30); // Default 30s rest
    } else {
      // Move to next exercise
      if (currentExerciseIndex < currentBlock.exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSetNumber(1);
        setIsResting(true);
        setRestTimeRemaining(60); // 60s rest between exercises
      } else {
        // Block complete
        handleNextBlock();
      }
    }
  };

  const handleComplete = () => {
    setIsRunning(false);
    setIsCompleted(true);
    
    // Save workout completion
    const completionData = {
      workoutId: workoutData?.workoutId,
      eventId: workoutData?.eventId,
      completedAt: new Date().toISOString(),
      totalTime: totalTimeElapsed
    };
    
    sessionStorage.setItem('lastCompletedWorkout', JSON.stringify(completionData));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hybridWorkout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No workout data found</p>
            <Button 
              onClick={() => router.push('/player')} 
              className="w-full mt-4"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentBlock = hybridWorkout.blocks[currentBlockIndex];
  const overallProgress = ((currentBlockIndex + 1) / hybridWorkout.blocks.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{workoutData?.eventTitle || hybridWorkout.name}</h1>
            <p className="text-gray-600">{hybridWorkout.description}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/player')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-6xl mx-auto mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{currentBlockIndex + 1} of {hybridWorkout.blocks.length} blocks</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Time Elapsed: {formatTime(totalTimeElapsed)}</span>
                <span>Est. Remaining: {formatTime((hybridWorkout.duration * 60) - totalTimeElapsed)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Block Display */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentBlock.type === 'exercise' && <Dumbbell className="h-5 w-5" />}
                  {currentBlock.type === 'interval' && <Activity className="h-5 w-5" />}
                  {currentBlock.type === 'transition' && <Coffee className="h-5 w-5" />}
                  <CardTitle>{currentBlock.name}</CardTitle>
                </div>
                <Badge variant={currentBlock.type === 'interval' ? 'destructive' : 'default'}>
                  {currentBlock.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Exercise Block Display */}
              {currentBlock.type === 'exercise' && (
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">
                      {(currentBlock as ExerciseBlock).exercises[currentExerciseIndex].name}
                    </h3>
                    
                    {isResting ? (
                      <div className="text-center py-8">
                        <Timer className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                        <p className="text-xl font-medium mb-2">Rest Period</p>
                        <p className="text-4xl font-bold text-blue-600">
                          {formatTime(restTimeRemaining)}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Set</p>
                            <p className="text-3xl font-bold">
                              {currentSetNumber} / {(currentBlock as ExerciseBlock).exercises[currentExerciseIndex].sets}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Reps</p>
                            <p className="text-3xl font-bold">
                              {(currentBlock as ExerciseBlock).exercises[currentExerciseIndex].reps}
                            </p>
                          </div>
                          {(currentBlock as ExerciseBlock).exercises[currentExerciseIndex].load && (
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Load</p>
                              <p className="text-3xl font-bold">
                                {(currentBlock as ExerciseBlock).exercises[currentExerciseIndex].load}
                              </p>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={handleCompleteExerciseSet}
                          className="w-full"
                          size="lg"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Complete Set
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Exercise List */}
                  <div className="space-y-2">
                    {(currentBlock as ExerciseBlock).exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-3 rounded-lg border",
                          index === currentExerciseIndex
                            ? "bg-blue-50 border-blue-300"
                            : index < currentExerciseIndex
                            ? "bg-green-50 border-green-300"
                            : "bg-gray-50 border-gray-200"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {index < currentExerciseIndex && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {index === currentExerciseIndex && (
                              <Dumbbell className="h-4 w-4 text-blue-600" />
                            )}
                            {index > currentExerciseIndex && (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={cn(
                              "font-medium",
                              index === currentExerciseIndex && "text-blue-700"
                            )}>
                              {exercise.name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {exercise.sets} × {exercise.reps}
                            {exercise.load && ` @ ${exercise.load}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interval Block Display */}
              {currentBlock.type === 'interval' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Badge 
                      className={cn(
                        "text-lg px-4 py-2 mb-4",
                        (currentBlock as IntervalBlock).intervals[currentIntervalIndex].intensity === 'Sprint' && "bg-red-600",
                        (currentBlock as IntervalBlock).intervals[currentIntervalIndex].intensity === 'Recovery' && "bg-green-600",
                        (currentBlock as IntervalBlock).intervals[currentIntervalIndex].intensity === 'Moderate' && "bg-yellow-600"
                      )}
                    >
                      {(currentBlock as IntervalBlock).intervals[currentIntervalIndex].intensity}
                    </Badge>
                    
                    <p className="text-6xl font-bold mb-4">
                      {formatTime(intervalTimeRemaining)}
                    </p>

                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      {(currentBlock as IntervalBlock).intervals[currentIntervalIndex].targetBPM && (
                        <div>
                          <p className="text-sm text-gray-600">Target HR</p>
                          <p className="text-2xl font-semibold">
                            {(currentBlock as IntervalBlock).intervals[currentIntervalIndex].targetBPM} bpm
                          </p>
                        </div>
                      )}
                      {(currentBlock as IntervalBlock).intervals[currentIntervalIndex].targetPower && (
                        <div>
                          <p className="text-sm text-gray-600">Target Power</p>
                          <p className="text-2xl font-semibold">
                            {(currentBlock as IntervalBlock).intervals[currentIntervalIndex].targetPower}W
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Progress 
                    value={((currentIntervalIndex + 1) / (currentBlock as IntervalBlock).intervals.length) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Transition Block Display */}
              {currentBlock.type === 'transition' && (
                <div className="text-center py-8">
                  <Coffee className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold mb-4">Transition Period</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    {formatTime((currentBlock as TransitionBlock).duration * 60 - blockTimeElapsed)} remaining
                  </p>
                  <div className="space-y-2 max-w-md mx-auto">
                    {(currentBlock as TransitionBlock).activities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-4 w-4" />
                        <span>{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  size="lg"
                  onClick={() => setIsRunning(!isRunning)}
                  disabled={isCompleted}
                  className={isRunning ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      {totalTimeElapsed > 0 ? 'Resume' : 'Start'}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleNextBlock}
                  disabled={currentBlockIndex === hybridWorkout.blocks.length - 1}
                >
                  Skip Block
                  <SkipForward className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Blocks Overview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Workout Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hybridWorkout.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      index === currentBlockIndex
                        ? "bg-blue-50 border-blue-300"
                        : index < currentBlockIndex
                        ? "bg-green-50 border-green-300"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {index < currentBlockIndex && (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      {index === currentBlockIndex && (
                        <div className="h-4 w-4 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                      )}
                      {index > currentBlockIndex && (
                        <div className="h-4 w-4 rounded-full bg-gray-300 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium text-sm",
                          index === currentBlockIndex && "text-blue-700"
                        )}>
                          {block.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {block.type === 'exercise' && `${(block as ExerciseBlock).exercises.length} exercises`}
                          {block.type === 'interval' && `${(block as IntervalBlock).intervals.length} intervals`}
                          {block.type === 'transition' && `${(block as TransitionBlock).duration} min`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Equipment List */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3">Required Equipment</h4>
                <div className="flex flex-wrap gap-2">
                  {hybridWorkout.equipment.map((item, index) => (
                    <Badge key={index} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Workout Tags */}
              <div className="mt-4">
                <h4 className="font-medium mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {hybridWorkout.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-8 max-w-md text-center"
            >
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Workout Complete!</h2>
              <p className="text-gray-600 mb-6">
                You've successfully completed the {hybridWorkout.name} workout!
              </p>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600">Total Duration</p>
                <p className="text-2xl font-semibold">{formatTime(totalTimeElapsed)}</p>
              </div>

              <Button
                onClick={() => router.push('/player')}
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}