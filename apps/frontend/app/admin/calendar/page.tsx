"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import CalendarView from '@/components/CalendarView';
import { useMemo } from 'react';

export default function AdminCalendarPage() {
  // Generate dynamic mock events relative to today to prevent hydration mismatch
  const mockEvents = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

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
        title: 'Budget Review',
        start: `${today.toISOString().split('T')[0]}T14:00:00`,
        end: `${today.toISOString().split('T')[0]}T15:30:00`,
        type: 'meeting',
        description: 'Quarterly budget review session'
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
        title: 'Staff Meeting',
        start: `${dayAfterTomorrow.toISOString().split('T')[0]}T08:00:00`,
        end: `${dayAfterTomorrow.toISOString().split('T')[0]}T09:00:00`,
        type: 'meeting',
        description: 'Weekly staff coordination meeting'
      }
    ];
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader 
        title="Admin Calendar" 
        subtitle="Manage organizational schedule and meetings"
        role="admin"
      />
      
      <CalendarView events={mockEvents} />
    </div>
  );
} 