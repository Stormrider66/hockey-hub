'use client';

import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import trainingSessionViewerReducer, {
  setTeam,
  setTeamName,
  setPlayer,
  setDisplayMode,
  setMetricType,
  toggleFullscreen,
  setIntervals,
  startIntervalTimer,
  stopIntervalTimer,
  type DisplayMode
} from '@/store/slices/trainingSessionViewerSlice';
import type { RootState } from '@/store/store';
import TeamSelection from './TeamSelection';
import PlayerList from './PlayerList';
import TeamMetrics from './TeamMetrics';
import IntervalDisplay from './IntervalDisplay';
import PlayerProgram from './PlayerProgram';
import HybridDisplay from './viewers/HybridDisplay';
import AgilityDisplay from './viewers/AgilityDisplay';
import EnhancedConditioningViewer from './conditioning/EnhancedConditioningViewer';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, RotateCcw, Clock, ArrowRight } from '@/components/icons';
import { cn } from "@/lib/utils";
import { WorkoutViewerErrorBoundary } from './WorkoutErrorBoundary';

// Create a local store for the session viewer
const sessionViewerStore = configureStore({
  reducer: {
    trainingSessionViewer: trainingSessionViewerReducer,
  },
});

type SessionViewerRootState = ReturnType<typeof sessionViewerStore.getState>;

import { useAuth } from '@/contexts/AuthContext';
import { mockPlayerReadiness } from '../constants/mockData';

interface TrainingSessionViewerProps {
  sessionType?: string;
  teamName?: string;
  initialIntervals?: { phase: 'work' | 'rest'; duration: number }[];
  workoutType?: 'exercise' | 'interval' | 'hybrid' | 'agility';
  hybridBlocks?: any[]; // Import proper type when needed
  agilitySession?: any; // Import proper type when needed
  sessionData?: any; // Session data that includes type information
  onComplete?: () => void; // Callback when session is completed
  // Rotation-specific props
  isRotationSession?: boolean;
  rotationContext?: {
    stationName?: string;
    groupName?: string;
    timeUntilRotation?: number;
    nextStation?: string;
    rotationIndex?: number;
  };
}

