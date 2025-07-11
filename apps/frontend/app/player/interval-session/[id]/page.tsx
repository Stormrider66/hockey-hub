'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGetWorkoutSessionByIdQuery } from '@/store/api/trainingApi';
import { ConditioningIntervalDisplay } from '@/features/physical-trainer/components/ConditioningIntervalDisplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { WorkoutEquipmentType } from '@/features/physical-trainer/types/conditioning.types';

export default function PlayerIntervalSessionPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;
  
  // Get the player ID from auth/session
  const playerId = "player-123"; // In production, get from auth context
  
  const { data: workout, isLoading, error } = useGetWorkoutSessionByIdQuery(workoutId);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workout session...</p>
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Workout Not Found</h2>
              <p className="text-muted-foreground">
                The workout session you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => router.push('/player')} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if this is an interval workout
  if (!workout.intervalProgram) {
    // Redirect to regular workout page
    router.push(`/player/workout/${workoutId}`);
    return null;
  }

  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? 'p-0' : 'p-4'}`}>
      {!isFullscreen && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/player')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={toggleFullscreen}
            >
              Enter Fullscreen
            </Button>
          </div>
        </div>
      )}

      <div className={`${isFullscreen ? 'h-screen' : 'max-w-7xl mx-auto'}`}>
        <ConditioningIntervalDisplay
          session={{
            id: workout.id,
            name: workout.title,
            equipment: workout.intervalProgram.equipment as WorkoutEquipmentType,
            intervals: workout.intervalProgram.intervals.map((interval: any) => ({
              ...interval,
              personalizedTargets: {
                [playerId]: {
                  playerId,
                  playerName: 'Player', // In production, get from user context
                  targetMetrics: interval.targetMetrics
                }
              }
            })),
            totalDuration: workout.intervalProgram.totalDuration,
            estimatedCalories: workout.intervalProgram.estimatedCalories
          }}
          playerId={playerId}
          playerName="Player" // In production, get from user context
          onComplete={(execution) => {
            // Handle workout completion
            console.log('Workout completed:', execution);
            router.push('/player?tab=wellness');
          }}
          onBack={() => router.push('/player')}
        />
      </div>

      {isFullscreen && (
        <Button
          variant="ghost"
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-50"
        >
          Exit Fullscreen
        </Button>
      )}
    </div>
  );
}