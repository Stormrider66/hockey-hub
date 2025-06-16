import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAppSelector } from '../../store/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Play, Pause, RotateCcw, Heart, Activity, Timer, TrendingUp, Zap } from 'lucide-react';

interface IntervalDisplayProps {
  socket: Socket | null;
}

export default function IntervalDisplay({ socket }: IntervalDisplayProps) {
  const intervals = useAppSelector((state) => state.trainingSessionViewer.intervals);
  const selectedPlayerId = useAppSelector((state) => state.trainingSessionViewer.selectedPlayerId);
  
  const [currentInterval, setCurrentInterval] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [heartRate, setHeartRate] = useState(72);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);
  const [power, setPower] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);

  // Session configuration - in real app this would come from session setup
  const sessionConfig = {
    description: '8x4 min Wattbike',
    workDuration: '4 min',
    restDuration: '2 min',
    targetPower: 290,
    device: 'Wattbike'
  };

  // Simulate heart rate changes based on interval phase
  useEffect(() => {
    if (!isRunning || isPaused || !intervals[currentInterval]) return;

    const interval = setInterval(() => {
      const isWork = intervals[currentInterval].phase === 'work';
      const targetHR = isWork ? 165 + Math.random() * 20 : 120 + Math.random() * 20;
      const currentHR = heartRate;
      const newHR = currentHR + (targetHR - currentHR) * 0.1 + (Math.random() - 0.5) * 5;
      
      setHeartRate(Math.round(Math.max(60, Math.min(195, newHR))));
      setHeartRateHistory(prev => [...prev.slice(-50), newHR]);
      
      const targetPower = isWork ? 280 + Math.random() * 40 : 120 + Math.random() * 30;
      setPower(Math.round(targetPower));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, currentInterval, intervals, heartRate]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || isPaused || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Move to next interval
          if (currentInterval < intervals.length - 1) {
            setCurrentInterval(currentInterval + 1);
            return intervals[currentInterval + 1].duration;
          } else {
            setIsRunning(false);
            return 0;
          }
        }
        return prev - 1;
      });
      setTotalElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeRemaining, currentInterval, intervals]);

  const startWorkout = () => {
    if (intervals.length > 0) {
      setCurrentInterval(0);
      setTimeRemaining(intervals[0].duration);
      setIsRunning(true);
      setIsPaused(false);
      setTotalElapsed(0);
      setHeartRateHistory([]);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetWorkout = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentInterval(0);
    setTimeRemaining(0);
    setTotalElapsed(0);
    setHeartRate(72);
    setHeartRateHistory([]);
    setPower(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getHeartRateZone = (hr: number) => {
    if (hr < 120) return { zone: 1, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Warm-up' };
    if (hr < 140) return { zone: 2, color: 'text-green-500', bg: 'bg-green-100', label: 'Easy' };
    if (hr < 160) return { zone: 3, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Moderate' };
    if (hr < 175) return { zone: 4, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Hard' };
    return { zone: 5, color: 'text-red-500', bg: 'bg-red-100', label: 'Maximum' };
  };

  const currentIntervalData = intervals[currentInterval];
  const hrZone = getHeartRateZone(heartRate);
  const isWork = currentIntervalData?.phase === 'work';

  // Calculate which work interval we're on (1-8)
  const workIntervalNumber = Math.floor(currentInterval / 2) + 1;
  const totalWorkIntervals = Math.ceil(intervals.length / 2);

  // Calculate progress
  const intervalProgress = currentIntervalData 
    ? ((currentIntervalData.duration - timeRemaining) / currentIntervalData.duration) * 100
    : 0;
  
  const totalProgress = intervals.length > 0 
    ? (currentInterval / intervals.length) * 100 + (intervalProgress / intervals.length)
    : 0;

  return (
    <div className="w-full h-full p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Interval Training</h2>
            <p className="text-muted-foreground">
              {isWork ? 'High Intensity Phase' : 'Recovery Phase'} • Interval {workIntervalNumber} of {totalWorkIntervals}
            </p>
            <p className="text-sm font-medium mt-1">
              {sessionConfig.description} • {sessionConfig.workDuration} work / {sessionConfig.restDuration} rest
            </p>
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={startWorkout} size="lg" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                <Play className="h-5 w-5 mr-2" />
                Start Workout
              </Button>
            ) : (
              <>
                <Button onClick={togglePause} size="lg" variant={isPaused ? "default" : "secondary"}>
                  {isPaused ? <Play className="h-5 w-5 mr-2" /> : <Pause className="h-5 w-5 mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button onClick={resetWorkout} size="lg" variant="outline">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Display */}
        <div className="grid grid-cols-3 gap-6">
          {/* Timer Display */}
          <Card className={cn(
            "col-span-2 transition-all duration-500",
            isWork ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-red-200 dark:border-red-800" 
                   : "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800"
          )}>
            <CardContent className="p-8">
              <div className="text-center">
                <div className={cn(
                  "text-8xl font-bold tabular-nums mb-4 transition-colors",
                  isWork ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                )}>
                  {formatTime(timeRemaining)}
                </div>
                <Badge variant="outline" className={cn(
                  "text-lg px-4 py-2",
                  isWork ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300" 
                         : "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                )}>
                  {isWork ? 'WORK' : 'REST'}
                </Badge>
              </div>

              {/* Progress Bars */}
              <div className="mt-8 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Interval Progress</span>
                    <span>{Math.round(intervalProgress)}%</span>
                  </div>
                  <Progress value={intervalProgress} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total Progress</span>
                    <span>{Math.round(totalProgress)}%</span>
                  </div>
                  <Progress value={totalProgress} className="h-2" />
                </div>
              </div>

              {/* Session Time */}
              <div className="mt-6 flex justify-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <Timer className="h-4 w-4 mr-2" />
                  Total Time: {formatTime(totalElapsed)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Heart Rate Display */}
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Heart Rate Monitor
              </h3>
              
              {/* Heart Rate Value */}
              <div className="text-center mb-6">
                <div className={cn("text-6xl font-bold", hrZone.color)}>
                  {heartRate}
                </div>
                <div className="text-sm text-muted-foreground">BPM</div>
                <Badge className={cn("mt-2", hrZone.bg, hrZone.color)}>
                  Zone {hrZone.zone} - {hrZone.label}
                </Badge>
              </div>

              {/* Heart Rate Chart */}
              <div className="h-24 flex items-end gap-0.5 mb-4">
                {heartRateHistory.slice(-30).map((hr, i) => {
                  const height = ((hr - 60) / 135) * 100;
                  const zone = getHeartRateZone(hr);
                  return (
                    <div
                      key={i}
                      className={cn("flex-1 transition-all duration-300", zone.bg)}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>

              {/* Power Output */}
              <div className="border-t pt-4">
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={power >= sessionConfig.targetPower ? "default" : "secondary"} className="font-medium">
                      Target: {sessionConfig.targetPower}W
                    </Badge>
                    {isWork && (
                      <span className={cn(
                        "text-xs font-medium",
                        power >= sessionConfig.targetPower ? "text-green-600" : "text-orange-600"
                      )}>
                        {power >= sessionConfig.targetPower ? "On target ✓" : `${sessionConfig.targetPower - power}W below`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Power Output
                  </span>
                  <span className="text-2xl font-bold">{power}W</span>
                </div>
                <Progress 
                  value={Math.min((power / sessionConfig.targetPower) * 100, 100)} 
                  className={cn(
                    "h-2",
                    power >= sessionConfig.targetPower ? "bg-green-100" : ""
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Intervals */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Intervals</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {intervals.map((interval, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-lg border transition-all",
                    index === currentInterval 
                      ? "bg-primary text-primary-foreground border-primary scale-110" 
                      : index < currentInterval 
                        ? "bg-muted text-muted-foreground border-muted" 
                        : "bg-background border-border"
                  )}
                >
                  <div className="text-xs font-medium">
                    {index === currentInterval ? 'CURRENT' : `#${index + 1}`}
                  </div>
                  <div className="font-semibold">
                    {interval.phase === 'work' ? 'WORK' : 'REST'}
                  </div>
                  <div className="text-sm">{formatTime(interval.duration)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 