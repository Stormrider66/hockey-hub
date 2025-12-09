import React, { useState } from 'react';
import { useWorkout, useWorkoutBuilder } from '../workoutBuilder';
import { WorkoutType } from '@/features/physical-trainer/types';

// Example component showing how to use the workout builder state
const WorkoutBuilderExample: React.FC = () => {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  
  // Global workout builder state
  const {
    activeWorkouts,
    unsavedChanges,
    canUndo,
    canRedo,
    uiState,
    isAutoSaveEnabled,
    hasUnsavedChanges,
    actions: globalActions
  } = useWorkoutBuilder();
  
  // Specific workout state (if one is selected)
  const workoutState = useWorkout(selectedWorkoutId || '');
  
  // Create a new workout
  const handleCreateWorkout = (type: WorkoutType) => {
    globalActions.createWorkout(type, {
      name: `New ${type} Workout`,
      date: new Date().toISOString().split('T')[0],
      duration: 60
    });
  };
  
  // Update workout data
  const handleUpdateWorkout = (field: string, value: any) => {
    if (selectedWorkoutId && workoutState.workout) {
      workoutState.actions.updateData({
        [field]: value
      });
    }
  };
  
  // Add player to workout
  const handleAddPlayer = () => {
    if (selectedWorkoutId) {
      const mockPlayer = {
        id: `player_${Date.now()}`,
        name: 'John Doe',
        email: 'john@example.com',
        position: 'Forward'
      };
      workoutState.actions.addPlayer(mockPlayer);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Workout Builder State Example</h2>
      
      {/* Global State Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Global State</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p><strong>Active Workouts:</strong> {activeWorkouts.length}</p>
            <p><strong>Unsaved Changes:</strong> {hasUnsavedChanges ? 'Yes' : 'No'}</p>
            <p><strong>Auto-save:</strong> {isAutoSaveEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <p><strong>Can Undo:</strong> {canUndo ? 'Yes' : 'No'}</p>
            <p><strong>Can Redo:</strong> {canRedo ? 'Yes' : 'No'}</p>
            <p><strong>Selected Tab:</strong> {uiState.activeTab}</p>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleCreateWorkout(WorkoutType.STRENGTH)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Strength Workout
          </button>
          <button
            onClick={() => handleCreateWorkout(WorkoutType.CONDITIONING)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Create Conditioning Workout
          </button>
          <button
            onClick={() => handleCreateWorkout(WorkoutType.HYBRID)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Create Hybrid Workout
          </button>
          <button
            onClick={() => handleCreateWorkout(WorkoutType.AGILITY)}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Create Agility Workout
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={globalActions.undo}
            disabled={!canUndo}
            className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={globalActions.redo}
            disabled={!canRedo}
            className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
          >
            Redo
          </button>
          <button
            onClick={globalActions.toggleAutoSave}
            className={`px-3 py-1 rounded text-white ${
              isAutoSaveEnabled ? 'bg-green-500' : 'bg-gray-500'
            }`}
          >
            Auto-save: {isAutoSaveEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      
      {/* Active Workouts List */}
      <div className="bg-white border rounded-lg">
        <h3 className="text-lg font-semibold p-4 border-b">Active Workouts</h3>
        <div className="p-4">
          {activeWorkouts.length === 0 ? (
            <p className="text-gray-500">No active workouts</p>
          ) : (
            <div className="space-y-2">
              {activeWorkouts.map(workout => (
                <div
                  key={workout.id}
                  onClick={() => setSelectedWorkoutId(workout.id)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedWorkoutId === workout.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{workout.data.name || 'Untitled Workout'}</h4>
                      <p className="text-sm text-gray-600">
                        Type: {workout.type} | Date: {workout.data.date}
                      </p>
                      <p className="text-sm text-gray-600">
                        Players: {workout.players.length} | Teams: {workout.teams.length}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded text-xs ${
                        workout.isDirty 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {workout.isDirty ? 'Unsaved' : 'Saved'}
                      </span>
                      {workout.validationResults && (
                        <span className={`px-2 py-1 rounded text-xs mt-1 ${
                          workout.validationResults.isValid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {workout.validationResults.isValid ? 'Valid' : 'Invalid'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Selected Workout Details */}
      {selectedWorkoutId && workoutState.workout && (
        <div className="bg-white border rounded-lg">
          <h3 className="text-lg font-semibold p-4 border-b">
            Workout Details: {workoutState.workout.data.name}
          </h3>
          <div className="p-4 space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={workoutState.workout.data.name || ''}
                  onChange={(e) => handleUpdateWorkout('name', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={workoutState.workout.data.date || ''}
                  onChange={(e) => handleUpdateWorkout('date', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            
            {/* Workout Stats */}
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium mb-2">Stats</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Completeness:</span>
                  <div className="font-medium">{workoutState.completeness}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Assigned Players:</span>
                  <div className="font-medium">{workoutState.totalAssignedPlayers}</div>
                </div>
                <div>
                  <span className="text-gray-600">Validation:</span>
                  <div className={`font-medium ${
                    workoutState.isValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {workoutState.isValid ? 'Valid' : 'Invalid'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className={`font-medium ${
                    workoutState.isDirty ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {workoutState.isDirty ? 'Modified' : 'Saved'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Validation Errors */}
            {workoutState.validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <h4 className="font-medium text-red-800 mb-2">Validation Errors</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {workoutState.validationErrors.map((error, index) => (
                    <li key={index}>• {error.message}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={handleAddPlayer}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Mock Player
              </button>
              <button
                onClick={workoutState.actions.save}
                disabled={!workoutState.isDirty}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Save Workout
              </button>
              <button
                onClick={workoutState.actions.remove}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Workout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Developer Info */}
      <div className="bg-gray-100 p-4 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">Developer Info</h3>
        <p>This example demonstrates the comprehensive Redux state management for workout builders.</p>
        <p>The state includes auto-save, undo/redo, validation, offline support, and RTK Query integration.</p>
        <p>All workout types (Strength, Conditioning, Hybrid, Agility) use the same state management system.</p>
      </div>
    </div>
  );
};

export default WorkoutBuilderExample;