'use client';

import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User,
  Activity, 
  Clock, 
  Dumbbell,
  CheckCircle,
  XCircle,
  PauseCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { LiveParticipant } from './types';
import { LiveMetricsPanel } from './LiveMetricsPanel';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ParticipantProgressProps {
  participant: LiveParticipant;
  expanded?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ParticipantProgress: React.FC<ParticipantProgressProps> = ({ 
  participant,
  expanded = false,
  onClick,
  className 
}) => {
  const getConnectionIcon = () => {
    switch (participant.status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getConnectionLabel = () => {
    switch (participant.status) {
      case 'connected':
        return 'Online';
      case 'disconnected':
        return 'Offline';
      case 'paused':
        return 'Paused';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 60) return 'bg-yellow-500';
    if (progress < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (expanded) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
                participant.status === 'connected' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              )}>
                {participant.playerNumber}
              </div>
              <div>
                <CardTitle className="text-xl">{participant.playerName}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{participant.teamName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <Badge variant="outline">
                {getConnectionLabel()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Current Activity */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Current Activity</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">{participant.currentExercise || 'Rest'}</span>
                </div>
                {participant.currentSet && participant.totalSets && (
                  <Badge>
                    Set {participant.currentSet} / {participant.totalSets}
                  </Badge>
                )}
              </div>
              <Progress 
                value={participant.progress} 
                className="h-3"
              />
              <p className="text-sm text-gray-600 mt-2">
                {participant.progress}% Complete
              </p>
            </div>
          </div>

          {/* Live Metrics */}
          <LiveMetricsPanel metrics={participant.metrics} detailed />

          {/* Last Update */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Last updated</span>
            <span>{formatDistanceToNow(new Date(participant.lastUpdate), { addSuffix: true })}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Standard card view
  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all cursor-pointer",
        participant.status === 'disconnected' && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
              participant.status === 'connected' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 text-gray-600'
            )}>
              {participant.playerNumber}
            </div>
            <div>
              <CardTitle className="text-base">{participant.playerName}</CardTitle>
              <p className="text-xs text-gray-600">{participant.teamName}</p>
            </div>
          </div>
          {getConnectionIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Exercise */}
        {participant.currentExercise && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current</span>
            <span className="font-medium truncate max-w-[150px]">
              {participant.currentExercise}
            </span>
          </div>
        )}

        {/* Set Progress */}
        {participant.currentSet && participant.totalSets && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Sets</span>
            <Badge variant="outline">
              {participant.currentSet} / {participant.totalSets}
            </Badge>
          </div>
        )}

        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{participant.progress}%</span>
          </div>
          <Progress 
            value={participant.progress} 
            className="h-2"
          />
        </div>

        {/* Compact Metrics */}
        <LiveMetricsPanel metrics={participant.metrics} compact />

        {/* Last Update */}
        <div className="text-xs text-gray-500 text-center pt-1">
          Updated {formatDistanceToNow(new Date(participant.lastUpdate), { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
};