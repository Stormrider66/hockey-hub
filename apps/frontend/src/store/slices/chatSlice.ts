import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Conversation, Message, UserPresence } from '../api/chatApi';

export interface TypingUser {
  userId: string;
  userName: string;
  conversationId: string;
  timestamp: number;
}

export interface ChatState {
  // Active conversation
  activeConversationId?: string;
  
  // UI state
  isChatOpen: boolean;
  isConversationListOpen: boolean;
  
  // Typing indicators
  typingUsers: TypingUser[];
  isTyping: Record<string, boolean>; // conversationId -> boolean
  
  // Unread counts
  totalUnreadCount: number;
  unreadCounts: Record<string, number>; // conversationId -> count
  
  // Connection status
  isConnected: boolean;
  isConnecting: boolean;
  
  // Search state
  searchQuery: string;
  searchResults: Message[];
  isSearching: boolean;
  
  // Message selection (for forwarding, deleting, etc.)
  selectedMessages: string[];
  
  // Draft messages
  draftMessages: Record<string, string>; // conversationId -> draft content
  
  // Presence data
  userPresence: Record<string, UserPresence>; // userId -> presence
  
  // Recently used emojis
  recentEmojis: string[];
  
  // Notification permissions
  notificationPermission: 'default' | 'granted' | 'denied';
  
  // Bookmarked messages
  bookmarkedMessages: string[]; // message IDs
  isShowingBookmarks: boolean;
}

const initialState: ChatState = {
  isChatOpen: false,
  isConversationListOpen: true,
  typingUsers: [],
  isTyping: {},
  totalUnreadCount: 0,
  unreadCounts: {},
  isConnected: false,
  isConnecting: false,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  selectedMessages: [],
  draftMessages: {},
  userPresence: {},
  recentEmojis: ['👍', '❤️', '😄', '😢', '😮', '😡'],
  notificationPermission: 'default',
  bookmarkedMessages: [],
  isShowingBookmarks: false,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Chat UI actions
    openChat: (state) => {
      state.isChatOpen = true;
    },
    
    closeChat: (state) => {
      state.isChatOpen = false;
    },
    
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
    },
    
    toggleConversationList: (state) => {
      state.isConversationListOpen = !state.isConversationListOpen;
    },
    
    setActiveConversation: (state, action: PayloadAction<string | undefined>) => {
      state.activeConversationId = action.payload;
      // Clear typing indicator when switching conversations
      if (action.payload) {
        state.isTyping[action.payload] = false;
      }
    },
    
    // Connection status
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      state.isConnecting = false;
    },
    
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    
    // Typing indicators
    addTypingUser: (state, action: PayloadAction<TypingUser>) => {
      const existingIndex = state.typingUsers.findIndex(
        (user) => user.userId === action.payload.userId && user.conversationId === action.payload.conversationId
      );
      
      if (existingIndex !== -1) {
        state.typingUsers[existingIndex].timestamp = action.payload.timestamp;
      } else {
        state.typingUsers.push(action.payload);
      }
    },
    
    removeTypingUser: (state, action: PayloadAction<{ userId: string; conversationId: string }>) => {
      state.typingUsers = state.typingUsers.filter(
        (user) => !(user.userId === action.payload.userId && user.conversationId === action.payload.conversationId)
      );
    },
    
    clearOldTypingUsers: (state) => {
      const now = Date.now();
      const TYPING_TIMEOUT = 5000; // 5 seconds
      state.typingUsers = state.typingUsers.filter(
        (user) => now - user.timestamp < TYPING_TIMEOUT
      );
    },
    
    setTyping: (state, action: PayloadAction<{ conversationId: string; isTyping: boolean }>) => {
      state.isTyping[action.payload.conversationId] = action.payload.isTyping;
    },
    
    // Unread counts
    setUnreadCount: (state, action: PayloadAction<{ conversationId: string; count: number }>) => {
      const { conversationId, count } = action.payload;
      const oldCount = state.unreadCounts[conversationId] || 0;
      state.unreadCounts[conversationId] = count;
      state.totalUnreadCount = state.totalUnreadCount - oldCount + count;
    },
    
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      state.unreadCounts[conversationId] = (state.unreadCounts[conversationId] || 0) + 1;
      state.totalUnreadCount += 1;
    },
    
    clearUnreadCount: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const oldCount = state.unreadCounts[conversationId] || 0;
      state.unreadCounts[conversationId] = 0;
      state.totalUnreadCount = Math.max(0, state.totalUnreadCount - oldCount);
    },
    
    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    setSearchResults: (state, action: PayloadAction<Message[]>) => {
      state.searchResults = action.payload;
    },
    
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearching = false;
    },
    
    // Message selection
    toggleMessageSelection: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      const index = state.selectedMessages.indexOf(messageId);
      if (index !== -1) {
        state.selectedMessages.splice(index, 1);
      } else {
        state.selectedMessages.push(messageId);
      }
    },
    
    clearMessageSelection: (state) => {
      state.selectedMessages = [];
    },
    
    selectAllMessages: (state, action: PayloadAction<string[]>) => {
      state.selectedMessages = action.payload;
    },
    
    // Draft messages
    setDraftMessage: (state, action: PayloadAction<{ conversationId: string; content: string }>) => {
      const { conversationId, content } = action.payload;
      if (content.trim()) {
        state.draftMessages[conversationId] = content;
      } else {
        delete state.draftMessages[conversationId];
      }
    },
    
    clearDraftMessage: (state, action: PayloadAction<string>) => {
      delete state.draftMessages[action.payload];
    },
    
    // User presence
    updateUserPresence: (state, action: PayloadAction<UserPresence>) => {
      state.userPresence[action.payload.userId] = action.payload;
    },
    
    removeUserPresence: (state, action: PayloadAction<string>) => {
      delete state.userPresence[action.payload];
    },
    
    // Emojis
    addRecentEmoji: (state, action: PayloadAction<string>) => {
      const emoji = action.payload;
      const existingIndex = state.recentEmojis.indexOf(emoji);
      
      if (existingIndex !== -1) {
        state.recentEmojis.splice(existingIndex, 1);
      }
      
      state.recentEmojis.unshift(emoji);
      
      // Keep only the 20 most recent emojis
      if (state.recentEmojis.length > 20) {
        state.recentEmojis = state.recentEmojis.slice(0, 20);
      }
    },
    
    // Notification permission
    setNotificationPermission: (state, action: PayloadAction<'default' | 'granted' | 'denied'>) => {
      state.notificationPermission = action.payload;
    },
    
    // Bookmarks
    toggleBookmark: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      const index = state.bookmarkedMessages.indexOf(messageId);
      if (index !== -1) {
        state.bookmarkedMessages.splice(index, 1);
      } else {
        state.bookmarkedMessages.push(messageId);
      }
    },
    
    setBookmarkedMessages: (state, action: PayloadAction<string[]>) => {
      state.bookmarkedMessages = action.payload;
    },
    
    setShowingBookmarks: (state, action: PayloadAction<boolean>) => {
      state.isShowingBookmarks = action.payload;
    },
    
    toggleShowingBookmarks: (state) => {
      state.isShowingBookmarks = !state.isShowingBookmarks;
    },
    
    // Reset state (for logout)
    resetChatState: () => initialState,
  },
});

