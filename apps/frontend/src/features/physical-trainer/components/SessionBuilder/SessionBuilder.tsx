import React, { useState, useCallback, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Save, Undo, Redo, Users, Clock, Activity } from '@/components/icons';
import { ExerciseLibrary } from './ExerciseLibrary';
import { SessionCanvas } from './SessionCanvas';
import { SessionDetails } from './SessionDetails';
import { SessionTypeSelector } from './SessionTypeSelector';
import { StrengthModeSelector } from './StrengthModeSelector';
import { UnifiedScheduler, UnifiedSchedule } from '../shared/UnifiedScheduler';
import { WorkoutBuilderLayout, WorkoutTabContent } from '../shared/WorkoutBuilderLayout';
import { WorkoutBuilderHeader } from '../shared/WorkoutBuilderHeader';
import { BulkConfigurationPanel } from '../shared/BulkConfigurationPanel';
import { PlayerTeamAssignment } from '../shared/PlayerTeamAssignment';
import { WorkoutPreview } from '../shared/WorkoutPreview';
import { WorkoutTemplatesList } from '../shared/WorkoutTemplatesList';
import { ExerciseLibrarySidebar } from '../shared/ExerciseLibrarySidebar';
import { useBulkSession, type BulkSessionConfig } from '../../hooks/useBulkSession';
import { 
  SessionTemplate, 
  SessionPhase, 
  SessionExercise, 
  DragItem,
  SessionType,
  SessionPhaseType,
  DroppableExercise,
  ExerciseFilters,
  SessionBuilderState,
  StrengthMode
} from '../../types/session-builder.types';
import { 
  WorkoutBuilderTab,
  WorkoutDetailsFormData,
  WorkoutTemplateSelection,
  ExerciseLibraryItem,
  ExercisePhase
} from '../../types/workout-builder.types';
import { WorkoutType } from '../../types';
import { useDebounce } from '@/hooks/useDebounce';
import { getStrengthModeConfig, getModeDefaults } from '../../config/strengthModeConfig';

