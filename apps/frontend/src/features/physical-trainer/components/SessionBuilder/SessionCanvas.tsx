import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  GripVertical, 
  X, 
  Copy, 
  Edit2, 
  Clock, 
  Dumbbell,
  Heart,
  Activity,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';
import { 
  SessionTemplate, 
  SessionPhase, 
  SessionExercise,
  SessionPhaseType,
  IntensityLevel
} from '../../types/session-builder.types';

interface SessionCanvasProps {
  session: SessionTemplate;
  onUpdate: (session: SessionTemplate) => void;
  playerTestData?: any; // TODO: Add proper type
}

interface PhaseDropZoneProps {
  phase: SessionPhase;
  phaseIndex: number;
  onUpdatePhase: (updatedPhase: SessionPhase) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exercise: SessionExercise) => void;
  onUpdateExercise: (exerciseId: string, updates: Partial<SessionExercise>) => void;
}

interface SortableExerciseCardProps {
  exercise: SessionExercise;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdate: (updates: Partial<SessionExercise>) => void;
}

const phaseIcons: Record<SessionPhaseType, React.ReactNode> = {
  warmup: <Heart className="h-4 w-4" />,
  main: <Dumbbell className="h-4 w-4" />,
  accessory: <Activity className="h-4 w-4" />,
  core: <Zap className="h-4 w-4" />,
  cooldown: <RotateCcw className="h-4 w-4" />
};

const phaseColors: Record<SessionPhaseType, string> = {
  warmup: 'bg-blue-50 border-blue-200',
  main: 'bg-red-50 border-red-200',
  accessory: 'bg-purple-50 border-purple-200',
  core: 'bg-green-50 border-green-200',
  cooldown: 'bg-cyan-50 border-cyan-200'
};

const intensityColors: Record<IntensityLevel, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  max: 'bg-red-500'
};

