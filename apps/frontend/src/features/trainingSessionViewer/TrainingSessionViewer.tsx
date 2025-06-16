import React, { useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAppSelector } from '../../store/hooks';
import TeamSelection from './TeamSelection';
import PlayerList from './PlayerList';
import TeamMetrics from './TeamMetrics';
import IntervalDisplay from './IntervalDisplay';
import IntervalTrainingView from './IntervalTrainingView';
import StrengthTrainingView from './StrengthTrainingView';

const LIVE_METRICS_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3004/live-metrics';
const INTERVAL_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3004/session-intervals';

let metricsSocket: Socket | null = null;
let intervalSocket: Socket | null = null;

export default function TrainingSessionViewer() {
  const selectedTeamId = useAppSelector((state) => state.trainingSessionViewer.selectedTeamId);
  const selectedTeamName = useAppSelector((state) => state.trainingSessionViewer.selectedTeamName);
  const selectedPlayerId = useAppSelector((state) => state.trainingSessionViewer.selectedPlayerId);
  const displayMode = useAppSelector((state) => state.trainingSessionViewer.displayMode);

  // connect/disconnect metrics socket when team changes
  useEffect(() => {
    if (metricsSocket) {
      metricsSocket.disconnect();
      metricsSocket = null;
    }
    if (selectedTeamId) {
      metricsSocket = io(LIVE_METRICS_URL, {
        query: { teamId: selectedTeamId },
        auth: { token: localStorage.getItem('accessToken') },
      });
    }
  }, [selectedTeamId]);

  // manage interval socket when timer mode active
  useEffect(() => {
    if (intervalSocket) {
      intervalSocket.disconnect();
      intervalSocket = null;
    }

    if (displayMode === 'interval-timer' && selectedPlayerId) {
      intervalSocket = io(INTERVAL_SOCKET_URL, {
        query: { playerId: selectedPlayerId },
        auth: { token: localStorage.getItem('accessToken') },
      });
    }

    return () => {
      if (intervalSocket) {
        intervalSocket.disconnect();
        intervalSocket = null;
      }
    };
  }, [displayMode, selectedPlayerId]);

  return (
    <div className={`w-full h-full flex flex-col ${displayMode === 'strength-training' || displayMode === 'interval-timer' ? '' : 'p-4'}`}>
      {displayMode === 'team-selection' && <TeamSelection />}
      {displayMode === 'player-list' && <PlayerList />}
      {displayMode === 'team-metrics' && <TeamMetrics socket={metricsSocket} />}
      {displayMode === 'interval-timer' && <IntervalTrainingView teamName={selectedTeamName} socket={intervalSocket} />}
      {displayMode === 'strength-training' && <StrengthTrainingView teamName={selectedTeamName} />}
    </div>
  );
} 