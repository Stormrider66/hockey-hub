import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ScheduleClarification {
  id: string;
  conversation_id: string;
  event_id: string;
  type: ClarificationType;
  status: ClarificationStatus;
  priority: ClarificationPriority;
  organization_id: string;
  team_id: string;
  initiated_by: string;
  title: string;
  description: string;
  event_details: {
    event_name: string;
    event_type: string;
    original_date: string;
    original_time: string;
    original_location: string;
    proposed_date?: string;
    proposed_time?: string;
    proposed_location?: string;
  };
  conflict_details?: any;
  weather_info?: any;
  resolution?: any;
  participant_ids: string[];
  tags?: string[];
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface CarpoolOffer {
  id: string;
  schedule_clarification_id: string;
  driver_id: string;
  driver_name?: string;
  event_id: string;
  status: CarpoolOfferStatus;
  vehicle_type: VehicleType;
  available_seats: number;
  occupied_seats: number;
  pickup_location: string;
  pickup_coordinates?: any;
  departure_time: string;
  return_time?: string;
  is_round_trip: boolean;
  event_date: string;
  driver_preferences?: any;
  notes?: string;
  contact_info?: any;
  requests?: CarpoolRequest[];
  created_at: string;
}

export interface CarpoolRequest {
  id: string;
  carpool_offer_id: string;
  requester_id: string;
  requester_name?: string;
  player_id: string;
  status: CarpoolRequestStatus;
  seats_requested: number;
  pickup_address?: string;
  pickup_coordinates?: any;
  needs_return_trip: boolean;
  special_requirements?: any;
  notes?: string;
  response_message?: string;
  responded_at?: string;
  created_at: string;
}

export interface AvailabilityPoll {
  id: string;
  schedule_clarification_id: string;
  created_by: string;
  title: string;
  description?: string;
  type: PollType;
  status: PollStatus;
  options: PollOption[];
  target_user_ids?: string[];
  deadline?: string;
  allow_multiple_choices: boolean;
  anonymous_responses: boolean;
  show_results_immediately: boolean;
  final_decision?: any;
  responses?: AvailabilityResponse[];
  created_at: string;
  participant_count?: number;
}

export interface PollOption {
  id: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  additional_info?: any;
}

export interface AvailabilityResponse {
  id: string;
  availability_poll_id: string;
  user_id: string;
  user_name?: string;
  player_id?: string;
  selected_option_ids: string[];
  overall_status: ResponseStatus;
  option_preferences?: any;
  comments?: string;
  constraints?: any;
  is_tentative: boolean;
  responded_at?: string;
}

export enum ClarificationType {
  SCHEDULE_CONFLICT = 'schedule_conflict',
  TIME_CHANGE = 'time_change',
  LOCATION_CHANGE = 'location_change',
  CANCELLATION = 'cancellation',
  WEATHER_CONCERN = 'weather_concern',
  TRANSPORTATION_COORDINATION = 'transportation_coordination',
  GENERAL_INQUIRY = 'general_inquiry',
  RESCHEDULING_REQUEST = 'rescheduling_request',
}

export enum ClarificationStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
  ESCALATED = 'escalated',
}

export enum ClarificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum CarpoolOfferStatus {
  AVAILABLE = 'available',
  PARTIALLY_FILLED = 'partially_filled',
  FULL = 'full',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum VehicleType {
  CAR = 'car',
  SUV = 'suv',
  VAN = 'van',
  MINIBUS = 'minibus',
  OTHER = 'other',
}

export enum CarpoolRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PollType {
  DATE_TIME = 'date_time',
  TIME_ONLY = 'time_only',
  LOCATION = 'location',
  GENERAL = 'general',
}

export enum PollStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  DECIDED = 'decided',
}

export enum ResponseStatus {
  AVAILABLE = 'available',
  NOT_AVAILABLE = 'not_available',
  MAYBE = 'maybe',
  NO_RESPONSE = 'no_response',
}

