import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

// Types
export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'team' | 'broadcast' | 'announcement';
  name?: string;
  avatar?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isArchived: boolean;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  metadata?: {
    teamId?: string;
    organizationId?: string;
    allowPlayerReactions?: boolean;
    moderatorIds?: string[];
  };
  pinnedMessages?: Message[];
}

export interface ConversationParticipant {
  conversationId: string;
  userId: string;
  user: User;
  role: 'admin' | 'member';
  joinedAt: string;
  leftAt?: string;
  lastReadAt?: string;
  notificationsEnabled: boolean;
  isMuted: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'voice' | 'announcement';
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  replyToId?: string;
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
  metadata?: {
    priority?: 'normal' | 'important' | 'urgent';
  };
  replyTo?: Message;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  readReceipts: MessageReadReceipt[];
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: User;
  isBookmarked?: boolean;
  bookmarkedAt?: string;
  metadata?: {
    duration?: number;
    waveform?: number[];
    base64Audio?: string;
    [key: string]: any;
  };
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl?: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  user: User;
  emoji: string;
  createdAt: string;
}

export interface MessageReadReceipt {
  messageId: string;
  userId: string;
  user: User;
  readAt: string;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeenAt: string;
  statusMessage?: string;
}

// API Request/Response Types
export interface CreateConversationRequest {
  type: 'direct' | 'group' | 'team';
  name?: string;
  participantIds: string[];
}

export interface UpdateConversationRequest {
  name?: string;
  avatar?: string;
}

export interface SendMessageRequest {
  content: string;
  type?: 'text' | 'image' | 'file' | 'voice';
  replyToId?: string;
  attachments?: any[]; // Changed from File[] to support voice message attachments
  metadata?: {
    duration?: number;
    waveform?: number[];
    base64Audio?: string;
    [key: string]: any;
  };
}

export interface EditMessageRequest {
  content: string;
}

export interface AddReactionRequest {
  emoji: string;
}

export interface UpdatePresenceRequest {
  status: 'online' | 'away' | 'offline';
  statusMessage?: string;
}

export interface SearchMessagesRequest {
  query: string;
  conversationId?: string;
  senderId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
}

export interface PaginatedMessages {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface PaginatedConversations {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
}

// Chat API
export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Conversation', 'Message', 'Presence'],
  endpoints: (builder) => ({
    // Conversation endpoints
    getConversations: builder.query<PaginatedConversations, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => `messages/conversations?page=${page}&limit=${limit}`,
      providesTags: ['Conversation'],
    }),

    getConversation: builder.query<Conversation, string>({
      query: (id) => `messages/conversations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Conversation', id }],
    }),

    createConversation: builder.mutation<Conversation, CreateConversationRequest>({
      query: (body) => ({
        url: 'messages/conversations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Conversation'],
    }),

    updateConversation: builder.mutation<Conversation, { id: string; data: UpdateConversationRequest }>({
      query: ({ id, data }) => ({
        url: `conversations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Conversation', id }],
    }),

