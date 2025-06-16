"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import CalendarView from '@/components/CalendarView';
import { useMemo } from 'react';

export default function EquipmentManagerCalendarPage() {
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
        title: 'Equipment Delivery',
        start: `${today.toISOString().split('T')[0]}T10:00:00`,
        end: `${today.toISOString().split('T')[0]}T11:00:00`,
        type: 'other',
        description: 'New helmet shipment arrival'
      },
      {
        id: '2',
        title: 'Skate Maintenance',
        start: `${today.toISOString().split('T')[0]}T14:00:00`,
        end: `${today.toISOString().split('T')[0]}T16:00:00`,
        type: 'other',
        description: 'Skate sharpening and maintenance session'
      },
      {
        id: '3',
        title: 'Inventory Audit',
        start: `${tomorrow.toISOString().split('T')[0]}T09:00:00`,
        end: `${tomorrow.toISOString().split('T')[0]}T12:00:00`,
        type: 'other',
        description: 'Monthly equipment inventory check'
      },
      {
        id: '4',
        title: 'Equipment Fitting',
        start: `${dayAfterTomorrow.toISOString().split('T')[0]}T15:00:00`,
        end: `${dayAfterTomorrow.toISOString().split('T')[0]}T17:00:00`,
        type: 'other',
        description: 'New player equipment fitting session'
      },
      {
        id: '5',
        title: 'Gear Inspection',
        start: `${nextWeek.toISOString().split('T')[0]}T13:00:00`,
        end: `${nextWeek.toISOString().split('T')[0]}T15:00:00`,
        type: 'other',
        description: 'Safety inspection of protective gear'
      }
    ];
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader 
        title="Equipment Manager Calendar" 
        subtitle="Manage equipment deliveries and maintenance schedule"
        role="equipmentmanager"
      />
      
      <CalendarView events={mockEvents} />
    </div>
  );
} 