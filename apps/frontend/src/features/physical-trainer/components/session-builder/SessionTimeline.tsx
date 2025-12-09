'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Clock,
  Repeat,
  Weight,
  Timer,
  ChevronDown,
  ChevronRight,
  X,
  GripVertical,
  Plus,
  Flame,
  Snowflake
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionExercise } from '../SessionBuilder';

interface SessionTimelineProps {
  exercises: SessionExercise[];
  warmup?: {
    duration: number;
    activities: string[];
  };
  cooldown?: {
    duration: number;
    activities: string[];
  };
  onUpdateExercise: (exerciseId: string, updates: Partial<SessionExercise>) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateWarmup?: (warmup: { duration: number; activities: string[] }) => void;
  onUpdateCooldown?: (cooldown: { duration: number; activities: string[] }) => void;
}

interface SortableExerciseProps {
  exercise: SessionExercise;
  onUpdate: (updates: Partial<SessionExercise>) => void;
  onRemove: () => void;
}

function SortableExercise({ exercise, onUpdate, onRemove }: SortableExerciseProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.id,
    data: {
      type: 'timeline-exercise',
      exercise
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getIntensityColor = (intensity?: string) => {
    switch (intensity) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'max':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const estimatedTime = () => {
    if (exercise.duration) {
      return `${exercise.duration} min`;
    } else if (exercise.sets && exercise.restBetweenSets) {
      const setTime = 60; // seconds per set
      const totalTime = (exercise.sets * setTime + (exercise.sets - 1) * exercise.restBetweenSets) / 60;
      return `~${Math.round(totalTime)} min`;
    }
    return '~5 min';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50 opacity-50"
      )}
    >
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div 
              {...attributes} 
              {...listeners}
              className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Exercise Content */}
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{exercise.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {exercise.category}
                    </Badge>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      getIntensityColor(exercise.intensity)
                    )} />
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {exercise.sets && (
                      <span className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        {exercise.sets} sets
                      </span>
                    )}
                    {exercise.reps && (
                      <span>× {exercise.reps} reps</span>
                    )}
                    {exercise.duration && (
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {exercise.duration} min
                      </span>
                    )}
                    {exercise.weight && (
                      <span className="flex items-center gap-1">
                        <Weight className="h-3 w-3" />
                        {exercise.weight} kg
                      </span>
                    )}
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {estimatedTime()}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    {/* Sets */}
                    {exercise.sets !== undefined && (
                      <div className="space-y-1">
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 0 })}
                          className="h-8"
                          min={1}
                        />
                      </div>
                    )}

                    {/* Reps */}
                    {exercise.reps !== undefined && (
                      <div className="space-y-1">
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          value={exercise.reps}
                          onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
                          className="h-8"
                          min={1}
                        />
                      </div>
                    )}

                    {/* Duration */}
                    {exercise.duration !== undefined && (
                      <div className="space-y-1">
                        <Label className="text-xs">Duration (min)</Label>
                        <Input
                          type="number"
                          value={exercise.duration}
                          onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 0 })}
                          className="h-8"
                          min={1}
                        />
                      </div>
                    )}

                    {/* Rest */}
                    <div className="space-y-1">
                      <Label className="text-xs">Rest (sec)</Label>
                      <Input
                        type="number"
                        value={exercise.restBetweenSets || 60}
                        onChange={(e) => onUpdate({ restBetweenSets: parseInt(e.target.value) || 0 })}
                        className="h-8"
                        min={0}
                        step={15}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      value={exercise.notes || ''}
                      onChange={(e) => onUpdate({ notes: e.target.value })}
                      placeholder="Add instructions or notes..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  {/* Equipment */}
                  {exercise.equipment && exercise.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">Equipment:</span>
                      {exercise.equipment.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SessionTimeline({
  exercises,
  warmup = { duration: 10, activities: [] },
  cooldown = { duration: 10, activities: [] },
  onUpdateExercise,
  onRemoveExercise,
  onUpdateWarmup,
  onUpdateCooldown
}: SessionTimelineProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'timeline-dropzone',
    data: {
      type: 'timeline'
    }
  });

  const [warmupActivity, setWarmupActivity] = useState('');
  const [cooldownActivity, setCooldownActivity] = useState('');

  const addWarmupActivity = () => {
    if (warmupActivity.trim() && onUpdateWarmup) {
      onUpdateWarmup({
        ...warmup,
        activities: [...warmup.activities, warmupActivity.trim()]
      });
      setWarmupActivity('');
    }
  };

  const addCooldownActivity = () => {
    if (cooldownActivity.trim() && onUpdateCooldown) {
      onUpdateCooldown({
        ...cooldown,
        activities: [...cooldown.activities, cooldownActivity.trim()]
      });
      setCooldownActivity('');
    }
  };

  return (
    <div ref={setNodeRef} className="space-y-4">
      {/* Warmup Section */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-base">Warm-up</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={warmup.duration}
                onChange={(e) => onUpdateWarmup?.({
                  ...warmup,
                  duration: parseInt(e.target.value) || 0
                })}
                className="h-8 w-20"
                min={0}
                step={5}
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add warm-up activity..."
              value={warmupActivity}
              onChange={(e) => setWarmupActivity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addWarmupActivity()}
              className="h-8"
            />
            <Button size="sm" onClick={addWarmupActivity}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {warmup.activities.map((activity, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {activity}
                <button
                  onClick={() => onUpdateWarmup?.({
                    ...warmup,
                    activities: warmup.activities.filter((_, i) => i !== idx)
                  })}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Exercises */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Main Session</div>
        
        {exercises.length === 0 ? (
          <Card className={cn(
            "border-2 border-dashed transition-colors",
            isOver && "border-primary bg-primary/5"
          )}>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <GripVertical className="h-8 w-8 mx-auto mb-2" />
                <p>Drag exercises here to build your session</p>
                <p className="text-sm mt-1">Exercises can be reordered by dragging</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-500px)]">
            <SortableContext
              items={exercises.map(ex => ex.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {exercises.map((exercise) => (
                  <SortableExercise
                    key={exercise.id}
                    exercise={exercise}
                    onUpdate={(updates) => onUpdateExercise(exercise.id, updates)}
                    onRemove={() => onRemoveExercise(exercise.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </ScrollArea>
        )}
      </div>

      {/* Cooldown Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base">Cool-down</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={cooldown.duration}
                onChange={(e) => onUpdateCooldown?.({
                  ...cooldown,
                  duration: parseInt(e.target.value) || 0
                })}
                className="h-8 w-20"
                min={0}
                step={5}
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add cool-down activity..."
              value={cooldownActivity}
              onChange={(e) => setCooldownActivity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCooldownActivity()}
              className="h-8"
            />
            <Button size="sm" onClick={addCooldownActivity}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {cooldown.activities.map((activity, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {activity}
                <button
                  onClick={() => onUpdateCooldown?.({
                    ...cooldown,
                    activities: cooldown.activities.filter((_, i) => i !== idx)
                  })}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}