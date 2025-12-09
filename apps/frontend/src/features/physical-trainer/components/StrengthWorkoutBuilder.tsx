'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Trash2, Clock, Calendar, MapPin, Users, Activity, 
  Save, X, Info, AlertCircle, Copy, GripVertical, Dumbbell,
  Target, ChevronRight, Heart
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

import type { 
  StrengthWorkoutBuilderProps, 
  StrengthProgram, 
  StrengthPhase, 
  StrengthExercise,
  PhaseType,
  MuscleGroup,
  ExerciseCategory
} from '../types/strength.types';
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import { PlayerTeamAssignment } from './shared/PlayerTeamAssignment';
import { ExerciseLibrary } from './SessionBuilder/ExerciseLibrary';
import WorkoutBuilderErrorBoundary from './shared/WorkoutBuilderErrorBoundary';
import { useAutoSave } from '../hooks/useAutoSave';
import { useGetPlayersQuery } from '@/store/api/userApi';
import { useGetMedicalReportsQuery } from '@/store/api/medicalApi';

// Import phase configs from types
const PHASE_CONFIGS: Record<PhaseType, { label: string; color: string; defaultDuration: number }> = {
  warmup: { label: 'Warm Up', color: '#10b981', defaultDuration: 10 },
  main: { label: 'Main Work', color: '#3b82f6', defaultDuration: 30 },
  accessory: { label: 'Accessory', color: '#8b5cf6', defaultDuration: 15 },
  core: { label: 'Core', color: '#f59e0b', defaultDuration: 10 },
  cooldown: { label: 'Cool Down', color: '#6b7280', defaultDuration: 5 }
};

const DEFAULT_REST_PERIODS = {
  strength: 180, // 3 minutes
  hypertrophy: 90, // 1.5 minutes
  endurance: 45, // 45 seconds
  power: 240 // 4 minutes
};

const INITIAL_PHASES: StrengthPhase[] = [
  { id: 'phase-warmup', type: 'warmup', name: 'Warm Up', exercises: [] },
  { id: 'phase-main', type: 'main', name: 'Main Work', exercises: [] },
  { id: 'phase-accessory', type: 'accessory', name: 'Accessory', exercises: [] },
  { id: 'phase-core', type: 'core', name: 'Core', exercises: [] },
  { id: 'phase-cooldown', type: 'cooldown', name: 'Cool Down', exercises: [] }
];

interface DragItem {
  id: string;
  type: 'exercise' | 'phase';
  exercise?: any;
  sourcePhase?: PhaseType;
  sourceIndex?: number;
}

function StrengthWorkoutBuilderInternal({
  onSave,
  onCancel,
  isLoading = false,
  initialData,
  workoutId,
  workoutContext
}: StrengthWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  // Session Context State
  const sessionDate = workoutContext?.sessionDate ? 
    (typeof workoutContext.sessionDate === 'string' ? new Date(workoutContext.sessionDate) : workoutContext.sessionDate) : 
    new Date();
    
  const [sessionInfo] = useState({
    sessionId: workoutContext?.sessionId || null,
    sessionType: workoutContext?.sessionType || 'strength',
    date: sessionDate,
    time: workoutContext?.sessionTime || '09:00',
    location: workoutContext?.sessionLocation || 'Gym',
    teamId: workoutContext?.teamId || '',
    teamName: workoutContext?.teamName || ''
  });

  // Workout Details State
  const [workoutName, setWorkoutName] = useState(
    initialData?.name || 
    (workoutContext ? `Strength Training - ${workoutContext.playerName}` : '')
  );
  const [description, setDescription] = useState(
    initialData?.description || 
    (workoutContext ? `Personalized strength workout for ${workoutContext.playerName}` : '')
  );
  
  // Phases State
  const [phases, setPhases] = useState<StrengthPhase[]>(initialData?.phases || INITIAL_PHASES);
  const [activePhaseId, setActivePhaseId] = useState<string>('phase-main');
  
  // Player Assignment State
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(
    workoutContext ? [workoutContext.playerId] : []
  );
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('details');
  const [showValidation, setShowValidation] = useState(false);
  
  // Drag and Drop State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  
  // Fetch players and medical data
  const { data: playersData } = useGetPlayersQuery(
    sessionInfo.teamId ? { teamId: sessionInfo.teamId } : undefined,
    { skip: !sessionInfo.teamId }
  );
  
  const { data: medicalReports } = useGetMedicalReportsQuery(
    { playerIds: selectedPlayers },
    { skip: selectedPlayers.length === 0 }
  );

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
  const autoSaveKey = `strength_workout_${workoutId || Date.now()}`;
  const { getSavedData, clearSavedData, hasAutoSave } = useAutoSave({
    key: autoSaveKey,
    data: {
      workoutName,
      description,
      phases,
      selectedPlayers,
      selectedTeams
    },
    enabled: true,
    delay: 3000,
    onRestore: (data) => {
      setWorkoutName(data.workoutName || '');
      setDescription(data.description || '');
      setPhases(data.phases || INITIAL_PHASES);
      setSelectedPlayers(data.selectedPlayers || []);
      setSelectedTeams(data.selectedTeams || []);
      toast.success('Auto-save restored');
    }
  });

  // Calculate total duration from phases
  const calculatePhaseDuration = (phase: StrengthPhase): number => {
    return phase.exercises.reduce((total, exercise) => {
      const setsTime = exercise.sets * (exercise.duration || (exercise.reps || 10) * 3); // Assume 3 seconds per rep
      const restTime = (exercise.sets - 1) * exercise.restBetweenSets;
      return total + (setsTime + restTime) / 60; // Convert to minutes
    }, 0);
  };

  const totalDuration = phases.reduce((sum, phase) => sum + (phase.duration || calculatePhaseDuration(phase)), 0);

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const dragData = active.data.current as DragItem;
    setDraggedItem(dragData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const activeData = active.data.current as DragItem;
    const overData = over.data.current;

    // Handle dropping an exercise from library to phase
    if (activeData.type === 'exercise' && overData?.phaseType) {
      const targetPhase = overData.phaseType as PhaseType;
      const targetIndex = overData.index || 0;
      
      addExerciseToPhase(activeData.exercise!, targetPhase, targetIndex);
    }
    
    // Handle reordering within the same phase
    else if (activeData.sourcePhase && overData?.phaseType) {
      const sourcePhase = activeData.sourcePhase;
      const targetPhase = overData.phaseType as PhaseType;
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

  const addExerciseToPhase = (exercise: any, phaseType: PhaseType, index: number) => {
    const newExercise: StrengthExercise = {
      id: `exercise-${Date.now()}`,
      name: exercise.name,
      category: exercise.category || 'accessory' as ExerciseCategory,
      muscleGroups: exercise.muscleGroups || [],
      equipment: exercise.equipment || [],
      sets: exercise.defaultSets || 3,
      reps: exercise.defaultReps || 10,
      duration: exercise.defaultDuration,
      restBetweenSets: exercise.restPeriod || DEFAULT_REST_PERIODS.strength,
      orderIndex: index,
      isCompound: exercise.isCompound || false,
      difficulty: exercise.difficulty || 'intermediate',
      instructions: exercise.instructions,
      videoUrl: exercise.videoUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPhases(prevPhases => {
      const newPhases = [...prevPhases];
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
          exercises: updatedExercises
        };
      }

      return newPhases;
    });

    toast.success(`${exercise.name} added to ${PHASE_CONFIGS[phaseType].label}`);
  };

  const reorderExerciseInPhase = (phaseType: PhaseType, sourceIndex: number, targetIndex: number) => {
    setPhases(prevPhases => {
      const newPhases = [...prevPhases];
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

      return newPhases;
    });
  };

  const moveExerciseBetweenPhases = (
    sourcePhase: PhaseType, 
    targetPhase: PhaseType, 
    sourceIndex: number, 
    targetIndex: number
  ) => {
    setPhases(prevPhases => {
      const newPhases = [...prevPhases];
      const sourcePhaseIndex = newPhases.findIndex(p => p.type === sourcePhase);
      const targetPhaseIndex = newPhases.findIndex(p => p.type === targetPhase);
      
      if (sourcePhaseIndex !== -1 && targetPhaseIndex !== -1) {
        // Remove from source
        const [movedExercise] = newPhases[sourcePhaseIndex].exercises.splice(sourceIndex, 1);
        
        // Add to target
        newPhases[targetPhaseIndex].exercises.splice(targetIndex, 0, movedExercise);
        
        // Update order indices for both phases
        newPhases[sourcePhaseIndex].exercises.forEach((ex, idx) => {
          ex.orderIndex = idx;
        });
        newPhases[targetPhaseIndex].exercises.forEach((ex, idx) => {
          ex.orderIndex = idx;
        });
      }

      return newPhases;
    });
  };

  const updateExercise = (phaseId: string, exerciseId: string, updates: Partial<StrengthExercise>) => {
    setPhases(prevPhases => 
      prevPhases.map(phase => 
        phase.id === phaseId
          ? {
              ...phase,
              exercises: phase.exercises.map(ex =>
                ex.id === exerciseId ? { ...ex, ...updates } : ex
              )
            }
          : phase
      )
    );
  };

  const removeExercise = (phaseId: string, exerciseId: string) => {
    setPhases(prevPhases => 
      prevPhases.map(phase => 
        phase.id === phaseId
          ? {
              ...phase,
              exercises: phase.exercises.filter(ex => ex.id !== exerciseId)
            }
          : phase
      )
    );
  };

  const duplicateExercise = (phaseId: string, exerciseId: string) => {
    setPhases(prevPhases => 
      prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        
        const exerciseIndex = phase.exercises.findIndex(ex => ex.id === exerciseId);
        if (exerciseIndex === -1) return phase;
        
        const exerciseToDuplicate = phase.exercises[exerciseIndex];
        const newExercise: StrengthExercise = {
          ...exerciseToDuplicate,
          id: `exercise-${Date.now()}`,
          name: `${exerciseToDuplicate.name} (Copy)`,
          orderIndex: exerciseIndex + 1
        };
        
        const updatedExercises = [...phase.exercises];
        updatedExercises.splice(exerciseIndex + 1, 0, newExercise);
        
        // Update order indices
        updatedExercises.forEach((ex, idx) => {
          ex.orderIndex = idx;
        });
        
        return { ...phase, exercises: updatedExercises };
      })
    );
  };

  // Validation
  const validateWorkout = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!workoutName.trim()) {
      errors.push('Workout name is required');
    }
    
    const totalExercises = phases.reduce((sum, phase) => sum + phase.exercises.length, 0);
    if (totalExercises === 0) {
      errors.push('At least one exercise is required');
    }
    
    if (selectedPlayers.length === 0 && selectedTeams.length === 0) {
      errors.push('Select at least one player or team');
    }
    
    if (totalDuration > 120) {
      errors.push('Workout duration exceeds reasonable time (max 120 minutes)');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Save Handler
  const handleSave = () => {
    const validation = validateWorkout();
    if (!validation.isValid) {
      setShowValidation(true);
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Collect all equipment needed
    const equipmentSet = new Set<string>();
    const muscleGroupSet = new Set<MuscleGroup>();
    
    phases.forEach(phase => {
      phase.exercises.forEach(exercise => {
        exercise.equipment.forEach(eq => equipmentSet.add(eq));
        exercise.muscleGroups.forEach(mg => muscleGroupSet.add(mg as MuscleGroup));
      });
    });

    const program: StrengthProgram = {
      id: workoutId || `program-${Date.now()}`,
      name: workoutName,
      description: description,
      phases: phases,
      totalDuration: Math.round(totalDuration),
      equipmentRequired: Array.from(equipmentSet),
      difficulty: getWorkoutDifficulty(),
      tags: ['strength', ...Array.from(muscleGroupSet).slice(0, 3)],
      focusAreas: Array.from(muscleGroupSet) as MuscleGroup[],
      // Link to session if context provided
      metadata: workoutContext ? {
        sessionId: workoutContext.sessionId.toString(),
        sessionType: workoutContext.sessionType,
        sessionDate: workoutContext.sessionDate instanceof Date ? 
          workoutContext.sessionDate.toISOString() : 
          workoutContext.sessionDate,
        sessionTime: workoutContext.sessionTime,
        sessionLocation: workoutContext.sessionLocation
      } : undefined
    };
    
    clearSavedData();
    onSave(program, selectedPlayers, selectedTeams);
  };

  const getWorkoutDifficulty = (): 'beginner' | 'intermediate' | 'advanced' => {
    const totalExercises = phases.reduce((sum, phase) => sum + phase.exercises.length, 0);
    const mainPhase = phases.find(p => p.type === 'main');
    const hasCompoundExercises = mainPhase?.exercises.some(ex => ex.isCompound) || false;
    
    if (totalExercises > 15 && hasCompoundExercises) return 'advanced';
    if (totalExercises > 8) return 'intermediate';
    return 'beginner';
  };

  const totalExercises = phases.reduce((sum, phase) => sum + phase.exercises.length, 0);
  const totalSets = phases.reduce((sum, phase) => 
    sum + phase.exercises.reduce((phaseSum, ex) => phaseSum + ex.sets, 0), 0
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <WorkoutBuilderHeader
          title="Strength Workout Builder"
          workoutType="strength"
          onSave={handleSave}
          onCancel={onCancel}
          isSaving={isLoading}
          canSave={totalExercises > 0 && workoutName.trim() !== ''}
        />

        {/* Session Context Banner */}
        {workoutContext && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Creating workout for training session
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{workoutContext.playerName} ({workoutContext.teamName})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(sessionDate, 'MMM d')} at {workoutContext.sessionTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{workoutContext.sessionLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>{workoutContext.sessionType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Exercise Library */}
          <div className="w-80 flex-shrink-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Exercise Library</CardTitle>
              </CardHeader>
              <CardContent>
                <ExerciseLibrary 
                  filters={{
                    category: 'all',
                    equipment: [],
                    muscleGroups: [],
                    difficulty: 'all',
                    searchTerm: '',
                    showMostUsed: false
                  }}
                  onFilterChange={() => {}}
                />
              </CardContent>
            </Card>
          </div>

          {/* Workout Builder */}
          <div className="flex-1">
            <Card>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
                    <TabsTrigger 
                      value="details" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger 
                      value="exercises" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                    >
                      <Dumbbell className="h-4 w-4 mr-2" />
                      Exercises
                      {totalExercises > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {totalExercises}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="assignment" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assignment
                      {(selectedPlayers.length > 0 || selectedTeams.length > 0) && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedPlayers.length + selectedTeams.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="preview" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
                      disabled={totalExercises === 0}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  </TabsList>

                  {/* Details Tab */}
                  <TabsContent value="details" className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="workout-name" className="text-base font-medium">
                            Workout Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="workout-name"
                            value={workoutName}
                            onChange={(e) => setWorkoutName(e.target.value)}
                            placeholder="e.g., Upper Body Strength"
                            className={cn(
                              "mt-2",
                              showValidation && !workoutName.trim() && "border-red-500"
                            )}
                          />
                        </div>

                        <div>
                          <Label htmlFor="description" className="text-base font-medium">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the workout goals and structure..."
                            rows={4}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-medium">
                            Workout Summary
                          </Label>
                          <div className="mt-2 p-4 bg-muted rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Duration</span>
                              <span className="text-lg font-semibold">
                                {Math.round(totalDuration)} min
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Exercises</span>
                              <span className="text-lg font-semibold">{totalExercises}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Total Sets</span>
                              <span className="text-lg font-semibold">{totalSets}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-semibold text-blue-700">
                              {phases.find(p => p.type === 'main')?.exercises.length || 0}
                            </div>
                            <div className="text-xs text-blue-600">Main Exercises</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-lg font-semibold text-purple-700">
                              {phases.find(p => p.type === 'accessory')?.exercises.length || 0}
                            </div>
                            <div className="text-xs text-purple-600">Accessory</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <div className="text-lg font-semibold text-orange-700">
                              {phases.find(p => p.type === 'core')?.exercises.length || 0}
                            </div>
                            <div className="text-xs text-orange-600">Core Work</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Exercises Tab */}
                  <TabsContent value="exercises" className="p-6">
                    <div className="space-y-6">
                      {phases.map((phase) => (
                        <div key={phase.id} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: PHASE_CONFIGS[phase.type].color }}
                              />
                              {phase.name}
                              {phase.exercises.length > 0 && (
                                <Badge variant="outline" className="ml-2">
                                  {phase.exercises.length} exercises
                                </Badge>
                              )}
                            </h3>
                          </div>

                          {phase.exercises.length === 0 ? (
                            <div 
                              className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground"
                              data-phase-type={phase.type}
                              data-index={0}
                            >
                              <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>Drag exercises here to add to {phase.name}</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {phase.exercises.map((exercise, index) => (
                                <div
                                  key={exercise.id}
                                  className="bg-card border rounded-lg p-4"
                                  data-phase-type={phase.type}
                                  data-index={index}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="cursor-move pt-1">
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">{exercise.name}</h4>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => duplicateExercise(phase.id, exercise.id)}
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => removeExercise(phase.id, exercise.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-4 gap-3">
                                        <div>
                                          <Label className="text-xs">Sets</Label>
                                          <Input
                                            type="number"
                                            value={exercise.sets}
                                            onChange={(e) => updateExercise(phase.id, exercise.id, { 
                                              sets: parseInt(e.target.value) || 0 
                                            })}
                                            min={1}
                                            className="h-8"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Reps</Label>
                                          <Input
                                            type="number"
                                            value={exercise.reps || ''}
                                            onChange={(e) => updateExercise(phase.id, exercise.id, { 
                                              reps: parseInt(e.target.value) || undefined 
                                            })}
                                            placeholder="10"
                                            min={1}
                                            className="h-8"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Weight (kg)</Label>
                                          <Input
                                            type="number"
                                            value={exercise.weight || ''}
                                            onChange={(e) => updateExercise(phase.id, exercise.id, { 
                                              weight: parseFloat(e.target.value) || undefined 
                                            })}
                                            placeholder="--"
                                            step={2.5}
                                            className="h-8"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Rest (sec)</Label>
                                          <Input
                                            type="number"
                                            value={exercise.restBetweenSets}
                                            onChange={(e) => updateExercise(phase.id, exercise.id, { 
                                              restBetweenSets: parseInt(e.target.value) || 60 
                                            })}
                                            min={0}
                                            step={15}
                                            className="h-8"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                          <Label className="text-xs">Target RPE</Label>
                                          <Select
                                            value={exercise.rpe?.toString() || ''}
                                            onValueChange={(value) => updateExercise(phase.id, exercise.id, { 
                                              rpe: value ? parseInt(value) : undefined 
                                            })}
                                          >
                                            <SelectTrigger className="h-8 w-16">
                                              <SelectValue placeholder="--" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {[...Array(10)].map((_, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                  {i + 1}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <Input
                                          placeholder="Notes..."
                                          value={exercise.notes || ''}
                                          onChange={(e) => updateExercise(phase.id, exercise.id, { 
                                            notes: e.target.value 
                                          })}
                                          className="h-8"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Assignment Tab */}
                  <TabsContent value="assignment" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Player Assignment</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Assign this workout to specific players or entire teams
                        </p>
                      </div>

                      <PlayerTeamAssignment
                        selectedPlayers={selectedPlayers}
                        selectedTeams={selectedTeams}
                        onPlayersChange={setSelectedPlayers}
                        onTeamsChange={setSelectedTeams}
                        availablePlayers={playersData || []}
                        teamId={sessionInfo.teamId}
                        showMedicalStatus={true}
                      />

                      {/* Medical Warnings */}
                      {medicalReports && medicalReports.length > 0 && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-yellow-900">Medical Considerations</h4>
                              <p className="text-sm text-yellow-700 mt-1">
                                Some selected players have medical restrictions. Exercise modifications may be needed for their safety.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Preview Tab */}
                  <TabsContent value="preview" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Workout Preview</h3>
                        <p className="text-muted-foreground text-sm">
                          This is how the workout will appear to players
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                        <div className="space-y-4">
                          <div>
                            <h2 className="text-2xl font-bold">{workoutName || 'Untitled Workout'}</h2>
                            {description && (
                              <p className="text-muted-foreground mt-2">{description}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-sm">
                              <Clock className="h-3 w-3 mr-1" />
                              {Math.round(totalDuration)} min
                            </Badge>
                            <Badge variant="secondary" className="text-sm">
                              {totalExercises} Exercises
                            </Badge>
                            <Badge variant="secondary" className="text-sm">
                              {totalSets} Sets
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-sm",
                                getWorkoutDifficulty() === 'beginner' && "bg-green-100 text-green-700",
                                getWorkoutDifficulty() === 'intermediate' && "bg-yellow-100 text-yellow-700",
                                getWorkoutDifficulty() === 'advanced' && "bg-red-100 text-red-700"
                              )}
                            >
                              {getWorkoutDifficulty()}
                            </Badge>
                          </div>

                          <div className="mt-6 space-y-4">
                            {phases.filter(phase => phase.exercises.length > 0).map((phase) => (
                              <div key={phase.id}>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: PHASE_CONFIGS[phase.type].color }}
                                  />
                                  {phase.name}
                                </h3>
                                <div className="space-y-2">
                                  {phase.exercises.map((exercise, index) => (
                                    <div key={exercise.id} className="flex items-center gap-3">
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-sm font-medium">
                                        {index + 1}
                                      </div>
                                      <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{exercise.name}</span>
                                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{exercise.sets} × {exercise.reps || '?'}</span>
                                            {exercise.weight && (
                                              <span>@ {exercise.weight}kg</span>
                                            )}
                                            {exercise.rpe && (
                                              <Badge variant="outline" className="text-xs">
                                                RPE {exercise.rpe}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        {exercise.notes && (
                                          <p className="text-sm text-muted-foreground mt-1">{exercise.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {hasAutoSave && (
              <p className="text-sm text-muted-foreground">
                Auto-saved {format(new Date(), 'HH:mm')}
              </p>
            )}
            <Button
              onClick={handleSave}
              disabled={isLoading || totalExercises === 0 || !workoutName.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : workoutContext ? 'Save & Link to Session' : 'Save Workout'}
            </Button>
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
}

export default function StrengthWorkoutBuilder(props: StrengthWorkoutBuilderProps) {
  return (
    <WorkoutBuilderErrorBoundary 
      workoutType="strength"
      onReset={() => {
        console.log('Strength workout builder reset after error');
      }}
    >
      <StrengthWorkoutBuilderInternal {...props} />
    </WorkoutBuilderErrorBoundary>
  );
}