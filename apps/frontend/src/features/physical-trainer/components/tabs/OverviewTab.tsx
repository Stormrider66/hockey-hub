'use client';

import React, { Suspense } from 'react';
import QuickStats from './overview/QuickStats';
// import TodaysSessions from './overview/TodaysSessions'; // Replaced with unified schedule
import { TodaysSchedule } from '@/features/schedule/components';
import PlayerReadiness from './overview/PlayerReadiness';
import TeamRoster from './overview/TeamRoster';
import CalendarWidgetSkeleton from './overview/CalendarWidgetSkeleton';
import type { WorkoutSession, PlayerReadiness as PlayerReadinessType, TodaySession } from '../../types';
import { useAuth } from "@/contexts/AuthContext";

// Lazy load CalendarWidget to improve LCP
const CalendarWidget = React.lazy(() => import('@/features/calendar/components/CalendarWidget'));

interface OverviewTabProps {
  selectedTeamId: string | null;
  todaysSessions: TodaySession[];
  playerReadiness: PlayerReadinessType[];
  players?: any[];
  onCreateSession: () => void;
  onLaunchSession: (session: TodaySession) => void;
  onViewAllPlayers?: () => void;
}

export default function OverviewTab({
  selectedTeamId,
  todaysSessions,
  playerReadiness,
  players = [],
  onCreateSession,
  onLaunchSession,
  onViewAllPlayers
}: OverviewTabProps) {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);
  
  // Convert schedule event to today session format for TeamRoster
  const selectedSession = React.useMemo(() => {
    if (!selectedEvent) return null;
    
    return {
      id: selectedEvent.id,
      time: new Date(selectedEvent.startTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      type: selectedEvent.metadata?.workoutType || selectedEvent.subType || 'Training',
      team: selectedEvent.title?.split(' ')[0] || 'Team',
      location: selectedEvent.location || 'Training Center',
      participants: selectedEvent.participants || [],
      status: selectedEvent.status
    } as TodaySession;
  }, [selectedEvent]);
  
  return (
    <div className="space-y-6">
      <QuickStats todaysSessions={todaysSessions} playerReadiness={playerReadiness} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodaysSchedule 
          role="physicalTrainer"
          filterByTeam={selectedTeamId === 'personal' ? undefined : (selectedTeamId || undefined)}
          filterByPlayer={selectedTeamId === 'personal' ? user?.id : undefined}
          onEventSelect={setSelectedEvent}
          selectedEventId={selectedEvent?.id}
        />
        
        <TeamRoster 
          players={players}
          onViewAll={onViewAllPlayers}
          selectedSession={selectedSession}
        />
      </div>
      
      <Suspense fallback={<CalendarWidgetSkeleton />}>
        <CalendarWidget 
          organizationId={user?.organizationId || ''} 
          userId={user?.id || ''}
          teamId={selectedTeamId === 'all' || selectedTeamId === 'personal' ? undefined : selectedTeamId || undefined}
          days={7}
        />
      </Suspense>
      
      <PlayerReadiness 
        players={playerReadiness}
        onViewAll={onViewAllPlayers}
      />
    </div>
  );
}