import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useGetUnreadCountQuery, notificationApi } from '@/store/api/notificationApi';
import { useDispatch } from 'react-redux';
import type { Notification, NotificationType } from '@/store/api/notificationApi';

interface NotificationContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

const COMMUNICATION_SERVICE_URL = process.env.NEXT_PUBLIC_COMMUNICATION_SERVICE_URL || 'http://localhost:3002';

// Notification type icons
const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'MESSAGE':
      return '💬';
    case 'MENTION':
      return '@';
    case 'REACTION':
      return '😊';
    case 'CALENDAR_REMINDER':
    case 'TRAINING_REMINDER':
      return '⏰';
    case 'MEDICAL_APPOINTMENT':
    case 'MEDICAL_UPDATE':
    case 'MEDICAL_ALERT':
      return '🏥';
    case 'EQUIPMENT_READY':
    case 'EQUIPMENT_MAINTENANCE':
      return '🏒';
    case 'TRAINING_SCHEDULED':
    case 'TRAINING_UPDATED':
      return '🏋️';
    case 'ANNOUNCEMENT':
      return '📢';
    case 'ALERT':
      return '⚠️';
    default:
      return '🔔';
  }
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: unreadData } = useGetUnreadCountQuery();

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (Notification.permission === 'granted') {
      const icon = getNotificationIcon(notification.type);
      const browserNotif = new Notification(`${icon} ${notification.title}`, {
        body: notification.content,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        data: notification,
        requireInteraction: notification.priority === 'URGENT',
      });

      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
        
        // Navigate based on notification type
        if (notification.type === 'MESSAGE' && notification.data?.conversationId) {
          // Navigate to conversation
          window.location.href = `/chat?conversation=${notification.data.conversationId}`;
        }
      };
    }
  }, []);

  // Show in-app notification
  const showInAppNotification = useCallback((notification: Notification) => {
    const icon = getNotificationIcon(notification.type);
    
    // Show toast based on priority
    switch (notification.priority) {
      case 'URGENT':
        toast.error(`${icon} ${notification.title}\n${notification.content}`, {
          duration: 10000,
          position: 'top-right',
        });
        break;
      case 'HIGH':
        toast.success(`${icon} ${notification.title}\n${notification.content}`, {
          duration: 6000,
          position: 'top-right',
        });
        break;
      default:
        toast(`${icon} ${notification.title}\n${notification.content}`, {
          duration: 4000,
          position: 'top-right',
        });
    }
  }, []);

  // Combined notification handler
  const showNotification = useCallback((notification: Notification) => {
    // Always show in-app notification
    showInAppNotification(notification);

    // Show browser notification if page is not visible
    if (document.hidden) {
      showBrowserNotification(notification);
    }

    // Invalidate notification queries to update UI
    dispatch(notificationApi.util.invalidateTags(['Notification', 'NotificationStats']));
  }, [showInAppNotification, showBrowserNotification, dispatch]);

  // Initialize Socket.io connection
  useEffect(() => {
    // Skip WebSocket connection in mock mode
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    if (isMockMode) {
      console.log('Mock mode enabled, skipping notification socket connection');
      return;
    }

    const token = localStorage.getItem('access_token');
    const userId = localStorage.getItem('current_user_id');
    
    if (!token || !userId) {
      console.log('No auth token or user ID, skipping notification socket connection');
      return;
    }

    const newSocket = io(COMMUNICATION_SERVICE_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Notification socket connected');
      setIsConnected(true);
      
      // Join user's notification room
      newSocket.emit('join:notifications', userId);
    });

    newSocket.on('disconnect', () => {
      console.log('Notification socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Notification socket error:', error);
    });

    // Notification event handler
    newSocket.on('notification:new', (notification: Notification) => {
      console.log('New notification received:', notification);
      showNotification(notification);
    });

    // Real-time notification updates
    newSocket.on('notification:updated', (notification: Notification) => {
      console.log('Notification updated:', notification);
      dispatch(notificationApi.util.invalidateTags(['Notification']));
    });

    setSocket(newSocket);

    // Request notification permission on mount
    requestPermission();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [showNotification, requestPermission, dispatch]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && socket?.connected) {
        // Mark notifications as delivered when page becomes visible
        dispatch(notificationApi.util.invalidateTags(['Notification']));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket, dispatch]);

  const value: NotificationContextType = {
    socket,
    isConnected,
    unreadCount: unreadData?.count || 0,
    requestPermission,
    showNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};