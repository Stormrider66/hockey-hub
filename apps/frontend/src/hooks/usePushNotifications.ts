'use client';

import { useEffect, useState } from 'react';
import PushNotificationService from '@/services/PushNotificationService';
import { toast } from 'react-hot-toast';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      setIsLoading(true);
      await PushNotificationService.initialize();
      setIsSupported(PushNotificationService.isNotificationSupported());
      setIsSubscribed(await PushNotificationService.checkSubscriptionStatus());
      setPermission(PushNotificationService.getPermissionStatus());
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await PushNotificationService.subscribe();
      if (success) {
        setIsSubscribed(true);
        setPermission(PushNotificationService.getPermissionStatus());
      }
      return success;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await PushNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async (): Promise<void> => {
    try {
      await PushNotificationService.sendTestNotification();
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
};

export default usePushNotifications;