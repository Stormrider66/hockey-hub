"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { PlayerCalendarView } from '@/features/player/PlayerCalendarView';

export default function PlayerCalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="My Calendar"
        subtitle="View and manage your schedule, training sessions, and events"
        role="player"
      />
      <div className="container mx-auto px-4 pb-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <PlayerCalendarView />
        </div>
      </div>
    </div>
  );
}