/**
 * Example usage of useWorkoutBuilder hook
 * This file demonstrates how to integrate the hook with different workout builders
 */

import React from 'react';
import { useWorkoutBuilder } from './useWorkoutBuilder';
import { WorkoutType } from '../types/session.types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  X, 
  Undo, 
  Redo, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

// Example: Conditioning Workout Builder using the hook
export function ConditioningWorkoutBuilderExample() {
  const {
    formData,
    isDirty,
    isValid,
    hasChanges,
    lastSaved,
    canUndo,
    canRedo,
    errors,
    warnings,
    updateFormData,
    save,
    cancel,
    undo,
    redo,
    validate,
    autoSaveStatus,
    isAutoSaveEnabled,
    enableAutoSave,
    disableAutoSave,
    getWorkoutData,
    setWorkoutData
  } = useWorkoutBuilder({
    workoutType: WorkoutType.CONDITIONING,
    initialData: {
      name: 'High Intensity Intervals',
      duration: 45,
      intensity: 'high',
      description: 'HIIT workout for advanced players'
    },
    onSave: async (data) => {
      // Simulate API call
      console.log('Saving workout:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onCancel: () => {
      console.log('Cancelled workout creation');
      // Navigate back or close modal
    },
    autoSaveEnabled: true,
    autoSaveDelay: 2000,
    validateOnChange: true
  });

  // Get conditioning-specific data
  const intervalProgram = getWorkoutData();

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Conditioning Workout Builder</h2>
          
          {/* Undo/Redo buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Auto-save indicator */}
          {isDirty && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {autoSaveStatus === 'saving' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Saved</span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>Save failed</span>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Save/Cancel buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={cancel}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={!isValid || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Workout
          </Button>
        </div>
      </div>
      
      {/* Auto-save toggle */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        <label className="text-sm font-medium">Auto-save</label>
        <Button
          variant="outline"
          size="sm"
          onClick={isAutoSaveEnabled ? disableAutoSave : enableAutoSave}
        >
          {isAutoSaveEnabled ? 'Enabled' : 'Disabled'}
        </Button>
        {lastSaved && (
          <span className="text-sm text-muted-foreground">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {/* Validation errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, idx) => (
                <li key={idx}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Validation warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Basic form fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Workout Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => updateFormData({ duration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
          />
        </div>
      </div>
      
      {/* Workout-specific content would go here */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-2">Interval Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Add your interval-specific UI components here
        </p>
        {/* Your ConditioningWorkoutBuilder components */}
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <div>
          {hasChanges ? 'Unsaved changes' : 'No changes'}
        </div>
        <div>
          {formData.assignedPlayerIds.length} players, {formData.assignedTeamIds.length} teams
        </div>
      </div>
    </div>
  );
}

// Example: Using with different workout types
export function WorkoutBuilderWrapper({ type }: { type: WorkoutType }) {
  const builderProps = useWorkoutBuilder({
    workoutType: type,
    onSave: async (data) => {
      console.log(`Saving ${type} workout:`, data);
      // API call here
    },
    onCancel: () => {
      console.log('Cancelled');
    }
  });

  // Render appropriate builder based on type
  switch (type) {
    case WorkoutType.STRENGTH:
      return <StrengthBuilder {...builderProps} />;
    case WorkoutType.CONDITIONING:
      return <ConditioningBuilder {...builderProps} />;
    case WorkoutType.HYBRID:
      return <HybridBuilder {...builderProps} />;
    case WorkoutType.AGILITY:
      return <AgilityBuilder {...builderProps} />;
    default:
      return null;
  }
}

// Example: Integrating with existing builders
function StrengthBuilder(props: ReturnType<typeof useWorkoutBuilder>) {
  const { formData, updateFormData, setWorkoutData } = props;
  
  // Use the hook's utilities
  const handleAddExercise = (exercise: any) => {
    const currentWorkout = props.getWorkoutData() || { exercises: [] };
    setWorkoutData({
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, exercise]
    });
  };
  
  return (
    <div>
      {/* Your existing StrengthWorkoutBuilder UI */}
      <h3>Strength Workout</h3>
      {/* ... */}
    </div>
  );
}

// Similar implementations for other workout types...
function ConditioningBuilder(props: ReturnType<typeof useWorkoutBuilder>) {
  return <div>Conditioning Builder</div>;
}

function HybridBuilder(props: ReturnType<typeof useWorkoutBuilder>) {
  return <div>Hybrid Builder</div>;
}

function AgilityBuilder(props: ReturnType<typeof useWorkoutBuilder>) {
  return <div>Agility Builder</div>;
}