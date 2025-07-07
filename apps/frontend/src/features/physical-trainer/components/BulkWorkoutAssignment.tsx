'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@hockey-hub/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Calendar, 
  Dumbbell, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Filter,
  Search,
  Upload,
  X
} from 'lucide-react';

// Import child components
import PlayerSelector from './PlayerSelector';
import MedicalRestrictionPanel from './MedicalRestrictionPanel';
import WorkoutBuilder from './WorkoutBuilder';
import WorkoutPreview from './WorkoutPreview';
import ConflictResolver from './ConflictResolver';
import { ConfirmationDialog } from './ConfirmationDialog';

// Import API hooks
import { 
  useCreateWorkoutSessionMutation,
  useGetTemplatesQuery,
  useGetWorkoutSessionsQuery,
  useCreateBulkWorkoutAssignmentMutation
} from '@/store/api/trainingApi';
import { useGetActiveInjuriesQuery } from '@/store/api/medicalApi';
import { useToast } from '@/hooks/use-toast';

// Types
interface TargetSelection {
  type: 'organization' | 'team' | 'group' | 'individual';
  id?: string;
  name?: string;
  playerIds: string[];
}

interface WorkoutData {
  title: string;
  description?: string;
  type: 'strength' | 'cardio' | 'skill' | 'recovery' | 'mixed';
  templateId?: string;
  exercises: any[];
  duration: number;
  location: string;
  equipment: string[];
}

interface ScheduleData {
  dates: Date[];
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  time: string;
}

interface BulkWorkoutAssignmentProps {
  organizationId: string;
  userId: string;
  onClose?: () => void;
  onSuccess?: (assignmentCount: number) => void;
}

