'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { navigateToWorkoutBuilder, parseWorkoutContext } from '../../utils/workoutNavigation';
import type { WorkoutCreationContext } from '../../types';

export default function NavigationFlowTest() {
  const router = useRouter();
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testNavigation = () => {
    addLog('Starting navigation test...');
    
    // Simulate context from a selected session
    const mockContext: WorkoutCreationContext = {
      sessionId: 'session-123',
      sessionType: 'Conditioning',
      sessionDate: new Date('2025-01-27T09:00:00'),
      sessionTime: '09:00',
      sessionLocation: 'Training Center',
      teamId: 'team-001',
      teamName: 'A-Team',
      playerId: 'player-123',
      playerName: 'Oscar Möller',
      returnPath: '/physicaltrainer?tab=overview'
    };
    
    addLog(`Creating context for ${mockContext.playerName} (${mockContext.teamName})`);
    addLog(`Session: ${mockContext.sessionType} at ${mockContext.sessionTime}`);
    
    // Navigate to workout builder
    try {
      navigateToWorkoutBuilder(router as any, mockContext);
      addLog('✅ Navigation triggered successfully');
    } catch (error) {
      addLog(`❌ Navigation error: ${error}`);
    }
  };

  const testContextParsing = () => {
    addLog('Testing context parsing...');
    
    // Create a test URL query string
    const queryParams = new URLSearchParams({
      playerId: 'player-456',
      playerName: 'Test Player',
      teamId: 'team-002',
      teamName: 'B-Team',
      sessionId: 'session-456',
      sessionType: 'Conditioning',
      sessionDate: new Date().toISOString(),
      sessionTime: '14:00',
      sessionLocation: 'Ice Rink',
      returnPath: '/physicaltrainer',
      prefilled: 'true'
    });
    
    const parsed = parseWorkoutContext(queryParams.toString());
    
    if (parsed) {
      addLog('✅ Context parsed successfully:');
      addLog(`  Player: ${parsed.playerName} (${parsed.playerId})`);
      addLog(`  Team: ${parsed.teamName} (${parsed.teamId})`);
      addLog(`  Session: ${parsed.sessionType} at ${parsed.sessionTime}`);
    } else {
      addLog('❌ Failed to parse context');
    }
  };

  const clearLog = () => setLog([]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Navigation Flow Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testNavigation} variant="default">
                Test Team Roster → Conditioning Builder
              </Button>
              <Button onClick={testContextParsing} variant="secondary">
                Test Context Parsing
              </Button>
              <Button onClick={clearLog} variant="outline">
                Clear Log
              </Button>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Test Log:</h3>
              <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {log.length === 0 ? (
                  <p className="text-gray-500">No logs yet. Click a test button to start.</p>
                ) : (
                  log.map((entry, index) => (
                    <div key={index} className="mb-1">
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Expected Flow:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Click player without workout in Team Roster</li>
                <li>Navigate to Sessions tab with workout type and context</li>
                <li>Conditioning Workout Builder opens with pre-filled data</li>
                <li>Save workout which links to the training session</li>
                <li>Return to overview with updated workout status</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}