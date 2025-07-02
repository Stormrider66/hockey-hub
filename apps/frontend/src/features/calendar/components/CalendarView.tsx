'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  View,
  SlotInfo,
  Event as BigCalendarEvent,
  EventInteractionArgs,
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
import { Card } from '@/components/ui/card';
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
import EventDetailsModal from './EventDetailsModal';
import CreateEventModal from './CreateEventModal';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { canViewEvent, UserPermissions } from '../utils/permissions';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format: dateFnsFormat,
  parse,
  startOfWeek: dateFnsStartOfWeek,
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
};

interface CalendarEventWithStyle extends BigCalendarEvent {
  id: string;
  resource: CalendarEvent;
}

export default function CalendarView({
  organizationId,
  teamId,
  userId,
  userRole,
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

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    let start: Date;
    let end: Date;

    switch (view) {
      case 'month':
        start = startOfWeek(startOfMonth(date));
        end = endOfWeek(endOfMonth(date));
        break;
      case 'week':
        start = startOfWeek(date);
        end = endOfWeek(date);
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
  });

  // User permissions object
  const userPermissions: UserPermissions = useMemo(() => ({
    userId,
    role: userRole,
    teamIds: [teamId].filter(Boolean),
    organizationId,
  }), [userId, userRole, teamId, organizationId]);

  // Get unique teams from events
  const availableTeams = useMemo(() => {
    if (!eventsData?.data) return [];
    const teams = new Set<string>();
    eventsData.data.forEach(event => {
      if (event.teamId) teams.add(event.teamId);
    });
    return Array.from(teams).sort();
  }, [eventsData]);

  // Transform and filter events for react-big-calendar
  const events: CalendarEventWithStyle[] = useMemo(() => {
    if (!eventsData?.data) return [];

    return eventsData.data
      .filter(event => {
        // First check permissions
        if (!canViewEvent(event, userPermissions)) return false;
        
        // Then apply team filter
        if (selectedTeamFilter === 'all') return true;
        if (selectedTeamFilter === 'personal') return event.type === EventType.PERSONAL;
        if (selectedTeamFilter === 'no-team') return !event.teamId;
        return event.teamId === selectedTeamFilter;
      })
      .map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        allDay: event.allDay,
        resource: event,
      }));
  }, [eventsData, userPermissions, selectedTeamFilter]);

  // Event style getter
  const eventStyleGetter = useCallback(
    (event: CalendarEventWithStyle) => {
      const isTraining = event.resource.metadata?.workoutId;
      const backgroundColor = event.resource.color || eventTypeColors[event.resource.type];
      
      return {
        style: {
          backgroundColor,
          borderRadius: '4px',
          opacity: 0.9,
          color: 'white',
          border: isTraining ? '2px solid rgba(255, 255, 255, 0.5)' : '0px',
          display: 'block',
          fontWeight: isTraining ? 'bold' : 'normal',
          cursor: 'move',
          transition: 'all 0.2s ease',
        },
        className: 'draggable-event',
      };
    },
    []
  );

  // Handle slot selection
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    setIsCreateModalOpen(true);
  }, []);

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
    async ({ event, start, end }: EventInteractionArgs<CalendarEventWithStyle>) => {
      try {
        // Check for conflicts first
        const conflictResult = await checkConflicts({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          participantIds: event.resource.participants.map(p => p.participantId),
          excludeEventId: event.id,
        }).unwrap();

        if (conflictResult.hasConflicts && conflictResult.conflicts.length > 0) {
          const proceed = window.confirm(
            `This change will create ${conflictResult.conflicts.length} conflict(s). Do you want to proceed?`
          );
          if (!proceed) return;
        }

        // Update the event
        await updateEvent({
          id: event.id,
          data: {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            updatedBy: userId,
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
    async ({ event, start, end }: EventInteractionArgs<CalendarEventWithStyle>) => {
      try {
        // Update the event duration
        await updateEvent({
          id: event.id,
          data: {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            updatedBy: userId,
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

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('PREV')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('TODAY')}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('NEXT')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold">{label}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(value: View) => onView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>
      
      {/* Team Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by team:</span>
        <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="personal">Personal Only</SelectItem>
            <SelectItem value="no-team">No Team Assigned</SelectItem>
            {availableTeams.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Teams</div>
                {availableTeams.map(team => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        {selectedTeamFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTeamFilter('all')}
          >
            Clear filter
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <Card className="p-6 h-full">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>

        <div className="h-[calc(100%-4rem)]">
          <DragAndDropCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            view={view}
            onView={handleViewChange}
            date={date}
            onNavigate={handleNavigate}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar,
            }}
            formats={{
              dayFormat: 'ddd MM/DD',
              weekdayFormat: 'ddd',
              dayHeaderFormat: 'dddd MMM DD',
              monthHeaderFormat: 'MMMM YYYY',
            }}
            // Drag and drop props
            draggableAccessor={() => true}
            resizable
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
          />
        </div>
      </Card>

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