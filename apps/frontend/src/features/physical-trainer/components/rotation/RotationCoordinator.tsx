'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  RotationSchedule, 
  RotationExecutionState, 
  RotationTrainingSession,
  RotationSessionCollection,
  EnhancedRotationExecutionState,
  StationWorkout
} from '../../types/rotation.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from '@/components/icons';
import { cn } from '@/lib/utils';

interface RotationCoordinatorProps {
  schedule: RotationSchedule;
  onSessionsCreated: (sessions: RotationTrainingSession[]) => void;
  onRotationStart: (executionState: EnhancedRotationExecutionState) => void;
  onRotationTransition: (executionState: EnhancedRotationExecutionState) => void;
  onRotationComplete: (executionState: EnhancedRotationExecutionState) => void;
  onEmergencyStop: () => void;
}

export const RotationCoordinator: React.FC<RotationCoordinatorProps> = ({
  schedule,
  onSessionsCreated,
  onRotationStart,
  onRotationTransition,
  onRotationComplete,
  onEmergencyStop
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  
  const [executionState, setExecutionState] = useState<EnhancedRotationExecutionState | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(null);
  const [transitionTimer, setTransitionTimer] = useState<number | null>(null);

  // Convert rotation schedule to individual training sessions
  const createRotationSessions = useCallback((rotationIndex: number): RotationTrainingSession[] => {
    const sessions: RotationTrainingSession[] = [];
    
    // For each group, create a session for their current station
    schedule.groups.forEach(group => {
      const currentStationIndex = (group.rotationOrder.indexOf(group.startingStation!) + rotationIndex) % group.rotationOrder.length;
      const currentStationId = group.rotationOrder[currentStationIndex];
      const station = schedule.stations.find(s => s.id === currentStationId);
      
      if (!station) return;
      
      // Determine next station for context
      const nextStationIndex = (currentStationIndex + 1) % group.rotationOrder.length;
      const nextStationId = group.rotationOrder[nextStationIndex];
      
      // Determine previous station
      const prevStationIndex = currentStationIndex === 0 ? group.rotationOrder.length - 1 : currentStationIndex - 1;
      const previousStationId = group.rotationOrder[prevStationIndex];
      
      const session: RotationTrainingSession = {
        id: `rotation-${schedule.id}-${rotationIndex}-${group.id}-${currentStationId}`,
        rotationContext: {
          rotationScheduleId: schedule.id,
          stationId: currentStationId,
          groupId: group.id,
          rotationIndex,
          isRotationSession: true,
          nextStation: nextStationId,
          previousStation: previousStationId,
          timeUntilRotation: schedule.rotationDuration * 60 // Convert to seconds
        },
        stationWorkout: station.workout,
        assignedPlayers: group.players.map(p => p.id),
        status: 'pending',
        duration: schedule.rotationDuration * 60, // Convert to seconds
      };
      
      sessions.push(session);
    });
    
    return sessions;
  }, [schedule]);

  // Initialize execution state
  const initializeExecution = useCallback(() => {
    const initialSessions = createRotationSessions(0);
    
    const sessionCollection: RotationSessionCollection = {
      scheduleId: schedule.id,
      rotationIndex: 0,
      sessions: initialSessions,
      groupPositions: schedule.groups.reduce((acc, group) => {
        acc[group.id] = group.startingStation!;
        return acc;
      }, {} as Record<string, string>),
      startTime: new Date(),
      endTime: new Date(Date.now() + schedule.rotationDuration * 60 * 1000),
      status: 'pending'
    };
    
    const state: EnhancedRotationExecutionState = {
      scheduleId: schedule.id,
      status: 'preparing',
      currentRotation: 0,
      timeRemaining: schedule.rotationDuration * 60,
      nextRotationAt: new Date(Date.now() + schedule.rotationDuration * 60 * 1000),
      groupPositions: sessionCollection.groupPositions,
      alerts: [],
      currentSessions: sessionCollection,
      sessionHistory: [],
      activeSessions: initialSessions.map(s => s.id)
    };
    
    setExecutionState(state);
    onSessionsCreated(initialSessions);
    
    return state;
  }, [schedule, createRotationSessions, onSessionsCreated]);

  // Start rotation execution
  const startRotation = useCallback(() => {
    const state = executionState || initializeExecution();
    
    const updatedState: EnhancedRotationExecutionState = {
      ...state,
      status: 'active',
      currentSessions: {
        ...state.currentSessions,
        status: 'active',
        sessions: state.currentSessions.sessions.map(s => ({
          ...s,
          status: 'active',
          startTime: new Date()
        }))
      }
    };
    
    setExecutionState(updatedState);
    onRotationStart(updatedState);
    
    // Start countdown timer
    startCountdown(state.timeRemaining);
  }, [executionState, initializeExecution, onRotationStart]);

  // Countdown timer logic
  const startCountdown = useCallback((initialTime: number) => {
    let timeLeft = initialTime;
    
    const timer = setInterval(() => {
      timeLeft -= 1;
      
      setExecutionState(prev => {
        if (!prev) return prev;
        
        const updated = {
          ...prev,
          timeRemaining: timeLeft,
          currentSessions: {
            ...prev.currentSessions,
            sessions: prev.currentSessions.sessions.map(s => ({
              ...s,
              rotationContext: {
                ...s.rotationContext,
                timeUntilRotation: timeLeft
              }
            }))
          }
        };
        
        // Add transition warning at 30 seconds
        if (timeLeft === 30 && !prev.alerts.some(a => a.type === 'transition_warning')) {
          updated.alerts = [...prev.alerts, {
            id: `warning-${Date.now()}`,
            type: 'transition_warning',
            message: t('physicalTrainer:rotation.transitionWarning'),
            timestamp: new Date(),
            acknowledged: false,
            priority: 'high'
          }];
        }
        
        return updated;
      });
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        handleRotationTransition();
      }
    }, 1000);
    
    setCountdownTimer(timer);
  }, [t]);

  // Handle rotation transition
  const handleRotationTransition = useCallback(() => {
    if (!executionState) return;
    
    // Move to next rotation
    const nextRotationIndex = executionState.currentRotation + 1;
    const totalRotations = schedule.rotationOrder.length;
    
    // Check if we've completed all rotations
    if (nextRotationIndex >= totalRotations) {
      handleRotationComplete();
      return;
    }
    
    // Create sessions for next rotation
    const nextSessions = createRotationSessions(nextRotationIndex);
    
    // Update group positions
    const newGroupPositions: Record<string, string> = {};
    schedule.groups.forEach(group => {
      const currentStationIndex = (group.rotationOrder.indexOf(group.startingStation!) + nextRotationIndex) % group.rotationOrder.length;
      newGroupPositions[group.id] = group.rotationOrder[currentStationIndex];
    });
    
    const nextSessionCollection: RotationSessionCollection = {
      scheduleId: schedule.id,
      rotationIndex: nextRotationIndex,
      sessions: nextSessions,
      groupPositions: newGroupPositions,
      startTime: new Date(Date.now() + schedule.transitionTime * 60 * 1000),
      endTime: new Date(Date.now() + (schedule.transitionTime + schedule.rotationDuration) * 60 * 1000),
      status: 'pending'
    };
    
    const updatedState: EnhancedRotationExecutionState = {
      ...executionState,
      status: 'active',
      currentRotation: nextRotationIndex,
      timeRemaining: schedule.transitionTime * 60, // Transition time first
      nextRotationAt: nextSessionCollection.startTime,
      groupPositions: newGroupPositions,
      currentSessions: {
        ...executionState.currentSessions,
        status: 'transitioning'
      },
      sessionHistory: [...executionState.sessionHistory, {
        ...executionState.currentSessions,
        status: 'completed',
        sessions: executionState.currentSessions.sessions.map(s => ({
          ...s,
          status: 'completed',
          endTime: new Date(),
          actualDuration: s.startTime ? Math.floor((Date.now() - s.startTime.getTime()) / 1000) : undefined
        }))
      }],
      activeSessions: nextSessions.map(s => s.id),
      alerts: [...executionState.alerts, {
        id: `transition-${Date.now()}`,
        type: 'transition_now',
        message: t('physicalTrainer:rotation.transitionNow', { rotation: nextRotationIndex + 1 }),
        timestamp: new Date(),
        acknowledged: false,
        priority: 'critical'
      }]
    };
    
    setExecutionState(updatedState);
    onRotationTransition(updatedState);
    onSessionsCreated(nextSessions);
    
    // Start transition timer
    setTimeout(() => {
      if (updatedState) {
        const finalState = {
          ...updatedState,
          currentSessions: {
            ...nextSessionCollection,
            status: 'active' as const,
            sessions: nextSessionCollection.sessions.map(s => ({
              ...s,
              status: 'active' as const,
              startTime: new Date()
            }))
          },
          timeRemaining: schedule.rotationDuration * 60
        };
        
        setExecutionState(finalState);
        startCountdown(schedule.rotationDuration * 60);
      }
    }, schedule.transitionTime * 60 * 1000);
  }, [executionState, schedule, createRotationSessions, onRotationTransition, onSessionsCreated, t, startCountdown]);

  // Handle rotation completion
  const handleRotationComplete = useCallback(() => {
    if (!executionState) return;
    
    const finalState: EnhancedRotationExecutionState = {
      ...executionState,
      status: 'completed',
      currentSessions: {
        ...executionState.currentSessions,
        status: 'completed',
        sessions: executionState.currentSessions.sessions.map(s => ({
          ...s,
          status: 'completed',
          endTime: new Date(),
          actualDuration: s.startTime ? Math.floor((Date.now() - s.startTime.getTime()) / 1000) : undefined
        }))
      },
      sessionHistory: [...executionState.sessionHistory, {
        ...executionState.currentSessions,
        status: 'completed',
        sessions: executionState.currentSessions.sessions.map(s => ({
          ...s,
          status: 'completed',
          endTime: new Date(),
          actualDuration: s.startTime ? Math.floor((Date.now() - s.startTime.getTime()) / 1000) : undefined
        }))
      }],
      alerts: [...executionState.alerts, {
        id: `complete-${Date.now()}`,
        type: 'completion',
        message: t('physicalTrainer:rotation.sessionComplete'),
        timestamp: new Date(),
        acknowledged: false,
        priority: 'medium'
      }]
    };
    
    setExecutionState(finalState);
    onRotationComplete(finalState);
    
    // Clear timers
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
  }, [executionState, onRotationComplete, countdownTimer, t]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (!executionState) return 0;
    const totalRotations = schedule.rotationOrder.length;
    const currentProgress = executionState.currentRotation / totalRotations;
    const timeProgress = (schedule.rotationDuration * 60 - executionState.timeRemaining) / (schedule.rotationDuration * 60);
    return Math.round((currentProgress + timeProgress / totalRotations) * 100);
  }, [executionState, schedule]);

  return (
    <div className="space-y-6">
      {/* Rotation Status Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                {schedule.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('physicalTrainer:rotation.rotationCoordinator')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={executionState?.status === 'active' ? 'default' : 'secondary'}>
                {executionState?.status || 'preparing'}
              </Badge>
              {executionState?.status === 'active' && (
                <Badge variant="outline" className="font-mono">
                  {formatTime(executionState.timeRemaining)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-sm font-medium">{t('physicalTrainer:rotation.currentRotation')}</div>
              <div className="text-2xl font-bold">
                {(executionState?.currentRotation || 0) + 1} / {schedule.rotationOrder.length}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">{t('physicalTrainer:rotation.activeStations')}</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {schedule.stations.length}
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">{t('physicalTrainer:rotation.totalParticipants')}</div>
              <div className="text-2xl font-bold">
                {schedule.groups.reduce((sum, group) => sum + group.players.length, 0)}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t('physicalTrainer:rotation.overallProgress')}</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {!executionState || executionState.status === 'preparing' ? (
          <Button onClick={startRotation} size="lg" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            {t('physicalTrainer:rotation.startRotation')}
          </Button>
        ) : executionState.status === 'active' ? (
          <>
            <Button 
              onClick={() => {/* Implement pause */}} 
              variant="outline" 
              size="lg"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              {t('physicalTrainer:rotation.pauseRotation')}
            </Button>
            <Button 
              onClick={onEmergencyStop} 
              variant="destructive" 
              size="lg"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {t('physicalTrainer:rotation.emergencyStop')}
            </Button>
          </>
        ) : (
          <Button 
            onClick={initializeExecution} 
            variant="outline" 
            size="lg"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t('physicalTrainer:rotation.resetRotation')}
          </Button>
        )}
      </div>

      {/* Active Alerts */}
      {executionState?.alerts.filter(a => !a.acknowledged).map(alert => (
        <Alert 
          key={alert.id} 
          className={cn(
            alert.priority === 'critical' && 'border-red-500',
            alert.priority === 'high' && 'border-yellow-500'
          )}
        >
          {alert.type === 'transition_warning' ? (
            <Clock className="h-4 w-4" />
          ) : alert.type === 'completion' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}

      {/* Current Group Positions */}
      {executionState && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('physicalTrainer:rotation.currentPositions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedule.groups.map(group => {
                const currentStationId = executionState.groupPositions[group.id];
                const currentStation = schedule.stations.find(s => s.id === currentStationId);
                const nextStationIndex = (group.rotationOrder.indexOf(currentStationId) + 1) % group.rotationOrder.length;
                const nextStation = schedule.stations.find(s => s.id === group.rotationOrder[nextStationIndex]);
                
                return (
                  <div key={group.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium" style={{ color: group.color }}>
                        {group.name}
                      </div>
                      <Badge variant="outline">
                        {group.players.length} players
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>At:</span>
                        <span className="font-medium">{currentStation?.name}</span>
                      </div>
                      {nextStation && (
                        <div className="flex items-center gap-2 mt-1">
                          <ArrowRight className="h-3 w-3" />
                          <span>Next: {nextStation.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};