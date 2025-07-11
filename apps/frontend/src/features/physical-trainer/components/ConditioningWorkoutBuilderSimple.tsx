'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Heart, Save, X, Plus, Trash2, Clock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IntervalProgram, IntervalSet, WorkoutEquipmentType } from '../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../types/conditioning.types';

interface ConditioningWorkoutBuilderProps {
  onSave: (program: IntervalProgram) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConditioningWorkoutBuilderSimple({
  onSave,
  onCancel,
  isLoading = false
}: ConditioningWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<WorkoutEquipmentType>(WorkoutEquipmentType.ROWING);
  const [intervals, setIntervals] = useState<IntervalSet[]>([]);

  const addInterval = () => {
    const newInterval: IntervalSet = {
      id: `interval-${Date.now()}`,
      type: 'work',
      name: 'Work Interval',
      duration: 60,
      equipment: selectedEquipment,
      targetMetrics: {},
      color: '#3b82f6'
    };
    setIntervals([...intervals, newInterval]);
  };

  const removeInterval = (id: string) => {
    setIntervals(intervals.filter(i => i.id !== id));
  };

  const updateInterval = (id: string, field: keyof IntervalSet, value: any) => {
    setIntervals(intervals.map(i => 
      i.id === id ? { ...i, [field]: value } : i
    ));
  };

  const handleSave = () => {
    if (isLoading) return; // Prevent multiple submissions
    
    const totalDuration = intervals.reduce((sum, i) => sum + i.duration, 0);
    const program: IntervalProgram = {
      id: `program-${Date.now()}`,
      name: programName,
      description: programDescription,
      equipment: selectedEquipment,
      intervals,
      totalDuration,
      estimatedCalories: Math.round(totalDuration / 60 * 10),
      tags: [],
      difficulty: 'intermediate'
    };
    onSave(program);
  };

  const totalDuration = intervals.reduce((sum, i) => sum + i.duration, 0);
  const isValid = programName && intervals.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            Conditioning Workout Builder
          </h2>
          <p className="text-muted-foreground">
            Create interval-based cardio workouts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Clock className="h-4 w-4 mr-2" />
            {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
          </Badge>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Workout
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Workout Name</Label>
            <Input
              id="name"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., HIIT Rowing Session"
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
            <Label>Equipment</Label>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value as WorkoutEquipmentType)}
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
            >
              {Object.entries(EQUIPMENT_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label} {config.icon}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Intervals</CardTitle>
          <Button size="sm" onClick={addInterval} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Interval
          </Button>
        </CardHeader>
        <CardContent>
          {intervals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No intervals added yet. Click "Add Interval" to start building your workout.
            </p>
          ) : (
            <div className="space-y-4">
              {intervals.map((interval, index) => (
                <div key={interval.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Interval {index + 1}</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeInterval(interval.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Type</Label>
                      <select
                        value={interval.type}
                        onChange={(e) => updateInterval(interval.id, 'type', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        disabled={isLoading}
                      >
                        <option value="warmup">Warmup</option>
                        <option value="work">Work</option>
                        <option value="rest">Rest</option>
                        <option value="cooldown">Cooldown</option>
                        <option value="active_recovery">Active Recovery</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label>Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={interval.duration}
                        onChange={(e) => updateInterval(interval.id, 'duration', parseInt(e.target.value))}
                        min={10}
                        max={3600}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={interval.name || ''}
                        onChange={(e) => updateInterval(interval.id, 'name', e.target.value)}
                        placeholder="e.g., Sprint"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}