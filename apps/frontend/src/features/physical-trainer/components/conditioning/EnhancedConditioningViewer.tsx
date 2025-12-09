'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ChevronRight,
  Waves,
  TrendingUp,
  Users,
  User,
  Volume1
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { 
  ConditioningSession,
  IntervalSet,
  PersonalizedInterval,
  IntervalExecution,
  WorkoutEquipmentType,
  PlayerTestResult
} from '../../types/conditioning.types';
import { 
  EQUIPMENT_CONFIGS, 
  GARMIN_HR_ZONES,
  POWER_ZONES,
  getGarminZoneFromHR,
  calculateZoneHRRange,
  calculateZonePowerRange,
  getPlayerMaxHR,
  getPlayerFTP
} from '../../types/conditioning.types';
import { intervalTimerAudio } from '../../services/IntervalTimerAudioService';

interface EnhancedConditioningViewerProps {
  session: ConditioningSession;
  mode: 'single' | 'group'; // Single player or group coach view
  // For single player mode
  playerId?: string;
  playerName?: string;
  playerTests?: PlayerTestResult[];
  // For group mode
  participants?: Array<{
    id: string;
    name: string;
    realTimeMetrics?: RealTimeMetrics;
    playerTests?: PlayerTestResult[];
  }>;
  onComplete?: (execution: IntervalExecution[]) => void;
  onBack?: () => void;
  // Real-time data
  realTimeMetrics?: RealTimeMetrics;
  onMetricsUpdate?: (playerId: string, metrics: RealTimeMetrics) => void;
}

interface RealTimeMetrics {
  heartRate: number;
  watts?: number;
  rpm?: number;
  pace?: string;
  speed?: number;
  calories: number;
  distance?: number;
  timestamp: Date;
}

interface ZoneStatus {
  current: number;
  target: number | { min: number; max: number };
  inZone: boolean;
  type: 'heart_rate' | 'power';
  color: string;
}

const INTERVAL_COLORS = {
  warmup: '#10b981',
  work: '#ef4444',
  rest: '#3b82f6',
  active_recovery: '#f59e0b',
  cooldown: '#6366f1'
};

