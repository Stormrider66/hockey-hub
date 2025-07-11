import React, { useState, useCallback, useEffect } from 'react';
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

interface SessionBuilderProps {
  mode?: 'create' | 'edit' | 'template';
  sessionId?: string;
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

export const SessionBuilder: React.FC<SessionBuilderProps> = ({
  mode = 'create',
  sessionId,
  preSelectedPlayers = [],
  preSelectedTeam,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  // Session state
  const [sessionState, setSessionState] = useState<SessionBuilderState>({
    currentSession: {
      name: '',
      type: 'mixed',
      phases: INITIAL_PHASES,
      totalDuration: 0,
      equipmentRequired: [],
      targetPlayers: preSelectedPlayers,
      targetTeams: preSelectedTeam ? [preSelectedTeam] : [],
      difficulty: 'intermediate',
      tags: []
    },
    isDirty: false,
    history: [],
    historyIndex: -1,
    autoSaveStatus: 'idle'
  });

  // Exercise library state
  const [exerciseFilters, setExerciseFilters] = useState<ExerciseFilters>({
    category: 'all',
    equipment: [],
    muscleGroups: [],
    difficulty: 'all',
    searchTerm: '',
    showMostUsed: false
  });

  // Debounced auto-save
  const debouncedSession = useDebounce(sessionState.currentSession, 30000); // 30 seconds

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

  const calculatePhaseDuration = (exercises: SessionExercise[]): number => {
    return exercises.reduce((total, exercise) => {
      // If duration is set, convert from seconds to minutes
      const exerciseDuration = exercise.duration 
        ? exercise.duration / 60
        : (exercise.sets * (exercise.reps || 0) * 3 + exercise.rest * (exercise.sets - 1)) / 60;
      return total + exerciseDuration;
    }, 0);
  };

  // Calculate total duration whenever exercises change
  useEffect(() => {
    if (!sessionState.currentSession) return;

    const totalDuration = sessionState.currentSession.phases.reduce((total, phase) => {
      // Use the calculatePhaseDuration function for consistency
      const phaseDuration = calculatePhaseDuration(phase.exercises);
      return total + phaseDuration;
    }, 0);

    setSessionState(prev => ({
      ...prev,
      currentSession: {
        ...prev.currentSession!,
        totalDuration: Math.round(totalDuration)
      }
    }));
  }, [sessionState.currentSession?.phases]);

  // Auto-save functionality
  useEffect(() => {
    if (debouncedSession && sessionState.isDirty && mode !== 'template') {
      handleAutoSave();
    }
  }, [debouncedSession]);

  const handleAutoSave = async () => {
    setSessionState(prev => ({ ...prev, autoSaveStatus: 'saving' }));
    try {
      // TODO: Implement API call to save draft
      console.log('Auto-saving session...', sessionState.currentSession);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      setSessionState(prev => ({ 
        ...prev, 
        autoSaveStatus: 'saved',
        lastSavedAt: new Date(),
        isDirty: false
      }));
    } catch (error) {
      setSessionState(prev => ({ ...prev, autoSaveStatus: 'error' }));
      toast({
        title: 'Auto-save failed',
        description: 'Your changes could not be saved automatically.',
        variant: 'destructive'
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Set the dragged item details
    const dragData = active.data.current as DragItem;
    setDraggedItem(dragData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !sessionState.currentSession) {
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
  };

  const addExerciseToPhase = (exercise: DroppableExercise, phaseType: SessionPhaseType, index: number) => {
    const newExercise: SessionExercise = {
      ...exercise,
      sessionExerciseId: `session-exercise-${Date.now()}-${Math.random()}`,
      phaseType,
      orderIndex: index,
      sets: exercise.defaultSets,
      reps: exercise.defaultReps,
      duration: exercise.defaultDuration,
      rest: exercise.restPeriod
    };

    setSessionState(prev => {
      const newPhases = [...prev.currentSession!.phases];
      const phaseIndex = newPhases.findIndex(p => p.type === phaseType);
      
      if (phaseIndex !== -1) {
        const updatedExercises = [...newPhases[phaseIndex].exercises];
        updatedExercises.splice(index, 0, newExercise);
        
        // Update order indices
        updatedExercises.forEach((ex, idx) => {
          ex.orderIndex = idx;
        });
        
        newPhases[phaseIndex] = {
          ...newPhases[phaseIndex],
          exercises: updatedExercises,
          duration: calculatePhaseDuration(updatedExercises)
        };
      }

      // Add to history for undo/redo
      const newHistory = [...prev.history.slice(0, prev.historyIndex + 1), prev.currentSession!];

      return {
        ...prev,
        currentSession: {
          ...prev.currentSession!,
          phases: newPhases,
          equipmentRequired: updateEquipmentList(newPhases)
        },
        isDirty: true,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });

    toast({
      title: 'Exercise added',
      description: `${exercise.name} added to ${phaseType}`,
    });
  };

  const reorderExerciseInPhase = (phaseType: SessionPhaseType, sourceIndex: number, targetIndex: number) => {
    setSessionState(prev => {
      const newPhases = [...prev.currentSession!.phases];
      const phaseIndex = newPhases.findIndex(p => p.type === phaseType);
      
      if (phaseIndex !== -1) {
        const updatedExercises = arrayMove(newPhases[phaseIndex].exercises, sourceIndex, targetIndex);
        
        // Update order indices
        updatedExercises.forEach((ex, idx) => {
          ex.orderIndex = idx;
        });
        
        newPhases[phaseIndex] = {
          ...newPhases[phaseIndex],
          exercises: updatedExercises
        };
      }

      return {
        ...prev,
        currentSession: {
          ...prev.currentSession!,
          phases: newPhases
        },
        isDirty: true
      };
    });
  };

  const moveExerciseBetweenPhases = (
    sourcePhase: SessionPhaseType, 
    targetPhase: SessionPhaseType, 
    sourceIndex: number, 
    targetIndex: number
  ) => {
    setSessionState(prev => {
      const newPhases = [...prev.currentSession!.phases];
      const sourcePhaseIndex = newPhases.findIndex(p => p.type === sourcePhase);
      const targetPhaseIndex = newPhases.findIndex(p => p.type === targetPhase);
      
      if (sourcePhaseIndex !== -1 && targetPhaseIndex !== -1) {
        // Remove from source
        const [movedExercise] = newPhases[sourcePhaseIndex].exercises.splice(sourceIndex, 1);
        
        // Update moved exercise phase
        movedExercise.phaseType = targetPhase;
        
        // Add to target
        newPhases[targetPhaseIndex].exercises.splice(targetIndex, 0, movedExercise);
        
        // Update order indices for both phases
        newPhases[sourcePhaseIndex].exercises.forEach((ex, idx) => {
          ex.orderIndex = idx;
        });
        newPhases[targetPhaseIndex].exercises.forEach((ex, idx) => {
          ex.orderIndex = idx;
        });
        
        // Update durations
        newPhases[sourcePhaseIndex].duration = calculatePhaseDuration(newPhases[sourcePhaseIndex].exercises);
        newPhases[targetPhaseIndex].duration = calculatePhaseDuration(newPhases[targetPhaseIndex].exercises);
      }

      return {
        ...prev,
        currentSession: {
          ...prev.currentSession!,
          phases: newPhases
        },
        isDirty: true
      };
    });
  };

  const updateEquipmentList = (phases: SessionPhase[]): string[] => {
    const equipmentSet = new Set<string>();
    phases.forEach(phase => {
      phase.exercises.forEach(exercise => {
        exercise.equipment.forEach(item => equipmentSet.add(item));
      });
    });
    return Array.from(equipmentSet);
  };

  const handleUndo = () => {
    if (sessionState.historyIndex > 0) {
      setSessionState(prev => ({
        ...prev,
        currentSession: prev.history[prev.historyIndex - 1],
        historyIndex: prev.historyIndex - 1,
        isDirty: true
      }));
    }
  };

  const handleRedo = () => {
    if (sessionState.historyIndex < sessionState.history.length - 1) {
      setSessionState(prev => ({
        ...prev,
        currentSession: prev.history[prev.historyIndex + 1],
        historyIndex: prev.historyIndex + 1,
        isDirty: true
      }));
    }
  };

  const handleSave = async () => {
    if (!sessionState.currentSession?.name) {
      toast({
        title: 'Session name required',
        description: 'Please enter a name for the session.',
        variant: 'destructive'
      });
      return;
    }

    if (onSave) {
      onSave(sessionState.currentSession);
    }
  };

  const handleSessionTypeChange = (type: SessionType) => {
    setSessionState(prev => ({
      ...prev,
      currentSession: {
        ...prev.currentSession!,
        type
      },
      isDirty: true
    }));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Session Builder</h2>
            <SessionTypeSelector 
              value={sessionState.currentSession?.type || 'mixed'}
              onChange={handleSessionTypeChange}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            {sessionState.autoSaveStatus === 'saving' && (
              <span className="text-sm text-muted-foreground">Saving...</span>
            )}
            {sessionState.autoSaveStatus === 'saved' && (
              <span className="text-sm text-muted-foreground">Saved</span>
            )}
            
            {/* Action buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={sessionState.historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={sessionState.historyIndex >= sessionState.history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 ml-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!sessionState.isDirty}>
                <Save className="h-4 w-4 mr-2" />
                Save Session
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Exercise Library */}
          <div className="w-80 border-r overflow-y-auto flex-shrink-0">
            <ExerciseLibrary 
              filters={exerciseFilters}
              onFilterChange={setExerciseFilters}
            />
          </div>

          {/* Session Canvas */}
          <div className="flex-1 overflow-y-auto">
            <SessionCanvas 
              session={sessionState.currentSession!}
              onUpdate={(updatedSession) => {
                setSessionState(prev => ({
                  ...prev,
                  currentSession: updatedSession,
                  isDirty: true
                }));
              }}
            />
          </div>

          {/* Session Details */}
          <div className="w-96 border-l overflow-y-auto">
            <SessionDetails 
              session={sessionState.currentSession!}
              onUpdate={(updatedSession) => {
                setSessionState(prev => ({
                  ...prev,
                  currentSession: updatedSession,
                  isDirty: true
                }));
              }}
            />
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/50">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{sessionState.currentSession?.totalDuration || 0} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span>
                {sessionState.currentSession?.phases.reduce((sum, p) => sum + p.exercises.length, 0) || 0} exercises
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {(sessionState.currentSession?.targetPlayers?.length || 0) + 
                 (sessionState.currentSession?.targetTeams?.length || 0)} assigned
              </span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Equipment: {sessionState.currentSession?.equipmentRequired.join(', ') || 'None'}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeId && draggedItem && (
          <Card className="p-3 shadow-lg opacity-80">
            <p className="font-medium">{draggedItem.exercise?.name}</p>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
};