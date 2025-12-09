'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  View,
  SlotInfo,
  Event as BigCalendarEvent,
} from 'react-big-calendar';
import {
  format as dateFnsFormat,
  parse,
  startOfWeek as dateFnsStartOfWeek,
  getDay,
} from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/calendar.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useGetEventsByDateRangeQuery,
  useUpdateEventMutation,
  useCheckConflictsMutation 
} from '@/store/api/calendarApi';
import { CalendarEvent, EventType } from '@/store/api/calendarApi';
// Lazy load modals for better performance
import { createDynamicImport } from '@/utils/dynamicImports';

const EventDetailsModal = createDynamicImport(
  () => import('./EventDetailsModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }
);

const CreateEventModal = createDynamicImport(
  () => import('./CreateEventModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }
);
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { canViewEvent, UserPermissions } from '../utils/permissions';
import { LiveSessionDot } from './LiveSessionIndicator';
import { useCalendarLiveUpdates } from '../hooks/useCalendarLiveUpdates';
import { LiveEventComponent, LiveEventDetailComponent } from './LiveEventComponent';

const locales = {
  'en-US': enUS,
};

// Custom formats for the calendar
const formats = {
  dateFormat: 'dd',
  dayFormat: 'EEE dd',  // Short day name + date for week view
  weekdayFormat: 'EEEE', // Full day name for month view
  monthHeaderFormat: 'MMMM yyyy',
  dayHeaderFormat: 'EEEE, MMMM d',
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture: any, localizer: any) =>
    `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }, culture: any, localizer: any) =>
    `${localizer.format(start, 'MMMM d', culture)} - ${localizer.format(end, 'd, yyyy', culture)}`
};

const localizer = dateFnsLocalizer({
  format: dateFnsFormat,
  parse,
  startOfWeek: (date: Date) => dateFnsStartOfWeek(date, { weekStartsOn: 1 }), // 1 = Monday
  getDay,
  locales,
});

// Create the drag and drop calendar component
const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarViewProps {
  organizationId: string;
  teamId?: string;
  userId: string;
  userRole: string;
  onSlotSelect?: (slotInfo: { start: Date; end: Date }) => void;
}

// Map event types to colors
const eventTypeColors: Record<EventType, string> = {
  [EventType.TRAINING]: '#10b981', // green
  [EventType.GAME]: '#ef4444', // red
  [EventType.MEETING]: '#3b82f6', // blue
  [EventType.MEDICAL]: '#8b5cf6', // purple
  [EventType.EQUIPMENT]: '#f59e0b', // amber
  [EventType.TEAM_EVENT]: '#06b6d4', // cyan
  [EventType.PERSONAL]: '#6b7280', // gray
  [EventType.OTHER]: '#64748b', // slate
  [EventType.PRACTICE]: '#22c55e',
  [EventType.WORKOUT_SESSION]: '#0ea5e9',
};

// Helper function to get team name
const getTeamName = (teamId: string): string => {
  const teamNames: Record<string, string> = {
    'a-team': 'A-Team',
    'j20': 'J20',
    'u18': 'U18',
    'u16': 'U16',
    'womens': "Women's Team"
  };
  return teamNames[teamId] || 'Team';
};

interface CalendarEventWithStyle extends BigCalendarEvent {
  id: string;
  resource: CalendarEvent;
}

function CalendarView({
  organizationId,
  teamId,
  userId,
  userRole,
  onSlotSelect,
}: CalendarViewProps) {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  
  // Mutations for drag and drop
  const [updateEvent] = useUpdateEventMutation();
  const [checkConflicts] = useCheckConflictsMutation();
  
  // Live updates subscription
  const { isConnected } = useCalendarLiveUpdates({
    organizationId,
    teamId,
    userId,
    enabled: true,
  });

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    let start: Date;
    let end: Date;

    switch (view) {
      case 'month':
        start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
        end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
        break;
      case 'week':
        start = startOfWeek(date, { weekStartsOn: 1 });
        end = endOfWeek(date, { weekStartsOn: 1 });
        break;
      case 'day':
        start = new Date(date);
        start.setHours(0, 0, 0, 0);
        end = new Date(date);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start = startOfWeek(startOfMonth(date));
        end = endOfWeek(endOfMonth(date));
    }

    return { start, end };
  }, [date, view]);

  // Fetch events
  const { data: eventsData, isLoading } = useGetEventsByDateRangeQuery({
    organizationId,
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
    teamId: teamId || undefined,
  });

  // User permissions object
  const userPermissions: UserPermissions = useMemo(() => ({
    userId,
    role: userRole,
    teamIds: teamId ? [teamId] as string[] : [],
    organizationId,
  }), [userId, userRole, teamId, organizationId]);

  // Get unique teams from events
  const availableTeams = useMemo(() => {
    if (!eventsData) return [];
    const teams = new Set<string>();
    eventsData.forEach(event => {
      if (event.teamId) teams.add(event.teamId);
    });
    return Array.from(teams).sort();
  }, [eventsData]);

  // Transform and filter events for react-big-calendar
  const events: CalendarEventWithStyle[] = useMemo(() => {
    if (!eventsData || eventsData.length === 0) {
      return [];
    }

    return eventsData
      .filter(event => {
        // First check permissions
        if (!canViewEvent(event, userPermissions)) return false;
        
        // Then apply team filter
        if (selectedTeamFilter === 'all') return true;
        if (selectedTeamFilter === 'personal') return event.type === EventType.PERSONAL;
        if (selectedTeamFilter === 'no-team') return !event.teamId;
        return event.teamId === selectedTeamFilter;
      })
      .map((event) => {
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        const isAllDay = Boolean((event as any).allDay);
        const timeStr = isAllDay ? '' : ` (${format(startDate, 'HH:mm')})`;
        
        return {
          id: event.id,
          title: `${event.title}${timeStr}`,
          start: startDate,
          end: endDate,
          allDay: isAllDay,
          resource: event,
        };
      });
  }, [eventsData, userPermissions, selectedTeamFilter]);

  // Event style getter
  const eventStyleGetter = useCallback(
    (event: CalendarEventWithStyle) => {
      const resource: any = event.resource as any;
      const isTraining = resource?.metadata?.workoutId;
      const isLive = Boolean(resource?.isLive);
      const backgroundColor = resource?.color || eventTypeColors[(resource?.type as EventType) ?? EventType.OTHER];
      
      return {
        style: {
          backgroundColor,
          borderRadius: '4px',
          opacity: 0.9,
          color: 'white',
          border: isLive ? '3px solid #10b981' : isTraining ? '2px solid rgba(255, 255, 255, 0.5)' : '0px',
          display: 'block',
          fontWeight: isTraining || isLive ? 'bold' : 'normal',
          cursor: 'move',
          transition: 'all 0.2s ease',
          animation: isLive ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        },
        className: `draggable-event ${isLive ? 'live-event' : ''}`,
      };
    },
    []
  );

  // Handle slot selection
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    if (onSlotSelect) {
      // If a custom handler is provided, use that instead
      onSlotSelect({ start: slotInfo.start, end: slotInfo.end });
    } else {
      // Default behavior - open create modal
      setSelectedSlot(slotInfo);
      setIsCreateModalOpen(true);
    }
  }, [onSlotSelect]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEventWithStyle) => {
    setSelectedEvent(event.resource);
    setIsDetailsModalOpen(true);
  }, []);

  // Navigate calendar
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  // Change view
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Handle event drag and drop
  const handleEventDrop = useCallback(
    async ({ event, start, end }: { event: CalendarEventWithStyle; start: Date; end: Date }) => {
      try {
        // Check for conflicts first
        const conflictResult = await checkConflicts({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          participantIds: Array.isArray((event.resource as any).participants)
            ? ((event.resource as any).participants as any[])
                .map((p) => p.userId ?? p.participantId)
                .filter(Boolean)
            : [],
          excludeEventId: event.id,
        }).unwrap();

        if (conflictResult.hasConflict && conflictResult.conflictingEvents && conflictResult.conflictingEvents.length > 0) {
          const proceed = window.confirm(
            `This change will create ${conflictResult.conflictingEvents.length} conflict(s). Do you want to proceed?`
          );
          if (!proceed) return;
        }

        // Update the event
        await updateEvent({
          id: event.id,
          event: {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            createdBy: userId,
          },
        }).unwrap();

        // Show success feedback (could use a toast here)
        console.log('Event rescheduled successfully');
      } catch (error) {
        console.error('Failed to reschedule event:', error);
        // Show error feedback (could use a toast here)
        alert('Failed to reschedule event. Please try again.');
      }
    },
    [checkConflicts, updateEvent, userId]
  );

  // Handle event resize
  const handleEventResize = useCallback(
    async ({ event, start, end }: { event: CalendarEventWithStyle; start: Date; end: Date }) => {
      try {
        // Update the event duration
        await updateEvent({
          id: event.id,
          event: {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            createdBy: userId,
          },
        }).unwrap();

        console.log('Event duration updated successfully');
      } catch (error) {
        console.error('Failed to resize event:', error);
        alert('Failed to update event duration. Please try again.');
      }
    },
    [updateEvent, userId]
  );

  // Custom toolbar - Optimized single-line layout
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left side - Navigation and title */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('PREV')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('TODAY')}
              className="h-8 px-3"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('NEXT')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold px-2">{label}</h2>
        </div>
        
        {/* Right side - Actions and filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Team Filter - more compact */}
          <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="no-team">No Team</SelectItem>
              {availableTeams.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Teams</div>
                  {availableTeams.map(team => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          
          {/* View selector with icons */}
          <Select value={view} onValueChange={(value: View) => onView(value)}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">📅 Month</SelectItem>
              <SelectItem value="week">📊 Week (Time Grid)</SelectItem>
              <SelectItem value="day">📋 Day (Hourly)</SelectItem>
              <SelectItem value="agenda">📝 List</SelectItem>
            </SelectContent>
          </Select>
          
          {/* New Event button - smaller */}
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="h-8">
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <DragAndDropCalendar
            localizer={localizer}
            events={events}
            startAccessor={(e: any) => e.start}
            endAccessor={(e: any) => e.end}
            style={{ height: '100%' }}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(ev: any) => handleSelectEvent(ev as CalendarEventWithStyle)}
            selectable
            defaultView="month"
            view={view}
            onView={handleViewChange}
            date={date}
            onNavigate={handleNavigate}
            eventPropGetter={(ev: any, _s: any, _e: any, _sel: any) => eventStyleGetter(ev as CalendarEventWithStyle)}
            components={{
              toolbar: CustomToolbar,
              event: ({ event }: any) => {
                const isMonthView = view === 'month';
                if (isMonthView) {
                  return <LiveEventComponent event={event} title={event.title} />;
                }
                return <LiveEventDetailComponent event={event} title={event.title} />;
              },
            }}
            formats={formats}
            // Drag and drop props
            draggableAccessor={() => true}
            resizable
            onEventDrop={(args: any) => handleEventDrop(args as { event: CalendarEventWithStyle; start: Date; end: Date })}
            onEventResize={(args: any) => handleEventResize(args as { event: CalendarEventWithStyle; start: Date; end: Date })}
            // Layout props
            popup
            showMultiDayTimes={false}
            step={30}
            timeslots={2}
            views={['month', 'week', 'day', 'agenda']}
            // Optimize month layout to avoid overlaps
            dayLayoutAlgorithm="no-overlap"
            // Week/Day view settings
            min={new Date(0, 0, 0, 7, 0, 0)}
            max={new Date(0, 0, 0, 22, 0, 0)}
          />

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedEvent(null);
          }}
          userId={userId}
          userRole={userRole}
        />
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedSlot(null);
        }}
        organizationId={organizationId}
        teamId={teamId}
        userId={userId}
        userRole={userRole}
        initialSlot={selectedSlot}
      />
    </div>
  );
}

export { CalendarView };