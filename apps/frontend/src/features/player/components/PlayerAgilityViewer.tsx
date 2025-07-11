'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
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
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AgilityDrill {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  setup: {
    equipment: string[];
    spacing: string;
    diagram?: string;
  };
  instructions: string[];
  metrics: {
    targetTime?: { elite: number; good: number; average: number };
    targetSpeed?: string;
    restBetweenReps: number;
    recommendedReps: number;
  };
  coachingCues: string[];
  variations?: string[];
  progressions?: string[];
  tags: string[];
}

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
  const [agilityDrills, setAgilityDrills] = useState<AgilityDrill[]>([]);
  
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
  
  // Form inputs
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    // Load workout data from sessionStorage
    const storedData = sessionStorage.getItem('currentWorkout');
    if (storedData) {
      const data = JSON.parse(storedData);
      setWorkoutData(data);
      if (data.agilityProgram?.drills) {
        setAgilityDrills(data.agilityProgram.drills);
      }
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isResting && !isCompleted) {
      interval = setInterval(() => {
        setTimer(prev => prev + 0.01); // 10ms intervals for precision
      }, 10);
    } else if (isResting && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsResting(false);
            playStartSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isResting, restTimeRemaining, isCompleted]);

  const handleStartDrill = () => {
    setIsRunning(true);
    setTimer(0);
    playStartSound();
  };

  const handleStopDrill = () => {
    if (!isRunning || timer === 0) return;
    
    setIsRunning(false);
    const currentTime = timer;
    setCurrentDrillTimes(prev => [...prev, currentTime]);
    
    const currentDrill = agilityDrills[currentDrillIndex];
    
    // Check if more reps needed
    if (currentRep < currentDrill.metrics.recommendedReps) {
      setCurrentRep(prev => prev + 1);
      setIsResting(true);
      setRestTimeRemaining(currentDrill.metrics.restBetweenReps);
      playStopSound();
    } else {
      // Drill complete
      handleCompleteDrill();
    }
  };

  const handleCompleteDrill = () => {
    const currentDrill = agilityDrills[currentDrillIndex];
    const avgTime = currentDrillTimes.reduce((a, b) => a + b, 0) / currentDrillTimes.length;
    const bestTime = Math.min(...currentDrillTimes);
    
    const result: DrillResult = {
      drillId: currentDrill.id,
      drillName: currentDrill.name,
      completedReps: currentDrillTimes.length,
      times: currentDrillTimes,
      averageTime: avgTime,
      bestTime: bestTime,
      rpe,
      notes
    };
    
    setDrillResults(prev => [...prev, result]);
    
    // Reset for next drill
    setCurrentDrillTimes([]);
    setTimer(0);
    setCurrentRep(1);
    setRpe(5);
    setNotes('');
    
    // Move to next drill or complete workout
    if (currentDrillIndex < agilityDrills.length - 1) {
      setCurrentDrillIndex(prev => prev + 1);
      setShowInstructions(true);
    } else {
      handleCompleteWorkout();
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

  if (!agilityDrills.length) {
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

  const currentDrill = agilityDrills[currentDrillIndex];
  const overallProgress = ((currentDrillIndex + (currentRep - 1) / currentDrill.metrics.recommendedReps) / agilityDrills.length) * 100;

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
          <Button
            variant="outline"
            onClick={() => router.push('/player')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-6xl mx-auto mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>Drill {currentDrillIndex + 1} of {agilityDrills.length}</span>
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
                  <Target className="h-5 w-5" />
                  <CardTitle>{currentDrill.name}</CardTitle>
                </div>
                <Badge>{currentDrill.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {showInstructions ? (
                <div className="space-y-6">
                  {/* Drill Description */}
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600">{currentDrill.description}</p>
                  </div>

                  {/* Setup */}
                  <div>
                    <h4 className="font-medium mb-2">Setup</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm mb-2">
                        <strong>Equipment:</strong> {currentDrill.setup.equipment.join(', ')}
                      </p>
                      <p className="text-sm">
                        <strong>Spacing:</strong> {currentDrill.setup.spacing}
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
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

                  {/* Coaching Cues */}
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

                  <Button
                    onClick={() => setShowInstructions(false)}
                    className="w-full"
                    size="lg"
                  >
                    Start Drill
                  </Button>
                </div>
              ) : isResting ? (
                <div className="text-center py-8">
                  <Timer className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <p className="text-xl font-medium mb-2">Rest Period</p>
                  <p className="text-5xl font-bold text-blue-600 mb-6">
                    {restTimeRemaining}
                  </p>
                  <p className="text-gray-600">
                    Next: Rep {currentRep} of {currentDrill.metrics.recommendedReps}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Timer Display */}
                  <div className="text-center py-8">
                    <Badge className="mb-4">
                      Rep {currentRep} of {currentDrill.metrics.recommendedReps}
                    </Badge>
                    
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={timer}
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "text-8xl font-bold mb-4",
                          isRunning ? "text-blue-600" : "text-gray-800"
                        )}
                      >
                        {formatTime(timer)}
                      </motion.div>
                    </AnimatePresence>

                    <p className="text-lg text-gray-600">seconds</p>

                    {/* Target Times */}
                    {currentDrill.metrics.targetTime && (
                      <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Elite</p>
                          <p className="font-semibold text-green-600">
                            {currentDrill.metrics.targetTime.elite}s
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Good</p>
                          <p className="font-semibold text-blue-600">
                            {currentDrill.metrics.targetTime.good}s
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Average</p>
                          <p className="font-semibold text-gray-600">
                            {currentDrill.metrics.targetTime.average}s
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
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
              <CardTitle>Drill Sequence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agilityDrills.map((drill, index) => (
                  <div
                    key={drill.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      index === currentDrillIndex
                        ? "bg-blue-50 border-blue-300"
                        : index < currentDrillIndex
                        ? "bg-green-50 border-green-300"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {index < currentDrillIndex && (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      {index === currentDrillIndex && (
                        <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                      {index > currentDrillIndex && (
                        <div className="h-4 w-4 rounded-full bg-gray-300 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium text-sm",
                          index === currentDrillIndex && "text-blue-700"
                        )}>
                          {drill.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {drill.metrics.recommendedReps} reps • {drill.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
                          agilityDrills.find(d => d.id === result.drillId)?.metrics.targetTime
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