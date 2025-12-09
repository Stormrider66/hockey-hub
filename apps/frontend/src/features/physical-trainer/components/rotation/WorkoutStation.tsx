'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, Users, Clock, Dumbbell, Activity, Coffee, 
  Plus, Minus, Save, Copy, Trash2, AlertCircle, 
  Timer, Target, Heart
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

import type { 
  WorkoutStation as WorkoutStationType,
  StationWorkout,
  StationWorkoutType,
  StrengthWorkout,
  StationExercise,
  FreeformWorkout,
  RestActivity
} from '../../types/rotation.types';
import { WorkoutEquipmentType, EQUIPMENT_CONFIGS, IntervalProgram } from '../../types/conditioning.types';

interface WorkoutStationProps {
  station: WorkoutStationType;
  onUpdate: (updates: Partial<WorkoutStationType>) => void;
  onClose: () => void;
}

// Exercise Templates for quick creation
const EXERCISE_TEMPLATES: Record<WorkoutEquipmentType, StationExercise[]> = {
  [WorkoutEquipmentType.ROWING]: [
    { id: 'row-1', name: '500m Intervals', sets: 4, reps: 1, duration: 120, restBetweenSets: 90 },
    { id: 'row-2', name: 'Steady State', sets: 1, reps: 1, duration: 900, restBetweenSets: 0 },
    { id: 'row-3', name: 'Sprint Intervals', sets: 8, reps: 1, duration: 30, restBetweenSets: 30 }
  ],
  [WorkoutEquipmentType.BIKE_ERG]: [
    { id: 'bike-1', name: 'Power Intervals', sets: 5, reps: 1, duration: 180, restBetweenSets: 60 },
    { id: 'bike-2', name: 'Tabata', sets: 8, reps: 1, duration: 20, restBetweenSets: 10 },
    { id: 'bike-3', name: 'Endurance Ride', sets: 1, reps: 1, duration: 1200, restBetweenSets: 0 }
  ],
  [WorkoutEquipmentType.SKIERG]: [
    { id: 'ski-1', name: 'Ski Intervals', sets: 6, reps: 1, duration: 90, restBetweenSets: 60 },
    { id: 'ski-2', name: 'Long Pull', sets: 1, reps: 1, duration: 600, restBetweenSets: 0 },
    { id: 'ski-3', name: 'Sprint Sets', sets: 10, reps: 1, duration: 15, restBetweenSets: 45 }
  ],
  [WorkoutEquipmentType.AIRBIKE]: [
    { id: 'air-1', name: 'Assault Intervals', sets: 6, reps: 1, duration: 60, restBetweenSets: 60 },
    { id: 'air-2', name: 'Calorie Challenge', sets: 1, reps: 1, duration: 300, restBetweenSets: 0 },
    { id: 'air-3', name: 'EMOM', sets: 15, reps: 1, duration: 20, restBetweenSets: 40 }
  ],
  [WorkoutEquipmentType.WATTBIKE]: [
    { id: 'watt-1', name: 'FTP Intervals', sets: 4, reps: 1, duration: 300, restBetweenSets: 120 },
    { id: 'watt-2', name: 'Sprint Repeats', sets: 12, reps: 1, duration: 15, restBetweenSets: 45 },
    { id: 'watt-3', name: 'Threshold Hold', sets: 1, reps: 1, duration: 1200, restBetweenSets: 0 }
  ],
  [WorkoutEquipmentType.TREADMILL]: [
    { id: 'tread-1', name: 'Speed Intervals', sets: 8, reps: 1, duration: 90, restBetweenSets: 90 },
    { id: 'tread-2', name: 'Hill Repeats', sets: 6, reps: 1, duration: 120, restBetweenSets: 120 },
    { id: 'tread-3', name: 'Tempo Run', sets: 1, reps: 1, duration: 1200, restBetweenSets: 0 }
  ],
  [WorkoutEquipmentType.ROPE_JUMP]: [
    { id: 'rope-1', name: 'Jump Intervals', sets: 10, reps: 100, duration: 60, restBetweenSets: 60 },
    { id: 'rope-2', name: 'Endurance Jumping', sets: 1, reps: 1000, duration: 600, restBetweenSets: 0 },
    { id: 'rope-3', name: 'Sprint Jumps', sets: 6, reps: 50, duration: 30, restBetweenSets: 30 }
  ],
  [WorkoutEquipmentType.RUNNING]: [
    { id: 'run-1', name: 'Track Intervals', sets: 6, reps: 1, duration: 180, restBetweenSets: 120 },
    { id: 'run-2', name: 'Fartlek', sets: 8, reps: 1, duration: 60, restBetweenSets: 90 },
    { id: 'run-3', name: 'Long Run', sets: 1, reps: 1, duration: 1800, restBetweenSets: 0 }
  ]
};

