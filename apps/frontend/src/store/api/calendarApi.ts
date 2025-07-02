import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Types
export enum EventType {
  TRAINING = 'training',
  GAME = 'game',
  MEETING = 'meeting',
  MEDICAL = 'medical',
  EQUIPMENT = 'equipment',
  TEAM_EVENT = 'team_event',
  PERSONAL = 'personal',
  OTHER = 'other'
}

export enum EventVisibility {
  PUBLIC = 'public',
  TEAM = 'team',
  PRIVATE = 'private',
  ROLE_BASED = 'role_based'
}

export enum EventStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

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
}

export interface EventConflict {
  hasConflict: boolean;
  conflictingEvents?: Event[];
  message?: string;
}

// API Definition
export const calendarApi = createApi({
  reducerPath: 'calendarApi',
  baseQuery: fetchBaseQuery({
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
      providesTags: ['Event'],
    }),

    // Get single event
    getEvent: builder.query<Event, string>({
      query: (id) => `/events/${id}`,
      providesTags: (result, error, id) => [{ type: 'Event', id }],
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
  useGetUpcomingEventsQuery,
  useCreateRecurringEventMutation,
  useGetUserTeamsQuery,
} = calendarApi;