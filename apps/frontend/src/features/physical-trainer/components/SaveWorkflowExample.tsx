import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Calendar, Eye, Users, AlertCircle } from 'lucide-react';
import { useSaveWorkflow, type SuccessModalProps } from '../hooks/useSaveWorkflow';
import { SaveWorkflowProgress } from './SaveWorkflowProgress';
import { WorkoutType } from '../types/session.types';
import { cn } from '@/lib/utils';

// Example usage in a workout builder component
export const WorkoutBuilderExample: React.FC = () => {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  
  // Example workout data
  const workoutData = {
    name: 'High Intensity Training Session',
    description: 'Full body strength workout with cardio intervals',
    date: new Date().toISOString(),
    duration: 90,
    location: 'Main Training Center',
    exercises: [
      // ... exercise data
    ],
    intervalProgram: {
      // ... for conditioning workouts
    }
  };
  
  const playerAssignments = {
    players: ['player-1', 'player-2', 'player-3'],
    teams: ['team-1']
  };
  
  // Initialize the save workflow hook
  const saveWorkflow = useSaveWorkflow({
    workoutType: WorkoutType.STRENGTH,
    workoutData,
    playerAssignments,
    onSaveSuccess: (result) => {
      console.log('Workout saved successfully:', result);
      setIsSaveDialogOpen(false);
    },
    onSaveError: (error) => {
      console.error('Save failed:', error);
    },
    showSuccessModal: true,
    autoSchedule: false
  });
  
  const handleSave = async () => {
    setIsSaveDialogOpen(true);
    await saveWorkflow.save();
  };
  
  return (
    <>
      {/* Your workout builder UI */}
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Workout Builder Example</CardTitle>
            <CardDescription>
              Example showing how to integrate the save workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSave}>
              Save Workout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Progress Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Saving Workout</DialogTitle>
          </DialogHeader>
          
          <SaveWorkflowProgress
            workflow={saveWorkflow}
            onRetry={saveWorkflow.retry}
            onCancel={() => {
              saveWorkflow.reset();
              setIsSaveDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {saveWorkflow.successModalProps && (
        <WorkoutSaveSuccessModal {...saveWorkflow.successModalProps} />
      )}
    </>
  );
};

// Success Modal Component
export const WorkoutSaveSuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  result,
  workoutType,
  title,
  onSchedule,
  onViewDetails
}) => {
  const isMultiple = result.createdCount && result.createdCount > 1;
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <div className="text-center space-y-6 py-6">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          
          {/* Success Message */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {isMultiple ? 'Workouts Created Successfully!' : 'Workout Saved Successfully!'}
            </h3>
            <p className="text-muted-foreground">
              {isMultiple 
                ? `${result.createdCount} workout sessions have been created.`
                : `Your ${workoutType} workout "${title}" has been saved.`
              }
            </p>
          </div>
          
          {/* Conflict Resolution Info */}
          {result.errors && result.errors.length > 0 && (
            <Alert className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {result.errors.length} conflicts were skipped. 
                Check the details for more information.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onViewDetails && result.workoutId && (
              <Button
                variant="default"
                onClick={onViewDetails}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Button>
            )}
            
            {onSchedule && (
              <Button
                variant="outline"
                onClick={onSchedule}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Go to Calendar
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
          
          {/* Additional Info */}
          {isMultiple && result.assignments && (
            <div className="text-sm text-muted-foreground pt-4 border-t">
              <p className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Assigned to {result.assignments.length} players across multiple dates
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Example of minimal integration
export const MinimalSaveExample: React.FC = () => {
  const saveWorkflow = useSaveWorkflow({
    workoutType: WorkoutType.CONDITIONING,
    workoutData: {
      name: 'HIIT Cardio',
      duration: 45,
      intervalProgram: {
        // ... interval data
      }
    },
    playerAssignments: {
      players: ['player-1'],
      teams: []
    }
  });
  
  return (
    <Button 
      onClick={saveWorkflow.save}
      disabled={!saveWorkflow.canProceed}
      className="relative"
    >
      {saveWorkflow.isSaving && (
        <span className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Loader2 className="w-4 h-4 animate-spin" />
        </span>
      )}
      Save Workout
    </Button>
  );
};

// Example with inline progress
export const InlineProgressExample: React.FC = () => {
  const [showProgress, setShowProgress] = useState(false);
  
  const saveWorkflow = useSaveWorkflow({
    workoutType: WorkoutType.HYBRID,
    workoutData: {
      name: 'Circuit Training',
      hybridProgram: {
        // ... hybrid program data
      }
    },
    playerAssignments: {
      players: [],
      teams: ['team-1', 'team-2']
    }
  });
  
  const handleSave = async () => {
    setShowProgress(true);
    const result = await saveWorkflow.save();
    if (result?.success) {
      setShowProgress(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {showProgress && (
        <SaveWorkflowProgress 
          workflow={saveWorkflow}
          onCancel={() => {
            saveWorkflow.reset();
            setShowProgress(false);
          }}
        />
      )}
      
      {!showProgress && (
        <Button onClick={handleSave}>
          Save Hybrid Workout
        </Button>
      )}
    </div>
  );
};