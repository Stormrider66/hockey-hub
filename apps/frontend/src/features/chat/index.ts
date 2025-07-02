// Main chat components
export { default as ChatLayout } from './components/ChatLayout';
export { default as ConversationList } from './components/ConversationList';
export { default as ConversationItem } from './components/ConversationItem';
export { default as MessageArea } from './components/MessageArea';

// Message components
export { default as MessageList } from './components/MessageList';
export { default as MessageItem } from './components/MessageItem';
export { default as MessageInput } from './components/MessageInput';

// Modal components
export { default as NewConversationModal } from './components/NewConversationModal';
export { default as ConversationInfoModal } from './components/ConversationInfoModal';

// Utility components
export { default as LoadingSkeleton } from './components/LoadingSkeleton';
export { default as TypingIndicator, CompactTypingIndicator } from './components/TypingIndicator';
export { default as EmojiPicker } from './components/EmojiPicker';
export { default as FileUpload } from './components/FileUpload';

// Phase 3 - Core Features
export { default as QuickMessageAction } from './components/QuickMessageAction';
export { default as MessageSearch } from './components/MessageSearch';
export { default as TeamConversationManager } from './components/TeamConversationManager';
export { default as BookmarkedMessages } from './components/BookmarkedMessages';
export { default as JumpToDate } from './components/JumpToDate';

// Phase 4 - Advanced Features  
export { default as EncryptionSettings } from './components/EncryptionSettings';

// Training Discussion Components
export { default as TrainingDiscussionThread } from './components/TrainingDiscussionThread';
export { default as ExerciseFeedback } from './components/ExerciseFeedback';

// Performance Discussion Components
export { default as PerformanceDiscussion } from './components/PerformanceDiscussion';
export { default as CreatePerformanceReview } from './components/CreatePerformanceReview';

// Schedule Clarification Components
export { ScheduleClarificationChat } from './components/ScheduleClarificationChat';
export { ScheduleConflictModal } from './components/ScheduleConflictModal';
export { CreateCarpoolOfferModal } from './components/CreateCarpoolOfferModal';
export { CarpoolOfferCard } from './components/CarpoolOfferCard';
export { CreateAvailabilityPollModal } from './components/CreateAvailabilityPollModal';
export { AvailabilityPollCard } from './components/AvailabilityPollCard';
export { WeatherAlert } from './components/WeatherAlert';
export { ConflictResolutionCard } from './components/ConflictResolutionCard';

// Context
export { default as ChatSocketContext, ChatSocketProvider, useChatSocket } from '../contexts/ChatSocketContext';

// Types
export type {
  Conversation,
  Message,
  MessageAttachment,
  MessageReaction,
  MessageReadReceipt,
  UserPresence,
  User,
  ConversationParticipant,
  CreateConversationRequest,
  UpdateConversationRequest,
  SendMessageRequest,
  EditMessageRequest,
  AddReactionRequest,
  UpdatePresenceRequest,
  SearchMessagesRequest,
  PaginatedMessages,
  PaginatedConversations,
} from '../store/api/chatApi';

export type {
  ChatState,
  TypingUser,
} from '../store/slices/chatSlice';

// Hooks
export {
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
} from '../store/api/chatApi';

// Schedule Clarification hooks
export {
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
} from '../store/api/scheduleClarificationApi';

// Redux actions and selectors
export {
  // Actions
  openChat,
  closeChat,
  toggleChat,
  toggleConversationList,
  setActiveConversation,
  setConnected,
  setConnecting,
  addTypingUser,
  removeTypingUser,
  clearOldTypingUsers,
  setTyping,
  setUnreadCount,
  incrementUnreadCount,
  clearUnreadCount,
  setSearchQuery,
  setSearchResults,
  setSearching,
  clearSearch,
  toggleMessageSelection,
  clearMessageSelection,
  selectAllMessages,
  setDraftMessage,
  clearDraftMessage,
  updateUserPresence,
  removeUserPresence,
  addRecentEmoji,
  setNotificationPermission,
  toggleBookmark,
  setBookmarkedMessages,
  setShowingBookmarks,
  toggleShowingBookmarks,
  resetChatState,

  // Selectors
  selectChatState,
  selectActiveConversationId,
  selectIsChatOpen,
  selectIsConnected,
  selectTotalUnreadCount,
  selectUnreadCount,
  selectTypingUsersForConversation,
  selectDraftMessage,
  selectUserPresence,
  selectRecentEmojis,
  selectBookmarkedMessages,
  selectIsShowingBookmarks,
  selectIsMessageBookmarked,
} from '../store/slices/chatSlice';