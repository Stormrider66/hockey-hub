'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, Clock, Dumbbell, Heart, Coffee, 
  Calendar, User, TrendingUp, ChevronRight,
  Zap, Activity, Timer
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { HybridProgram, HybridWorkoutBlock } from '../types/hybrid.types';
import type { IntervalSet } from '../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../types/conditioning.types';

interface HybridWorkoutPlayerViewProps {
  program: HybridProgram;
  scheduledDate?: Date;
  assignedBy?: string;
  onStart?: () => void;
  className?: string;
}

export default function HybridWorkoutPlayerView({ 
  program, 
  scheduledDate,
  assignedBy,
  onStart,
  className 
}: HybridWorkoutPlayerViewProps) {
  
  // Helper to format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };

  // Helper to format interval targets
  const formatIntervalTarget = (interval: IntervalSet) => {
    const targets = [];
    
    if (interval.targetMetrics.watts) {
      const watts = interval.targetMetrics.watts;
      if (typeof watts === 'object') {
        if (watts.type === 'percentage') {
          targets.push(`${watts.value}% ${watts.reference?.toUpperCase() || 'MAX'} watts`);
        } else {
          targets.push(`${watts.value}W`);
        }
      }
    }
    
    if (interval.targetMetrics.heartRate) {
      const hr = interval.targetMetrics.heartRate;
      if (typeof hr === 'object') {
        if (hr.type === 'percentage') {
          targets.push(`${hr.value}% ${hr.reference === 'threshold' ? 'LT' : 'MAX'} HR`);
        } else {
          targets.push(`${hr.value} BPM`);
        }
      }
    }
    
    if (interval.targetMetrics.calories) {
      targets.push(`${interval.targetMetrics.calories} cal`);
    }
    
    if (interval.targetMetrics.distance) {
      const distance = interval.targetMetrics.distance;
      if (typeof distance === 'object') {
        targets.push(`${distance.value}${EQUIPMENT_CONFIGS[interval.equipment].units.distance || 'm'}`);
      }
    }
    
    return targets.join(' • ');
  };

  // Render exercise block
  const renderExerciseBlock = (block: HybridWorkoutBlock, index: number) => {
    if (block.type !== 'exercise' || !block.exercises) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-gray-500">Block {index + 1}</span>
            <span>{block.name}</span>
          </h3>
          <Badge variant="secondary" className="text-sm">
            {formatDuration(block.duration)}
          </Badge>
        </div>
        
        <div className="space-y-2">
          {block.exercises.map((exercise, idx) => (
            <div 
              key={exercise.id} 
              className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg"
            >
              <div className="font-medium">
                {exercise.name}
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-600">Sets x Reps</span>
                <p className="font-semibold">{exercise.sets} x {exercise.reps}</p>
              </div>
              <div className="text-right">
                {exercise.weight > 0 && (
                  <>
                    <span className="text-sm text-gray-600">Weight</span>
                    <p className="font-semibold">{exercise.weight}kg</p>
                  </>
                )}
                {exercise.restAfter > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Rest: {exercise.restAfter}s
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render interval block
  const renderIntervalBlock = (block: HybridWorkoutBlock, index: number) => {
    if (block.type !== 'interval' || !block.intervals) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-gray-500">Block {index + 1}</span>
            <span>{block.name}</span>
          </h3>
          <Badge variant="secondary" className="text-sm">
            {formatDuration(block.duration)}
          </Badge>
        </div>
        
        <div className="space-y-2">
          {block.intervals.map((interval, idx) => {
            const equipment = EQUIPMENT_CONFIGS[interval.equipment];
            const isRest = interval.type === 'rest';
            
            return (
              <div 
                key={interval.id} 
                className={cn(
                  "grid grid-cols-3 gap-4 p-3 rounded-lg",
                  isRest ? "bg-blue-50" : "bg-red-50"
                )}
              >
                <div className="font-medium flex items-center gap-2">
                  <span className="text-lg">{equipment.icon}</span>
                  {interval.name || equipment.label}
                </div>
                <div className="text-center">
                  <span className="text-sm text-gray-600">Duration</span>
                  <p className="font-semibold">{formatDuration(interval.duration)}</p>
                </div>
                <div className="text-right">
                  {!isRest && (
                    <>
                      <span className="text-sm text-gray-600">Target</span>
                      <p className="font-semibold text-sm">
                        {formatIntervalTarget(interval) || 'Best effort'}
                      </p>
                    </>
                  )}
                  {isRest && (
                    <Badge variant="outline" className="bg-blue-100">
                      Recovery
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render transition block
  const renderTransitionBlock = (block: HybridWorkoutBlock, index: number) => {
    if (block.type !== 'transition') return null;
    
    return (
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coffee className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium capitalize">
                {block.transitionType?.replace('_', ' ') || 'Transition'}
              </p>
              {block.activities && block.activities.length > 0 && (
                <p className="text-sm text-gray-600">
                  {block.activities.join(' • ')}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {formatDuration(block.duration)}
          </Badge>
        </div>
      </div>
    );
  };

  const totalDuration = program.blocks.reduce((sum, block) => sum + block.duration, 0);

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{program.name}</CardTitle>
              {program.description && (
                <p className="text-muted-foreground mt-2">{program.description}</p>
              )}
              
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Total: {formatDuration(totalDuration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{program.totalExercises} exercises</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{program.totalIntervals} intervals</span>
                </div>
              </div>
              
              {(scheduledDate || assignedBy) && (
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-gray-600">
                  {scheduledDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(scheduledDate).toLocaleDateString()} at {new Date(scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {assignedBy && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {assignedBy}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Button 
              size="lg" 
              onClick={onStart}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Workout
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Workout Blocks */}
      <Card>
        <CardHeader>
          <CardTitle>Workout Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {program.blocks.map((block, index) => (
            <div key={block.id}>
              {block.type === 'exercise' && renderExerciseBlock(block, index)}
              {block.type === 'interval' && renderIntervalBlock(block, index)}
              {block.type === 'transition' && renderTransitionBlock(block, index)}
              
              {/* Add divider between blocks except last */}
              {index < program.blocks.length - 1 && (
                <div className="mt-6 border-t pt-6" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Equipment Summary */}
      {program.equipment && program.equipment.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Equipment Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {program.equipment.map((eq, idx) => (
                <Badge key={idx} variant="secondary" className="bg-white">
                  {eq}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}