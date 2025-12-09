'use client';

import React, { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Dumbbell, 
  Heart, 
  Activity, 
  Users, 
  AlertCircle,
  CheckCircle,
  Zap,
  TrendingUp,
  Timer,
  Target,
  MapPin,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkoutType } from '../../types/session.types';
import type { StrengthWorkout } from '../../types/strength.types';
import type { IntervalProgram } from '../../types/conditioning.types';
import type { HybridProgram } from '../../types/hybrid.types';
import type { AgilityProgram } from '../../types/agility.types';

interface WorkoutPreviewProps {
  workoutType: WorkoutType;
  workoutData: any;
  playerAssignments?: {
    players: string[];
    teams: string[];
  };
  showMedical?: boolean;
  compact?: boolean;
  interactive?: boolean;
  className?: string;
}

export const WorkoutPreview = memo(function WorkoutPreview({
  workoutType,
  workoutData,
  playerAssignments,
  showMedical = true,
  compact = false,
  interactive = false,
  className
}: WorkoutPreviewProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  const renderStrengthPreview = (workout: StrengthWorkout) => {
    const stats = useMemo(() => {
      const totalExercises = workout.exercises.length;
      const totalSets = workout.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
      const equipment = [...new Set(workout.exercises.flatMap(ex => ex.equipment || []))];
      const muscleGroups = [...new Set(workout.exercises.flatMap(ex => ex.muscleGroups || []))];
      return { totalExercises, totalSets, equipment, muscleGroups };
    }, [workout.exercises]);
    
    const { totalExercises, totalSets, equipment, muscleGroups } = stats;

    if (compact) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{totalExercises} exercises</span>
            </div>
            <Badge variant="secondary">{totalSets} sets</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{workout.totalDuration} min</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Workout Structure */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalExercises}</div>
            <div className="text-xs text-muted-foreground">Exercises</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalSets}</div>
            <div className="text-xs text-muted-foreground">Total Sets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{workout.totalDuration}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </div>
        </div>

        {/* Exercise Phases */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Workout Phases</div>
          <div className="space-y-1">
            {workout.warmupExercises && workout.warmupExercises.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Warm-up</span>
                <span>{workout.warmupExercises.length} exercises</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Main Workout</span>
              <span>{workout.exercises.length} exercises</span>
            </div>
            {workout.cooldownExercises && workout.cooldownExercises.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cool-down</span>
                <span>{workout.cooldownExercises.length} exercises</span>
              </div>
            )}
          </div>
        </div>

        {/* Target Areas */}
        {muscleGroups.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Target Muscle Groups</div>
            <div className="flex flex-wrap gap-1">
              {muscleGroups.slice(0, 5).map(group => (
                <Badge key={group} variant="outline" className="text-xs">
                  {group}
                </Badge>
              ))}
              {muscleGroups.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{muscleGroups.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Equipment */}
        {equipment.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Equipment Needed</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {equipment.map(item => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConditioningPreview = (program: IntervalProgram) => {
    const workIntervals = program.intervals.filter(i => i.type === 'work').length;
    const restIntervals = program.intervals.filter(i => i.type === 'rest').length;
    const totalWork = program.intervals
      .filter(i => i.type === 'work')
      .reduce((sum, i) => sum + i.duration, 0);
    const totalRest = program.intervals
      .filter(i => i.type === 'rest' || i.type === 'active_recovery')
      .reduce((sum, i) => sum + i.duration, 0);

    if (compact) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{workIntervals} intervals</span>
            </div>
            <Badge variant="secondary">{program.equipment}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{Math.ceil(program.totalDuration / 60)} min</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Interval Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{workIntervals}</div>
            <div className="text-xs text-muted-foreground">Work Intervals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{restIntervals}</div>
            <div className="text-xs text-muted-foreground">Rest Periods</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Math.ceil(program.totalDuration / 60)}</div>
            <div className="text-xs text-muted-foreground">Total Minutes</div>
          </div>
        </div>

        {/* Work/Rest Ratio */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Work/Rest Distribution</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Work Time</span>
              <span className="font-medium">{Math.round(totalWork / 60)} min</span>
            </div>
            <Progress 
              value={(totalWork / program.totalDuration) * 100} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rest Time</span>
              <span className="font-medium">{Math.round(totalRest / 60)} min</span>
            </div>
          </div>
        </div>

        {/* Interval Timeline */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Interval Timeline</div>
          <div className="flex gap-0.5 h-8">
            {program.intervals.map((interval, idx) => {
              const width = (interval.duration / program.totalDuration) * 100;
              const colors = {
                warmup: 'bg-yellow-500',
                work: 'bg-green-500',
                rest: 'bg-blue-500',
                active_recovery: 'bg-blue-400',
                cooldown: 'bg-purple-500'
              };
              return (
                <div
                  key={idx}
                  className={cn(
                    'h-full rounded-sm transition-all hover:opacity-80',
                    colors[interval.type] || 'bg-gray-500'
                  )}
                  style={{ width: `${width}%` }}
                  title={`${interval.name || interval.type} - ${interval.duration}s`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
              <span>Warm-up</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <span>Work</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              <span>Rest</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded-sm" />
              <span>Cool-down</span>
            </div>
          </div>
        </div>

        {/* Heart Rate Zones */}
        {program.targetZones && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Target Heart Rate Zones</span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-xs">
              {[1, 2, 3, 4, 5].map(zone => (
                <div key={zone} className="text-center">
                  <div className={cn(
                    "font-medium",
                    program.targetZones![`zone${zone}` as keyof typeof program.targetZones] > 0 
                      ? "text-red-500" 
                      : "text-muted-foreground"
                  )}>
                    {program.targetZones![`zone${zone}` as keyof typeof program.targetZones]}%
                  </div>
                  <div className="text-muted-foreground">Z{zone}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Package className="h-3 w-3" />
            {program.equipment}
          </Badge>
          {program.difficulty && (
            <Badge variant="secondary">{program.difficulty}</Badge>
          )}
        </div>
      </div>
    );
  };

  const renderHybridPreview = (program: HybridProgram) => {
    const exerciseBlocks = program.blocks.filter(b => b.type === 'exercise').length;
    const intervalBlocks = program.blocks.filter(b => b.type === 'interval').length;
    const transitionBlocks = program.blocks.filter(b => b.type === 'transition').length;

    if (compact) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{program.blocks.length} blocks</span>
            </div>
            <Badge variant="secondary">Hybrid</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{Math.ceil(program.totalDuration / 60)} min</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Block Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{exerciseBlocks}</div>
            <div className="text-xs text-muted-foreground">Exercise Blocks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{intervalBlocks}</div>
            <div className="text-xs text-muted-foreground">Interval Blocks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Math.ceil(program.totalDuration / 60)}</div>
            <div className="text-xs text-muted-foreground">Total Minutes</div>
          </div>
        </div>

        {/* Block Sequence */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Workout Flow</div>
          <div className="space-y-1">
            {program.blocks.slice(0, 5).map((block, idx) => (
              <div key={block.id} className="flex items-center gap-2 text-sm">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                  {idx + 1}
                </div>
                <span className="flex-1">{block.name}</span>
                <span className="text-muted-foreground">{Math.ceil(block.duration / 60)} min</span>
              </div>
            ))}
            {program.blocks.length > 5 && (
              <div className="text-sm text-muted-foreground pl-8">
                +{program.blocks.length - 5} more blocks
              </div>
            )}
          </div>
        </div>

        {/* Activity Distribution */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Activity Distribution</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Exercises</span>
              <span className="font-medium">{program.totalExercises}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Intervals</span>
              <span className="font-medium">{program.totalIntervals}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Transitions</span>
              <span className="font-medium">{transitionBlocks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Est. Calories</span>
              <span className="font-medium">{program.estimatedCalories}</span>
            </div>
          </div>
        </div>

        {/* Equipment */}
        {program.equipment.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Equipment Needed</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {program.equipment.slice(0, 4).map(item => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
              {program.equipment.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{program.equipment.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAgilityPreview = (program: AgilityProgram) => {
    const totalDrills = program.drills.length;
    const drillCategories = [...new Set(program.drills.map(d => d.category))];
    const equipment = [...new Set(program.equipmentNeeded)];

    if (compact) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{totalDrills} drills</span>
            </div>
            <Badge variant="secondary">{program.difficulty}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{Math.ceil(program.totalDuration / 60)} min</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Drill Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalDrills}</div>
            <div className="text-xs text-muted-foreground">Total Drills</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Math.ceil(program.totalDuration / 60)}</div>
            <div className="text-xs text-muted-foreground">Total Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{drillCategories.length}</div>
            <div className="text-xs text-muted-foreground">Drill Types</div>
          </div>
        </div>

        {/* Drill Sequence */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Drill Sequence</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Warm-up</span>
              <span>{Math.ceil(program.warmupDuration / 60)} min</span>
            </div>
            {program.drills.slice(0, 4).map((drill, idx) => (
              <div key={drill.id} className="flex items-center gap-2 text-sm">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                  {idx + 1}
                </div>
                <span className="flex-1">{drill.name}</span>
                <span className="text-muted-foreground">
                  {drill.sets ? `${drill.sets}×${drill.reps}` : `${drill.reps} reps`}
                </span>
              </div>
            ))}
            {program.drills.length > 4 && (
              <div className="text-sm text-muted-foreground pl-8">
                +{program.drills.length - 4} more drills
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Cool-down</span>
              <span>{Math.ceil(program.cooldownDuration / 60)} min</span>
            </div>
          </div>
        </div>

        {/* Focus Areas */}
        {program.focusAreas.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Focus Areas</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {program.focusAreas.map(area => (
                <Badge key={area} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Equipment */}
        {equipment.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Equipment Needed</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {equipment.map(item => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty */}
        <div className="flex items-center gap-2">
          <Badge variant={program.difficulty === 'elite' ? 'destructive' : 'default'}>
            {program.difficulty}
          </Badge>
        </div>
      </div>
    );
  };

  const renderPreviewContent = () => {
    switch (workoutType) {
      case WorkoutType.STRENGTH:
        return renderStrengthPreview(workoutData as StrengthWorkout);
      case WorkoutType.CONDITIONING:
        return renderConditioningPreview(workoutData as IntervalProgram);
      case WorkoutType.HYBRID:
        return renderHybridPreview(workoutData as HybridProgram);
      case WorkoutType.AGILITY:
        return renderAgilityPreview(workoutData as AgilityProgram);
      default:
        return <div className="text-sm text-muted-foreground">Unknown workout type</div>;
    }
  };

  const workoutIcons = {
    [WorkoutType.STRENGTH]: <Dumbbell className="h-5 w-5" />,
    [WorkoutType.CONDITIONING]: <Activity className="h-5 w-5" />,
    [WorkoutType.HYBRID]: <Zap className="h-5 w-5" />,
    [WorkoutType.AGILITY]: <Target className="h-5 w-5" />
  };

  const workoutColors = {
    [WorkoutType.STRENGTH]: 'text-blue-600',
    [WorkoutType.CONDITIONING]: 'text-green-600',
    [WorkoutType.HYBRID]: 'text-orange-600',
    [WorkoutType.AGILITY]: 'text-purple-600'
  };

  return (
    <Card 
      className={cn(
        'overflow-hidden transition-all',
        interactive && 'hover:shadow-lg cursor-pointer',
        compact && 'border-muted',
        className
      )}
    >
      <CardHeader className={cn('space-y-1', compact && 'pb-3')}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg bg-muted', workoutColors[workoutType])}>
              {workoutIcons[workoutType]}
            </div>
            <div>
              <h3 className={cn('font-semibold', compact ? 'text-base' : 'text-lg')}>
                {workoutData.name || 'Unnamed Workout'}
              </h3>
              <Badge variant="outline" className="mt-1">
                {workoutType}
              </Badge>
            </div>
          </div>
          {showMedical && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Medical OK</span>
            </div>
          )}
        </div>
        {workoutData.description && !compact && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workoutData.description}
          </p>
        )}
      </CardHeader>

      <CardContent className={compact ? 'pt-0' : ''}>
        {renderPreviewContent()}

        {/* Player Assignments */}
        {playerAssignments && (playerAssignments.players.length > 0 || playerAssignments.teams.length > 0) && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Assignments</span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {playerAssignments.teams.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Teams:</span>
                  <span className="font-medium">{playerAssignments.teams.length}</span>
                </div>
              )}
              {playerAssignments.players.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Players:</span>
                  <span className="font-medium">{playerAssignments.players.length}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});