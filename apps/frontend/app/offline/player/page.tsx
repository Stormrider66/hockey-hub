'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, Dumbbell, Calendar, BarChart3, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useServiceWorker } from '@/utils/serviceWorker';

interface CachedWorkout {
  id: string;
  name: string;
  type: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  date: string;
  duration: string;
}

export default function PlayerOfflinePage() {
  const router = useRouter();
  const { isOnline, clearAllCaches } = useServiceWorker();
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [cachedWorkouts, setCachedWorkouts] = React.useState<CachedWorkout[]>([]);

  React.useEffect(() => {
    if (isOnline) {
      // Redirect to player dashboard if online
      router.push('/player');
    }
  }, [isOnline, router]);

  React.useEffect(() => {
    // Load cached workouts from localStorage
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem('cachedWorkouts');
        if (cached) {
          setCachedWorkouts(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Failed to load cached workouts:', error);
      }
    };

    loadCachedData();
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await clearAllCaches();
      window.location.reload();
    } catch (error) {
      console.error('Failed to retry:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const navigateToWorkout = (workoutId: string, type: string) => {
    router.push(`/player/workout/${type}/${workoutId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Offline Banner */}
        <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center">
                  <WifiOff className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">You're Currently Offline</CardTitle>
                  <CardDescription>
                    Access your cached content below. Changes will sync when you reconnect.
                  </CardDescription>
                </div>
              </div>
              <Button 
                onClick={handleRetry}
                disabled={isRetrying}
                variant="outline"
                size="sm"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Offline Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Cached Workouts */}
          <Card className="col-span-full lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5" />
                Available Workouts
              </CardTitle>
              <CardDescription>
                These workouts are available offline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cachedWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {cachedWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => navigateToWorkout(workout.id, workout.type)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{workout.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {workout.type} • {workout.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {workout.duration}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No cached workouts available</p>
                  <p className="text-sm mt-1">
                    Workouts will be cached when you view them online
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Recent Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Workouts This Week</span>
                  <span className="font-semibold">4</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Duration</span>
                  <span className="font-semibold">3h 45m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Calories Burned</span>
                  <span className="font-semibold">1,250</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Streak</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">7 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card className="col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Cached Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="border-l-4 border-blue-500 pl-3 py-2">
                  <p className="font-medium text-sm">Team Practice</p>
                  <p className="text-xs text-gray-500">Tomorrow, 10:00 AM</p>
                </div>
                <div className="border-l-4 border-green-500 pl-3 py-2">
                  <p className="font-medium text-sm">Strength Training</p>
                  <p className="text-xs text-gray-500">Tomorrow, 2:00 PM</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-3 py-2">
                  <p className="font-medium text-sm">Recovery Session</p>
                  <p className="text-xs text-gray-500">Friday, 4:00 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Offline Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Working Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Continue Training</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  You can complete cached workouts and track your progress offline.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Automatic Sync</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  All your data will sync automatically when you reconnect.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Stay Motivated</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Your streak and progress tracking continues even offline.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}