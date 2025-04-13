import * as React from 'react';
import { Calendar, dateFnsLocalizer, Event, View } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import { sv } from 'date-fns/locale/sv';

// Import the default CSS for react-big-calendar
// We will override/supplement this with Tailwind later
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer
const locales = {
  'en-US': enUS,
  sv: sv,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface HockeyEvent extends Event {
  // Add any custom event properties here if needed later
  eventType?: string;
  location?: string;
}

interface CalendarViewProps {
  events: HockeyEvent[];
  defaultView?: View;
  onSelectEvent?: (event: HockeyEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[] | string[]; action: 'select' | 'click' | 'doubleClick' }) => void;
}

export function CalendarView({ 
  events, 
  defaultView = 'month', 
  onSelectEvent, 
  onSelectSlot 
}: CalendarViewProps) {
  // TODO: Integrate with preferencesSlice for locale
  const currentLocale = 'en-US'; // Hardcoded for now

  return (
    <div className="h-[700px] bg-white p-4 rounded-lg shadow">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={defaultView}
        culture={currentLocale}
        style={{ height: '100%' }}
        onSelectEvent={onSelectEvent} // Handle event click
        onSelectSlot={onSelectSlot}   // Handle clicking/dragging on empty slots
        selectable // Allows selecting slots
        // We will add custom components (Toolbar, Event) later
      />
    </div>
  );
} 