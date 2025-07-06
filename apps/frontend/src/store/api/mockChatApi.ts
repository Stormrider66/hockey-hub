import { createApi } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from './mockBaseQuery';
import type {
  Conversation,
  Message,
  PaginatedConversations,
  PaginatedMessages,
  CreateConversationRequest,
  SendMessageRequest,
  MessageReaction,
  UserPresence,
} from './chatApi';

// Mock data
const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Team Falcons',
    type: 'group',
    description: 'Main team chat',
    participantCount: 15,
    participants: [
      {
        id: '1',
        conversationId: '1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
        role: 'member',
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        unreadCount: 2,
      },
    ],
    lastMessage: {
      id: 'msg-1',
      conversationId: '1',
      senderId: 'coach-1',
      sender: { id: 'coach-1', name: 'Coach Johnson', email: 'coach@example.com' },
      content: 'Great practice today team! 💪',
      type: 'text',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      reactions: [],
      readReceipts: [],
      attachments: [],
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: 'system',
    isActive: true,
    settings: {
      notificationsEnabled: true,
      muteUntil: null,
    },
  },
  {
    id: '2',
    name: 'Coach Johnson',
    type: 'direct',
    description: '',
    participantCount: 2,
    participants: [],
    lastMessage: {
      id: 'msg-2',
      conversationId: '2',
      senderId: 'coach-1',
      sender: { id: 'coach-1', name: 'Coach Johnson', email: 'coach@example.com' },
      content: 'Remember to bring your gear tomorrow',
      type: 'text',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      reactions: [],
      readReceipts: [],
      attachments: [],
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    createdBy: 'system',
    isActive: true,
    settings: {
      notificationsEnabled: true,
      muteUntil: null,
    },
  },
  {
    id: '3',
    name: 'Team Announcements',
    type: 'announcement',
    description: 'Official team announcements',
    participantCount: 25,
    participants: [],
    lastMessage: {
      id: 'msg-3',
      conversationId: '3',
      senderId: 'admin-1',
      sender: { id: 'admin-1', name: 'Team Admin', email: 'admin@example.com' },
      content: '📢 Next game is on Saturday at 3 PM!',
      type: 'text',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      updatedAt: new Date(Date.now() - 14400000).toISOString(),
      reactions: [
        { id: '1', messageId: 'msg-3', userId: 'user-1', emoji: '👍', createdAt: new Date().toISOString() },
        { id: '2', messageId: 'msg-3', userId: 'user-2', emoji: '🏒', createdAt: new Date().toISOString() },
      ],
      readReceipts: [],
      attachments: [],
    },
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
    createdBy: 'system',
    isActive: true,
    settings: {
      notificationsEnabled: true,
      muteUntil: null,
    },
  },
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: 'msg-10',
      conversationId: '1',
      senderId: 'user-1',
      sender: { id: 'user-1', name: 'You', email: 'you@example.com' },
      content: "I'll be there! Looking forward to it",
      type: 'text',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      reactions: [],
      readReceipts: [],
      attachments: [],
    },
    {
      id: 'msg-1',
      conversationId: '1',
      senderId: 'coach-1',
      sender: { id: 'coach-1', name: 'Coach Johnson', email: 'coach@example.com' },
      content: 'Great practice today team! 💪',
      type: 'text',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      reactions: [
        { id: '1', messageId: 'msg-1', userId: 'user-2', emoji: '👍', createdAt: new Date().toISOString() },
        { id: '2', messageId: 'msg-1', userId: 'user-3', emoji: '🔥', createdAt: new Date().toISOString() },
      ],
      readReceipts: [],
      attachments: [],
    },
    {
      id: 'msg-11',
      conversationId: '1',
      senderId: 'player-2',
      sender: { id: 'player-2', name: 'Alex Smith', email: 'alex@example.com' },
      content: 'Thanks coach! Felt really good out there',
      type: 'text',
      createdAt: new Date(Date.now() - 3300000).toISOString(),
      updatedAt: new Date(Date.now() - 3300000).toISOString(),
      reactions: [],
      readReceipts: [],
      attachments: [],
    },
  ],
  '2': [
    {
      id: 'msg-20',
      conversationId: '2',
      senderId: 'user-1',
      sender: { id: 'user-1', name: 'You', email: 'you@example.com' },
      content: 'Hi Coach, I wanted to ask about the training plan',
      type: 'text',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      updatedAt: new Date(Date.now() - 10800000).toISOString(),
      reactions: [],
      readReceipts: [],
      attachments: [],
    },
    {
      id: 'msg-2',
      conversationId: '2',
      senderId: 'coach-1',
      sender: { id: 'coach-1', name: 'Coach Johnson', email: 'coach@example.com' },
      content: 'Remember to bring your gear tomorrow',
      type: 'text',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      reactions: [],
      readReceipts: [],
      attachments: [],
    },
    {
      id: 'msg-21',
      conversationId: '2',
      senderId: 'user-1',
      sender: { id: 'user-1', name: 'You', email: 'you@example.com' },
      content: 'Will do! Thanks for the reminder',
      type: 'text',
      createdAt: new Date(Date.now() - 7000000).toISOString(),
      updatedAt: new Date(Date.now() - 7000000).toISOString(),
      reactions: [],
      readReceipts: [],
      attachments: [],
    },
  ],
  '3': [
    {
      id: 'msg-3',
      conversationId: '3',
      senderId: 'admin-1',
      sender: { id: 'admin-1', name: 'Team Admin', email: 'admin@example.com' },
      content: '📢 Next game is on Saturday at 3 PM!',
      type: 'text',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      updatedAt: new Date(Date.now() - 14400000).toISOString(),
      reactions: [
        { id: '1', messageId: 'msg-3', userId: 'user-1', emoji: '👍', createdAt: new Date().toISOString() },
        { id: '2', messageId: 'msg-3', userId: 'user-2', emoji: '🏒', createdAt: new Date().toISOString() },
      ],
      readReceipts: [],
      attachments: [],
    },
    {
      id: 'msg-30',
      conversationId: '3',
      senderId: 'admin-1',
      sender: { id: 'admin-1', name: 'Team Admin', email: 'admin@example.com' },
      content: 'Please arrive 30 minutes early for warm-up',
      type: 'text',
      createdAt: new Date(Date.now() - 14200000).toISOString(),
      updatedAt: new Date(Date.now() - 14200000).toISOString(),
      reactions: [],
      readReceipts: [],
      attachments: [],
    },
  ],
};

