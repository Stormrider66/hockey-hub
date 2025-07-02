'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Bell, BellOff, TestTube, Settings, Shield, Clock } from 'lucide-react';
import PushNotificationService from '@/services/PushNotificationService';
import { toast } from 'react-hot-toast';

interface PushNotificationSettingsProps {
  className?: string;
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({
  className = ''
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      setIsInitializing(true);
      await PushNotificationService.initialize();
      setIsSupported(PushNotificationService.isNotificationSupported());
      setIsSubscribed(await PushNotificationService.checkSubscriptionStatus());
      setPermission(PushNotificationService.getPermissionStatus());
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      toast.error('Failed to initialize push notifications');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleToggleSubscription = async () => {
    setIsLoading(true);
    
    try {
      if (isSubscribed) {
        const success = await PushNotificationService.unsubscribe();
        if (success) {
          setIsSubscribed(false);
        }
      } else {
        const success = await PushNotificationService.subscribe();
        if (success) {
          setIsSubscribed(true);
          setPermission(PushNotificationService.getPermissionStatus());
        }
      }
    } catch (error) {
      console.error('Failed to toggle push subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await PushNotificationService.sendTestNotification();
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="success" className="ml-2">Allowed</Badge>;
      case 'denied':
        return <Badge variant="destructive" className="ml-2">Blocked</Badge>;
      case 'default':
        return <Badge variant="secondary" className="ml-2">Not Asked</Badge>;
      default:
        return <Badge variant="outline" className="ml-2">Unknown</Badge>;
    }
  };

  const getSupportIcon = () => {
    if (isSupported) {
      return <Smartphone className="h-5 w-5 text-green-500" />;
    }
    return <Smartphone className="h-5 w-5 text-gray-400" />;
  };

  const getStatusIcon = () => {
    if (isSubscribed) {
      return <Bell className="h-5 w-5 text-green-500" />;
    }
    return <BellOff className="h-5 w-5 text-gray-400" />;
  };

  if (isInitializing) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Loading notification settings...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getSupportIcon()}
            Push Notifications
          </CardTitle>
          <CardDescription>
            Browser support status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in your current browser. 
              Please use a modern browser like Chrome, Firefox, Safari, or Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Push Notifications
          {getPermissionBadge()}
        </CardTitle>
        <CardDescription>
          Receive real-time notifications even when Hockey Hub is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Browser Permission</p>
              <p className="text-sm text-muted-foreground">
                {permission === 'granted' && 'Notifications are allowed'}
                {permission === 'denied' && 'Notifications are blocked'}
                {permission === 'default' && 'Permission not requested yet'}
              </p>
            </div>
          </div>
          {getPermissionBadge()}
        </div>

        {/* Subscription Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">Enable Push Notifications</p>
            <p className="text-sm text-muted-foreground">
              Get notified about new messages, reminders, and important updates
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggleSubscription}
            disabled={isLoading || permission === 'denied'}
          />
        </div>

        {/* Permission Denied Help */}
        {permission === 'denied' && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. To enable them, click the lock icon in your 
              browser's address bar and change the notification setting to "Allow".
            </AlertDescription>
          </Alert>
        )}

        {/* Test Notification Button */}
        {isSubscribed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <span className="font-medium">Test Notifications</span>
            </div>
            <Button
              variant="outline"
              onClick={handleTestNotification}
              className="w-full"
            >
              Send Test Notification
            </Button>
          </div>
        )}

        {/* Notification Types Info */}
        {isSubscribed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">You'll receive notifications for:</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                New chat messages and mentions
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Training session reminders
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Medical appointment alerts
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Team announcements
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Emergency notifications
              </div>
            </div>
          </div>
        )}

        {/* Browser Support Info */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Push notifications work in Chrome, Firefox, Safari, and Edge. 
            Notifications are delivered even when Hockey Hub is closed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PushNotificationSettings;