import { apiSlice } from './apiSlice';
import { EndpointBuilder } from '@reduxjs/toolkit/query/react'; 

// TODO: Define these types based on the actual backend API structure
// These should likely be moved to a shared types directory (e.g., /packages/types)
interface Event { id: string; title: string; startTime: string; endTime: string; eventTypeId: string; locationId?: string; status: string; }
interface Resource { id: string; name: string; }
interface Location { id: string; name: string; }
interface EventParticipant { id: string; userId: string; eventId: string; }

// Define type for the builder argument using the types from apiSlice
type BuilderType = EndpointBuilder<any, string, string>; // Using 'any' for BaseQuery as a workaround for now

export const calendarApi = apiSlice.injectEndpoints({
  endpoints: (builder: BuilderType) => ({ // Add type annotation for builder
    // Get events with filtering
    getEvents: builder.query<
      Event[],
      {
        start?: string;
        end?: string;
        teamId?: string;
        eventTypeId?: string;
        locationId?: string;
      } | void // Allow calling without arguments
    >({
      query: (params: { start?: string; end?: string; teamId?: string; eventTypeId?: string; locationId?: string } | void) => ({ 
        url: 'events', 
        params: params || {},
      }),
      providesTags: (result: Event[] | undefined) => 
        result
          ? [
              ...result.map(({ id }: { id: string }) => ({ type: 'Event' as const, id })), // Added type for mapped item
              { type: 'Event', id: 'LIST' },
            ]
          : [{ type: 'Event', id: 'LIST' }],
    }),
    
    // Get single event
    getEvent: builder.query<Event, string>({
      query: (id: string) => `events/${id}`, 
      providesTags: (result: Event | undefined, error: any, id: string) => [{ type: 'Event', id }], // Added types
    }),
    
    // Create event
    createEvent: builder.mutation<Event, Partial<Event>>({
      query: (event: Partial<Event>) => ({ 
        url: 'events',
        method: 'POST',
        body: event,
      }),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),
    
    // Update event
    updateEvent: builder.mutation<Event, { id: string; event: Partial<Event> }>({
      query: ({ id, event }: { id: string; event: Partial<Event> }) => ({ // Added types
        url: `events/${id}`,
        method: 'PUT',
        body: event,
      }),
      invalidatesTags: (result: Event | undefined, error: any, { id }: { id: string }) => [ // Added types
        { type: 'Event', id },
        { type: 'Event', id: 'LIST' },
      ],
    }),
    
    // Delete event
    deleteEvent: builder.mutation<void, string>({
      query: (id: string) => ({ 
        url: `events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),
    
    // Update event status
    updateEventStatus: builder.mutation<
      Event,
      { id: string; status: 'scheduled' | 'canceled' | 'completed' }
    >({
      query: ({ id, status }: { id: string; status: string }) => ({ // Added types
        url: `events/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result: Event | undefined, error: any, { id }: { id: string }) => [ // Added types
        { type: 'Event', id },
        { type: 'Event', id: 'LIST' },
      ],
    }),
    
    // Get event participants
    getEventParticipants: builder.query<EventParticipant[], string>({
      query: (eventId: string) => `events/${eventId}/participants`, 
      providesTags: (result: EventParticipant[] | undefined, error: any, eventId: string) => [ // Added types
        { type: 'Event', id: `${eventId}-participants` }, 
      ],
    }),
    
    // Add event participant
    addEventParticipant: builder.mutation<
      EventParticipant,
      { eventId: string; userId: string }
    >({
      query: ({ eventId, userId }: { eventId: string; userId: string }) => ({ // Added types
        url: `events/${eventId}/participants`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (result: EventParticipant | undefined, error: any, { eventId }: { eventId: string }) => [ // Added types
        { type: 'Event', id: `${eventId}-participants` },
      ],
    }),
    
    // Remove event participant
    removeEventParticipant: builder.mutation<
      void,
      { eventId: string; userId: string }
    >({
      query: ({ eventId, userId }: { eventId: string; userId: string }) => ({ // Added types
        url: `events/${eventId}/participants/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result: void | undefined, error: any, { eventId }: { eventId: string }) => [ // Added types
        { type: 'Event', id: `${eventId}-participants` },
      ],
    }),
    
    // Get resources
    getResources: builder.query<Resource[], { locationId?: string } | void>({
      query: (params: { locationId?: string } | void) => ({ 
        url: 'resources',
        params: params || {},
      }),
      providesTags: (result: Resource[] | undefined) => 
        result
          ? [
              ...result.map(({ id }: { id: string }) => ({ type: 'Resource' as const, id })), // Added type
              { type: 'Resource', id: 'LIST' },
            ]
          : [{ type: 'Resource', id: 'LIST' }],
    }),
    
    // Get resource availability
    getResourceAvailability: builder.query<
      { available: boolean; conflictingEvents?: Event[] },
      { resourceId: string; start: string; end: string }
    >({
      query: ({ resourceId, start, end }: { resourceId: string; start: string; end: string }) => ({ // Added types
        url: `resources/${resourceId}/availability`,
        params: { start, end },
      }),
    }),
    
    // Get locations
    getLocations: builder.query<Location[], void>({
      query: () => 'locations',
      providesTags: (result: Location[] | undefined) => 
        result
          ? [
              ...result.map(({ id }: { id: string }) => ({ type: 'Location' as const, id })), // Added type
              { type: 'Location', id: 'LIST' },
            ]
          : [{ type: 'Location', id: 'LIST' }],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useUpdateEventStatusMutation,
  useGetEventParticipantsQuery,
  useAddEventParticipantMutation,
  useRemoveEventParticipantMutation,
  useGetResourcesQuery,
  useGetResourceAvailabilityQuery,
  useGetLocationsQuery,
} = calendarApi; 