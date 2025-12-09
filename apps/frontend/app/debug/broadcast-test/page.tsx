'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SessionBroadcastIndicator } from '@/features/player/components/SessionBroadcastIndicator';
import { useSessionBroadcast } from '@/features/physical-trainer/hooks/useSessionBroadcast';

export default function BroadcastTestPage() {
  const [broadcastEnabled, setBroadcastEnabled] = useState(true);
  const [testData, setTestData] = useState({
    workoutId: 'test-workout-123',
    eventId: 'test-event-456',
    overallProgress: 0,
    currentInterval: 'Warm-up',
    intervalIndex: 0,
    totalIntervals: 5,
    intervalTimeRemaining: 60,
    heartRate: 120,
    targetHeartRate: 140,
    totalTimeElapsed: 0,
    isCompleted: false,
    isPaused: false
  });

  const {
    isConnected,
    isReconnecting,
    queuedUpdates,
    broadcastConditioningUpdate,
    disconnect
  } = useSessionBroadcast({
    enabled: broadcastEnabled,
    throttleMs: 1000, // 1 second for testing
    onConnectionChange: (connected) => {
      console.log('Connection status changed:', connected);
    }
  });

  const handleSendUpdate = () => {
    const updatedData = {
      ...testData,
      overallProgress: testData.overallProgress + 10,
      totalTimeElapsed: testData.totalTimeElapsed + 30,
      heartRate: 120 + Math.floor(Math.random() * 20)
    };
    
    setTestData(updatedData);
    broadcastConditioningUpdate(updatedData);
  };

  const handleCompleteWorkout = () => {
    const completedData = {
      ...testData,
      overallProgress: 100,
      isCompleted: true
    };
    
    setTestData(completedData);
    broadcastConditioningUpdate(completedData);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Session Broadcasting Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Broadcasting Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Broadcast Indicator */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Broadcasting Status</span>
              <SessionBroadcastIndicator
                isConnected={isConnected}
                isReconnecting={isReconnecting}
                queuedUpdates={queuedUpdates}
                broadcastEnabled={broadcastEnabled}
                onToggleBroadcast={setBroadcastEnabled}
              />
            </div>
            
            {/* Connection Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>WebSocket Status:</span>
                <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? 'Connected' : isReconnecting ? 'Reconnecting...' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Queued Updates:</span>
                <span>{queuedUpdates}</span>
              </div>
              <div className="flex justify-between">
                <span>Broadcasting Enabled:</span>
                <span>{broadcastEnabled ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            {/* Test Actions */}
            <div className="space-y-2">
              <Button 
                onClick={handleSendUpdate} 
                className="w-full"
                disabled={!broadcastEnabled}
              >
                Send Progress Update
              </Button>
              <Button 
                onClick={handleCompleteWorkout} 
                variant="outline" 
                className="w-full"
                disabled={!broadcastEnabled}
              >
                Complete Workout
              </Button>
              <Button 
                onClick={() => disconnect()} 
                variant="destructive" 
                className="w-full"
              >
                Force Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Current Data */}
        <Card>
          <CardHeader>
            <CardTitle>Current Workout Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
      
      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click the broadcast indicator to toggle broadcasting on/off</li>
            <li>Use "Send Progress Update" to simulate workout progress</li>
            <li>Check the connection status and queued updates</li>
            <li>Try disconnecting your network to test offline queueing</li>
            <li>Reconnect to see queued updates being sent</li>
            <li>Open browser console to see WebSocket activity</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}