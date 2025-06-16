"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import CalendarView from '@/components/CalendarView';
import { useMemo } from 'react';

export default function PlayerCalendarPage() {
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
        title: 'Physical Training',
        start: `${today.toISOString().split('T')[0]}T16:00:00`,
        end: `${today.toISOString().split('T')[0]}T17:30:00`,
        type: 'physical_training',
        description: 'Strength and conditioning'
      },
      {
        id: '3',
        title: 'Game vs Northern Knights',
        start: `${tomorrow.toISOString().split('T')[0]}T19:00:00`,
        end: `${tomorrow.toISOString().split('T')[0]}T21:30:00`,
        type: 'game',
        description: 'Home game against Northern Knights'
      },
      {
        id: '4',
        title: 'Medical Checkup',
        start: `${dayAfterTomorrow.toISOString().split('T')[0]}T10:00:00`,
        end: `${dayAfterTomorrow.toISOString().split('T')[0]}T10:30:00`,
        type: 'medical',
        description: 'Routine medical examination'
      }
    ];
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader 
        title="Player Calendar" 
        subtitle="Your training schedule and team events"
        role="player"
      />
      
      <CalendarView events={mockEvents} />
    </div>
  );
} 