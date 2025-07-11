'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  StopCircle, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  SkipForward,
  Heart,
  Zap,
  Activity,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { 
  ConditioningSession,
  IntervalSet,
  PersonalizedInterval,
  IntervalExecution,
  WorkoutEquipmentType
} from '../types/conditioning.types';
import { EQUIPMENT_CONFIGS, getHeartRateZone } from '../types/conditioning.types';
import { intervalTimerAudio } from '../services/IntervalTimerAudioService';

interface ConditioningIntervalDisplayProps {
  session: ConditioningSession;
  playerId: string;
  playerName: string;
  onComplete?: (execution: IntervalExecution[]) => void;
  onBack?: () => void;
  realTimeMetrics?: {
    heartRate: number;
    watts?: number;
    rpm?: number;
    pace?: string;
    calories: number;
  };
}

const INTERVAL_COLORS = {
  warmup: '#10b981',
  work: '#ef4444',
  rest: '#3b82f6',
  active_recovery: '#f59e0b',
  cooldown: '#6366f1'
};

export default function ConditioningIntervalDisplay({
  session,
  playerId,
  playerName,
  onComplete,
  onBack,
  realTimeMetrics
}: ConditioningIntervalDisplayProps) {
  const { t } = useTranslation(['physicalTrainer']);
  
  // Get personalized intervals or use base intervals
  const intervals = session.personalizedPrograms?.[playerId] || session.intervalProgram.intervals;
  
  // Timer state
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(intervals[0]?.duration || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  
  // Execution tracking
  const [intervalExecutions, setIntervalExecutions] = useState<IntervalExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<Partial<IntervalExecution>>({});
  
  const currentInterval = intervals[currentIntervalIndex];
  const totalIntervals = intervals.length;
  const equipmentConfig = EQUIPMENT_CONFIGS[session.equipment[0] || WorkoutEquipmentType.ROWING];
  
  // Calculate session progress
  const totalSessionTime = intervals.reduce((acc, interval) => acc + interval.duration, 0);
  const elapsedTime = intervals
    .slice(0, currentIntervalIndex)
    .reduce((acc, interval) => acc + interval.duration, 0) + 
    (currentInterval?.duration - timeRemaining);
  const sessionProgress = (elapsedTime / totalSessionTime) * 100;
  
  // Initialize audio
  useEffect(() => {
    intervalTimerAudio.resume();
    intervalTimerAudio.setVolume(volume);
  }, [volume]);
  
  // Play sound helper
  const playSound = useCallback((type: 'start' | 'end' | 'countdown' | 'warning') => {
    if (!soundEnabled) return;
    intervalTimerAudio.playSound(type);
  }, [soundEnabled]);
  
  // Start tracking execution when interval starts
  const startIntervalExecution = useCallback(() => {
    setCurrentExecution({
      intervalId: currentInterval.id,
      playerId,
      startTime: new Date(),
      metrics: {}
    });
  }, [currentInterval, playerId]);
  
  // Complete interval execution
  const completeIntervalExecution = useCallback(() => {
    if (currentExecution.startTime) {
      const execution: IntervalExecution = {
        intervalId: currentInterval.id,
        playerId,
        startTime: currentExecution.startTime,
        endTime: new Date(),
        actualDuration: (new Date().getTime() - currentExecution.startTime.getTime()) / 1000,
        metrics: {
          // Add real-time metrics if available
          avgHeartRate: realTimeMetrics?.heartRate,
          avgWatts: realTimeMetrics?.watts,
          totalCalories: realTimeMetrics?.calories || 0
        },
        targetAchievement: calculateTargetAchievement(),
        notes: ''
      };
      
      setIntervalExecutions(prev => [...prev, execution]);
    }
  }, [currentExecution, currentInterval, playerId, realTimeMetrics]);
  
  // Calculate target achievement percentage
  const calculateTargetAchievement = useCallback(() => {
    if (!realTimeMetrics || !currentInterval.targetMetrics) return 100;
    
    let achievements = [];
    
    // Heart rate achievement
    if (currentInterval.targetMetrics.heartRate && realTimeMetrics.heartRate) {
      const target = (currentInterval as PersonalizedInterval).personalizedTargets?.heartRate ||
                    currentInterval.targetMetrics.heartRate.value;
      const diff = Math.abs(realTimeMetrics.heartRate - target);
      const achievement = Math.max(0, 100 - (diff / target * 100));
      achievements.push(achievement);
    }
    
    // Watts achievement
    if (currentInterval.targetMetrics.watts && realTimeMetrics.watts) {
      const target = (currentInterval as PersonalizedInterval).personalizedTargets?.watts ||
                    currentInterval.targetMetrics.watts.value;
      const diff = Math.abs(realTimeMetrics.watts - target);
      const achievement = Math.max(0, 100 - (diff / target * 100));
      achievements.push(achievement);
    }
    
    return achievements.length > 0 
      ? achievements.reduce((a, b) => a + b) / achievements.length 
      : 100;
  }, [realTimeMetrics, currentInterval]);
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused) {
      // Start execution tracking for new interval
      if (timeRemaining === currentInterval?.duration) {
        startIntervalExecution();
      }
      
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          // Warning beep at 5 seconds
          if (prev === 5) {
            playSound('warning');
          }
          
          // Countdown beeps
          if (prev <= 3 && prev > 0) {
            playSound('countdown');
          }
          
          if (prev <= 1) {
            // Complete current interval execution
            completeIntervalExecution();
            
            // Move to next interval
            if (currentIntervalIndex < intervals.length - 1) {
              playSound('end');
              setCurrentIntervalIndex(i => i + 1);
              return intervals[currentIntervalIndex + 1].duration;
            } else {
              // Session complete
              playSound('end');
              setIsRunning(false);
              if (onComplete) onComplete(intervalExecutions);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isPaused, currentIntervalIndex, intervals, playSound, startIntervalExecution, completeIntervalExecution, intervalExecutions, onComplete]);
  
  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Control handlers
  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    playSound('start');
  };
  
  const handlePause = () => {
    setIsPaused(!isPaused);
  };
  
  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentIntervalIndex(0);
    setTimeRemaining(intervals[0]?.duration || 0);
    setIntervalExecutions([]);
  };
  
  const handleSkip = () => {
    if (currentIntervalIndex < intervals.length - 1) {
      completeIntervalExecution();
      setCurrentIntervalIndex(i => i + 1);
      setTimeRemaining(intervals[currentIntervalIndex + 1].duration);
    }
  };
  
  const handleReset = () => {
    setTimeRemaining(currentInterval?.duration || 0);
  };
  
  // Get target display
  const getTargetDisplay = () => {
    if (!currentInterval) return null;
    
    const targets = [];
    const personalized = currentInterval as PersonalizedInterval;
    
    if (currentInterval.targetMetrics.heartRate) {
      targets.push({
        icon: Heart,
        label: 'HR',
        value: personalized.personalizedTargets?.heartRate || currentInterval.targetMetrics.heartRate.value,
        unit: 'BPM',
        current: realTimeMetrics?.heartRate
      });
    }
    
    if (currentInterval.targetMetrics.watts) {
      targets.push({
        icon: Zap,
        label: 'Power',
        value: personalized.personalizedTargets?.watts || currentInterval.targetMetrics.watts.value,
        unit: 'W',
        current: realTimeMetrics?.watts
      });
    }
    
    if (currentInterval.targetMetrics.pace) {
      targets.push({
        icon: Activity,
        label: 'Pace',
        value: personalized.personalizedTargets?.pace || currentInterval.targetMetrics.pace.value,
        unit: equipmentConfig.units.pace || '',
        current: realTimeMetrics?.pace
      });
    }
    
    return targets;
  };
  
  const targets = getTargetDisplay();
  const isOnTarget = calculateTargetAchievement() >= 90;
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">{session.intervalProgram.name}</h2>
            <p className="text-muted-foreground">
              {playerName} • {equipmentConfig.label} • Interval {currentIntervalIndex + 1}/{totalIntervals}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          {soundEnabled && (
            <div className="w-24">
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Panel - Current Interval */}
        <div className="col-span-8 space-y-4">
          {/* Phase Indicator */}
          <Card className={cn(
            "border-2",
            isOnTarget ? "border-green-500" : "border-orange-500"
          )}>
            <CardContent className="p-8">
              <div 
                className="text-center p-6 rounded-xl mb-6"
                style={{ backgroundColor: `${currentInterval?.color || INTERVAL_COLORS[currentInterval?.type || 'work']}20` }}
              >
                <h3 
                  className="text-5xl font-bold mb-2"
                  style={{ color: currentInterval?.color || INTERVAL_COLORS[currentInterval?.type || 'work'] }}
                >
                  {currentInterval?.name || currentInterval?.type.toUpperCase().replace('_', ' ')}
                </h3>
                
                {/* Timer */}
                <div className="text-8xl font-mono font-bold my-4">
                  {formatTime(timeRemaining)}
                </div>
                
                {/* Notes */}
                {currentInterval?.notes && (
                  <p className="text-lg text-muted-foreground">{currentInterval.notes}</p>
                )}
              </div>
              
              {/* Targets */}
              {targets && targets.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {targets.map((target, idx) => (
                    <Card key={idx} className={cn(
                      "relative overflow-hidden",
                      target.current && Math.abs(target.current - target.value) / target.value > 0.1 
                        ? "border-orange-500" 
                        : "border-green-500"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <target.icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{target.label}</span>
                          </div>
                          <Badge variant="outline">
                            Target: {target.value} {target.unit}
                          </Badge>
                        </div>
                        {target.current && (
                          <div className="text-center">
                            <p className="text-3xl font-bold">{target.current}</p>
                            <p className="text-xs text-muted-foreground">{target.unit}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Controls */}
          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <Button size="lg" onClick={handleStart} className="h-14 px-6">
                <Play className="h-5 w-5 mr-2" />
                Start Workout
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePause}
                  className="h-14 px-6"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleReset}
                  className="h-14 px-6"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reset
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={currentIntervalIndex >= intervals.length - 1}
                  className="h-14 px-6"
                >
                  <SkipForward className="h-5 w-5 mr-2" />
                  Skip
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleStop}
                  className="h-14 px-6"
                >
                  <StopCircle className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Right Panel - Overview */}
        <div className="col-span-4 space-y-4">
          {/* Session Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(sessionProgress)}%</span>
                </div>
                <Progress value={sessionProgress} className="h-2" />
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold">{formatTime(Math.round(elapsedTime))}</p>
                <p className="text-sm text-muted-foreground">
                  of {formatTime(totalSessionTime)} total
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Real-time Metrics */}
          {realTimeMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Heart Rate</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={getHeartRateZone(realTimeMetrics.heartRate, 190) >= 4 ? 'destructive' : 'default'}>
                        Zone {getHeartRateZone(realTimeMetrics.heartRate, 190)}
                      </Badge>
                      <span className="font-bold">{realTimeMetrics.heartRate} BPM</span>
                    </div>
                  </div>
                  {realTimeMetrics.watts && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Power</span>
                      <span className="font-bold">{realTimeMetrics.watts} W</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Calories</span>
                    <span className="font-bold">{realTimeMetrics.calories}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Interval Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Workout Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {intervals.map((interval, idx) => (
                  <div
                    key={interval.id}
                    className={cn(
                      "p-2 rounded-lg flex items-center justify-between text-sm",
                      idx === currentIntervalIndex && "ring-2 ring-primary",
                      idx < currentIntervalIndex && "opacity-50"
                    )}
                    style={{ 
                      backgroundColor: `${interval.color || INTERVAL_COLORS[interval.type]}20` 
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{idx + 1}
                      </Badge>
                      <span className="font-medium">
                        {interval.name || interval.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {idx < currentIntervalIndex && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <Badge variant="secondary">
                        {formatTime(interval.duration)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}