'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveSessionIndicatorProps {
  isLive?: boolean;
  progress?: number;
  participantCount?: number;
  currentActivity?: {
    type: 'exercise' | 'interval' | 'rest' | 'transition';
    name: string;
    timeRemaining?: number;
  };
  compact?: boolean;
  className?: string;
}

export function LiveSessionIndicator({
  isLive,
  progress = 0,
  participantCount = 0,
  currentActivity,
  compact = false,
  className,
}: LiveSessionIndicatorProps) {
  if (!isLive) return null;

  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = () => {
    switch (currentActivity?.type) {
      case 'exercise':
        return <Activity className="h-3 w-3" />;
      case 'interval':
        return <Activity className="h-3 w-3 animate-pulse" />;
      case 'rest':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <div className="relative">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
          <div className="relative bg-red-500 rounded-full h-2 w-2" />
        </div>
        <span className="text-xs font-medium text-red-600">LIVE</span>
        {participantCount > 0 && (
          <span className="text-xs text-muted-foreground">({participantCount})</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Live Badge with Participants */}
      <div className="flex items-center justify-between">
        <Badge variant="destructive" className="animate-pulse">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        </Badge>
        {participantCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {participantCount}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}% complete</span>
            {currentActivity?.timeRemaining && (
              <span>{formatTime(currentActivity.timeRemaining)} left</span>
            )}
          </div>
        </div>
      )}

      {/* Current Activity */}
      {currentActivity && (
        <div className="flex items-center gap-2 text-xs">
          {getActivityIcon()}
          <span className="truncate font-medium">
            {currentActivity.name}
          </span>
        </div>
      )}
    </div>
  );
}

// Minimal version for calendar grid view
export function LiveSessionDot({ isLive }: { isLive?: boolean }) {
  if (!isLive) return null;

  return (
    <div className="absolute top-1 right-1 z-10">
      <div className="relative">
        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping" />
        <div className="relative bg-red-500 rounded-full h-2 w-2" />
      </div>
    </div>
  );
}