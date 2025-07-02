'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  Chrome, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { pushNotificationService } from '@/services/PushNotificationService';
import { toast } from 'react-hot-toast';

// VAPID public key (this should come from environment variable in production)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
  'BKd0F3N4B6kFrJkF2xQGlOxF2dTpXhPHFIdCLgBqD8YH3qM_tVUgXqgFseEMEZrHzqE2iJlQqMYh7yV8KeFPpbM';

export const PushNotificationSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<{
    serviceWorker: boolean;
    pushManager: boolean;
    notification: boolean;
  }>({ serviceWorker: false, pushManager: false, notification: false });

  // Check support and status on mount
  useEffect(() => {
    checkStatus();
    
    // Register service worker on mount
    pushNotificationService.registerServiceWorker();
  }, []);

  const checkStatus = async () => {
    const supportDetails = pushNotificationService.getSupportDetails();
    setIsSupported(supportDetails.overall);
    setBrowserInfo({
      serviceWorker: supportDetails.serviceWorker,
      pushManager: supportDetails.pushManager,
      notification: supportDetails.notification,
    });

    if (supportDetails.overall) {
      const currentPermission = pushNotificationService.getPermissionStatus();
      setPermission(currentPermission);
      
      const enabled = await pushNotificationService.isEnabled();
      setIsSubscribed(enabled);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    
    try {
      if (checked) {
        // Subscribe to push notifications
        const subscription = await pushNotificationService.subscribe(VAPID_PUBLIC_KEY);
        
        if (subscription) {
          // Send subscription to backend
          // TODO: Call backend API to save subscription
          console.log('Push subscription:', subscription);
          
          setIsSubscribed(true);
          toast.success('Push notifications enabled');
          
          // Show test notification
          await pushNotificationService.showLocalNotification(
            'Push Notifications Enabled',
            {
              body: 'You will now receive push notifications from Hockey Hub',
              icon: '/icons/icon-192x192.png',
            }
          );
        }
      } else {
        // Unsubscribe from push notifications
        const success = await pushNotificationService.unsubscribe();
        
        if (success) {
          // TODO: Call backend API to remove subscription
          
          setIsSubscribed(false);
          toast.success('Push notifications disabled');
        }
      }
      
      await checkStatus();
    } catch (error) {
      console.error('Failed to toggle push notifications:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update push notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    
    try {
      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        toast.success('Permission granted! You can now enable push notifications.');
      } else if (newPermission === 'denied') {
        toast.error('Permission denied. You won\'t receive push notifications.');
      }
    } catch (error) {
      toast.error('Failed to request permission');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.showLocalNotification(
        'Test Notification',
        {
          body: 'This is a test notification from Hockey Hub',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          vibrate: [200, 100, 200],
          data: {
            test: true,
            timestamp: Date.now()
          }
        }
      );
      toast.success('Test notification sent');
    } catch (error) {
      toast.error('Failed to send test notification');
    }
  };

  // Not supported UI
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications even when Hockey Hub is closed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Push notifications are not supported in your browser.</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={browserInfo.serviceWorker ? 'text-green-600' : 'text-red-600'}>
                      {browserInfo.serviceWorker ? '✓' : '✗'}
                    </span>
                    Service Workers: {browserInfo.serviceWorker ? 'Supported' : 'Not supported'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={browserInfo.pushManager ? 'text-green-600' : 'text-red-600'}>
                      {browserInfo.pushManager ? '✓' : '✗'}
                    </span>
                    Push API: {browserInfo.pushManager ? 'Supported' : 'Not supported'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={browserInfo.notification ? 'text-green-600' : 'text-red-600'}>
                      {browserInfo.notification ? '✓' : '✗'}
                    </span>
                    Notifications API: {browserInfo.notification ? 'Supported' : 'Not supported'}
                  </div>
                </div>
                <p className="text-sm mt-2">
                  Please use a modern browser like Chrome, Firefox, or Edge.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Permission denied UI
  if (permission === 'denied') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications Blocked
          </CardTitle>
          <CardDescription>
            You have blocked notifications for this site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>To enable push notifications, you need to:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Find "Notifications" in the permissions</li>
                  <li>Change it from "Block" to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Main UI
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive notifications even when Hockey Hub is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'default' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need to grant permission before enabling push notifications.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="push-toggle" className="text-base">
              Enable Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified about important updates instantly
            </p>
          </div>
          
          {permission === 'granted' ? (
            <Switch
              id="push-toggle"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          ) : (
            <Button
              onClick={handleRequestPermission}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                'Grant Permission'
              )}
            </Button>
          )}
        </div>

        {isSubscribed && (
          <>
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Push notifications are active</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Browser Notifications</span>
                  <Badge variant="outline" className="text-xs">
                    <Chrome className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotification}
                  className="w-full"
                >
                  Send Test Notification
                </Button>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Push notifications will be delivered based on your notification preferences 
                and quiet hours settings.
              </AlertDescription>
            </Alert>
          </>
        )}

        <div className="pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={checkStatus}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Info = AlertCircle;