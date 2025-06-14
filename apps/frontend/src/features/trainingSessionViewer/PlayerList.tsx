import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setPlayer, setDisplayMode, setIntervals } from './trainingSessionViewerSlice';
import { useGetPlayersByTeamQuery, useStartLiveSessionMutation } from './trainingSessionApi';
import SessionPlan from './SessionPlan';

import { Button } from '@/components/ui/button';

export default function PlayerList() {
  const dispatch = useAppDispatch();
  const [planOpen, setPlanOpen] = React.useState(false);
  const teamId = useAppSelector((state) => state.trainingSessionViewer.selectedTeamId);
  const selectedPlayerId = useAppSelector((state) => state.trainingSessionViewer.selectedPlayerId);
  const { data: players = [], isLoading, error } = useGetPlayersByTeamQuery(teamId!, { skip: !teamId });
  const [startLiveSession, { isLoading: starting } ] = useStartLiveSessionMutation();

  function handleSelect(id: string) {
    dispatch(setPlayer(id));
  }

  async function handleStartSession() {
    if (!selectedPlayerId) return;
    try {
      const res = await startLiveSession({ playerId: selectedPlayerId }).unwrap();
      if (res?.intervals?.length) {
        dispatch(setIntervals(res.intervals));
      } else {
        dispatch(setIntervals(demoIntervals));
      }
    } catch {
      // fallback to demo intervals on error
      dispatch(setIntervals(demoIntervals));
    }
    dispatch(setDisplayMode('interval-timer'));
    setPlanOpen(false);
  }

  const demoIntervals = [
    { phase: 'work' as const, duration: 30 },
    { phase: 'rest' as const, duration: 15 },
    { phase: 'work' as const, duration: 30 },
    { phase: 'rest' as const, duration: 15 },
    { phase: 'work' as const, duration: 30 },
  ];

  if (!teamId) return null;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-10 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || players.length === 0) {
    // Demo fallback players
    const demoPlayers = [
      { id: 'player-1', name: 'Player One' },
      { id: 'player-2', name: 'Player Two' },
      { id: 'player-3', name: 'Player Three' },
    ];
    return (
      <div className="space-y-2">
        {demoPlayers.map((player) => (
          <Button
            key={player.id}
            variant="ghost"
            className={`w-full justify-start text-left ${
              selectedPlayerId === player.id ? 'bg-accent text-accent-foreground' : ''
            }`}
            onClick={() => handleSelect(player.id)}
          >
            {player.name}
          </Button>
        ))}
        <p className="text-red-500 text-sm">Backend unavailable. Showing demo players.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <Button
          key={player.id}
          variant="ghost"
          className={`w-full justify-start text-left ${
            selectedPlayerId === player.id ? 'bg-accent text-accent-foreground' : ''
          }`}
          onClick={() => handleSelect(player.id)}
        >
          {player.name}
        </Button>
      ))}

      {selectedPlayerId && (
        <Button className="w-full" onClick={() => setPlanOpen(true)} disabled={starting}>
          {starting ? 'Starting...' : 'View Session Plan'}
        </Button>
      )}

      <SessionPlan
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        onStart={handleStartSession}
        intervals={demoIntervals}
      />
    </div>
  );
} 