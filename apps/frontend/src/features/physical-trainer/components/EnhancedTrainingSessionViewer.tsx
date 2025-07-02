'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useTrainingSocket } from '@/contexts/TrainingSocketContext';
import {
  useGetWorkoutSessionByIdQuery,
  useGetSessionExecutionsQuery,
  useStartWorkoutExecutionMutation,
  useUpdatePlayerWorkoutLoadMutation,
} from '@/store/api/trainingApi';
import {
  setViewMode,
  setFocusedPlayer,
  setShowMetrics,
  setAutoRotation,
  setRotationInterval,
  updatePlayerProgress,
  updatePlayerMetrics,
  addActivePlayer,
  removeActivePlayer,
  type ViewMode,
} from '@/store/slices/trainingSessionViewerSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Grid3x3,
  Maximize2,
  Monitor,
  Play,
  Pause,
  RotateCw,
  Activity,
  Zap,
  Timer,
  Users,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkoutSession, WorkoutExecution, Exercise } from '@hockey-hub/shared-lib';

interface EnhancedTrainingSessionViewerProps {
  sessionId: string;
  isTrainerView?: boolean;
}

export function EnhancedTrainingSessionViewer({ 
  sessionId, 
  isTrainerView = true 
}: EnhancedTrainingSessionViewerProps) {
  const dispatch = useDispatch();
  const { joinSession, leaveSession, changeView, focusPlayer, startSession } = useTrainingSocket();
  
  // Redux state
  const { 
    viewMode, 
    focusedPlayerId, 
    showMetrics, 
    autoRotation,
    rotationInterval,
    activePlayers,
    playerProgress,
    playerMetrics,
  } = useSelector((state: RootState) => state.trainingSessionViewer);
  
  // API queries
  const { data: sessionData, isLoading: sessionLoading } = useGetWorkoutSessionByIdQuery(sessionId);
  const { data: executionsData, refetch: refetchExecutions } = useGetSessionExecutionsQuery(sessionId);
  const [startExecution] = useStartWorkoutExecutionMutation();
  const [updatePlayerLoad] = useUpdatePlayerWorkoutLoadMutation();

  const session = sessionData?.data;
  const executions = executionsData?.data || [];

  // Local state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  // Join/leave session room on mount/unmount
  useEffect(() => {
    joinSession(sessionId);
    return () => leaveSession(sessionId);
  }, [sessionId, joinSession, leaveSession]);

  // Auto-rotation logic
  useEffect(() => {
    if (!autoRotation || !isAutoRotating || activePlayers.length === 0) return;

    const interval = setInterval(() => {
      const currentIndex = activePlayers.indexOf(focusedPlayerId || '');
      const nextIndex = (currentIndex + 1) % activePlayers.length;
      const nextPlayerId = activePlayers[nextIndex];
      
      dispatch(setFocusedPlayer(nextPlayerId));
      focusPlayer({ sessionId, playerId: nextPlayerId });
    }, rotationInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRotation, isAutoRotating, activePlayers, focusedPlayerId, rotationInterval, dispatch, focusPlayer, sessionId]);

  // View mode handlers
  const handleViewModeChange = (mode: ViewMode) => {
    dispatch(setViewMode(mode));
    changeView({ sessionId, viewMode: mode });
  };

  const handlePlayerFocus = (playerId: string) => {
    dispatch(setFocusedPlayer(playerId));
    focusPlayer({ sessionId, playerId });
  };

  const handleToggleMetrics = () => {
    dispatch(setShowMetrics(!showMetrics));
  };

  const handleToggleAutoRotation = () => {
    setIsAutoRotating(!isAutoRotating);
    dispatch(setAutoRotation(!autoRotation));
  };

  const handleStartSession = async () => {
    if (!session) return;
    
    // Start execution for all assigned players
    for (const playerId of session.playerIds) {
      await startExecution({ workoutSessionId: sessionId, playerId });
    }
    
    startSession(sessionId);
    refetchExecutions();
  };

  const renderPlayerCard = (playerId: string, execution?: WorkoutExecution) => {
    const playerLoad = session?.playerLoads.find(load => load.playerId === playerId);
    const progress = playerProgress[playerId];
    const metrics = playerMetrics[playerId];
    const currentExercise = session?.exercises[progress?.currentExerciseIndex || 0];

    return (
      <Card 
        key={playerId}
        className={cn(
          "cursor-pointer transition-all",
          focusedPlayerId === playerId && "ring-2 ring-primary",
          execution?.status === 'completed' && "opacity-60"
        )}
        onClick={() => handlePlayerFocus(playerId)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Player {playerId.slice(-4)}</CardTitle>
            <Badge variant={execution?.status === 'in_progress' ? 'default' : 'secondary'}>
              {execution?.status || 'not_started'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentExercise && (
            <div className="space-y-1">
              <p className="text-xs font-medium">{currentExercise.name}</p>
              <p className="text-xs text-muted-foreground">
                Set {progress?.currentSetNumber || 1} of {currentExercise.sets || 1}
              </p>
            </div>
          )}
          
          {execution && (
            <Progress value={execution.completionPercentage || 0} className="h-1" />
          )}
          
          {showMetrics && metrics && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {metrics.heartRate && (
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>{metrics.heartRate} bpm</span>
                </div>
              )}
              {metrics.power && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{metrics.power} W</span>
                </div>
              )}
            </div>
          )}
          
          {playerLoad && playerLoad.loadModifier !== 1 && (
            <Badge variant="outline" className="text-xs">
              {Math.round(playerLoad.loadModifier * 100)}% Load
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderFocusedView = () => {
    if (!focusedPlayerId || !session) return null;
    
    const execution = executions.find(e => e.playerId === focusedPlayerId);
    const progress = playerProgress[focusedPlayerId];
    const metrics = playerMetrics[focusedPlayerId];
    const currentExercise = session.exercises[progress?.currentExerciseIndex || 0];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Player {focusedPlayerId.slice(-4)}</h2>
          <Button variant="outline" onClick={() => dispatch(setFocusedPlayer(null))}>
            <Grid3x3 className="h-4 w-4 mr-2" />
            Back to Grid
          </Button>
        </div>

        {currentExercise && (
          <Card>
            <CardHeader>
              <CardTitle>{currentExercise.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Sets</p>
                  <p className="text-2xl font-bold">
                    {progress?.currentSetNumber || 1} / {currentExercise.sets || 1}
                  </p>
                </div>
                {currentExercise.reps && (
                  <div>
                    <p className="text-sm font-medium">Reps</p>
                    <p className="text-2xl font-bold">{currentExercise.reps}</p>
                  </div>
                )}
                {currentExercise.duration && (
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-2xl font-bold">{currentExercise.duration}s</p>
                  </div>
                )}
                {currentExercise.targetValue && (
                  <div>
                    <p className="text-sm font-medium">Target</p>
                    <p className="text-2xl font-bold">
                      {currentExercise.targetValue} {currentExercise.unit}
                    </p>
                  </div>
                )}
              </div>

              {currentExercise.instructions && (
                <div>
                  <p className="text-sm font-medium mb-1">Instructions</p>
                  <p className="text-sm text-muted-foreground">{currentExercise.instructions}</p>
                </div>
              )}

              <Progress value={execution?.completionPercentage || 0} />
            </CardContent>
          </Card>
        )}

        {showMetrics && metrics && (
          <Card>
            <CardHeader>
              <CardTitle>Live Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.heartRate && (
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{metrics.heartRate}</p>
                    <p className="text-sm text-muted-foreground">Heart Rate</p>
                  </div>
                )}
                {metrics.power && (
                  <div className="text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{metrics.power}</p>
                    <p className="text-sm text-muted-foreground">Power (W)</p>
                  </div>
                )}
                {metrics.speed && (
                  <div className="text-center">
                    <Timer className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{metrics.speed}</p>
                    <p className="text-sm text-muted-foreground">Speed</p>
                  </div>
                )}
                {metrics.calories && (
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{metrics.calories}</p>
                    <p className="text-sm text-muted-foreground">Calories</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderTVView = () => {
    if (!session) return null;
    
    const activeExecution = executions.find(e => 
      e.playerId === focusedPlayerId && e.status === 'in_progress'
    );
    const currentExercise = session.exercises[activeExecution?.currentExerciseIndex || 0];

    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-2">{session.title}</h1>
            <p className="text-2xl text-gray-400">{session.location}</p>
          </div>

          {currentExercise && (
            <div className="bg-gray-900 rounded-lg p-12 text-center">
              <h2 className="text-5xl font-bold mb-8">{currentExercise.name}</h2>
              
              <div className="grid grid-cols-3 gap-8 text-4xl">
                {currentExercise.sets && (
                  <div>
                    <p className="text-gray-500 mb-2">Sets</p>
                    <p className="font-bold">{currentExercise.sets}</p>
                  </div>
                )}
                {currentExercise.reps && (
                  <div>
                    <p className="text-gray-500 mb-2">Reps</p>
                    <p className="font-bold">{currentExercise.reps}</p>
                  </div>
                )}
                {currentExercise.duration && (
                  <div>
                    <p className="text-gray-500 mb-2">Time</p>
                    <p className="font-bold">{currentExercise.duration}s</p>
                  </div>
                )}
              </div>

              {currentExercise.restDuration && (
                <div className="mt-8 text-2xl text-gray-400">
                  Rest: {currentExercise.restDuration}s
                </div>
              )}
            </div>
          )}

          {showMetrics && (
            <div className="grid grid-cols-4 gap-4">
              {activePlayers.slice(0, 4).map(playerId => {
                const metrics = playerMetrics[playerId];
                return metrics ? (
                  <div key={playerId} className="bg-gray-900 rounded-lg p-6 text-center">
                    <p className="text-xl mb-2">Player {playerId.slice(-4)}</p>
                    {metrics.heartRate && (
                      <p className="text-3xl font-bold">{metrics.heartRate} bpm</p>
                    )}
                    {metrics.power && (
                      <p className="text-xl text-gray-400">{metrics.power} W</p>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (sessionLoading) {
    return <div>Loading session...</div>;
  }

  if (!session) {
    return <div>Session not found</div>;
  }

  // Render TV mode separately
  if (viewMode === 'tv' && !isTrainerView) {
    return renderTVView();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-muted-foreground">
            {new Date(session.scheduledDate).toLocaleString()} • {session.location}
          </p>
        </div>
        
        {isTrainerView && session.status === 'scheduled' && (
          <Button onClick={handleStartSession}>
            <Play className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        )}
      </div>

      {/* Controls */}
      {isTrainerView && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'focus' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewModeChange('focus')}
                >
                  <User className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'tv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewModeChange('tv')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleMetrics}
                >
                  {showMetrics ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant={isAutoRotating ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleAutoRotation}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="ml-auto text-sm text-muted-foreground">
                {activePlayers.length} / {session.playerIds.length} Active
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {session.playerIds.map(playerId => {
            const execution = executions.find(e => e.playerId === playerId);
            return renderPlayerCard(playerId, execution);
          })}
        </div>
      ) : viewMode === 'focus' ? (
        renderFocusedView()
      ) : null}
    </div>
  );
}