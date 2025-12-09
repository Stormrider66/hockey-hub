'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, Users, ClipboardList, Calendar, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useServiceWorker } from '@/utils/serviceWorker';

interface CachedPlayer {
  id: string;
  name: string;
  position: string;
  status: 'healthy' | 'injured' | 'limited';
}

interface CachedPractice {
  id: string;
  name: string;
  date: string;
  duration: string;
  playerCount: number;
}

export default function CoachOfflinePage() {
  const router = useRouter();
  const { isOnline, clearAllCaches } = useServiceWorker();
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [cachedPlayers, setCachedPlayers] = React.useState<CachedPlayer[]>([]);
  const [cachedPractices, setCachedPractices] = React.useState<CachedPractice[]>([]);

  React.useEffect(() => {
    if (isOnline) {
      // Redirect to coach dashboard if online
      router.push('/coach');
    }
  }, [isOnline, router]);

  React.useEffect(() => {
    // Load cached data from localStorage
    const loadCachedData = () => {
      try {
        const players = localStorage.getItem('cachedPlayers');
        const practices = localStorage.getItem('cachedPractices');
        
        if (players) setCachedPlayers(JSON.parse(players));
        if (practices) setCachedPractices(JSON.parse(practices));
      } catch (error) {
        console.error('Failed to load cached data:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'injured': return 'text-red-600 dark:text-red-400';
      case 'limited': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
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
                  <CardTitle className="text-lg">Working Offline</CardTitle>
                  <CardDescription>
                    You can view cached team data. Changes will sync when reconnected.
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Roster */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Roster (Cached)
              </CardTitle>
              <CardDescription>
                Last updated when you were online
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cachedPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cachedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{player.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {player.position}
                          </p>
                        </div>
                        <span className={`text-sm font-medium ${getStatusColor(player.status)}`}>
                          {player.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No cached player data available</p>
                  <p className="text-sm mt-1">
                    Player data will be cached when you view it online
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Team Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Players</p>
                  <p className="text-2xl font-bold">{cachedPlayers.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Healthy Players</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {cachedPlayers.filter(p => p.status === 'healthy').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Injured/Limited</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {cachedPlayers.filter(p => p.status !== 'healthy').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Win</p>
                  <p className="text-lg font-semibold">vs Toronto 4-2</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Practices */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Recent Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cachedPractices.length > 0 ? (
                <div className="space-y-3">
                  {cachedPractices.map((practice) => (
                    <div
                      key={practice.id}
                      className="border rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{practice.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {practice.date} • {practice.duration}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {practice.playerCount} players
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No cached practice data</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="border-l-4 border-blue-500 pl-3 py-2">
                  <p className="font-medium text-sm">Team Practice</p>
                  <p className="text-xs text-gray-500">Tomorrow, 10:00 AM</p>
                </div>
                <div className="border-l-4 border-red-500 pl-3 py-2">
                  <p className="font-medium text-sm">Game vs Boston</p>
                  <p className="text-xs text-gray-500">Saturday, 7:00 PM</p>
                </div>
                <div className="border-l-4 border-green-500 pl-3 py-2">
                  <p className="font-medium text-sm">Team Meeting</p>
                  <p className="text-xs text-gray-500">Sunday, 2:00 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Offline Features */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Available Offline Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">View Team Data</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Access cached player rosters, stats, and recent performance data.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Review Practices</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Look back at recent practice plans and session notes.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Plan Ahead</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Draft practice plans that will sync when you reconnect.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}