'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import WorkoutBuilderErrorBoundary from './shared/WorkoutBuilderErrorBoundary';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  arrayMove,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
function SortableItem({ id }: { id: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="p-3 border rounded bg-white cursor-move hover:shadow-md"
    >
      {id} - Drag me!
    </div>
  );
}

// Test DnD imports
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
  
  const [items, setItems] = useState(['item-1', 'item-2', 'item-3']);
  
  const handleSave = () => {
    console.log('Save clicked');
    if (onSave) {
      onSave({ name: 'Test Flexibility Program' });
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string || '');
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <WorkoutBuilderHeader
        title="Flexibility Workout Builder (DnD Test)"
        workoutType="flexibility"
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={false}
        supportsBulkMode={false}
        bulkMode={false}
      />
      
      <div className="p-4">
        <h3 className="font-bold mb-4">Testing DnD Components</h3>
        <p className="mb-4">If you see draggable items below, DnD is working:</p>
        
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((id) => (
                <SortableItem key={id} id={id} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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