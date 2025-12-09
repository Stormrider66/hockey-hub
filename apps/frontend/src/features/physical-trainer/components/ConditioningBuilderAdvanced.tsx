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
import { Switch } from '@/components/ui/switch';
import { 
  Save, X, AlertCircle, Plus, Trash2, Clock, Heart, 
  Activity, Copy, ChevronRight, GripVertical, Zap,
  Gauge, Flame, Target, Timer, Repeat
} from '@/components/icons';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import type { WorkoutCreationContext } from '../types';

// Equipment configuration with metrics
const EQUIPMENT_OPTIONS = [
  { 
    value: 'rowing', 
    label: 'Rowing Machine', 
    icon: '🚣',
    supportedMetrics: ['time', 'distance', 'calories', 'watts', 'heartRate'],
    defaultUnit: { distance: 'meters', pace: '/500m' }
  },
  { 
    value: 'bike_erg', 
    label: 'Bike Erg', 
    icon: '🚴',
    supportedMetrics: ['time', 'distance', 'calories', 'watts', 'heartRate'],
    defaultUnit: { distance: 'meters', pace: 'km/h' }
  },
  { 
    value: 'treadmill', 
    label: 'Treadmill', 
    icon: '🏃‍♂️',
    supportedMetrics: ['time', 'distance', 'calories', 'speed', 'heartRate'],
    defaultUnit: { distance: 'meters', speed: 'km/h' }
  },
  { 
    value: 'skierg', 
    label: 'SkiErg', 
    icon: '⛷️',
    supportedMetrics: ['time', 'distance', 'calories', 'watts', 'heartRate'],
    defaultUnit: { distance: 'meters', pace: '/500m' }
  },
  { 
    value: 'airbike', 
    label: 'Air Bike', 
    icon: '💨',
    supportedMetrics: ['time', 'calories', 'watts', 'heartRate'],
    defaultUnit: {}
  },
  { 
    value: 'wattbike', 
    label: 'WattBike', 
    icon: '🚴‍♂️',
    supportedMetrics: ['time', 'distance', 'calories', 'watts', 'heartRate'],
    defaultUnit: { distance: 'kilometers', speed: 'km/h' }
  },
  { 
    value: 'running', 
    label: 'Running (Track)', 
    icon: '🏃',
    supportedMetrics: ['time', 'distance', 'calories', 'heartRate'],
    defaultUnit: { distance: 'meters', pace: 'min/km' }
  }
];

// Target types
const TARGET_TYPES = [
  { value: 'time', label: 'Time', icon: Clock, unit: 'seconds' },
  { value: 'distance', label: 'Distance', icon: Target, unit: 'meters' },
  { value: 'calories', label: 'Calories', icon: Flame, unit: 'cal' },
  { value: 'watts', label: 'Power', icon: Zap, unit: 'watts' },
  { value: 'heartRate', label: 'Heart Rate', icon: Heart, unit: 'bpm' }
];

// Interval types
const INTERVAL_TYPES = [
  { value: 'warmup', label: 'Warm Up', color: 'bg-green-500' },
  { value: 'work', label: 'Work', color: 'bg-red-500' },
  { value: 'rest', label: 'Rest', color: 'bg-blue-500' },
  { value: 'active_recovery', label: 'Active Recovery', color: 'bg-yellow-500' },
  { value: 'cooldown', label: 'Cool Down', color: 'bg-purple-500' }
];

