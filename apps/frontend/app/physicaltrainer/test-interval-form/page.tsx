'use client';

import React, { useState } from 'react';
import EnhancedIntervalForm from '@/features/physical-trainer/components/conditioning/EnhancedIntervalForm';
import { WorkoutEquipmentType, type IntervalSet } from '@/features/physical-trainer/types/conditioning.types';

export default function TestIntervalFormPage() {
  const [interval, setInterval] = useState<IntervalSet>({
    id: 'test-interval-1',
    name: 'Interval 1',
    type: 'work',
    targetType: 'time',
    duration: 180,
    equipment: WorkoutEquipmentType.ROWING,
    targetMetrics: {},
    color: '#ef4444'
  });

  const handleSave = (updatedInterval: IntervalSet) => {
    console.log('Saved interval:', updatedInterval);
    setInterval(updatedInterval);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Enhanced Interval Form Test</h1>
      <p className="mb-6 text-muted-foreground">
        This test page shows the enhanced interval form with Equipment selector, Primary Target Metric, and all advanced features including zones, watts, percentage of max, etc.
      </p>
      
      <div className="max-w-2xl">
        <EnhancedIntervalForm
          interval={interval}
          equipment={WorkoutEquipmentType.ROWING}
          onSave={handleSave}
          onCancel={() => console.log('Cancelled')}
          playerTests={[
            {
              id: 'test-1',
              playerId: 'player-1',
              testType: 'max_hr',
              value: 190,
              testDate: new Date(),
              unit: 'bpm'
            },
            {
              id: 'test-2',
              playerId: 'player-1',
              testType: 'ftp',
              value: 250,
              testDate: new Date(),
              unit: 'watts'
            }
          ]}
          selectedPlayers={['player-1']}
        />
      </div>

      <div className="mt-8 p-4 bg-muted rounded">
        <h2 className="font-semibold mb-2">Current Interval State:</h2>
        <pre className="text-xs">{JSON.stringify(interval, null, 2)}</pre>
      </div>
    </div>
  );
}