const SortableExerciseCard: React.FC<SortableExerciseCardProps> = ({ 
  exercise, 
  onDelete, 
  onDuplicate,
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedExercise, setEditedExercise] = useState(exercise);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.sessionExerciseId,
    data: {
      type: 'exercise',
      exercise,
      sourcePhase: exercise.phaseType,
      sourceIndex: exercise.orderIndex
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(editedExercise);
    setIsEditing(false);
  };

  const calculateDuration = () => {
    if (exercise.duration) return exercise.duration;
    if (exercise.reps && exercise.sets) {
      // Estimate: 3 seconds per rep + rest between sets
      return Math.round((exercise.sets * exercise.reps * 3 + exercise.rest * (exercise.sets - 1)) / 60);
    }
    return 0;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`p-3 ${isDragging ? 'shadow-lg' : ''} hover:shadow-md transition-shadow`}>
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editedExercise.name}
              onChange={(e) => setEditedExercise({ ...editedExercise, name: e.target.value })}
              className="font-medium"
            />
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Sets</label>
                <Input
                  type="number"
                  value={editedExercise.sets}
                  onChange={(e) => setEditedExercise({ ...editedExercise, sets: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Reps</label>
                <Input
                  type="number"
                  value={editedExercise.reps || ''}
                  onChange={(e) => setEditedExercise({ ...editedExercise, reps: parseInt(e.target.value) || undefined })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Rest (s)</label>
                <Input
                  type="number"
                  value={editedExercise.rest}
                  onChange={(e) => setEditedExercise({ ...editedExercise, rest: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div
              className="mt-1 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{exercise.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>{exercise.sets} sets</span>
                    {exercise.reps && <span>× {exercise.reps} reps</span>}
                    {exercise.duration && <span>× {exercise.duration}s</span>}
                    <span>• Rest: {exercise.rest}s</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDuplicate}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{calculateDuration()} min</span>
                </div>
                
                {exercise.intensity && (
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${intensityColors[exercise.intensity]}`} />
                    <span className="text-xs capitalize">{exercise.intensity}</span>
                  </div>
                )}
                
                {exercise.loadCalculation && (
                  <Badge variant="secondary" className="text-xs">
                    {exercise.loadCalculation.percentage}% of {exercise.loadCalculation.referenceTest}
                  </Badge>
                )}
              </div>
              
              {exercise.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {exercise.equipment.map((equip, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {equip}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const PhaseDropZone: React.FC<PhaseDropZoneProps> = ({ 
  phase, 
  phaseIndex,
  onUpdatePhase, 
  onDeleteExercise, 
  onDuplicateExercise,
  onUpdateExercise
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { setNodeRef, isOver } = useDroppable({
    id: `phase-${phase.type}`,
    data: {
      phaseType: phase.type,
      index: phase.exercises.length
    }
  });

  const sortableIds = phase.exercises.map(ex => ex.sessionExerciseId);

  return (
    <Card className={`${phaseColors[phase.type]} ${isOver ? 'ring-2 ring-primary' : ''}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {phaseIcons[phase.type]}
            <h3 className="font-semibold">{phase.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {phase.exercises.length} exercises
            </Badge>
            {phase.duration > 0 && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {Math.round(phase.duration)} min
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        
        {!isCollapsed && (
          <div ref={setNodeRef} className="space-y-2 min-h-[100px]">
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {phase.exercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg">
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag exercises here
                  </p>
                </div>
              ) : (
                phase.exercises.map((exercise) => (
                  <SortableExerciseCard
                    key={exercise.sessionExerciseId}
                    exercise={exercise}
                    onDelete={() => onDeleteExercise(exercise.sessionExerciseId)}
                    onDuplicate={() => onDuplicateExercise(exercise)}
                    onUpdate={(updates) => onUpdateExercise(exercise.sessionExerciseId, updates)}
                  />
                ))
              )}
            </SortableContext>
          </div>
        )}
      </div>
    </Card>
  );
};

export const SessionCanvas: React.FC<SessionCanvasProps> = ({ 
  session, 
  onUpdate,
  playerTestData 
}) => {
  const handleUpdatePhase = (phaseIndex: number, updatedPhase: SessionPhase) => {
    const newPhases = [...session.phases];
    newPhases[phaseIndex] = updatedPhase;
    onUpdate({
      ...session,
      phases: newPhases
    });
  };

  const handleDeleteExercise = (phaseIndex: number, exerciseId: string) => {
    const newPhases = [...session.phases];
    newPhases[phaseIndex].exercises = newPhases[phaseIndex].exercises.filter(
      ex => ex.sessionExerciseId !== exerciseId
    );
    
    // Recalculate phase duration
    newPhases[phaseIndex].duration = calculatePhaseDuration(newPhases[phaseIndex].exercises);
    
    onUpdate({
      ...session,
      phases: newPhases
    });
  };

  const handleDuplicateExercise = (phaseIndex: number, exercise: SessionExercise) => {
    const newExercise: SessionExercise = {
      ...exercise,
      sessionExerciseId: `session-exercise-${Date.now()}-${Math.random()}`,
      orderIndex: exercise.orderIndex + 1
    };
    
    const newPhases = [...session.phases];
    const exercises = [...newPhases[phaseIndex].exercises];
    exercises.splice(exercise.orderIndex + 1, 0, newExercise);
    
    // Update order indices
    exercises.forEach((ex, idx) => {
      ex.orderIndex = idx;
    });
    
    newPhases[phaseIndex] = {
      ...newPhases[phaseIndex],
      exercises,
      duration: calculatePhaseDuration(exercises)
    };
    
    onUpdate({
      ...session,
      phases: newPhases
    });
  };

  const handleUpdateExercise = (
    phaseIndex: number, 
    exerciseId: string, 
    updates: Partial<SessionExercise>
  ) => {
    const newPhases = [...session.phases];
    const exerciseIndex = newPhases[phaseIndex].exercises.findIndex(
      ex => ex.sessionExerciseId === exerciseId
    );
    
    if (exerciseIndex !== -1) {
      newPhases[phaseIndex].exercises[exerciseIndex] = {
        ...newPhases[phaseIndex].exercises[exerciseIndex],
        ...updates
      };
      
      // Recalculate phase duration
      newPhases[phaseIndex].duration = calculatePhaseDuration(newPhases[phaseIndex].exercises);
      
      onUpdate({
        ...session,
        phases: newPhases
      });
    }
  };

  const calculatePhaseDuration = (exercises: SessionExercise[]): number => {
    return exercises.reduce((total, exercise) => {
      const exerciseDuration = exercise.duration || 
        (exercise.sets * (exercise.reps || 0) * 3 + exercise.rest * (exercise.sets - 1)) / 60;
      return total + exerciseDuration;
    }, 0);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Session name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Session Name</label>
        <Input
          value={session.name}
          onChange={(e) => onUpdate({ ...session, name: e.target.value })}
          placeholder="Enter session name..."
          className="max-w-md"
        />
      </div>
      
      {/* Session description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description (Optional)</label>
        <Input
          value={session.description || ''}
          onChange={(e) => onUpdate({ ...session, description: e.target.value })}
          placeholder="Brief description of the session..."
          className="max-w-md"
        />
      </div>
      
      <Separator />
      
      {/* Phases */}
      <div className="space-y-4">
        {session.phases.map((phase, index) => (
          <PhaseDropZone
            key={phase.type}
            phase={phase}
            phaseIndex={index}
            onUpdatePhase={(updatedPhase) => handleUpdatePhase(index, updatedPhase)}
            onDeleteExercise={(exerciseId) => handleDeleteExercise(index, exerciseId)}
            onDuplicateExercise={(exercise) => handleDuplicateExercise(index, exercise)}
            onUpdateExercise={(exerciseId, updates) => handleUpdateExercise(index, exerciseId, updates)}
          />
        ))}
      </div>
    </div>
  );
};