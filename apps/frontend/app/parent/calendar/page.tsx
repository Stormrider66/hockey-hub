"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import CalendarView from '@/components/CalendarView';
import { useMemo } from 'react';

export default function ParentCalendarPage() {
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
        title: 'Game vs Northern Knights',
        start: `${today.toISOString().split('T')[0]}T19:00:00`,
        end: `${today.toISOString().split('T')[0]}T21:30:00`,
        type: 'game',
        description: 'Home game against Northern Knights'
      },
      {
        id: '3',
        title: 'Parent Meeting',
        start: `${tomorrow.toISOString().split('T')[0]}T18:00:00`,
        end: `${tomorrow.toISOString().split('T')[0]}T19:00:00`,
        type: 'meeting',
        description: 'Monthly parent meeting'
      },
      {
        id: '4',
        title: 'Team Travel',
        start: `${dayAfterTomorrow.toISOString().split('T')[0]}T08:00:00`,
        end: `${dayAfterTomorrow.toISOString().split('T')[0]}T20:00:00`,
        type: 'travel',
        description: 'Away game travel day'
      }
    ];
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader 
        title="Parent Calendar" 
        subtitle="Track your child's team schedule and events"
        role="parent"
      />
      
      <CalendarView events={mockEvents} />
    </div>
  );
} 