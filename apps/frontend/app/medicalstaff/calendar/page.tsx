"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import CalendarView from '@/components/CalendarView';
import { useMemo } from 'react';

export default function MedicalStaffCalendarPage() {
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
        title: 'Medical Checkups',
        start: `${today.toISOString().split('T')[0]}T09:00:00`,
        end: `${today.toISOString().split('T')[0]}T12:00:00`,
        type: 'medical',
        description: 'Routine medical examinations for players'
      },
      {
        id: '2',
        title: 'Injury Assessment',
        start: `${today.toISOString().split('T')[0]}T14:00:00`,
        end: `${today.toISOString().split('T')[0]}T15:00:00`,
        type: 'medical',
        description: 'Evaluate player injury and treatment plan'
      },
      {
        id: '3',
        title: 'Rehabilitation Session',
        start: `${tomorrow.toISOString().split('T')[0]}T10:00:00`,
        end: `${tomorrow.toISOString().split('T')[0]}T11:30:00`,
        type: 'medical',
        description: 'Physical therapy and rehabilitation'
      },
      {
        id: '4',
        title: 'Concussion Protocol',
        start: `${dayAfterTomorrow.toISOString().split('T')[0]}T13:00:00`,
        end: `${dayAfterTomorrow.toISOString().split('T')[0]}T14:00:00`,
        type: 'medical',
        description: 'Concussion assessment and clearance'
      },
      {
        id: '5',
        title: 'Medical Clearance',
        start: `${nextWeek.toISOString().split('T')[0]}T11:00:00`,
        end: `${nextWeek.toISOString().split('T')[0]}T12:00:00`,
        type: 'medical',
        description: 'Return-to-play medical clearance'
      }
    ];
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader 
        title="Medical Staff Calendar" 
        subtitle="Manage medical appointments and player health"
        role="medicalstaff"
      />
      
      <CalendarView events={mockEvents} />
    </div>
  );
} 