'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Target,
  Dumbbell,
  Activity,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info,
} from '@/components/icons';
import { Zap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutMetadata {
  workoutId: string;
  workoutType?: 'CONDITIONING' | 'HYBRID' | 'AGILITY' | 'STRENGTH';
  estimatedDuration?: number;
  intensity?: 'low' | 'medium' | 'high';
  focus?: string;
  equipment?: string[];
  workoutPreview?: {
    type: string;
    duration: string;
    exercises?: number;
    intervals?: number;
    drills?: number;
    blocks?: number;
    equipment: string;
    intensity?: string;
    estimatedCalories?: number;
  };
  targetMetrics?: {
    heartRateZone?: string;
    expectedCalories?: number;
  };
  exercises?: Array<{ name: string; sets?: number; reps?: number; weight?: number }>;
  intervalProgram?: {
    name: string;
    equipment: string;
    totalDuration: number;
    estimatedCalories?: number;
    intervals: Array<{ id: string; type: string; duration: number }>;
  };
  hybridProgram?: {
    name: string;
    totalDuration: number;
    blocks: Array<{ id: string; type: string; name: string; duration: number }>;
  };
  agilityProgram?: {
    name: string;
    totalDuration: number;
    drills: Array<{ id: string; name: string; duration: number; difficulty: string }>;
  };
}

interface PlayerWorkoutPreviewProps {
  metadata: WorkoutMetadata;
  eventTitle: string;
  location?: string;
  startTime: string;
  className?: string;
}

const workoutTypeConfig = {
  STRENGTH: {
    color: 'blue',
    icon: Dumbbell,
    name: 'Strength Training',
  },
  CONDITIONING: {
    color: 'red',
    icon: Activity,
    name: 'Conditioning',
  },
  HYBRID: {
    color: 'purple',
    icon: Zap,
    name: 'Hybrid Training',
  },
  AGILITY: {
    color: 'orange',
    icon: Target,
    name: 'Agility Training',
  },
};

const intensityConfig = {
  low: {
    color: 'green',
    label: 'Low Intensity',
    description: 'Easy pace, focus on form',
  },
  medium: {
    color: 'yellow',
    label: 'Medium Intensity',
    description: 'Moderate effort, steady pace',
  },
  high: {
    color: 'red',
    label: 'High Intensity',
    description: 'Challenging, high effort',
  },
};

export function PlayerWorkoutPreview({
  metadata,
  eventTitle,
  location,
  startTime,
  className,
}: PlayerWorkoutPreviewProps) {
  const workoutType = metadata.workoutType || 'STRENGTH';
  const config = workoutTypeConfig[workoutType];
  const intensity = metadata.intensity || 'medium';
  const intensityConf = intensityConfig[intensity];
  const preview = metadata.workoutPreview;

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'TBD';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  const Icon = config.icon;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              config.color === 'blue' && 'bg-blue-100 text-blue-700',
              config.color === 'red' && 'bg-red-100 text-red-700',
              config.color === 'purple' && 'bg-purple-100 text-purple-700',
              config.color === 'orange' && 'bg-orange-100 text-orange-700'
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{eventTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {config.name} • {formatDuration(metadata.estimatedDuration)}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              intensityConf.color === 'green' && 'bg-green-100 text-green-700',
              intensityConf.color === 'yellow' && 'bg-yellow-100 text-yellow-700',
              intensityConf.color === 'red' && 'bg-red-100 text-red-700'
            )}
          >
            {intensityConf.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{preview?.duration || formatDuration(metadata.estimatedDuration)}</span>
          </div>
          {location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{location}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Workout Details */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Workout Overview</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {preview?.exercises && (
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <span>{preview.exercises} exercises</span>
              </div>
            )}
            {preview?.intervals && (
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>{preview.intervals} intervals</span>
              </div>
            )}
            {preview?.drills && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>{preview.drills} drills</span>
              </div>
            )}
            {preview?.blocks && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>{preview.blocks} blocks</span>
              </div>
            )}
            {preview?.estimatedCalories && (
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>~{preview.estimatedCalories} cal</span>
              </div>
            )}
            {metadata.focus && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>{metadata.focus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Equipment Requirements */}
        {metadata.equipment && metadata.equipment.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Equipment Needed
              </h4>
              <div className="flex flex-wrap gap-1">
                {metadata.equipment.map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Target Metrics */}
        {metadata.targetMetrics && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Target Metrics
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {metadata.targetMetrics.heartRateZone && (
                  <div>Heart Rate: {metadata.targetMetrics.heartRateZone}</div>
                )}
                {metadata.targetMetrics.expectedCalories && (
                  <div>Expected Calories: {metadata.targetMetrics.expectedCalories}</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Workout Program Summary */}
        {workoutType === 'STRENGTH' && metadata.exercises && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Exercise Preview</h4>
              <div className="space-y-1">
                {metadata.exercises.slice(0, 3).map((exercise, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {exercise.name}
                    {exercise.sets && exercise.reps && 
                      ` - ${exercise.sets}x${exercise.reps}`
                    }
                    {exercise.weight && ` @ ${exercise.weight}lbs`}
                  </div>
                ))}
                {metadata.exercises.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{metadata.exercises.length - 3} more exercises
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {workoutType === 'CONDITIONING' && metadata.intervalProgram && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Interval Program</h4>
              <div className="text-sm text-muted-foreground">
                <div>{metadata.intervalProgram.name}</div>
                <div className="capitalize">Equipment: {metadata.intervalProgram.equipment.replace('_', ' ')}</div>
                {metadata.intervalProgram.estimatedCalories && (
                  <div>Estimated Calories: {metadata.intervalProgram.estimatedCalories}</div>
                )}
              </div>
            </div>
          </>
        )}

        {workoutType === 'HYBRID' && metadata.hybridProgram && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Training Blocks</h4>
              <div className="space-y-1">
                {metadata.hybridProgram.blocks.slice(0, 3).map((block, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex justify-between">
                    <span>{block.name}</span>
                    <span>{Math.floor(block.duration / 60)}min</span>
                  </div>
                ))}
                {metadata.hybridProgram.blocks.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{metadata.hybridProgram.blocks.length - 3} more blocks
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {workoutType === 'AGILITY' && metadata.agilityProgram && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Agility Drills</h4>
              <div className="space-y-1">
                {metadata.agilityProgram.drills.slice(0, 3).map((drill, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex justify-between">
                    <span>{drill.name}</span>
                    <span className="capitalize">{drill.difficulty}</span>
                  </div>
                ))}
                {metadata.agilityProgram.drills.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{metadata.agilityProgram.drills.length - 3} more drills
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Readiness Check */}
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">
            Ready to start • Equipment available • No medical restrictions
          </span>
        </div>
      </CardContent>
    </Card>
  );
}