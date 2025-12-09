'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Save, X, AlertCircle, Plus, Trash2, Clock, Heart, 
  Activity, Copy, ChevronRight, GripVertical, Zap
} from '@/components/icons';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import type { WorkoutCreationContext } from '../types';

// Equipment configuration
const EQUIPMENT_OPTIONS = [
  { value: 'rowing', label: 'Rowing Machine', icon: '🚣' },
  { value: 'bike_erg', label: 'Bike Erg', icon: '🚴' },
  { value: 'treadmill', label: 'Treadmill', icon: '🏃‍♂️' },
  { value: 'skierg', label: 'SkiErg', icon: '⛷️' },
  { value: 'airbike', label: 'Air Bike', icon: '💨' },
  { value: 'wattbike', label: 'WattBike', icon: '🚴‍♂️' },
  { value: 'running', label: 'Running (Track)', icon: '🏃' },
  { value: 'rope_jump', label: 'Rope Jump', icon: '🪢' }
];

// Interval types
const INTERVAL_TYPES = [
  { value: 'warmup', label: 'Warm Up', color: 'bg-green-500' },
  { value: 'work', label: 'Work', color: 'bg-red-500' },
  { value: 'rest', label: 'Rest', color: 'bg-blue-500' },
  { value: 'active_recovery', label: 'Active Recovery', color: 'bg-yellow-500' },
  { value: 'cooldown', label: 'Cool Down', color: 'bg-purple-500' }
];

// Workout templates
const WORKOUT_TEMPLATES = [
  {
    id: 'hiit',
    name: 'HIIT 4x4',
    description: '4 minutes high intensity, 3 minutes recovery',
    intervals: [
      { type: 'warmup', duration: 600, intensity: 50 },
      { type: 'work', duration: 240, intensity: 90 },
      { type: 'active_recovery', duration: 180, intensity: 60 },
      { type: 'work', duration: 240, intensity: 90 },
      { type: 'active_recovery', duration: 180, intensity: 60 },
      { type: 'work', duration: 240, intensity: 90 },
      { type: 'active_recovery', duration: 180, intensity: 60 },
      { type: 'work', duration: 240, intensity: 90 },
      { type: 'cooldown', duration: 300, intensity: 40 }
    ]
  },
  {
    id: 'steady',
    name: 'Steady State',
    description: '30 minutes at moderate intensity',
    intervals: [
      { type: 'warmup', duration: 300, intensity: 50 },
      { type: 'work', duration: 1800, intensity: 70 },
      { type: 'cooldown', duration: 300, intensity: 40 }
    ]
  },
  {
    id: 'pyramid',
    name: 'Pyramid',
    description: 'Progressive intensity intervals',
    intervals: [
      { type: 'warmup', duration: 300, intensity: 50 },
      { type: 'work', duration: 60, intensity: 70 },
      { type: 'rest', duration: 60, intensity: 40 },
      { type: 'work', duration: 120, intensity: 80 },
      { type: 'rest', duration: 90, intensity: 40 },
      { type: 'work', duration: 180, intensity: 85 },
      { type: 'rest', duration: 120, intensity: 40 },
      { type: 'work', duration: 120, intensity: 80 },
      { type: 'rest', duration: 90, intensity: 40 },
      { type: 'work', duration: 60, intensity: 70 },
      { type: 'cooldown', duration: 300, intensity: 40 }
    ]
  }
];

interface Interval {
  id: string;
  type: string;
  name?: string;
  duration: number; // seconds
  intensity?: number; // percentage
  targetHeartRate?: number;
  targetWatts?: number;
  targetPace?: string;
  notes?: string;
}

interface ConditioningWorkoutBuilderProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  workoutContext?: WorkoutCreationContext | null;
  initialData?: any;
}

