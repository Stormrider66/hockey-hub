import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface IntervalWorkout {
  id: string;
  title: string;
  type: string;
  intervalProgram?: any;
  scheduledDate: Date;
  location: string;
  estimatedDuration: number;
}

export interface UseIntervalLauncherReturn {
  isViewerOpen: boolean;
  selectedWorkout: IntervalWorkout | null;
  launchInterval: (workout: IntervalWorkout) => void;
  closeViewer: () => void;
  navigateToWorkout: (workoutId: string) => void;
}

export function useIntervalLauncher(): UseIntervalLauncherReturn {
  const router = useRouter();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<IntervalWorkout | null>(null);

  const launchInterval = useCallback((workout: IntervalWorkout) => {
    // Check if workout has interval program
    if (workout.intervalProgram) {
      setSelectedWorkout(workout);
      setIsViewerOpen(true);
    } else {
      // Fallback to regular workout page
      router.push(`/player/workout/${workout.id}`);
    }
  }, [router]);

  const navigateToWorkout = useCallback((workoutId: string) => {
    // For launching from calendar or other views
    // Store the workout ID in sessionStorage to be picked up by the physical trainer dashboard
    sessionStorage.setItem('launchWorkoutId', workoutId);
    router.push('/physicaltrainer');
  }, [router]);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
    setSelectedWorkout(null);
  }, []);

  return {
    isViewerOpen,
    selectedWorkout,
    launchInterval,
    closeViewer,
    navigateToWorkout
  };
}