export default function EnhancedConditioningViewer({
  session,
  mode = 'single',
  playerId,
  playerName,
  playerTests = [],
  participants = [],
  onComplete,
  onBack,
  realTimeMetrics,
  onMetricsUpdate
}: EnhancedConditioningViewerProps) {
  const { t } = useTranslation(['physicalTrainer']);
  
  // Get intervals (personalized or base)
  const intervals = useMemo(() => {
    if (mode === 'single' && playerId && session.personalizedPrograms?.[playerId]) {
      return session.personalizedPrograms[playerId];
    }
    return session.intervalProgram.intervals;
  }, [session, mode, playerId]);
  
  // Timer state
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(intervals[0]?.duration || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  
  // View options
  const [showGroupView, setShowGroupView] = useState(mode === 'group');
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  
  // Execution tracking
  const [intervalExecutions, setIntervalExecutions] = useState<IntervalExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<Partial<IntervalExecution>>({});
  const [timeInZone, setTimeInZone] = useState<Record<string, number>>({});
  
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
  
  // Player stats for calculations
  const playerStats = useMemo(() => {
    if (mode === 'single' && playerId && playerTests.length) {
      return {
        maxHR: getPlayerMaxHR({ id: playerId }, playerTests),
        ftp: getPlayerFTP({ id: playerId }, playerTests),
      };
    }
    return null;
  }, [mode, playerId, playerTests]);

  // Initialize audio
  useEffect(() => {
    intervalTimerAudio.resume();
    intervalTimerAudio.setVolume(volume);
  }, [volume]);
  
  // Play sound helper
  const playSound = useCallback((type: 'start' | 'end' | 'countdown' | 'warning' | 'zone_exit') => {
    if (!soundEnabled) return;
    intervalTimerAudio.playSound(type);
  }, [soundEnabled]);
  
  // Zone calculation and monitoring
  const getZoneStatus = useCallback((metrics: RealTimeMetrics): ZoneStatus[] => {
    const statuses: ZoneStatus[] = [];
    
    // Heart Rate Zone Status
    if (metrics.heartRate && currentInterval.targetMetrics.heartRate && playerStats?.maxHR) {
      const hrTarget = currentInterval.targetMetrics.heartRate;
      const currentZone = getGarminZoneFromHR(metrics.heartRate, playerStats.maxHR);
      
      let targetZone: number | { min: number; max: number };
      let inZone = false;
      
      if (hrTarget.type === 'zone' && hrTarget.zoneSystem === 'garmin_hr') {
        targetZone = typeof hrTarget.value === 'number' ? hrTarget.value : hrTarget.value.min;
        inZone = currentZone?.zone === targetZone;
      } else if (hrTarget.type === 'percentage') {
        const targetHR = Math.round((playerStats.maxHR * (typeof hrTarget.value === 'number' ? hrTarget.value : hrTarget.value.min)) / 100);
        targetZone = { min: targetHR - 5, max: targetHR + 5 };
        inZone = metrics.heartRate >= targetZone.min && metrics.heartRate <= targetZone.max;
      } else {
        const targetHR = typeof hrTarget.value === 'number' ? hrTarget.value : hrTarget.value.min;
        targetZone = { min: targetHR - 5, max: targetHR + 5 };
        inZone = metrics.heartRate >= targetZone.min && metrics.heartRate <= targetZone.max;
      }
      
      statuses.push({
        current: currentZone?.zone || 1,
        target: targetZone,
        inZone,
        type: 'heart_rate',
        color: currentZone?.color || '#94a3b8'
      });
    }
    
    // Power Zone Status
    if (metrics.watts && currentInterval.targetMetrics.watts && playerStats?.ftp) {
      const powerTarget = currentInterval.targetMetrics.watts;
      const currentPowerZone = POWER_ZONES.find(zone => {
        const range = calculateZonePowerRange(zone.zone, playerStats.ftp!);
        return metrics.watts! >= range.min && metrics.watts! <= range.max;
      });
      
      let targetZone: number | { min: number; max: number };
      let inZone = false;
      
      if (powerTarget.type === 'zone' && powerTarget.zoneSystem === 'power') {
        targetZone = typeof powerTarget.value === 'number' ? powerTarget.value : powerTarget.value.min;
        inZone = currentPowerZone?.zone === targetZone;
      } else if (powerTarget.type === 'percentage') {
        const targetWatts = Math.round((playerStats.ftp * (typeof powerTarget.value === 'number' ? powerTarget.value : powerTarget.value.min)) / 100);
        targetZone = { min: targetWatts - 10, max: targetWatts + 10 };
        inZone = metrics.watts >= targetZone.min && metrics.watts <= targetZone.max;
      } else {
        const targetWatts = typeof powerTarget.value === 'number' ? powerTarget.value : powerTarget.value.min;
        targetZone = { min: targetWatts - 10, max: targetWatts + 10 };
        inZone = metrics.watts >= targetZone.min && metrics.watts <= targetZone.max;
      }
      
      statuses.push({
        current: currentPowerZone?.zone || 1,
        target: targetZone,
        inZone,
        type: 'power',
        color: currentPowerZone?.color || '#94a3b8'
      });
    }
    
    return statuses;
  }, [currentInterval, playerStats]);

  // Zone monitoring and alerts
  const [previousZoneStatus, setPreviousZoneStatus] = useState<ZoneStatus[]>([]);
  
  useEffect(() => {
    if (realTimeMetrics && isRunning && !isPaused) {
      const currentZoneStatus = getZoneStatus(realTimeMetrics);
      
      // Check for zone exits and play alerts
      currentZoneStatus.forEach((status, index) => {
        const previousStatus = previousZoneStatus[index];
        if (previousStatus && previousStatus.inZone && !status.inZone) {
          playSound('zone_exit');
        }
      });
      
      // Update time in zone tracking
      currentZoneStatus.forEach(status => {
        if (status.inZone) {
          const zoneKey = `${status.type}_${typeof status.target === 'number' ? status.target : 'range'}`;
          setTimeInZone(prev => ({
            ...prev,
            [zoneKey]: (prev[zoneKey] || 0) + 1
          }));
        }
      });
      
      setPreviousZoneStatus(currentZoneStatus);
    }
  }, [realTimeMetrics, isRunning, isPaused, getZoneStatus, playSound, previousZoneStatus]);
  
  // Start tracking execution when interval starts
  const startIntervalExecution = useCallback(() => {
    setCurrentExecution({
      intervalId: currentInterval.id,
      playerId: playerId || 'group',
      startTime: new Date(),
      metrics: {}
    });
  }, [currentInterval, playerId]);
  
  // Complete interval execution
  const completeIntervalExecution = useCallback(() => {
    if (currentExecution.startTime) {
      const execution: IntervalExecution = {
        intervalId: currentInterval.id,
        playerId: playerId || 'group',
        startTime: currentExecution.startTime,
        endTime: new Date(),
        actualDuration: (new Date().getTime() - currentExecution.startTime.getTime()) / 1000,
        metrics: {
          avgHeartRate: realTimeMetrics?.heartRate,
          avgWatts: realTimeMetrics?.watts,
          totalCalories: realTimeMetrics?.calories || 0,
          distance: realTimeMetrics?.distance
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
    
    const zoneStatuses = getZoneStatus(realTimeMetrics);
    const inZoneCount = zoneStatuses.filter(status => status.inZone).length;
    
    return zoneStatuses.length > 0 ? (inZoneCount / zoneStatuses.length) * 100 : 100;
  }, [realTimeMetrics, currentInterval, getZoneStatus]);
  
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
          // Warning beep at 10 seconds for work intervals
          if (prev === 10 && currentInterval?.type === 'work') {
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
  }, [
    isRunning, isPaused, currentIntervalIndex, intervals, playSound, 
    startIntervalExecution, completeIntervalExecution, intervalExecutions, 
    onComplete, currentInterval
  ]);
  
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
    setTimeInZone({});
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

  // Zone Indicator Component
  const ZoneIndicator = ({ zoneStatus }: { zoneStatus: ZoneStatus }) => {
    const isHR = zoneStatus.type === 'heart_rate';
    const zones = isHR ? GARMIN_HR_ZONES : POWER_ZONES.slice(0, 6);
    const targetZoneNum = typeof zoneStatus.target === 'number' ? zoneStatus.target : null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1">
            {isHR ? <Heart className="h-4 w-4 text-red-500" /> : <Zap className="h-4 w-4 text-yellow-500" />}
            {isHR ? 'Heart Rate' : 'Power'} Zone
          </span>
          <Badge variant={zoneStatus.inZone ? "default" : "destructive"}>
            {zoneStatus.inZone ? 'In Zone' : 'Out of Zone'}
          </Badge>
        </div>
        
        <div className="flex gap-1">
          {zones.map((zone) => (
            <div
              key={zone.zone}
              className={cn(
                "flex-1 h-6 rounded-sm border-2 transition-all",
                zoneStatus.current === zone.zone && "border-white shadow-lg",
                targetZoneNum === zone.zone && "ring-2 ring-blue-400"
              )}
              style={{ 
                backgroundColor: zone.color,
                opacity: zoneStatus.current === zone.zone ? 1 : 0.3
              }}
            />
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          Current: Zone {zoneStatus.current} | Target: {
            typeof zoneStatus.target === 'number' 
              ? `Zone ${zoneStatus.target}` 
              : `${zoneStatus.target.min}-${zoneStatus.target.max} ${isHR ? 'BPM' : 'W'}`
          }
        </div>
      </div>
    );
  };

  // Group View Component
  const GroupView = () => {
    if (!participants.length) {
      return (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            No participants currently connected to this session.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant) => {
            const zoneStatuses = participant.realTimeMetrics ? getZoneStatus(participant.realTimeMetrics) : [];
            const inZoneCount = zoneStatuses.filter(s => s.inZone).length;
            const compliance = zoneStatuses.length > 0 ? (inZoneCount / zoneStatuses.length) * 100 : 0;
            
            return (
              <Card 
                key={participant.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  selectedParticipant === participant.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedParticipant(
                  selectedParticipant === participant.id ? null : participant.id
                )}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{participant.name}</span>
                      <Badge variant={compliance >= 80 ? "default" : compliance >= 60 ? "secondary" : "destructive"}>
                        {Math.round(compliance)}%
                      </Badge>
                    </div>
                    
                    {participant.realTimeMetrics && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>HR:</span>
                          <span className="font-mono">{participant.realTimeMetrics.heartRate} BPM</span>
                        </div>
                        {participant.realTimeMetrics.watts && (
                          <div className="flex justify-between text-sm">
                            <span>Power:</span>
                            <span className="font-mono">{participant.realTimeMetrics.watts} W</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span>Calories:</span>
                          <span className="font-mono">{participant.realTimeMetrics.calories}</span>
                        </div>
                      </div>
                    )}
                    
                    {zoneStatuses.length > 0 && (
                      <div className="space-y-1">
                        {zoneStatuses.map((status, idx) => (
                          <div key={idx} className="h-2 bg-muted rounded overflow-hidden">
                            <div 
                              className="h-full transition-all"
                              style={{ 
                                width: status.inZone ? '100%' : '20%',
                                backgroundColor: status.color
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {selectedParticipant && (
          <Card>
            <CardHeader>
              <CardTitle>
                {participants.find(p => p.id === selectedParticipant)?.name} - Detailed View
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Detailed individual view would go here */}
              <div className="text-center text-muted-foreground">
                Detailed participant metrics and zone tracking
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const currentZoneStatuses = realTimeMetrics ? getZoneStatus(realTimeMetrics) : [];
  const isOnTarget = currentZoneStatuses.length === 0 || currentZoneStatuses.every(s => s.inZone);

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
              {mode === 'single' ? playerName : `${participants.length} participants`} • 
              {equipmentConfig.label} • Interval {currentIntervalIndex + 1}/{totalIntervals}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {mode === 'group' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGroupView(!showGroupView)}
            >
              {showGroupView ? <User className="h-4 w-4 mr-1" /> : <Users className="h-4 w-4 mr-1" />}
              {showGroupView ? 'Individual' : 'Group'} View
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          {soundEnabled && (
            <div className="w-20">
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
      <div className="flex-1 overflow-hidden">
        {showGroupView && mode === 'group' ? (
          <div className="p-4 h-full overflow-y-auto">
            <GroupView />
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 p-4 h-full">
            {/* Left Panel - Current Interval */}
            <div className="col-span-8 space-y-4">
              {/* Phase Indicator */}
              <Card className={cn(
                "border-2",
                isOnTarget ? "border-green-500" : "border-orange-500"
              )}>
                <CardContent className="p-6">
                  <div 
                    className="text-center p-6 rounded-xl mb-6"
                    style={{ backgroundColor: `${currentInterval?.color || INTERVAL_COLORS[currentInterval?.type || 'work']}20` }}
                  >
                    <h3 
                      className="text-4xl font-bold mb-2"
                      style={{ color: currentInterval?.color || INTERVAL_COLORS[currentInterval?.type || 'work'] }}
                    >
                      {currentInterval?.name || currentInterval?.type.toUpperCase().replace('_', ' ')}
                    </h3>
                    
                    {/* Timer */}
                    <div className="text-8xl font-mono font-bold my-4">
                      {formatTime(timeRemaining)}
                    </div>
                    
                    {/* Zone Indicators */}
                    {currentZoneStatuses.length > 0 && (
                      <div className="space-y-4">
                        {currentZoneStatuses.map((zoneStatus, idx) => (
                          <ZoneIndicator key={idx} zoneStatus={zoneStatus} />
                        ))}
                      </div>
                    )}
                    
                    {/* Notes */}
                    {currentInterval?.notes && (
                      <p className="text-lg text-muted-foreground mt-4">{currentInterval.notes}</p>
                    )}
                  </div>
                  
                  {/* Real-time Metrics */}
                  {realTimeMetrics && (
                    <div className="grid grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                          <div className="text-2xl font-bold">{realTimeMetrics.heartRate}</div>
                          <div className="text-xs text-muted-foreground">BPM</div>
                        </CardContent>
                      </Card>
                      
                      {realTimeMetrics.watts && (
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                            <div className="text-2xl font-bold">{realTimeMetrics.watts}</div>
                            <div className="text-xs text-muted-foreground">W</div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {realTimeMetrics.speed && (
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                            <div className="text-2xl font-bold">{realTimeMetrics.speed}</div>
                            <div className="text-xs text-muted-foreground">km/h</div>
                          </CardContent>
                        </Card>
                      )}
                      
                      <Card>
                        <CardContent className="p-4 text-center">
                          <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                          <div className="text-2xl font-bold">{realTimeMetrics.calories}</div>
                          <div className="text-xs text-muted-foreground">Cal</div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Controls */}
              <div className="flex justify-center gap-3">
                {!isRunning ? (
                  <Button size="lg" onClick={handleStart} className="h-14 px-6">
                    <Play className="h-5 w-5 mr-2" />
                    Start Session
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
              
              {/* Next Interval Preview */}
              {currentIntervalIndex < intervals.length - 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Next Up</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ 
                          backgroundColor: `${intervals[currentIntervalIndex + 1].color || 
                            INTERVAL_COLORS[intervals[currentIntervalIndex + 1].type]}20` 
                        }}
                      >
                        <div className="font-medium">
                          {intervals[currentIntervalIndex + 1].name || 
                           intervals[currentIntervalIndex + 1].type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(intervals[currentIntervalIndex + 1].duration)}
                        </div>
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
        )}
      </div>
    </div>
  );
}