'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Layers, Save, X, Plus, Trash2, Clock, Dumbbell, Heart, 
  Loader2, Eye, EyeOff, Smartphone, MoveUp, MoveDown,
  Activity, Zap, Settings, Calendar, Users, MapPin,
  FileText, FolderOpen
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { HybridProgram, HybridWorkoutBlock } from '../types/hybrid.types';
import type { IntervalSet } from '../types/conditioning.types';
import type { WorkoutCreationContext, Exercise } from '../types';
import { EQUIPMENT_CONFIGS, WorkoutEquipmentType } from '../types/conditioning.types';
import { WorkoutBuilderLayout, WorkoutTabContent } from './shared/WorkoutBuilderLayout';
import { ExerciseLibrarySidebar } from './shared/ExerciseLibrarySidebar';
import IntervalPreview from './IntervalPreview';
import IntervalBlockEditor from './IntervalBlockEditor';
import SimpleExerciseSelector from './SimpleExerciseSelector';
import HybridWorkoutPlayerView from './HybridWorkoutPlayerView';
import { UnifiedScheduler, UnifiedSchedule } from './shared/UnifiedScheduler';
import { useGetExercisesQuery } from '@/store/api/trainingApi';
import { WorkoutBuilderTab, ExerciseLibraryItem, ExerciseLibraryFilters } from '../types/workout-builder.types';

