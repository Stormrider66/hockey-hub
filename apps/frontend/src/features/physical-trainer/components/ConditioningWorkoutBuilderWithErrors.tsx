/**
 * Example integration of the standardized error handling system
 * This shows how to update the ConditioningWorkoutBuilder to use our new error system
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Clock,
  Plus,
  Save,
  X,
  Activity,
  Zap,
  Heart,
  Timer,
  TrendingUp,
  AlertTriangle,
  Copy,
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreateConditioningWorkoutMutation } from '@/store/api/trainingApi';
import type { 
  IntervalProgram, 
  IntervalSet, 
  WorkoutEquipmentType,
  WorkoutTemplate,
  PlayerTestResult
} from '../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../types/conditioning.types';

// Import our new error handling system
import { useErrorHandler, commonValidations } from '../hooks/useErrorHandler';
import { ErrorDisplay, ErrorList, FieldError } from './common/ErrorDisplay';

import IntervalForm from './conditioning/IntervalForm';
import IntervalTimeline from './conditioning/IntervalTimeline';
import EquipmentSelector from './conditioning/EquipmentSelector';
import WorkoutTemplateLibrary from './conditioning/WorkoutTemplateLibrary';
import TestBasedTargets from './conditioning/TestBasedTargets';
import WorkoutSummary from './conditioning/WorkoutSummary';
import { useAutoSave } from '../hooks/useAutoSave';

interface ConditioningWorkoutBuilderProps {
  onSave?: (program: IntervalProgram) => void;
  onCancel: () => void;
  initialProgram?: IntervalProgram;
  playerTests?: PlayerTestResult[];
  selectedPlayers?: string[];
  teamId?: string;
  scheduledDate?: Date;
  location?: string;
}

const ConditioningWorkoutBuilderWithErrors: React.FC<ConditioningWorkoutBuilderProps> = ({
  onSave,
  onCancel,
  initialProgram,
  playerTests = [],
  selectedPlayers = [],
  teamId = '',
  scheduledDate = new Date(),
  location = ''
}) => {
  const { t } = useTranslation('physicalTrainer');
  
  // Initialize error handler
  const errorHandler = useErrorHandler({
    showToast: true,
    showTechnicalDetails: process.env.NODE_ENV === 'development'
  });

  // State
  const [programName, setProgramName] = useState(initialProgram?.name || '');
  const [programDescription, setProgramDescription] = useState(initialProgram?.description || '');
  const [intervals, setIntervals] = useState<IntervalSet[]>(initialProgram?.intervals || []);
  const [selectedEquipment, setSelectedEquipment] = useState<WorkoutEquipmentType>(
    initialProgram?.equipment || WorkoutEquipmentType.ROWING
  );
  const [activeTab, setActiveTab] = useState<'build' | 'templates' | 'personalize'>('build');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [editingInterval, setEditingInterval] = useState<IntervalSet | null>(null);
  const [draggedInterval, setDraggedInterval] = useState<IntervalSet | null>(null);

  // API mutation
  const [createConditioningWorkout, { isLoading }] = useCreateConditioningWorkoutMutation();

  // Auto-save functionality
  const { clearSavedData } = useAutoSave('conditioning-workout', {
    programName,
    programDescription,
    intervals,
    selectedEquipment,
    activeTab,
    selectedTemplate
  });

  // Validation function
  const validateWorkout = useCallback(() => {
    errorHandler.clearErrors();
    
    // Validate workout name
    const nameValidation = commonValidations.workoutName(programName);
    const isNameValid = errorHandler.validateFields(nameValidation.validations.map(v => ({
      field: nameValidation.field,
      condition: v.condition,
      errorCode: v.errorCode
    })));

    // Validate intervals
    let hasIntervals = intervals.length > 0;
    if (!hasIntervals) {
      errorHandler.addFieldError('intervals', 'NO_INTERVALS_DEFINED');
    }

    // Validate individual intervals
    let allIntervalsValid = true;
    intervals.forEach((interval, index) => {
      // Check duration
      if (interval.duration < 1 || interval.duration > 3600) {
        errorHandler.addFieldError(
          `interval-${index}-duration`,
          'INVALID_DURATION_VALUE',
          { value: interval.duration, min: 1, max: 3600 }
        );
        allIntervalsValid = false;
      }

      // Check target metrics based on equipment
      if (interval.targetMetrics.heartRate?.value && 
          (interval.targetMetrics.heartRate.value < 40 || interval.targetMetrics.heartRate.value > 220)) {
        errorHandler.addFieldError(
          `interval-${index}-heartRate`,
          'INVALID_HEART_RATE_VALUE',
          { value: interval.targetMetrics.heartRate.value }
        );
        allIntervalsValid = false;
      }
    });

    return isNameValid && hasIntervals && allIntervalsValid;
  }, [programName, intervals, errorHandler]);

  // Handle save with validation
  const handleSave = useCallback(async () => {
    try {
      // Validate before saving
      if (!validateWorkout()) {
        errorHandler.addError('VALIDATION_ERROR');
        return;
      }

      const program: IntervalProgram = {
        id: initialProgram?.id || `program-${Date.now()}`,
        name: programName,
        description: programDescription,
        intervals,
        equipment: selectedEquipment,
        totalDuration: intervals.reduce((sum, interval) => sum + interval.duration, 0),
        difficulty: 'intermediate',
        tags: []
      };
      
      if (onSave) {
        onSave(program);
        return;
      }
      
      const workoutData = {
        title: programName,
        description: programDescription,
        type: 'conditioning' as const,
        scheduledDate: scheduledDate.toISOString(),
        location,
        teamId,
        playerIds: selectedPlayers,
        intervalProgram: program,
        personalizeForPlayers: selectedPlayers.length > 0
      };
      
      await createConditioningWorkout(workoutData).unwrap();
      clearSavedData();
      
      // Show success notification
      errorHandler.addError('CONDITIONING_SAVE_SUCCESS', { 
        workoutName: programName,
        playerCount: selectedPlayers.length 
      });
      
      onCancel();
    } catch (error) {
      console.error('Failed to save conditioning workout:', error);
      errorHandler.handleApiError(error);
    }
  }, [
    validateWorkout,
    programName,
    programDescription,
    intervals,
    selectedEquipment,
    initialProgram?.id,
    onSave,
    scheduledDate,
    location,
    teamId,
    selectedPlayers,
    createConditioningWorkout,
    clearSavedData,
    onCancel,
    errorHandler
  ]);

  // Handle field changes with validation
  const handleProgramNameChange = useCallback((value: string) => {
    setProgramName(value);
    // Clear field error when user starts typing
    if (errorHandler.fieldErrors.name) {
      errorHandler.clearFieldError('name');
    }
  }, [errorHandler]);

  const handleAddInterval = useCallback(() => {
    const newInterval: IntervalSet = {
      id: `interval-${Date.now()}`,
      type: 'work',
      duration: 60,
      equipment: selectedEquipment,
      targetMetrics: {},
      color: '#3b82f6'
    };
    setIntervals([...intervals, newInterval]);
    setEditingInterval(newInterval);
    
    // Clear intervals error if it exists
    if (errorHandler.fieldErrors.intervals) {
      errorHandler.clearFieldError('intervals');
    }
  }, [intervals, selectedEquipment, errorHandler]);

  // Calculate metrics
  const totalDuration = useMemo(() => {
    return intervals.reduce((sum, interval) => sum + interval.duration, 0);
  }, [intervals]);

  const estimatedCalories = useMemo(() => {
    return intervals.reduce((sum, interval) => {
      const minuteDuration = interval.duration / 60;
      const baseCaloriesPerMinute = interval.type === 'work' ? 12 : 
                                   interval.type === 'rest' ? 4 : 
                                   interval.type === 'warmup' || interval.type === 'cooldown' ? 6 : 5;
      return sum + (minuteDuration * baseCaloriesPerMinute);
    }, 0);
  }, [intervals]);

  // Get error summary for validation status
  const errorSummary = errorHandler.getErrorSummary();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-2xl font-bold">{t('physicalTrainer:conditioning.builder.title')}</h2>
          <p className="text-muted-foreground">
            {t('physicalTrainer:conditioning.builder.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Clock className="h-4 w-4 mr-2" />
            {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
          </Badge>
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Zap className="h-4 w-4 mr-2" />
            ~{Math.round(estimatedCalories)} cal
          </Badge>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            {t('common:cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={errorHandler.hasErrors || isLoading}
            variant={errorHandler.hasWarnings ? "secondary" : "default"}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('common:saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('common:save')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Summary - Show if there are errors */}
      {errorHandler.hasErrors && (
        <div className="px-4 pt-4">
          <ErrorList 
            errors={errorHandler.errors}
            maxVisible={2}
            showTechnicalDetails={process.env.NODE_ENV === 'development'}
            onDismiss={(index) => errorHandler.removeError(index)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="build" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              {t('physicalTrainer:conditioning.tabs.build')}
              {errorHandler.hasErrors && (
                <AlertTriangle className="h-3 w-3 text-destructive ml-1" />
              )}
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              {t('physicalTrainer:conditioning.tabs.templates')}
            </TabsTrigger>
            <TabsTrigger value="personalize" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('physicalTrainer:conditioning.tabs.personalize')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="build" className="h-full p-4">
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* Left Panel - Workout Details */}
              <div className="col-span-3 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('physicalTrainer:conditioning.details.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="workout-name">{t('physicalTrainer:conditioning.details.name')}</Label>
                      <Input
                        id="workout-name"
                        value={programName}
                        onChange={(e) => handleProgramNameChange(e.target.value)}
                        placeholder={t('physicalTrainer:conditioning.details.namePlaceholder')}
                        className={errorHandler.fieldErrors.name ? 'border-destructive' : ''}
                      />
                      <FieldError error={errorHandler.fieldErrors.name} field="name" />
                    </div>
                    
                    <div>
                      <Label htmlFor="workout-description">{t('physicalTrainer:conditioning.details.description')}</Label>
                      <Textarea
                        id="workout-description"
                        value={programDescription}
                        onChange={(e) => setProgramDescription(e.target.value)}
                        placeholder={t('physicalTrainer:conditioning.details.descriptionPlaceholder')}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <EquipmentSelector
                  selectedEquipment={selectedEquipment}
                  onSelectEquipment={setSelectedEquipment}
                />

                <WorkoutSummary
                  totalDuration={totalDuration}
                  intervals={intervals}
                  estimatedCalories={estimatedCalories}
                />
              </div>

              {/* Center Panel - Timeline */}
              <div className="col-span-6">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>{t('physicalTrainer:conditioning.timeline.title')}</CardTitle>
                      <Button onClick={handleAddInterval} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('physicalTrainer:conditioning.timeline.addInterval')}
                      </Button>
                    </div>
                    <FieldError error={errorHandler.fieldErrors.intervals} field="intervals" />
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    {intervals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Timer className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">
                          {t('physicalTrainer:conditioning.warnings.noIntervals')}
                        </p>
                        <Button onClick={handleAddInterval} variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          {t('physicalTrainer:conditioning.timeline.addInterval')}
                        </Button>
                      </div>
                    ) : (
                      <IntervalTimeline
                        intervals={intervals}
                        onSelectInterval={setEditingInterval}
                        onDeleteInterval={(intervalId) => {
                          setIntervals(intervals.filter(i => i.id !== intervalId));
                        }}
                        onDuplicateInterval={(interval) => {
                          const newInterval = {
                            ...interval,
                            id: `interval-${Date.now()}`
                          };
                          const index = intervals.findIndex(i => i.id === interval.id);
                          const newIntervals = [...intervals];
                          newIntervals.splice(index + 1, 0, newInterval);
                          setIntervals(newIntervals);
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Interval Editor */}
              <div className="col-span-3">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{t('physicalTrainer:conditioning.editor.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingInterval ? (
                      <IntervalForm
                        interval={editingInterval}
                        onUpdate={(updatedInterval) => {
                          setIntervals(intervals.map(i => 
                            i.id === updatedInterval.id ? updatedInterval : i
                          ));
                          setEditingInterval(null);
                        }}
                        onCancel={() => setEditingInterval(null)}
                        equipment={selectedEquipment}
                        fieldErrors={errorHandler.fieldErrors}
                        onFieldError={(field, errorCode, context) => 
                          errorHandler.addFieldError(field, errorCode, context)
                        }
                        onClearFieldError={(field) => errorHandler.clearFieldError(field)}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{t('physicalTrainer:conditioning.editor.selectInterval')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="h-full p-4">
            <WorkoutTemplateLibrary
              onSelectTemplate={(template) => {
                setSelectedTemplate(template);
                setProgramName(template.name);
                setProgramDescription(template.description);
                setIntervals(template.intervals);
                setSelectedEquipment(template.equipment);
              }}
              equipment={selectedEquipment}
            />
          </TabsContent>

          <TabsContent value="personalize" className="h-full p-4">
            <TestBasedTargets
              intervals={intervals}
              onUpdateIntervals={setIntervals}
              playerTests={playerTests}
              selectedPlayers={selectedPlayers}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Status bar */}
      {(errorHandler.hasErrors || errorHandler.hasWarnings) && (
        <div className="border-t p-2 bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {errorSummary.summary}
            </span>
            {errorHandler.hasErrors && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => errorHandler.clearErrors()}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditioningWorkoutBuilderWithErrors;