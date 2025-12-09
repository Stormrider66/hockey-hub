import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ApiResponse } from '@hockey-hub/shared-lib';
import type {
  EquipmentItem,
  EquipmentReservation,
  EquipmentAvailability,
  EquipmentConflict,
  EquipmentSummary,
  FacilityEquipmentConfig,
  CreateEquipmentReservationRequest,
  BulkReservationRequest,
  AvailabilityCheckRequest,
  BulkAvailabilityCheckRequest,
  EquipmentFilter
} from '@/features/physical-trainer/types/equipment.types';
import { createMockEnabledBaseQuery } from './mockBaseQuery';

// API configuration
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api';

export const equipmentApi = createApi({
  reducerPath: 'equipmentApi',
  baseQuery: createMockEnabledBaseQuery(
    fetchBaseQuery({
      baseUrl: `${API_GATEWAY_URL}/training/equipment`,
      prepareHeaders: (headers, { getState }) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
      },
    })
  ),
  tagTypes: ['Equipment', 'Reservation', 'Availability', 'Config'],
  endpoints: (builder) => ({
    // ===== EQUIPMENT INVENTORY =====
    
    // Get equipment inventory with filters and pagination
    getEquipmentInventory: builder.query<ApiResponse<{
      data: EquipmentItem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>, EquipmentFilter>({
      query: (filter) => ({
        url: '/inventory',
        params: filter,
      }),
      providesTags: ['Equipment'],
    }),

    // Get equipment by ID
    getEquipmentById: builder.query<ApiResponse<EquipmentItem>, string>({
      query: (id) => `/inventory/${id}`,
      providesTags: (result, error, id) => [{ type: 'Equipment', id }],
    }),

    // Get equipment summary for facility
    getEquipmentSummary: builder.query<ApiResponse<EquipmentSummary>, string>({
      query: (facilityId) => `/inventory/facility/${facilityId}/summary`,
      providesTags: (result, error, facilityId) => [{ type: 'Equipment', id: `summary-${facilityId}` }],
    }),

    // Update equipment status
    updateEquipmentStatus: builder.mutation<ApiResponse<EquipmentItem>, {
      id: string;
      status: string;
      notes?: string;
    }>({
      query: ({ id, status, notes }) => ({
        url: `/inventory/${id}/status`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Equipment', id },
        'Equipment',
        'Availability'
      ],
    }),

    // ===== AVAILABILITY =====

    // Get equipment availability for a date
    getEquipmentAvailability: builder.query<EquipmentAvailability, {
      date: string;
      facilityId: string;
    }>({
      query: ({ date, facilityId }) => ({
        url: '/availability',
        params: { date, facilityId },
      }),
      providesTags: ['Availability'],
    }),
    
    // Check equipment availability
    checkEquipmentAvailability: builder.mutation<ApiResponse<EquipmentAvailability>, AvailabilityCheckRequest>({
      query: (request) => ({
        url: '/availability/check',
        method: 'POST',
        body: request,
      }),
    }),

    // Bulk availability check
    checkBulkAvailability: builder.mutation<ApiResponse<EquipmentAvailability[]>, BulkAvailabilityCheckRequest>({
      query: (request) => ({
        url: '/availability/bulk-check',
        method: 'POST',
        body: request,
      }),
    }),

    // Get real-time availability for facility
    getRealTimeAvailability: builder.query<ApiResponse<Record<string, EquipmentAvailability>>, string>({
      query: (facilityId) => `/availability/facility/${facilityId}/realtime`,
      providesTags: (result, error, facilityId) => [{ type: 'Availability', id: facilityId }],
    }),

    // ===== RESERVATIONS =====

    // Create equipment reservation
    createEquipmentReservation: builder.mutation<ApiResponse<EquipmentReservation>, CreateEquipmentReservationRequest>({
      query: (request) => ({
        url: '/reserve',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Reservation', 'Availability', 'Equipment'],
    }),

    // Create bulk reservations
    createBulkReservations: builder.mutation<ApiResponse<{
      successful: EquipmentReservation[];
      failed: Array<{
        request: CreateEquipmentReservationRequest;
        error: string;
        conflicts?: EquipmentConflict[];
      }>;
    }>, BulkReservationRequest>({
      query: (request) => ({
        url: '/reserve/bulk',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['Reservation', 'Availability', 'Equipment'],
    }),

    // Get reservations by session
    getReservationsBySession: builder.query<ApiResponse<EquipmentReservation[]>, string>({
      query: (sessionId) => `/reserve/session/${sessionId}`,
      providesTags: (result, error, sessionId) => [{ type: 'Reservation', id: sessionId }],
    }),

    // Update reservation status
    updateReservationStatus: builder.mutation<ApiResponse<EquipmentReservation>, {
      id: string;
      status: string;
      notes?: string;
      condition?: {
        pre?: string;
        post?: string;
        issues?: string[];
      };
    }>({
      query: ({ id, ...data }) => ({
        url: `/reserve/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reservation', id },
        'Reservation',
        'Availability'
      ],
    }),

    // Check in equipment
    checkInEquipment: builder.mutation<ApiResponse<EquipmentReservation>, {
      id: string;
      condition?: string;
      issues?: string[];
      notes?: string;
    }>({
      query: ({ id, ...data }) => ({
        url: `/reserve/${id}/checkin`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reservation', id },
        'Reservation',
        'Availability'
      ],
    }),

    // Check out equipment
    checkOutEquipment: builder.mutation<ApiResponse<EquipmentReservation>, {
      id: string;
      condition?: string;
      issues?: string[];
      notes?: string;
    }>({
      query: ({ id, ...data }) => ({
        url: `/reserve/${id}/checkout`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reservation', id },
        'Reservation',
        'Availability'
      ],
    }),

    // Cancel reservation
    cancelReservation: builder.mutation<ApiResponse<EquipmentReservation>, {
      id: string;
      reason?: string;
    }>({
      query: ({ id, reason }) => ({
        url: `/reserve/${id}`,
        method: 'DELETE',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reservation', id },
        'Reservation',
        'Availability'
      ],
    }),

    // ===== CONFLICT CHECKING =====

    // Check for equipment conflicts
    checkEquipmentConflicts: builder.query<ApiResponse<EquipmentConflict[]>, {
      equipmentItemId?: string;
      equipmentType?: string;
      facilityId?: string;
      startTime: string;
      endTime: string;
      requiredCount?: number;
      excludeReservationId?: string;
    }>({
      query: (params) => ({
        url: '/conflicts',
        params,
      }),
    }),

    // ===== FACILITY CONFIGURATION =====

    // Get facility equipment configuration
    getFacilityEquipmentConfig: builder.query<ApiResponse<FacilityEquipmentConfig[]>, string>({
      query: (facilityId) => `/config/facility/${facilityId}`,
      providesTags: (result, error, facilityId) => [{ type: 'Config', id: facilityId }],
    }),

    // Update facility equipment configuration
    updateFacilityEquipmentConfig: builder.mutation<ApiResponse<FacilityEquipmentConfig>, {
      id: string;
      data: Partial<FacilityEquipmentConfig>;
    }>({
      query: ({ id, data }) => ({
        url: `/config/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Config', id },
        'Config',
        'Availability'
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  // Inventory
  useGetEquipmentInventoryQuery,
  useGetEquipmentByIdQuery,
  useGetEquipmentSummaryQuery,
  useUpdateEquipmentStatusMutation,
  
  // Availability
  useGetEquipmentAvailabilityQuery,
  useCheckEquipmentAvailabilityMutation,
  useCheckBulkAvailabilityMutation,
  useGetRealTimeAvailabilityQuery,
  
  // Reservations
  useCreateEquipmentReservationMutation,
  useCreateBulkReservationsMutation,
  useGetReservationsBySessionQuery,
  useUpdateReservationStatusMutation,
  useCheckInEquipmentMutation,
  useCheckOutEquipmentMutation,
  useCancelReservationMutation,
  
  // Conflicts
  useCheckEquipmentConflictsQuery,
  useLazyCheckEquipmentConflictsQuery,
  
  // Configuration
  useGetFacilityEquipmentConfigQuery,
  useUpdateFacilityEquipmentConfigMutation,
} = equipmentApi;