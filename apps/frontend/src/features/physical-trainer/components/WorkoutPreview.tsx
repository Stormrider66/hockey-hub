'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Dumbbell,
  AlertTriangle,
  CheckCircle,
  Repeat,
  Target,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface TargetSelection {
  type: 'organization' | 'team' | 'group' | 'individual';
  id?: string;
  name?: string;
  playerIds: string[];
}

interface WorkoutData {
  title: string;
  description?: string;
  type: 'strength' | 'cardio' | 'skill' | 'recovery' | 'mixed';
  templateId?: string;
  exercises: any[];
  duration: number;
  location: string;
  equipment: string[];
}

interface ScheduleData {
  dates: Date[];
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  time: string;
}

interface WorkoutPreviewProps {
  targetSelection: TargetSelection;
  workoutData: WorkoutData;
  scheduleData: ScheduleData;
  medicalRestrictions?: any[];
  conflicts?: any[];
}

export default function WorkoutPreview({
  targetSelection,
  workoutData,
  scheduleData,
  medicalRestrictions = [],
  conflicts = []
}: WorkoutPreviewProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Calculate total assignments
  const totalAssignments = targetSelection.playerIds.length * scheduleData.dates.length;

  // Group exercises by category
  const exercisesByCategory = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};
    workoutData.exercises.forEach(exercise => {
      const category = exercise.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(exercise);
    });
    return grouped;
  }, [workoutData.exercises]);

  // Format recurrence text
  const getRecurrenceText = (recurrence?: string) => {
    switch (recurrence) {
      case 'daily':
        return t('physicalTrainer:preview.daily');
      case 'weekly':
        return t('physicalTrainer:preview.weekly');
      case 'biweekly':
        return t('physicalTrainer:preview.biweekly');
      case 'monthly':
        return t('physicalTrainer:preview.monthly');
      default:
        return t('physicalTrainer:preview.oneTime');
    }
  };

  // Get workout type color
  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'bg-red-500';
      case 'cardio':
        return 'bg-blue-500';
      case 'skill':
        return 'bg-green-500';
      case 'recovery':
        return 'bg-purple-500';
      case 'mixed':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {t('physicalTrainer:preview.assignmentSummary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{targetSelection.playerIds.length}</p>
              <p className="text-sm text-muted-foreground">
                {t('physicalTrainer:preview.players')}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{scheduleData.dates.length}</p>
              <p className="text-sm text-muted-foreground">
                {t('physicalTrainer:preview.sessions')}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{totalAssignments}</p>
              <p className="text-sm text-muted-foreground">
                {t('physicalTrainer:preview.totalAssignments')}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{workoutData.duration}</p>
              <p className="text-sm text-muted-foreground">
                {t('physicalTrainer:preview.minutesPerSession')}
              </p>
            </div>
          </div>

          {/* Warnings */}
          {(medicalRestrictions.length > 0 || conflicts.length > 0) && (
            <div className="mt-4 space-y-2">
              {medicalRestrictions.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {t('physicalTrainer:preview.medicalWarning', {
                      count: medicalRestrictions.length
                    })}
                  </AlertDescription>
                </Alert>
              )}
              
              {conflicts.length > 0 && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {t('physicalTrainer:preview.conflictWarning', {
                      count: conflicts.length
                    })}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workout Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('physicalTrainer:preview.workoutDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {workoutData.title}
              <Badge className={`${getWorkoutTypeColor(workoutData.type)} text-white`}>
                {workoutData.type}
              </Badge>
            </h3>
            {workoutData.description && (
              <p className="text-muted-foreground mt-1">{workoutData.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{t('physicalTrainer:preview.location')}:</span> {workoutData.location || t('common:notSpecified')}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{t('physicalTrainer:preview.duration')}:</span> {workoutData.duration} {t('common:minutes')}
              </span>
            </div>
          </div>

          {workoutData.equipment.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">{t('physicalTrainer:preview.equipment')}:</p>
              <div className="flex flex-wrap gap-2">
                {workoutData.equipment.map((item, idx) => (
                  <Badge key={idx} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Exercise Breakdown */}
          <div>
            <h4 className="font-medium mb-3">{t('physicalTrainer:preview.exerciseBreakdown')}</h4>
            <div className="space-y-3">
              {Object.entries(exercisesByCategory).map(([category, exercises]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize">
                      {category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {exercises.length} {t('physicalTrainer:preview.exercises')}
                    </span>
                  </div>
                  <div className="ml-4 space-y-1">
                    {exercises.map((exercise, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{exercise.name}</span>
                        <span className="text-muted-foreground">
                          {exercise.sets && exercise.reps && `${exercise.sets}×${exercise.reps}`}
                          {exercise.duration && `${exercise.duration} min`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('physicalTrainer:preview.scheduleDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t('physicalTrainer:preview.pattern')}:</span>
                <Badge variant="outline">
                  {getRecurrenceText(scheduleData.recurrence)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t('physicalTrainer:preview.time')}:</span>
                <span>{scheduleData.time}</span>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">{t('physicalTrainer:preview.scheduledDates')}:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {scheduleData.dates.slice(0, 6).map((date, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{format(date, 'MMM dd, yyyy')}</span>
                  </div>
                ))}
                {scheduleData.dates.length > 6 && (
                  <div className="text-sm text-muted-foreground">
                    +{scheduleData.dates.length - 6} {t('physicalTrainer:preview.more')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Players */}
      <Card>
        <CardHeader>
          <CardTitle>{t('physicalTrainer:preview.targetPlayers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t('physicalTrainer:preview.targetType')}:</span>
                <Badge variant="outline" className="capitalize">
                  {targetSelection.type}
                </Badge>
              </div>
              {targetSelection.name && (
                <span className="text-sm text-muted-foreground">
                  {targetSelection.name}
                </span>
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {targetSelection.playerIds.length} {t('physicalTrainer:preview.playersSelected')}
                </span>
                {medicalRestrictions.length > 0 && (
                  <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {medicalRestrictions.length} {t('physicalTrainer:preview.withRestrictions')}
                  </Badge>
                )}
              </div>
              
              {/* Player summary - in real app would show player details */}
              <p className="text-sm text-muted-foreground">
                {t('physicalTrainer:preview.playerSummaryText')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Info */}
      {workoutData.templateId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('physicalTrainer:preview.templateInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                {t('physicalTrainer:preview.basedOnTemplate')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Summary */}
      <Alert className="bg-primary/10 border-primary">
        <CheckCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-primary">
          {t('physicalTrainer:preview.readyToCreate', {
            assignments: totalAssignments,
            players: targetSelection.playerIds.length,
            sessions: scheduleData.dates.length
          })}
        </AlertDescription>
      </Alert>
    </div>
  );
}