let messageIdCounter = 100;

export const mockChatApi = createApi({
  reducerPath: 'mockChatApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['Conversation', 'Message', 'User'],
  endpoints: (builder) => ({
    // Conversation endpoints
    getConversations: builder.query<PaginatedConversations, any>({
      query: () => ({
        url: '/conversations',
        method: 'GET',
      }),
      transformResponse: () => ({
        conversations: mockConversations,
        total: mockConversations.length,
        page: 1,
        pageSize: 20,
      }),
      providesTags: ['Conversation'],
    }),

    getConversation: builder.query<Conversation, string>({
      query: (id) => ({
        url: `/conversations/${id}`,
        method: 'GET',
      }),
      transformResponse: (response, meta, arg) => {
        return mockConversations.find(c => c.id === arg) || mockConversations[0];
      },
      providesTags: (result, error, id) => [{ type: 'Conversation', id }],
    }),

    createConversation: builder.mutation<Conversation, CreateConversationRequest>({
      query: (data) => ({
        url: '/conversations',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response, meta, arg) => {
        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          name: arg.name,
          type: arg.type,
          description: arg.description || '',
          participantCount: arg.participantIds?.length || 1,
          participants: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'user-1',
          isActive: true,
          settings: {
            notificationsEnabled: true,
            muteUntil: null,
          },
        };
        mockConversations.push(newConversation);
        return newConversation;
      },
      invalidatesTags: ['Conversation'],
    }),

    // Message endpoints
    getMessages: builder.query<PaginatedMessages, { conversationId: string; page?: number; pageSize?: number }>({
      query: ({ conversationId }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: 'GET',
      }),
      transformResponse: (response, meta, arg) => {
        const messages = mockMessages[arg.conversationId] || [];
        return {
          messages: messages.reverse(), // Show newest first
          total: messages.length,
          page: 1,
          pageSize: 50,
        };
      },
      providesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId },
      ],
    }),

    sendMessage: builder.mutation<Message, SendMessageRequest>({
      query: (data) => ({
        url: `/conversations/${data.conversationId}/messages`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response, meta, arg) => {
        const newMessage: Message = {
          id: `msg-${messageIdCounter++}`,
          conversationId: arg.conversationId,
          senderId: 'user-1',
          sender: { id: 'user-1', name: 'You', email: 'you@example.com' },
          content: arg.content,
          type: arg.type || 'text',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          reactions: [],
          readReceipts: [],
          attachments: arg.attachments || [],
          replyTo: arg.replyToId ? mockMessages[arg.conversationId]?.find(m => m.id === arg.replyToId) : undefined,
        };
        
        if (!mockMessages[arg.conversationId]) {
          mockMessages[arg.conversationId] = [];
        }
        mockMessages[arg.conversationId].push(newMessage);
        
        // Update conversation's last message
        const conversation = mockConversations.find(c => c.id === arg.conversationId);
        if (conversation) {
          conversation.lastMessage = newMessage;
          conversation.updatedAt = newMessage.createdAt;
        }
        
        return newMessage;
      },
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: conversationId },
      ],
    }),

    // Other required endpoints with minimal implementation
    updateConversation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/conversations/${id}`,
        method: 'PATCH',
        body: data,
      }),
    }),

    archiveConversation: builder.mutation({
      query: (id) => ({
        url: `/conversations/${id}/archive`,
        method: 'POST',
      }),
    }),

    markAsRead: builder.mutation({
      query: ({ conversationId, messageIds }) => ({
        url: `/conversations/${conversationId}/read`,
        method: 'POST',
        body: { messageIds },
      }),
    }),

    editMessage: builder.mutation({
      query: ({ id, content }) => ({
        url: `/messages/${id}`,
        method: 'PATCH',
        body: { content },
      }),
    }),

    deleteMessage: builder.mutation({
      query: (id) => ({
        url: `/messages/${id}`,
        method: 'DELETE',
      }),
    }),

    addReaction: builder.mutation({
      query: ({ messageId, emoji }) => ({
        url: `/messages/${messageId}/reactions`,
        method: 'POST',
        body: { emoji },
      }),
    }),

    removeReaction: builder.mutation({
      query: ({ messageId, emoji }) => ({
        url: `/messages/${messageId}/reactions/${emoji}`,
        method: 'DELETE',
      }),
    }),

    updatePresence: builder.mutation({
      query: (data) => ({
        url: '/presence',
        method: 'PUT',
        body: data,
      }),
    }),

    getOnlineUsers: builder.query({
      query: () => ({
        url: '/presence/online',
        method: 'GET',
      }),
    }),

    searchMessages: builder.query({
      query: (params) => ({
        url: '/messages/search',
        method: 'GET',
        params,
      }),
    }),

    // Add other endpoints as stubs
    addParticipants: builder.mutation({
      query: ({ conversationId, userIds }) => ({
        url: `/conversations/${conversationId}/participants`,
        method: 'POST',
        body: { userIds },
      }),
    }),

    removeParticipant: builder.mutation({
      query: ({ conversationId, userId }) => ({
        url: `/conversations/${conversationId}/participants/${userId}`,
        method: 'DELETE',
      }),
    }),

    muteConversation: builder.mutation({
      query: ({ conversationId, until }) => ({
        url: `/conversations/${conversationId}/mute`,
        method: 'POST',
        body: { until },
      }),
    }),

    unmuteConversation: builder.mutation({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}/unmute`,
        method: 'POST',
      }),
    }),

    pinMessage: builder.mutation({
      query: (messageId) => ({
        url: `/messages/${messageId}/pin`,
        method: 'POST',
      }),
    }),

    unpinMessage: builder.mutation({
      query: (messageId) => ({
        url: `/messages/${messageId}/unpin`,
        method: 'POST',
      }),
    }),

    getPinnedMessages: builder.query({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}/pinned`,
        method: 'GET',
      }),
    }),

    bookmarkMessage: builder.mutation({
      query: (messageId) => ({
        url: `/messages/${messageId}/bookmark`,
        method: 'POST',
      }),
    }),

    unbookmarkMessage: builder.mutation({
      query: (messageId) => ({
        url: `/messages/${messageId}/unbookmark`,
        method: 'POST',
      }),
    }),

    getBookmarkedMessages: builder.query({
      query: () => ({
        url: '/messages/bookmarked',
        method: 'GET',
      }),
    }),

    getUserPresence: builder.query({
      query: (userId) => ({
        url: `/presence/${userId}`,
        method: 'GET',
      }),
    }),
  }),
});

// Export hooks for usage in functional components
export const {
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
  useUpdatePresenceMutation,
  useGetOnlineUsersQuery,
  useGetUserPresenceQuery,
} = mockChatApi;