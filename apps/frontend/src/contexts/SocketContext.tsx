'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { socketService, SocketConnectionState, SocketEventHandlers } from '../services/SocketService';
import { useAuth } from './AuthContext';

interface SocketContextType {
  connectionState: SocketConnectionState;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  updatePresence: (status: 'online' | 'away' | 'busy' | 'offline') => void;
  markNotificationAsRead: (notificationId: string) => void;
  setEventHandlers: (handlers: SocketEventHandlers) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const [connectionState, setConnectionState] = useState<SocketConnectionState>(
    socketService.getConnectionState()
  );

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = socketService.subscribeToState(setConnectionState);
    return unsubscribe;
  }, []);

  // Auto-connect when user is authenticated
  useEffect(() => {
    // Skip socket connection in mock mode
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    if (isMockMode) {
      console.log('Mock mode enabled, skipping general socket connection');
      return;
    }

    if (user && token && !socketService.isConnected()) {
      console.log('🔌 Auto-connecting socket for user:', user.email);
      socketService.connect(token);
    } else if (!user && socketService.isConnected()) {
      console.log('🔌 Disconnecting socket - user logged out');
      socketService.disconnect();
    }
  }, [user, token]);

  // Update presence based on page visibility
  useEffect(() => {
    if (!socketService.isConnected()) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        socketService.updatePresence('online');
      } else {
        socketService.updatePresence('away');
      }
    };

    const handleBeforeUnload = () => {
      socketService.updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Set initial presence
    socketService.updatePresence('online');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [connectionState.connected]);

  const connect = useCallback(() => {
    if (token) {
      socketService.connect(token);
    }
  }, [token]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketService.emit(event, data);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketService.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketService.leaveConversation(conversationId);
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    socketService.startTyping(conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketService.stopTyping(conversationId);
  }, []);

  const updatePresence = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    socketService.updatePresence(status);
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    socketService.markNotificationAsRead(notificationId);
  }, []);

  const setEventHandlers = useCallback((handlers: SocketEventHandlers) => {
    socketService.setEventHandlers(handlers);
  }, []);

  const value: SocketContextType = {
    connectionState,
    isConnected: connectionState.connected,
    connect,
    disconnect,
    emit,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    updatePresence,
    markNotificationAsRead,
    setEventHandlers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Additional hooks for specific socket functionality

/**
 * Hook for managing typing indicators in conversations
 */
export const useTypingIndicator = (conversationId: string) => {
  const { startTyping, stopTyping, setEventHandlers } = useSocket();
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userEmail: string }>>([]);

  useEffect(() => {
    const handlers: SocketEventHandlers = {
      onUserTyping: (data) => {
        if (data.conversationId === conversationId) {
          setTypingUsers(prev => {
            const existing = prev.find(u => u.userId === data.userId);
            if (!existing) {
              return [...prev, { userId: data.userId, userEmail: data.userEmail }];
            }
            return prev;
          });
        }
      },
      onUserTypingStop: (data) => {
        if (data.conversationId === conversationId) {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      }
    };

    setEventHandlers(handlers);

    return () => {
      setEventHandlers({});
    };
  }, [conversationId, setEventHandlers]);

  const handleStartTyping = useCallback(() => {
    startTyping(conversationId);
  }, [conversationId, startTyping]);

  const handleStopTyping = useCallback(() => {
    stopTyping(conversationId);
  }, [conversationId, stopTyping]);

  return {
    typingUsers,
    startTyping: handleStartTyping,
    stopTyping: handleStopTyping
  };
};

/**
 * Hook for managing user presence
 */
export const usePresence = () => {
  const { setEventHandlers, updatePresence } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [userPresence, setUserPresence] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const handlers: SocketEventHandlers = {
      onUserOnline: (data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
        setUserPresence(prev => new Map(prev).set(data.userId, 'online'));
      },
      onUserOffline: (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
        setUserPresence(prev => new Map(prev).set(data.userId, 'offline'));
      },
      onUserPresence: (data) => {
        setUserPresence(prev => new Map(prev).set(data.userId, data.status));
        
        if (data.status === 'offline') {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        } else {
          setOnlineUsers(prev => new Set([...prev, data.userId]));
        }
      }
    };

    setEventHandlers(handlers);

    return () => {
      setEventHandlers({});
    };
  }, [setEventHandlers]);

  return {
    onlineUsers,
    userPresence,
    updatePresence,
    isUserOnline: (userId: string) => onlineUsers.has(userId),
    getUserPresence: (userId: string) => userPresence.get(userId) || 'offline'
  };
};

/**
 * Hook for real-time notifications
 */
export const useRealtimeNotifications = () => {
  const { setEventHandlers, markNotificationAsRead } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handlers: SocketEventHandlers = {
      onNotification: (data) => {
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
      },
      onNotificationRead: (data) => {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === data.notificationId 
              ? { ...notification, readAt: data.timestamp, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    setEventHandlers(handlers);

    return () => {
      setEventHandlers({});
    };
  }, [setEventHandlers]);

  const markAsRead = useCallback((notificationId: string) => {
    markNotificationAsRead(notificationId);
  }, [markNotificationAsRead]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications
  };
};

export default SocketContext;