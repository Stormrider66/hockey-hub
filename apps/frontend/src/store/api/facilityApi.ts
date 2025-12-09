import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from './mockBaseQuery';

// Types
export interface Facility {
  id: string;
  name: string;
  type: 'gym' | 'field' | 'ice_rink' | 'pool' | 'track' | 'court' | 'other';
  organizationId: string;
  location: string;
  capacity: number;
  equipment: string[];
  availability?: 'available' | 'partially_booked' | 'fully_booked';
  amenities: string[];
  schedule?: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
  }[];
  maintenanceSchedule?: {
    startDate: string;
    endDate: string;
    description: string;
  }[];
  bookingRules?: {
    minDuration: number; // minutes
    maxDuration: number; // minutes
    advanceBookingDays: number;
    allowOverlapping: boolean;
  };
  images?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    manager?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FacilityBooking {
  id: string;
  facilityId: string;
  eventId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  bookedBy: string;
  teamId?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  equipment?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacilityDto {
  name: string;
  type: Facility['type'];
  organizationId: string;
  location: string;
  capacity: number;
  equipment?: string[];
  amenities?: string[];
  schedule?: Facility['schedule'];
  bookingRules?: Facility['bookingRules'];
  contactInfo?: Facility['contactInfo'];
}

export interface CreateBookingDto {
  facilityId: string;
  eventId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  bookedBy: string;
  teamId?: string;
  equipment?: string[];
  notes?: string;
}

export interface CheckAvailabilityParams {
  facilityId: string;
  startTime: string;
  endTime: string;
  excludeBookingId?: string;
}

export interface FacilityAvailability {
  isAvailable: boolean;
  conflicts?: FacilityBooking[];
  suggestedTimes?: {
    startTime: string;
    endTime: string;
  }[];
}

// API Definition
export const facilityApi = createApi({
  reducerPath: 'facilityApi',
  baseQuery: process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true' 
    ? mockBaseQuery
    : fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/facility',
        prepareHeaders: (headers) => {
          const token = localStorage.getItem('access_token');
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return headers;
        },
      }),
  tagTypes: ['Facility', 'Booking'],
  endpoints: (builder) => ({
    // Get facilities
    getFacilities: builder.query<{
      data: Facility[];
      total: number;
      page: number;
      limit: number;
    }, {
      organizationId: string;
      type?: Facility['type'];
      available?: boolean;
      page?: number;
      limit?: number;
    }>({
      query: (params) => ({
        url: '/facilities',
        params,
      }),
      providesTags: ['Facility'],
    }),

    // Get single facility
    getFacility: builder.query<Facility, string>({
      query: (id) => `/facilities/${id}`,
      providesTags: (result, error, id) => [{ type: 'Facility', id }],
    }),

    // Create facility
    createFacility: builder.mutation<Facility, CreateFacilityDto>({
      query: (facility) => ({
        url: '/facilities',
        method: 'POST',
        body: facility,
      }),
      invalidatesTags: ['Facility'],
    }),

    // Update facility
    updateFacility: builder.mutation<Facility, { id: string; data: Partial<CreateFacilityDto> }>({
      query: ({ id, data }) => ({
        url: `/facilities/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Facility', id }, 'Facility'],
    }),

    // Delete facility
    deleteFacility: builder.mutation<void, string>({
      query: (id) => ({
        url: `/facilities/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Facility'],
    }),

    // Check facility availability
    checkFacilityAvailability: builder.query<FacilityAvailability, CheckAvailabilityParams>({
      query: (params) => ({
        url: '/facilities/check-availability',
        params,
      }),
    }),

    // Get facility bookings
    getFacilityBookings: builder.query<{
      data: FacilityBooking[];
      total: number;
    }, {
      facilityId?: string;
      startDate?: string;
      endDate?: string;
      status?: FacilityBooking['status'];
      teamId?: string;
    }>({
      query: (params) => ({
        url: '/bookings',
        params,
      }),
      providesTags: ['Booking'],
    }),

    // Create booking
    createBooking: builder.mutation<FacilityBooking, CreateBookingDto>({
      query: (booking) => ({
        url: '/bookings',
        method: 'POST',
        body: booking,
      }),
      invalidatesTags: ['Booking', 'Facility'],
    }),

    // Update booking
    updateBooking: builder.mutation<FacilityBooking, { id: string; data: Partial<CreateBookingDto> }>({
      query: ({ id, data }) => ({
        url: `/bookings/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Booking', id }, 'Booking', 'Facility'],
    }),

    // Cancel booking
    cancelBooking: builder.mutation<void, string>({
      query: (id) => ({
        url: `/bookings/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Booking', 'Facility'],
    }),

    // Get facility schedule
    getFacilitySchedule: builder.query<{
      facility: Facility;
      bookings: FacilityBooking[];
      availability: {
        date: string;
        slots: {
          startTime: string;
          endTime: string;
          isAvailable: boolean;
        }[];
      }[];
    }, {
      facilityId: string;
      startDate: string;
      endDate: string;
    }>({
      query: (params) => ({
        url: `/facilities/${params.facilityId}/schedule`,
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      }),
      providesTags: (result, error, { facilityId }) => [
        { type: 'Facility', id: facilityId },
        'Booking'
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetFacilitiesQuery,
  useGetFacilityQuery,
  useCreateFacilityMutation,
  useUpdateFacilityMutation,
  useDeleteFacilityMutation,
  useCheckFacilityAvailabilityQuery,
  useGetFacilityBookingsQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useCancelBookingMutation,
  useGetFacilityScheduleQuery,
} = facilityApi;