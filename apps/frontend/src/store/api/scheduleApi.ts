import { createApi } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from './mockBaseQuery';
import { 
  ScheduleEvent, 
  UpdateEventDto, 
  LaunchEventDto, 
  LaunchResponse 
} from '@/features/schedule/types';

interface GetScheduleParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  playerId?: string;
  teamId?: string;
  role?: string;
}

export const scheduleApi = createApi({
  reducerPath: 'scheduleApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['Schedule', 'Event'],
  endpoints: (builder) => ({
    getTodaySchedule: builder.query<ScheduleEvent[], GetScheduleParams>({
      query: (params) => ({
        url: '/schedule/today',
        params
      }),
      providesTags: ['Schedule']
    }),
    
    getWeekSchedule: builder.query<ScheduleEvent[], GetScheduleParams>({
      query: (params) => ({
        url: '/schedule/week',
        params
      }),
      providesTags: ['Schedule']
    }),
    
    getEvent: builder.query<ScheduleEvent, string>({
      query: (id) => `/schedule/event/${id}`,
      providesTags: (result, error, id) => [{ type: 'Event', id }]
    }),
    
    createEvent: builder.mutation<ScheduleEvent, Partial<ScheduleEvent>>({
      query: (data) => ({
        url: '/schedule/event',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Schedule']
    }),
    
    updateEvent: builder.mutation<ScheduleEvent, UpdateEventDto>({
      query: ({ id, ...data }) => ({
        url: `/schedule/event/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Event', id },
        'Schedule'
      ]
    }),
    
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/schedule/event/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Event', id },
        'Schedule'
      ]
    }),
    
    launchEvent: builder.mutation<LaunchResponse, LaunchEventDto>({
      query: (data) => ({
        url: `/schedule/event/${data.id}/launch`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Event', id },
        'Schedule'
      ]
    }),
    
    cancelEvent: builder.mutation<ScheduleEvent, string>({
      query: (id) => ({
        url: `/schedule/event/${id}/cancel`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Event', id },
        'Schedule'
      ]
    }),
    
    duplicateEvent: builder.mutation<ScheduleEvent, string>({
      query: (id) => ({
        url: `/schedule/event/${id}/duplicate`,
        method: 'POST'
      }),
      invalidatesTags: ['Schedule']
    }),
    
    // Get events for a specific player
    getPlayerSchedule: builder.query<ScheduleEvent[], { playerId: string; date?: string }>({
      query: ({ playerId, date }) => ({
        url: `/schedule/player/${playerId}`,
        params: { date }
      }),
      providesTags: ['Schedule']
    }),
    
    // Get events for a specific team
    getTeamSchedule: builder.query<ScheduleEvent[], { teamId: string; date?: string }>({
      query: ({ teamId, date }) => ({
        url: `/schedule/team/${teamId}`,
        params: { date }
      }),
      providesTags: ['Schedule']
    }),
    
    // Get upcoming events (next 7 days)
    getUpcomingEvents: builder.query<ScheduleEvent[], void>({
      query: () => '/schedule/upcoming',
      providesTags: ['Schedule']
    }),
    
    // Batch operations
    batchCreateEvents: builder.mutation<ScheduleEvent[], Partial<ScheduleEvent>[]>({
      query: (events) => ({
        url: '/schedule/batch',
        method: 'POST',
        body: { events }
      }),
      invalidatesTags: ['Schedule']
    }),
    
    batchUpdateEvents: builder.mutation<ScheduleEvent[], UpdateEventDto[]>({
      query: (updates) => ({
        url: '/schedule/batch',
        method: 'PATCH',
        body: { updates }
      }),
      invalidatesTags: ['Schedule']
    }),
  })
});

export const {
  useGetTodayScheduleQuery,
  useGetWeekScheduleQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useLaunchEventMutation,
  useCancelEventMutation,
  useDuplicateEventMutation,
  useGetPlayerScheduleQuery,
  useGetTeamScheduleQuery,
  useGetUpcomingEventsQuery,
  useBatchCreateEventsMutation,
  useBatchUpdateEventsMutation,
} = scheduleApi;