import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WorkoutBuilderErrorBoundary from './WorkoutBuilderErrorBoundary';
import { useAutoSave } from '../../hooks/useAutoSave';

// Test component to demonstrate error boundary functionality
function TestWorkoutBuilder() {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<string[]>([]);

  // Auto-save setup
  const { clearSavedData } = useAutoSave({
    key: 'test_workout_builder',
    data: { workoutName, exercises },
    enabled: true,
    delay: 1000,
    onRestore: (data) => {
      setWorkoutName(data.workoutName || '');
      setExercises(data.exercises || []);
    }
  });

  // Test error functions
  const triggerNetworkError = () => {
    throw new Error('Network request failed: Unable to connect to server');
  };

  const triggerAuthError = () => {
    throw new Error('401 Unauthorized: Your session has expired');
  };

  const triggerValidationError = () => {
    throw new Error('Validation error: Workout name is required and must be at least 3 characters');
  };

  const triggerSystemError = () => {
    throw new Error('RangeError: Maximum call stack size exceeded');
  };

  const triggerUnknownError = () => {
    throw new Error('Something unexpected happened in the workout builder');
  };

  const simulateAsyncError = async () => {
    try {
      const response = await fetch('/api/nonexistent-endpoint');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Network error: ${error}`);
    }
  };

  const handleSave = () => {
    if (!workoutName) {
      throw new Error('Validation error: Workout name is required');
    }
    
    if (exercises.length === 0) {
      throw new Error('Validation error: At least one exercise must be added');
    }

    // Simulate save success
    clearSavedData();
    alert('Workout saved successfully!');
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Workout Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Workout Name</label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter workout name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Exercises</label>
            <Button
              onClick={() => setExercises([...exercises, `Exercise ${exercises.length + 1}`])}
              variant="outline"
              size="sm"
            >
              Add Exercise
            </Button>
            <ul className="mt-2 list-disc list-inside">
              {exercises.map((exercise, index) => (
                <li key={index}>{exercise}</li>
              ))}
            </ul>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Workout
          </Button>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Test Error Scenarios</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={triggerNetworkError} variant="destructive" size="sm">
                Network Error
              </Button>
              <Button onClick={triggerAuthError} variant="destructive" size="sm">
                Auth Error
              </Button>
              <Button onClick={triggerValidationError} variant="destructive" size="sm">
                Validation Error
              </Button>
              <Button onClick={triggerSystemError} variant="destructive" size="sm">
                System Error
              </Button>
              <Button onClick={triggerUnknownError} variant="destructive" size="sm">
                Unknown Error
              </Button>
              <Button onClick={simulateAsyncError} variant="destructive" size="sm">
                Async Error
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export wrapped with error boundary
export default function ErrorBoundaryTest() {
  return (
    <WorkoutBuilderErrorBoundary 
      workoutType="strength"
      sessionId="test-session"
      onReset={() => {
        console.log('Error boundary test reset');
      }}
    >
      <TestWorkoutBuilder />
    </WorkoutBuilderErrorBoundary>
  );
}