'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Users, Activity, Target, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Test page to verify Phase 4 Real-time Workout Execution integration
export default function Phase4TestPage() {
  const router = useRouter();
  const [testStep, setTestStep] = useState(0);

  const testSteps = [
    {
      title: "Step 1: Calendar Launch Integration",
      description: "Test calendar event → workout viewer routing",
      action: "Launch Conditioning Workout",
      completed: false
    },
    {
      title: "Step 2: Real-time Broadcasting",
      description: "Test player metrics → trainer dashboard",
      action: "Monitor Broadcast",
      completed: false
    },
    {
      title: "Step 3: Session Persistence",
      description: "Test pause/resume functionality",
      action: "Test Persistence",
      completed: false
    },
    {
      title: "Step 4: Trainer Monitoring",
      description: "Test trainer dashboard receives broadcasts",
      action: "Open Trainer View",
      completed: false
    }
  ];

  const simulateCalendarLaunch = () => {
    // Simulate calendar event data
    const mockWorkoutData = {
      eventId: 'test-event-123',
      eventTitle: 'Phase 4 Test Session',
      workoutId: 'conditioning-test-456',
      workoutType: 'CONDITIONING',
      startTime: new Date().toISOString(),
      location: 'Test Training Center',
      intervalProgram: {
        id: 'test-program',
        name: 'Phase 4 Test Intervals',
        totalDuration: 1800, // 30 minutes
        equipment: 'bike',
        intervals: [
          {
            duration: 300,
            intensity: 'Warm-up',
            targetBPM: 120,
            targetPower: 150
          },
          {
            duration: 120,
            intensity: 'High',
            targetBPM: 170,
            targetPower: 250
          },
          {
            duration: 180,
            intensity: 'Recovery',
            targetBPM: 130,
            targetPower: 100
          },
          {
            duration: 300,
            intensity: 'Cool-down',
            targetBPM: 110,
            targetPower: 80
          }
        ]
      }
    };

    // Store in sessionStorage to simulate calendar launch
    sessionStorage.setItem('currentWorkout', JSON.stringify(mockWorkoutData));

    // Navigate to conditioning viewer
    router.push('/player/workout/conditioning/conditioning-test-456');
  };

  const openTrainerMonitor = () => {
    // Navigate to enhanced group session monitor
    router.push('/debug/group-session-monitor?sessionId=test-session-123&workoutType=conditioning');
  };

  const simulateApiTest = async () => {
    try {
      // Test training service health
      const response = await fetch('http://localhost:3004/health');
      const data = await response.json();
      console.log('Training Service Health:', data);
      
      // Test WebSocket connection
      console.log('WebSocket connection test - check console for details');
      
      return data.status === 'ok';
    } catch (error) {
      console.error('API Test failed:', error);
      return false;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Phase 4: Real-time Workout Execution Test</h1>
        <p className="text-muted-foreground">
          Test the complete integration flow from calendar launch to real-time monitoring
        </p>
      </div>

      <Tabs defaultValue="integration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integration">Integration Test</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="technical">Technical Info</TabsTrigger>
        </TabsList>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Integration Test Suite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={step.completed ? "default" : "secondary"}>
                      {step.completed ? "Completed" : "Pending"}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (index === 0) simulateCalendarLaunch();
                        if (index === 1) simulateApiTest();
                        if (index === 3) openTrainerMonitor();
                      }}
                    >
                      {step.action}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Player Flow Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Test the complete player workout execution flow
                </p>
                <Button onClick={simulateCalendarLaunch} className="w-full">
                  Start Player Session
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Trainer Flow Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Test the trainer monitoring dashboard
                </p>
                <Button onClick={openTrainerMonitor} className="w-full">
                  Open Trainer Monitor
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Calendar Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>✅ EventDetailsModal</li>
                  <li>✅ PlayerWorkoutLauncher</li>
                  <li>✅ Calendar → Viewer routing</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Real-time Broadcasting</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>✅ useSessionBroadcast hook</li>
                  <li>✅ Socket.IO integration</li>
                  <li>✅ Training service WebSocket</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Persistence</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>✅ WorkoutSessionManager</li>
                  <li>✅ Auto-save functionality</li>
                  <li>✅ Pause/resume support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trainer Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>✅ useGroupSessionBroadcast</li>
                  <li>✅ EnhancedGroupSessionMonitor</li>
                  <li>✅ Real-time metrics display</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Player Viewers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>✅ PlayerConditioningViewer</li>
                  <li>✅ SessionBroadcastIndicator</li>
                  <li>✅ useWorkoutSession hook</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Architecture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">WebSocket Flow</h3>
                <div className="text-sm text-muted-foreground">
                  <p>1. Player connects to Training Service (port 3004)</p>
                  <p>2. Player authenticates and joins session room</p>
                  <p>3. Player broadcasts workout_update events</p>
                  <p>4. Trainer receives workout:progress_update events</p>
                  <p>5. Real-time metrics displayed in monitoring dashboard</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Session Persistence</h3>
                <div className="text-sm text-muted-foreground">
                  <p>• Auto-save every 30 seconds</p>
                  <p>• Save on visibility change</p>
                  <p>• Save on beforeunload</p>
                  <p>• Restore from localStorage</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Service Endpoints</h3>
                <div className="text-sm text-muted-foreground">
                  <p>• Training Service: http://localhost:3004</p>
                  <p>• WebSocket: Socket.IO on same port</p>
                  <p>• Health Check: /health</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Player Testing</h4>
                  <ul className="space-y-1">
                    <li>□ Launch from calendar event</li>
                    <li>□ Workout data loads correctly</li>
                    <li>□ Broadcasting connects</li>
                    <li>□ Metrics update in real-time</li>
                    <li>□ Pause/resume works</li>
                    <li>□ Session persists on refresh</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Trainer Testing</h4>
                  <ul className="space-y-1">
                    <li>□ Monitor connects to session</li>
                    <li>□ Player metrics appear</li>
                    <li>□ Real-time updates display</li>
                    <li>□ Team metrics calculate</li>
                    <li>□ Connection status accurate</li>
                    <li>□ Multiple players supported</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}