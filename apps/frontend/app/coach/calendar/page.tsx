"use client";

import { DashboardHeader } from "@/components/shared/DashboardHeader";
import CalendarView from '@/components/CalendarView';
import { useMemo } from 'react';

export default function CoachCalendarPage() {
  // Generate dynamic mock events relative to today to prevent hydration mismatch
  const mockEvents = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    return [
      {
        id: '1',
        title: 'Team Practice',
        start: `${today.toISOString().split('T')[0]}T06:00:00`,
        end: `${today.toISOString().split('T')[0]}T07:30:00`,
        type: 'ice_training',
        description: 'Morning ice training session'
      },
      {
        id: '2',
        title: 'Video Analysis',
        start: `${today.toISOString().split('T')[0]}T10:00:00`,
        end: `${today.toISOString().split('T')[0]}T11:00:00`,
        type: 'meeting',
        description: 'Review game footage with team'
      },
      {
        id: '3',
        title: 'Game vs Northern Knights',
        start: `${today.toISOString().split('T')[0]}T19:00:00`,
        end: `${today.toISOString().split('T')[0]}T21:30:00`,
        type: 'game',
        description: 'Home game against Northern Knights'
      },
      {
        id: '4',
        title: 'Physical Training',
        start: `${tomorrow.toISOString().split('T')[0]}T08:00:00`,
        end: `${tomorrow.toISOString().split('T')[0]}T09:30:00`,
        type: 'physical_training',
        description: 'Strength and conditioning session'
      }
    ];
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader 
        title="Coach Calendar" 
        subtitle="Manage team schedule and training sessions"
        role="coach"
      />
      
      <CalendarView events={mockEvents} />
    </div>
  );
} 