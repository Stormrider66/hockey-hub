import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Save, Undo, Redo, Calendar, Users, Clock, Activity } from 'lucide-react';
import { ExerciseLibrary } from './ExerciseLibrary';
import { SessionCanvas } from './SessionCanvas';
import { SessionDetails } from './SessionDetails';
import { SessionTypeSelector } from './SessionTypeSelector';
import { 
  SessionTemplate, 
  SessionPhase, 
  SessionExercise, 
  DragItem,
  SessionType,
  SessionPhaseType,
  DroppableExercise,
  ExerciseFilters,
  SessionBuilderState
} from '../../types/session-builder.types';
import { useDebounce } from '@/hooks/useDebounce';
import { useOptimizedForm, useBatchFormUpdates } from '../../utils/formOptimization';

interface SessionBuilderOptimizedProps {
  mode?: 'create' | 'edit' | 'template';
  sessionId?: string;
  initialData?: SessionTemplate | any;
  preSelectedPlayers?: string[];
  preSelectedTeam?: string;
  onSave?: (session: SessionTemplate) => void;
  onCancel?: () => void;
}

const INITIAL_PHASES: SessionPhase[] = [
  { type: 'warmup', name: 'Warm Up', exercises: [], duration: 0 },
  { type: 'main', name: 'Main Work', exercises: [], duration: 0 },
  { type: 'accessory', name: 'Accessory', exercises: [], duration: 0 },
  { type: 'core', name: 'Core', exercises: [], duration: 0 },
  { type: 'cooldown', name: 'Cool Down', exercises: [], duration: 0 },
];

// Memoized phase component to prevent unnecessary re-renders
const SessionPhaseComponent = React.memo(({ 
  phase, 
  onUpdate 
}: { 
  phase: SessionPhase; 
  onUpdate: (phase: SessionPhase) => void;
}) => {
  // Phase-specific rendering logic here
  return null; // Placeholder
});

SessionPhaseComponent.displayName = 'SessionPhaseComponent';