export default function ConditioningBuilderEnhanced({
  onSave,
  onCancel,
  workoutContext,
  initialData
}: ConditioningWorkoutBuilderProps) {
  // Basic info state
  const [workoutName, setWorkoutName] = useState(
    initialData?.name ||
    (workoutContext ? 
      `${workoutContext.teamName} - Conditioning - ${format(new Date(workoutContext.sessionDate), 'MMM d')}` : 
      ''
    )
  );
  const [description, setDescription] = useState(
    initialData?.description ||
    (workoutContext ? 
      `Conditioning workout for ${workoutContext.playerName}` : 
      ''
    )
  );
  const [equipment, setEquipment] = useState(initialData?.equipment || 'rowing');
  
  // Intervals state
  const [intervals, setIntervals] = useState<Interval[]>(
    initialData?.intervals || [{
      id: '1',
      type: 'warmup',
      name: 'Warm Up',
      duration: 300,
      intensity: 50
    }]
  );
  
  // UI state
  const [activeTab, setActiveTab] = useState('details');
  const [editingInterval, setEditingInterval] = useState<string | null>(null);

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return intervals.reduce((sum, interval) => sum + interval.duration, 0);
  }, [intervals]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add new interval
  const addInterval = () => {
    const newInterval: Interval = {
      id: Date.now().toString(),
      type: 'work',
      name: 'Work Interval',
      duration: 120,
      intensity: 85
    };
    setIntervals([...intervals, newInterval]);
    setEditingInterval(newInterval.id);
  };

  // Update interval
  const updateInterval = (id: string, updates: Partial<Interval>) => {
    setIntervals(intervals.map(interval => 
      interval.id === id ? { ...interval, ...updates } : interval
    ));
  };

  // Delete interval
  const deleteInterval = (id: string) => {
    setIntervals(intervals.filter(interval => interval.id !== id));
  };

  // Duplicate interval
  const duplicateInterval = (id: string) => {
    const interval = intervals.find(i => i.id === id);
    if (interval) {
      const newInterval = { 
        ...interval, 
        id: Date.now().toString(),
        name: `${interval.name} (Copy)`
      };
      const index = intervals.findIndex(i => i.id === id);
      const newIntervals = [...intervals];
      newIntervals.splice(index + 1, 0, newInterval);
      setIntervals(newIntervals);
    }
  };

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = WORKOUT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      const newIntervals = template.intervals.map((interval, index) => ({
        id: Date.now().toString() + index,
        type: interval.type,
        name: INTERVAL_TYPES.find(t => t.value === interval.type)?.label || 'Interval',
        duration: interval.duration,
        intensity: interval.intensity
      }));
      setIntervals(newIntervals);
      toast.success(`Applied ${template.name} template`);
    }
  };

  // Save workout
  const handleSave = () => {
    if (!workoutName.trim()) {
      toast.error('Please enter a workout name');
      return;
    }

    if (intervals.length === 0) {
      toast.error('Please add at least one interval');
      return;
    }

    const workoutData = {
      id: initialData?.id || Date.now().toString(),
      name: workoutName,
      description,
      type: 'conditioning',
      equipment,
      duration: Math.ceil(totalDuration / 60), // Convert to minutes
      intervals: intervals.map(interval => ({
        ...interval,
        equipment,
        targetMetrics: {
          ...(interval.intensity && { 
            heartRate: { 
              type: 'percentage', 
              value: interval.intensity, 
              reference: 'max' 
            }
          }),
          ...(interval.targetWatts && { 
            watts: { 
              type: 'absolute', 
              value: interval.targetWatts 
            }
          }),
          ...(interval.targetPace && { 
            pace: { 
              type: 'absolute', 
              value: interval.targetPace 
            }
          })
        }
      })),
      sessionContext: workoutContext,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(workoutData);
    toast.success('Conditioning workout saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Session Context Info */}
      {workoutContext && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Creating workout for <strong>{workoutContext.playerName}</strong> 
            {' '}from <strong>{workoutContext.teamName}</strong>
            {' '}• {format(new Date(workoutContext.sessionDate), 'EEEE, MMMM d')}
            {' '}at {workoutContext.sessionTime}
            {' '}• {workoutContext.sessionLocation}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="intervals">Intervals</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workout Information</CardTitle>
              <CardDescription>Basic details about the conditioning workout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workoutName">Workout Name</Label>
                <Input
                  id="workoutName"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="Enter workout name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the workout objectives and notes"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="equipment">Equipment</Label>
                <Select value={equipment} onValueChange={setEquipment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Duration:</span>
                  <span className="font-medium">{formatDuration(totalDuration)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Number of Intervals:</span>
                  <span className="font-medium">{intervals.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intervals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workout Intervals</CardTitle>
                  <CardDescription>Design your interval training program</CardDescription>
                </div>
                <Button onClick={addInterval} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Interval
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {intervals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No intervals added yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={addInterval}
                  >
                    Add Your First Interval
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {intervals.map((interval, index) => (
                    <div
                      key={interval.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      {editingInterval === interval.id ? (
                        // Edit mode
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Type</Label>
                              <Select 
                                value={interval.type} 
                                onValueChange={(value) => updateInterval(interval.id, { type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {INTERVAL_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <span className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${type.color}`} />
                                        <span>{type.label}</span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Duration (seconds)</Label>
                              <Input
                                type="number"
                                value={interval.duration}
                                onChange={(e) => updateInterval(interval.id, { 
                                  duration: parseInt(e.target.value) || 0 
                                })}
                                min={10}
                                max={3600}
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Name (optional)</Label>
                            <Input
                              value={interval.name || ''}
                              onChange={(e) => updateInterval(interval.id, { name: e.target.value })}
                              placeholder="Custom interval name"
                            />
                          </div>

                          {(interval.type === 'work' || interval.type === 'active_recovery') && (
                            <div>
                              <Label>Intensity (% of max HR)</Label>
                              <div className="flex items-center gap-3">
                                <Slider
                                  value={[interval.intensity || 70]}
                                  onValueChange={([value]) => updateInterval(interval.id, { intensity: value })}
                                  min={40}
                                  max={100}
                                  step={5}
                                  className="flex-1"
                                />
                                <span className="w-12 text-right font-medium">
                                  {interval.intensity || 70}%
                                </span>
                              </div>
                            </div>
                          )}

                          <div>
                            <Label>Notes (optional)</Label>
                            <Textarea
                              value={interval.notes || ''}
                              onChange={(e) => updateInterval(interval.id, { notes: e.target.value })}
                              placeholder="Additional instructions or notes"
                              rows={2}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingInterval(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setEditingInterval(null)}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Display mode
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${
                                  INTERVAL_TYPES.find(t => t.value === interval.type)?.color
                                }`} />
                                <span className="font-medium">
                                  {interval.name || INTERVAL_TYPES.find(t => t.value === interval.type)?.label}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {formatDuration(interval.duration)}
                                </Badge>
                                {interval.intensity && (
                                  <Badge variant="outline" className="text-xs">
                                    <Heart className="h-3 w-3 mr-1" />
                                    {interval.intensity}%
                                  </Badge>
                                )}
                              </div>
                              {interval.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{interval.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingInterval(interval.id)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => duplicateInterval(interval.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteInterval(interval.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Timeline */}
          {intervals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Workout Timeline</CardTitle>
                <CardDescription>Visual representation of your interval program</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
                  {intervals.map((interval, index) => {
                    const startPercent = (intervals.slice(0, index).reduce((sum, i) => sum + i.duration, 0) / totalDuration) * 100;
                    const widthPercent = (interval.duration / totalDuration) * 100;
                    const intervalType = INTERVAL_TYPES.find(t => t.value === interval.type);
                    
                    return (
                      <div
                        key={interval.id}
                        className={`absolute top-0 h-full ${intervalType?.color} opacity-80`}
                        style={{
                          left: `${startPercent}%`,
                          width: `${widthPercent}%`
                        }}
                        title={`${interval.name || intervalType?.label} - ${formatDuration(interval.duration)}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0:00</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workout Templates</CardTitle>
              <CardDescription>Quick-start with pre-built interval programs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {WORKOUT_TEMPLATES.map(template => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => applyTemplate(template.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.intervals.length} intervals
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(template.intervals.reduce((sum, i) => sum + i.duration, 0))}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Total workout time: <span className="font-medium">{formatDuration(totalDuration)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!workoutName.trim() || intervals.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save Workout
          </Button>
        </div>
      </div>
    </div>
  );
}