import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setConnected,
  setConnecting,
  addTypingUser,
  removeTypingUser,
  incrementUnreadCount,
  clearUnreadCount,
  updateUserPresence,
  removeUserPresence,
  selectActiveConversationId,
  selectIsChatOpen,
} from '../store/slices/chatSlice';
import { chatApi } from '../store/api/chatApi';
import { useCreateNotificationMutation } from '../store/api/notificationApi';
import type { Message, MessageReaction, UserPresence, Conversation } from '../store/api/chatApi';

// Socket event types
interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:deleted': (messageId: string) => void;
  'reaction:added': (reaction: MessageReaction) => void;
  'reaction:removed': (data: { messageId: string; userId: string; emoji: string }) => void;
  'typing:start': (data: { userId: string; userName: string; conversationId: string }) => void;
  'typing:stop': (data: { userId: string; conversationId: string }) => void;
  'presence:updated': (presence: UserPresence) => void;
  'conversation:updated': (conversation: Conversation) => void;
  'participant:added': (data: { conversationId: string; userId: string }) => void;
  'participant:removed': (data: { conversationId: string; userId: string }) => void;
  'read:receipts': (data: { messageId: string; userId: string; readAt: string }) => void;
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
}

interface ClientToServerEvents {
  'conversation:join': (conversationId: string) => void;
  'conversation:leave': (conversationId: string) => void;
  'message:send': (data: { conversationId: string; content: string; type?: string; replyToId?: string }) => void;
  'message:edit': (data: { messageId: string; content: string }) => void;
  'message:delete': (messageId: string) => void;
  'typing:start': (conversationId: string) => void;
  'typing:stop': (conversationId: string) => void;
  'presence:update': (data: { status: 'online' | 'away' | 'offline'; statusMessage?: string }) => void;
  'message:read': (data: { conversationId: string; messageIds: string[] }) => void;
}

interface ChatSocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
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

const ChatSocketContext = createContext<ChatSocketContextType | null>(null);

interface ChatSocketProviderProps {
  children: React.ReactNode;
  apiUrl?: string;
}

