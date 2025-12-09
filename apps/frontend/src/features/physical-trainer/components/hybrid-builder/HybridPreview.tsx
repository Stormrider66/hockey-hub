import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Flame,
  Activity,
  Dumbbell,
  Heart,
  Users,
  Timer,
  FileText,
  Printer,
  CheckCircle,
  Info,
  BarChart3,
  Target,
  Zap,
  Brain,
  Shield,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HybridWorkout, WorkoutBlock } from '../../types/hybrid-builder.types';

interface HybridPreviewProps {
  workout: HybridWorkout;
  onBlockClick?: (block: WorkoutBlock) => void;
}

const blockTypeColors: Record<string, string> = {
  warmup: 'bg-yellow-500',
  strength: 'bg-blue-600',
  cardio: 'bg-red-500',
  hiit: 'bg-purple-600',
  circuit: 'bg-green-600',
  cooldown: 'bg-cyan-500',
  skills: 'bg-orange-500',
  recovery: 'bg-teal-500'
};

const blockTypeIcons: Record<string, React.ReactNode> = {
  warmup: <Heart className="w-4 h-4" />,
  strength: <Dumbbell className="w-4 h-4" />,
  cardio: <Activity className="w-4 h-4" />,
  hiit: <Zap className="w-4 h-4" />,
  circuit: <Target className="w-4 h-4" />,
  cooldown: <Shield className="w-4 h-4" />,
  skills: <Brain className="w-4 h-4" />,
  recovery: <TrendingUp className="w-4 h-4" />
};