export const scheduleClarificationApi = createApi({
  reducerPath: 'scheduleClarificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/schedule-clarifications',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ScheduleClarification', 'CarpoolOffer', 'AvailabilityPoll'],
  endpoints: (builder) => ({
    // Schedule Clarification endpoints
    createClarification: builder.mutation<ScheduleClarification, Partial<ScheduleClarification>>({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ScheduleClarification'],
    }),

    getClarification: builder.query<ScheduleClarification, string>({
      query: (id) => `/${id}`,
      providesTags: ['ScheduleClarification'],
    }),

    getClarifications: builder.query<ScheduleClarification[], any>({
      query: (params) => ({
        url: '',
        params,
      }),
      providesTags: ['ScheduleClarification'],
    }),

    updateClarificationStatus: builder.mutation<ScheduleClarification, {
      id: string;
      status: ClarificationStatus;
      resolution?: any;
    }>({
      query: ({ id, ...body }) => ({
        url: `/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ScheduleClarification'],
    }),

    // Carpool endpoints
    createCarpoolOffer: builder.mutation<CarpoolOffer, any>({
      query: ({ clarificationId, ...body }) => ({
        url: `/${clarificationId}/carpool-offers`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CarpoolOffer'],
    }),

    getCarpoolOffers: builder.query<CarpoolOffer[], { clarificationId: string }>({
      query: ({ clarificationId, ...params }) => ({
        url: `/${clarificationId}/carpool-offers`,
        params,
      }),
      providesTags: ['CarpoolOffer'],
    }),

    getUpcomingCarpoolOffers: builder.query<CarpoolOffer[], { days?: number }>({
      query: (params) => ({
        url: '/carpool-offers/upcoming',
        params,
      }),
      providesTags: ['CarpoolOffer'],
    }),

    requestCarpool: builder.mutation<CarpoolRequest, any>({
      query: ({ offerId, ...body }) => ({
        url: `/carpool-offers/${offerId}/requests`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CarpoolOffer'],
    }),

    respondToCarpoolRequest: builder.mutation<CarpoolRequest, {
      requestId: string;
      accepted: boolean;
      responseMessage?: string;
    }>({
      query: ({ requestId, ...body }) => ({
        url: `/carpool-requests/${requestId}/respond`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CarpoolOffer'],
    }),

    // Availability Poll endpoints
    createAvailabilityPoll: builder.mutation<AvailabilityPoll, any>({
      query: ({ clarificationId, ...body }) => ({
        url: `/${clarificationId}/polls`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AvailabilityPoll'],
    }),

    getPolls: builder.query<AvailabilityPoll[], { clarificationId: string }>({
      query: ({ clarificationId }) => ({
        url: `/${clarificationId}/polls`,
      }),
      providesTags: ['AvailabilityPoll'],
    }),

    submitPollResponse: builder.mutation<AvailabilityResponse, any>({
      query: ({ pollId, ...body }) => ({
        url: `/polls/${pollId}/responses`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AvailabilityPoll'],
    }),

    finalizePollDecision: builder.mutation<AvailabilityPoll, {
      pollId: string;
      selectedOptionId: string;
      decisionNotes?: string;
    }>({
      query: ({ pollId, ...body }) => ({
        url: `/polls/${pollId}/finalize`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AvailabilityPoll', 'ScheduleClarification'],
    }),
  }),
});

export const {
  useCreateClarificationMutation,
  useGetClarificationQuery,
  useGetClarificationsQuery,
  useUpdateClarificationStatusMutation,
  useCreateCarpoolOfferMutation,
  useGetCarpoolOffersQuery,
  useGetUpcomingCarpoolOffersQuery,
  useRequestCarpoolMutation,
  useRespondToCarpoolRequestMutation,
  useCreateAvailabilityPollMutation,
  useGetPollsQuery,
  useSubmitPollResponseMutation,
  useFinalizePollDecisionMutation,
} = scheduleClarificationApi;