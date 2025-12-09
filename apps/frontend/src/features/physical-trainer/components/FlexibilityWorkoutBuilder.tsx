'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Plus,
  Save,
  X,
  Users,
  Heart,
  Activity,
  AlertTriangle,
  Copy,
  Trash2,
  RotateCw,
  Volume2
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import { BulkConfigurationPanel } from './shared/BulkConfigurationPanel';
import { PlayerTeamAssignment } from './shared/PlayerTeamAssignment';
import { WorkoutSuccessModal } from './shared/WorkoutSuccessModal';
import { SaveWorkflowProgress } from './SaveWorkflowProgress';
import WorkoutBuilderErrorBoundary from './shared/WorkoutBuilderErrorBoundary';
import { FlexibilityStretchLibrary } from './flexibility/FlexibilityStretchLibrary';
import { useSaveWorkflow } from '../hooks/useSaveWorkflow';
import { useBulkSession, type BulkSessionConfig } from '../hooks/useBulkSession';
import { useAutoSave } from '../hooks/useAutoSave';
import { WorkoutType } from '../types';
import type {
  FlexibilityProgram,
  FlexibilityProgramPhase,
  FlexibilitySequenceItem,
  StretchExercise,
  BreathingPattern,
  FlexibilityPhase,
  DifficultyLevel,
  FlexibilityEquipment,
  BodyPart,
  StretchType
} from '../types/flexibility.types';
import {
  DEFAULT_BREATHING_PATTERNS,
  HOLD_TIME_PROGRESSIONS,
  FLEXIBILITY_EQUIPMENT_CONFIGS,
  calculateTotalPhaseDuration,
  estimateFlexibilityProgramDuration,
  validateFlexibilitySequence
} from '../types/flexibility.types';

interface FlexibilityWorkoutBuilderProps {
  onSave?: (program: FlexibilityProgram) => void;
  onCancel: () => void;
  initialProgram?: FlexibilityProgram;
  selectedPlayers?: string[];
  teamId?: string;
  scheduledDate?: Date;
  location?: string;
}

// Helper function
function getPhaseConfig(type: FlexibilityPhase) {
  const configs = {
    warmup: {
      name: 'Warm-up',
      description: 'Gentle movements to prepare the body',
      color: '#10B981'
    },
    dynamic_stretches: {
      name: 'Dynamic Stretches',
      description: 'Active movements through range of motion',
      color: '#F59E0B'
    },
    static_stretches: {
      name: 'Static Stretches',
      description: 'Sustained holds to improve flexibility',
      color: '#3B82F6'
    },
    cooldown: {
      name: 'Cool-down',
      description: 'Relaxation and final stretches',
      color: '#8B5CF6'
    }
  };
  return configs[type];
}

