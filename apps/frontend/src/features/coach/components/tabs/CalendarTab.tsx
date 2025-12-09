'use client';

import React from 'react';
import IceCoachCalendarView from '../IceCoachCalendarView';

interface CalendarTabProps {
  selectedTeamId: string | null;
}

export function CalendarTab({ selectedTeamId }: CalendarTabProps) {
  return (
    <IceCoachCalendarView
      organizationId="org-123"
      userId="coach-123"
      teamId={selectedTeamId}
    />
  );
}

export default CalendarTab;



