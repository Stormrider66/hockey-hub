'use client';

import React from 'react';
import { useServiceWorker } from '@/utils/serviceWorker';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { isUpdateAvailable, skipWaiting, isOnline } = useServiceWorker();
  const [showOfflineToast, setShowOfflineToast] = React.useState(false);

  // Handle update notifications
  React.useEffect(() => {
    if (isUpdateAvailable) {
      toast.custom(
        (t) => (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
            <h3 className="font-semibold mb-2">Update Available</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              A new version of Hockey Hub is available. Refresh to get the latest features and improvements.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  skipWaiting();
                  toast.dismiss(t.id);
                }}
              >
                Refresh Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.dismiss(t.id)}
              >
                Later
              </Button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: 'bottom-center',
        }
      );
    }
  }, [isUpdateAvailable, skipWaiting]);

  // Handle online/offline notifications
  React.useEffect(() => {
    if (!isOnline && !showOfflineToast) {
      setShowOfflineToast(true);
      toast.error('You are currently offline. Some features may be limited.', {
        duration: 5000,
        icon: '📵',
      });
    } else if (isOnline && showOfflineToast) {
      setShowOfflineToast(false);
      toast.success('Back online! Your data is syncing...', {
        duration: 3000,
        icon: '✅',
      });
    }
  }, [isOnline, showOfflineToast]);

  // Listen for background sync events
  React.useEffect(() => {
    const handleSyncSuccess = (event: CustomEvent) => {
      const { item } = event.detail;
      console.log('Background sync success:', item);
      
      // Show subtle success notification
      if (item.type === 'workout') {
        toast.success('Workout synced successfully', {
          duration: 2000,
        });
      }
    };

    const handleSyncFailed = (event: CustomEvent) => {
      const { item } = event.detail;
      console.error('Background sync failed:', item);
      
      // Show error notification
      toast.error(`Failed to sync ${item.type}. Will retry when connection improves.`, {
        duration: 4000,
      });
    };

    window.addEventListener('background-sync-success', handleSyncSuccess as EventListener);
    window.addEventListener('background-sync-failed', handleSyncFailed as EventListener);

    return () => {
      window.removeEventListener('background-sync-success', handleSyncSuccess as EventListener);
      window.removeEventListener('background-sync-failed', handleSyncFailed as EventListener);
    };
  }, []);

  return <>{children}</>;
}