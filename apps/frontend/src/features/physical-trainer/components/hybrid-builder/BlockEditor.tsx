'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Save,
  Plus,
  Trash2,
  Clock,
  Dumbbell,
  Heart,
  Timer,
  Activity,
  Settings,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { 
  HybridWorkoutBlock,
  ExerciseBlock,
  IntervalBlock,
  TransitionBlock
} from '../../types/hybrid.types';
import type { Exercise } from '../../types';
import type { IntervalSet, WorkoutEquipmentType } from '../../types/conditioning.types';
import ExerciseLibrary from '../session-builder/ExerciseLibrary';
import IntervalForm from '../conditioning/IntervalForm';

interface BlockEditorProps {
  block: HybridWorkoutBlock;
  onUpdate: (updates: Partial<HybridWorkoutBlock>) => void;
  playerRestrictions?: string[];
}

export default function BlockEditor({
  block,
  onUpdate,
  playerRestrictions = []
}: BlockEditorProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [activeTab, setActiveTab] = useState('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingInterval, setEditingInterval] = useState<IntervalSet | null>(null);

  // Calculate duration in minutes and seconds
  const durationMinutes = Math.floor(editedBlock.duration / 60);
  const durationSeconds = editedBlock.duration % 60;

  const handleNameChange = (name: string) => {
    setEditedBlock({ ...editedBlock, name });
  };

  const handleDurationChange = (minutes: number, seconds: number) => {
    const totalSeconds = (minutes * 60) + seconds;
    setEditedBlock({ ...editedBlock, duration: totalSeconds });
  };

  const handleSave = () => {
    onSave(editedBlock);
  };

  // Exercise Block specific handlers
  const handleAddExercise = (exercise: Exercise) => {
    if (editedBlock.type === 'exercise') {
      const exerciseBlock = block as ExerciseBlock;
      const updatedExercises = [...(exerciseBlock.exercises || []), exercise];
      setEditedBlock({
        ...exerciseBlock,
        exercises: updatedExercises,
        equipment: Array.from(new Set([
          ...(exerciseBlock.equipment || []),
          ...(exercise.equipment || [])
        ]))
      });
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    if (editedBlock.type === 'exercise') {
      const exerciseBlock = block as ExerciseBlock;
      const updatedExercises = exerciseBlock.exercises.filter(ex => ex.id !== exerciseId);
      // Recalculate equipment from remaining exercises
      const equipment = Array.from(new Set(
        updatedExercises.flatMap(ex => ex.equipment || [])
      ));
      setEditedBlock({
        ...exerciseBlock,
        exercises: updatedExercises,
        equipment
      });
    }
  };

  const handleReorderExercises = (event: DragEndEvent) => {
    if (editedBlock.type !== 'exercise' || !event.over) return;
    
    const { active, over } = event;
    if (active.id === over.id) return;

    const exerciseBlock = block as ExerciseBlock;
    const exercises = [...exerciseBlock.exercises];
    const oldIndex = exercises.findIndex(ex => ex.id === active.id);
    const newIndex = exercises.findIndex(ex => ex.id === over.id);

    // Reorder exercises
    const [removed] = exercises.splice(oldIndex, 1);
    exercises.splice(newIndex, 0, removed);

    setEditedBlock({
      ...exerciseBlock,
      exercises
    });
  };

  // Interval Block specific handlers
  const handleAddInterval = () => {
    if (editedBlock.type === 'interval') {
      const newInterval: IntervalSet = {
        id: `interval-${Date.now()}`,
        orderIndex: (editedBlock as IntervalBlock).intervals?.length || 0,
        name: `Interval ${((editedBlock as IntervalBlock).intervals?.length || 0) + 1}`,
        type: 'work',
        duration: 30,
        targetMetrics: {},
        color: '#ef4444',
        equipment: (editedBlock as IntervalBlock).equipment || WorkoutEquipmentType.BIKE_ERG
      };
      setEditingInterval(newInterval);
    }
  };

  const handleSaveInterval = (interval: IntervalSet) => {
    if (editedBlock.type === 'interval') {
      const intervalBlock = block as IntervalBlock;
      const intervals = [...(intervalBlock.intervals || [])];
      
      // Check if we're editing an existing interval
      const existingIndex = intervals.findIndex(i => i.id === interval.id);
      if (existingIndex !== -1) {
        intervals[existingIndex] = interval;
      } else {
        intervals.push(interval);
      }

      // Recalculate total work and rest times
      const totalWorkTime = intervals
        .filter(i => i.type === 'work')
        .reduce((sum, i) => sum + i.duration, 0);
      const totalRestTime = intervals
        .filter(i => i.type === 'rest' || i.type === 'active_recovery')
        .reduce((sum, i) => sum + i.duration, 0);

      setEditedBlock({
        ...intervalBlock,
        intervals,
        totalWorkTime,
        totalRestTime,
        duration: totalWorkTime + totalRestTime
      });
      setEditingInterval(null);
    }
  };

  const handleRemoveInterval = (intervalId: string) => {
    if (editedBlock.type === 'interval') {
      const intervalBlock = block as IntervalBlock;
      const intervals = intervalBlock.intervals.filter(i => i.id !== intervalId);
      
      // Recalculate totals
      const totalWorkTime = intervals
        .filter(i => i.type === 'work')
        .reduce((sum, i) => sum + i.duration, 0);
      const totalRestTime = intervals
        .filter(i => i.type === 'rest' || i.type === 'active_recovery')
        .reduce((sum, i) => sum + i.duration, 0);

      setEditedBlock({
        ...intervalBlock,
        intervals,
        totalWorkTime,
        totalRestTime,
        duration: totalWorkTime + totalRestTime
      });
    }
  };

  // Transition Block specific handlers
  const handleTransitionTypeChange = (transitionType: 'rest' | 'active_recovery' | 'equipment_change') => {
    if (editedBlock.type === 'transition') {
      setEditedBlock({
        ...editedBlock as TransitionBlock,
        transitionType
      });
    }
  };

  const handleActivitiesChange = (activities: string) => {
    if (editedBlock.type === 'transition') {
      const activitiesArray = activities.split(',').map(a => a.trim()).filter(Boolean);
      setEditedBlock({
        ...editedBlock as TransitionBlock,
        activities: activitiesArray
      });
    }
  };

  const handleNextBlockPrepChange = (prep: string) => {
    if (editedBlock.type === 'transition') {
      setEditedBlock({
        ...editedBlock as TransitionBlock,
        nextBlockPrep: prep
      });
    }
  };

  // Handle drag and drop for exercise library
  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'library-exercise') {
      setDraggedExercise(event.active.data.current.exercise);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over && event.active.data.current?.type === 'library-exercise') {
      handleAddExercise(event.active.data.current.exercise);
    }
    setDraggedExercise(null);
  };

  const renderExerciseEditor = () => {
    const exerciseBlock = block as ExerciseBlock;
    
    return (
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Left: Exercise Library */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-4">Exercise Library</h4>
          <ExerciseLibrary
            exercises={availableExercises}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            restrictedExercises={playerRestrictions}
          />
        </div>

        {/* Right: Selected Exercises */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Selected Exercises ({exerciseBlock.exercises?.length || 0})</h4>
            <Badge variant="outline">
              {durationMinutes}:{durationSeconds.toString().padStart(2, '0')} total
            </Badge>
          </div>
          
          <ScrollArea className="h-[400px]">
            {exerciseBlock.exercises && exerciseBlock.exercises.length > 0 ? (
              <DndContext onDragEnd={handleReorderExercises}>
                <SortableContext
                  items={exerciseBlock.exercises.map(ex => ex.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {exerciseBlock.exercises.map((exercise) => (
                      <SortableExerciseItem
                        key={exercise.id}
                        exercise={exercise}
                        onRemove={() => handleRemoveExercise(exercise.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Dumbbell className="h-12 w-12 mb-2" />
                <p className="text-center">
                  Drag exercises from the library or click to add them
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Target Muscle Groups */}
          <div className="mt-4 space-y-2">
            <Label>Target Muscle Groups</Label>
            <div className="flex flex-wrap gap-2">
              {exerciseBlock.targetMuscleGroups?.map((group, idx) => (
                <Badge key={idx} variant="secondary">
                  {group}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIntervalEditor = () => {
    const intervalBlock = block as IntervalBlock;
    
    if (editingInterval) {
      return (
        <div className="h-full">
          <IntervalForm
            interval={editingInterval}
            equipment={intervalBlock.equipment as WorkoutEquipmentType}
            onSave={handleSaveInterval}
            onCancel={() => setEditingInterval(null)}
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* Equipment Selection */}
        <div>
          <Label>Equipment</Label>
          <Select
            value={intervalBlock.equipment}
            onValueChange={(value) => setEditedBlock({
              ...intervalBlock,
              equipment: value
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WorkoutEquipmentType.BIKE_ERG}>Bike Erg</SelectItem>
              <SelectItem value={WorkoutEquipmentType.ROWING}>Rowing Machine</SelectItem>
              <SelectItem value={WorkoutEquipmentType.SKIERG}>SkiErg</SelectItem>
              <SelectItem value={WorkoutEquipmentType.TREADMILL}>Treadmill</SelectItem>
              <SelectItem value={WorkoutEquipmentType.AIRBIKE}>AirBike</SelectItem>
              <SelectItem value={WorkoutEquipmentType.WATTBIKE}>WattBike</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Intervals List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Intervals ({intervalBlock.intervals?.length || 0})</h4>
            <Button size="sm" onClick={handleAddInterval}>
              <Plus className="h-4 w-4 mr-1" />
              Add Interval
            </Button>
          </div>
          
          <ScrollArea className="h-[300px] border rounded-lg p-2">
            {intervalBlock.intervals && intervalBlock.intervals.length > 0 ? (
              <div className="space-y-2">
                {intervalBlock.intervals.map((interval) => (
                  <Card key={interval.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: interval.color }}
                        />
                        <div>
                          <h5 className="font-medium">{interval.name}</h5>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{interval.duration}s</span>
                            <Badge variant="outline" className="text-xs">
                              {interval.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingInterval(interval)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInterval(interval.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Heart className="h-12 w-12 mb-2" />
                <p>No intervals added yet</p>
              </div>
            )}
          </ScrollArea>
          
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Card className="p-3">
              <div className="text-sm text-muted-foreground">Total Work</div>
              <div className="font-medium">{Math.floor(intervalBlock.totalWorkTime / 60)}:{(intervalBlock.totalWorkTime % 60).toString().padStart(2, '0')}</div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-muted-foreground">Total Rest</div>
              <div className="font-medium">{Math.floor(intervalBlock.totalRestTime / 60)}:{(intervalBlock.totalRestTime % 60).toString().padStart(2, '0')}</div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-muted-foreground">Work:Rest</div>
              <div className="font-medium">
                {intervalBlock.totalRestTime > 0 
                  ? `1:${(intervalBlock.totalRestTime / intervalBlock.totalWorkTime).toFixed(1)}`
                  : '1:0'
                }
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderTransitionEditor = () => {
    const transitionBlock = block as TransitionBlock;
    
    return (
      <div className="space-y-4">
        {/* Transition Type */}
        <div>
          <Label>Transition Type</Label>
          <Select
            value={transitionBlock.transitionType}
            onValueChange={handleTransitionTypeChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rest">Rest</SelectItem>
              <SelectItem value="active_recovery">Active Recovery</SelectItem>
              <SelectItem value="equipment_change">Equipment Change</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activities */}
        {transitionBlock.transitionType === 'active_recovery' && (
          <div>
            <Label>Activities</Label>
            <Input
              value={transitionBlock.activities?.join(', ') || ''}
              onChange={(e) => handleActivitiesChange(e.target.value)}
              placeholder="e.g., Light jogging, Foam rolling, Stretching"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple activities with commas
            </p>
          </div>
        )}

        {/* Next Block Preparation */}
        <div>
          <Label>Next Block Preparation</Label>
          <Textarea
            value={transitionBlock.nextBlockPrep || ''}
            onChange={(e) => handleNextBlockPrepChange(e.target.value)}
            placeholder="Notes about preparing for the next block..."
            rows={3}
          />
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">Transition Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Use Rest for passive recovery between intense blocks</li>
                <li>Active Recovery helps maintain warm muscles</li>
                <li>Equipment Change allows time for setup transitions</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Edit {block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block</CardTitle>
      </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Block Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Block Name */}
              <div>
                <Label>Block Name</Label>
                <Input
                  value={editedBlock.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter block name..."
                />
              </div>

              {/* Duration */}
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0, durationSeconds)}
                      min={0}
                      max={60}
                    />
                    <span className="text-xs text-muted-foreground">minutes</span>
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={durationSeconds}
                      onChange={(e) => handleDurationChange(durationMinutes, parseInt(e.target.value) || 0)}
                      min={0}
                      max={59}
                    />
                    <span className="text-xs text-muted-foreground">seconds</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {block.type === 'exercise' && renderExerciseEditor()}
                {block.type === 'interval' && renderIntervalEditor()}
                {block.type === 'transition' && renderTransitionEditor()}
              </div>
            </TabsContent>
          </Tabs>
          
        </CardContent>
      </Card>
  );
}