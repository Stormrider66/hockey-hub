'use client';

import React from 'react';
import TrainerCalendarView from '../TrainerCalendarView';

interface CalendarTabProps {
  organizationId: string;
  userId: string;
  teamId?: string;
}

export default function CalendarTab({ organizationId, userId, teamId }: CalendarTabProps) {
  return (
    <div className="h-[calc(100vh-16rem)]">
      <TrainerCalendarView
        organizationId={organizationId}
        userId={userId}
        teamId={teamId}
      />
    </div>
  );
}