import React, { useState, useEffect } from 'react';
import WorkoutBuilderErrorBoundary from './WorkoutBuilderErrorBoundary';
import { useAutoSave } from '../../hooks/useAutoSave';
import { toast } from '@/components/ui/use-toast';

// Example of how to use the enhanced error boundary with a workout builder
interface ExampleWorkoutBuilderProps {
  sessionId?: string;
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
}

function ExampleWorkoutBuilder({ sessionId, workoutType }: ExampleWorkoutBuilderProps) {
  const [workoutData, setWorkoutData] = useState({
    name: '',
    exercises: [],
    duration: 0
  });

  const autoSaveKey = `workout_builder_autosave_${workoutType}_${sessionId || 'new'}`;

  // Use auto-save hook
  const { getSavedData, clearSavedData, hasAutoSave } = useAutoSave({
    key: autoSaveKey,
    data: workoutData,
    enabled: true,
    delay: 2000,
    onSave: () => {
      // Show subtle indicator that work is being saved
      console.log('Auto-saved');
    },
    onRestore: (data) => {
      setWorkoutData(data);
      toast({
        title: "Workout restored",
        description: "Your previous work has been loaded"
      });
    }
  });

  // Check for auto-save on mount
  useEffect(() => {
    if (hasAutoSave()) {
      const saved = getSavedData();
      if (saved) {
        setWorkoutData(saved);
        toast({
          title: "Auto-save found",
          description: "Your previous work has been restored"
        });
      }
    }
  }, []);

  // Example error trigger for testing
  const triggerError = (type: string) => {
    switch (type) {
      case 'network':
        throw new Error('Network request failed: Unable to fetch data');
      case 'auth':
        throw new Error('401 Unauthorized: Session expired');
      case 'validation':
        throw new Error('Validation error: Invalid exercise format');
      case 'system':
        throw new Error('Maximum call stack size exceeded');
      default:
        throw new Error('Unknown error occurred');
    }
  };

  const handleReset = () => {
    setWorkoutData({
      name: '',
      exercises: [],
      duration: 0
    });
    clearSavedData();
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        {workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout Builder
      </h2>
      
      <div className="space-y-4">
        <input
          type="text"
          value={workoutData.name}
          onChange={(e) => setWorkoutData({ ...workoutData, name: e.target.value })}
          placeholder="Workout name"
          className="w-full p-2 border rounded"
        />
        
        {/* Test error buttons - remove in production */}
        <div className="flex gap-2 p-4 bg-gray-100 rounded">
          <button onClick={() => triggerError('network')} className="px-3 py-1 bg-orange-500 text-white rounded">
            Network Error
          </button>
          <button onClick={() => triggerError('auth')} className="px-3 py-1 bg-red-500 text-white rounded">
            Auth Error
          </button>
          <button onClick={() => triggerError('validation')} className="px-3 py-1 bg-yellow-500 text-white rounded">
            Validation Error
          </button>
          <button onClick={() => triggerError('system')} className="px-3 py-1 bg-red-700 text-white rounded">
            System Error
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrapped component with error boundary
export default function WorkoutBuilderWithErrorBoundary(props: ExampleWorkoutBuilderProps) {
  return (
    <WorkoutBuilderErrorBoundary 
      workoutType={props.workoutType}
      sessionId={props.sessionId}
      onReset={() => console.log('Error boundary reset')}
    >
      <ExampleWorkoutBuilder {...props} />
    </WorkoutBuilderErrorBoundary>
  );
}

// Example of using the HOC approach
import { withWorkoutErrorBoundary } from './WorkoutBuilderErrorBoundary';

const SafeWorkoutBuilder = withWorkoutErrorBoundary(ExampleWorkoutBuilder, 'strength');

// Example of programmatic error handling
export function ProgrammaticErrorExample() {
  const [error, setError] = useState<Error | null>(null);

  const handleApiCall = async () => {
    try {
      const response = await fetch('/api/workouts');
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      // Process data
    } catch (err) {
      // Let error boundary handle it
      setError(err as Error);
    }
  };

  if (error) {
    throw error; // This will be caught by the error boundary
  }

  return (
    <div>
      <button onClick={handleApiCall}>Make API Call</button>
    </div>
  );
}