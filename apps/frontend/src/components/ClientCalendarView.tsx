'use client';

import React, { useState } from 'react';
import { useGetEventsQuery } from '@/features/calendar/calendarApi';
import CalendarView, { InputEvent as CalInputEvent } from '@/components/CalendarView';
import CreateEventModal from '@/features/calendar/CreateEventModal';

export default function ClientCalendarView() {
  const { data: events = [] } = useGetEventsQuery();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Map API events into CalendarView InputEvent type
  const calendarEvents: CalInputEvent[] = events.map(evt => ({
    id: String((evt as any).id),
    title: (evt as any).title,
    start: (evt as any).start,
    end: (evt as any).end,
    type: (evt as any).type,
    description: (evt as any).description,
  } as CalInputEvent));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Din Kalender</h2>
        <CreateEventModal defaultDate={selectedDate} />
      </div>
      <CalendarView events={calendarEvents} />
    </div>
  );
} 