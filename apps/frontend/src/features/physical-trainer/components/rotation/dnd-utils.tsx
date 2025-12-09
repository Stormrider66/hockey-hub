'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  Active,
  Over
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Type definitions to match @hello-pangea/dnd API
export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
}

// Convert @dnd-kit event to @hello-pangea/dnd-like result
export function convertDragEndEvent(event: DragEndEvent): DragResult | null {
  const { active, over } = event;
  
  if (!active || !over) {
    return null;
  }

  const activeData = active.data.current || {};
  const overData = over.data.current || {};

  return {
    draggableId: active.id.toString(),
    type: activeData.type || 'default',
    source: {
      droppableId: activeData.droppableId || '',
      index: activeData.index || 0
    },
    destination: over ? {
      droppableId: overData.droppableId || over.id.toString(),
      index: overData.index || 0
    } : null
  };
}

// DragDropContext replacement
interface DragDropContextProps {
  onDragEnd: (result: DragResult) => void;
  children: React.ReactNode;
}

export function DragDropContext({ onDragEnd, children }: DragDropContextProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const result = convertDragEndEvent(event);
    if (result) {
      onDragEnd(result);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeId ? <div>Dragging {activeId}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable replacement
interface DroppableProps {
  droppableId: string;
  type?: string;
  children: (provided: any, snapshot: any) => React.ReactElement;
}

export function Droppable({ droppableId, type = 'default', children }: DroppableProps) {
  // For sortable lists, we'll use SortableContext
  // For simple drop zones, we'll use a div with data attributes
  const [items, setItems] = React.useState<string[]>([]);

  const provided = {
    innerRef: React.useRef(null),
    droppableProps: {
      'data-droppable-id': droppableId,
      'data-type': type
    },
    placeholder: null
  };

  const snapshot = {
    isDraggingOver: false,
    draggingOverWith: null
  };

  return (
    <SortableContext
      items={items}
      strategy={verticalListSortingStrategy}
    >
      {children(provided, snapshot)}
    </SortableContext>
  );
}

// Draggable replacement
interface DraggableProps {
  draggableId: string;
  index: number;
  type?: string;
  children: (provided: any, snapshot: any) => React.ReactElement;
}

export function Draggable({ draggableId, index, type = 'default', children }: DraggableProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: draggableId,
    data: {
      type,
      index,
      droppableId: 'parent' // This should be set by parent context
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const provided = {
    innerRef: setNodeRef,
    draggableProps: {
      ...attributes,
      style,
      'data-draggable-id': draggableId
    },
    dragHandleProps: {
      ...listeners
    }
  };

  const snapshot = {
    isDragging,
    draggingOver: null
  };

  return children(provided, snapshot);
}