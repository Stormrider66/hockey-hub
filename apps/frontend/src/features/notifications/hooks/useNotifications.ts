import { useState, useEffect, useCallback } from 'react';
import { useNotificationApi } from '../../../store/api/notificationApi';
import { NotificationFilters, Notification } from '../types';

interface UseNotificationsResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markMultipleAsRead: (notificationIds: string[]) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => void;
}

export function useNotifications(filters: NotificationFilters): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useNotificationApi.useGetNotificationsQuery(filters);

  const [markAsReadMutation] = useNotificationApi.useMarkAsReadMutation();
  const [markMultipleAsReadMutation] = useNotificationApi.useMarkMultipleAsReadMutation();
  const [deleteNotificationMutation] = useNotificationApi.useDeleteNotificationMutation();

  useEffect(() => {
    if (notificationsData) {
      setNotifications(notificationsData.notifications);
      setTotal(notificationsData.total);
      setUnreadCount(notificationsData.unreadCount);
      setError(null);
    }
  }, [notificationsData]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadMutation({ notificationId }).unwrap();
      
      // Optimistically update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, read_at: new Date().toISOString(), status: 'read' as const }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      setError('Failed to mark notification as read');
      console.error('Error marking notification as read:', error);
    }
  }, [markAsReadMutation]);

  const markMultipleAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await markMultipleAsReadMutation({ notificationIds }).unwrap();
      
      // Optimistically update local state
      const now = new Date().toISOString();
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, read_at: now, status: 'read' as const }
            : notification
        )
      );
      
      const unreadToUpdate = notifications.filter(n => 
        notificationIds.includes(n.id) && !n.read_at
      ).length;
      
      setUnreadCount(prev => Math.max(0, prev - unreadToUpdate));
    } catch (error) {
      setError('Failed to mark notifications as read');
      console.error('Error marking multiple notifications as read:', error);
    }
  }, [markMultipleAsReadMutation, notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotificationMutation({ notificationId }).unwrap();
      
      // Optimistically update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setTotal(prev => prev - 1);
      
      if (deletedNotification && !deletedNotification.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      setError('Failed to delete notification');
      console.error('Error deleting notification:', error);
    }
  }, [deleteNotificationMutation, notifications]);

  const refreshNotifications = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    notifications,
    total,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markMultipleAsRead,
    deleteNotification,
    refreshNotifications,
  };
}