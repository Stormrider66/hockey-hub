'use client';

import React from 'react';
import CalendarWidget from '@/features/calendar/components/CalendarWidget';
import QuickStats from './overview/QuickStats';
import TodaysSessions from './overview/TodaysSessions';
import PlayerReadiness from './overview/PlayerReadiness';
import type { WorkoutSession, PlayerReadiness as PlayerReadinessType, TodaySession } from '../../types';

interface OverviewTabProps {
  todaysSessions: TodaySession[];
  playerReadiness: PlayerReadinessType[];
  onCreateSession: () => void;
  onLaunchSession: (session: TodaySession) => void;
  onViewAllPlayers?: () => void;
}

export default function OverviewTab({
  todaysSessions,
  playerReadiness,
  onCreateSession,
  onLaunchSession,
  onViewAllPlayers
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <QuickStats todaysSessions={todaysSessions} />
      
      <TodaysSessions 
        sessions={todaysSessions}
        onCreateNew={onCreateSession}
        onLaunchSession={onLaunchSession}
      />
      
      <CalendarWidget 
        organizationId="org-123" 
        userId="trainer-123"
        days={7}
      />
      
      <PlayerReadiness 
        players={playerReadiness}
        onViewAll={onViewAllPlayers}
      />
    </div>
  );
}