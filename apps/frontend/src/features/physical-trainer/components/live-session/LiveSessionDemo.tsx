'use client';

import React, { useState, useEffect } from 'react';
import { LiveSessionProvider } from './LiveSessionProvider';
import { LiveSessionGrid } from './LiveSessionGrid';
import { SessionSpectatorView } from './SessionSpectatorView';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Radio } from 'lucide-react';

/**
 * Demo component showcasing the live session monitoring functionality
 * This demonstrates how to integrate the live session components
 */
export const LiveSessionDemo: React.FC = () => {
  const [view, setView] = useState<'grid' | 'spectator'>('grid');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setView('spectator');
  };

  const handleBack = () => {
    setView('grid');
    setSelectedSessionId(null);
  };

  return (
    <LiveSessionProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio className="h-6 w-6 text-red-500 animate-pulse" />
                <CardTitle className="text-2xl">Live Session Monitor</CardTitle>
              </div>
              {view === 'spectator' && (
                <Button 
                  variant="outline"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to All Sessions
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Content */}
        {view === 'grid' ? (
          <LiveSessionGrid 
            onSessionClick={handleSessionClick}
          />
        ) : (
          <SessionSpectatorView 
            sessionId={selectedSessionId || undefined}
            onBack={handleBack}
          />
        )}
      </div>
    </LiveSessionProvider>
  );
};

/**
 * Example integration in Physical Trainer Dashboard:
 * 
 * import { LiveSessionProvider } from './live-session';
 * import { LiveSessionGrid } from './live-session';
 * 
 * // In your dashboard component:
 * <LiveSessionProvider>
 *   <Tabs>
 *     <TabsList>
 *       <TabsTrigger value="sessions">Sessions</TabsTrigger>
 *       <TabsTrigger value="live">Live Monitor</TabsTrigger>
 *     </TabsList>
 *     
 *     <TabsContent value="live">
 *       <LiveSessionGrid />
 *     </TabsContent>
 *   </Tabs>
 * </LiveSessionProvider>
 */

/**
 * Example usage with filtering:
 * 
 * const { setFilters } = useLiveSession();
 * 
 * // Filter by workout type
 * setFilters({ workoutType: ['strength', 'conditioning'] });
 * 
 * // Filter by teams
 * setFilters({ teamIds: ['team-1', 'team-2'] });
 * 
 * // Filter by status
 * setFilters({ status: ['active', 'paused'] });
 */

/**
 * Mock data generation for testing:
 * 
 * When the socket connects, it will request live sessions.
 * The backend should emit 'live:sessions' with an array of LiveSession objects.
 * 
 * Example mock data structure:
 * 
 * const mockSession: LiveSession = {
 *   id: 'session-123',
 *   workoutId: 'workout-456',
 *   workoutName: 'Morning Strength Training',
 *   workoutType: 'strength',
 *   trainerId: 'trainer-789',
 *   trainerName: 'Coach Johnson',
 *   startTime: new Date(),
 *   status: 'active',
 *   currentPhase: 'Main Workout',
 *   totalDuration: 3600,
 *   elapsedTime: 1200,
 *   participants: [
 *     {
 *       id: 'participant-1',
 *       playerId: 'player-1',
 *       playerName: 'Sidney Crosby',
 *       playerNumber: 87,
 *       teamId: 'team-1',
 *       teamName: 'Penguins',
 *       status: 'connected',
 *       progress: 45,
 *       currentExercise: 'Bench Press',
 *       currentSet: 3,
 *       totalSets: 5,
 *       metrics: {
 *         heartRate: 142,
 *         heartRateZone: 'zone3',
 *         weight: 100,
 *         reps: 8
 *       },
 *       lastUpdate: new Date()
 *     }
 *   ]
 * };
 */