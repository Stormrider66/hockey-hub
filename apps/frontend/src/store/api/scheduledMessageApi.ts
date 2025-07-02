import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ScheduledMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video';
  scheduledFor: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  replyToId?: string;
  attachments?: any[];
  metadata?: Record<string, any>;
  timezone?: string;
  recurrenceRule?: string;
  sentAt?: string;
  sentMessageId?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledMessageDto {
  conversationId: string;
  content: string;
  type?: string;
  scheduledFor: string;
  replyToId?: string;
  attachments?: any[];
  metadata?: Record<string, any>;
  timezone?: string;
  recurrenceRule?: string;
}

export interface UpdateScheduledMessageDto {
  content?: string;
  scheduledFor?: string;
  attachments?: any[];
  metadata?: Record<string, any>;
}

export const scheduledMessageApi = createApi({
  reducerPath: 'scheduledMessageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/communication',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ScheduledMessage'],
  endpoints: (builder) => ({
    // Create a scheduled message
    createScheduledMessage: builder.mutation<ScheduledMessage, CreateScheduledMessageDto>({
      query: (data) => ({
        url: '/api/scheduled-messages',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ScheduledMessage'],
    }),

    // Get scheduled messages
    getScheduledMessages: builder.query<ScheduledMessage[], {
      conversationId?: string;
      status?: 'pending' | 'sent' | 'failed' | 'cancelled';
    }>({
      query: (params) => ({
        url: '/api/scheduled-messages',
        params,
      }),
      providesTags: ['ScheduledMessage'],
    }),

    // Update scheduled message
    updateScheduledMessage: builder.mutation<ScheduledMessage, {
      messageId: string;
      data: UpdateScheduledMessageDto;
    }>({
      query: ({ messageId, data }) => ({
        url: `/api/scheduled-messages/${messageId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ScheduledMessage'],
    }),

    // Cancel scheduled message
    cancelScheduledMessage: builder.mutation<void, string>({
      query: (messageId) => ({
        url: `/api/scheduled-messages/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ScheduledMessage'],
    }),

    // Get next scheduled message for conversation
    getNextScheduledMessage: builder.query<ScheduledMessage | null, string>({
      query: (conversationId) => ({
        url: `/api/scheduled-messages/conversations/${conversationId}/next`,
      }),
      providesTags: ['ScheduledMessage'],
    }),
  }),
});

export const {
  useCreateScheduledMessageMutation,
  useGetScheduledMessagesQuery,
  useUpdateScheduledMessageMutation,
  useCancelScheduledMessageMutation,
  useGetNextScheduledMessageQuery,
} = scheduledMessageApi;