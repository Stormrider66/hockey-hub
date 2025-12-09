'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecentWorkoutsWidget } from '../../shared';
import type { WorkoutType } from '../../../types';

interface RecentWorkoutsSectionProps {
  recentWorkouts: any[];
  isLoadingRecent: boolean;
  onDuplicate: (workoutId: string) => void;
  onEdit: (workoutId: string) => void;
  onToggleFavorite: (workoutId: string) => void;
  onViewDetails: (workoutId: string, workoutType: WorkoutType) => void;
}

export const RecentWorkoutsSection = React.memo(function RecentWorkoutsSection({
  recentWorkouts,
  isLoadingRecent,
  onDuplicate,
  onEdit,
  onToggleFavorite,
  onViewDetails
}: RecentWorkoutsSectionProps) {
  const { t } = useTranslation(['physicalTrainer']);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('sessions.recentWorkouts')}</CardTitle>
        <CardDescription>
          {t('sessions.recentWorkoutsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RecentWorkoutsWidget
          workouts={recentWorkouts}
          isLoading={isLoadingRecent}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onToggleFavorite={onToggleFavorite}
          onViewDetails={onViewDetails}
        />
      </CardContent>
    </Card>
  );
});