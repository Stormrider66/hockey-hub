import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Target,
  Activity,
  Zap,
  Move,
  Dumbbell,
  Heart,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Copy,
  Trash2,
  Play,
  FileText,
  Star,
  Share2,
} from '@/components/icons';
import { WorkoutType } from '../types';
import { cn } from '@/lib/utils';

interface WorkoutDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: any; // We'll use any for now to handle all workout types
  isLoading?: boolean;
  onEdit?: (workout: any) => void;
  onDuplicate?: (workout: any) => void;
  onDelete?: (workoutId: string) => void;
  onLaunchSession?: (workout: any) => void;
  onCreateTemplate?: (workout: any) => void;
  onToggleFavorite?: (workoutId: string) => void;
}

const workoutTypeConfig = {
  [WorkoutType.STRENGTH]: {
    icon: Target,
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    lightBg: 'bg-blue-50',
    darkBg: 'bg-blue-900/20',
    label: 'Strength',
  },
  [WorkoutType.CONDITIONING]: {
    icon: Activity,
    color: 'bg-green-500',
    textColor: 'text-green-600',
    lightBg: 'bg-green-50',
    darkBg: 'bg-green-900/20',
    label: 'Conditioning',
  },
  [WorkoutType.HYBRID]: {
    icon: Zap,
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    lightBg: 'bg-purple-50',
    darkBg: 'bg-purple-900/20',
    label: 'Hybrid',
  },
  [WorkoutType.AGILITY]: {
    icon: Move,
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    lightBg: 'bg-orange-50',
    darkBg: 'bg-orange-900/20',
    label: 'Agility',
  },
};

