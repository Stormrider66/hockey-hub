'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LiveSessionIndicator } from '@/features/calendar/components/LiveSessionIndicator';
import { useCalendarLiveUpdates } from '@/features/calendar/hooks/useCalendarLiveUpdates';
import { toast } from 'react-hot-toast';
import { Play, Pause, FastForward, CheckCircle } from 'lucide-react';

export default function LiveCalendarDemoPage() {
  const [mockLiveSession, setMockLiveSession] = useState({
    eventId: 'event-live-1',
    isLive: true,
    currentProgress: 25,
    activeParticipants: 4,
    currentActivity: {
      type: 'exercise' as const,
      name: 'Bench Press - Set 1/4',
      timeRemaining: 180,
    },
  });

  const { isConnected, emitProgressUpdate, emitSessionCompleted } = useCalendarLiveUpdates({
    organizationId: 'org-001',
    teamId: 'team-001',
    userId: 'trainer-001',
    enabled: true,
  });

  const updateProgress = (progress: number, activity: any) => {
    setMockLiveSession(prev => ({
      ...prev,
      currentProgress: progress,
      currentActivity: activity,
    }));
    
    // Emit to WebSocket (if connected)
    emitProgressUpdate(mockLiveSession.eventId, progress, activity);
    
    toast.success(`Progress updated to ${progress}%`);
  };

  const simulateWorkoutFlow = () => {
    const activities = [
      { type: 'exercise', name: 'Bench Press - Set 2/4', timeRemaining: 180, progress: 35 },
      { type: 'rest', name: 'Rest Period', timeRemaining: 60, progress: 40 },
      { type: 'exercise', name: 'Bench Press - Set 3/4', timeRemaining: 180, progress: 55 },
      { type: 'rest', name: 'Rest Period', timeRemaining: 60, progress: 60 },
      { type: 'exercise', name: 'Bench Press - Set 4/4', timeRemaining: 180, progress: 75 },
      { type: 'transition', name: 'Moving to Squats', timeRemaining: 120, progress: 80 },
      { type: 'exercise', name: 'Squats - Set 1/3', timeRemaining: 180, progress: 90 },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < activities.length) {
        const activity = activities[index];
        updateProgress(activity.progress, {
          type: activity.type,
          name: activity.name,
          timeRemaining: activity.timeRemaining,
        });
        index++;
      } else {
        clearInterval(interval);
        completeSession();
      }
    }, 3000);
  };

  const completeSession = () => {
    setMockLiveSession(prev => ({
      ...prev,
      isLive: false,
      currentProgress: 100,
      currentActivity: {
        type: 'exercise',
        name: 'Session Complete',
        timeRemaining: 0,
      },
    }));
    
    emitSessionCompleted(mockLiveSession.eventId, {
      duration: 60,
      exercisesCompleted: 8,
      participantsCompleted: 4,
    });
    
    toast.success('Training session completed!');
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Live Calendar Demo</h1>
      
      <div className="grid gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>WebSocket Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              {!isConnected && (
                <Badge variant="secondary" className="ml-4">
                  Mock Mode - Updates will be simulated locally
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Session Display */}
        <Card>
          <CardHeader>
            <CardTitle>Live Training Session</CardTitle>
            <CardDescription>Morning Strength Training - Main Gym</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Live Indicator */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Full Indicator (Event Details Modal)</h3>
              <LiveSessionIndicator
                isLive={mockLiveSession.isLive}
                progress={mockLiveSession.currentProgress}
                participantCount={mockLiveSession.activeParticipants}
                currentActivity={mockLiveSession.currentActivity}
              />
            </div>

            {/* Compact Live Indicator */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Compact Indicator (Calendar Event)</h3>
              <LiveSessionIndicator
                isLive={mockLiveSession.isLive}
                progress={mockLiveSession.currentProgress}
                participantCount={mockLiveSession.activeParticipants}
                currentActivity={mockLiveSession.currentActivity}
                compact
              />
            </div>

            {/* Control Buttons */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Simulation Controls</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => updateProgress(25, { type: 'exercise', name: 'Warm-up', timeRemaining: 300 })}
                  variant="outline"
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start Warm-up
                </Button>
                
                <Button
                  onClick={() => updateProgress(50, { type: 'interval', name: 'HIIT Sprint 3/8', timeRemaining: 30 })}
                  variant="outline"
                  size="sm"
                >
                  <FastForward className="h-4 w-4 mr-1" />
                  Jump to HIIT
                </Button>
                
                <Button
                  onClick={() => updateProgress(75, { type: 'rest', name: 'Recovery', timeRemaining: 90 })}
                  variant="outline"
                  size="sm"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Rest Period
                </Button>
                
                <Button
                  onClick={completeSession}
                  variant="outline"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete Session
                </Button>
              </div>
              
              <Button
                onClick={simulateWorkoutFlow}
                className="w-full"
              >
                Run Full Workout Simulation (Auto Progress)
              </Button>
            </div>

            {/* Session Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event ID:</span>
                <code className="font-mono">{mockLiveSession.eventId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Progress:</span>
                <span>{mockLiveSession.currentProgress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Participants:</span>
                <span>{mockLiveSession.activeParticipants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Activity:</span>
                <span>{mockLiveSession.currentActivity.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Live Sessions Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>1. <strong>Session Start:</strong> When a trainer starts a workout, the calendar event becomes "live"</p>
            <p>2. <strong>Real-time Updates:</strong> Progress and activity updates are broadcast via WebSocket</p>
            <p>3. <strong>Visual Indicators:</strong> Live events show pulsing dots, participant counts, and progress bars</p>
            <p>4. <strong>Join Button:</strong> Players see a prominent "Join Live Session" button in the event details</p>
            <p>5. <strong>Activity Tracking:</strong> Current exercise/interval is shown with time remaining</p>
            <p>6. <strong>Completion:</strong> When finished, the event status updates and shows as completed</p>
          </CardContent>
        </Card>

        {/* Implementation Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <p><strong>Components Created:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>LiveSessionIndicator</code> - Visual component for live status</li>
                <li><code>LiveEventComponent</code> - Custom calendar event with live features</li>
                <li><code>useCalendarLiveUpdates</code> - WebSocket hook for real-time updates</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <p><strong>Calendar API Extended:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Added <code>isLive</code>, <code>currentProgress</code>, <code>activeParticipants</code> to Event type</li>
                <li>Added <code>currentActivity</code> object with type, name, and timeRemaining</li>
                <li>Mock data includes live sessions for testing</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <p><strong>EventDetailsModal Enhanced:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Shows live indicator in header</li>
                <li>"Join Live Session" button for players</li>
                <li>Real-time participant list with "In Session" badges</li>
                <li>Live activity and progress display</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}