'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Zap, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { IntervalWorkout } from '@/hooks/useIntervalLauncher';

interface PlayerIntervalViewerProps {
  workout: IntervalWorkout | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerIntervalViewer({ workout, isOpen, onClose }: PlayerIntervalViewerProps) {
  const router = useRouter();

  if (!workout || !workout.intervalProgram) {
    return null;
  }

  const handleStartWorkout = () => {
    // Navigate to dedicated interval session page
    router.push(`/player/interval-session/${workout.id}`);
    onClose();
  };

  const { intervalProgram } = workout;
  const workIntervals = intervalProgram.intervals.filter((i: any) => i.type === 'work').length;
  const totalWork = intervalProgram.intervals
    .filter((i: any) => i.type === 'work')
    .reduce((sum: number, i: any) => sum + i.duration, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{workout.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workout Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="font-medium">{Math.floor(intervalProgram.totalDuration / 60)} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Work Intervals</p>
                <p className="font-medium">{workIntervals}</p>
              </div>
            </div>
          </div>

          {/* Equipment Badge */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="capitalize">
              {intervalProgram.equipment.replace('_', ' ')}
            </Badge>
          </div>

          {/* Interval Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Interval Structure</h4>
            <div className="space-y-1">
              {intervalProgram.intervals.map((interval: any, index: number) => (
                <div
                  key={interval.id || index}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        interval.type === 'warmup' && "bg-green-500",
                        interval.type === 'work' && "bg-red-500",
                        interval.type === 'rest' && "bg-blue-500",
                        interval.type === 'active_recovery' && "bg-yellow-500",
                        interval.type === 'cooldown' && "bg-green-500"
                      )}
                    />
                    <span className="text-sm capitalize">{interval.type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(interval.duration / 60)}:{(interval.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleStartWorkout} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start Workout
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}