'use client';

import React, { useState, useCallback } from 'react';
import { 
  Calendar as BigCalendar, // Import with an alias
  dateFnsLocalizer, 
  Views, 
  EventProps, 
  CalendarProps 
} from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { sv } from 'date-fns/locale'; // Import Swedish locale
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Dumbbell, Users, Plane, ClipboardList, HeartPulse, Footprints } from 'lucide-react'; // Example icons

// Define event types based on workflow rules
type EventType = 'ice_training' | 'physical_training' | 'game' | 'rehab_medical' | 'meeting' | 'travel' | 'other';

// Match event types to colors and icons based on ui-design-guidelines.mdc
const eventStyleMap: Record<EventType, { className: string; Icon: LucideIcon }> = {
  ice_training: { className: 'bg-blue-100 text-blue-800 border-blue-300', Icon: Footprints }, // Placeholder icon
  physical_training: { className: 'bg-green-100 text-green-800 border-green-300', Icon: Dumbbell },
  game: { className: 'bg-red-100 text-red-800 border-red-300', Icon: ClipboardList }, // Placeholder icon
  rehab_medical: { className: 'bg-amber-100 text-amber-800 border-amber-300', Icon: HeartPulse },
  meeting: { className: 'bg-purple-100 text-purple-800 border-purple-300', Icon: Users },
  travel: { className: 'bg-indigo-100 text-indigo-800 border-indigo-300', Icon: Plane },
  other: { className: 'bg-gray-100 text-gray-800 border-gray-300', Icon: ClipboardList }, // Placeholder icon
};

// Input prop type matching the data fetched in page.tsx
export interface InputEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 date string
  end: string;   // ISO 8601 date string
  type: string; 
  description?: string;
}

// react-big-calendar event format
interface CalendarDisplayEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: { // Store original type and description for custom rendering
    type: EventType;
    description?: string;
  };
}

interface CalendarViewProps {
  events: InputEvent[];
}

// Configure the localizer using date-fns
const locales = {
  'sv': sv, 
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: sv }), // Start week on Monday
  getDay,
  locales,
});

// Define Calendar as a typed functional component
const Calendar = BigCalendar as React.ComponentType<CalendarProps<CalendarDisplayEvent>>;

// Custom Event component for styling
const CustomEvent: React.FC<EventProps<CalendarDisplayEvent>> = ({ event }) => {
  const style = eventStyleMap[event.resource.type] || eventStyleMap.other;
  const Icon = style.Icon;
  return (
    <div className={`p-1 rounded-sm text-xs flex items-center gap-1 border ${style.className}`}>
      <Icon size={12} />
      <span>{event.title}</span>
    </div>
  );
};

export default function CalendarView({ events: inputEvents }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarProps['view']>(Views.MONTH);

  // Memoize the formatted events to avoid re-computation on every render
  const formattedEvents = React.useMemo(() => {
    return inputEvents.map((event): CalendarDisplayEvent => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      resource: {
        type: event.type as EventType, // Add type assertion
        description: event.description,
      },
    }));
  }, [inputEvents]);

  // Filter events for the selected date
  const eventsForSelectedDate = React.useMemo(() => {
    return formattedEvents.filter(event => 
      format(event.start, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );
  }, [formattedEvents, selectedDate]);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setSelectedDate(start);
    setView(Views.DAY); // Optionally switch to day view on slot select
  }, []);

  const handleSelectEvent = useCallback((event: CalendarDisplayEvent) => {
    setSelectedDate(event.start);
    // Potentially open a modal or navigate to event details
    console.log('Selected event:', event);
  }, []);
  
  const handleNavigate = useCallback((newDate: Date) => {
      setSelectedDate(newDate);
  }, []);

  const eventPropGetter = useCallback(
    (event: CalendarDisplayEvent) => ({
      className: `${(eventStyleMap[event.resource.type] || eventStyleMap.other).className} border p-0.5 text-xs`,
      // style: {
      //   backgroundColor: (eventStyleMap[event.resource.type] || eventStyleMap.other).bgColor,
      // },
    }),
    []
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
            <CardHeader>
                 {/* Simple Toolbar - Can be replaced with CustomToolbar later */}
                <div className="flex justify-between items-center mb-4">
                    <CardTitle>Din Kalender</CardTitle>
                    {/* Basic navigation could go here */}
                </div>
            </CardHeader>
          <CardContent style={{ height: '70vh' }}> { /* Set explicit height */ }
            <Calendar
              localizer={localizer}
              events={formattedEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }} // Fill the container
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              view={view}
              onView={(newView) => setView(newView)}
              date={selectedDate}
              onNavigate={handleNavigate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable // Allow selecting time slots
              culture='sv' // Set culture to Swedish
              messages={{
                  today: 'Idag',
                  previous: 'Föregående',
                  next: 'Nästa',
                  month: 'Månad',
                  week: 'Vecka',
                  day: 'Dag',
                  agenda: 'Agenda',
                  date: 'Datum',
                  time: 'Tid',
                  event: 'Händelse',
                  showMore: total => `+ ${total} till`,
              }}
              components={{
                  event: CustomEvent, // Use custom component for event rendering
              }}
             // eventPropGetter={eventPropGetter} // Optional: Apply styles directly if needed
            />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Händelser för {format(selectedDate, 'yyyy-MM-dd', { locale: sv })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventsForSelectedDate.length > 0 ? (
              eventsForSelectedDate.map(event => {
                const style = eventStyleMap[event.resource.type] || eventStyleMap.other;
                const Icon = style.Icon;
                return (
                  <div key={event.id} className={`p-3 rounded-md border flex items-start gap-3 ${style.className}`}>
                    <Icon className="mt-1 h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm opacity-80">
                        {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                      </p>
                      {event.resource.description && (
                        <p className="text-xs mt-1 opacity-70">{event.resource.description}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="ml-auto bg-white hover:bg-gray-50 border-current">Visa</Button>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground italic">Inga händelser för valt datum.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 