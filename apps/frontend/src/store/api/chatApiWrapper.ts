// This module exports the appropriate chat API based on the environment
const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';

// Conditionally export the appropriate API
export const chatApi = isMockMode 
  ? require('./mockChatApi').mockChatApi 
  : require('./chatApi').chatApi;

// Re-export all hooks
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
} = chatApi;