function TrainingSessionViewerContent({ 
  sessionType = 'Training Session',
  teamName = '',
  initialIntervals = [],
  workoutType,
  hybridBlocks,
  agilitySession,
  sessionData,
  onComplete,
  isRotationSession = false,
  rotationContext
}: TrainingSessionViewerProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const dispatch = useDispatch();
  const { user } = useAuth();
  
  const {
    selectedTeam,
    selectedTeamName,
    selectedPlayer,
    displayMode,
    metricType,
    isFullscreen,
    intervals
  } = useSelector((state: SessionViewerRootState) => state.trainingSessionViewer);

  // Use mock data for teams
  const teams = useMemo(() => {
    return [
      { id: 'team-001', name: 'Senior Team', level: 'Elite', playerCount: 25, activeSession: false },
      { id: 'team-002', name: 'Junior A', level: 'Junior', playerCount: 22, activeSession: false },
      { id: 'team-003', name: 'Junior B', level: 'Junior', playerCount: 20, activeSession: false },
      { id: 'team-004', name: 'U18 Elite', level: 'Youth', playerCount: 18, activeSession: false }
    ];
  }, []);

  // Use mock players data
  const players = useMemo(() => {
    // Create full player data from mockPlayerReadiness
    const positions = ['Center', 'Wing', 'Defense', 'Goalie'];
    
    return mockPlayerReadiness.map((player, index) => ({
      id: player.playerId,
      name: player.name,
      number: parseInt(player.playerId) * 10 + index, // Generate jersey numbers
      position: positions[index % positions.length],
      status: player.status === 'rest' ? 'inactive' as const : 'active' as const,
      heartRate: Math.floor(Math.random() * 40) + 130, // Mock data
      watts: Math.floor(Math.random() * 150) + 200, // Mock data
      heartRateZone: Math.floor(Math.random() * 3) + 2 as (2 | 3 | 4 | 5), // Mock data
    }));
  }, []);

  // Create player metrics
  const playerMetrics = useMemo(() => {
    return players
      .filter(p => p.status === 'active')
      .map(p => ({
        ...p,
        maxHeartRate: 190,
        targetZone: { min: 140, max: 160 },
        effort: p.heartRateZone === 5 ? 9 : p.heartRateZone === 4 ? 7 : p.heartRateZone === 3 ? 5 : 3
      }));
  }, [players]);

  // Initialize with team name if provided
  useEffect(() => {
    if (teamName && teams.length > 0) {
      dispatch(setTeamName(teamName));
      // Auto-select team if it matches
      const team = teams.find(t => t.name === teamName);
      if (team) {
        dispatch(setTeam(team.id));
      }
    }
  }, [teamName, teams, dispatch]);

  // Set intervals if provided
  useEffect(() => {
    if (initialIntervals.length > 0) {
      dispatch(setIntervals(initialIntervals));
    }
  }, [initialIntervals, dispatch]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        dispatch(toggleFullscreen());
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [dispatch]);

  const handleToggleFullscreen = async () => {
    if (!isFullscreen) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    dispatch(toggleFullscreen());
  };

  const handleSelectTeam = (teamId: string, teamName: string) => {
    dispatch(setTeam(teamId));
    dispatch(setTeamName(teamName));
  };

  const handleSelectPlayer = (playerId: string) => {
    dispatch(setPlayer(playerId));
  };

  const handleBack = () => {
    if (displayMode === 'player-program') {
      dispatch(setPlayer(null));
    } else if (displayMode === 'interval-timer' || displayMode === 'team-metrics') {
      dispatch(setDisplayMode('player-list'));
    } else {
      dispatch(setDisplayMode('team-selection'));
    }
  };

  const handleStartInterval = () => {
    // Set default intervals if none exist
    if (intervals.length === 0) {
      // Default: 8x4min work with 2min rest
      const defaultIntervals = [];
      for (let i = 0; i < 8; i++) {
        defaultIntervals.push({ phase: 'work' as const, duration: 240 }); // 4 minutes
        if (i < 7) {
          defaultIntervals.push({ phase: 'rest' as const, duration: 120 }); // 2 minutes
        }
      }
      dispatch(setIntervals(defaultIntervals));
    }
    dispatch(startIntervalTimer());
  };

  const handleViewMetrics = () => {
    dispatch(setDisplayMode('team-metrics'));
  };

  const handleIntervalComplete = () => {
    dispatch(stopIntervalTimer());
    dispatch(setDisplayMode('player-list'));
  };

  // Determine the actual workout type based on props and session data
  const determineWorkoutType = () => {
    // Explicit workout type takes precedence
    if (workoutType) return workoutType;
    
    // Check sessionData.type if provided
    if (sessionData?.type) {
      switch (sessionData.type.toUpperCase()) {
        case 'CARDIO':
        case 'CONDITIONING':
          return 'interval';
        case 'HYBRID':
          return 'hybrid';
        case 'AGILITY':
          return 'agility';
        case 'STRENGTH':
        case 'FLEXIBILITY':
        case 'RECOVERY':
        default:
          return 'exercise';
      }
    }
    
    // Check sessionType prop (legacy support)
    if (sessionType) {
      switch (sessionType.toUpperCase()) {
        case 'CARDIO':
        case 'CONDITIONING':
          return 'interval';
        case 'HYBRID':
          return 'hybrid';
        case 'AGILITY':
          return 'agility';
        case 'STRENGTH':
        case 'FLEXIBILITY':
        case 'RECOVERY':
        default:
          return 'exercise';
      }
    }
    
    // Check for hybrid blocks
    if (hybridBlocks && hybridBlocks.length > 0) return 'hybrid';
    
    // Check for agility session
    if (agilitySession) return 'agility';
    
    // Check for intervals (conditioning)
    if (initialIntervals.length > 0 || intervals.length > 0) return 'interval';
    
    // Default to exercise-based
    return 'exercise';
  };

  const actualWorkoutType = determineWorkoutType();

  // Render different views based on display mode
  const renderContent = () => {
    // No loading state needed since we're using mock data

    // Handle special workout types that bypass normal flow when not in team selection
    if (displayMode !== 'team-selection' && selectedTeam) {
      // For HYBRID workouts
      if (actualWorkoutType === 'hybrid') {
        // Create a proper HybridWorkoutSession from available data
        const hybridSession = sessionData?.hybridProgram ? sessionData : {
          id: sessionData?.id || 'temp-hybrid-session',
          title: sessionData?.title || selectedTeamName || teamName || 'Hybrid Workout',
          type: 'hybrid' as const,
          hybridProgram: {
            id: 'temp-hybrid-program',
            name: sessionData?.title || 'Hybrid Workout',
            description: sessionData?.description || '',
            blocks: hybridBlocks || [],
            totalDuration: hybridBlocks?.reduce((sum, block) => sum + (block.duration || 0), 0) || 0,
            totalExercises: 0,
            totalIntervals: 0,
            estimatedCalories: 0,
            equipment: []
          },
          scheduledDate: new Date(),
          location: sessionData?.location || 'Training Center',
          teamId: selectedTeam || '',
          playerIds: [],
          createdBy: user?.id || '',
          status: 'active' as const
        };
        
        return (
          <WorkoutViewerErrorBoundary
            componentName="Hybrid Workout Display"
            onReset={handleBack}
          >
            <HybridDisplay
              session={hybridSession}
              onBack={handleBack}
              onComplete={() => {
                dispatch(setDisplayMode('player-list'));
                onComplete?.();
              }}
            />
          </WorkoutViewerErrorBoundary>
        );
      }

      // For AGILITY workouts
      if (actualWorkoutType === 'agility') {
        // Transform session data to match AgilityDisplay expectations
        const agilityProgram = {
          id: sessionData?.id || 'agility-session',
          name: sessionData?.name || 'Agility Training',
          description: sessionData?.description || '',
          drills: sessionData?.agilityProgram?.drills || [],
          warmupDuration: sessionData?.agilityProgram?.warmupDuration || 300, // 5 min default
          cooldownDuration: sessionData?.agilityProgram?.cooldownDuration || 300, // 5 min default
          totalDuration: sessionData?.agilityProgram?.totalDuration || 1800, // 30 min default
          equipmentNeeded: sessionData?.agilityProgram?.equipmentNeeded || [],
          difficulty: sessionData?.agilityProgram?.difficulty || 'intermediate',
          focusAreas: sessionData?.agilityProgram?.focusAreas || []
        };
        
        return (
          <WorkoutViewerErrorBoundary
            componentName="Agility Workout Display"
            onReset={handleBack}
          >
            <AgilityDisplay
              sessionId={sessionData?.id || 'agility-session'}
              program={agilityProgram}
              onComplete={(execution) => {
                dispatch(setDisplayMode('player-list'));
                onComplete?.();
              }}
              onCancel={handleBack}
            />
          </WorkoutViewerErrorBoundary>
        );
      }

      // For CARDIO/INTERVAL workouts - use enhanced conditioning viewer
      if (actualWorkoutType === 'interval' && (intervals.length > 0 || initialIntervals.length > 0 || sessionData?.intervalProgram)) {
        // Create a conditioning session from available data
        const conditioningSession = {
          id: sessionData?.id || `conditioning-${Date.now()}`,
          title: sessionData?.title || sessionData?.name || 'Conditioning Workout',
          type: 'CONDITIONING' as const,
          intervalProgram: sessionData?.intervalProgram || {
            id: `program-${Date.now()}`,
            name: sessionData?.title || 'Conditioning Workout',
            description: sessionData?.description || '',
            equipment: sessionData?.equipment || 'rowing',
            intervals: sessionData?.intervalProgram?.intervals || intervals.length > 0 ? intervals : initialIntervals,
            totalDuration: sessionData?.duration || 0,
            estimatedCalories: 0,
            targetZones: {},
            tags: [],
            difficulty: 'intermediate'
          },
          scheduledDate: new Date(),
          location: sessionData?.location || 'Training Center',
          teamId: selectedTeam || '',
          playerIds: [],
          createdBy: user?.id || '',
          status: 'active' as const
        };
        
        return (
          <WorkoutViewerErrorBoundary
            componentName="Enhanced Conditioning Display"
            onReset={handleBack}
          >
            <EnhancedConditioningViewer
              session={conditioningSession}
              playerId={user?.id || 'player-001'}
              playerName={user?.name || 'Player'}
              onComplete={() => {
                dispatch(setDisplayMode('player-list'));
                onComplete?.();
              }}
              onBack={handleBack}
              isGroupView={true}
              groupParticipants={players.filter(p => p.status === 'active').map(p => ({
                playerId: p.id,
                playerName: p.name,
                currentHeartRate: Math.floor(Math.random() * 40) + 120,
                currentPower: Math.floor(Math.random() * 100) + 150,
                isInTargetZone: Math.random() > 0.3
              }))}
            />
          </WorkoutViewerErrorBoundary>
        );
      }
    }

    switch (displayMode) {
      case 'team-selection':
        return (
          <TeamSelection
            teams={teams}
            onSelectTeam={handleSelectTeam}
          />
        );
      
      case 'player-list':
        return (
          <PlayerList
            teamName={selectedTeamName || ''}
            players={players}
            metricType={metricType}
            onSelectPlayer={handleSelectPlayer}
            onBack={handleBack}
            onStartInterval={actualWorkoutType === 'interval' ? handleStartInterval : undefined}
            onViewMetrics={handleViewMetrics}
          />
        );
      
      case 'team-metrics':
        return (
          <TeamMetrics
            teamName={selectedTeamName || ''}
            players={playerMetrics}
            metricType={metricType}
            onBack={handleBack}
          />
        );
      
      case 'interval-timer':
        return (
          <WorkoutViewerErrorBoundary
            componentName="Interval Timer"
            onReset={handleBack}
          >
            <IntervalDisplay
              teamName={selectedTeamName || ''}
              intervals={intervals}
              onBack={handleBack}
              onComplete={handleIntervalComplete}
            />
          </WorkoutViewerErrorBoundary>
        );
      
      case 'player-program':
        const player = players.find(p => p.id === selectedPlayer);
        return player ? (
          <PlayerProgram
            player={player}
            onBack={handleBack}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "h-full bg-background relative",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Rotation Context Banner */}
      {isRotationSession && rotationContext && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {rotationContext.stationName || 'Rotation Station'}
                </span>
              </div>
              {rotationContext.groupName && (
                <div className="text-blue-700">
                  Group: {rotationContext.groupName}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-blue-700">
              {rotationContext.timeUntilRotation !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">
                    {Math.floor(rotationContext.timeUntilRotation / 60)}:{(rotationContext.timeUntilRotation % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              {rotationContext.nextStation && (
                <div className="flex items-center gap-1">
                  <ArrowRight className="h-4 w-4" />
                  <span>Next: {rotationContext.nextStation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleFullscreen}
        className={cn(
          "absolute top-4 right-4 z-10",
          isRotationSession && "top-16" // Adjust for rotation banner
        )}
      >
        {isFullscreen ? (
          <Minimize2 className="h-5 w-5" />
        ) : (
          <Maximize2 className="h-5 w-5" />
        )}
      </Button>

      {/* Main content */}
      {renderContent()}
    </div>
  );
}

// Export wrapped component
export default function TrainingSessionViewer(props: TrainingSessionViewerProps) {
  return (
    <Provider store={sessionViewerStore}>
      <TrainingSessionViewerContent {...props} />
    </Provider>
  );
}