export const {
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
} = chatSlice.actions;

// Selectors
export const selectChatState = (state: { chat: ChatState }) => state.chat;
export const selectActiveConversationId = (state: { chat: ChatState }) => state.chat.activeConversationId;
export const selectIsChatOpen = (state: { chat: ChatState }) => state.chat.isChatOpen;
export const selectIsConnected = (state: { chat: ChatState }) => state.chat.isConnected;
export const selectTotalUnreadCount = (state: { chat: ChatState }) => state.chat.totalUnreadCount;
export const selectUnreadCount = (conversationId: string) => (state: { chat: ChatState }) => 
  state.chat.unreadCounts[conversationId] || 0;
export const selectTypingUsersForConversation = (conversationId: string) => (state: { chat: ChatState }) =>
  state.chat.typingUsers.filter(user => user.conversationId === conversationId);
export const selectDraftMessage = (conversationId: string) => (state: { chat: ChatState }) =>
  state.chat.draftMessages[conversationId] || '';
export const selectUserPresence = (userId: string) => (state: { chat: ChatState }) =>
  state.chat.userPresence[userId];
export const selectRecentEmojis = (state: { chat: ChatState }) => state.chat.recentEmojis;
export const selectBookmarkedMessages = (state: { chat: ChatState }) => state.chat.bookmarkedMessages;
export const selectIsShowingBookmarks = (state: { chat: ChatState }) => state.chat.isShowingBookmarks;
export const selectIsMessageBookmarked = (messageId: string) => (state: { chat: ChatState }) =>
  state.chat.bookmarkedMessages.includes(messageId);

export default chatSlice.reducer;