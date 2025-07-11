'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Play, Pause, StopCircle, RotateCcw, Volume2, VolumeX,
  ArrowLeft, Activity, Clock, Dumbbell, Heart, Timer,
  ChevronRight, CheckCircle2, AlertCircle, Layers
} from 'lucide-react';
import { intervalTimerAudio } from '../../services/IntervalTimerAudioService';
import type { 
  HybridWorkoutSession,
  HybridWorkoutBlock,
  ExerciseBlock,
  IntervalBlock,
  TransitionBlock
} from '../../types/hybrid.types';
import type { Exercise } from '../../types';
import type { IntervalSet } from '../../types/conditioning.types';

interface HybridDisplayProps {
  session: HybridWorkoutSession;
  onBack: () => void;
  onComplete?: () => void;
  className?: string;
}

interface BlockProgress {
  blockId: string;
  status: 'pending' | 'active' | 'completed';
  exercisesCompleted?: number;
  intervalsCompleted?: number;
  timeSpent?: number;
}

export default function HybridDisplay({
  session,
  onBack,
  onComplete,
  className
}: HybridDisplayProps) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [blockProgress, setBlockProgress] = useState<Record<string, BlockProgress>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  
  // Sub-block states for exercises and intervals
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [intervalTimeRemaining, setIntervalTimeRemaining] = useState(0);
  const [transitionTimeRemaining, setTransitionTimeRemaining] = useState(0);
  
  const blocks = session.hybridProgram.blocks;
  const currentBlock = blocks[currentBlockIndex];
  const totalBlocks = blocks.length;
  
  // Calculate overall progress
  const completedBlocks = Object.values(blockProgress).filter(p => p.status === 'completed').length;
  const overallProgress = (completedBlocks / totalBlocks) * 100;
  
  // Initialize block progress
  useEffect(() => {
    const initialProgress: Record<string, BlockProgress> = {};
    blocks.forEach((block, index) => {
      initialProgress[block.id] = {
        blockId: block.id,
        status: index === 0 ? 'active' : 'pending',
        exercisesCompleted: 0,
        intervalsCompleted: 0,
        timeSpent: 0
      };
    });
    setBlockProgress(initialProgress);
  }, [blocks]);
  
  // Initialize audio service
  useEffect(() => {
    intervalTimerAudio.resume();
    intervalTimerAudio.setVolume(volume);
    return () => {
      // Cleanup is handled by the singleton
    };
  }, []);
  
  // Update volume
  useEffect(() => {
    intervalTimerAudio.setVolume(volume);
  }, [volume]);
  
  // Play sound effect
  const playSound = useCallback((type: 'start' | 'end' | 'countdown' | 'warning') => {
    if (!soundEnabled) return;
    intervalTimerAudio.playSound(type);
  }, [soundEnabled]);
  
  // Handle interval timer for interval blocks and transitions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && currentBlock) {
      if (currentBlock.type === 'interval') {
        const intervalBlock = currentBlock as IntervalBlock;
        const currentInterval = intervalBlock.intervals[currentIntervalIndex];
        
        if (currentInterval && intervalTimeRemaining > 0) {
          interval = setInterval(() => {
            setIntervalTimeRemaining(prev => {
              if (prev === 5) playSound('warning');
              if (prev <= 3 && prev > 0) playSound('countdown');
              
              if (prev <= 1) {
                // Move to next interval
                if (currentIntervalIndex < intervalBlock.intervals.length - 1) {
                  playSound('end');
                  setCurrentIntervalIndex(i => i + 1);
                  const nextInterval = intervalBlock.intervals[currentIntervalIndex + 1];
                  return nextInterval.duration;
                } else {
                  // Block completed
                  handleBlockComplete();
                  return 0;
                }
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else if (currentBlock.type === 'transition') {
        if (transitionTimeRemaining > 0) {
          interval = setInterval(() => {
            setTransitionTimeRemaining(prev => {
              if (prev === 5) playSound('warning');
              if (prev <= 3 && prev > 0) playSound('countdown');
              
              if (prev <= 1) {
                handleBlockComplete();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isPaused, currentBlock, currentIntervalIndex, intervalTimeRemaining, transitionTimeRemaining, playSound, handleBlockComplete]);
  
  // Handle block completion
  const handleBlockComplete = useCallback(() => {
    playSound('end');
    
    // Update progress
    setBlockProgress(prev => ({
      ...prev,
      [currentBlock.id]: {
        ...prev[currentBlock.id],
        status: 'completed'
      }
    }));
    
    // Move to next block
    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(i => i + 1);
      setCurrentExerciseIndex(0);
      setCurrentIntervalIndex(0);
      
      const nextBlock = blocks[currentBlockIndex + 1];
      if (nextBlock.type === 'interval') {
        const intervalBlock = nextBlock as IntervalBlock;
        setIntervalTimeRemaining(intervalBlock.intervals[0]?.duration || 0);
      } else if (nextBlock.type === 'transition') {
        setTransitionTimeRemaining(nextBlock.duration);
      }
      
      setBlockProgress(prev => ({
        ...prev,
        [nextBlock.id]: {
          ...prev[nextBlock.id],
          status: 'active'
        }
      }));
    } else {
      // Workout completed
      setIsRunning(false);
      if (onComplete) onComplete();
    }
  }, [currentBlock, currentBlockIndex, blocks, playSound, onComplete]);
  
  // Handle exercise completion (manual)
  const handleExerciseComplete = useCallback(() => {
    const exerciseBlock = currentBlock as ExerciseBlock;
    
    setBlockProgress(prev => ({
      ...prev,
      [currentBlock.id]: {
        ...prev[currentBlock.id],
        exercisesCompleted: (prev[currentBlock.id].exercisesCompleted || 0) + 1
      }
    }));
    
    if (currentExerciseIndex < exerciseBlock.exercises.length - 1) {
      setCurrentExerciseIndex(i => i + 1);
    } else {
      handleBlockComplete();
    }
  }, [currentBlock, currentExerciseIndex, handleBlockComplete]);
  
  // Control functions
  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    playSound('start');
    
    // Initialize timers based on current block type
    if (currentBlock?.type === 'interval') {
      const intervalBlock = currentBlock as IntervalBlock;
      setIntervalTimeRemaining(intervalBlock.intervals[0]?.duration || 0);
    } else if (currentBlock?.type === 'transition') {
      setTransitionTimeRemaining(currentBlock.duration);
    }
  };
  
  const handlePause = () => {
    setIsPaused(!isPaused);
  };
  
  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentBlockIndex(0);
    setCurrentExerciseIndex(0);
    setCurrentIntervalIndex(0);
    setIntervalTimeRemaining(0);
    setTransitionTimeRemaining(0);
    
    // Reset progress
    const resetProgress: Record<string, BlockProgress> = {};
    blocks.forEach((block, index) => {
      resetProgress[block.id] = {
        blockId: block.id,
        status: index === 0 ? 'active' : 'pending',
        exercisesCompleted: 0,
        intervalsCompleted: 0,
        timeSpent: 0
      };
    });
    setBlockProgress(resetProgress);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Render block-specific content
  const renderBlockContent = () => {
    if (!currentBlock) return null;
    
    if (currentBlock.type === 'exercise') {
      const exerciseBlock = currentBlock as ExerciseBlock;
      const currentExercise = exerciseBlock.exercises[currentExerciseIndex];
      
      if (!currentExercise) return null;
      
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-4xl font-bold mb-2">{currentExercise.name}</h3>
            <div className="flex justify-center gap-4 text-2xl">
              {currentExercise.sets && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {currentExercise.sets} sets
                </Badge>
              )}
              {currentExercise.reps && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {currentExercise.reps} reps
                </Badge>
              )}
              {currentExercise.duration && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {currentExercise.duration}s
                </Badge>
              )}
            </div>
          </div>
          
          {currentExercise.notes && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-muted-foreground">{currentExercise.notes}</p>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              onClick={handleExerciseComplete}
              className="h-16 px-8 text-xl"
            >
              <CheckCircle2 className="h-6 w-6 mr-2" />
              Complete Exercise
            </Button>
          </div>
          
          {/* Exercise progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Exercise {currentExerciseIndex + 1} of {exerciseBlock.exercises.length}</span>
              <span>{Math.round(((currentExerciseIndex + 1) / exerciseBlock.exercises.length) * 100)}%</span>
            </div>
            <Progress 
              value={((currentExerciseIndex + 1) / exerciseBlock.exercises.length) * 100} 
              className="h-3"
            />
          </div>
        </div>
      );
    } else if (currentBlock.type === 'interval') {
      const intervalBlock = currentBlock as IntervalBlock;
      const currentInterval = intervalBlock.intervals[currentIntervalIndex];
      
      if (!currentInterval) return null;
      
      const isWorkPhase = currentInterval.type === 'work';
      
      return (
        <div className="space-y-6">
          <div className={cn(
            "text-center p-8 rounded-2xl",
            isWorkPhase ? "bg-red-500/20" : "bg-green-500/20"
          )}>
            <h3 className={cn(
              "text-6xl font-bold mb-4",
              isWorkPhase ? "text-red-600" : "text-green-600"
            )}>
              {isWorkPhase ? "WORK" : "REST"}
            </h3>
            
            <div className="text-[120px] font-mono font-bold leading-none">
              {formatTime(intervalTimeRemaining)}
            </div>
            
            {currentInterval.name && (
              <p className="mt-4 text-2xl text-muted-foreground">{currentInterval.name}</p>
            )}
          </div>
          
          {/* Interval progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Interval {currentIntervalIndex + 1} of {intervalBlock.intervals.length}</span>
              <span>{intervalBlock.equipment}</span>
            </div>
            <Progress 
              value={((currentIntervalIndex + 1) / intervalBlock.intervals.length) * 100} 
              className="h-3"
            />
          </div>
        </div>
      );
    } else if (currentBlock.type === 'transition') {
      const transitionBlock = currentBlock as TransitionBlock;
      
      return (
        <div className="space-y-6">
          <div className="text-center p-8 rounded-2xl bg-blue-500/20">
            <h3 className="text-6xl font-bold mb-4 text-blue-600">TRANSITION</h3>
            
            <div className="text-[120px] font-mono font-bold leading-none">
              {formatTime(transitionTimeRemaining)}
            </div>
            
            <p className="mt-4 text-2xl text-muted-foreground">
              {transitionBlock.transitionType === 'rest' && 'Rest Period'}
              {transitionBlock.transitionType === 'active_recovery' && 'Active Recovery'}
              {transitionBlock.transitionType === 'equipment_change' && 'Equipment Change'}
            </p>
            
            {transitionBlock.nextBlockPrep && (
              <p className="mt-2 text-lg">Next: {transitionBlock.nextBlockPrep}</p>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-12 w-12"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Layers className="h-8 w-8" />
              {session.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              Block {currentBlockIndex + 1} of {totalBlocks} - {currentBlock?.name || ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-12 w-12"
          >
            {soundEnabled ? (
              <Volume2 className="h-6 w-6" />
            ) : (
              <VolumeX className="h-6 w-6" />
            )}
          </Button>
          {soundEnabled && (
            <div className="w-24">
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                min={0}
                max={1}
                step={0.1}
                className="cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Block List */}
        <div className="w-80 border-r p-4">
          <h3 className="font-semibold mb-4">Workout Structure</h3>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {blocks.map((block, index) => {
                const progress = blockProgress[block.id];
                const isActive = index === currentBlockIndex;
                const isCompleted = progress?.status === 'completed';
                
                return (
                  <Card
                    key={block.id}
                    className={cn(
                      "transition-all",
                      isActive && "ring-2 ring-primary",
                      isCompleted && "opacity-75"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : isActive ? (
                          <Activity className="h-5 w-5 text-primary animate-pulse" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {block.type === 'exercise' && <Dumbbell className="h-4 w-4" />}
                            {block.type === 'interval' && <Heart className="h-4 w-4" />}
                            {block.type === 'transition' && <Timer className="h-4 w-4" />}
                            <span className={cn(
                              "font-medium text-sm",
                              isActive && "text-primary"
                            )}>
                              {block.name}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(block.duration / 60)} min
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        
        {/* Center - Main Display */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-4xl w-full space-y-8">
            {/* Block Type Badge */}
            <div className="flex justify-center">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {currentBlock?.type === 'exercise' && (
                  <>
                    <Dumbbell className="h-5 w-5 mr-2" />
                    Exercise Block
                  </>
                )}
                {currentBlock?.type === 'interval' && (
                  <>
                    <Heart className="h-5 w-5 mr-2" />
                    Interval Block
                  </>
                )}
                {currentBlock?.type === 'transition' && (
                  <>
                    <Timer className="h-5 w-5 mr-2" />
                    Transition
                  </>
                )}
              </Badge>
            </div>
            
            {/* Dynamic Block Content */}
            {renderBlockContent()}
            
            {/* Overall Progress */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Overall Progress</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-4" />
                </div>
              </CardContent>
            </Card>
            
            {/* Controls */}
            <div className="flex justify-center gap-4">
              {!isRunning ? (
                <Button
                  size="lg"
                  onClick={handleStart}
                  className="h-16 px-8 text-xl"
                >
                  <Play className="h-6 w-6 mr-2" />
                  Start Workout
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handlePause}
                    className="h-16 px-8 text-xl"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-6 w-6 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-6 w-6 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={handleStop}
                    className="h-16 px-8 text-xl"
                  >
                    <StopCircle className="h-6 w-6 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}