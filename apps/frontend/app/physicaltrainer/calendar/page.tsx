"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import CalendarView from '@/components/CalendarView';
import { useMemo } from 'react';

export default function PhysicalTrainerCalendarPage() {
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
        title: 'Conditioning Session',
        start: `${today.toISOString().split('T')[0]}T08:00:00`,
        end: `${today.toISOString().split('T')[0]}T09:30:00`,
        type: 'physical_training',
        description: 'Team conditioning and strength training'
      },
      {
        id: '2',
        title: 'Injury Prevention Workshop',
        start: `${today.toISOString().split('T')[0]}T14:00:00`,
        end: `${today.toISOString().split('T')[0]}T15:30:00`,
        type: 'meeting',
        description: 'Injury prevention education for players'
      },
      {
        id: '3',
        title: 'Power Training',
        start: `${tomorrow.toISOString().split('T')[0]}T07:00:00`,
        end: `${tomorrow.toISOString().split('T')[0]}T08:30:00`,
        type: 'physical_training',
        description: 'Explosive power and agility training'
      },
      {
        id: '4',
        title: 'Fitness Assessment',
        start: `${dayAfterTomorrow.toISOString().split('T')[0]}T10:00:00`,
        end: `${dayAfterTomorrow.toISOString().split('T')[0]}T12:00:00`,
        type: 'other',
        description: 'Individual player fitness evaluations'
      },
      {
        id: '5',
        title: 'Recovery Session',
        start: `${nextWeek.toISOString().split('T')[0]}T16:00:00`,
        end: `${nextWeek.toISOString().split('T')[0]}T17:00:00`,
        type: 'physical_training',
        description: 'Active recovery and mobility work'
      }
    ];
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader 
        title="Physical Trainer Calendar" 
        subtitle="Manage training sessions and fitness programs"
        role="physicaltrainer"
      />
      
      <CalendarView events={mockEvents} />
    </div>
  );
} 