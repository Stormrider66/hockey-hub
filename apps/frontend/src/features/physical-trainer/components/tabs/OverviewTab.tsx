'use client';

import React from 'react';
import CalendarWidget from '@/features/calendar/components/CalendarWidget';
import QuickStats from './overview/QuickStats';
import TodaysSessions from './overview/TodaysSessions';
import PlayerReadiness from './overview/PlayerReadiness';
import type { WorkoutSession, PlayerReadiness as PlayerReadinessType, TodaySession } from '../../types';
import { useAuth } from "@/contexts/AuthContext";

interface OverviewTabProps {
  selectedTeamId: string | null;
  todaysSessions: TodaySession[];
  playerReadiness: PlayerReadinessType[];
  onCreateSession: () => void;
  onLaunchSession: (session: TodaySession) => void;
  onViewAllPlayers?: () => void;
}

export default function OverviewTab({
  selectedTeamId,
  todaysSessions,
  playerReadiness,
  onCreateSession,
  onLaunchSession,
  onViewAllPlayers
}: OverviewTabProps) {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <QuickStats todaysSessions={todaysSessions} playerReadiness={playerReadiness} />
      
      <TodaysSessions 
        sessions={todaysSessions}
        onCreateNew={onCreateSession}
        onLaunchSession={onLaunchSession}
      />
      
      <CalendarWidget 
        organizationId={user?.organizationId || ''} 
        userId={user?.id || ''}
        teamId={selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId || undefined}
        days={7}
      />
      
      <PlayerReadiness 
        players={playerReadiness}
        onViewAll={onViewAllPlayers}
      />
    </div>
  );
}