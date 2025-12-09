'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { 
  Play, Pause, StopCircle, RotateCcw, Volume2, VolumeX,
  ArrowLeft, Activity, Clock
} from 'lucide-react';
import { intervalTimerAudio } from '../services/IntervalTimerAudioService';

interface Interval {
  phase: 'work' | 'rest';
  duration: number; // seconds
}

interface IntervalDisplayProps {
  teamName: string;
  intervals: Interval[];
  onBack: () => void;
  onComplete?: () => void;
  className?: string;
}

export default function IntervalDisplay({
  teamName,
  intervals,
  onBack,
  onComplete,
  className
}: IntervalDisplayProps) {
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(intervals[0]?.duration || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const currentInterval = intervals[currentIntervalIndex];
  const totalIntervals = intervals.length;
  const isWorkPhase = currentInterval?.phase === 'work';
  
  // Calculate total session time
  const totalSessionTime = intervals.reduce((acc, interval) => acc + interval.duration, 0);
  const elapsedTime = intervals
    .slice(0, currentIntervalIndex)
    .reduce((acc, interval) => acc + interval.duration, 0) + 
    (currentInterval?.duration - timeRemaining);
  const sessionProgress = (elapsedTime / totalSessionTime) * 100;

  // Volume state
  const [volume, setVolume] = useState(0.7);
  
  // Initialize audio service on mount
  useEffect(() => {
    intervalTimerAudio.resume(); // Resume audio context if needed
    intervalTimerAudio.setVolume(volume);
    
    return () => {
      // Cleanup is handled by the singleton
    };
  }, []);
  
  // Update volume when changed
  useEffect(() => {
    intervalTimerAudio.setVolume(volume);
  }, [volume]);
  
  // Audio effects
  const playSound = useCallback((type: 'start' | 'end' | 'countdown' | 'warning') => {
    if (!soundEnabled) return;
    intervalTimerAudio.playSound(type);
  }, [soundEnabled]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused) {
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
            // Move to next interval
            if (currentIntervalIndex < intervals.length - 1) {
              playSound('end');
              setCurrentIntervalIndex(i => i + 1);
              return intervals[currentIntervalIndex + 1].duration;
            } else {
              // Session complete
              playSound('end');
              setIsRunning(false);
              if (onComplete) onComplete();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isPaused, currentIntervalIndex, intervals, playSound, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
  };

  const handleReset = () => {
    setTimeRemaining(currentInterval?.duration || 0);
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
            <h1 className="text-3xl font-bold">{teamName} - Interval Training</h1>
            <p className="text-lg text-muted-foreground">
              Interval {currentIntervalIndex + 1} of {totalIntervals}
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

      {/* Main Display */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Phase Indicator */}
          <div className={cn(
            "text-center p-8 rounded-2xl",
            isWorkPhase ? "bg-red-500/20" : "bg-green-500/20"
          )}>
            <h2 className={cn(
              "text-6xl md:text-8xl font-bold mb-4",
              isWorkPhase ? "text-red-600" : "text-green-600"
            )}>
              {isWorkPhase ? "WORK" : "REST"}
            </h2>
            
            {/* Timer */}
            <div className="text-[120px] md:text-[180px] font-mono font-bold leading-none">
              {formatTime(timeRemaining)}
            </div>
            
            {/* Next Phase Preview */}
            {currentIntervalIndex < intervals.length - 1 && (
              <div className="mt-6 text-2xl text-muted-foreground">
                Next: {intervals[currentIntervalIndex + 1].phase === 'work' ? 'WORK' : 'REST'} 
                {' '}({formatTime(intervals[currentIntervalIndex + 1].duration)})
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-4">
            <div className="flex justify-between text-lg">
              <span>Session Progress</span>
              <span>{Math.round(sessionProgress)}%</span>
            </div>
            <Progress value={sessionProgress} className="h-4" />
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <Button
                size="lg"
                onClick={handleStart}
                className="h-16 px-8 text-xl"
              >
                <Play className="h-6 w-6 mr-2" />
                Start
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
                  variant="outline"
                  onClick={handleReset}
                  className="h-16 px-8 text-xl"
                >
                  <RotateCcw className="h-6 w-6 mr-2" />
                  Reset Interval
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

          {/* Interval Overview */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Interval Overview
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {intervals.map((interval, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg text-center text-sm",
                      interval.phase === 'work' ? "bg-red-100" : "bg-green-100",
                      index === currentIntervalIndex && "ring-2 ring-primary",
                      index < currentIntervalIndex && "opacity-50"
                    )}
                  >
                    <div className="font-medium">
                      {interval.phase === 'work' ? 'W' : 'R'}{index + 1}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(interval.duration)}
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