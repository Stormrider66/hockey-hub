'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Target,
  Timer,
  Activity,
  Zap,
  Volume2,
  VolumeX,
  Info,
  AlertCircle,
  TrendingUp,
  SkipForward
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AgilityDrill, AgilityProgram, DrillExecution } from '@/features/physical-trainer/types/agility.types';
import { PatternVisualizer } from '@/features/physical-trainer/components/agility-builder/PatternVisualizer';
import { agilityAudioService } from '@/features/physical-trainer/services/AgilityAudioService';
import { intervalTimerAudio } from '@/features/physical-trainer/services/IntervalTimerAudioService';
import { useSessionBroadcast } from '@/features/physical-trainer/hooks/useSessionBroadcast';
import { SessionBroadcastIndicator } from './SessionBroadcastIndicator';

interface DrillResult {
  drillId: string;
  drillName: string;
  completedReps: number;
  times: number[];
  averageTime: number;
  bestTime: number;
  rpe: number;
  notes: string;
}

export function PlayerAgilityViewer() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Get workout data from sessionStorage
  const [workoutData, setWorkoutData] = useState<any>(null);
  const [agilityProgram, setAgilityProgram] = useState<AgilityProgram | null>(null);
  
  // Workout state
  const [isRunning, setIsRunning] = useState(false);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [currentRep, setCurrentRep] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [drillResults, setDrillResults] = useState<DrillResult[]>([]);
  const [currentDrillTimes, setCurrentDrillTimes] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [enableSpeech, setEnableSpeech] = useState(true);
  const [phase, setPhase] = useState<'warmup' | 'drills' | 'cooldown'>('warmup');
  const [phaseTimer, setPhaseTimer] = useState(0);
  
  // Form inputs
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Broadcasting
  const [broadcastEnabled, setBroadcastEnabled] = useState(true);
  const {
    isConnected,
    isReconnecting,
    queuedUpdates,
    broadcastAgilityUpdate,
    disconnect
  } = useSessionBroadcast({
    enabled: broadcastEnabled && !!workoutData,
    throttleMs: 2000
  });

  useEffect(() => {
    // Load workout data from sessionStorage
    const storedData = sessionStorage.getItem('currentWorkout');
    if (storedData) {
      const data = JSON.parse(storedData);
      setWorkoutData(data);
      if (data.agilityProgram) {
        setAgilityProgram(data.agilityProgram);
      }
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Debug effect to ensure timer resets
  useEffect(() => {
    if (showInstructions && phase === 'drills') {
      setTimer(0);
      setIsRunning(false);
    }
  }, [showInstructions, phase]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isResting && !isCompleted) {
      if (phase === 'warmup' || phase === 'cooldown') {
        // Phase timer counts up
        interval = setInterval(() => {
          setPhaseTimer(prev => {
            const newTime = prev + 1;
            // Check if phase is complete
            if (phase === 'warmup' && newTime >= (agilityProgram?.warmupDuration || 60)) {
              handlePhaseTransition('drills');
            } else if (phase === 'cooldown' && newTime >= (agilityProgram?.cooldownDuration || 60)) {
              handleCompleteWorkout();
            }
            return newTime;
          });
        }, 1000);
      } else {
        // Drill timer for precision timing
        interval = setInterval(() => {
          setTimer(prev => prev + 0.01); // 10ms intervals for precision
        }, 10);
        
        // Broadcast progress every 2 seconds
        if (broadcastEnabled && agilityProgram && Math.floor(timer) % 2 === 0 && timer > 0) {
          const currentDrill = agilityProgram.drills[currentDrillIndex];
          broadcastAgilityUpdate({
            workoutId: workoutData?.workoutId || '',
            eventId: workoutData?.eventId,
            overallProgress: 10 + (80 * ((currentDrillIndex + (currentRep - 1) / currentDrill.reps) / agilityProgram.drills.length)),
            currentPhase: 'drills',
            currentDrill: currentDrill.name,
            drillIndex: currentDrillIndex,
            totalDrills: agilityProgram.drills.length,
            currentRep,
            totalReps: currentDrill.reps,
            lastTime: currentDrillTimes[currentDrillTimes.length - 1],
            bestTime: currentDrillTimes.length > 0 ? Math.min(...currentDrillTimes) : undefined,
            rpe,
            totalTimeElapsed: timer,
            isCompleted: false,
            isPaused: !isRunning
          });
        }
      }
    } else if (isResting && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 3 && prev > 0 && enableSpeech) {
            agilityAudioService.announceCountdown(prev);
          }
          if (prev <= 1) {
            setIsResting(false);
            // If this was a rest drill, complete it
            if (currentDrill?.category === 'rest') {
              handleCompleteDrill();
            } else {
              playStartSound();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isResting, restTimeRemaining, isCompleted, phase, phaseTimer, agilityProgram, enableSpeech, broadcastEnabled, workoutData, timer, currentDrillIndex, currentRep, currentDrillTimes, rpe, broadcastAgilityUpdate]);

  const handlePhaseTransition = async (newPhase: 'warmup' | 'drills' | 'cooldown') => {
    setPhase(newPhase);
    setPhaseTimer(0);
    setTimer(0); // Reset drill timer
    setCurrentDrillIndex(0); // Reset to first drill
    setCurrentRep(1); // Reset reps
    setShowInstructions(true); // Show instructions for first drill
    
    if (enableSpeech) {
      if (newPhase === 'drills' && agilityProgram?.drills[0]) {
        await agilityAudioService.announceDrill(
          agilityProgram.drills[0].name, 
          agilityProgram.drills[0].description
        );
      } else if (newPhase === 'cooldown') {
        await agilityAudioService.announceCooldown();
      }
    }
  };

  const handleStartWorkout = async () => {
    setIsRunning(true);
    if (phase === 'warmup' && enableSpeech) {
      await agilityAudioService.announceWarmup();
    }
    playStartSound();
  };

  const handleStartDrill = async () => {
    if (!currentDrill) return;
    
    // For rest drills, just wait for the duration
    if (currentDrill.category === 'rest') {
      setIsResting(true);
      setRestTimeRemaining(currentDrill.duration || 60);
      if (enableSpeech) {
        await agilityAudioService.announceRest(currentDrill.duration || 60);
      }
      return;
    }
    
    setIsRunning(true);
    setTimer(0);
    if (enableSpeech) {
      await agilityAudioService.announceStart();
    } else {
      playStartSound();
    }
  };

  const handleStopDrill = async () => {
    if (!isRunning || timer === 0) return;
    
    setIsRunning(false);
    const currentTime = timer;
    setCurrentDrillTimes(prev => [...prev, currentTime]);
    
    const currentDrill = agilityProgram?.drills[currentDrillIndex];
    if (!currentDrill) return;
    
    if (enableSpeech) {
      await agilityAudioService.announceStop();
      await agilityAudioService.announceTime(currentTime);
      if (currentDrill.targetTime) {
        await agilityAudioService.announcePerformance(currentTime, currentDrill.targetTime);
      }
    } else {
      playStopSound();
    }
    
    // Check if more reps needed
    if (currentRep < currentDrill.reps) {
      setCurrentRep(prev => prev + 1);
      setIsResting(true);
      setRestTimeRemaining(currentDrill.restBetweenReps);
      if (enableSpeech) {
        await agilityAudioService.announceRest(currentDrill.restBetweenReps);
      }
    } else {
      // Drill complete
      handleCompleteDrill();
    }
  };

  const handleCompleteDrill = async () => {
    if (!agilityProgram) return;
    
    const currentDrill = agilityProgram.drills[currentDrillIndex];
    
    // Only record results for non-rest drills
    if (currentDrill.category !== 'rest' && currentDrillTimes.length > 0) {
      const avgTime = currentDrillTimes.reduce((a, b) => a + b, 0) / currentDrillTimes.length;
      const bestTime = Math.min(...currentDrillTimes);
      
      const result: DrillResult = {
        drillId: currentDrill.id || `drill-${currentDrillIndex}`,
        drillName: currentDrill.name,
        completedReps: currentDrillTimes.length,
        times: currentDrillTimes,
        averageTime: avgTime,
        bestTime: bestTime,
        rpe,
        notes
      };
      
      setDrillResults(prev => [...prev, result]);
    }
    
    // Reset for next drill
    setCurrentDrillTimes([]);
    setTimer(0);
    setCurrentRep(1);
    setRpe(5);
    setNotes('');
    
    // Move to next drill or complete workout
    if (currentDrillIndex < agilityProgram.drills.length - 1) {
      setCurrentDrillIndex(prev => prev + 1);
      setShowInstructions(true);
      setTimer(0); // Reset timer for next drill
      // Announce next drill
      if (enableSpeech) {
        const nextDrill = agilityProgram.drills[currentDrillIndex + 1];
        await agilityAudioService.announceDrill(nextDrill.name, nextDrill.description || '');
      }
    } else {
      // Move to cooldown phase
      handlePhaseTransition('cooldown');
    }
  };

  const handleCompleteWorkout = () => {
    setIsCompleted(true);
    playCompletionSound();
    
    // Save workout completion
    const completionData = {
      workoutId: workoutData?.workoutId,
      eventId: workoutData?.eventId,
      completedAt: new Date().toISOString(),
      drillResults
    };
    
    sessionStorage.setItem('lastCompletedWorkout', JSON.stringify(completionData));
    
    // Broadcast completion
    if (broadcastEnabled) {
      broadcastAgilityUpdate({
        workoutId: workoutData?.workoutId || '',
        eventId: workoutData?.eventId,
        overallProgress: 100,
        currentPhase: 'cooldown',
        totalTimeElapsed: phaseTimer,
        isCompleted: true,
        isPaused: false
      });
    }
  };

  const playStartSound = () => {
    if (!isMuted && audioRef.current) {
      audioRef.current.src = '/sounds/start.mp3';
      audioRef.current.play().catch(() => {});
    }
  };

  const playStopSound = () => {
    if (!isMuted && audioRef.current) {
      audioRef.current.src = '/sounds/stop.mp3';
      audioRef.current.play().catch(() => {});
    }
  };

  const playCompletionSound = () => {
    if (!isMuted && audioRef.current) {
      audioRef.current.src = '/sounds/completion.mp3';
      audioRef.current.play().catch(() => {});
    }
  };

  const formatTime = (seconds: number): string => {
    return seconds.toFixed(2);
  };

  const getPerformanceLevel = (time: number, targets: any) => {
    if (!targets) return 'N/A';
    if (time <= targets.elite) return 'Elite';
    if (time <= targets.good) return 'Good';
    if (time <= targets.average) return 'Average';
    return 'Below Average';
  };

  if (!agilityProgram || !agilityProgram.drills.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No agility drills found</p>
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

  const currentDrill = phase === 'drills' ? agilityProgram.drills[currentDrillIndex] : null;
  const overallProgress = phase === 'warmup' ? 10 
    : phase === 'cooldown' ? 90
    : 10 + (80 * ((currentDrillIndex + (currentRep - 1) / (currentDrill?.reps || 1)) / agilityProgram.drills.length));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{workoutData?.eventTitle || 'Agility Training'}</h1>
            <p className="text-gray-600">{workoutData?.location || 'Training Field'}</p>
          </div>
          <div className="flex items-center gap-4">
            <SessionBroadcastIndicator
              isConnected={isConnected}
              isReconnecting={isReconnecting}
              queuedUpdates={queuedUpdates}
              broadcastEnabled={broadcastEnabled}
              onToggleBroadcast={setBroadcastEnabled}
            />
            <Button
              variant="outline"
              onClick={() => router.push('/player')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-6xl mx-auto mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>
                  {phase === 'warmup' && 'Warmup Phase'}
                  {phase === 'drills' && `Drill ${currentDrillIndex + 1} of ${agilityProgram.drills.length}`}
                  {phase === 'cooldown' && 'Cooldown Phase'}
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drill Execution */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {phase === 'warmup' && <Activity className="h-5 w-5" />}
                  {phase === 'drills' && <Target className="h-5 w-5" />}
                  {phase === 'cooldown' && <Activity className="h-5 w-5" />}
                  <CardTitle>
                    {phase === 'warmup' && 'Warmup'}
                    {phase === 'drills' && currentDrill?.name}
                    {phase === 'cooldown' && 'Cooldown'}
                  </CardTitle>
                </div>
                {phase === 'drills' && currentDrill && (
                  <Badge>{currentDrill.category}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showInstructions ? (
                <div className="space-y-6">
                  {phase === 'warmup' && (
                    <>
                      <div>
                        <h4 className="font-medium mb-2">Warmup Instructions</h4>
                        <p className="text-gray-600">
                          Complete the following warmup routine to prepare for your agility training:
                        </p>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>Light jogging in place (30 seconds)</li>
                          <li>High knees (20 reps)</li>
                          <li>Butt kicks (20 reps)</li>
                          <li>Lateral shuffles (10 each direction)</li>
                          <li>Dynamic stretching (30 seconds)</li>
                        </ul>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <Info className="h-4 w-4 inline mr-1" />
                            Target duration: {Math.floor(agilityProgram.warmupDuration / 60)} minutes. You can complete warmup early or skip if already warmed up.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleStartWorkout}
                          className="flex-1"
                          size="lg"
                        >
                          Start Warmup Timer
                        </Button>
                        <Button
                          onClick={() => handlePhaseTransition('drills')}
                          variant="outline"
                          className="flex-1"
                          size="lg"
                        >
                          Skip to Drills
                        </Button>
                      </div>
                    </>
                  )}

                  {phase === 'drills' && currentDrill && (
                    <>
                      {/* Rest Drill Display */}
                      {currentDrill.category === 'rest' ? (
                        <div className="text-center py-8">
                          <Pause className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                          <h4 className="text-xl font-medium mb-2">{currentDrill.name}</h4>
                          <p className="text-gray-600 mb-4">
                            Take this time to recover and prepare for the next drill
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            Duration: {currentDrill.duration || 60} seconds
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Pattern Visualization */}
                          {currentDrill.pattern && (
                            <div>
                              <h4 className="font-medium mb-2">Drill Pattern</h4>
                              <PatternVisualizer
                                pattern={currentDrill.pattern}
                                showMovementTypes={true}
                                className="h-64"
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* Drill Description */}
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-gray-600">{currentDrill.description}</p>
                      </div>

                      {/* Setup */}
                      {currentDrill.setup && (
                        <div>
                          <h4 className="font-medium mb-2">Setup</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm mb-2">
                              <strong>Equipment:</strong> {currentDrill.setup.equipment?.join(', ') || 'Cones'}
                            </p>
                            <p className="text-sm">
                              <strong>Spacing:</strong> {currentDrill.setup.spacing || 'See pattern above'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      {currentDrill.instructions && (
                        <div>
                          <h4 className="font-medium mb-2">Instructions</h4>
                          <ol className="list-decimal list-inside space-y-1">
                            {currentDrill.instructions.map((instruction, index) => (
                              <li key={index} className="text-sm text-gray-700">
                                {instruction}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Coaching Cues */}
                      {currentDrill.coachingCues && (
                        <div>
                          <h4 className="font-medium mb-2">Key Points</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {currentDrill.coachingCues.map((cue, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{cue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          setShowInstructions(false);
                          setTimer(0); // Ensure timer starts at 0
                          if (currentDrill.category === 'rest') {
                            handleStartDrill();
                          }
                        }}
                        className="w-full"
                        size="lg"
                      >
                        {currentDrill.category === 'rest' ? 'Start Rest Period' : 'Start Drill'}
                      </Button>
                    </>
                  )}

                  {phase === 'cooldown' && (
                    <>
                      <div>
                        <h4 className="font-medium mb-2">Cooldown Instructions</h4>
                        <p className="text-gray-600">
                          Complete the following cooldown routine to help your body recover:
                        </p>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>Easy walking (60 seconds)</li>
                          <li>Static hamstring stretch (30 seconds each leg)</li>
                          <li>Static quad stretch (30 seconds each leg)</li>
                          <li>Calf stretch (30 seconds each leg)</li>
                          <li>Deep breathing exercises (30 seconds)</li>
                        </ul>
                      </div>
                      <Button
                        onClick={handleStartWorkout}
                        className="w-full"
                        size="lg"
                      >
                        Start Cooldown
                      </Button>
                    </>
                  )}
                </div>
              ) : isResting ? (
                <div className="text-center py-8">
                  <Timer className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <p className="text-xl font-medium mb-2">Rest Period</p>
                  <p className="text-5xl font-bold text-blue-600 mb-6">
                    {restTimeRemaining}
                  </p>
                  <p className="text-gray-600">
                    Next: Rep {currentRep} of {currentDrill?.reps || 1}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Timer Display */}
                  <div className="text-center py-8">
                    {phase === 'drills' && currentDrill && (
                      <Badge className="mb-4">
                        Rep {currentRep} of {currentDrill.reps}
                      </Badge>
                    )}
                    
                    {(phase === 'warmup' || phase === 'cooldown') && (
                      <div className="mb-4">
                        <p className="text-lg font-medium text-gray-600">
                          {phase === 'warmup' ? 'Warmup Time' : 'Cooldown Time'}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <Progress 
                            value={(phaseTimer / (phase === 'warmup' ? agilityProgram.warmupDuration : agilityProgram.cooldownDuration)) * 100} 
                            className="w-48 h-2"
                          />
                          <p className="text-sm text-gray-500">
                            {Math.floor(phaseTimer / 60)}:{(phaseTimer % 60).toString().padStart(2, '0')} / {Math.floor((phase === 'warmup' ? agilityProgram.warmupDuration : agilityProgram.cooldownDuration) / 60)}:{((phase === 'warmup' ? agilityProgram.warmupDuration : agilityProgram.cooldownDuration) % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={phase === 'drills' ? timer : phaseTimer}
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          phase === 'drills' ? "text-8xl" : "text-6xl",
                          "font-bold mb-4",
                          isRunning ? "text-blue-600" : "text-gray-800"
                        )}
                      >
                        {phase === 'drills' ? formatTime(timer) : `${Math.floor(phaseTimer / 60)}:${(phaseTimer % 60).toString().padStart(2, '0')}`}
                      </motion.div>
                    </AnimatePresence>

                    <p className="text-lg text-gray-600">
                      {phase === 'drills' ? 'seconds' : ''}
                    </p>

                    {/* Target Times for drills */}
                    {phase === 'drills' && currentDrill?.targetTime && (
                      <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Elite</p>
                          <p className="font-semibold text-green-600">
                            {currentDrill.targetTime.elite}s
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Good</p>
                          <p className="font-semibold text-blue-600">
                            {currentDrill.targetTime.good}s
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Average</p>
                          <p className="font-semibold text-gray-600">
                            {currentDrill.targetTime.average}s
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    {phase === 'drills' ? (
                      <>
                        {!isRunning ? (
                          <Button
                            size="lg"
                            onClick={handleStartDrill}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="h-5 w-5 mr-2" />
                            Start Timer
                          </Button>
                        ) : (
                          <Button
                            size="lg"
                            onClick={handleStopDrill}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Pause className="h-5 w-5 mr-2" />
                            Stop Timer
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setTimer(0)}
                          disabled={isRunning}
                        >
                          <RotateCcw className="h-5 w-5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {!isRunning ? (
                          <Button
                            size="lg"
                            onClick={handleStartWorkout}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="h-5 w-5 mr-2" />
                            Start {phase === 'warmup' ? 'Warmup Timer' : 'Cooldown Timer'}
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="lg"
                              onClick={() => setIsRunning(false)}
                              variant="outline"
                            >
                              <Pause className="h-5 w-5 mr-2" />
                              Pause
                            </Button>
                            <Button
                              size="lg"
                              onClick={() => {
                                setIsRunning(false);
                                if (phase === 'warmup') {
                                  handlePhaseTransition('drills');
                                } else {
                                  handleCompleteWorkout();
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CheckCircle className="h-5 w-5 mr-2" />
                              {phase === 'warmup' ? 'Complete Warmup' : 'Complete Cooldown'}
                            </Button>
                          </>
                        )}
                      </>
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>

                  {/* Previous Times */}
                  {currentDrillTimes.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Previous Times</h4>
                      <div className="flex gap-3">
                        {currentDrillTimes.map((time, index) => (
                          <Badge key={index} variant="secondary">
                            Rep {index + 1}: {formatTime(time)}s
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RPE and Notes */}
                  {!isRunning && currentDrillTimes.length > 0 && (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <label className="text-sm font-medium">Rate of Perceived Exertion (1-10)</label>
                        <div className="flex items-center gap-4 mt-2">
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
                        <label className="text-sm font-medium">Notes (optional)</label>
                        <Textarea
                          placeholder="Any observations about technique, difficulty, etc..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Drill List */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Warmup Phase */}
                <div className={cn(
                  "p-3 rounded-lg border transition-all",
                  phase === 'warmup' ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200"
                )}>
                  <div className="flex items-center gap-3">
                    {phase !== 'warmup' ? (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <Activity className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium text-sm",
                        phase === 'warmup' && "text-blue-700"
                      )}>
                        Warmup
                      </p>
                      <p className="text-xs text-gray-600">
                        {Math.floor(agilityProgram.warmupDuration / 60)} minutes
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Drills */}
                {agilityProgram.drills.map((drill, index) => (
                  <div
                    key={drill.id || `drill-${index}`}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      phase === 'drills' && index === currentDrillIndex
                        ? "bg-blue-50 border-blue-300"
                        : phase === 'drills' && index < currentDrillIndex
                        ? "bg-green-50 border-green-300"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {phase === 'drills' && index < currentDrillIndex && (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      {phase === 'drills' && index === currentDrillIndex && (
                        <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                      {(phase !== 'drills' || index > currentDrillIndex) && (
                        <div className="h-4 w-4 rounded-full bg-gray-300 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium text-sm",
                          phase === 'drills' && index === currentDrillIndex && "text-blue-700"
                        )}>
                          {drill.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {drill.reps} reps • {drill.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Cooldown Phase */}
                <div className={cn(
                  "p-3 rounded-lg border transition-all",
                  phase === 'cooldown' ? "bg-blue-50 border-blue-300" 
                    : phase === 'warmup' || phase === 'drills' ? "bg-gray-50 border-gray-200"
                    : "bg-green-50 border-green-300"
                )}>
                  <div className="flex items-center gap-3">
                    {phase === 'cooldown' ? (
                      <Activity className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    ) : phase === 'warmup' || phase === 'drills' ? (
                      <div className="h-4 w-4 rounded-full bg-gray-300 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium text-sm",
                        phase === 'cooldown' && "text-blue-700"
                      )}>
                        Cooldown
                      </p>
                      <p className="text-xs text-gray-600">
                        {Math.floor(agilityProgram.cooldownDuration / 60)} minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="speech-toggle" className="text-sm font-medium">
                    Speech Guidance
                  </label>
                  <Switch
                    id="speech-toggle"
                    checked={enableSpeech}
                    onCheckedChange={setEnableSpeech}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="sound-toggle" className="text-sm font-medium">
                    Sound Effects
                  </label>
                  <Switch
                    id="sound-toggle"
                    checked={!isMuted}
                    onCheckedChange={(checked) => setIsMuted(!checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Results */}
          {drillResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Session Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {drillResults.map((result, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm mb-2">{result.drillName}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Best:</span>
                          <span className="ml-1 font-semibold text-green-600">
                            {formatTime(result.bestTime)}s
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg:</span>
                          <span className="ml-1 font-semibold">
                            {formatTime(result.averageTime)}s
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Reps:</span>
                          <span className="ml-1 font-semibold">{result.completedReps}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">RPE:</span>
                          <span className="ml-1 font-semibold">{result.rpe}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-center">Agility Session Complete!</h2>
              <p className="text-gray-600 mb-6 text-center">
                Great work on completing all the agility drills!
              </p>
              
              {/* Results Summary */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold">Session Summary</h3>
                {drillResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{result.drillName}</h4>
                      <Badge>
                        {getPerformanceLevel(
                          result.bestTime,
                          agilityProgram.drills.find(d => (d.id || `drill-${agilityProgram.drills.indexOf(d)}`) === result.drillId)?.targetTime
                        )}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Best Time</p>
                        <p className="font-semibold text-green-600">{formatTime(result.bestTime)}s</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Average</p>
                        <p className="font-semibold">{formatTime(result.averageTime)}s</p>
                      </div>
                      <div>
                        <p className="text-gray-600">RPE</p>
                        <p className="font-semibold">{result.rpe}/10</p>
                      </div>
                    </div>
                    {result.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{result.notes}"</p>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={() => router.push('/player')}
                className="w-full"
                size="lg"
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