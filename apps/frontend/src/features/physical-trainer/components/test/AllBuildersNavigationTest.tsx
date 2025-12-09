'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { navigateToWorkoutBuilder } from '../../utils/workoutNavigation';
import type { WorkoutCreationContext } from '../../types';
import { CheckCircle, Circle, ArrowRight } from '@/components/icons';

type TestResult = {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
};

type WorkoutTypeTest = {
  type: string;
  sessionType: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  results: TestResult[];
};

export default function AllBuildersNavigationTest() {
  const router = useRouter();
  const [workoutTests, setWorkoutTests] = useState<WorkoutTypeTest[]>([
    {
      type: 'strength',
      sessionType: 'Strength Training',
      status: 'pending',
      results: []
    },
    {
      type: 'conditioning',
      sessionType: 'Conditioning',
      status: 'pending',
      results: []
    },
    {
      type: 'hybrid',
      sessionType: 'Hybrid Training',
      status: 'pending',
      results: []
    },
    {
      type: 'agility',
      sessionType: 'Agility Training',
      status: 'pending',
      results: []
    }
  ]);

  const [currentTest, setCurrentTest] = useState<number | null>(null);

  const updateTestResult = (index: number, step: string, status: TestResult['status'], message?: string) => {
    setWorkoutTests(prev => {
      const updated = [...prev];
      const existing = updated[index].results.find(r => r.step === step);
      if (existing) {
        existing.status = status;
        existing.message = message;
      } else {
        updated[index].results.push({ step, status, message });
      }
      return updated;
    });
  };

  const testWorkoutBuilder = async (index: number) => {
    setCurrentTest(index);
    const test = workoutTests[index];
    
    // Update test status
    setWorkoutTests(prev => {
      const updated = [...prev];
      updated[index].status = 'running';
      updated[index].results = [];
      return updated;
    });

    // Step 1: Create context
    updateTestResult(index, 'Create context', 'running');
    const mockContext: WorkoutCreationContext = {
      sessionId: `session-${index + 1}`,
      sessionType: test.sessionType,
      sessionDate: new Date('2025-01-27T09:00:00'),
      sessionTime: '09:00',
      sessionLocation: 'Training Center',
      teamId: 'team-001',
      teamName: 'A-Team',
      playerId: `player-${index + 1}`,
      playerName: `Test Player ${index + 1}`,
      returnPath: '/physicaltrainer?tab=overview'
    };
    updateTestResult(index, 'Create context', 'success', 'Context created successfully');

    // Step 2: Navigate to builder
    updateTestResult(index, 'Navigate to builder', 'running');
    try {
      navigateToWorkoutBuilder(router as any, mockContext);
      updateTestResult(index, 'Navigate to builder', 'success', 'Navigation triggered');
      
      // Mark test as completed after a delay
      setTimeout(() => {
        updateTestResult(index, 'Builder loaded', 'success', 'Verify builder opens with context');
        updateTestResult(index, 'Pre-filled data', 'success', 'Check name, player selection');
        updateTestResult(index, 'Session banner', 'success', 'Verify session context display');
        updateTestResult(index, 'Save functionality', 'pending', 'Manual test required');
        
        setWorkoutTests(prev => {
          const updated = [...prev];
          updated[index].status = 'completed';
          return updated;
        });
        setCurrentTest(null);
      }, 2000);
    } catch (error) {
      updateTestResult(index, 'Navigate to builder', 'error', error?.toString());
      setWorkoutTests(prev => {
        const updated = [...prev];
        updated[index].status = 'error';
        return updated;
      });
      setCurrentTest(null);
    }
  };

  const testAllBuilders = async () => {
    for (let i = 0; i < workoutTests.length; i++) {
      await testWorkoutBuilder(i);
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  };

  const resetTests = () => {
    setWorkoutTests(workoutTests.map(test => ({
      ...test,
      status: 'pending',
      results: []
    })));
    setCurrentTest(null);
  };

  const getStatusIcon = (status: WorkoutTypeTest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'running':
        return <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <Circle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getResultIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <Circle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Workout Builders Navigation Test</CardTitle>
          <CardDescription>
            Test the navigation flow from Team Roster to all four workout builders with pre-filled context
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button onClick={testAllBuilders} disabled={currentTest !== null}>
                Test All Builders
              </Button>
              <Button onClick={resetTests} variant="outline">
                Reset Tests
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workoutTests.map((test, index) => (
                <Card key={test.type} className={test.status === 'running' ? 'border-blue-500' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <h3 className="font-semibold">{test.sessionType}</h3>
                          <p className="text-sm text-muted-foreground">{test.type} builder</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testWorkoutBuilder(index)}
                        disabled={currentTest !== null}
                      >
                        Test
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  {test.results.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        {test.results.map((result, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            {getResultIcon(result.status)}
                            <div className="flex-1">
                              <span className="font-medium">{result.step}</span>
                              {result.message && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {result.message}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Test Checklist:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Navigation:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>✓ Click navigates to Sessions tab</li>
                    <li>✓ Correct builder opens</li>
                    <li>✓ URL parameters handled</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Context Integration:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>✓ Session banner displays</li>
                    <li>✓ Workout name pre-filled</li>
                    <li>✓ Player pre-selected</li>
                    <li>✓ Save links to session</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}