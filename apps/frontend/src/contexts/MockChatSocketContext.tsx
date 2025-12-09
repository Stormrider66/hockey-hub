import React, { createContext, useContext, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';

interface ChatSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string, replyToId?: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  updatePresence: (status: 'online' | 'away' | 'offline', statusMessage?: string) => void;
  markMessagesAsRead: (conversationId: string, messageIds: string[]) => void;
  reconnect: () => void;
}

const MockChatSocketContext = createContext<ChatSocketContextType>({
  socket: null,
  isConnected: false,
  isConnecting: false,
  joinConversation: () => {},
  leaveConversation: () => {},
  sendMessage: () => {},
  editMessage: () => {},
  deleteMessage: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  updatePresence: () => {},
  markMessagesAsRead: () => {},
  reconnect: () => {},
});

export const MockChatSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected] = useState(false);
  const [isConnecting] = useState(false);

  // Mock implementations that do nothing but won't error
  const joinConversation = useCallback((conversationId: string) => {
    console.log('[Mock] Joining conversation:', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    console.log('[Mock] Leaving conversation:', conversationId);
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string, replyToId?: string) => {
    console.log('[Mock] Sending message:', { conversationId, content, replyToId });
  }, []);

  const editMessage = useCallback((messageId: string, content: string) => {
    console.log('[Mock] Editing message:', { messageId, content });
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    console.log('[Mock] Deleting message:', messageId);
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    console.log('[Mock] Start typing in:', conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    console.log('[Mock] Stop typing in:', conversationId);
  }, []);

  const updatePresence = useCallback((status: 'online' | 'away' | 'offline', statusMessage?: string) => {
    console.log('[Mock] Update presence:', { status, statusMessage });
  }, []);

  const markMessagesAsRead = useCallback((conversationId: string, messageIds: string[]) => {
    console.log('[Mock] Mark messages as read:', { conversationId, messageIds });
  }, []);

  const reconnect = useCallback(() => {
    console.log('[Mock] Reconnect requested');
  }, []);

  const contextValue: ChatSocketContextType = {
    socket: null,
    isConnected,
    isConnecting,
    joinConversation,
    leaveConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    updatePresence,
    markMessagesAsRead,
    reconnect,
  };

  return (
    <MockChatSocketContext.Provider value={contextValue}>
      {children}
    </MockChatSocketContext.Provider>
  );
};

export const useChatSocket = () => {
  const context = useContext(MockChatSocketContext);
  if (!context) {
    throw new Error('useChatSocket must be used within a ChatSocketProvider');
  }
  return context;
};

// Export with the same names as the real ChatSocketContext for compatibility
export const ChatSocketContext = MockChatSocketContext;
export const ChatSocketProvider = MockChatSocketProvider;

export default MockChatSocketContext;