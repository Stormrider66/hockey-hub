'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, Home, Cloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useServiceWorker } from '@/utils/serviceWorker';

export default function OfflinePage() {
  const router = useRouter();
  const { isOnline, clearAllCaches } = useServiceWorker();
  const [isRetrying, setIsRetrying] = React.useState(false);

  React.useEffect(() => {
    if (isOnline) {
      // Redirect to home if online
      router.push('/');
    }
  }, [isOnline, router]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Clear caches and reload
      await clearAllCaches();
      window.location.reload();
    } catch (error) {
      console.error('Failed to retry:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold">You're Offline</CardTitle>
          <CardDescription className="text-base mt-2">
            It looks like you've lost your internet connection. Some features may be limited while offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              What you can do offline:
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• View cached workouts and sessions</li>
              <li>• Access your recent schedule</li>
              <li>• Continue ongoing workout sessions</li>
              <li>• View player profiles and stats</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
              variant="default"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Connection
                </>
              )}
            </Button>

            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Your data will be automatically synced when you reconnect.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}