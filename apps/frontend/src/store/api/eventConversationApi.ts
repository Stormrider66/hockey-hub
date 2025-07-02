import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface EventConversation {
  id: string;
  event_id: string;
  conversation_id: string;
  status: 'active' | 'archived' | 'suspended';
  scope: 'all_participants' | 'coaches_only' | 'players_only' | 'parents_only' | 'custom';
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  auto_archive_at?: string;
  auto_add_participants: boolean;
  send_welcome_message: boolean;
  settings?: {
    allowFileSharing?: boolean;
    allowVoiceMessages?: boolean;
    allowVideoMessages?: boolean;
    moderatedMode?: boolean;
    notifyOnEventReminders?: boolean;
    notifyOnEventChanges?: boolean;
    notifyOnRSVPChanges?: boolean;
    autoArchiveAfterEvent?: boolean;
    archiveDelayHours?: number;
    showEventDetails?: boolean;
    allowQuickActions?: boolean;
    [key: string]: any;
  };
  metadata?: {
    calendarServiceUrl?: string;
    eventType?: string;
    eventTitle?: string;
    eventDate?: string;
    eventLocation?: string;
    totalMessages?: number;
    totalParticipants?: number;
    lastActivityAt?: string;
    eventStartedAt?: string;
    eventCompletedAt?: string;
    eventCancelledAt?: string;
    [key: string]: any;
  };
  conversation?: {
    id: string;
    type: string;
    name?: string;
    description?: string;
    created_at: string;
    updated_at: string;
    participants: Array<{
      user_id: string;
      role: string;
      joined_at: string;
      left_at?: string;
    }>;
  };
  eventDetails?: {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    type: string;
    status: string;
  };
  participantCount?: number;
  messageCount?: number;
  lastActivity?: string;
}

export interface CreateEventConversationRequest {
  event_id: string;
  scope?: 'all_participants' | 'coaches_only' | 'players_only' | 'parents_only' | 'custom';
  name?: string;
  description?: string;
  auto_add_participants?: boolean;
  send_welcome_message?: boolean;
  settings?: Record<string, any>;
  custom_participant_ids?: string[];
}

export interface EventConversationFilters {
  event_id?: string;
  status?: 'active' | 'archived' | 'suspended';
  scope?: 'all_participants' | 'coaches_only' | 'players_only' | 'parents_only' | 'custom';
  created_by?: string;
  active_only?: boolean;
  page?: number;
  limit?: number;
}

export interface EventConversationListResponse {
  success: boolean;
  eventConversations: EventConversation[];
  total: number;
  page: number;
  totalPages: number;
}

export interface QuickCreateResponse {
  success: boolean;
  data: {
    event_conversation_id: string;
    conversation_id: string;
    conversation_name: string;
    participant_count: number;
  };
}

export const eventConversationApi = createApi({
  reducerPath: 'eventConversationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api'}/communication/event-conversations`,
    prepareHeaders: (headers) => {
      // Get token from localStorage
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('current_user_id');
      
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      if (userId) {
        headers.set('x-user-id', userId);
      }
      headers.set('content-type', 'application/json');
      
      return headers;
    },
  }),
  tagTypes: ['EventConversation', 'EventConversationList'],
  endpoints: (builder) => ({
    // Create event conversation
    createEventConversation: builder.mutation<
      { success: boolean; data: EventConversation },
      CreateEventConversationRequest
    >({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['EventConversationList'],
    }),

    // Quick create event conversation (from calendar)
    quickCreateEventConversation: builder.mutation<
      QuickCreateResponse,
      { event_id: string; conversation_type?: string }
    >({
      query: (data) => ({
        url: '/quick-create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['EventConversationList'],
    }),

    // Get event conversation by ID
    getEventConversation: builder.query<
      { success: boolean; data: EventConversation },
      string
    >({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'EventConversation', id }],
    }),

    // Get event conversations with filters
    getEventConversations: builder.query<
      EventConversationListResponse,
      EventConversationFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
        return `?${params.toString()}`;
      },
      providesTags: ['EventConversationList'],
    }),

    // Get event conversations for specific event
    getEventConversationsForEvent: builder.query<
      { success: boolean; data: EventConversation[] },
      string
    >({
      query: (eventId) => `/event/${eventId}`,
      providesTags: (result, error, eventId) => [
        { type: 'EventConversationList', id: eventId },
      ],
    }),

    // Add participants to event conversation
    addParticipantsToEventConversation: builder.mutation<
      { success: boolean; message: string },
      { eventConversationId: string; participant_ids: string[] }
    >({
      query: ({ eventConversationId, participant_ids }) => ({
        url: `/${eventConversationId}/participants`,
        method: 'POST',
        body: { participant_ids },
      }),
      invalidatesTags: (result, error, { eventConversationId }) => [
        { type: 'EventConversation', id: eventConversationId },
        'EventConversationList',
      ],
    }),

    // Archive event conversation
    archiveEventConversation: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (eventConversationId) => ({
        url: `/${eventConversationId}/archive`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, eventConversationId) => [
        { type: 'EventConversation', id: eventConversationId },
        'EventConversationList',
      ],
    }),

    // Send event reminder
    sendEventReminder: builder.mutation<
      { success: boolean; message: string },
      { eventConversationId: string; message: string }
    >({
      query: ({ eventConversationId, message }) => ({
        url: `/${eventConversationId}/reminder`,
        method: 'POST',
        body: { message },
      }),
    }),

    // Notify event changes (internal API call)
    notifyEventChanges: builder.mutation<
      { success: boolean; message: string },
      { eventId: string; change_description: string }
    >({
      query: ({ eventId, change_description }) => ({
        url: `/event/${eventId}/notify-changes`,
        method: 'POST',
        body: { change_description },
      }),
    }),
  }),
});

export const {
  useCreateEventConversationMutation,
  useQuickCreateEventConversationMutation,
  useGetEventConversationQuery,
  useGetEventConversationsQuery,
  useGetEventConversationsForEventQuery,
  useAddParticipantsToEventConversationMutation,
  useArchiveEventConversationMutation,
  useSendEventReminderMutation,
  useNotifyEventChangesMutation,
} = eventConversationApi;