export default function BulkWorkoutAssignment({
  organizationId,
  userId,
  onClose,
  onSuccess
}: BulkWorkoutAssignmentProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { toast } = useToast();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [targetSelection, setTargetSelection] = useState<TargetSelection>({
    type: 'team',
    playerIds: []
  });
  const [workoutData, setWorkoutData] = useState<WorkoutData>({
    title: '',
    type: 'mixed',
    exercises: [],
    duration: 60,
    location: '',
    equipment: []
  });
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    dates: [],
    time: '09:00'
  });
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API queries
  const { data: templates } = useGetTemplatesQuery({ category: undefined });
  const { data: injuries } = useGetActiveInjuriesQuery();
  const [createBulkAssignment] = useCreateBulkWorkoutAssignmentMutation();

  // Calculate medical restrictions
  const medicalRestrictions = useMemo(() => {
    if (!injuries) return [];
    
    return targetSelection.playerIds
      .map(playerId => {
        const playerInjuries = injuries.filter(injury => 
          injury.player_id.toString() === playerId
        );
        if (playerInjuries.length > 0) {
          return {
            playerId,
            injuries: playerInjuries,
            restrictions: playerInjuries.flatMap(injury => {
              // Map injury types to restrictions
              const restrictionMap: Record<string, string[]> = {
                'hamstring': ['no_sprinting', 'limited_jumping'],
                'knee': ['no_squats', 'no_jumping', 'limited_running'],
                'shoulder': ['no_overhead', 'limited_pushing'],
                'back': ['no_heavy_lifting', 'limited_rotation'],
                'ankle': ['no_jumping', 'limited_agility']
              };
              return restrictionMap[injury.injury_type.toLowerCase()] || ['general_caution'];
            })
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [injuries, targetSelection.playerIds]);

  // Step navigation
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
    }
  };

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return targetSelection.playerIds.length > 0;
      case 2:
        return workoutData.title && workoutData.exercises.length > 0;
      case 3:
        return scheduleData.dates.length > 0;
      case 4:
        return true; // Always can proceed from review
      default:
        return false;
    }
  }, [currentStep, targetSelection, workoutData, scheduleData]);

  // Handle bulk assignment submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const scheduleDates = scheduleData.dates.map(date => {
        const scheduledDate = new Date(date);
        scheduledDate.setHours(
          parseInt(scheduleData.time.split(':')[0]),
          parseInt(scheduleData.time.split(':')[1])
        );
        return scheduledDate.toISOString();
      });

      const result = await createBulkAssignment({
        templateId: workoutData.templateId,
        workout: {
          title: workoutData.title,
          description: workoutData.description,
          type: workoutData.type,
          scheduledDate: scheduleDates[0], // Default date for the workout template
          location: workoutData.location,
          teamId: targetSelection.type === 'team' ? targetSelection.id! : organizationId,
          playerIds: targetSelection.playerIds,
          estimatedDuration: workoutData.duration,
          exercises: workoutData.exercises,
          settings: {
            allowIndividualLoads: true,
            displayMode: 'grid',
            showMetrics: true,
            autoRotation: false,
            rotationInterval: 30
          }
        },
        playerIds: targetSelection.playerIds,
        scheduleDates,
        conflictResolution: 'skip' // Default conflict resolution
      }).unwrap();

      toast({
        title: t('physicalTrainer:bulkAssignment.success'),
        description: t('physicalTrainer:bulkAssignment.successDescription', {
          count: result.data.created
        }),
      });

      onSuccess?.(result.data.created);
      onClose?.();
    } catch (error) {
      console.error('Failed to create bulk assignments:', error);
      toast({
        title: t('physicalTrainer:bulkAssignment.error'),
        description: t('physicalTrainer:bulkAssignment.errorDescription'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: t('physicalTrainer:bulkAssignment.steps.target') },
      { num: 2, label: t('physicalTrainer:bulkAssignment.steps.workout') },
      { num: 3, label: t('physicalTrainer:bulkAssignment.steps.schedule') },
      { num: 4, label: t('physicalTrainer:bulkAssignment.steps.review') }
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.num}>
            <div 
              className={`flex items-center cursor-pointer ${
                currentStep >= step.num ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => goToStep(step.num)}
            >
              <div className={`
                rounded-full w-10 h-10 flex items-center justify-center border-2
                ${currentStep >= step.num 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'border-muted-foreground'
                }
              `}>
                {currentStep > step.num ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  step.num
                )}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-5 w-5 text-muted-foreground mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6" />
                {t('physicalTrainer:bulkAssignment.title')}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {t('physicalTrainer:bulkAssignment.subtitle')}
              </p>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          
          {/* Medical Restrictions Alert */}
          {medicalRestrictions.length > 0 && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('physicalTrainer:bulkAssignment.medicalAlert', {
                  count: medicalRestrictions.length
                })}
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          <div className="mt-6">
            {currentStep === 1 && (
              <PlayerSelector
                organizationId={organizationId}
                targetSelection={targetSelection}
                onSelectionChange={setTargetSelection}
                medicalRestrictions={medicalRestrictions}
              />
            )}

            {currentStep === 2 && (
              <WorkoutBuilder
                workoutData={workoutData}
                onWorkoutChange={setWorkoutData}
                templates={templates?.data || []}
                playerCount={targetSelection.playerIds.length}
                medicalRestrictions={medicalRestrictions}
              />
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {t('physicalTrainer:bulkAssignment.schedule.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Schedule component would go here */}
                    <div className="text-center py-8 text-muted-foreground">
                      Schedule selection component
                    </div>
                  </CardContent>
                </Card>

                {conflicts.length > 0 && (
                  <ConflictResolver
                    conflicts={conflicts}
                    onResolve={(resolved) => setConflicts(resolved)}
                  />
                )}
              </div>
            )}

            {currentStep === 4 && (
              <WorkoutPreview
                targetSelection={targetSelection}
                workoutData={workoutData}
                scheduleData={scheduleData}
                medicalRestrictions={medicalRestrictions}
                conflicts={conflicts}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              {t('common:actions.previous')}
            </Button>

            <div className="flex items-center gap-2">
              {medicalRestrictions.length > 0 && (
                <MedicalRestrictionPanel
                  restrictions={medicalRestrictions}
                  compact
                />
              )}
              
              {currentStep < 4 ? (
                <Button
                  onClick={() => goToStep(currentStep + 1)}
                  disabled={!canProceed}
                >
                  {t('common:actions.next')}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowConfirmation(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      {t('common:actions.creating')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {t('physicalTrainer:bulkAssignment.createAssignments', {
                        count: targetSelection.playerIds.length * scheduleData.dates.length
                      })}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleSubmit}
        title={t('physicalTrainer:bulkAssignment.confirmation.title')}
        description={t('physicalTrainer:bulkAssignment.confirmation.description', {
          playerCount: targetSelection.playerIds.length,
          sessionCount: scheduleData.dates.length,
          totalAssignments: targetSelection.playerIds.length * scheduleData.dates.length
        })}
        confirmText={t('common:actions.confirm')}
        cancelText={t('common:actions.cancel')}
        variant="default"
      />
    </div>
  );
}