// Helper component
const FlexibilityItemCard: React.FC<{
  item: FlexibilitySequenceItem;
  index: number;
  onEdit: (item: FlexibilitySequenceItem) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
}> = ({ item, index, onEdit, onDelete, isEditing }) => (
  <div className={`border rounded-lg p-3 ${isEditing ? 'border-primary' : 'border-muted'}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">#{index + 1}</span>
          <span className="font-medium">
            {item.exercise?.name || `Stretch ${item.exerciseId}`}
          </span>
          {item.side !== 'both' && (
            <Badge variant="outline" className="text-xs">{item.side}</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <span>{item.holdTime}s hold</span>
          <span>{item.repetitions}x</span>
          {item.restAfter && <span>{item.restAfter}s rest</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
          Edit
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
);

const FlexibilitySequenceView: React.FC<{
  program: FlexibilityProgram;
  onReorderPhases: (phases: FlexibilityProgramPhase[]) => void;
}> = ({ program, onReorderPhases }) => (
  <div className="text-center py-12">
    <p className="text-muted-foreground">Flow sequence visualization would go here</p>
    <p className="text-sm text-muted-foreground mt-2">
      This would show the complete program flow with transitions and timing
    </p>
    <div className="mt-4 p-4 border rounded-lg bg-muted/50">
      <h4 className="font-medium mb-2">Program Overview</h4>
      <div className="flex items-center justify-center gap-4 text-sm">
        <span>{program.phases.length} phases</span>
        <Separator orientation="vertical" className="h-4" />
        <span>{Math.round(program.totalDuration / 60)} minutes</span>
        <Separator orientation="vertical" className="h-4" />
        <span>{program.targetBodyParts.length} body parts</span>
      </div>
    </div>
  </div>
);

function FlexibilityWorkoutBuilderInternal({
  onSave,
  onCancel,
  initialProgram,
  selectedPlayers = [],
  teamId = 'team-001',
  scheduledDate = new Date(),
  location = 'Training Center'
}: FlexibilityWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer']);
  
  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  
  // Core program state
  const [activeTab, setActiveTab] = useState<'build' | 'library' | 'sequence'>('build');
  const [programName, setProgramName] = useState(initialProgram?.name || '');
  const [programDescription, setProgramDescription] = useState(initialProgram?.description || '');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialProgram?.difficulty || 'intermediate'
  );
  const [phases, setPhases] = useState<FlexibilityProgramPhase[]>(
    initialProgram?.phases || []
  );
  const [selectedPhase, setSelectedPhase] = useState<FlexibilityProgramPhase | null>(null);
  const [editingItem, setEditingItem] = useState<FlexibilitySequenceItem | null>(null);
  
  // Player/Team assignment
  const [assignedPlayerIds, setAssignedPlayerIds] = useState<string[]>(selectedPlayers);
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>(teamId ? [teamId] : []);
  
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Calculate program metrics
  const totalDuration = useMemo(() => {
    return phases.reduce((sum, phase) => sum + calculateTotalPhaseDuration(phase), 0);
  }, [phases]);
  
  const totalStretches = useMemo(() => {
    return phases.reduce((sum, phase) => sum + phase.exercises.length, 0);
  }, [phases]);
  
  const bodyPartsTargeted = useMemo(() => {
    const bodyParts = new Set<BodyPart>();
    phases.forEach(phase => {
      phase.exercises.forEach(item => {
        if (item.exercise) {
          item.exercise.bodyParts.forEach(part => bodyParts.add(part));
        }
      });
    });
    return Array.from(bodyParts);
  }, [phases]);
  
  // Create current flexibility program
  const currentFlexibilityProgram: FlexibilityProgram = useMemo(() => ({
    id: initialProgram?.id || `flexibility-${Date.now()}`,
    name: programName,
    description: programDescription,
    difficulty,
    totalDuration,
    phases,
    primaryGoals: ['mobility', 'recovery'],
    targetBodyParts: bodyPartsTargeted,
    allowCustomHoldTimes: true,
    requiresInstructor: false,
    supportsGroupSession: true,
    maxParticipants: 20,
    recommendedEnvironment: ['music', 'quiet'],
    requiredEquipment: getRequiredEquipment(),
    optionalEquipment: getOptionalEquipment(),
    tags: ['flexibility', difficulty],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }), [programName, programDescription, difficulty, totalDuration, phases, bodyPartsTargeted]);
  
  // Helper functions for equipment
  function getRequiredEquipment(): FlexibilityEquipment[] {
    const equipment = new Set<FlexibilityEquipment>();
    phases.forEach(phase => {
      phase.exercises.forEach(item => {
        if (item.exercise) {
          item.exercise.equipment.forEach(eq => {
            if (eq !== 'none') equipment.add(eq);
          });
        }
      });
    });
    return Array.from(equipment);
  }
  
  function getOptionalEquipment(): FlexibilityEquipment[] {
    // Return common optional equipment for flexibility
    return ['blocks', 'straps', 'towel', 'chair'];
  }
  
  // Bulk session hook
  const bulkSession = useBulkSession({
    workoutType: 'flexibility',
    baseWorkout: currentFlexibilityProgram,
    onComplete: async (config: BulkSessionConfig<FlexibilityProgram>) => {
      await handleBulkSave(config);
    },
    initialConfig: {
      numberOfSessions: 2,
      sessionDate: scheduledDate.toISOString().split('T')[0],
      sessionTime: '09:00',
      duration: Math.round(totalDuration / 60) || 45,
    }
  });
  
  // Auto-save functionality
  const autoSaveKey = `workout_builder_autosave_flexibility_${teamId}_${scheduledDate.toISOString()}`;
  const { getSavedData, clearSavedData, hasAutoSave } = useAutoSave({
    key: autoSaveKey,
    data: {
      programName,
      programDescription,
      difficulty,
      phases,
      bulkMode,
      assignedPlayerIds,
      assignedTeamIds,
      activeTab
    },
    enabled: true,
    delay: 2000,
    onRestore: (data) => {
      setProgramName(data.programName || '');
      setProgramDescription(data.programDescription || '');
      setDifficulty(data.difficulty || 'intermediate');
      setPhases(data.phases || []);
      setBulkMode(data.bulkMode || false);
      setAssignedPlayerIds(data.assignedPlayerIds || selectedPlayers);
      setAssignedTeamIds(data.assignedTeamIds || (teamId ? [teamId] : []));
      setActiveTab(data.activeTab || 'build');
      toast.success(t('physicalTrainer:flexibility.autoSaveRestored'));
    }
  });
  
  // Save workflow integration
  const saveWorkflow = useSaveWorkflow({
    workoutType: WorkoutType.FLEXIBILITY,
    workoutData: {
      name: programName,
      description: programDescription,
      flexibilityProgram: currentFlexibilityProgram,
      date: scheduledDate.toISOString(),
      location,
      duration: Math.round(totalDuration / 60)
    },
    playerAssignments: {
      players: assignedPlayerIds,
      teams: assignedTeamIds
    },
    onSaveSuccess: (result) => {
      clearSavedData();
      toast.success(t('physicalTrainer:flexibility.createSuccess'));
    },
    onSaveError: (error) => {
      console.error('Failed to save flexibility workout:', error);
      toast.error(t('physicalTrainer:flexibility.saveError'));
    }
  });
  
  // Event handlers
  const handleAddPhase = useCallback((type: FlexibilityPhase) => {
    const phaseConfig = getPhaseConfig(type);
    const newPhase: FlexibilityProgramPhase = {
      id: `phase-${Date.now()}`,
      type,
      name: phaseConfig.name,
      description: phaseConfig.description,
      duration: 0,
      exercises: [],
      color: phaseConfig.color
    };
    setPhases([...phases, newPhase]);
    setSelectedPhase(newPhase);
  }, [phases]);
  
  const handlePhaseSelect = useCallback((phase: FlexibilityProgramPhase) => {
    setSelectedPhase(phase);
    setEditingItem(null);
  }, []);
  
  const handleAddStretchToPhase = useCallback((phaseId: string, stretch?: StretchExercise) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    // Create stretch item from provided exercise or default
    const newItem: FlexibilitySequenceItem = {
      id: `item-${Date.now()}`,
      exerciseId: stretch?.id || 'default-stretch',
      exercise: stretch,
      holdTime: stretch?.defaultHoldTime || HOLD_TIME_PROGRESSIONS[difficulty][0],
      repetitions: 1,
      side: stretch?.isUnilateral ? 'left' : 'both',
      restAfter: 10,
      customBreathingPattern: stretch?.breathingPattern
    };
    
    const updatedPhase = {
      ...phase,
      exercises: [...phase.exercises, newItem]
    };
    
    const updatedPhases = phases.map(p => p.id === phaseId ? updatedPhase : p);
    setPhases(updatedPhases);
    setSelectedPhase(updatedPhase);
    if (!stretch) {
      setEditingItem(newItem); // Only open editor if it's a default stretch
    }
  }, [phases, difficulty]);
  
  const handleUpdateItem = useCallback((item: FlexibilitySequenceItem) => {
    if (!selectedPhase) return;
    
    const updatedExercises = selectedPhase.exercises.map(ex => 
      ex.id === item.id ? item : ex
    );
    
    const updatedPhase = {
      ...selectedPhase,
      exercises: updatedExercises,
      duration: calculateTotalPhaseDuration({
        ...selectedPhase,
        exercises: updatedExercises
      })
    };
    
    const updatedPhases = phases.map(p => p.id === selectedPhase.id ? updatedPhase : p);
    setPhases(updatedPhases);
    setSelectedPhase(updatedPhase);
    setEditingItem(null);
  }, [selectedPhase, phases]);
  
  const handleDeleteItem = useCallback((itemId: string) => {
    if (!selectedPhase) return;
    
    const updatedExercises = selectedPhase.exercises.filter(ex => ex.id !== itemId);
    const updatedPhase = {
      ...selectedPhase,
      exercises: updatedExercises,
      duration: calculateTotalPhaseDuration({
        ...selectedPhase,
        exercises: updatedExercises
      })
    };
    
    const updatedPhases = phases.map(p => p.id === selectedPhase.id ? updatedPhase : p);
    setPhases(updatedPhases);
    setSelectedPhase(updatedPhase);
  }, [selectedPhase, phases]);

  const handleAddStretchFromLibrary = useCallback((stretch: StretchExercise) => {
    if (!selectedPhase) {
      toast.error('Please select a phase first');
      return;
    }
    handleAddStretchToPhase(selectedPhase.id, stretch);
    toast.success(`Added "${stretch.name}" to ${selectedPhase.name}`);
  }, [selectedPhase, handleAddStretchToPhase]);
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && selectedPhase) {
      const oldIndex = selectedPhase.exercises.findIndex(item => item.id === active.id);
      const newIndex = selectedPhase.exercises.findIndex(item => item.id === over.id);
      
      const reorderedExercises = arrayMove(selectedPhase.exercises, oldIndex, newIndex);
      const updatedPhase = {
        ...selectedPhase,
        exercises: reorderedExercises
      };
      
      const updatedPhases = phases.map(p => p.id === selectedPhase.id ? updatedPhase : p);
      setPhases(updatedPhases);
      setSelectedPhase(updatedPhase);
    }
    
    setActiveId(null);
  };
  
  const handleBulkSave = async (config: BulkSessionConfig<FlexibilityProgram>) => {
    try {
      const results = [];
      
      for (const session of config.sessions) {
        const sessionProgram: FlexibilityProgram = {
          ...currentFlexibilityProgram,
          id: `${currentFlexibilityProgram.id}-${session.id}`,
          name: session.name || `${programName} - Session ${results.length + 1}`,
          description: session.notes ? `${programDescription}\n\n${session.notes}` : programDescription
        };
        
        // Mock API call
        const result = {
          id: sessionProgram.id,
          program: sessionProgram,
          playerIds: session.playerIds,
          teamIds: session.teamIds,
          date: config.sessionDate,
          time: session.startTime || config.sessionTime,
          location: config.facilityId,
          duration: config.duration
        };
        
        results.push(result);
      }
      
      clearSavedData();
      toast.success(`Successfully created ${results.length} flexibility sessions!`);
      return results;
    } catch (error) {
      console.error('Failed to create bulk sessions:', error);
      toast.error('Failed to create bulk sessions. Please try again.');
      throw error;
    }
  };
  
  const handleSave = async () => {
    try {
      if (bulkMode && bulkSession.canProceed) {
        await bulkSession.complete();
        return;
      }
      
      if (onSave) {
        onSave(currentFlexibilityProgram);
        return;
      }
      
      const result = await saveWorkflow.save();
      if (result?.success) {
        clearSavedData();
        toast.success(t('physicalTrainer:flexibility.saveSuccess'));
        onCancel();
      }
    } catch (error) {
      console.error('Failed to save flexibility workout:', error);
      toast.error(t('physicalTrainer:flexibility.saveError'));
    }
  };
  
  const handleBulkToggle = useCallback((enabled: boolean) => {
    setBulkMode(enabled);
    setShowBulkPanel(enabled);
    if (!enabled) {
      bulkSession.reset();
    }
  }, [bulkSession]);
  
  // Validation
  const isValid = useMemo(() => {
    const basicValid = programName && phases.length > 0 && totalStretches > 0;
    return bulkMode ? basicValid && bulkSession.canProceed : basicValid;
  }, [programName, phases.length, totalStretches, bulkMode, bulkSession.canProceed]);
  
  const isSaving = saveWorkflow.isSaving || bulkSession.isLoading;
  const showProgress = saveWorkflow.isSaving || saveWorkflow.isValidating || bulkSession.isLoading;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <WorkoutBuilderHeader
        title={t('physicalTrainer:flexibility.builder.title')}
        workoutType="flexibility"
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={isSaving}
        supportsBulkMode={true}
        bulkMode={bulkMode}
        onBulkToggle={handleBulkToggle}
        bulkConfig={bulkSession.config}
        showAutoSave={hasAutoSave}
      />
      
      {/* Metrics Bar */}
      <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 border-b">
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Clock className="h-4 w-4 mr-2" />
          {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
        </Badge>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Activity className="h-4 w-4 mr-2" />
          {totalStretches} stretches
        </Badge>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Heart className="h-4 w-4 mr-2" />
          {bodyPartsTargeted.length} body parts
        </Badge>
        {bulkMode && bulkSession.config && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Copy className="h-4 w-4 mr-2" />
            {bulkSession.config.numberOfSessions} sessions
          </Badge>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="build" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Program Builder
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Stretch Library
            </TabsTrigger>
            <TabsTrigger value="sequence" className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              Flow Sequence
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="build" className="h-full p-4">
            <div className="grid grid-cols-5 gap-6 h-full">
              {/* Left Column - Program Details & Phases */}
              <div className="col-span-2 space-y-4 h-full overflow-y-auto pr-2">
                {/* Bulk Configuration Panel */}
                {bulkMode && (
                  <BulkConfigurationPanel
                    workoutType="strength"
                    baseWorkout={currentFlexibilityProgram}
                    onComplete={bulkSession.complete}
                    onCancel={() => setBulkMode(false)}
                    isOpen={showBulkPanel}
                    onToggle={setShowBulkPanel}
                    enablePlayerDistribution={true}
                    showAdvancedOptions={true}
                    maxSessions={8}
                    minSessions={2}
                  />
                )}
                
                {/* Program Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Program Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="program-name">Program Name</Label>
                      <Input
                        id="program-name"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                        placeholder="e.g., Morning Mobility Flow"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="program-description">Description</Label>
                      <Textarea
                        id="program-description"
                        value={programDescription}
                        onChange={(e) => setProgramDescription(e.target.value)}
                        placeholder="Describe the goals and focus of this flexibility program"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select value={difficulty} onValueChange={(v: DifficultyLevel) => setDifficulty(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">
                            <div className="flex flex-col">
                              <span>Beginner</span>
                              <span className="text-xs text-muted-foreground">
                                Basic stretches, shorter holds (15-30s)
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="intermediate">
                            <div className="flex flex-col">
                              <span>Intermediate</span>
                              <span className="text-xs text-muted-foreground">
                                Moderate stretches, standard holds (30-60s)
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="advanced">
                            <div className="flex flex-col">
                              <span>Advanced</span>
                              <span className="text-xs text-muted-foreground">
                                Deep stretches, longer holds (60-120s)
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Player Assignment */}
                {!bulkMode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Player Assignment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PlayerTeamAssignment
                        selectedPlayers={assignedPlayerIds}
                        selectedTeams={assignedTeamIds}
                        onPlayersChange={setAssignedPlayerIds}
                        onTeamsChange={setAssignedTeamIds}
                        showTeams={true}
                        showMedical={true}
                        showFilters={true}
                        showSummary={true}
                        title="Assign to Players & Teams"
                        description="Select players or teams for this flexibility session."
                        inline={true}
                        maxHeight={300}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {/* Phase Management */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Program Phases</CardTitle>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAddPhase('warmup')}
                        >
                          Warm-up
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAddPhase('static_stretches')}
                        >
                          Static
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAddPhase('dynamic_stretches')}
                        >
                          Dynamic
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAddPhase('cooldown')}
                        >
                          Cool-down
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      {phases.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No phases added yet</p>
                          <p className="text-xs">Add phases to structure your flexibility program</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {phases.map((phase, index) => (
                            <div
                              key={phase.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedPhase?.id === phase.id 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-muted hover:border-muted-foreground/50'
                              }`}
                              onClick={() => handlePhaseSelect(phase)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: phase.color }}
                                  />
                                  <span className="font-medium">{phase.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {phase.exercises.length} stretches
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.round(calculateTotalPhaseDuration(phase) / 60)}min
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column - Phase Editor */}
              <div className="col-span-3 h-full">
                {selectedPhase ? (
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: selectedPhase.color }}
                          />
                          {selectedPhase.name}
                        </CardTitle>
                        <Button
                          size="sm"
                          onClick={() => handleAddStretchToPhase(selectedPhase.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Stretch
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px]">
                        {selectedPhase.exercises.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No stretches in this phase</p>
                            <Button 
                              variant="outline" 
                              className="mt-3"
                              onClick={() => handleAddStretchToPhase(selectedPhase.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Stretch
                            </Button>
                          </div>
                        ) : (
                          <DndContext
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext
                              items={selectedPhase.exercises.map(item => item.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-3">
                                {selectedPhase.exercises.map((item, index) => (
                                  <FlexibilityItemCard
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onEdit={setEditingItem}
                                    onDelete={handleDeleteItem}
                                    isEditing={editingItem?.id === item.id}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                            <DragOverlay>
                              {activeId && (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <span className="font-medium">Moving stretch...</span>
                                </div>
                              )}
                            </DragOverlay>
                          </DndContext>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center">
                      <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Select a Phase</h3>
                      <p className="text-muted-foreground mb-4">
                        Choose a phase from the left to add and organize stretches
                      </p>
                      {phases.length === 0 && (
                        <Button onClick={() => handleAddPhase('warmup')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Phase
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="library" className="h-full p-4">
            <FlexibilityStretchLibrary
              onAddStretch={handleAddStretchFromLibrary}
              selectedPhase={selectedPhase}
            />
          </TabsContent>
          
          <TabsContent value="sequence" className="h-full p-4">
            <FlexibilitySequenceView
              program={currentFlexibilityProgram}
              onReorderPhases={(newPhases) => setPhases(newPhases)}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Save Progress */}
      {showProgress && (
        <div className="mx-4 mb-4">
          <SaveWorkflowProgress
            workflow={saveWorkflow}
            onRetry={saveWorkflow.retry}
            onCancel={() => saveWorkflow.reset()}
          />
        </div>
      )}
      
      {/* Validation Warnings */}
      {!isValid && (
        <Alert className="mx-4 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {!programName && 'Program name is required. '}
            {phases.length === 0 && 'Add at least one phase. '}
            {totalStretches === 0 && 'Add stretches to your phases. '}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Success Modal */}
      {saveWorkflow.successModalProps && (
        <WorkoutSuccessModal
          isOpen={saveWorkflow.isSuccessModalOpen}
          onClose={saveWorkflow.closeSuccessModal}
          workoutType={WorkoutType.FLEXIBILITY}
          workoutName={programName}
          playerCount={assignedPlayerIds.length}
          teamCount={assignedTeamIds.length}
          duration={Math.round(totalDuration / 60)}
          exerciseCount={totalStretches}
          onSchedule={saveWorkflow.successModalProps.onSchedule}
          onCreateAnother={() => {
            saveWorkflow.reset();
            // Reset form
            setProgramName('');
            setProgramDescription('');
            setPhases([]);
            setDifficulty('intermediate');
            setAssignedPlayerIds([]);
            setAssignedTeamIds([]);
            setBulkMode(false);
            bulkSession.reset();
          }}
          onCreateTemplate={() => toast.success('Template creation coming soon!')}
          onViewWorkout={saveWorkflow.successModalProps.onViewDetails}
          onNotifyPlayers={() => toast.success('Player notification sent!')}
        />
      )}
    </div>
  );
}


// Export with error boundary
export default function FlexibilityWorkoutBuilder(props: FlexibilityWorkoutBuilderProps) {
  return (
    <WorkoutBuilderErrorBoundary 
      workoutType="flexibility"
      sessionId={props.initialProgram?.id}
      onReset={() => {
        console.log('Flexibility workout builder reset after error');
      }}
    >
      <FlexibilityWorkoutBuilderInternal {...props} />
    </WorkoutBuilderErrorBoundary>
  );
}