'use client';

import React, { useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from "@/lib/utils";

// Create a local store for the session viewer
const sessionViewerStore = configureStore({
  reducer: {
    trainingSessionViewer: trainingSessionViewerReducer,
  },
});

type SessionViewerRootState = ReturnType<typeof sessionViewerStore.getState>;

// Mock data - in a real app, this would come from API
const MOCK_TEAMS = [
  { id: '1', name: 'A-Team', level: 'A-Team' as const, playerCount: 25, activeSession: true },
  { id: '2', name: 'J20 Team', level: 'J20' as const, playerCount: 22, activeSession: false },
  { id: '3', name: 'U18 Team', level: 'U18' as const, playerCount: 20, activeSession: false },
  { id: '4', name: 'U16 Team', level: 'U16' as const, playerCount: 18, activeSession: true },
];

const MOCK_PLAYERS = [
  { id: '1', name: 'Erik Andersson', number: 15, position: 'Forward', status: 'active' as const, heartRate: 145, watts: 250, heartRateZone: 3 as const },
  { id: '2', name: 'Marcus Lindberg', number: 7, position: 'Defenseman', status: 'active' as const, heartRate: 152, watts: 280, heartRateZone: 4 as const },
  { id: '3', name: 'Viktor Nilsson', number: 23, position: 'Goalie', status: 'rest' as const },
  { id: '4', name: 'Johan Bergström', number: 12, position: 'Forward', status: 'active' as const, heartRate: 138, watts: 230, heartRateZone: 3 as const },
  { id: '5', name: 'Anders Johansson', number: 3, position: 'Defenseman', status: 'active' as const, heartRate: 165, watts: 300, heartRateZone: 4 as const },
  { id: '6', name: 'Lars Svensson', number: 18, position: 'Forward', status: 'active' as const, heartRate: 178, watts: 320, heartRateZone: 5 as const },
  { id: '7', name: 'Per Olsson', number: 5, position: 'Defenseman', status: 'injured' as const },
  { id: '8', name: 'Niklas Gustafsson', number: 30, position: 'Goalie', status: 'active' as const, heartRate: 125, watts: 180, heartRateZone: 2 as const },
];

const MOCK_PLAYER_METRICS = MOCK_PLAYERS
  .filter(p => p.status === 'active')
  .map(p => ({
    ...p,
    maxHeartRate: 190,
    targetZone: { min: 140, max: 160 },
    effort: p.heartRateZone === 5 ? 9 : p.heartRateZone === 4 ? 7 : p.heartRateZone === 3 ? 5 : 3
  }));

interface TrainingSessionViewerProps {
  sessionType?: string;
  teamName?: string;
  initialIntervals?: { phase: 'work' | 'rest'; duration: number }[];
}

function TrainingSessionViewerContent({ 
  sessionType = 'Training Session',
  teamName = '',
  initialIntervals = []
}: TrainingSessionViewerProps) {
  const dispatch = useDispatch();
  const {
    selectedTeam,
    selectedTeamName,
    selectedPlayer,
    displayMode,
    metricType,
    isFullscreen,
    intervals
  } = useSelector((state: SessionViewerRootState) => state.trainingSessionViewer);

  // Initialize with team name if provided
  useEffect(() => {
    if (teamName) {
      dispatch(setTeamName(teamName));
      // Auto-select team if it matches
      const team = MOCK_TEAMS.find(t => t.name === teamName);
      if (team) {
        dispatch(setTeam(team.id));
      }
    }
  }, [teamName, dispatch]);

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

  // Render different views based on display mode
  const renderContent = () => {
    switch (displayMode) {
      case 'team-selection':
        return (
          <TeamSelection
            teams={MOCK_TEAMS}
            onSelectTeam={handleSelectTeam}
          />
        );
      
      case 'player-list':
        return (
          <PlayerList
            teamName={selectedTeamName || ''}
            players={MOCK_PLAYERS}
            metricType={metricType}
            onSelectPlayer={handleSelectPlayer}
            onBack={handleBack}
            onStartInterval={handleStartInterval}
            onViewMetrics={handleViewMetrics}
          />
        );
      
      case 'team-metrics':
        return (
          <TeamMetrics
            teamName={selectedTeamName || ''}
            players={MOCK_PLAYER_METRICS}
            metricType={metricType}
            onBack={handleBack}
          />
        );
      
      case 'interval-timer':
        return (
          <IntervalDisplay
            teamName={selectedTeamName || ''}
            intervals={intervals}
            onBack={handleBack}
            onComplete={handleIntervalComplete}
          />
        );
      
      case 'player-program':
        const player = MOCK_PLAYERS.find(p => p.id === selectedPlayer);
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