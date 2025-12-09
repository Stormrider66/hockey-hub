'use client';

import React from 'react';
import { DragDropContext, Droppable, Draggable } from './dnd-utils';

export default function TestDragDrop() {
  const [items, setItems] = React.useState([
    { id: '1', content: 'Item 1' },
    { id: '2', content: 'Item 2' },
    { id: '3', content: 'Item 3' },
  ]);

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, reorderedItem);
    
    setItems(newItems);
    console.log('Drag completed:', result);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Drag and Drop Test</h1>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="test-list" type="test">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 p-4 border-2 rounded ${
                snapshot.isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index} type="test">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`p-4 bg-white border rounded cursor-move ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      }`}
                      style={provided.draggableProps.style}
                    >
                      {item.content}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}