export function HybridPreview({ workout, onBlockClick }: HybridPreviewProps) {
  const [selectedBlock, setSelectedBlock] = useState<WorkoutBlock | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Calculate workout statistics
  const stats = useMemo(() => {
    const totalDuration = workout.blocks.reduce((sum, block) => sum + block.duration, 0);
    
    // Calculate calories based on intensity and duration
    const totalCalories = workout.blocks.reduce((sum, block) => {
      const intensityMultiplier = {
        low: 4,
        moderate: 6,
        high: 8,
        'very high': 10
      }[block.intensity] || 6;
      return sum + (block.duration * intensityMultiplier);
    }, 0);

    // Group time by activity type
    const timeByType = workout.blocks.reduce((acc, block) => {
      acc[block.type] = (acc[block.type] || 0) + block.duration;
      return acc;
    }, {} as Record<string, number>);

    // Collect unique equipment
    const allEquipment = workout.blocks.flatMap(block => 
      block.exercises?.map(ex => ex.equipment || 'None') || []
    );
    const uniqueEquipment = [...new Set(allEquipment)].filter(e => e !== 'None');

    // Calculate intensity distribution
    const intensityDistribution = workout.blocks.reduce((acc, block) => {
      acc[block.intensity] = (acc[block.intensity] || 0) + block.duration;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDuration,
      totalCalories,
      timeByType,
      uniqueEquipment,
      intensityDistribution,
      blockCount: workout.blocks.length,
      exerciseCount: workout.blocks.reduce((sum, block) => 
        sum + (block.exercises?.length || 0), 0
      )
    };
  }, [workout]);

  const handleBlockClick = (block: WorkoutBlock) => {
    setSelectedBlock(block);
    onBlockClick?.(block);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{workout.name}</CardTitle>
              {workout.description && (
                <p className="text-muted-foreground mt-2">{workout.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPrintDialog(true)}
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print Workout Sheet</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-xl font-semibold">
                  {formatDuration(stats.totalDuration)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Calories</p>
                <p className="text-xl font-semibold">{stats.totalCalories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exercises</p>
                <p className="text-xl font-semibold">{stats.exerciseCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Focus</p>
                <p className="text-xl font-semibold">{workout.type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Workout Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Timeline Bar */}
            <div className="relative h-20 bg-gray-100 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex">
                {workout.blocks.map((block, index) => {
                  const widthPercentage = (block.duration / stats.totalDuration) * 100;
                  return (
                    <TooltipProvider key={block.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            className={`relative h-full cursor-pointer transition-all hover:brightness-110 ${
                              blockTypeColors[block.type]
                            }`}
                            style={{ width: `${widthPercentage}%` }}
                            onClick={() => handleBlockClick(block)}
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                              {widthPercentage > 10 && (
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {blockTypeIcons[block.type]}
                                    <span className="text-xs font-medium">
                                      {block.duration}min
                                    </span>
                                  </div>
                                  {widthPercentage > 15 && (
                                    <p className="text-xs mt-1 capitalize">
                                      {block.type}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-semibold">{block.name}</p>
                            <p className="text-sm">{block.duration} minutes</p>
                            <p className="text-sm capitalize">
                              {block.intensity} intensity
                            </p>
                            {block.exercises && (
                              <p className="text-sm">
                                {block.exercises.length} exercises
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>

            {/* Time markers */}
            <div className="relative h-6">
              <div className="absolute inset-x-0 flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{formatDuration(Math.floor(stats.totalDuration / 2))}</span>
                <span>{formatDuration(stats.totalDuration)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.timeByType).map(([type, duration]) => {
                const percentage = (duration / stats.totalDuration) * 100;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            blockTypeColors[type]
                          }`}
                        />
                        <span className="capitalize">{type}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {duration}min ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Intensity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Intensity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.intensityDistribution).map(([intensity, duration]) => {
                const percentage = (duration / stats.totalDuration) * 100;
                const intensityColors = {
                  low: 'bg-green-500',
                  moderate: 'bg-yellow-500',
                  high: 'bg-orange-500',
                  'very high': 'bg-red-500'
                };
                return (
                  <div key={intensity} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            intensityColors[intensity as keyof typeof intensityColors]
                          }`}
                        />
                        <span className="capitalize">{intensity}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {duration}min ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Needed */}
      {stats.uniqueEquipment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              Equipment Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.uniqueEquipment.map((equipment) => (
                <Badge key={equipment} variant="secondary">
                  {equipment}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Block List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Workout Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workout.blocks.map((block, index) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleBlockClick(block)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg text-white ${
                        blockTypeColors[block.type]
                      }`}
                    >
                      {blockTypeIcons[block.type]}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium">{block.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {block.duration}min
                        </span>
                        <span className="capitalize">{block.intensity} intensity</span>
                        {block.targetAreas && block.targetAreas.length > 0 && (
                          <span>
                            Targets: {block.targetAreas.join(', ')}
                          </span>
                        )}
                      </div>
                      {block.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {block.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {block.exercises?.length || 0} exercises
                  </Badge>
                </div>

                {/* Exercise Preview */}
                {block.exercises && block.exercises.length > 0 && (
                  <div className="mt-3 pl-11">
                    <div className="flex flex-wrap gap-2">
                      {block.exercises.slice(0, 3).map((exercise, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {exercise.name}
                        </Badge>
                      ))}
                      {block.exercises.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{block.exercises.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Block Details Dialog */}
      <Dialog open={!!selectedBlock} onOpenChange={() => setSelectedBlock(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBlock?.name}</DialogTitle>
          </DialogHeader>
          {selectedBlock && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedBlock.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Intensity</p>
                  <p className="font-medium capitalize">{selectedBlock.intensity}</p>
                </div>
              </div>

              {selectedBlock.targetAreas && selectedBlock.targetAreas.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Target Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBlock.targetAreas.map((area) => (
                      <Badge key={area} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedBlock.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{selectedBlock.notes}</p>
                </div>
              )}

              {selectedBlock.exercises && selectedBlock.exercises.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Exercises</p>
                  <div className="space-y-3">
                    {selectedBlock.exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <h5 className="font-medium">{exercise.name}</h5>
                          {exercise.equipment && (
                            <Badge variant="outline" className="text-xs">
                              {exercise.equipment}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {exercise.sets && (
                            <div>
                              <span className="text-muted-foreground">Sets:</span>{' '}
                              {exercise.sets}
                            </div>
                          )}
                          {exercise.reps && (
                            <div>
                              <span className="text-muted-foreground">Reps:</span>{' '}
                              {exercise.reps}
                            </div>
                          )}
                          {exercise.duration && (
                            <div>
                              <span className="text-muted-foreground">Duration:</span>{' '}
                              {exercise.duration}
                            </div>
                          )}
                          {exercise.rest && (
                            <div>
                              <span className="text-muted-foreground">Rest:</span>{' '}
                              {exercise.rest}
                            </div>
                          )}
                        </div>
                        {exercise.notes && (
                          <p className="text-sm text-muted-foreground">
                            {exercise.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workout Sheet Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4 bg-white" id="printable-workout">
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold">{workout.name}</h1>
              <p className="text-gray-600 mt-2">
                {formatDuration(stats.totalDuration)} | {stats.totalCalories} calories | {workout.type}
              </p>
            </div>

            {workout.description && (
              <div className="border-b pb-4">
                <p className="text-gray-700">{workout.description}</p>
              </div>
            )}

            <div className="space-y-4">
              {workout.blocks.map((block, blockIndex) => (
                <div key={block.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                        blockTypeColors[block.type]
                      }`}
                    >
                      {blockIndex + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{block.name}</h3>
                      <p className="text-sm text-gray-600">
                        {block.duration} min | {block.intensity} intensity
                      </p>
                    </div>
                  </div>

                  {block.exercises && block.exercises.length > 0 && (
                    <div className="ml-10 space-y-2">
                      {block.exercises.map((exercise, exerciseIndex) => (
                        <div
                          key={exerciseIndex}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium">{exercise.name}</span>
                            {(exercise.sets || exercise.reps || exercise.duration) && (
                              <span className="text-gray-600 ml-2">
                                {exercise.sets && `${exercise.sets} sets`}
                                {exercise.reps && ` x ${exercise.reps} reps`}
                                {exercise.duration && ` for ${exercise.duration}`}
                                {exercise.rest && ` (${exercise.rest} rest)`}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {block.notes && (
                    <div className="mt-3 ml-10 text-sm text-gray-600 italic">
                      Note: {block.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {stats.uniqueEquipment.length > 0 && (
              <div className="border-t pt-4">
                <p className="font-semibold mb-2">Equipment Needed:</p>
                <p className="text-gray-600">{stats.uniqueEquipment.join(', ')}</p>
              </div>
            )}

            <div className="border-t pt-4 text-sm text-gray-500 text-center">
              <p>Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-workout,
          #printable-workout * {
            visibility: visible;
          }
          #printable-workout {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default HybridPreview;