export const WorkoutDetailsModal: React.FC<WorkoutDetailsModalProps> = ({
  isOpen,
  onClose,
  workout,
  isLoading,
  onEdit,
  onDuplicate,
  onDelete,
  onLaunchSession,
  onCreateTemplate,
  onToggleFavorite,
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Determine workout type from data
  const workoutType = useMemo(() => {
    if (!workout) return WorkoutType.STRENGTH;
    
    if (workout.type) {
      switch (workout.type.toLowerCase()) {
        case 'strength':
          return WorkoutType.STRENGTH;
        case 'conditioning':
        case 'cardio':
          return WorkoutType.CONDITIONING;
        case 'hybrid':
          return WorkoutType.HYBRID;
        case 'agility':
          return WorkoutType.AGILITY;
        default:
          return WorkoutType.STRENGTH;
      }
    }
    
    // Fallback detection based on content
    if (workout.intervalProgram) return WorkoutType.CONDITIONING;
    if (workout.hybridProgram || workout.blocks) return WorkoutType.HYBRID;
    if (workout.agilityProgram || workout.drillSequence) return WorkoutType.AGILITY;
    
    return WorkoutType.STRENGTH;
  }, [workout]);

  const config = workoutTypeConfig[workoutType];
  const Icon = config.icon;

  // Parse workout data based on type
  const workoutData = useMemo(() => {
    if (!workout) return null;

    const base = {
      id: workout.id,
      name: workout.name || workout.title || 'Untitled Workout',
      description: workout.description || '',
      type: workoutType,
      duration: workout.duration || workout.estimatedDuration || 0,
      playerCount: workout.playerIds?.length || workout.playerCount || 0,
      teamCount: workout.teamIds?.length || workout.teamCount || 0,
      location: workout.location || 'Training Center',
      scheduledDate: workout.scheduledDate || workout.createdAt,
      status: workout.status || 'completed',
      intensity: workout.intensity || 'medium',
      isFavorite: workout.isFavorite || false,
      createdBy: workout.createdBy || 'Physical Trainer',
      createdAt: workout.createdAt,
      usageCount: workout.usageCount || 0,
      equipment: workout.equipment || [],
      notes: workout.notes || '',
    };

    switch (workoutType) {
      case WorkoutType.STRENGTH:
        return {
          ...base,
          exercises: workout.exercises || [],
          totalSets: workout.exercises?.reduce((sum: number, ex: any) => sum + (ex.sets || 0), 0) || 0,
          totalReps: workout.exercises?.reduce((sum: number, ex: any) => sum + (ex.reps || 0) * (ex.sets || 1), 0) || 0,
        };

      case WorkoutType.CONDITIONING:
        const intervalProgram = workout.intervalProgram || {};
        return {
          ...base,
          intervals: intervalProgram.intervals || [],
          equipment: intervalProgram.equipment || workout.equipment || [],
          targetZones: intervalProgram.targetZones || [],
          totalDuration: intervalProgram.totalDuration || base.duration * 60,
          warmupDuration: intervalProgram.warmup?.duration || 0,
          cooldownDuration: intervalProgram.cooldown?.duration || 0,
          workDuration: intervalProgram.intervals?.reduce((sum: number, interval: any) => sum + interval.duration, 0) || 0,
        };

      case WorkoutType.HYBRID:
        const hybridProgram = workout.hybridProgram || {};
        return {
          ...base,
          blocks: hybridProgram.blocks || workout.blocks || [],
          totalBlocks: hybridProgram.blocks?.length || workout.blocks?.length || 0,
          exerciseBlocks: hybridProgram.blocks?.filter((b: any) => b.type === 'exercise').length || 0,
          intervalBlocks: hybridProgram.blocks?.filter((b: any) => b.type === 'interval').length || 0,
          transitionBlocks: hybridProgram.blocks?.filter((b: any) => b.type === 'transition').length || 0,
        };

      case WorkoutType.AGILITY:
        const agilityProgram = workout.agilityProgram || {};
        return {
          ...base,
          drills: agilityProgram.drills || workout.drills || [],
          focusAreas: agilityProgram.focusAreas || [],
          equipmentNeeded: agilityProgram.equipmentNeeded || workout.equipment || [],
          warmup: agilityProgram.warmup,
          cooldown: agilityProgram.cooldown,
          totalDrills: agilityProgram.drills?.length || workout.drills?.length || 0,
        };

      default:
        return base;
    }
  }, [workout, workoutType]);

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>{t('common:loading')}...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!workoutData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('physicalTrainer:workout.notFound')}</DialogTitle>
            <DialogDescription>
              {t('physicalTrainer:workout.notFoundDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>{t('common:close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStrengthDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Exercise Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Exercises:</span>
                <span className="font-medium">{workoutData.exercises.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sets:</span>
                <span className="font-medium">{workoutData.totalSets}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Reps:</span>
                <span className="font-medium">{workoutData.totalReps}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Equipment Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {workoutData.equipment.length > 0 ? (
                workoutData.equipment.map((eq: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {eq}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No equipment specified</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {workoutData.exercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Exercise Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {workoutData.exercises.map((exercise: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="font-medium">{exercise.name}</div>
                    <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                      {exercise.sets && (
                        <div>Sets: <span className="text-foreground">{exercise.sets}</span></div>
                      )}
                      {exercise.reps && (
                        <div>Reps: <span className="text-foreground">{exercise.reps}</span></div>
                      )}
                      {exercise.weight && (
                        <div>Weight: <span className="text-foreground">{exercise.weight}kg</span></div>
                      )}
                    </div>
                    {exercise.notes && (
                      <div className="text-xs text-muted-foreground">{exercise.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderConditioningDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Interval Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Intervals:</span>
                <span className="font-medium">{workoutData.intervals.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Work Duration:</span>
                <span className="font-medium">{Math.floor(workoutData.workDuration / 60)}:{(workoutData.workDuration % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span>Warmup:</span>
                <span className="font-medium">{Math.floor(workoutData.warmupDuration / 60)}:{(workoutData.warmupDuration % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span>Cooldown:</span>
                <span className="font-medium">{Math.floor(workoutData.cooldownDuration / 60)}:{(workoutData.cooldownDuration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Equipment & Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Equipment:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {workoutData.equipment.map((eq: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {eq}
                    </Badge>
                  ))}
                </div>
              </div>
              {workoutData.targetZones.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Target Zones:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {workoutData.targetZones.map((zone: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {workoutData.intervals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Interval Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {workoutData.intervals.map((interval: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 border rounded">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{interval.name || `Interval ${idx + 1}`}</div>
                      <div className="text-xs text-muted-foreground">
                        Duration: {Math.floor(interval.duration / 60)}:{(interval.duration % 60).toString().padStart(2, '0')}
                        {interval.intensity && ` • Intensity: ${interval.intensity}`}
                      </div>
                    </div>
                    {interval.restAfter && (
                      <div className="text-xs text-muted-foreground">
                        Rest: {interval.restAfter}s
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderHybridDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Block Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Blocks:</span>
                <span className="font-medium">{workoutData.totalBlocks}</span>
              </div>
              <div className="flex justify-between">
                <span>Exercise Blocks:</span>
                <span className="font-medium">{workoutData.exerciseBlocks}</span>
              </div>
              <div className="flex justify-between">
                <span>Interval Blocks:</span>
                <span className="font-medium">{workoutData.intervalBlocks}</span>
              </div>
              <div className="flex justify-between">
                <span>Transitions:</span>
                <span className="font-medium">{workoutData.transitionBlocks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {workoutData.blocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Block Sequence</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {workoutData.blocks.map((block: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border rounded">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm capitalize">{block.type} Block</div>
                      <div className="text-xs text-muted-foreground">
                        {block.name || `${block.type} block`}
                        {block.duration && ` • ${Math.floor(block.duration / 60)}:${(block.duration % 60).toString().padStart(2, '0')}`}
                        {block.exercises && ` • ${block.exercises.length} exercises`}
                        {block.intervals && ` • ${block.intervals.length} intervals`}
                      </div>
                    </div>
                    <Badge variant={block.type === 'exercise' ? 'default' : block.type === 'interval' ? 'secondary' : 'outline'}>
                      {block.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAgilityDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Move className="h-4 w-4" />
              Drill Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Drills:</span>
                <span className="font-medium">{workoutData.totalDrills}</span>
              </div>
              {workoutData.warmup && (
                <div className="flex justify-between">
                  <span>Warmup:</span>
                  <span className="font-medium">{workoutData.warmup.duration || 0}min</span>
                </div>
              )}
              {workoutData.cooldown && (
                <div className="flex justify-between">
                  <span>Cooldown:</span>
                  <span className="font-medium">{workoutData.cooldown.duration || 0}min</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {workoutData.focusAreas?.length > 0 ? (
                workoutData.focusAreas.map((area: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No focus areas specified</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {workoutData.drills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Drill Sequence</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {workoutData.drills.map((drill: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="font-medium">{drill.name}</div>
                    <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                      {drill.duration && (
                        <div>Duration: <span className="text-foreground">{drill.duration}s</span></div>
                      )}
                      {drill.sets && (
                        <div>Sets: <span className="text-foreground">{drill.sets}</span></div>
                      )}
                      {drill.restBetweenSets && (
                        <div>Rest: <span className="text-foreground">{drill.restBetweenSets}s</span></div>
                      )}
                    </div>
                    {drill.description && (
                      <div className="text-xs text-muted-foreground">{drill.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-3 rounded-full', config.lightBg)}>
                <Icon className={cn('h-6 w-6', config.textColor)} />
              </div>
              <div>
                <DialogTitle className="text-xl">{workoutData.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn(config.color, 'text-white')}>
                      {config.label}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatDate(workoutData.scheduledDate)}
                    </span>
                    {workoutData.isFavorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{workoutData.duration}</div>
                      <div className="text-xs text-muted-foreground">minutes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{workoutData.playerCount}</div>
                      <div className="text-xs text-muted-foreground">players</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-bold truncate">{workoutData.location}</div>
                      <div className="text-xs text-muted-foreground">location</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-bold capitalize">{workoutData.intensity}</div>
                      <div className="text-xs text-muted-foreground">intensity</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {workoutData.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{workoutData.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {workoutData.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{workoutData.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status & Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={workoutData.status === 'completed' ? 'default' : 'secondary'}>
                      {workoutData.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Created by:</span>
                    <span>{workoutData.createdBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(workoutData.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Usage count:</span>
                    <span>{workoutData.usageCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {workoutType === WorkoutType.STRENGTH && renderStrengthDetails()}
              {workoutType === WorkoutType.CONDITIONING && renderConditioningDetails()}
              {workoutType === WorkoutType.HYBRID && renderHybridDetails()}
              {workoutType === WorkoutType.AGILITY && renderAgilityDetails()}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span>Times used:</span>
                    <span className="font-medium">{workoutData.usageCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last used:</span>
                    <span className="font-medium">
                      {workoutData.lastUsed ? formatDate(workoutData.lastUsed) : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Favorite:</span>
                    <span className="font-medium">
                      {workoutData.isFavorite ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        'No'
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {onCreateTemplate && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onCreateTemplate(workout)}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Save as Template
                    </Button>
                  )}
                  {onToggleFavorite && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onToggleFavorite(workoutData.id)}
                      className="flex items-center gap-2"
                    >
                      <Star className={cn(
                        "h-4 w-4",
                        workoutData.isFavorite && "text-yellow-500 fill-yellow-500"
                      )} />
                      {workoutData.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  {onLaunchSession && workoutData.status !== 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onLaunchSession(workout)}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Launch Session
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" onClick={() => onEdit(workout)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDuplicate && (
                <Button variant="outline" onClick={() => onDuplicate(workout)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={() => onDelete(workoutData.id)}
                  className="ml-2"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};