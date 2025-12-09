import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WorkoutSuccessModal } from './WorkoutSuccessModal';
import { WorkoutType } from '../../types';

/**
 * Example usage of the WorkoutSuccessModal component
 * 
 * This example demonstrates how to integrate the success modal
 * into your workout creation flow.
 */
export function WorkoutSuccessModalExample() {
  const [showModal, setShowModal] = useState(false);
  
  // Example workout data
  const workoutData = {
    workoutType: WorkoutType.CONDITIONING,
    workoutName: '20-min HIIT Rowing',
    playerCount: 12,
    teamCount: 2,
    duration: 20,
    exerciseCount: 8,
  };
  
  // Example handlers
  const handleSchedule = () => {
    console.log('Opening calendar to schedule workout...');
    // Navigate to calendar with workout pre-selected
  };
  
  const handleCreateTemplate = () => {
    console.log('Creating template from workout...');
    // Open template creation dialog
  };
  
  const handleCreateAnother = () => {
    console.log('Creating another workout of same type...');
    // Open the same workout builder again
  };
  
  const handleViewWorkout = () => {
    console.log('Viewing workout details...');
    // Navigate to workout details page
  };
  
  const handleNotifyPlayers = () => {
    console.log('Sending notifications to players...');
    // Send notifications via notification service
  };
  
  const handleCreateDifferentType = () => {
    console.log('Opening workout type selector...');
    // Show workout type selector or close modal
  };
  
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">WorkoutSuccessModal Example</h2>
      
      <Button onClick={() => setShowModal(true)}>
        Show Success Modal
      </Button>
      
      <WorkoutSuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        {...workoutData}
        onSchedule={handleSchedule}
        onCreateTemplate={handleCreateTemplate}
        onCreateAnother={handleCreateAnother}
        onViewWorkout={handleViewWorkout}
        onNotifyPlayers={handleNotifyPlayers}
        onCreateDifferentType={handleCreateDifferentType}
      />
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Integration Guide:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Import the WorkoutSuccessModal component</li>
          <li>Add state to control modal visibility</li>
          <li>After successful workout save, show the modal with workout details</li>
          <li>Implement handlers for each action button</li>
          <li>The modal will guide users to logical next steps</li>
        </ol>
        
        <h3 className="text-lg font-semibold mt-6">Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Success animation with workout type icon</li>
          <li>Workout summary (name, players, teams, duration)</li>
          <li>Quick action buttons for common workflows</li>
          <li>Contextual tips based on workout type</li>
          <li>Accessible keyboard navigation</li>
        </ul>
      </div>
    </div>
  );
}