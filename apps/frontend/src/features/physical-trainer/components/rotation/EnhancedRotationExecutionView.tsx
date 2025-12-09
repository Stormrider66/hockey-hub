'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotationCoordinator } from './RotationCoordinator';
import { RotationAwareTrainingViewer } from './RotationAwareTrainingViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RotateCcw, 
  Monitor, 
  BarChart3, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { 
  RotationSchedule, 
  EnhancedRotationExecutionState,
  RotationAlert,
  RotationTrainingSession
} from '../../types/rotation.types';
import type { TrainingSessionData } from '../../utils/rotationSessionUtils';
import { 
  createRotationTrainingSessions,
  stationWorkoutToTrainingSession,
  validateRotationSchedule
} from '../../utils/rotationSessionUtils';

interface EnhancedRotationExecutionViewProps {
  schedule: RotationSchedule;
  onBack: () => void;
  onComplete: () => void;
  className?: string;
}

export const EnhancedRotationExecutionView: React.FC<EnhancedRotationExecutionViewProps> = ({
  schedule,
  onBack,
  onComplete,
  className
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  
  const [executionState, setExecutionState] = useState<EnhancedRotationExecutionState | null>(null);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSessionData[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const [alerts, setAlerts] = useState<RotationAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'coordinator' | 'monitor' | 'analytics'>('coordinator');

  // Validate schedule before execution
  const validation = validateRotationSchedule(schedule);

  // Handle session creation from RotationCoordinator
  const handleSessionsCreated = useCallback((rotationSessions: RotationTrainingSession[]) => {
    const trainingSessions = rotationSessions.map(rotationSession => {
      const station = schedule.stations.find(s => s.id === rotationSession.rotationContext.stationId);
      if (!station) {
        throw new Error(`Station not found: ${rotationSession.rotationContext.stationId}`);
      }
      
      return stationWorkoutToTrainingSession(
        rotationSession,
        station,
        'Training Center',
        'rotation-coordinator'
      );
    });
    
    setTrainingSessions(trainingSessions);
  }, [schedule.stations]);

  // Handle rotation start
  const handleRotationStart = useCallback((state: EnhancedRotationExecutionState) => {
    setExecutionState(state);
    setActiveTab('monitor'); // Switch to monitoring view
    
    // Add start alert
    const startAlert: RotationAlert = {
      id: `start-${Date.now()}`,
      type: 'rotation_start',
      message: t('physicalTrainer:rotation.rotationStarted'),
      timestamp: new Date(),
      acknowledged: false,
      priority: 'medium'
    };
    setAlerts(prev => [...prev, startAlert]);
  }, [t]);

  // Handle rotation transition
  const handleRotationTransition = useCallback((state: EnhancedRotationExecutionState) => {
    setExecutionState(state);
    
    // Update training sessions for new rotation
    handleSessionsCreated(state.currentSessions.sessions.map(session => ({
      id: session.id,
      rotationContext: {
        ...session.rotationContext!,
        rotationIndex: state.currentRotation
      },
      stationWorkout: schedule.stations.find(s => s.id === session.rotationContext!.stationId)!.workout,
      assignedPlayers: session.assignedPlayers,
      status: session.status,
      duration: session.duration,
      startTime: session.startTime,
      endTime: session.endTime,
      actualDuration: session.actualDuration
    })));
  }, [handleSessionsCreated, schedule.stations]);

  // Handle rotation completion
  const handleRotationComplete = useCallback((state: EnhancedRotationExecutionState) => {
    setExecutionState(state);
    setActiveTab('analytics'); // Switch to analytics view
    
    // Add completion alert
    const completeAlert: RotationAlert = {
      id: `complete-${Date.now()}`,
      type: 'completion',
      message: t('physicalTrainer:rotation.allRotationsComplete'),
      timestamp: new Date(),
      acknowledged: false,
      priority: 'medium'
    };
    setAlerts(prev => [...prev, completeAlert]);
  }, [t]);

  // Handle emergency stop
  const handleEmergencyStop = useCallback(() => {
    if (executionState) {
      const stoppedState: EnhancedRotationExecutionState = {
        ...executionState,
        status: 'paused',
        alerts: [...executionState.alerts, {
          id: `emergency-${Date.now()}`,
          type: 'emergency_stop',
          message: t('physicalTrainer:rotation.emergencyStopActivated'),
          timestamp: new Date(),
          acknowledged: false,
          priority: 'critical'
        }]
      };
      setExecutionState(stoppedState);
    }
  }, [executionState, t]);

  // Handle transition alerts
  const handleTransitionAlert = useCallback((alert: RotationAlert) => {
    setAlerts(prev => [...prev, alert]);
  }, []);

  // Handle session selection
  const handleSessionSelect = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
  }, []);

  // Handle clearing session selection
  const handleClearSelection = useCallback(() => {
    setSelectedSessionId(undefined);
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    
    if (executionState) {
      setExecutionState(prev => prev ? {
        ...prev,
        alerts: prev.alerts.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      } : null);
    }
  }, [executionState]);

  // Show validation errors if schedule is invalid
  if (!validation.isValid) {
    return (
      <Card className={cn("max-w-2xl mx-auto mt-8", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t('physicalTrainer:rotation.scheduleValidationFailed')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {validation.errors.length > 0 && (
            <div>
              <div className="font-medium text-red-600 mb-2">
                {t('physicalTrainer:rotation.errors')}:
              </div>
              <ul className="list-disc list-inside space-y-1 text-red-600">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validation.warnings.length > 0 && (
            <div>
              <div className="font-medium text-yellow-600 mb-2">
                {t('physicalTrainer:rotation.warnings')}:
              </div>
              <ul className="list-disc list-inside space-y-1 text-yellow-600">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('physicalTrainer:rotation.backToBuilder')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header with alerts */}
      <div className="shrink-0 p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('physicalTrainer:rotation.backToBuilder')}
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              <span className="font-semibold">{schedule.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {executionState && (
              <Badge 
                variant={executionState.status === 'active' ? 'default' : 'secondary'}
                className={cn(
                  executionState.status === 'active' && 'bg-green-600',
                  executionState.status === 'completed' && 'bg-blue-600'
                )}
              >
                {executionState.status === 'active' && <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />}
                {executionState.status === 'completed' && <CheckCircle className="h-3 w-3 mr-2" />}
                {t(`physicalTrainer:rotation.status.${executionState.status}`)}
              </Badge>
            )}
            
            {alerts.filter(a => !a.acknowledged && a.priority === 'critical').length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {alerts.filter(a => !a.acknowledged && a.priority === 'critical').length}
              </Badge>
            )}
          </div>
        </div>

        {/* Show critical alerts */}
        {alerts.filter(a => !a.acknowledged && a.priority === 'critical').slice(0, 2).map(alert => (
          <Alert key={alert.id} className="border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="font-medium">{alert.message}</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => acknowledgeAlert(alert.id)}
              >
                {t('physicalTrainer:rotation.acknowledge')}
              </Button>
            </AlertDescription>
          </Alert>
        ))}

        {/* Show validation warnings */}
        {validation.warnings.length > 0 && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">
                {t('physicalTrainer:rotation.warningsDetected')}:
              </div>
              <div className="text-sm">
                {validation.warnings.slice(0, 2).join(', ')}
                {validation.warnings.length > 2 && ` (+${validation.warnings.length - 2} more)`}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {selectedSessionId && executionState ? (
          /* Show individual session monitoring using TrainingSessionViewer */
          <RotationAwareTrainingViewer
            schedule={schedule}
            executionState={executionState}
            trainingSessions={trainingSessions}
            selectedSessionId={selectedSessionId}
            onSessionSelect={handleSessionSelect}
            onClearSelection={handleClearSelection}
            onTransitionAlert={handleTransitionAlert}
          />
        ) : (
          /* Show tabbed interface for coordination and overview */
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
            <div className="shrink-0 px-4 pt-4">
              <TabsList>
                <TabsTrigger value="coordinator" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('physicalTrainer:rotation.coordinator')}
                </TabsTrigger>
                <TabsTrigger 
                  value="monitor" 
                  className="flex items-center gap-2"
                  disabled={!executionState || executionState.status === 'preparing'}
                >
                  <Monitor className="h-4 w-4" />
                  {t('physicalTrainer:rotation.monitor')}
                  {trainingSessions.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {trainingSessions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2"
                  disabled={!executionState || executionState.status === 'preparing'}
                >
                  <BarChart3 className="h-4 w-4" />
                  {t('physicalTrainer:rotation.analytics')}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0">
              <TabsContent value="coordinator" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex-1 overflow-auto p-4">
                  <RotationCoordinator
                    schedule={schedule}
                    onSessionsCreated={handleSessionsCreated}
                    onRotationStart={handleRotationStart}
                    onRotationTransition={handleRotationTransition}
                    onRotationComplete={handleRotationComplete}
                    onEmergencyStop={handleEmergencyStop}
                  />
                </div>
              </TabsContent>

              <TabsContent value="monitor" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                {executionState ? (
                  <RotationAwareTrainingViewer
                    schedule={schedule}
                    executionState={executionState}
                    trainingSessions={trainingSessions}
                    selectedSessionId={selectedSessionId}
                    onSessionSelect={handleSessionSelect}
                    onClearSelection={handleClearSelection}
                    onTransitionAlert={handleTransitionAlert}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <div className="text-lg font-medium">
                        {t('physicalTrainer:rotation.rotationNotStarted')}
                      </div>
                      <div className="text-sm mt-1">
                        {t('physicalTrainer:rotation.startRotationToMonitor')}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex-1 p-4">
                  {executionState && executionState.sessionHistory.length > 0 ? (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>{t('physicalTrainer:rotation.rotationSummary')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm font-medium">
                                {t('physicalTrainer:rotation.completedRotations')}
                              </div>
                              <div className="text-2xl font-bold">
                                {executionState.sessionHistory.length}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {t('physicalTrainer:rotation.totalSessions')}
                              </div>
                              <div className="text-2xl font-bold">
                                {executionState.sessionHistory.reduce((sum, rotation) => sum + rotation.sessions.length, 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {t('physicalTrainer:rotation.averageRotationTime')}
                              </div>
                              <div className="text-2xl font-bold">
                                {Math.round(schedule.rotationDuration)} min
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>{t('physicalTrainer:rotation.rotationHistory')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {executionState.sessionHistory.map((rotation, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium">
                                    {t('physicalTrainer:rotation.rotation')} {index + 1}
                                  </div>
                                  <Badge variant="outline">
                                    {rotation.sessions.length} {t('physicalTrainer:rotation.sessions')}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {rotation.startTime.toLocaleTimeString()} - {rotation.endTime.toLocaleTimeString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <div className="text-lg font-medium">
                          {t('physicalTrainer:rotation.noAnalyticsYet')}
                        </div>
                        <div className="text-sm mt-1">
                          {t('physicalTrainer:rotation.analyticsAvailableAfterStart')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
};