// Advanced workout templates
const WORKOUT_TEMPLATES = [
  {
    id: 'mixed_hiit',
    name: 'Mixed Equipment HIIT',
    description: 'High intensity intervals across different equipment',
    intervals: [
      { 
        type: 'warmup', 
        equipment: 'rowing',
        primaryTarget: { type: 'time', value: 300 },
        secondaryTargets: [{ type: 'heartRate', value: 60, isPercentage: true }]
      },
      { 
        type: 'work',
        name: 'Row Sprints',
        equipment: 'rowing',
        primaryTarget: { type: 'distance', value: 500 },
        secondaryTargets: [{ type: 'watts', value: 90, isPercentage: true }],
        sets: 4,
        restBetweenSets: 90
      },
      { 
        type: 'work',
        name: 'Bike Intervals',
        equipment: 'bike_erg',
        primaryTarget: { type: 'calories', value: 20 },
        secondaryTargets: [{ type: 'heartRate', value: 85, isPercentage: true }],
        sets: 4,
        restBetweenSets: 60
      },
      { 
        type: 'work',
        name: 'Treadmill Finisher',
        equipment: 'treadmill',
        primaryTarget: { type: 'distance', value: 400 },
        secondaryTargets: [{ type: 'heartRate', value: 90, isPercentage: true }],
        sets: 2,
        restBetweenSets: 120
      },
      { 
        type: 'cooldown',
        equipment: 'rowing',
        primaryTarget: { type: 'time', value: 300 },
        secondaryTargets: [{ type: 'heartRate', value: 50, isPercentage: true }]
      }
    ]
  },
  {
    id: 'endurance_ladder',
    name: 'Endurance Ladder',
    description: 'Progressive distance intervals',
    intervals: [
      { 
        type: 'warmup',
        equipment: 'running',
        primaryTarget: { type: 'time', value: 600 }
      },
      { 
        type: 'work',
        name: '400m Repeats',
        equipment: 'running',
        primaryTarget: { type: 'distance', value: 400 },
        sets: 4,
        restBetweenSets: 60
      },
      { 
        type: 'work',
        name: '800m Repeats',
        equipment: 'running',
        primaryTarget: { type: 'distance', value: 800 },
        sets: 3,
        restBetweenSets: 90
      },
      { 
        type: 'work',
        name: '1600m Time Trial',
        equipment: 'running',
        primaryTarget: { type: 'distance', value: 1600 }
      },
      { 
        type: 'cooldown',
        equipment: 'running',
        primaryTarget: { type: 'time', value: 600 }
      }
    ]
  },
  {
    id: 'power_calories',
    name: 'Power & Calories',
    description: 'Watt and calorie-based intervals',
    intervals: [
      { 
        type: 'warmup',
        equipment: 'wattbike',
        primaryTarget: { type: 'time', value: 300 },
        secondaryTargets: [{ type: 'watts', value: 100 }]
      },
      { 
        type: 'work',
        name: 'Power Intervals',
        equipment: 'wattbike',
        primaryTarget: { type: 'time', value: 30 },
        secondaryTargets: [{ type: 'watts', value: 400 }],
        sets: 8,
        restBetweenSets: 30
      },
      { 
        type: 'work',
        name: 'Calorie Burners',
        equipment: 'airbike',
        primaryTarget: { type: 'calories', value: 30 },
        sets: 5,
        restBetweenSets: 60
      },
      { 
        type: 'cooldown',
        equipment: 'wattbike',
        primaryTarget: { type: 'time', value: 300 }
      }
    ]
  }
];

interface IntervalTarget {
  type: 'time' | 'distance' | 'calories' | 'watts' | 'heartRate' | 'speed';
  value: number;
  isPercentage?: boolean;
  percentageOf?: 'max' | 'ftp' | 'threshold';
}

interface Interval {
  id: string;
  type: string;
  name?: string;
  equipment: string;
  primaryTarget: IntervalTarget;
  secondaryTargets?: IntervalTarget[];
  sets?: number;
  restBetweenSets?: number; // seconds
  notes?: string;
}

interface ConditioningBuilderAdvancedProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  workoutContext?: WorkoutCreationContext | null;
  initialData?: any;
}

