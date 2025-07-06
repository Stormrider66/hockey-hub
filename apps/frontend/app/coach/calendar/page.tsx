"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { CalendarPageWrapper } from '@/features/calendar/CalendarPageWrapper';
import { useTranslation } from '@hockey-hub/translations';

export default function CoachCalendarPage() {
  const { t } = useTranslation(['coach', 'common']);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title={t('common:navigation.calendar')}
        subtitle={t('coach:calendar.subtitle', 'Manage team schedule and events')}
        role="coach"
      />
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-12rem)]">
          <CalendarPageWrapper />
        </div>
      </div>
    </div>
  );
}