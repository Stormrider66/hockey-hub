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
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { WorkoutViewerErrorBoundary } from './WorkoutErrorBoundary';

// Create a local store for the session viewer
const sessionViewerStore = configureStore({
  reducer: {
    trainingSessionViewer: trainingSessionViewerReducer,
  },
});

type SessionViewerRootState = ReturnType<typeof sessionViewerStore.getState>;

import { useGetTeamsQuery } from '@/store/api/userApi';
import { useGetPlayersQuery } from '@/store/api/playerApi';
import { useAuth } from '@/contexts/AuthContext';

interface TrainingSessionViewerProps {
  sessionType?: string;
  teamName?: string;
  initialIntervals?: { phase: 'work' | 'rest'; duration: number }[];
  workoutType?: 'exercise' | 'interval' | 'hybrid' | 'agility';
  hybridBlocks?: any[]; // Import proper type when needed
  agilitySession?: any; // Import proper type when needed
  sessionData?: any; // Session data that includes type information
  onComplete?: () => void; // Callback when session is completed
}

function TrainingSessionViewerContent({ 
  sessionType = 'Training Session',
  teamName = '',
  initialIntervals = [],
  workoutType,
  hybridBlocks,
  agilitySession,
  sessionData,
  onComplete
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

  // Fetch teams data
  const { data: teamsData, isLoading: teamsLoading } = useGetTeamsQuery({
    organizationId: user?.organizationId || ''
  });

  // Fetch players data
  const { data: playersData, isLoading: playersLoading } = useGetPlayersQuery({
    organizationId: user?.organizationId || '',
    includeStats: false
  });

  // Transform teams data
  const teams = useMemo(() => {
    if (!teamsData?.data) return [];
    return teamsData.data.map(team => ({
      id: team.id,
      name: team.name,
      level: team.name,
      playerCount: team.playerCount || 0,
      activeSession: false // This would come from session data
    }));
  }, [teamsData]);

  // Transform players data with mock metrics for now
  const players = useMemo(() => {
    if (!playersData?.players) return [];
    return playersData.players.map(player => ({
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      number: parseInt(player.jerseyNumber || '0'),
      position: player.position || 'Unknown',
      status: 'active' as const, // This would come from medical service
      heartRate: Math.floor(Math.random() * 40) + 130, // Mock data
      watts: Math.floor(Math.random() * 150) + 200, // Mock data
      heartRateZone: Math.floor(Math.random() * 3) + 2 as (2 | 3 | 4 | 5), // Mock data
    }));
  }, [playersData]);

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
    if (teamsLoading || playersLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common:loading.loadingData')}</p>
          </div>
        </div>
      );
    }

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

      // For CARDIO/INTERVAL workouts - go directly to interval timer
      if (actualWorkoutType === 'interval' && (intervals.length > 0 || initialIntervals.length > 0)) {
        return (
          <WorkoutViewerErrorBoundary
            componentName="Interval Training Display"
            onReset={handleBack}
          >
            <IntervalDisplay
              teamName={selectedTeamName || teamName || ''}
              intervals={intervals.length > 0 ? intervals : initialIntervals}
              onBack={handleBack}
              onComplete={() => {
                dispatch(setDisplayMode('player-list'));
                onComplete?.();
              }}
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
      {/* Fullscreen toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleFullscreen}
        className="absolute top-4 right-4 z-10"
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