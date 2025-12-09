'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play, Dumbbell, Activity, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WorkoutMetadata {
  workoutId: string;
  workoutType?: 'CONDITIONING' | 'HYBRID' | 'AGILITY' | 'STRENGTH';
  intervalProgram?: any;
  hybridWorkout?: any;
  agilityProgram?: any;
  trainingType?: string;
}

interface PlayerWorkoutLauncherProps {
  eventId: string;
  eventTitle: string;
  metadata: WorkoutMetadata;
  startTime: string;
  location: string;
}

export function PlayerWorkoutLauncher({
  eventId,
  eventTitle,
  metadata,
  startTime,
  location
}: PlayerWorkoutLauncherProps) {
  const router = useRouter();

  const handleLaunchWorkout = () => {
    if (!metadata?.workoutId) {
      toast.error('No workout data available');
      return;
    }

    // Store workout data in sessionStorage for the viewer to pick up
    const workoutData = {
      eventId,
      eventTitle,
      workoutId: metadata.workoutId,
      workoutType: metadata.workoutType || 'STRENGTH',
      startTime,
      location,
      intervalProgram: metadata.intervalProgram,
      hybridWorkout: metadata.hybridWorkout,
      agilityProgram: metadata.agilityProgram
    };

    sessionStorage.setItem('currentWorkout', JSON.stringify(workoutData));

    // Route based on workout type (handle both uppercase and lowercase)
    const workoutType = (metadata.workoutType || 'STRENGTH').toUpperCase();
    
    switch (workoutType) {
      case 'CONDITIONING':
        router.push(`/player/workout/conditioning/${metadata.workoutId}`);
        break;
      case 'HYBRID':
        router.push(`/player/workout/hybrid/${metadata.workoutId}`);
        break;
      case 'AGILITY':
        router.push(`/player/workout/agility/${metadata.workoutId}`);
        break;
      case 'STRENGTH':
      default:
        // Default strength/regular workout
        router.push(`/player/workout/${metadata.workoutId}`);
    }
  };

  const getWorkoutIcon = () => {
    const workoutType = (metadata.workoutType || 'STRENGTH').toUpperCase();
    switch (workoutType) {
      case 'CONDITIONING':
        return Activity;
      case 'HYBRID':
        return Dumbbell;
      case 'AGILITY':
        return Target;
      case 'STRENGTH':
      default:
        return Dumbbell;
    }
  };

  const Icon = getWorkoutIcon();

  return (
    <Button
      onClick={handleLaunchWorkout}
      className="w-full"
      variant="default"
    >
      <Icon className="h-4 w-4 mr-2" />
      <Play className="h-4 w-4 mr-2" />
      Start {(metadata.workoutType || 'Training').replace('_', ' ')} Session
    </Button>
  );
}