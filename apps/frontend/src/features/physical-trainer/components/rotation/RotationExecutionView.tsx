'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, Pause, Square, RotateCw, Clock, Users, 
  AlertTriangle, CheckCircle, Bell, Volume2, VolumeX,
  Timer, Activity, Heart, Zap, ArrowRight
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

import type { 
  RotationSchedule, 
  RotationVisualization,
  RotationExecutionState,
  RotationAlert
} from '../../types/rotation.types';
import { EQUIPMENT_CONFIGS } from '../../types/conditioning.types';

interface RotationExecutionViewProps {
  schedule: RotationSchedule;
  visualization: RotationVisualization;
}

// Mock execution state for demonstration
const createMockExecutionState = (schedule: RotationSchedule): RotationExecutionState => {
  return {
    scheduleId: schedule.id,
    status: 'preparing',
    currentRotation: 0,
    timeRemaining: schedule.rotationDuration * 60, // Convert to seconds
    nextRotationAt: new Date(Date.now() + schedule.rotationDuration * 60 * 1000),
    groupPositions: schedule.groups.reduce((acc, group) => {
      acc[group.id] = group.startingStation;
      return acc;
    }, {} as Record<string, string>),
    alerts: []
  };
};

export default function RotationExecutionView({ 
  schedule, 
  visualization 
}: RotationExecutionViewProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  const [executionState, setExecutionState] = useState<RotationExecutionState>(
    createMockExecutionState(schedule)
  );
  const [soundEnabled, setSoundEnabled] = useState(visualization.soundEnabled);
  const [volume, setVolume] = useState(visualization.alertVolume);

  // Timer for countdown
  useEffect(() => {
    if (executionState.status !== 'active') return;

    const interval = setInterval(() => {
      setExecutionState(prev => {
        if (prev.timeRemaining <= 0) {
          // Move to next rotation
          const nextRotation = prev.currentRotation + 1;
          if (nextRotation >= schedule.stations.length) {
            // Session complete
            toast.success('Rotation session completed!');
            return {
              ...prev,
              status: 'completed',
              timeRemaining: 0
            };
          } else {
            // Next rotation
            const newGroupPositions = { ...prev.groupPositions };
            schedule.groups.forEach(group => {
              const currentStationIndex = schedule.stations.findIndex(s => s.id === prev.groupPositions[group.id]);
              const nextStationIndex = (currentStationIndex + 1) % schedule.stations.length;
              newGroupPositions[group.id] = schedule.stations[nextStationIndex].id;
            });

            if (soundEnabled) {
              // Play rotation sound (mock)
              toast.success(`Rotation ${nextRotation + 1} started!`);
            }

            return {
              ...prev,
              currentRotation: nextRotation,
              timeRemaining: schedule.rotationDuration * 60,
              nextRotationAt: new Date(Date.now() + schedule.rotationDuration * 60 * 1000),
              groupPositions: newGroupPositions,
              alerts: [
                ...prev.alerts,
                {
                  id: `rotation-${Date.now()}`,
                  type: 'transition_now',
                  message: `Rotation ${nextRotation + 1} has started`,
                  timestamp: new Date(),
                  acknowledged: false,
                  priority: 'high'
                }
              ]
            };
          }
        }

        // Warning at 30 seconds
        if (prev.timeRemaining === 30 && soundEnabled) {
          toast('30 seconds remaining!', { icon: '⏰' });
        }

        // Warning at 10 seconds
        if (prev.timeRemaining === 10 && soundEnabled) {
          toast('10 seconds remaining - prepare to rotate!', { icon: '🔔' });
        }

        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [executionState.status, schedule, soundEnabled]);

  // Start session
  const startSession = useCallback(() => {
    setExecutionState(prev => ({
      ...prev,
      status: 'active',
      alerts: [
        ...prev.alerts,
        {
          id: `start-${Date.now()}`,
          type: 'transition_now',
          message: 'Session started!',
          timestamp: new Date(),
          acknowledged: false,
          priority: 'high'
        }
      ]
    }));
    toast.success('Rotation session started!');
  }, []);

  // Pause session
  const pauseSession = useCallback(() => {
    setExecutionState(prev => ({
      ...prev,
      status: 'paused'
    }));
    toast('Session paused');
  }, []);

  // Resume session
  const resumeSession = useCallback(() => {
    setExecutionState(prev => ({
      ...prev,
      status: 'active'
    }));
    toast.success('Session resumed');
  }, []);

  // Stop session
  const stopSession = useCallback(() => {
    setExecutionState(prev => ({
      ...prev,
      status: 'completed',
      timeRemaining: 0
    }));
    toast('Session stopped');
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setExecutionState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    }));
  }, []);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, []);

  // Get current station for each group
  const currentGroupStations = useMemo(() => {
    return schedule.groups.map(group => {
      const stationId = executionState.groupPositions[group.id];
      const station = schedule.stations.find(s => s.id === stationId);
      return { group, station };
    });
  }, [schedule.groups, schedule.stations, executionState.groupPositions]);

  // Session progress
  const sessionProgress = useMemo(() => {
    const totalRotations = schedule.stations.length;
    const currentProgress = executionState.currentRotation;
    const timeProgress = executionState.status === 'active' 
      ? (schedule.rotationDuration * 60 - executionState.timeRemaining) / (schedule.rotationDuration * 60)
      : 0;
    
    return Math.round(((currentProgress + timeProgress) / totalRotations) * 100);
  }, [schedule, executionState]);

  // Unacknowledged alerts
  const unacknowledgedAlerts = useMemo(() => {
    return executionState.alerts.filter(alert => !alert.acknowledged);
  }, [executionState.alerts]);

  if (schedule.stations.length === 0 || schedule.groups.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Complete station and group setup to enable execution view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  executionState.status === 'active' ? 'default' :
                  executionState.status === 'paused' ? 'secondary' :
                  executionState.status === 'completed' ? 'outline' : 'secondary'
                }
                className={cn(
                  executionState.status === 'active' && "bg-green-600",
                  executionState.status === 'paused' && "bg-yellow-600",
                  executionState.status === 'completed' && "bg-blue-600"
                )}
              >
                {executionState.status === 'active' && <Activity className="h-3 w-3 mr-1" />}
                {executionState.status === 'paused' && <Pause className="h-3 w-3 mr-1" />}
                {executionState.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                {executionState.status === 'preparing' && <Clock className="h-3 w-3 mr-1" />}
                {executionState.status.toUpperCase()}
              </Badge>
              <span className="font-medium">{schedule.name}</span>
            </div>

            {/* Session Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <RotateCw className="h-4 w-4" />
                <span>Rotation {executionState.currentRotation + 1}/{schedule.stations.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Timer className="h-4 w-4" />
                <span className="font-mono text-lg font-semibold text-foreground">
                  {formatTime(executionState.timeRemaining)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{schedule.groups.reduce((sum, g) => sum + g.players.length, 0)} players</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <Button
              size="sm"
              variant={soundEnabled ? "default" : "outline"}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>

            {/* Control Buttons */}
            {executionState.status === 'preparing' && (
              <Button size="sm" onClick={startSession} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-1" />
                Start Session
              </Button>
            )}

            {executionState.status === 'active' && (
              <>
                <Button size="sm" variant="outline" onClick={pauseSession}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button size="sm" variant="destructive" onClick={stopSession}>
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </>
            )}

            {executionState.status === 'paused' && (
              <>
                <Button size="sm" onClick={resumeSession} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
                <Button size="sm" variant="destructive" onClick={stopSession}>
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Session Progress</span>
            <span className="text-sm text-muted-foreground">{sessionProgress}% complete</span>
          </div>
          <Progress value={sessionProgress} className="h-2" />
        </div>

        {/* Alerts */}
        {unacknowledgedAlerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {unacknowledgedAlerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} className={cn(
                alert.priority === 'critical' && "border-red-500 bg-red-50",
                alert.priority === 'high' && "border-orange-500 bg-orange-50",
                alert.priority === 'medium' && "border-yellow-500 bg-yellow-50"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <AlertDescription>{alert.message}</AlertDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </div>

      {/* Main Execution View */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentGroupStations.map(({ group, station }) => (
            <Card 
              key={group.id} 
              className={cn(
                "transition-all duration-500",
                executionState.status === 'active' && visualization.animateTransitions && "hover:scale-105",
                executionState.timeRemaining <= 30 && executionState.status === 'active' && "ring-2 ring-yellow-500 ring-opacity-50"
              )}
              style={{ backgroundColor: station?.color || '#f3f4f6' }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: group.color }}
                    />
                    <CardTitle className="text-base">{group.name}</CardTitle>
                  </div>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {group.players.length}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {station ? (
                  <div className="space-y-3">
                    {/* Current Station */}
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{station.name}</span>
                          <Badge variant="secondary">
                            {EQUIPMENT_CONFIGS[station.equipment].icon}
                          </Badge>
                        </div>
                        {executionState.status === 'active' && (
                          <Badge className="bg-green-600">
                            <Activity className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {EQUIPMENT_CONFIGS[station.equipment].label} • {station.capacity} capacity
                      </div>
                      
                      {/* Station-specific info */}
                      {station.workout.type === 'intervals' && (
                        <div className="mt-2 text-xs text-blue-600">
                          <Activity className="h-3 w-3 inline mr-1" />
                          Interval Training
                        </div>
                      )}
                      {station.workout.type === 'strength' && (
                        <div className="mt-2 text-xs text-purple-600">
                          <Zap className="h-3 w-3 inline mr-1" />
                          Strength Training
                        </div>
                      )}
                      {station.workout.type === 'rest' && (
                        <div className="mt-2 text-xs text-green-600">
                          <Heart className="h-3 w-3 inline mr-1" />
                          Recovery Station
                        </div>
                      )}
                    </div>

                    {/* Players in Group */}
                    {visualization.showPlayerNames && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Players
                        </h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {group.players.slice(0, 6).map((player) => (
                            <div key={player.id} className="flex items-center justify-between bg-white/50 rounded px-2 py-1">
                              <span>{player.name}</span>
                              <span className="text-muted-foreground">#{player.jerseyNumber}</span>
                            </div>
                          ))}
                          {group.players.length > 6 && (
                            <div className="col-span-2 text-center text-muted-foreground">
                              +{group.players.length - 6} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Next Station Preview */}
                    {executionState.currentRotation < schedule.stations.length - 1 && (
                      <div className="pt-2 border-t border-white/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ArrowRight className="h-3 w-3" />
                          <span>Next:</span>
                          <span>
                            {(() => {
                              const currentIndex = schedule.stations.findIndex(s => s.id === station.id);
                              const nextStation = schedule.stations[(currentIndex + 1) % schedule.stations.length];
                              return nextStation ? `${nextStation.name} (${EQUIPMENT_CONFIGS[nextStation.equipment].icon})` : 'Unknown';
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-xs">No station assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Session Complete */}
        {executionState.status === 'completed' && (
          <div className="mt-8 text-center">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold mb-2">Session Complete!</h3>
                <p className="text-muted-foreground">
                  All {schedule.stations.length} rotations completed successfully.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setExecutionState(createMockExecutionState(schedule))}
                    className="flex-1"
                  >
                    Reset Session
                  </Button>
                  <Button className="flex-1">
                    View Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}