export default function WorkoutStation({ station, onUpdate, onClose }: WorkoutStationProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  const [activeTab, setActiveTab] = useState<'details' | 'workout' | 'preview'>('details');
  const [workoutData, setWorkoutData] = useState<StationWorkout>(station.workout);

  // Update workout data when it changes
  const handleWorkoutUpdate = useCallback((updates: Partial<StationWorkout>) => {
    const updatedWorkout = { ...workoutData, ...updates };
    setWorkoutData(updatedWorkout);
    onUpdate({ workout: updatedWorkout });
  }, [workoutData, onUpdate]);

  // Handle station details update
  const handleStationUpdate = useCallback((field: string, value: any) => {
    onUpdate({ [field]: value });
  }, [onUpdate]);

  // Add exercise to strength workout
  const addExercise = useCallback(() => {
    if (workoutData.type === 'strength') {
      const strengthData = workoutData.data as StrengthWorkout;
      const newExercise: StationExercise = {
        id: `exercise-${Date.now()}`,
        name: 'New Exercise',
        sets: 3,
        reps: 10,
        restBetweenSets: 60
      };

      const updatedData = {
        ...strengthData,
        exercises: [...strengthData.exercises, newExercise]
      };

      handleWorkoutUpdate({ data: updatedData });
    }
  }, [workoutData, handleWorkoutUpdate]);

  // Remove exercise from strength workout
  const removeExercise = useCallback((exerciseId: string) => {
    if (workoutData.type === 'strength') {
      const strengthData = workoutData.data as StrengthWorkout;
      const updatedData = {
        ...strengthData,
        exercises: strengthData.exercises.filter(ex => ex.id !== exerciseId)
      };

      handleWorkoutUpdate({ data: updatedData });
    }
  }, [workoutData, handleWorkoutUpdate]);

  // Update exercise
  const updateExercise = useCallback((exerciseId: string, updates: Partial<StationExercise>) => {
    if (workoutData.type === 'strength') {
      const strengthData = workoutData.data as StrengthWorkout;
      const updatedData = {
        ...strengthData,
        exercises: strengthData.exercises.map(ex => 
          ex.id === exerciseId ? { ...ex, ...updates } : ex
        )
      };

      handleWorkoutUpdate({ data: updatedData });
    }
  }, [workoutData, handleWorkoutUpdate]);

  // Apply exercise template
  const applyExerciseTemplate = useCallback((exercise: StationExercise) => {
    if (workoutData.type === 'strength') {
      const strengthData = workoutData.data as StrengthWorkout;
      const newExercise = {
        ...exercise,
        id: `exercise-${Date.now()}`
      };

      const updatedData = {
        ...strengthData,
        exercises: [...strengthData.exercises, newExercise]
      };

      handleWorkoutUpdate({ data: updatedData });
      toast.success(`Added "${exercise.name}" to station`);
    }
  }, [workoutData, handleWorkoutUpdate]);

  // Change workout type
  const changeWorkoutType = useCallback((newType: StationWorkoutType) => {
    let newData: any;

    switch (newType) {
      case 'intervals':
        newData = {
          id: `workout-${Date.now()}`,
          name: `${station.name} Intervals`,
          description: `Interval workout for ${station.name.toLowerCase()}`,
          equipment: station.equipment,
          intervals: [],
          totalDuration: station.duration * 60,
          tags: ['conditioning'],
          difficulty: 'intermediate'
        } as IntervalProgram;
        break;

      case 'strength':
        newData = {
          id: `workout-${Date.now()}`,
          name: `${station.name} Strength`,
          exercises: [],
          totalDuration: station.duration * 60
        } as StrengthWorkout;
        break;

      case 'freeform':
        newData = {
          id: `workout-${Date.now()}`,
          name: `${station.name} Freeform`,
          description: 'Custom workout instructions',
          duration: station.duration * 60,
          instructions: []
        } as FreeformWorkout;
        break;

      case 'rest':
        newData = {
          id: `workout-${Date.now()}`,
          name: `${station.name} Recovery`,
          description: 'Active recovery and mobility',
          duration: station.duration * 60,
          type: 'mobility'
        } as RestActivity;
        break;
    }

    handleWorkoutUpdate({ type: newType, data: newData });
  }, [station, handleWorkoutUpdate]);

  const equipmentConfig = EQUIPMENT_CONFIGS[station.equipment];
  const workoutTypeIcons = {
    intervals: Activity,
    strength: Dumbbell,
    freeform: Target,
    rest: Coffee
  };

  const WorkoutIcon = workoutTypeIcons[workoutData.type];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: station.color }}
            />
            <h2 className="text-lg font-semibold">{station.name}</h2>
            <Badge variant="secondary">
              {equipmentConfig.icon} {equipmentConfig.label}
            </Badge>
            <Badge variant="outline">
              <WorkoutIcon className="h-3 w-3 mr-1" />
              {workoutData.type}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="h-full flex flex-col">
          <TabsList className="border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500">
              Station Details
            </TabsTrigger>
            <TabsTrigger value="workout" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500">
              Workout Configuration
            </TabsTrigger>
            <TabsTrigger value="preview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500">
              Preview
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="details" className="mt-0 p-6 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="station-name">Station Name</Label>
                      <Input
                        id="station-name"
                        value={station.name}
                        onChange={(e) => handleStationUpdate('name', e.target.value)}
                        placeholder="Enter station name..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="station-capacity">Player Capacity</Label>
                      <Input
                        id="station-capacity"
                        type="number"
                        min="1"
                        max="12"
                        value={station.capacity}
                        onChange={(e) => handleStationUpdate('capacity', parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="station-equipment">Equipment Type</Label>
                      <Select
                        value={station.equipment}
                        onValueChange={(value: WorkoutEquipmentType) => handleStationUpdate('equipment', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(WorkoutEquipmentType).map((equipment) => (
                            <SelectItem key={equipment} value={equipment}>
                              <div className="flex items-center gap-2">
                                <span>{EQUIPMENT_CONFIGS[equipment].icon}</span>
                                <span>{EQUIPMENT_CONFIGS[equipment].label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="station-duration">Duration (minutes)</Label>
                      <Input
                        id="station-duration"
                        type="number"
                        min="5"
                        max="30"
                        value={station.duration}
                        onChange={(e) => handleStationUpdate('duration', parseInt(e.target.value) || 15)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="station-notes">Notes & Instructions</Label>
                    <Textarea
                      id="station-notes"
                      value={station.notes || ''}
                      onChange={(e) => handleStationUpdate('notes', e.target.value)}
                      placeholder="Add any special instructions or notes for this station..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Color Picker */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Visual Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Station Color</Label>
                    <div className="mt-2 flex gap-2">
                      {['#fee2e2', '#dbeafe', '#d1fae5', '#fef3c7', '#ede9fe', '#fed7aa', '#cffafe', '#ecfccb', '#fce7f3', '#f3f4f6'].map((color) => (
                        <button
                          key={color}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            station.color === color ? "border-gray-400 scale-110" : "border-gray-200 hover:border-gray-300"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => handleStationUpdate('color', color)}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workout" className="mt-0 p-6 space-y-6">
              {/* Workout Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Workout Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['intervals', 'strength', 'freeform', 'rest'] as StationWorkoutType[]).map((type) => {
                      const Icon = workoutTypeIcons[type];
                      return (
                        <button
                          key={type}
                          className={cn(
                            "p-4 rounded-lg border-2 transition-all text-left",
                            workoutData.type === type 
                              ? "border-orange-500 bg-orange-50" 
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => changeWorkoutType(type)}
                        >
                          <Icon className="h-5 w-5 mb-2" />
                          <div className="font-medium capitalize">{type}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {type === 'intervals' && 'Cardio intervals'}
                            {type === 'strength' && 'Resistance training'}
                            {type === 'freeform' && 'Custom workout'}
                            {type === 'rest' && 'Recovery station'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Workout Configuration */}
              {workoutData.type === 'strength' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Strength Exercises</CardTitle>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => {
                            const template = EXERCISE_TEMPLATES[station.equipment].find(ex => ex.id === value);
                            if (template) applyExerciseTemplate(template);
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Add template" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXERCISE_TEMPLATES[station.equipment].map((exercise) => (
                              <SelectItem key={exercise.id} value={exercise.id}>
                                {exercise.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={addExercise}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Exercise
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(workoutData.data as StrengthWorkout).exercises.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No exercises added yet</p>
                        <p className="text-sm">Add exercises using templates or create custom ones</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(workoutData.data as StrengthWorkout).exercises.map((exercise, index) => (
                          <div key={exercise.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Input
                                value={exercise.name}
                                onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                                className="font-medium"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeExercise(exercise.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <Label className="text-xs">Sets</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={exercise.sets}
                                  onChange={(e) => updateExercise(exercise.id, { sets: parseInt(e.target.value) || 1 })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Reps</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={exercise.reps}
                                  onChange={(e) => updateExercise(exercise.id, { reps: parseInt(e.target.value) || 1 })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Weight (kg)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={exercise.weight || ''}
                                  onChange={(e) => updateExercise(exercise.id, { weight: parseFloat(e.target.value) || undefined })}
                                  className="mt-1"
                                  placeholder="Optional"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Rest (sec)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={exercise.restBetweenSets}
                                  onChange={(e) => updateExercise(exercise.id, { restBetweenSets: parseInt(e.target.value) || 0 })}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {workoutData.type === 'freeform' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Freeform Workout</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="freeform-name">Workout Name</Label>
                      <Input
                        id="freeform-name"
                        value={(workoutData.data as FreeformWorkout).name}
                        onChange={(e) => handleWorkoutUpdate({ 
                          data: { ...(workoutData.data as FreeformWorkout), name: e.target.value }
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="freeform-description">Description</Label>
                      <Textarea
                        id="freeform-description"
                        value={(workoutData.data as FreeformWorkout).description}
                        onChange={(e) => handleWorkoutUpdate({ 
                          data: { ...(workoutData.data as FreeformWorkout), description: e.target.value }
                        })}
                        rows={4}
                        className="mt-1"
                        placeholder="Describe the workout structure and goals..."
                      />
                    </div>
                    <div>
                      <Label>Instructions</Label>
                      <div className="mt-2 space-y-2">
                        {(workoutData.data as FreeformWorkout).instructions.map((instruction, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={instruction}
                              onChange={(e) => {
                                const newInstructions = [...(workoutData.data as FreeformWorkout).instructions];
                                newInstructions[index] = e.target.value;
                                handleWorkoutUpdate({ 
                                  data: { ...(workoutData.data as FreeformWorkout), instructions: newInstructions }
                                });
                              }}
                              placeholder={`Step ${index + 1}...`}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newInstructions = (workoutData.data as FreeformWorkout).instructions.filter((_, i) => i !== index);
                                handleWorkoutUpdate({ 
                                  data: { ...(workoutData.data as FreeformWorkout), instructions: newInstructions }
                                });
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newInstructions = [...(workoutData.data as FreeformWorkout).instructions, ''];
                            handleWorkoutUpdate({ 
                              data: { ...(workoutData.data as FreeformWorkout), instructions: newInstructions }
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Instruction
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {workoutData.type === 'rest' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recovery Station</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="rest-name">Activity Name</Label>
                      <Input
                        id="rest-name"
                        value={(workoutData.data as RestActivity).name}
                        onChange={(e) => handleWorkoutUpdate({ 
                          data: { ...(workoutData.data as RestActivity), name: e.target.value }
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rest-type">Recovery Type</Label>
                      <Select
                        value={(workoutData.data as RestActivity).type}
                        onValueChange={(value: any) => handleWorkoutUpdate({ 
                          data: { ...(workoutData.data as RestActivity), type: value }
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active_recovery">Active Recovery</SelectItem>
                          <SelectItem value="passive_rest">Passive Rest</SelectItem>
                          <SelectItem value="hydration">Hydration Break</SelectItem>
                          <SelectItem value="mobility">Mobility & Stretching</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rest-description">Description</Label>
                      <Textarea
                        id="rest-description"
                        value={(workoutData.data as RestActivity).description}
                        onChange={(e) => handleWorkoutUpdate({ 
                          data: { ...(workoutData.data as RestActivity), description: e.target.value }
                        })}
                        rows={4}
                        className="mt-1"
                        placeholder="Describe the recovery activities..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {workoutData.type === 'intervals' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Interval Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Interval configuration coming soon</p>
                      <p className="text-sm">This will integrate with the existing interval builder</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-0 p-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: station.color }}
                      />
                      <CardTitle>{station.name}</CardTitle>
                      <Badge variant="secondary">
                        {equipmentConfig.icon} {equipmentConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{station.capacity} players max</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{station.duration} minutes</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <WorkoutIcon className="h-5 w-5" />
                      <span className="font-medium capitalize">{workoutData.type} Workout</span>
                    </div>

                    {station.notes && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Instructions</p>
                            <p className="text-sm text-blue-700">{station.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {workoutData.type === 'strength' && (
                      <div>
                        <h4 className="font-medium mb-3">Strength Exercises</h4>
                        <div className="space-y-2">
                          {(workoutData.data as StrengthWorkout).exercises.map((exercise, index) => (
                            <div key={exercise.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <span className="font-medium">{exercise.name}</span>
                                <div className="text-sm text-muted-foreground">
                                  {exercise.sets} sets × {exercise.reps} reps
                                  {exercise.weight && ` @ ${exercise.weight}kg`}
                                  {exercise.restBetweenSets > 0 && ` • ${exercise.restBetweenSets}s rest`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {workoutData.type === 'freeform' && (
                      <div>
                        <h4 className="font-medium mb-3">Workout Instructions</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {(workoutData.data as FreeformWorkout).description}
                        </p>
                        {(workoutData.data as FreeformWorkout).instructions.length > 0 && (
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            {(workoutData.data as FreeformWorkout).instructions.map((instruction, index) => (
                              <li key={index}>{instruction}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}

                    {workoutData.type === 'rest' && (
                      <div>
                        <h4 className="font-medium mb-3">Recovery Activity</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Coffee className="h-4 w-4" />
                          <span className="capitalize">{(workoutData.data as RestActivity).type.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(workoutData.data as RestActivity).description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}