"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import CalendarView from '@/components/CalendarView';
import { useMemo } from 'react';

export default function ClubAdminCalendarPage() {
  // Generate dynamic mock events relative to today to prevent hydration mismatch
  const mockEvents = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    return [
      {
        id: '1',
        title: 'Board Meeting',
        start: `${today.toISOString().split('T')[0]}T09:00:00`,
        end: `${today.toISOString().split('T')[0]}T10:30:00`,
        type: 'meeting',
        description: 'Monthly board meeting'
      },
      {
        id: '2',
        title: 'Budget Planning Session',
        start: `${today.toISOString().split('T')[0]}T14:00:00`,
        end: `${today.toISOString().split('T')[0]}T16:00:00`,
        type: 'meeting',
        description: 'Annual budget planning for next season'
      },
      {
        id: '3',
        title: 'Facility Inspection',
        start: `${tomorrow.toISOString().split('T')[0]}T10:00:00`,
        end: `${tomorrow.toISOString().split('T')[0]}T12:00:00`,
        type: 'other',
        description: 'Annual facility safety inspection'
      },
      {
        id: '4',
        title: 'Sponsor Meeting',
        start: `${dayAfterTomorrow.toISOString().split('T')[0]}T13:00:00`,
        end: `${dayAfterTomorrow.toISOString().split('T')[0]}T14:30:00`,
        type: 'meeting',
        description: 'Meeting with potential new sponsors'
      },
      {
        id: '5',
        title: 'Team Registration Deadline',
        start: `${nextWeek.toISOString().split('T')[0]}T23:59:00`,
        end: `${nextWeek.toISOString().split('T')[0]}T23:59:00`,
        type: 'other',
        description: 'Final deadline for team registrations'
      }
    ];
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader 
        title="Club Admin Calendar" 
        subtitle="Manage club events and administrative schedule"
        role="clubadmin"
      />
      
      <CalendarView events={mockEvents} />
    </div>
  );
} 