'use client';

import React from 'react';
import CalendarView from '@/features/calendar/components/CalendarView';

export default function CalendarPage() {
  // TODO: Get these from auth context
  const organizationId = 'org-123';
  const teamId = 'team-456';
  const userId = 'user-789';
  const userRole = 'player';

  return (
    <div className="container mx-auto py-6 h-screen">
      <CalendarView
        organizationId={organizationId}
        teamId={teamId}
        userId={userId}
        userRole={userRole}
      />
    </div>
  );
}