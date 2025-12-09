'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import WorkoutBuilderErrorBoundary from './shared/WorkoutBuilderErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Copy } from '@/components/icons';
import { FlexibilityStretchLibrary } from './flexibility/FlexibilityStretchLibrary';
import type { FlexibilityStretch } from '../types/flexibility.types';

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
  
  const [activeTab, setActiveTab] = useState<'build' | 'library' | 'sequence'>('library');
  const [selectedStretches, setSelectedStretches] = useState<FlexibilityStretch[]>([]);
  
  const handleSave = () => {
    console.log('Save clicked');
    if (onSave) {
      onSave({ name: 'Test Flexibility Program' });
    }
  };

  const handleSelectStretch = (stretch: FlexibilityStretch) => {
    setSelectedStretches(prev => [...prev, stretch]);
    console.log('Stretch selected:', stretch);
  };

  return (
    <div className="flex flex-col h-full">
      <WorkoutBuilderHeader
        title="Flexibility Workout Builder (Library Test)"
        workoutType="flexibility"
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={false}
        supportsBulkMode={false}
        bulkMode={false}
      />
      
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="build" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Program Builder
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Stretch Library
            </TabsTrigger>
            <TabsTrigger value="sequence" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Flow Sequence
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="build" className="h-full p-4">
            <div className="p-4 border rounded">
              <h3 className="font-bold mb-2">Build Tab Works!</h3>
              <p>Selected stretches: {selectedStretches.length}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="library" className="h-full p-4">
            <div className="h-full">
              <h3 className="font-bold mb-4">Testing Stretch Library Component</h3>
              <FlexibilityStretchLibrary 
                onSelectStretch={handleSelectStretch}
                selectedStretches={selectedStretches}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="sequence" className="h-full p-4">
            <div className="p-4 border rounded">
              <h3 className="font-bold mb-2">Sequence Tab Works!</h3>
            </div>
          </TabsContent>
        </Tabs>
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