export default function ConditioningBuilderAdvanced({
  onSave,
  onCancel,
  workoutContext,
  initialData
}: ConditioningBuilderAdvancedProps) {
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
  
  // Intervals state
  const [intervals, setIntervals] = useState<Interval[]>(
    initialData?.intervals || [{
      id: '1',
      type: 'warmup',
      name: 'Warm Up',
      equipment: 'rowing',
      primaryTarget: { type: 'time', value: 300 }
    }]
  );
  
  // UI state
  const [activeTab, setActiveTab] = useState('intervals');
  const [editingInterval, setEditingInterval] = useState<string | null>(null);

  // Calculate total duration (approximate for mixed targets)
  const totalDuration = useMemo(() => {
    return intervals.reduce((sum, interval) => {
      let intervalDuration = 0;
      
      if (interval.primaryTarget.type === 'time') {
        intervalDuration = interval.primaryTarget.value;
      } else {
        // Estimate duration for other target types
        if (interval.primaryTarget.type === 'distance') {
          // Rough estimates based on equipment
          const metersPerSecond = interval.equipment === 'running' ? 4 : 2.5; // ~4m/s running, ~2.5m/s rowing
          intervalDuration = interval.primaryTarget.value / metersPerSecond;
        } else if (interval.primaryTarget.type === 'calories') {
          // Rough estimate: 1 calorie per 4 seconds at moderate intensity
          intervalDuration = interval.primaryTarget.value * 4;
        }
      }
      
      // Account for sets
      if (interval.sets && interval.sets > 1) {
        intervalDuration = (intervalDuration * interval.sets) + 
                          ((interval.restBetweenSets || 0) * (interval.sets - 1));
      }
      
      return sum + intervalDuration;
    }, 0);
  }, [intervals]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format target display
  const formatTarget = (target: IntervalTarget, equipment?: string) => {
    let display = '';
    
    switch (target.type) {
      case 'time':
        display = formatDuration(target.value);
        break;
      case 'distance':
        if (target.value >= 1000) {
          display = `${(target.value / 1000).toFixed(1)}km`;
        } else {
          display = `${target.value}m`;
        }
        break;
      case 'calories':
        display = `${target.value} cal`;
        break;
      case 'watts':
        display = target.isPercentage ? `${target.value}% ${target.percentageOf || 'max'}` : `${target.value}W`;
        break;
      case 'heartRate':
        display = target.isPercentage ? `${target.value}% max HR` : `${target.value} bpm`;
        break;
      case 'speed':
        display = `${target.value} km/h`;
        break;
    }
    
    return display;
  };

  // Add new interval
  const addInterval = () => {
    const newInterval: Interval = {
      id: Date.now().toString(),
      type: 'work',
      name: 'Work Interval',
      equipment: 'rowing',
      primaryTarget: { type: 'time', value: 120 }
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
    if (editingInterval === id) {
      setEditingInterval(null);
    }
  };

  // Duplicate interval
  const duplicateInterval = (id: string) => {
    const interval = intervals.find(i => i.id === id);
    if (interval) {
      const newInterval = { 
        ...interval, 
        id: Date.now().toString(),
        name: interval.name ? `${interval.name} (Copy)` : undefined
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
        ...interval
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
      duration: Math.ceil(totalDuration / 60), // Convert to minutes
      intervals: intervals.map(interval => ({
        ...interval,
        targetMetrics: {
          [interval.primaryTarget.type]: interval.primaryTarget,
          ...(interval.secondaryTargets?.reduce((acc, target) => ({
            ...acc,
            [target.type]: target
          }), {}) || {})
        }
      })),
      sessionContext: workoutContext,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(workoutData);
    toast.success('Advanced conditioning workout saved successfully!');
  };

  // Render interval editor
  const renderIntervalEditor = (interval: Interval) => {
    const equipment = EQUIPMENT_OPTIONS.find(e => e.value === interval.equipment);
    const supportedMetrics = equipment?.supportedMetrics || ['time'];
    
    return (
      <div className="space-y-4">
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
            <Label>Equipment</Label>
            <Select 
              value={interval.equipment} 
              onValueChange={(value) => {
                updateInterval(interval.id, { equipment: value });
                // Reset primary target if not supported
                const newEquipment = EQUIPMENT_OPTIONS.find(e => e.value === value);
                if (newEquipment && !newEquipment.supportedMetrics.includes(interval.primaryTarget.type)) {
                  updateInterval(interval.id, { 
                    primaryTarget: { type: 'time', value: 120 }
                  });
                }
              }}
            >
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
        </div>

        <div>
          <Label>Interval Name (optional)</Label>
          <Input
            value={interval.name || ''}
            onChange={(e) => updateInterval(interval.id, { name: e.target.value })}
            placeholder="E.g., Row Sprints, Bike Intervals"
          />
        </div>

        {/* Primary Target */}
        <div className="space-y-2">
          <Label>Primary Target</Label>
          <div className="flex gap-2">
            <Select 
              value={interval.primaryTarget.type} 
              onValueChange={(value: any) => updateInterval(interval.id, { 
                primaryTarget: { ...interval.primaryTarget, type: value }
              })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_TYPES.filter(t => supportedMetrics.includes(t.value)).map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              value={interval.primaryTarget.value}
              onChange={(e) => updateInterval(interval.id, { 
                primaryTarget: { ...interval.primaryTarget, value: parseInt(e.target.value) || 0 }
              })}
              className="flex-1"
              min={0}
            />
            
            <span className="px-3 py-2 text-sm text-muted-foreground">
              {TARGET_TYPES.find(t => t.value === interval.primaryTarget.type)?.unit || ''}
            </span>
          </div>
          
          {(interval.primaryTarget.type === 'watts' || interval.primaryTarget.type === 'heartRate') && (
            <div className="flex items-center gap-2">
              <Switch
                checked={interval.primaryTarget.isPercentage || false}
                onCheckedChange={(checked) => updateInterval(interval.id, {
                  primaryTarget: { ...interval.primaryTarget, isPercentage: checked }
                })}
              />
              <Label className="text-sm">Use percentage of max</Label>
            </div>
          )}
        </div>

        {/* Sets and Rest (for work intervals) */}
        {interval.type === 'work' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sets</Label>
              <Input
                type="number"
                value={interval.sets || 1}
                onChange={(e) => updateInterval(interval.id, { 
                  sets: parseInt(e.target.value) || 1 
                })}
                min={1}
                max={20}
              />
            </div>
            {(interval.sets || 1) > 1 && (
              <div>
                <Label>Rest Between Sets (seconds)</Label>
                <Input
                  type="number"
                  value={interval.restBetweenSets || 60}
                  onChange={(e) => updateInterval(interval.id, { 
                    restBetweenSets: parseInt(e.target.value) || 0 
                  })}
                  min={0}
                />
              </div>
            )}
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
            Done
          </Button>
        </div>
      </div>
    );
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

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Duration:</span>
                  <span className="font-medium">~{formatDuration(totalDuration)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Number of Intervals:</span>
                  <span className="font-medium">{intervals.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Equipment Used:</span>
                  <span className="font-medium">
                    {[...new Set(intervals.map(i => i.equipment))].length} types
                  </span>
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
                  <CardDescription>Design your mixed-equipment interval program</CardDescription>
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
                  {intervals.map((interval, index) => {
                    const equipment = EQUIPMENT_OPTIONS.find(e => e.value === interval.equipment);
                    
                    return (
                      <div
                        key={interval.id}
                        className="border rounded-lg p-4"
                      >
                        {editingInterval === interval.id ? (
                          renderIntervalEditor(interval)
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <span className="text-2xl">{equipment?.icon}</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${
                                      INTERVAL_TYPES.find(t => t.value === interval.type)?.color
                                    }`} />
                                    <span className="font-medium">
                                      {interval.name || INTERVAL_TYPES.find(t => t.value === interval.type)?.label}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      {equipment?.label}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-1">
                                    {/* Primary target display */}
                                    <Badge variant="default" className="text-xs">
                                      {interval.sets && interval.sets > 1 && `${interval.sets}x `}
                                      {formatTarget(interval.primaryTarget, interval.equipment)}
                                    </Badge>
                                    
                                    {/* Rest between sets */}
                                    {interval.sets && interval.sets > 1 && interval.restBetweenSets && (
                                      <span className="text-xs text-muted-foreground">
                                        w/ {formatDuration(interval.restBetweenSets)} rest
                                      </span>
                                    )}
                                    
                                    {/* Secondary targets */}
                                    {interval.secondaryTargets?.map((target, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {formatTarget(target)}
                                      </Badge>
                                    ))}
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
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workout Summary */}
          {intervals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Workout Summary</CardTitle>
                <CardDescription>Overview of your interval program</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Equipment usage */}
                  <div>
                    <Label className="text-sm">Equipment Rotation</Label>
                    <div className="flex gap-2 mt-1">
                      {intervals.map((interval, i) => {
                        const equipment = EQUIPMENT_OPTIONS.find(e => e.value === interval.equipment);
                        return (
                          <div key={i} className="text-center">
                            <div className="text-2xl">{equipment?.icon}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {i + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Total sets breakdown */}
                  <div>
                    <Label className="text-sm">Total Work Sets</Label>
                    <div className="text-2xl font-semibold">
                      {intervals.reduce((total, interval) => 
                        interval.type === 'work' ? total + (interval.sets || 1) : total, 0
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Templates</CardTitle>
              <CardDescription>Pre-built mixed-equipment interval programs</CardDescription>
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
                          {/* Show equipment used */}
                          <div className="flex gap-1">
                            {[...new Set(template.intervals.map(i => i.equipment))].map(eq => {
                              const equipment = EQUIPMENT_OPTIONS.find(e => e.value === eq);
                              return (
                                <span key={eq} className="text-sm" title={equipment?.label}>
                                  {equipment?.icon}
                                </span>
                              );
                            })}
                          </div>
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
          Estimated time: <span className="font-medium">~{formatDuration(totalDuration)}</span>
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