    archiveConversation: builder.mutation<void, string>({
      query: (id) => ({
        url: `conversations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Conversation', id }],
    }),

    addParticipants: builder.mutation<void, { conversationId: string; userIds: string[] }>({
      query: ({ conversationId, userIds }) => ({
        url: `conversations/${conversationId}/participants`,
        method: 'POST',
        body: { userIds },
      }),
      invalidatesTags: (result, error, { conversationId }) => [{ type: 'Conversation', id: conversationId }],
    }),

    removeParticipant: builder.mutation<void, { conversationId: string; userId: string }>({
      query: ({ conversationId, userId }) => ({
        url: `conversations/${conversationId}/participants/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { conversationId }) => [{ type: 'Conversation', id: conversationId }],
    }),

    markAsRead: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: `conversations/${conversationId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, conversationId) => [{ type: 'Conversation', id: conversationId }],
    }),

    muteConversation: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: `conversations/${conversationId}/mute`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, conversationId) => [{ type: 'Conversation', id: conversationId }],
    }),

    unmuteConversation: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: `conversations/${conversationId}/mute`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, conversationId) => [{ type: 'Conversation', id: conversationId }],
    }),

    // Message endpoints
    getMessages: builder.query<PaginatedMessages, { conversationId: string; cursor?: string; limit?: number }>({
      query: ({ conversationId, cursor, limit = 50 }) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (cursor) params.append('cursor', cursor);
        return `conversations/${conversationId}/messages?${params}`;
      },
      providesTags: (result, error, { conversationId }) => [{ type: 'Message', id: conversationId }],
      serializeQueryArgs: ({ queryArgs }) => ({ conversationId: queryArgs.conversationId }),
      merge: (currentCache, newItems, { arg }) => {
        if (arg.cursor) {
          // Loading older messages - prepend to existing
          return {
            ...newItems,
            messages: [...newItems.messages, ...currentCache.messages],
          };
        }
        // Initial load or refresh - replace
        return newItems;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.conversationId !== previousArg?.conversationId;
      },
    }),

    sendMessage: builder.mutation<Message, SendMessageRequest & { conversationId: string }>({
      query: ({ conversationId, ...data }) => ({
        url: `conversations/${conversationId}/messages`,
        method: 'POST',
        body: data,
      }),
      // Optimistic update
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        const { conversationId, ...data } = args;
        const currentUserId = localStorage.getItem('current_user_id') || 'current-user-id';
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          conversationId,
          senderId: currentUserId,
          sender: { id: currentUserId, name: 'You', email: '' },
          content: data.content || '',
          type: data.type || 'text',
          createdAt: new Date().toISOString(),
          attachments: data.attachments || [],
          reactions: [],
          readReceipts: [],
          metadata: data.metadata,
        };

        const patchResult = dispatch(
          chatApi.util.updateQueryData('getMessages', { conversationId }, (draft) => {
            draft.messages.unshift(optimisticMessage);
          })
        );

        try {
          const { data: actualMessage } = await queryFulfilled;
          dispatch(
            chatApi.util.updateQueryData('getMessages', { conversationId }, (draft) => {
              const index = draft.messages.findIndex((msg) => msg.id === optimisticMessage.id);
              if (index !== -1) {
                draft.messages[index] = actualMessage;
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: conversationId },
      ],
    }),

    editMessage: builder.mutation<Message, { messageId: string; data: EditMessageRequest }>({
      query: ({ messageId, data }) => ({
        url: `messages/${messageId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { messageId }) => [{ type: 'Message', id: messageId }],
    }),

    deleteMessage: builder.mutation<void, string>({
      query: (messageId) => ({
        url: `messages/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, messageId) => [{ type: 'Message', id: messageId }],
    }),

    addReaction: builder.mutation<MessageReaction, { messageId: string; data: AddReactionRequest }>({
      query: ({ messageId, data }) => ({
        url: `messages/${messageId}/reactions`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { messageId }) => [{ type: 'Message', id: messageId }],
    }),

    removeReaction: builder.mutation<void, { messageId: string; emoji: string }>({
      query: ({ messageId, emoji }) => ({
        url: `messages/${messageId}/reactions`,
        method: 'DELETE',
        body: { emoji },
      }),
      invalidatesTags: (result, error, { messageId }) => [{ type: 'Message', id: messageId }],
    }),

    searchMessages: builder.query<Message[], SearchMessagesRequest>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `messages/search?${searchParams}`;
      },
    }),

    pinMessage: builder.mutation<Message, string>({
      query: (messageId) => ({
        url: `messages/${messageId}/pin`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, messageId) => [{ type: 'Message', id: messageId }],
    }),

    unpinMessage: builder.mutation<void, string>({
      query: (messageId) => ({
        url: `messages/${messageId}/pin`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, messageId) => [{ type: 'Message', id: messageId }],
    }),

    getPinnedMessages: builder.query<Message[], string>({
      query: (conversationId) => `conversations/${conversationId}/messages/pinned`,
      providesTags: (result, error, conversationId) => [{ type: 'Message', id: `pinned-${conversationId}` }],
    }),

    // Bookmark endpoints
    bookmarkMessage: builder.mutation<Message, string>({
      query: (messageId) => ({
        url: `messages/${messageId}/bookmark`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, messageId) => [{ type: 'Message', id: messageId }],
    }),

    unbookmarkMessage: builder.mutation<void, string>({
      query: (messageId) => ({
        url: `messages/${messageId}/bookmark`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, messageId) => [{ type: 'Message', id: messageId }],
    }),

    getBookmarkedMessages: builder.query<Message[], { conversationId?: string }>({
      query: ({ conversationId } = {}) => {
        const params = new URLSearchParams();
        if (conversationId) params.append('conversationId', conversationId);
        return `messages/bookmarked?${params}`;
      },
      providesTags: ['Message'],
    }),

    // Presence endpoints
    updatePresence: builder.mutation<UserPresence, UpdatePresenceRequest>({
      query: (data) => ({
        url: 'presence',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Presence'],
    }),

    getOnlineUsers: builder.query<UserPresence[], void>({
      query: () => 'presence/users',
      providesTags: ['Presence'],
    }),

    getUserPresence: builder.query<UserPresence, string>({
      query: (userId) => `presence/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'Presence', id: userId }],
    }),

    // User endpoints
    getUsers: builder.query<User[], { search?: string; limit?: number }>({
      query: ({ search = '', limit = 10 }) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('limit', limit.toString());
        return `users?${params}`;
      },
      providesTags: ['Conversation'], // Reuse conversation tag as users are related
    }),

    // Announcement Channel endpoints
    createAnnouncementChannel: builder.mutation<Conversation, {
      name: string;
      description?: string;
      teamId: string;
      organizationId: string;
      allowPlayerReactions?: boolean;
      participantIds: string[];
    }>({
      query: (body) => ({
        url: 'announcements/channels',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Conversation'],
    }),

    getAnnouncementChannels: builder.query<Conversation[], void>({
      query: () => 'announcements/channels',
      providesTags: ['Conversation'],
    }),

    postAnnouncement: builder.mutation<Message, {
      conversationId: string;
      content: string;
      attachments?: any[];
      priority?: 'normal' | 'important' | 'urgent';
    }>({
      query: ({ conversationId, ...body }) => ({
        url: `announcements/channels/${conversationId}/announcements`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Message' },
        { type: 'Conversation', id: conversationId },
      ],
    }),

    togglePinAnnouncement: builder.mutation<Message, {
      conversationId: string;
      messageId: string;
    }>({
      query: ({ conversationId, messageId }) => ({
        url: `/announcements/channels/${conversationId}/announcements/${messageId}/pin`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { conversationId, messageId }) => [
        { type: 'Message', id: messageId },
        { type: 'Message', id: `pinned-${conversationId}` },
      ],
    }),

    getPinnedAnnouncements: builder.query<Message[], string>({
      query: (conversationId) => `announcements/channels/${conversationId}/pinned`,
      providesTags: (result, error, conversationId) => [
        { type: 'Message', id: `pinned-${conversationId}` },
      ],
    }),

    reactToAnnouncement: builder.mutation<void, {
      conversationId: string;
      messageId: string;
      emoji: string;
    }>({
      query: ({ conversationId, messageId, emoji }) => ({
        url: `announcements/channels/${conversationId}/announcements/${messageId}/react`,
        method: 'POST',
        body: { emoji },
      }),
      invalidatesTags: (result, error, { messageId }) => [
        { type: 'Message', id: messageId },
      ],
    }),

    getAnnouncementReadReceipts: builder.query<MessageReadReceipt[], string>({
      query: (messageId) => `announcements/announcements/${messageId}/read-receipts`,
      providesTags: (result, error, messageId) => [
        { type: 'Message', id: messageId },
      ],
    }),

    updateAnnouncementChannelSettings: builder.mutation<Conversation, {
      conversationId: string;
      name?: string;
      description?: string;
      allowPlayerReactions?: boolean;
    }>({
      query: ({ conversationId, ...body }) => ({
        url: `announcements/channels/${conversationId}/settings`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
      ],
    }),
  }),
});

export const {
  // Conversation hooks
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useUpdateConversationMutation,
  useArchiveConversationMutation,
  useAddParticipantsMutation,
  useRemoveParticipantMutation,
  useMarkAsReadMutation,
  useMuteConversationMutation,
  useUnmuteConversationMutation,

  // Message hooks
  useGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useAddReactionMutation,
  useRemoveReactionMutation,
  useSearchMessagesQuery,
  usePinMessageMutation,
  useUnpinMessageMutation,
  useGetPinnedMessagesQuery,
  useBookmarkMessageMutation,
  useUnbookmarkMessageMutation,
  useGetBookmarkedMessagesQuery,

  // Presence hooks
  useUpdatePresenceMutation,
  useGetOnlineUsersQuery,
  useGetUserPresenceQuery,

  // User hooks
  useGetUsersQuery,

  // Announcement Channel hooks
  useCreateAnnouncementChannelMutation,
  useGetAnnouncementChannelsQuery,
  usePostAnnouncementMutation,
  useTogglePinAnnouncementMutation,
  useGetPinnedAnnouncementsQuery,
  useReactToAnnouncementMutation,
  useGetAnnouncementReadReceiptsQuery,
  useUpdateAnnouncementChannelSettingsMutation,
} = chatApi;