'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Dumbbell, Heart, Zap, RotateCw, Sparkles } from '@/components/icons';
import { WorkoutTypeSelector } from '../../shared';
import type { WorkoutType } from '../../../types';
import type { SessionType } from '../../types/session-builder.types';
import Link from 'next/link';

interface WorkoutTypeGridProps {
  onSelectWorkoutType: (type: WorkoutType) => void;
  scheduledWorkouts: number;
  activeWorkouts: number;
  onScheduleClick: () => void;
  onBulkAssignClick: () => void;
}

export const WorkoutTypeGrid = React.memo(function WorkoutTypeGrid({
  onSelectWorkoutType,
  scheduledWorkouts,
  activeWorkouts,
  onScheduleClick,
  onBulkAssignClick
}: WorkoutTypeGridProps) {
  const { t } = useTranslation(['physicalTrainer']);

  return (
    <div className="space-y-6">
      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {t('sessions.createWorkout')}
            </CardTitle>
            <CardDescription>
              {t('sessions.createWorkoutDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkoutTypeSelector onSelect={(type: SessionType) => {
              // Convert SessionType to WorkoutType format
              const workoutTypeMap: Record<SessionType, string> = {
                'strength': 'strength',
                'conditioning': 'conditioning',
                'hybrid': 'hybrid',
                'agility': 'agility',
                'flexibility': 'flexibility',
                'wrestling': 'wrestling',
                'power': 'strength', // Use strength builder for now
                'stability_core': 'strength', // Use strength builder for now
                'plyometrics': 'strength', // Use strength builder for now
                'recovery': 'flexibility', // Use flexibility builder for now
                'sprint': 'agility', // Use agility builder for now
                'sport_specific': 'agility', // Use agility builder for now
                'mixed': 'strength' // Default mixed to strength
              };
              onSelectWorkoutType(workoutTypeMap[type] as any);
            }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('sessions.scheduleSession')}
            </CardTitle>
            <CardDescription>
              {t('sessions.scheduleDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('sessions.todayScheduled')}
                </span>
                <Badge variant="secondary">{scheduledWorkouts}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('sessions.activeNow')}
                </span>
                <Badge variant="default">{activeWorkouts}</Badge>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onScheduleClick}
              >
                {t('sessions.viewSchedule')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {t('sessions.bulkAssignment')}
            </CardTitle>
            <CardDescription>
              {t('sessions.bulkDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onBulkAssignClick}
            >
              {t('sessions.assignWorkouts')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* New Features Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-purple-600" />
              Equipment Rotation Demo
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                New
              </Badge>
            </CardTitle>
            <CardDescription>
              Test the new rotation system with 24 players and 4 stations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground mb-4">
              <div>• 6 Rowers, 6 Bikes, 6 SkiErgs, 6 Assault Bikes</div>
              <div>• Automatic group creation and rotation</div>
              <div>• Real-time equipment tracking</div>
              <div>• Integration with TrainingSessionViewer</div>
            </div>
            <Link href="/physicaltrainer/rotation-demo">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <RotateCw className="h-4 w-4 mr-2" />
                Try Rotation Demo
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Coming Soon
            </CardTitle>
            <CardDescription>
              More features in development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• AI-powered workout optimization</div>
              <div>• Automated progression planning</div>
              <div>• Real-time performance analytics</div>
              <div>• Team comparison tools</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});