export const ChatSocketProvider: React.FC<ChatSocketProviderProps> = ({ 
  children, 
  apiUrl = process.env.NEXT_PUBLIC_COMMUNICATION_API_URL || 'http://localhost:3002' 
}) => {
  const dispatch = useAppDispatch();
  const activeConversationId = useAppSelector(selectActiveConversationId);
  const isChatOpen = useAppSelector(selectIsChatOpen);
  
  // Get auth token from localStorage
  const getAuthToken = useCallback(() => localStorage.getItem('access_token'), []);
  const getCurrentUserId = useCallback(() => {
    // TODO: Get actual current user ID from token or user API
    return localStorage.getItem('current_user_id') || 'current-user-id';
  }, []);
  
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnectedState] = useState(false);
  const [isConnecting, setIsConnectingState] = useState(false);
  
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const joinedConversations = useRef<Set<string>>(new Set());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    // Skip socket connection in mock mode
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    if (isMockMode) {
      console.log('Mock mode enabled, skipping chat socket connection');
      return;
    }

    const token = getAuthToken();
    if (!token || socket?.connected) return;

    setIsConnectingState(true);
    dispatch(setConnecting(true));

    const newSocket = io(`${apiUrl}/chat`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Chat socket connected');
      setIsConnectedState(true);
      setIsConnectingState(false);
      dispatch(setConnected(true));
      reconnectAttempts.current = 0;

      // Rejoin conversations that were previously joined
      joinedConversations.current.forEach(conversationId => {
        newSocket.emit('conversation:join', conversationId);
      });

      // Update presence to online
      newSocket.emit('presence:update', { status: 'online' });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Chat socket disconnected:', reason);
      setIsConnectedState(false);
      dispatch(setConnected(false));
    });

    newSocket.on('connect_error', (error) => {
      console.error('Chat socket connection error:', error);
      setIsConnectingState(false);
      dispatch(setConnecting(false));
      
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Message events
    newSocket.on('message:new', (message) => {
      // Update cache with new message
      dispatch(
        chatApi.util.updateQueryData('getMessages', { conversationId: message.conversationId }, (draft) => {
          // Avoid duplicates
          const exists = draft.messages.some(msg => msg.id === message.id);
          if (!exists) {
            draft.messages.unshift(message);
          }
        })
      );

      // Update conversation last message
      dispatch(
        chatApi.util.updateQueryData('getConversations', {}, (draft) => {
          const conversation = draft.conversations.find(conv => conv.id === message.conversationId);
          if (conversation) {
            conversation.lastMessage = message;
            conversation.updatedAt = message.createdAt;
          }
        })
      );

      // Increment unread count if not in active conversation or chat is closed
      if (message.conversationId !== activeConversationId || !isChatOpen) {
        dispatch(incrementUnreadCount(message.conversationId));
        
        // Create notification through the notification system
        // This will be handled by the NotificationContext
        if (message.senderId !== getCurrentUserId()) {
          // The backend should create the notification, but if not, we can trigger it from here
        }
      }
    });

    newSocket.on('message:updated', (message) => {
      dispatch(
        chatApi.util.updateQueryData('getMessages', { conversationId: message.conversationId }, (draft) => {
          const index = draft.messages.findIndex(msg => msg.id === message.id);
          if (index !== -1) {
            draft.messages[index] = message;
          }
        })
      );
    });

    newSocket.on('message:deleted', (messageId) => {
      // Update message in joined conversations
      joinedConversations.current.forEach(conversationId => {
        dispatch(
          chatApi.util.updateQueryData('getMessages', { conversationId }, (draft) => {
            const message = draft.messages.find(msg => msg.id === messageId);
            if (message) {
              message.deletedAt = new Date().toISOString();
              message.content = 'This message was deleted';
            }
          })
        );
      });
    });

    // Reaction events
    newSocket.on('reaction:added', (reaction) => {
      // Update reaction in joined conversations
      joinedConversations.current.forEach(conversationId => {
        dispatch(
          chatApi.util.updateQueryData('getMessages', { conversationId }, (draft) => {
            const message = draft.messages.find(msg => msg.id === reaction.messageId);
            if (message) {
              const existingReaction = message.reactions.find(
                r => r.userId === reaction.userId && r.emoji === reaction.emoji
              );
              if (!existingReaction) {
                message.reactions.push(reaction);
              }
            }
          })
        );
      });
    });

    newSocket.on('reaction:removed', ({ messageId, userId, emoji }) => {
      // Update reaction removal in joined conversations
      joinedConversations.current.forEach(conversationId => {
        dispatch(
          chatApi.util.updateQueryData('getMessages', { conversationId }, (draft) => {
            const message = draft.messages.find(msg => msg.id === messageId);
            if (message) {
              message.reactions = message.reactions.filter(
                r => !(r.userId === userId && r.emoji === emoji)
              );
            }
          })
        );
      });
    });

    // Typing events
    newSocket.on('typing:start', ({ userId, userName, conversationId }) => {
      if (userId !== getCurrentUserId()) {
        dispatch(addTypingUser({
          userId,
          userName,
          conversationId,
          timestamp: Date.now(),
        }));
      }
    });

    newSocket.on('typing:stop', ({ userId, conversationId }) => {
      dispatch(removeTypingUser({ userId, conversationId }));
    });

    // Presence events
    newSocket.on('presence:updated', (presence) => {
      dispatch(updateUserPresence(presence));
    });

    // Conversation events
    newSocket.on('conversation:updated', (conversation) => {
      dispatch(
        chatApi.util.updateQueryData('getConversations', {}, (draft) => {
          const index = draft.conversations.findIndex(conv => conv.id === conversation.id);
          if (index !== -1) {
            draft.conversations[index] = conversation;
          }
        })
      );
    });

    newSocket.on('participant:added', ({ conversationId, userId }) => {
      // Invalidate conversation data to refetch with new participant
      dispatch(chatApi.util.invalidateTags([{ type: 'Conversation', id: conversationId }]));
    });

    newSocket.on('participant:removed', ({ conversationId, userId }) => {
      // Invalidate conversation data to refetch without removed participant
      dispatch(chatApi.util.invalidateTags([{ type: 'Conversation', id: conversationId }]));
    });

    newSocket.on('read:receipts', ({ messageId, userId, readAt }) => {
      // Update read receipts for the message across joined conversations
      joinedConversations.current.forEach(conversationId => {
        dispatch(
          chatApi.util.updateQueryData('getMessages', { conversationId }, (draft) => {
            const message = draft.messages.find(msg => msg.id === messageId);
            if (message) {
              const existingReceipt = message.readReceipts.find(r => r.userId === userId);
              if (existingReceipt) {
                existingReceipt.readAt = readAt;
              } else {
                message.readReceipts.push({
                  messageId,
                  userId,
                  user: { id: userId, name: '', email: '' },
                  readAt,
                });
              }
            }
          })
        );
      });
    });

    setSocket(newSocket);
  }, [getAuthToken, getCurrentUserId, dispatch, apiUrl, activeConversationId, isChatOpen]);

  // Clean up socket on unmount or auth change
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      initializeSocket();
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnectedState(false);
        dispatch(setConnected(false));
      }
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [getAuthToken, initializeSocket]);

  // Context methods
  const joinConversation = useCallback((conversationId: string) => {
    if (socket?.connected) {
      socket.emit('conversation:join', conversationId);
      joinedConversations.current.add(conversationId);
    }
  }, [socket]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket?.connected) {
      socket.emit('conversation:leave', conversationId);
      joinedConversations.current.delete(conversationId);
    }
  }, [socket]);

  const sendMessage = useCallback((conversationId: string, content: string, replyToId?: string) => {
    if (socket?.connected) {
      socket.emit('message:send', { conversationId, content, replyToId });
    }
  }, [socket]);

  const editMessage = useCallback((messageId: string, content: string) => {
    if (socket?.connected) {
      socket.emit('message:edit', { messageId, content });
    }
  }, [socket]);

  const deleteMessage = useCallback((messageId: string) => {
    if (socket?.connected) {
      socket.emit('message:delete', messageId);
    }
  }, [socket]);

  const startTyping = useCallback((conversationId: string) => {
    if (socket?.connected) {
      socket.emit('typing:start', conversationId);
      
      // Auto-stop typing after 5 seconds
      if (typingTimeouts.current[conversationId]) {
        clearTimeout(typingTimeouts.current[conversationId]);
      }
      
      typingTimeouts.current[conversationId] = setTimeout(() => {
        stopTyping(conversationId);
      }, 5000);
    }
  }, [socket]);

  const stopTyping = useCallback((conversationId: string) => {
    if (socket?.connected) {
      socket.emit('typing:stop', conversationId);
      
      if (typingTimeouts.current[conversationId]) {
        clearTimeout(typingTimeouts.current[conversationId]);
        delete typingTimeouts.current[conversationId];
      }
    }
  }, [socket]);

  const updatePresence = useCallback((status: 'online' | 'away' | 'offline', statusMessage?: string) => {
    if (socket?.connected) {
      socket.emit('presence:update', { status, statusMessage });
    }
  }, [socket]);

  const markMessagesAsRead = useCallback((conversationId: string, messageIds: string[]) => {
    if (socket?.connected) {
      socket.emit('message:read', { conversationId, messageIds });
      dispatch(clearUnreadCount(conversationId));
    }
  }, [socket, dispatch]);

  const reconnect = useCallback(() => {
    if (socket && !socket.connected) {
      socket.connect();
    } else {
      initializeSocket();
    }
  }, [socket, initializeSocket]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (socket?.connected) {
        if (document.hidden) {
          updatePresence('away');
        } else {
          updatePresence('online');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [socket, updatePresence]);

  // Auto-join active conversation
  useEffect(() => {
    if (activeConversationId && socket?.connected) {
      joinConversation(activeConversationId);
    }
  }, [activeConversationId, socket?.connected, joinConversation]);

  const contextValue = useMemo(() => ({
    socket,
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
  }), [
    socket,
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
  ]);

  return (
    <ChatSocketContext.Provider value={contextValue}>
      {children}
    </ChatSocketContext.Provider>
  );
};

export const useChatSocket = () => {
  const context = useContext(ChatSocketContext);
  if (!context) {
    throw new Error('useChatSocket must be used within a ChatSocketProvider');
  }
  return context;
};

export default ChatSocketContext;