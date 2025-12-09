'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TrainingSessionViewer from '../TrainingSessionViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RotateCcw, 
  Clock, 
  ArrowRight, 
  Users, 
  AlertTriangle,
  Play,
  Pause
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { 
  EnhancedRotationExecutionState, 
  RotationSchedule,
  RotationAlert 
} from '../../types/rotation.types';
import type { TrainingSessionData } from '../../utils/rotationSessionUtils';

interface RotationAwareTrainingViewerProps {
  schedule: RotationSchedule;
  executionState: EnhancedRotationExecutionState;
  trainingSessions: TrainingSessionData[];
  selectedSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onClearSelection: () => void;
  onTransitionAlert: (alert: RotationAlert) => void;
  className?: string;
}

export const RotationAwareTrainingViewer: React.FC<RotationAwareTrainingViewerProps> = ({
  schedule,
  executionState,
  trainingSessions,
  selectedSessionId,
  onSessionSelect,
  onClearSelection,
  onTransitionAlert,
  className
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [lastTransitionWarning, setLastTransitionWarning] = useState<number>(0);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate rotation progress
  const rotationProgress = useMemo(() => {
    const rotationDuration = schedule.rotationDuration * 60;
    const elapsed = rotationDuration - executionState.timeRemaining;
    return Math.max(0, Math.min(100, (elapsed / rotationDuration) * 100));
  }, [schedule.rotationDuration, executionState.timeRemaining]);

  // Check for transition warnings
  useEffect(() => {
    if (executionState.timeRemaining <= 30 && executionState.timeRemaining > 0) {
      if (lastTransitionWarning !== executionState.currentRotation) {
        const alert: RotationAlert = {
          id: `transition-warning-${executionState.currentRotation}-${Date.now()}`,
          type: 'transition_warning',
          message: t('physicalTrainer:rotation.transitionWarning', { seconds: executionState.timeRemaining }),
          timestamp: new Date(),
          acknowledged: false,
          priority: 'high'
        };
        onTransitionAlert(alert);
        setLastTransitionWarning(executionState.currentRotation);
      }
    }
  }, [executionState.timeRemaining, executionState.currentRotation, lastTransitionWarning, onTransitionAlert, t]);

  // Group sessions by station for display
  const sessionsByStation = useMemo(() => {
    return trainingSessions.reduce((acc, session) => {
      const stationId = session.rotationContext?.stationId || 'unknown';
      if (!acc[stationId]) {
        acc[stationId] = [];
      }
      acc[stationId].push(session);
      return acc;
    }, {} as Record<string, TrainingSessionData[]>);
  }, [trainingSessions]);

  // Get current rotation info
  const currentRotationInfo = useMemo(() => {
    const totalRotations = schedule.rotationOrder.length;
    const currentIndex = executionState.currentRotation;
    const nextIndex = (currentIndex + 1) % totalRotations;
    
    return {
      current: currentIndex + 1,
      total: totalRotations,
      isLastRotation: currentIndex >= totalRotations - 1,
      nextRotation: nextIndex + 1
    };
  }, [schedule.rotationOrder.length, executionState.currentRotation]);

  // Render the selected session with TrainingSessionViewer
  if (selectedSessionId) {
    const selectedSession = trainingSessions.find(s => s.id === selectedSessionId);
    if (selectedSession) {
      return (
        <div className={cn("h-full flex flex-col", className)}>
          {/* Rotation Context Header */}
          <div className="shrink-0 p-4 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  {t('physicalTrainer:rotation.backToOverview')}
                </Button>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span className="font-medium">{schedule.name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedSession.rotationContext && (
                  <>
                    <Badge variant="outline">
                      {t('physicalTrainer:rotation.rotation')} {currentRotationInfo.current}/{currentRotationInfo.total}
                    </Badge>
                    <Badge variant="secondary" className="font-mono">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(executionState.timeRemaining)}
                    </Badge>
                    {executionState.status === 'active' && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span>{t('physicalTrainer:rotation.live')}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Station Context */}
            {selectedSession.rotationContext && (
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">
                    {t('physicalTrainer:rotation.currentStation')}:
                  </span>{' '}
                  {schedule.stations.find(s => s.id === selectedSession.rotationContext!.stationId)?.name}
                </div>
                {selectedSession.rotationContext.nextStation && (
                  <div className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium">
                      {t('physicalTrainer:rotation.nextStation')}:
                    </span>{' '}
                    {schedule.stations.find(s => s.id === selectedSession.rotationContext!.nextStation)?.name}
                  </div>
                )}
              </div>
            )}

            {/* Rotation Progress */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>{t('physicalTrainer:rotation.rotationProgress')}</span>
                <span>{Math.round(rotationProgress)}%</span>
              </div>
              <Progress value={rotationProgress} className="h-1" />
            </div>
          </div>

          {/* TrainingSessionViewer */}
          <div className="flex-1 min-h-0">
            <TrainingSessionViewer
              sessionType={selectedSession.type}
              teamName={`Rotation Group - ${selectedSession.rotationContext?.groupId || 'Unknown'}`}
              sessionData={selectedSession}
              workoutType={
                selectedSession.type === 'CONDITIONING' ? 'interval' :
                selectedSession.type === 'HYBRID' ? 'hybrid' :
                selectedSession.type === 'AGILITY' ? 'agility' :
                'exercise'
              }
              initialIntervals={selectedSession.intervalProgram?.intervals}
              hybridBlocks={selectedSession.hybridProgram?.blocks}
              agilitySession={selectedSession.agilityProgram}
              onComplete={() => {
                // Handle session completion
                console.log('Rotation session completed:', selectedSessionId);
              }}
            />
          </div>
        </div>
      );
    }
  }

  // Show rotation overview with session grid
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Rotation Status */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                {schedule.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('physicalTrainer:rotation.liveSessionMonitoring')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={executionState.status === 'active' ? 'default' : 'secondary'}
                className={cn(
                  executionState.status === 'active' && 'bg-green-600'
                )}
              >
                {executionState.status === 'active' && <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />}
                {t(`physicalTrainer:rotation.status.${executionState.status}`)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm font-medium">{t('physicalTrainer:rotation.currentRotation')}</div>
              <div className="text-2xl font-bold">
                {currentRotationInfo.current} / {currentRotationInfo.total}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">{t('physicalTrainer:rotation.timeRemaining')}</div>
              <div className="text-2xl font-bold font-mono">
                {formatTime(executionState.timeRemaining)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">{t('physicalTrainer:rotation.activeStations')}</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {Object.keys(sessionsByStation).length}
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">{t('physicalTrainer:rotation.totalParticipants')}</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {trainingSessions.reduce((sum, session) => sum + session.playerIds.length, 0)}
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t('physicalTrainer:rotation.rotationProgress')}</span>
              <span>{Math.round(rotationProgress)}%</span>
            </div>
            <Progress value={rotationProgress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {executionState.alerts.filter(alert => !alert.acknowledged && alert.priority !== 'low').map(alert => (
        <Alert 
          key={alert.id} 
          className={cn(
            alert.priority === 'critical' && 'border-red-500 bg-red-50',
            alert.priority === 'high' && 'border-yellow-500 bg-yellow-50'
          )}
        >
          {alert.type === 'transition_warning' ? (
            <Clock className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription className="font-medium">
            {alert.message}
          </AlertDescription>
        </Alert>
      ))}

      {/* Station Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {schedule.stations.map(station => {
          const stationSessions = sessionsByStation[station.id] || [];
          const activeSession = stationSessions.find(s => s.status === 'active');
          const assignedGroup = schedule.groups.find(g => 
            executionState.groupPositions[g.id] === station.id
          );

          return (
            <Card 
              key={station.id} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                activeSession && "ring-2 ring-green-500 shadow-lg"
              )}
              onClick={() => activeSession && onSessionSelect(activeSession.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: station.color }}
                    />
                    {station.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {activeSession && (
                      <Badge variant="default" className="bg-green-600">
                        <Play className="h-3 w-3 mr-1" />
                        {t('physicalTrainer:rotation.active')}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {station.equipment}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {assignedGroup ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium" style={{ color: assignedGroup.color }}>
                          {assignedGroup.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignedGroup.players.length} {t('physicalTrainer:rotation.players')}
                        </div>
                      </div>
                      {activeSession && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionSelect(activeSession.id);
                          }}
                        >
                          {t('physicalTrainer:rotation.monitor')}
                        </Button>
                      )}
                    </div>

                    <div className="text-sm">
                      <div className="font-medium mb-1">
                        {t('physicalTrainer:rotation.currentWorkout')}:
                      </div>
                      <div className="text-muted-foreground">
                        {station.workout.type === 'intervals' && t('physicalTrainer:rotation.intervalTraining')}
                        {station.workout.type === 'strength' && t('physicalTrainer:rotation.strengthTraining')}
                        {station.workout.type === 'freeform' && t('physicalTrainer:rotation.freeformWorkout')}
                        {station.workout.type === 'rest' && t('physicalTrainer:rotation.restActivity')}
                      </div>
                    </div>

                    {activeSession && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t('physicalTrainer:rotation.sessionProgress')}</span>
                          <span>
                            {Math.round(((activeSession.duration - executionState.timeRemaining) / activeSession.duration) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={((activeSession.duration - executionState.timeRemaining) / activeSession.duration) * 100} 
                          className="h-1 mt-1"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <div className="text-sm">
                      {t('physicalTrainer:rotation.noGroupAssigned')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};