export const SessionBuilderOptimized: React.FC<SessionBuilderOptimizedProps> = ({
  mode = 'create',
  sessionId,
  initialData,
  preSelectedPlayers = [],
  preSelectedTeam,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  // Use optimized form hook for session management
  const sessionForm = useOptimizedForm<SessionTemplate>({
    initialValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'mixed',
      phases: initialData?.phases || INITIAL_PHASES,
      totalDuration: initialData?.totalDuration || 0,
      equipmentRequired: initialData?.equipment || initialData?.equipmentRequired || [],
      targetPlayers: initialData?.targetPlayers || preSelectedPlayers,
      targetTeams: initialData?.targetTeams || (preSelectedTeam ? [preSelectedTeam] : []),
      difficulty: initialData?.difficulty || 'intermediate',
      tags: initialData?.tags || []
    },
    onSubmit: async (values) => {
      if (onSave) {
        await onSave(values);
      }
    },
    debounceMs: 1000 // Longer debounce for auto-save
  });

  // Use batch updates for complex state changes
  const batchUpdate = useBatchFormUpdates(sessionForm);

  // Exercise library state with memoization
  const [exerciseFilters, setExerciseFilters] = useState<ExerciseFilters>({
    category: 'all',
    equipment: [],
    muscleGroups: [],
    difficulty: 'all',
    searchTerm: '',
    showMostUsed: false
  });

  // Debounced auto-save - using form's debounced values
  const debouncedSession = useDebounce(sessionForm.values, 30000); // 30 seconds

  // Memoized calculation functions
  const calculatePhaseDuration = useCallback((exercises: SessionExercise[]): number => {
    return exercises.reduce((total, exercise) => {
      const exerciseDuration = exercise.duration 
        ? exercise.duration / 60
        : (exercise.sets * (exercise.reps || 0) * 3 + exercise.rest * (exercise.sets - 1)) / 60;
      return total + exerciseDuration;
    }, 0);
  }, []);

  const calculateTotalDuration = useCallback(() => {
    const phases = sessionForm.values.phases;
    if (!phases) return 0;

    return phases.reduce((total, phase) => {
      const phaseDuration = calculatePhaseDuration(phase.exercises);
      return total + phaseDuration;
    }, 0);
  }, [sessionForm.values.phases, calculatePhaseDuration]);

  // Update total duration when phases change - with memoization
  const totalDuration = useMemo(() => calculateTotalDuration(), [calculateTotalDuration]);

  useEffect(() => {
    sessionForm.setFieldValue('totalDuration', Math.round(totalDuration));
  }, [totalDuration]);

  // Drag and drop sensors
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

  // Auto-save functionality
  useEffect(() => {
    if (debouncedSession && sessionForm.isDirty && mode !== 'template') {
      handleAutoSave();
    }
  }, [debouncedSession, sessionForm.isDirty, mode]);

  const handleAutoSave = useCallback(async () => {
    try {
      // Simulated API call
      console.log('Auto-saving session...', sessionForm.values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Changes saved',
        description: 'Your session has been auto-saved.',
      });
    } catch (error) {
      toast({
        title: 'Auto-save failed',
        description: 'Your changes could not be saved automatically.',
        variant: 'destructive'
      });
    }
  }, [sessionForm.values, toast]);

  // Optimized drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const dragData = active.data.current as DragItem;
    setDraggedItem(dragData);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const activeData = active.data.current as DragItem;
    const overData = over.data.current;

    // Handle dropping an exercise from library to canvas
    if (activeData.type === 'exercise' && overData?.phaseType) {
      const targetPhase = overData.phaseType as SessionPhaseType;
      const targetIndex = overData.index || 0;
      
      addExerciseToPhase(activeData.exercise!, targetPhase, targetIndex);
    }
    
    // Handle reordering within the same phase
    else if (activeData.sourcePhase && overData?.phaseType) {
      const sourcePhase = activeData.sourcePhase;
      const targetPhase = overData.phaseType as SessionPhaseType;
      const sourceIndex = activeData.sourceIndex!;
      const targetIndex = overData.index || 0;
      
      if (sourcePhase === targetPhase && sourceIndex !== targetIndex) {
        reorderExerciseInPhase(sourcePhase, sourceIndex, targetIndex);
      } else if (sourcePhase !== targetPhase) {
        moveExerciseBetweenPhases(sourcePhase, targetPhase, sourceIndex, targetIndex);
      }
    }

    setActiveId(null);
    setDraggedItem(null);
  }, []);

  // Optimized phase update functions
  const addExerciseToPhase = useCallback((
    exercise: DroppableExercise, 
    phaseType: SessionPhaseType, 
    index: number
  ) => {
    const phases = [...sessionForm.values.phases];
    const phaseIndex = phases.findIndex(p => p.type === phaseType);
    
    if (phaseIndex !== -1) {
      const newExercise: SessionExercise = {
        id: `${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        name: exercise.name,
        sets: exercise.sets || 3,
        reps: exercise.reps || 10,
        duration: exercise.duration,
        rest: exercise.restBetweenSets || 60,
        notes: '',
        intensity: exercise.intensity || 'medium'
      };

      phases[phaseIndex].exercises.splice(index, 0, newExercise);
      sessionForm.setFieldValue('phases', phases);
    }
  }, [sessionForm]);

  const reorderExerciseInPhase = useCallback((
    phaseType: SessionPhaseType,
    sourceIndex: number,
    targetIndex: number
  ) => {
    const phases = [...sessionForm.values.phases];
    const phaseIndex = phases.findIndex(p => p.type === phaseType);
    
    if (phaseIndex !== -1) {
      phases[phaseIndex].exercises = arrayMove(
        phases[phaseIndex].exercises,
        sourceIndex,
        targetIndex
      );
      sessionForm.setFieldValue('phases', phases);
    }
  }, [sessionForm]);

  const moveExerciseBetweenPhases = useCallback((
    sourcePhase: SessionPhaseType,
    targetPhase: SessionPhaseType,
    sourceIndex: number,
    targetIndex: number
  ) => {
    const phases = [...sessionForm.values.phases];
    const sourcePhaseIndex = phases.findIndex(p => p.type === sourcePhase);
    const targetPhaseIndex = phases.findIndex(p => p.type === targetPhase);
    
    if (sourcePhaseIndex !== -1 && targetPhaseIndex !== -1) {
      const [exercise] = phases[sourcePhaseIndex].exercises.splice(sourceIndex, 1);
      phases[targetPhaseIndex].exercises.splice(targetIndex, 0, exercise);
      sessionForm.setFieldValue('phases', phases);
    }
  }, [sessionForm]);

  // Optimized handlers for session details
  const handleSessionDetailsChange = useCallback((field: keyof SessionTemplate, value: any) => {
    sessionForm.setFieldValue(field, value);
  }, [sessionForm]);

  const handleBatchUpdate = useCallback((updates: Array<{ field: keyof SessionTemplate; value: any }>) => {
    batchUpdate(updates.map(({ field, value }) => ({ name: field, value })));
  }, [batchUpdate]);

  return (
    <div className="flex h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Left sidebar - Exercise Library */}
        <div className="w-80 border-r p-4 overflow-y-auto">
          <ExerciseLibrary
            filters={exerciseFilters}
            onFiltersChange={setExerciseFilters}
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SessionTypeSelector
                  value={sessionForm.values.type}
                  onChange={(type) => handleSessionDetailsChange('type', type)}
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{Math.round(totalDuration)} min</span>
                  <Users className="h-4 w-4 ml-4" />
                  <span>
                    {sessionForm.values.targetPlayers.length} players, 
                    {sessionForm.values.targetTeams.length} teams
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sessionForm.reset}
                  disabled={!sessionForm.isDirty}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sessionForm.handleSubmit}
                  disabled={sessionForm.isSubmitting || !sessionForm.isDirty}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {sessionForm.isSubmitting ? 'Saving...' : 'Save Session'}
                </Button>
              </div>
            </div>
          </div>

          {/* Session Canvas */}
          <div className="flex-1 overflow-y-auto p-4">
            <SessionCanvas
              phases={sessionForm.values.phases}
              onPhaseUpdate={(phaseType, exercises) => {
                const phases = [...sessionForm.values.phases];
                const phaseIndex = phases.findIndex(p => p.type === phaseType);
                if (phaseIndex !== -1) {
                  phases[phaseIndex].exercises = exercises;
                  sessionForm.setFieldValue('phases', phases);
                }
              }}
            />
          </div>

          {/* Session Details */}
          <div className="border-t p-4">
            <SessionDetails
              session={sessionForm.values}
              onChange={handleSessionDetailsChange}
              onBatchUpdate={handleBatchUpdate}
            />
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && draggedItem ? (
            <div className="opacity-50">
              {/* Render dragged item preview */}
              {draggedItem.type === 'exercise' && (
                <Card className="p-2">
                  <p className="text-sm font-medium">{draggedItem.exercise?.name}</p>
                </Card>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};