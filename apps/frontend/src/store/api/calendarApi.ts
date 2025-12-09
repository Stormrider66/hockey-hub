import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from './mockBaseQuery';
import { 
  EventType, 
  EventVisibility, 
  EventStatus, 
  ParticipantStatus 
} from './types/calendar.types';

// Re-export for backward compatibility
export { EventType, EventVisibility, EventStatus, ParticipantStatus };

export interface EventParticipant {
  userId: string;
  role?: 'organizer' | 'attendee' | 'coach' | 'parent';
  type?: 'required' | 'optional';
}

export interface EventRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  endDate?: string;
  count?: number;
  weekDays?: number[];
  monthDays?: number[];
  months?: number[];
  exceptionDates?: string[];
}

export interface CreateEventDto {
  title: string;
  type: EventType;
  startTime: string;
  endTime: string;
  organizationId: string;
  createdBy: string;
  description?: string;
  location?: string;
  onlineUrl?: string;
  teamId?: string;
  visibility?: EventVisibility;
  participants?: EventParticipant[];
  metadata?: Record<string, any>;
  maxParticipants?: number;
  sendReminders?: boolean;
  reminderMinutes?: number[];
  recurrence?: EventRecurrence;
}

export interface Event extends CreateEventDto {
  id: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  participantCount?: number;
  resourceBookings?: any[];
  // Live session properties
  isLive?: boolean;
  currentProgress?: number; // 0-100 percentage
  activeParticipants?: number;
  currentActivity?: {
    type: 'exercise' | 'interval' | 'rest' | 'transition';
    name: string;
    timeRemaining?: number; // seconds
  };
  streamUrl?: string; // For future live video integration
}

// Type alias for CalendarEvent (used in components)
export type CalendarEvent = Event;

export interface EventConflict {
  hasConflict: boolean;
  conflictingEvents?: Event[];
  message?: string;
}

// API Definition
export const calendarApi = createApi({
  reducerPath: 'calendarApi',
  baseQuery: process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true' 
    ? mockBaseQuery
    : fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/calendar',
        prepareHeaders: (headers) => {
          const token = localStorage.getItem('access_token');
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return headers;
        },
      }),
  tagTypes: ['Event'],
  keepUnusedDataFor: 300, // 5 minutes default cache
  refetchOnMountOrArgChange: 30, // Refetch if older than 30 seconds
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    // Create event
    createEvent: builder.mutation<Event, CreateEventDto>({
      query: (event) => ({
        url: '/events',
        method: 'POST',
        body: event,
      }),
      invalidatesTags: ['Event'],
    }),

    // Get events
    getEvents: builder.query<{
      data: Event[];
      total: number;
      page: number;
      limit: number;
    }, {
      startDate?: string;
      endDate?: string;
      type?: EventType;
      teamId?: string;
      organizationId?: string;
      participantId?: string;
      page?: number;
      limit?: number;
    }>({
      query: (params) => ({
        url: '/events',
        params,
      }),
      providesTags: (result) => 
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Event' as const, id })),
              { type: 'Event', id: 'LIST' },
            ]
          : [{ type: 'Event', id: 'LIST' }],
      keepUnusedDataFor: 300, // 5 minutes cache
    }),

    // Get single event
    getEvent: builder.query<Event, string>({
      query: (id) => `/events/${id}`,
      providesTags: (result, error, id) => [{ type: 'Event', id }],
      keepUnusedDataFor: 600, // 10 minutes cache for individual events
    }),

    // Update event
    updateEvent: builder.mutation<Event, { id: string; event: Partial<CreateEventDto> }>({
      query: ({ id, event }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: event,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Event', id }, 'Event'],
    }),

    // Delete event
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Event'],
    }),

    // Check conflicts
    checkEventConflicts: builder.mutation<EventConflict, {
      startTime: string;
      endTime: string;
      participantIds: string[];
      excludeEventId?: string;
    }>({
      query: (data) => ({
        url: '/events/check-conflicts',
        method: 'POST',
        body: data,
      }),
    }),

    // Check conflicts (alias for CalendarView component)
    checkConflicts: builder.mutation<EventConflict, {
      startTime: string;
      endTime: string;
      participantIds: string[];
      excludeEventId?: string;
    }>({
      query: (data) => ({
        url: '/events/check-conflicts',
        method: 'POST',
        body: data,
      }),
    }),

    // Get events by date range
    getEventsByDateRange: builder.query<Event[], {
      startDate: string;
      endDate: string;
      teamId?: string;
      organizationId?: string;
      participantId?: string;
    }>({
      query: (params) => ({
        url: '/events/date-range',
        params,
      }),
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Event' as const, id })),
              { type: 'Event', id: 'LIST' },
            ]
          : [{ type: 'Event', id: 'LIST' }],
      keepUnusedDataFor: 180, // 3 minutes cache for date range queries
    }),

    // Get upcoming events
    getUpcomingEvents: builder.query<Event[], {
      userId?: string;
      teamId?: string;
      days?: number;
    }>({
      query: (params) => ({
        url: '/events/upcoming',
        params,
      }),
      keepUnusedDataFor: 120, // 2 minutes cache for upcoming events
      providesTags: ['Event'],
    }),

    // Create recurring event
    createRecurringEvent: builder.mutation<Event[], CreateEventDto>({
      query: (event) => ({
        url: '/events/recurring',
        method: 'POST',
        body: event,
      }),
      invalidatesTags: ['Event'],
    }),

    // Get user's teams (for team selection in event creation)
    getUserTeams: builder.query<Array<{
      id: string;
      name: string;
      organizationId: string;
    }>, string>({
      query: (userId) => ({
        url: `/users/${userId}/teams`,
        // This might need to go through user service instead
        baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api',
      }),
    }),

    // Update participant status
    updateParticipantStatus: builder.mutation<void, {
      eventId: string;
      participantId: string;
      status: ParticipantStatus;
    }>({
      query: ({ eventId, participantId, status }) => ({
        url: `/events/${eventId}/participants/${participantId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { eventId }) => [{ type: 'Event', id: eventId }, 'Event'],
    }),

    // Get calendar events (alias for player calendar view)
    getCalendarEvents: builder.query<Event[], {
      playerId?: string;
      includeTeamEvents?: boolean;
      includePersonal?: boolean;
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/events/calendar',
        params,
      }),
      providesTags: ['Event'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useCreateEventMutation,
  useGetEventsQuery,
  useGetEventQuery,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useCheckEventConflictsMutation,
  useCheckConflictsMutation,
  useGetEventsByDateRangeQuery,
  useGetUpcomingEventsQuery,
  useCreateRecurringEventMutation,
  useGetUserTeamsQuery,
  useUpdateParticipantStatusMutation,
  useGetCalendarEventsQuery,
} = calendarApi;