interface SessionBuilderProps {
  mode?: 'create' | 'edit' | 'template' | 'bulk';
  sessionId?: string;
  initialData?: SessionTemplate | any;
  preSelectedPlayers?: string[];
  preSelectedTeam?: string;
  onSave?: (session: SessionTemplate | SessionTemplate[]) => void;
  onCancel?: () => void;
  enableBulkMode?: boolean;
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
  initialData,
  preSelectedPlayers = [],
  preSelectedTeam,
  onSave,
  onCancel,
  enableBulkMode = false
}) => {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [currentTab, setCurrentTab] = useState<WorkoutBuilderTab>('details');
  
  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(mode === 'bulk');
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Session state
  const [sessionState, setSessionState] = useState<SessionBuilderState>({
    currentSession: {
      name: initialData?.name || '',
      type: initialData?.type || 'mixed',
      phases: initialData?.phases || INITIAL_PHASES,
      totalDuration: initialData?.totalDuration || 0,
      equipmentRequired: initialData?.equipment || initialData?.equipmentRequired || [],
      targetPlayers: initialData?.targetPlayers || preSelectedPlayers,
      targetTeams: initialData?.targetTeams || (preSelectedTeam ? [preSelectedTeam] : []),
      difficulty: initialData?.difficulty || 'intermediate',
      tags: initialData?.tags || [],
      strengthMode: initialData?.strengthMode || 'strength'
    },
    isDirty: false,
    history: [],
    historyIndex: -1,
    autoSaveStatus: 'idle'
  });

  // Unified schedule state
  const [schedule, setSchedule] = useState<UnifiedSchedule>({
    startDate: new Date(),
    startTime: '09:00',
    location: 'Main Gym',
    participants: {
      playerIds: initialData?.targetPlayers || preSelectedPlayers,
      teamIds: initialData?.targetTeams || (preSelectedTeam ? [preSelectedTeam] : [])
    }
  });

  // Exercise library state
  const [exerciseFilters, setExerciseFilters] = useState<ExerciseFilters>({
    category: 'all',
    equipment: [],
    muscleGroups: [],
    difficulty: 'all',
    searchTerm: '',
    showMostUsed: false,
    strengthMode: sessionState.currentSession?.strengthMode || 'strength'
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
    const currentMode = sessionState.currentSession?.strengthMode || 'strength';
    const modeDefaults = getModeDefaults(currentMode);
    const modeConfig = getStrengthModeConfig(currentMode);
    
    // Apply mode-specific defaults
    const defaultSets = exercise.defaultSets || modeDefaults.sets;
    const defaultReps = exercise.defaultReps || modeDefaults.reps;
    const defaultRest = exercise.restPeriod || modeDefaults.rest;

    const newExercise: SessionExercise = {
      ...exercise,
      sessionExerciseId: `session-exercise-${Date.now()}-${Math.random()}`,
      phaseType,
      orderIndex: index,
      sets: defaultSets,
      reps: defaultReps,
      duration: exercise.defaultDuration,
      rest: defaultRest,
      strengthMode: currentMode,
      modeSpecificMetrics: {},
      // Set mode-specific flags
      isExplosive: currentMode === 'power' || currentMode === 'plyometrics',
      requiresStability: currentMode === 'stability_core',
      usesEccentricControl: currentMode === 'strength'
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

  // Handle bulk session creation
  const handleBulkComplete = async (bulkConfig: BulkSessionConfig<SessionTemplate>) => {
    try {
      setIsSaving(true);
      
      // Convert bulk config to individual sessions
      const sessions: SessionTemplate[] = bulkConfig.sessions.map((sessionConfig, index) => ({
        ...sessionState.currentSession!,
        id: sessionConfig.id,
        name: sessionConfig.name,
        targetPlayers: sessionConfig.playerIds,
        targetTeams: sessionConfig.teamIds,
        schedule: {
          startDate: new Date(bulkConfig.sessionDate),
          startTime: sessionConfig.startTime || bulkConfig.sessionTime,
          location: `Facility ${bulkConfig.facilityId}`,
          duration: bulkConfig.duration
        },
        notes: sessionConfig.notes,
        // Strength-specific bulk considerations
        equipmentAllocations: getStrengthEquipmentAllocations(sessionConfig, index),
        loadVariations: getLoadVariations(sessionConfig, index),
        restPeriodAdjustments: getRestPeriodAdjustments(sessionConfig)
      }));
      
      if (onSave) {
        await onSave(sessions);
      }
      
      toast({
        title: 'Bulk Sessions Created',
        description: `Successfully created ${sessions.length} strength training sessions`,
      });
      
      setShowBulkPanel(false);
      setBulkMode(false);
    } catch (error) {
      console.error('Failed to create bulk sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to create bulk sessions. Please try again.',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsSaving(false);
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

    if (bulkMode) {
      setShowBulkPanel(true);
      return;
    }

    if (onSave) {
      // Update the session with the schedule data
      const sessionWithSchedule = {
        ...sessionState.currentSession,
        targetPlayers: schedule.participants.playerIds,
        targetTeams: schedule.participants.teamIds,
        schedule: {
          startDate: schedule.startDate,
          startTime: schedule.startTime,
          location: schedule.location,
          recurrence: schedule.recurrence,
          reminders: schedule.reminders
        }
      };
      onSave(sessionWithSchedule);
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

  const handleStrengthModeChange = (strengthMode: StrengthMode) => {
    const modeConfig = getStrengthModeConfig(strengthMode);
    const modeDefaults = getModeDefaults(strengthMode);
    
    setSessionState(prev => ({
      ...prev,
      currentSession: {
        ...prev.currentSession!,
        strengthMode,
        modeConfig
      },
      isDirty: true
    }));

    // Update exercise filters to match new mode
    setExerciseFilters(prev => ({
      ...prev,
      strengthMode
    }));

    toast({
      title: 'Strength Mode Updated',
      description: `Switched to ${modeConfig.name} mode. Exercise library will now show ${modeConfig.name.toLowerCase()}-specific exercises.`,
    });
  };

  // Mock exercise name mapping for demo
  const getExerciseName = (exerciseId: string): string => {
    const nameMap: Record<string, string> = {
      'squat': 'Back Squat',
      'deadlift': 'Deadlift',
      'bench-press': 'Bench Press',
      'pull-up': 'Pull-up',
      'box-jump': 'Box Jump',
      'plank': 'Plank',
      'db-row': 'Dumbbell Row',
      'goblet-squat': 'Goblet Squat',
      'push-up': 'Push-up',
      'bike-interval': 'Bike Intervals',
      'bike-sprint': 'Bike Sprint',
      'bike-steady': 'Steady State Bike',
      'rowing-interval': 'Rowing Intervals',
      'rowing': 'Rowing',
      'ladder-in-out': 'Ladder In-Out',
      'ladder-lateral': 'Ladder Lateral',
      'cone-weave': 'Cone Weave',
      'mirror-drill': 'Mirror Drill',
      'cone-reaction': 'Cone Reaction Drill',
      'hopscotch': 'Hopscotch',
      'cone-zigzag': 'Cone Zigzag'
    };
    return nameMap[exerciseId] || exerciseId;
  };

  // Handle template selection
  const handleTemplateSelect = (template: WorkoutTemplateSelection) => {
    // Reset phases
    const newPhases = INITIAL_PHASES.map(phase => ({ ...phase, exercises: [] }));
    
    // Map phase types
    const phaseMap: Record<ExercisePhase, SessionPhaseType> = {
      'warmup': 'warmup',
      'main': 'main',
      'cooldown': 'cooldown',
      'recovery': 'cooldown'
    };
    
    template.exercises.forEach((exercise, globalIndex) => {
      const mappedPhase = phaseMap[exercise.phase] || 'main';
      const phaseIndex = newPhases.findIndex(p => p.type === mappedPhase);
      
      if (phaseIndex !== -1) {
        const sessionExercise: SessionExercise = {
          id: exercise.exerciseId,
          sessionExerciseId: `session-exercise-${Date.now()}-${globalIndex}`,
          name: getExerciseName(exercise.exerciseId),
          category: 'strength',
          equipment: [],
          muscleGroups: [],
          phaseType: mappedPhase,
          orderIndex: newPhases[phaseIndex].exercises.length,
          sets: exercise.sets || 3,
          reps: exercise.reps || 10,
          duration: exercise.duration,
          distance: exercise.distance,
          rest: exercise.restBetweenSets || 60,
          weight: exercise.weight,
          notes: exercise.notes,
          defaultSets: exercise.sets || 3,
          defaultReps: exercise.reps || 10,
          defaultDuration: exercise.duration,
          restPeriod: exercise.restBetweenSets || 60
        };
        newPhases[phaseIndex].exercises.push(sessionExercise);
      }
    });

    // Calculate durations
    newPhases.forEach(phase => {
      phase.duration = calculatePhaseDuration(phase.exercises);
    });

    // Update session with template data
    setSessionState(prev => ({
      ...prev,
      currentSession: {
        ...prev.currentSession!,
        name: template.name,
        phases: newPhases,
        tags: template.tags || [],
        difficulty: template.defaultIntensity || 'intermediate',
        description: template.description
      },
      isDirty: true
    }));

    toast({
      title: 'Template loaded',
      description: `${template.name} has been loaded into the builder`
    });

    // Switch to exercises tab
    setCurrentTab('exercises');
  };

  // Strength-specific bulk utility functions
  const getStrengthEquipmentAllocations = (sessionConfig: any, sessionIndex: number) => {
    const currentMode = sessionState.currentSession?.strengthMode || 'strength';
    const modeConfig = getStrengthModeConfig(currentMode);
    
    // Mode-specific equipment allocation
    if (currentMode === 'power') {
      return {
        'olympic-platforms': sessionIndex % 2 === 0 ? ['platform-1', 'platform-2'] : ['platform-3', 'platform-4'],
        'bumper-plates': [`olympic-set-${sessionIndex + 1}`],
        'velocity-trackers': [`vbt-device-${(sessionIndex % 2) + 1}`],
        'kettlebells': [`kb-set-${sessionIndex + 1}`]
      };
    } else if (currentMode === 'stability_core') {
      return {
        'stability-balls': [`ball-${sessionIndex + 1}`, `ball-${sessionIndex + 2}`],
        'balance-pads': [`pad-set-${sessionIndex + 1}`],
        'resistance-bands': [`band-set-${sessionIndex + 1}`],
        'suspension-trainers': [`trx-${(sessionIndex % 3) + 1}`]
      };
    } else if (currentMode === 'plyometrics') {
      return {
        'plyo-boxes': [`box-set-${sessionIndex + 1}`],
        'hurdles': [`hurdle-set-${sessionIndex + 1}`],
        'agility-equipment': [`cone-set-${sessionIndex + 1}`],
        'force-plates': sessionIndex % 2 === 0 ? ['force-plate-1'] : ['force-plate-2']
      };
    } else {
      // Traditional strength equipment distribution
      return {
        'squat-racks': sessionIndex % 4 === 0 ? ['rack-1', 'rack-2'] : ['rack-3', 'rack-4'],
        'barbell-stations': sessionIndex % 2 === 0 ? ['station-1', 'station-2', 'station-3'] : ['station-4', 'station-5', 'station-6'],
        'dumbbell-sets': [`set-${sessionIndex + 1}`, `set-${sessionIndex + 2}`],
        'bench-press': sessionIndex % 3 === 0 ? ['bench-1', 'bench-2'] : sessionIndex % 3 === 1 ? ['bench-3', 'bench-4'] : ['bench-5', 'bench-6']
      };
    }
  };

  const getLoadVariations = (sessionConfig: any, sessionIndex: number) => {
    const currentMode = sessionState.currentSession?.strengthMode || 'strength';
    const modeConfig = getStrengthModeConfig(currentMode);
    
    // Mode-specific load variations
    if (currentMode === 'power') {
      // Power training focuses on velocity zones
      const baseIntensity = 0.6; // 60% for power development
      const variation = (sessionIndex * 0.03) - 0.06; // ±6% variation
      return {
        intensityModifier: Math.max(0.45, Math.min(0.75, baseIntensity + variation)),
        velocityZone: sessionIndex % 2 === 0 ? 'speed' : 'strength-speed',
        volumeAdjustment: 0.8, // Lower volume for power
        restPeriods: 'extended' // Always extended for power
      };
    } else if (currentMode === 'stability_core') {
      // Stability focuses on time and quality
      return {
        intensityModifier: 0.0, // Bodyweight or light resistance
        timeVariation: sessionIndex % 2 === 0 ? 1.0 : 1.2, // ±20% time variation
        volumeAdjustment: sessionIndex % 2 === 0 ? 1.0 : 0.9,
        restPeriods: 'minimal' // Shorter rest periods
      };
    } else if (currentMode === 'plyometrics') {
      // Plyometrics focuses on quality and explosive output
      return {
        intensityModifier: 0.0, // Bodyweight primarily
        heightVariation: sessionIndex % 2 === 0 ? 1.0 : 0.9, // Box height variation
        volumeAdjustment: 0.7, // Low volume, high quality
        restPeriods: 'extended' // Full recovery between sets
      };
    } else {
      // Traditional strength training
      const baseIntensity = 0.75; // 75% of 1RM
      const variation = (sessionIndex * 0.05) - 0.1; // ±10% variation
      return {
        intensityModifier: Math.max(0.6, Math.min(0.9, baseIntensity + variation)),
        volumeAdjustment: sessionIndex % 2 === 0 ? 1.0 : 0.9, // Alternate volume
        restPeriods: sessionIndex % 2 === 0 ? 'standard' : 'extended'
      };
    }
  };

  const getRestPeriodAdjustments = (sessionConfig: any) => {
    const currentMode = sessionState.currentSession?.strengthMode || 'strength';
    const modeConfig = getStrengthModeConfig(currentMode);
    
    // Mode-specific rest period adjustments
    return {
      betweenExercises: modeConfig.defaultRestPeriods.betweenExercises,
      betweenSets: modeConfig.defaultRestPeriods.betweenSets,
      stationTransition: currentMode === 'stability_core' ? 15 : currentMode === 'power' ? 60 : 30,
      equipmentSetup: currentMode === 'power' ? 90 : currentMode === 'plyometrics' ? 60 : 45
    };
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col h-full bg-gray-50">
          {/* Enhanced Header with Bulk Mode Support */}
          <WorkoutBuilderHeader
            title={sessionState.currentSession?.name || 'New Strength Workout'}
            workoutType="strength"
            onSave={handleSave}
            onCancel={onCancel || (() => {})}
            isSaving={isSaving}
            supportsBulkMode={enableBulkMode}
            bulkMode={bulkMode}
            onBulkToggle={(enabled) => {
              setBulkMode(enabled);
              if (enabled && sessionState.currentSession?.name) {
                // Auto-open bulk panel when toggled on with valid workout
                setShowBulkPanel(true);
              }
            }}
          />
          
          {/* Bulk Configuration Panel */}
          {bulkMode && (
            <div className="px-6 pt-4">
              <BulkConfigurationPanel<SessionTemplate>
                workoutType="strength"
                baseWorkout={sessionState.currentSession}
                onComplete={handleBulkComplete}
                onCancel={() => {
                  setShowBulkPanel(false);
                  setBulkMode(false);
                }}
                isOpen={showBulkPanel}
                onToggle={setShowBulkPanel}
                enablePlayerDistribution={true}
                showAdvancedOptions={true}
                maxSessions={6}
                minSessions={2}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <WorkoutBuilderLayout
              workoutType="strength"
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              onSave={handleSave}
              onCancel={onCancel || (() => {})}
              isDirty={sessionState.isDirty}
              isSaving={isSaving}
              validationErrors={[]}
              title={sessionState.currentSession?.name || 'New Strength Workout'}
            >
        {/* Details Tab */}
        <WorkoutTabContent value="details">
          <div className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workout-name">Workout Name</Label>
                      <Input
                        id="workout-name"
                        value={sessionState.currentSession?.name || ''}
                        onChange={(e) => {
                          setSessionState(prev => ({
                            ...prev,
                            currentSession: {
                              ...prev.currentSession!,
                              name: e.target.value
                            },
                            isDirty: true
                          }));
                        }}
                        placeholder={bulkMode ? "Base workout name (will be used for all sessions)" : "Enter workout name"}
                      />
              </div>
              
              <div className="space-y-2">
                <Label>Workout Type</Label>
                <SessionTypeSelector 
                  value={sessionState.currentSession?.type || 'mixed'}
                  onChange={handleSessionTypeChange}
                />
              </div>
            </div>

            {/* Strength Mode Selector - Only show for strength workouts */}
            {sessionState.currentSession?.type === 'strength' && (
              <div className="space-y-2">
                <StrengthModeSelector
                  value={sessionState.currentSession?.strengthMode || 'strength'}
                  onChange={handleStrengthModeChange}
                  showDescription={true}
                />
              </div>
            )}

                  {bulkMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <h4 className="font-medium text-blue-900">Bulk Mode Active</h4>
                      <p className="text-sm text-blue-700">
                        This workout will be used as a template for multiple sessions. You can customize individual 
                        sessions after clicking "Save Workout" to open the bulk configuration panel.
                      </p>
                      <ul className="text-xs text-blue-600 space-y-1 ml-4">
                        <li>• Equipment will be automatically distributed across sessions</li>
                        <li>• Loads can be varied to prevent identical workouts</li>
                        <li>• Rest periods will be optimized for equipment rotation</li>
                        <li>• Each session can have different player assignments</li>
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="workout-description">Description</Label>
                    <Textarea
                      id="workout-description"
                      value={sessionState.currentSession?.description || ''}
                      onChange={(e) => {
                        setSessionState(prev => ({
                          ...prev,
                          currentSession: {
                            ...prev.currentSession!,
                            description: e.target.value
                          },
                          isDirty: true
                        }));
                      }}
                      placeholder={bulkMode ? "Base workout description (applies to all sessions)" : "Describe the workout goals and focus areas"}
                      rows={3}
                    />
                  </div>

                  {/* Include the scheduling section from SessionDetails */}
                  {!bulkMode && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Schedule</h4>
                      <UnifiedScheduler
                        schedule={schedule}
                        onChange={setSchedule}
                      />
                    </div>
                  )}
          </div>
        </WorkoutTabContent>

        {/* Exercises Tab */}
        <WorkoutTabContent value="exercises">
          <div className="flex h-full">
            {/* Exercise Library Sidebar */}
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
          </div>
        </WorkoutTabContent>

              {/* Assignment Tab */}
              <WorkoutTabContent value="assignment">
                <div className="p-6">
                  {bulkMode && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-2">Bulk Mode Player Assignment</h4>
                      <p className="text-sm text-yellow-700">
                        In bulk mode, you can assign different players to each session in the bulk configuration panel. 
                        The assignments here will be used as defaults for all sessions.
                      </p>
                    </div>
                  )}
                  
                  <PlayerTeamAssignment
                    selectedPlayers={schedule.participants.playerIds || []}
                    selectedTeams={schedule.participants.teamIds || []}
                    onPlayersChange={(playerIds) => {
                      setSchedule(prev => ({
                        ...prev,
                        participants: {
                          ...prev.participants,
                          playerIds
                        }
                      }));
                    }}
                    onTeamsChange={(teamIds) => {
                      setSchedule(prev => ({
                        ...prev,
                        participants: {
                          ...prev.participants,
                          teamIds
                        }
                      }));
                    }}
                    showTeams={true}
                    showMedical={true}
                  />
                </div>
              </WorkoutTabContent>

        {/* Preview Tab */}
        <WorkoutTabContent value="preview">
          <div className="p-6">
            <WorkoutPreview
              workoutType="strength"
              details={{
                title: sessionState.currentSession?.name || '',
                description: sessionState.currentSession?.description,
                date: schedule.startDate.toISOString().split('T')[0],
                time: schedule.startTime,
                duration: sessionState.currentSession?.totalDuration || 0,
                location: schedule.location || '',
                intensity: sessionState.currentSession?.difficulty || 'intermediate',
                tags: sessionState.currentSession?.tags
              }}
              exercises={sessionState.currentSession?.phases.flatMap(phase => 
                phase.exercises.map((ex, idx) => ({
                  exerciseId: ex.id,
                  phase: phase.type as ExercisePhase,
                  orderIndex: idx,
                  sets: ex.sets,
                  reps: ex.reps,
                  weight: ex.weight,
                  duration: ex.duration,
                  restBetweenSets: ex.rest,
                  notes: ex.notes
                }))
              ) || []}
              assignments={{
                playerIds: schedule.participants.playerIds || [],
                teamIds: schedule.participants.teamIds || []
              }}
              estimatedDuration={sessionState.currentSession?.totalDuration || 0}
              equipmentNeeded={sessionState.currentSession?.equipmentRequired || []}
            />
          </div>
        </WorkoutTabContent>

        {/* Templates Tab */}
        <WorkoutTabContent value="templates">
          <WorkoutTemplatesList
            workoutType="strength"
            onSelectTemplate={handleTemplateSelect}
            currentTemplateId={undefined}
          />
              </WorkoutTabContent>
            </WorkoutBuilderLayout>
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
    </>
  );
};