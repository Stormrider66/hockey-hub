import { apiSlice } from '@/store/api/apiSlice';

export interface CalendarEventDto {
  id?: string;
  title: string;
  start: string; // ISO string
  end: string;
  type: string;
  description?: string;
}

export const calendarApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query<CalendarEventDto[], void>({
      query: () => `/events`,
      providesTags: ['Event'],
    }),
    createEvent: builder.mutation<CalendarEventDto, Omit<CalendarEventDto, 'id'>>({
      query: (body) => ({
        url: `/events`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Event'],
    }),
  }),
});

export const { useGetEventsQuery, useCreateEventMutation } = calendarApi; 