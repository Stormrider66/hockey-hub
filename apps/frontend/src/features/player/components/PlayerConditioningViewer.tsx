'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Activity,
  Timer,
  Heart,
  Zap,
  TrendingUp,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkoutSession } from '@/features/physical-trainer/hooks/useWorkoutSession';
import { SessionBroadcastIndicator } from './SessionBroadcastIndicator';

interface Interval {
  duration: number;
  intensity: string;
  targetBPM?: number;
  targetPower?: number;
  targetPace?: string;
  targetRPM?: number;
}

interface IntervalProgram {
  id: string;
  name: string;
  totalDuration: number;
  intervals: Interval[];
  equipment?: string;
}

export function PlayerConditioningViewer() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Get workout data from sessionStorage
  const [workoutData, setWorkoutData] = useState<any>(null);
  const [intervalProgram, setIntervalProgram] = useState<IntervalProgram | null>(null);
  
  // Workout state
  const [isRunning, setIsRunning] = useState(false);
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [intervalTimeRemaining, setIntervalTimeRemaining] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Metrics
  const [currentHeartRate, setCurrentHeartRate] = useState(0);
  const [averageHeartRate, setAverageHeartRate] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  
  // Session Management with Broadcasting
  const [broadcastEnabled, setBroadcastEnabled] = useState(true);
  const {
    session,
    isSessionActive,
    canResume,
    startSession,
    pauseSession: pauseWorkoutSession,
    resumeSession: resumeWorkoutSession,
    completeSession,
    updateMetrics,
    updateProgress,
    resumeFromStorage,
    isConnected,
    isReconnecting,
    queuedUpdates
  } = useWorkoutSession({
    workoutId: workoutData?.workoutId || '',
    eventId: workoutData?.eventId,
    workoutType: 'CONDITIONING',
    workoutData: { intervalProgram },
    broadcastEnabled
  });

  useEffect(() => {
    // Load workout data from sessionStorage
    const storedData = sessionStorage.getItem('currentWorkout');
    if (storedData) {
      const data = JSON.parse(storedData);
      setWorkoutData(data);
      if (data.intervalProgram) {
        setIntervalProgram(data.intervalProgram);
        setIntervalTimeRemaining(data.intervalProgram.intervals[0]?.duration || 0);
        
        // Try to resume existing session
        const resumed = resumeFromStorage();
        if (resumed && session) {
          // Restore session state
          if (session.conditioningState) {
            setCurrentIntervalIndex(session.conditioningState.currentIntervalIndex);
            setIntervalTimeRemaining(session.conditioningState.intervalTimeRemaining);
            setTotalTimeElapsed(session.totalTimeElapsed);
            setIsRunning(!session.isPaused && !session.isCompleted);
            setIsCompleted(session.isCompleted);
            
            // Restore metrics
            if (session.metrics) {
              setCurrentHeartRate(session.metrics.heartRate || 0);
              setAverageHeartRate(session.metrics.averageHeartRate || 0);
              setCaloriesBurned(session.metrics.caloriesBurned || 0);
            }
          }
        }
      }
    }
  }, [resumeFromStorage, session]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Session will be auto-saved by the manager
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isRunning || isCompleted || !intervalProgram) return;

    const timer = setInterval(() => {
      setIntervalTimeRemaining(prev => {
        if (prev <= 1) {
          // Move to next interval
          handleNextInterval();
          return intervalProgram.intervals[currentIntervalIndex + 1]?.duration || 0;
        }
        return prev - 1;
      });
      
      setTotalTimeElapsed(prev => prev + 1);
      
      // Update mock metrics
      updateMockMetrics();
      
      // Update session progress and metrics
      if (intervalProgram) {
        const progress = ((currentIntervalIndex * 100 + ((intervalProgram.intervals[currentIntervalIndex]?.duration - intervalTimeRemaining) / intervalProgram.intervals[currentIntervalIndex]?.duration) * 100) / intervalProgram.intervals.length);
        updateProgress(progress, totalTimeElapsed + 1);
        
        updateMetrics({
          heartRate: currentHeartRate,
          averageHeartRate: averageHeartRate,
          caloriesBurned: caloriesBurned
        });
        
        // Update conditioning state
        if (session?.conditioningState) {
          const newState = { ...session.conditioningState };
          newState.currentIntervalIndex = currentIntervalIndex;
          newState.intervalTimeRemaining = intervalTimeRemaining - 1;
          // Session will be auto-updated and broadcasted by the hook
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, currentIntervalIndex, isCompleted, intervalProgram, session, updateProgress, updateMetrics, currentHeartRate, averageHeartRate, caloriesBurned, totalTimeElapsed, intervalTimeRemaining]);

  // Mock metrics update function
  const updateMockMetrics = () => {
    if (!intervalProgram) return;
    
    const currentInterval = intervalProgram.intervals[currentIntervalIndex];
    const intensity = currentInterval?.intensity?.toLowerCase();
    
    // Simulate heart rate based on intensity
    let targetHR = currentInterval?.targetBPM || 120;
    if (intensity?.includes('high') || intensity?.includes('hard')) {
      targetHR = Math.max(targetHR, 160);
    } else if (intensity?.includes('moderate') || intensity?.includes('medium')) {
      targetHR = Math.max(targetHR, 140);
    }
    
    // Add some realistic variation
    const variation = Math.random() * 10 - 5; // ±5 bpm
    const newHR = Math.max(60, Math.min(200, targetHR + variation));
    
    setCurrentHeartRate(Math.round(newHR));
    setAverageHeartRate(prev => Math.round((prev * 0.9) + (newHR * 0.1)));
    setCaloriesBurned(prev => prev + (newHR > 140 ? 0.3 : 0.2)); // Rough calorie estimation
  };

  const handleNextInterval = () => {
    if (!intervalProgram) return;
    
    if (currentIntervalIndex < intervalProgram.intervals.length - 1) {
      setCurrentIntervalIndex(prev => prev + 1);
      playTransitionSound();
    } else {
      handleComplete();
    }
  };

  const handlePreviousInterval = () => {
    if (currentIntervalIndex > 0) {
      setCurrentIntervalIndex(prev => prev - 1);
      setIntervalTimeRemaining(intervalProgram?.intervals[currentIntervalIndex - 1]?.duration || 0);
    }
  };

  const handleComplete = () => {
    setIsRunning(false);
    setIsCompleted(true);
    playCompletionSound();
    
    // Complete session with final metrics
    completeSession({
      heartRate: currentHeartRate,
      averageHeartRate,
      caloriesBurned,
      maxHeartRate: Math.max(currentHeartRate, averageHeartRate)
    });
    
    // Save workout completion to sessionStorage for immediate access
    const completionData = {
      workoutId: workoutData?.workoutId,
      eventId: workoutData?.eventId,
      completedAt: new Date().toISOString(),
      totalTime: totalTimeElapsed,
      averageHeartRate,
      caloriesBurned
    };
    
    sessionStorage.setItem('lastCompletedWorkout', JSON.stringify(completionData));
  };

  const playTransitionSound = () => {
    if (!isMuted && audioRef.current) {
      audioRef.current.src = '/sounds/beep.mp3';
      audioRef.current.play().catch(() => {});
    }
  };

  const playCompletionSound = () => {
    if (!isMuted && audioRef.current) {
      audioRef.current.src = '/sounds/completion.mp3';
      audioRef.current.play().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // use the fullscreen-aware implementation below

  const updateMetricsLocal = () => {
    // Mock heart rate based on intensity
    const currentInterval = intervalProgram?.intervals[currentIntervalIndex];
    if (currentInterval) {
      const baseHR = currentInterval.targetBPM || 120;
      const variation = Math.random() * 10 - 5;
      setCurrentHeartRate(Math.round(baseHR + variation));
      
      // Update average
      setAverageHeartRate(prev => {
        const newAvg = (prev * (totalTimeElapsed - 1) + currentHeartRate) / totalTimeElapsed;
        return Math.round(newAvg);
      });
      
      // Update calories (rough estimate)
      setCaloriesBurned(prev => prev + (currentHeartRate / 60) * 0.1);
    }
  };

  // remove duplicate formatTime definition

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!intervalProgram) {
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

  const currentInterval = intervalProgram.intervals[currentIntervalIndex];
  const progressPercentage = ((intervalProgram.intervals[currentIntervalIndex].duration - intervalTimeRemaining) / 
    intervalProgram.intervals[currentIntervalIndex].duration) * 100;
  const overallProgress = ((currentIntervalIndex + progressPercentage / 100) / intervalProgram.intervals.length) * 100;

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4",
      isFullscreen && "p-0"
    )}>
      <audio ref={audioRef} />
      
      {/* Session Recovery Banner */}
      {canResume && !isRunning && (
        <div className="max-w-6xl mx-auto mb-4">
          <Card className="bg-yellow-900 border-yellow-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="font-medium text-yellow-100">Session in Progress</p>
                    <p className="text-sm text-yellow-300">
                      Resume from Interval {session?.conditioningState?.currentIntervalIndex + 1} • 
                      {Math.round((session?.totalTimeElapsed || 0) / 60)} min elapsed
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      resumeWorkoutSession();
                      setIsRunning(true);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Are you sure? This will restart the workout from the beginning.')) {
                        clearSession();
                        setCurrentIntervalIndex(0);
                        setIntervalTimeRemaining(intervalProgram?.intervals[0]?.duration || 0);
                        setTotalTimeElapsed(0);
                        setIsCompleted(false);
                      }
                    }}
                    className="border-yellow-600 text-yellow-300 hover:bg-yellow-800"
                  >
                    Restart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      {!isFullscreen && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{workoutData?.eventTitle || intervalProgram.name}</h1>
              <p className="text-gray-400">{workoutData?.location || 'Training Center'}</p>
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
                variant="ghost"
                onClick={() => router.push('/player')}
                className="text-white hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        "max-w-6xl mx-auto",
        isFullscreen && "h-screen flex items-center justify-center"
      )}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Main Display */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8">
                {/* Current Interval Display */}
                <div className="text-center mb-8">
                  <Badge 
                    className={cn(
                      "text-lg px-4 py-2 mb-4",
                      currentInterval.intensity === 'Sprint' && "bg-red-600",
                      currentInterval.intensity === 'Recovery' && "bg-green-600",
                      currentInterval.intensity === 'Moderate' && "bg-yellow-600",
                      currentInterval.intensity === 'Warm-up' && "bg-blue-600",
                      currentInterval.intensity === 'Cool-down' && "bg-purple-600"
                    )}
                  >
                    {currentInterval.intensity}
                  </Badge>
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={intervalTimeRemaining}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.2, opacity: 0 }}
                      className="text-8xl font-bold my-8"
                    >
                      {formatTime(intervalTimeRemaining)}
                    </motion.div>
                  </AnimatePresence>

                  {/* Interval Progress */}
                  <Progress 
                    value={progressPercentage} 
                    className="h-4 mb-4"
                  />

                  {/* Targets */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {currentInterval.targetBPM && (
                      <div className="text-center">
                        <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                        <p className="text-sm text-gray-400">Target HR</p>
                        <p className="text-2xl font-semibold">{currentInterval.targetBPM}</p>
                      </div>
                    )}
                    {currentInterval.targetPower && (
                      <div className="text-center">
                        <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                        <p className="text-sm text-gray-400">Target Power</p>
                        <p className="text-2xl font-semibold">{currentInterval.targetPower}W</p>
                      </div>
                    )}
                    {currentInterval.targetPace && (
                      <div className="text-center">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <p className="text-sm text-gray-400">Target Pace</p>
                        <p className="text-2xl font-semibold">{currentInterval.targetPace}</p>
                      </div>
                    )}
                    {currentInterval.targetRPM && (
                      <div className="text-center">
                        <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <p className="text-sm text-gray-400">Target RPM</p>
                        <p className="text-2xl font-semibold">{currentInterval.targetRPM}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousInterval}
                    disabled={currentIntervalIndex === 0}
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <Button
                    size="lg"
                    onClick={() => {
                      if (!isSessionActive && totalTimeElapsed === 0) {
                        // Start new session
                        startSession();
                        setIsRunning(true);
                      } else if (isRunning) {
                        // Pause session
                        pauseWorkoutSession();
                        setIsRunning(false);
                      } else {
                        // Resume session
                        resumeWorkoutSession();
                        setIsRunning(true);
                      }
                    }}
                    disabled={isCompleted}
                    className={cn(
                      "px-8",
                      isRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        {canResume || totalTimeElapsed > 0 ? 'Resume' : 'Start'}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextInterval}
                    disabled={currentIntervalIndex === intervalProgram.intervals.length - 1}
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Intervals List & Metrics */}
          {!isFullscreen && (
            <div className="space-y-6">
              {/* Metrics */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Live Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400">Heart Rate</span>
                      <span className="text-2xl font-semibold text-red-500">{currentHeartRate} bpm</span>
                    </div>
                    <Progress value={(currentHeartRate / 200) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Avg Heart Rate</span>
                      <span className="font-semibold">{averageHeartRate} bpm</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Calories</span>
                      <span className="font-semibold">{Math.round(caloriesBurned)} kcal</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Time</span>
                      <span className="font-semibold">{formatTime(totalTimeElapsed)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Intervals List */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Workout Structure</CardTitle>
                  <Progress value={overallProgress} className="h-2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {intervalProgram.intervals.map((interval, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-3 rounded-lg border transition-all",
                          index === currentIntervalIndex
                            ? "bg-blue-900/50 border-blue-500"
                            : index < currentIntervalIndex
                            ? "bg-green-900/30 border-green-700"
                            : "bg-gray-700/50 border-gray-600"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {index < currentIntervalIndex && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {index === currentIntervalIndex && (
                              <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                            )}
                            {index > currentIntervalIndex && (
                              <Timer className="h-4 w-4 text-gray-500" />
                            )}
                            <div>
                              <p className="font-medium">{interval.intensity}</p>
                              <p className="text-sm text-gray-400">{formatTime(interval.duration)}</p>
                            </div>
                          </div>
                          {interval.targetBPM && (
                            <Badge variant="outline" className="text-xs">
                              {interval.targetBPM} bpm
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-800 rounded-lg p-8 max-w-md text-center"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Workout Complete!</h2>
              <p className="text-gray-400 mb-6">Great job finishing your conditioning session!</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="text-xl font-semibold">{formatTime(totalTimeElapsed)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg HR</p>
                  <p className="text-xl font-semibold">{averageHeartRate} bpm</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Calories</p>
                  <p className="text-xl font-semibold">{Math.round(caloriesBurned)}</p>
                </div>
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