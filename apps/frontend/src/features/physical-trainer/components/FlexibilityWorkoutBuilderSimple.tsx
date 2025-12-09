'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import WorkoutBuilderErrorBoundary from './shared/WorkoutBuilderErrorBoundary';

interface FlexibilityWorkoutBuilderProps {
  onSave?: (program: any) => void;
  onCancel: () => void;
  initialProgram?: any;
  selectedPlayers?: string[];
  teamId?: string;
  scheduledDate?: Date;
  location?: string;
}

function FlexibilityWorkoutBuilderInternal({
  onSave,
  onCancel,
  initialProgram,
  selectedPlayers = [],
  teamId = 'team-001',
  scheduledDate = new Date(),
  location = 'Training Center'
}: FlexibilityWorkoutBuilderProps) {
  
  const handleSave = () => {
    console.log('Save clicked');
    if (onSave) {
      onSave({ name: 'Test Flexibility Program' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <WorkoutBuilderHeader
        title="Flexibility Workout Builder (Simple)"
        workoutType="flexibility"
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={false}
        supportsBulkMode={false}
        bulkMode={false}
      />
      
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Simple Flexibility Builder Test</h2>
        <p className="mb-4">This is a minimal version to test if the error is in the component structure.</p>
        <Button onClick={handleSave}>Save Test</Button>
      </div>
    </div>
  );
}

export default function FlexibilityWorkoutBuilder(props: FlexibilityWorkoutBuilderProps) {
  return (
    <WorkoutBuilderErrorBoundary 
      workoutType="flexibility"
      sessionId={props.initialProgram?.id}
      onReset={() => {
        console.log('Flexibility workout builder reset after error');
      }}
    >
      <FlexibilityWorkoutBuilderInternal {...props} />
    </WorkoutBuilderErrorBoundary>
  );
}