// Simple ID generator
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface HybridWorkoutBuilderEnhancedProps {
  onSave: (program: HybridProgram, playerIds: string[], teamIds: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: HybridProgram;
  workoutId?: string;
  workoutContext?: WorkoutCreationContext | null;
}

export default function HybridWorkoutBuilderEnhanced({
  onSave,
  onCancel,
  isLoading = false,
  initialData,
  workoutId,
  workoutContext
}: HybridWorkoutBuilderEnhancedProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { data: exercisesData } = useGetExercisesQuery();
  
  const [programName, setProgramName] = useState(
    initialData?.name || 
    (workoutContext ? `${workoutContext.sessionType} - ${workoutContext.playerName}` : '')
  );
  const [programDescription, setProgramDescription] = useState(
    initialData?.description || 
    (workoutContext ? `Hybrid workout for ${workoutContext.sessionType} session` : '')
  );
  const [blocks, setBlocks] = useState<HybridWorkoutBlock[]>(initialData?.blocks || []);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPlayerView, setShowPlayerView] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkoutBuilderTab>('details');
  const [showExerciseSidebar, setShowExerciseSidebar] = useState(false);
  const [exerciseFilters, setExerciseFilters] = useState<ExerciseLibraryFilters>({});
  
  // Session Context State - properly formatted date
  const sessionDate = workoutContext?.sessionDate ? 
    (typeof workoutContext.sessionDate === 'string' ? new Date(workoutContext.sessionDate) : workoutContext.sessionDate) : 
    new Date();
  
  // Ensure sessionDate is valid
  const validSessionDate = sessionDate instanceof Date && !isNaN(sessionDate.getTime()) ? sessionDate : new Date();
  
  const [schedule, setSchedule] = useState<UnifiedSchedule>({
    startDate: validSessionDate,
    startTime: workoutContext?.sessionTime || '09:00',
    location: workoutContext?.sessionLocation || 'Training Center',
    participants: {
      playerIds: workoutContext ? [workoutContext.playerId] : [],
      teamIds: []
    }
  });

  const addBlock = (type: 'exercise' | 'interval' | 'transition') => {
    const newBlock: HybridWorkoutBlock = {
      id: generateId(),
      type,
      name: type === 'exercise' ? 'Exercise Block' : type === 'interval' ? 'Interval Block' : 'Transition',
      duration: type === 'transition' ? 60 : 300,
      orderIndex: blocks.length,
      ...(type === 'exercise' && {
        exercises: [],
        targetMuscleGroups: [],
        equipment: [],
        restBetweenExercises: 60
      }),
      ...(type === 'interval' && {
        intervals: [],
        equipment: WorkoutEquipmentType.ROWING,
        totalWorkTime: 0,
        totalRestTime: 0,
      }),
      ...(type === 'transition' && {
        transitionType: 'rest',
        activities: ['Water break', 'Equipment setup'],
      }),
    } as HybridWorkoutBlock;

    setBlocks([...blocks, newBlock]);
    setEditingBlockId(newBlock.id);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id).map((b, index) => ({ ...b, orderIndex: index })));
    if (editingBlockId === id) setEditingBlockId(null);
  };

  const updateBlock = (id: string, updates: Partial<HybridWorkoutBlock>) => {
    setBlocks(blocks.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return;
    
    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    
    setBlocks(newBlocks.map((b, i) => ({ ...b, orderIndex: i })));
  };

  // Exercise Block Helpers
  const addExerciseToBlock = (blockId: string, exercise: any) => {
    const block = blocks.find(b => b.id === blockId);
    if (block?.type === 'exercise') {
      updateBlock(blockId, {
        exercises: [...(block.exercises || []), {
          id: generateId(),
          exerciseId: exercise.id,
          name: exercise.name,
          sets: 3,
          reps: 10,
          weight: 0,
          restAfter: 60,
          equipment: exercise.equipment || []
        }]
      });
    }
  };

  const removeExerciseFromBlock = (blockId: string, exerciseId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block?.type === 'exercise') {
      updateBlock(blockId, {
        exercises: block.exercises?.filter(e => e.id !== exerciseId)
      });
    }
  };

  // Interval Block Helpers
  const addIntervalToBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block?.type === 'interval') {
      const newInterval: IntervalSet = {
        id: generateId(),
        type: 'work',
        name: 'Work Interval',
        duration: 60,
        equipment: block.equipment || WorkoutEquipmentType.ROWING,
        targetMetrics: {},
        color: '#3b82f6'
      };
      updateBlock(blockId, {
        intervals: [...(block.intervals || []), newInterval]
      });
    }
  };

  const updateIntervalInBlock = (blockId: string, intervalId: string, updates: Partial<IntervalSet>) => {
    const block = blocks.find(b => b.id === blockId);
    if (block?.type === 'interval') {
      updateBlock(blockId, {
        intervals: block.intervals?.map(i => 
          i.id === intervalId ? { ...i, ...updates } : i
        )
      });
    }
  };

  const removeIntervalFromBlock = (blockId: string, intervalId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block?.type === 'interval') {
      updateBlock(blockId, {
        intervals: block.intervals?.filter(i => i.id !== intervalId)
      });
    }
  };

  // Calculate total duration
  const calculateBlockDuration = (block: HybridWorkoutBlock): number => {
    if (block.type === 'exercise') {
      // Sum of all exercises with rest periods
      return block.exercises?.reduce((sum, ex) => 
        sum + (ex.sets * 30) + ex.restAfter, 0
      ) || block.duration;
    } else if (block.type === 'interval') {
      // Sum of all intervals
      return block.intervals?.reduce((sum, interval) => 
        sum + interval.duration, 0
      ) || block.duration;
    }
    return block.duration;
  };

  const getTotalDuration = () => blocks.reduce((sum, b) => sum + calculateBlockDuration(b), 0);
  const totalDuration = getTotalDuration();
  const isValid = programName && blocks.length > 0 && 
    (schedule.participants.playerIds.length > 0 || schedule.participants.teamIds.length > 0);

  const handleSave = () => {
    if (isLoading) return;
    
    // Update durations before saving
    const updatedBlocks = blocks.map(block => ({
      ...block,
      duration: calculateBlockDuration(block)
    }));
    
    const program: HybridProgram = {
      id: generateId(),
      name: programName,
      description: programDescription,
      blocks: updatedBlocks,
      totalDuration,
      totalExercises: blocks.reduce((sum, b) => 
        sum + (b.type === 'exercise' ? b.exercises?.length || 0 : 0), 0
      ),
      totalIntervals: blocks.reduce((sum, b) => 
        sum + (b.type === 'interval' ? b.intervals?.length || 0 : 0), 0
      ),
      estimatedCalories: Math.round(totalDuration / 60 * 10),
      equipment: [...new Set(blocks.flatMap(b => {
        if (b.type === 'exercise') return b.exercises?.flatMap(e => e.equipment) || [];
        if (b.type === 'interval') return [b.equipment].filter(Boolean);
        return [];
      }))],
      // Add metadata if context is provided
      metadata: workoutContext ? {
        sessionId: workoutContext.sessionId,
        sessionType: workoutContext.sessionType,
        sessionDate: workoutContext.sessionDate instanceof Date ? 
          workoutContext.sessionDate.toISOString() : 
          workoutContext.sessionDate,
        sessionTime: workoutContext.sessionTime,
        sessionLocation: workoutContext.sessionLocation
      } : undefined
    };
    onSave(program, schedule.participants.playerIds, schedule.participants.teamIds);
  };

  const editingBlock = blocks.find(b => b.id === editingBlockId);
  
  // Transform exercises to library format
  const libraryExercises = useMemo<ExerciseLibraryItem[]>(() => {
    if (!exercisesData?.exercises) return [];
    
    return exercisesData.exercises.map((exercise: Exercise) => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.type === 'strength' ? 'strength' : 
                exercise.type === 'cardio' ? 'conditioning' : 
                exercise.type === 'flexibility' ? 'mobility' : 'strength',
      phase: (exercise as any).phase || 'main' as ExerciseLibraryItem['phase'],
      description: exercise.description,
      videoUrl: exercise.videoUrl,
      equipment: exercise.equipment || [],
      muscleGroups: exercise.muscleGroups || [],
      difficulty: exercise.difficulty || 'intermediate',
      duration: exercise.duration,
      defaultSets: exercise.sets,
      defaultReps: exercise.reps,
      tags: exercise.tags || [],
      isFavorite: false,
      usageCount: 0
    }));
  }, [exercisesData]);
  
  // Handle exercise selection from library
  const handleExerciseSelect = (exercise: ExerciseLibraryItem) => {
    if (editingBlockId) {
      addExerciseToBlock(editingBlockId, {
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        equipment: exercise.equipment,
        videoUrl: exercise.videoUrl
      });
    }
    setShowExerciseSidebar(false);
  };
  
  // Calculate validation errors
  const validationErrors = useMemo(() => {
    const errors: any[] = [];
    if (!programName.trim()) {
      errors.push({ field: 'details.name', message: 'Workout name is required' });
    }
    if (blocks.length === 0) {
      errors.push({ field: 'exercises.blocks', message: 'At least one block is required' });
    }
    if (schedule.participants.playerIds.length === 0 && schedule.participants.teamIds.length === 0) {
      errors.push({ field: 'assignment.participants', message: 'Select at least one player or team' });
    }
    return errors;
  }, [programName, blocks, schedule.participants]);

  return (
    <div className="flex h-full">
      {/* Exercise Library Sidebar */}
      {showExerciseSidebar && (
        <ExerciseLibrarySidebar
          exercises={libraryExercises}
          filters={exerciseFilters}
          onFiltersChange={setExerciseFilters}
          onExerciseSelect={handleExerciseSelect}
          workoutType="hybrid"
          isLoading={!exercisesData}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1">
        <WorkoutBuilderLayout
          workoutType="hybrid"
          currentTab={activeTab}
          onTabChange={setActiveTab}
          onSave={handleSave}
          onCancel={onCancel}
          isDirty={programName !== '' || blocks.length > 0}
          isSaving={isLoading}
          validationErrors={validationErrors}
          title="Hybrid Workout Builder"
        >

          {/* Session Context Banner */}
          {workoutContext && (
            <Card className="border-blue-200 bg-blue-50/50 m-6 mb-0">
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
                        <span>{format(workoutContext.sessionDate, 'MMM d')} at {workoutContext.sessionTime}</span>
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

          {/* Details Tab */}
          <WorkoutTabContent value="details">
            <div className="p-6 space-y-6">
          <div>
            <Label htmlFor="name">Workout Name</Label>
            <Input
              id="name"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., Monday Strength & Cardio"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={programDescription}
              onChange={(e) => setProgramDescription(e.target.value)}
              placeholder="Brief description of the workout"
              rows={3}
              disabled={isLoading}
            />
          </div>

              <div>
                <Label htmlFor="duration">Estimated Duration</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {Math.floor(totalDuration / 60)} min
                    </span>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Calculated from blocks
                  </p>
                </div>
              </div>
            </div>
          </WorkoutTabContent>

          {/* Assignment Tab */}
          <WorkoutTabContent value="assignment">
            <div className="p-6">
              <UnifiedScheduler
        schedule={schedule}
        onScheduleUpdate={setSchedule}
        duration={getTotalDuration()}
        title="Schedule & Assign Workout"
        description="Set when this hybrid workout will take place and who will participate. Medical restrictions will be considered during execution."
        showLocation={true}
        showRecurrence={true}
        showReminders={true}
        showConflictCheck={true}
        defaultLocation={workoutContext?.sessionLocation || 'Training Center'}
                collapsible={false}
                defaultExpanded={true}
                variant="inline"
              />
            </div>
          </WorkoutTabContent>

          {/* Exercises Tab - Block Builder */}
          <WorkoutTabContent value="exercises">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Block List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Workout Structure</CardTitle>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => addBlock('exercise')} disabled={isLoading}>
                <Dumbbell className="h-4 w-4 mr-2" />
                Exercise Block
              </Button>
              <Button size="sm" variant="outline" onClick={() => addBlock('interval')} disabled={isLoading}>
                <Heart className="h-4 w-4 mr-2" />
                Interval Block
              </Button>
              <Button size="sm" variant="outline" onClick={() => addBlock('transition')} disabled={isLoading}>
                <Clock className="h-4 w-4 mr-2" />
                Transition
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {blocks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No blocks added yet. Start by adding a block above.
              </p>
            ) : (
              <div className="space-y-2">
                {blocks.map((block, index) => {
                  const duration = calculateBlockDuration(block);
                  const isEditing = editingBlockId === block.id;
                  
                  return (
                    <div 
                      key={block.id} 
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-all",
                        isEditing ? "border-purple-500 bg-purple-50" : "hover:bg-gray-50"
                      )}
                      onClick={() => setEditingBlockId(block.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {block.type === 'exercise' && <Dumbbell className="h-4 w-4 text-blue-500" />}
                          {block.type === 'interval' && <Heart className="h-4 w-4 text-red-500" />}
                          {block.type === 'transition' && <Clock className="h-4 w-4 text-gray-500" />}
                          <div className="flex-1">
                            <h4 className="font-medium">{block.name}</h4>
                            <div className="text-xs text-muted-foreground mt-1">
                              {block.type === 'exercise' && `${block.exercises?.length || 0} exercises`}
                              {block.type === 'interval' && `${block.intervals?.length || 0} intervals`}
                              {block.type === 'transition' && block.transitionType}
                              {' • '}
                              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(block.id, 'up');
                            }}
                            disabled={index === 0 || isLoading}
                          >
                            <MoveUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(block.id, 'down');
                            }}
                            disabled={index === blocks.length - 1 || isLoading}
                          >
                            <MoveDown className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBlock(block.id);
                            }}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Block Editor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {editingBlock ? (
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Edit {editingBlock.name}
                </div>
              ) : (
                'Select a block to edit'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!editingBlock ? (
              <p className="text-center text-muted-foreground py-8">
                Click on a block to edit its contents
              </p>
            ) : (
              <div className="space-y-4">
                {/* Block Name */}
                <div>
                  <Label>Block Name</Label>
                  <Input
                    value={editingBlock.name}
                    onChange={(e) => updateBlock(editingBlock.id, { name: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                {/* Exercise Block Editor */}
                {editingBlock.type === 'exercise' && (
                  <>
                    <div>
                      <Label>Exercises</Label>
                      <div className="space-y-2 mt-2">
                        {editingBlock.exercises?.map((exercise, idx) => (
                          <div key={exercise.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">{exercise.name}</h5>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeExerciseFromBlock(editingBlock.id, exercise.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Sets</Label>
                                <Input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => {
                                    const updated = editingBlock.exercises?.map(ex =>
                                      ex.id === exercise.id ? { ...ex, sets: parseInt(e.target.value) || 1 } : ex
                                    );
                                    updateBlock(editingBlock.id, { exercises: updated });
                                  }}
                                  min={1}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Reps</Label>
                                <Input
                                  type="number"
                                  value={exercise.reps}
                                  onChange={(e) => {
                                    const updated = editingBlock.exercises?.map(ex =>
                                      ex.id === exercise.id ? { ...ex, reps: parseInt(e.target.value) || 1 } : ex
                                    );
                                    updateBlock(editingBlock.id, { exercises: updated });
                                  }}
                                  min={1}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Rest (s)</Label>
                                <Input
                                  type="number"
                                  value={exercise.restAfter}
                                  onChange={(e) => {
                                    const updated = editingBlock.exercises?.map(ex =>
                                      ex.id === exercise.id ? { ...ex, restAfter: parseInt(e.target.value) || 0 } : ex
                                    );
                                    updateBlock(editingBlock.id, { exercises: updated });
                                  }}
                                  min={0}
                                  className="h-8"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Add Exercise Button */}
                    <div className="border-t pt-4">
                      <Button
                        onClick={() => {
                          setShowExerciseSidebar(true);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Exercise from Library
                      </Button>
                    </div>
                  </>
                )}

                {/* Interval Block Editor */}
                {editingBlock.type === 'interval' && (
                  <IntervalBlockEditor
                    intervals={editingBlock.intervals || []}
                    defaultEquipment={editingBlock.equipment || WorkoutEquipmentType.ROWING}
                    onAddInterval={() => addIntervalToBlock(editingBlock.id)}
                    onUpdateInterval={(intervalId, updates) => 
                      updateIntervalInBlock(editingBlock.id, intervalId, updates)
                    }
                    onRemoveInterval={(intervalId) => 
                      removeIntervalFromBlock(editingBlock.id, intervalId)
                    }
                    onUpdateTargetMetric={(intervalId, metric, value) => {
                      const interval = editingBlock.intervals?.find(i => i.id === intervalId);
                      if (interval) {
                        updateIntervalInBlock(editingBlock.id, intervalId, {
                          targetMetrics: {
                            ...interval.targetMetrics,
                            [metric]: value
                          }
                        });
                      }
                    }}
                  />
                )}

                {/* Transition Block Editor */}
                {editingBlock.type === 'transition' && (
                  <>
                    <div>
                      <Label>Transition Type</Label>
                      <Select
                        value={editingBlock.transitionType}
                        onValueChange={(value) => updateBlock(editingBlock.id, { transitionType: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rest">Rest</SelectItem>
                          <SelectItem value="equipment_change">Equipment Change</SelectItem>
                          <SelectItem value="water_break">Water Break</SelectItem>
                          <SelectItem value="instruction">Instruction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={editingBlock.duration}
                        onChange={(e) => updateBlock(editingBlock.id, { duration: parseInt(e.target.value) || 60 })}
                        min={10}
                        max={600}
                      />
                    </div>

                    <div>
                      <Label>Activities</Label>
                      <Textarea
                        value={editingBlock.activities?.join('\n') || ''}
                        onChange={(e) => updateBlock(editingBlock.id, { 
                          activities: e.target.value.split('\n').filter(a => a.trim()) 
                        })}
                        placeholder="One activity per line"
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
                </Card>
              </div>
            </div>
          </WorkoutTabContent>

          {/* Preview Tab */}
          <WorkoutTabContent value="preview">
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Workout Preview</h3>
                  <p className="text-muted-foreground text-sm">
                    This is how the workout will appear to players
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">{programName || 'Untitled Hybrid Workout'}</h2>
                      {programDescription && (
                        <p className="text-muted-foreground mt-2">{programDescription}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
                      </Badge>
                      <Badge variant="secondary" className="text-sm">
                        {blocks.length} Blocks
                      </Badge>
                      <Badge variant="secondary" className="text-sm">
                        {blocks.filter(b => b.type === 'exercise').length} Exercise Blocks
                      </Badge>
                      <Badge variant="secondary" className="text-sm">
                        {blocks.filter(b => b.type === 'interval').length} Interval Blocks
                      </Badge>
                    </div>

                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">Workout Structure</h3>
                      <div className="space-y-2">
                        {blocks.map((block, index) => (
                          <div key={block.id} className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {block.type === 'exercise' && <Dumbbell className="h-4 w-4 text-blue-500" />}
                                  {block.type === 'interval' && <Heart className="h-4 w-4 text-red-500" />}
                                  {block.type === 'transition' && <Clock className="h-4 w-4 text-gray-500" />}
                                  <span className="font-medium">{block.name}</span>
                                </div>
                                <span className="text-sm font-medium">
                                  {Math.floor(calculateBlockDuration(block) / 60)}:{(calculateBlockDuration(block) % 60).toString().padStart(2, '0')}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {block.type === 'exercise' && `${block.exercises?.length || 0} exercises`}
                                {block.type === 'interval' && `${block.intervals?.length || 0} intervals`}
                                {block.type === 'transition' && block.transitionType}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPlayerView(true)}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    View Player Preview
                  </Button>
                </div>
              </div>
            </div>
          </WorkoutTabContent>

          {/* Templates Tab */}
          <WorkoutTabContent value="templates">
            <div className="p-6">
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Hybrid Workout Templates</h3>
                <p className="text-muted-foreground mb-4">
                  Browse pre-built hybrid workout templates combining strength and cardio
                </p>
                <Button variant="outline">
                  Browse Templates
                </Button>
              </div>
            </div>
          </WorkoutTabContent>
        </WorkoutBuilderLayout>
      </div>
      
      {/* Player View Preview Modal */}
      {showPlayerView && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Player View Preview</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPlayerView(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              <HybridWorkoutPlayerView
                program={{
                  id: `preview-${Date.now()}`,
                  name: programName || 'Hybrid Workout',
                  description: programDescription,
                  blocks: blocks.map(block => ({
                    ...block,
                    duration: calculateBlockDuration(block)
                  })),
                  totalDuration,
                  totalExercises: blocks.reduce((sum, b) => 
                    sum + (b.type === 'exercise' ? b.exercises?.length || 0 : 0), 0
                  ),
                  totalIntervals: blocks.reduce((sum, b) => 
                    sum + (b.type === 'interval' ? b.intervals?.length || 0 : 0), 0
                  ),
                  estimatedCalories: Math.round(totalDuration / 60 * 10),
                  equipment: [...new Set(blocks.flatMap(b => {
                    if (b.type === 'exercise') return b.exercises?.flatMap(e => e.equipment) || [];
                    if (b.type === 'interval') return [b.equipment].filter(Boolean);
                    return [];
                  }))]
                }}
                scheduledDate={new Date()}
                assignedBy="Physical Trainer"
                onStart={() => alert('This is a preview - workout would start here')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}