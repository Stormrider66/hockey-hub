'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  PlayCircle, 
  PauseCircle,
  Eye,
  Dumbbell,
  Heart,
  Zap,
  Target,
  MapPin,
  Activity
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { BundleSession } from '../bulk-sessions.types';

interface SessionCardProps {
  session: BundleSession;
  onClick?: (sessionId: string) => void;
  className?: string;
}

export const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onClick, 
  className 
}) => {
  const { t } = useTranslation('physicalTrainer');

  const getWorkoutIcon = (type: BundleSession['workoutType']) => {
    switch (type) {
      case 'strength':
        return <Dumbbell className="h-5 w-5" />;
      case 'conditioning':
        return <Heart className="h-5 w-5" />;
      case 'hybrid':
        return <Zap className="h-5 w-5" />;
      case 'agility':
        return <Target className="h-5 w-5" />;
    }
  };

  const getWorkoutColor = (type: BundleSession['workoutType']) => {
    switch (type) {
      case 'strength':
        return 'text-blue-600 bg-blue-50';
      case 'conditioning':
        return 'text-red-600 bg-red-50';
      case 'hybrid':
        return 'text-purple-600 bg-purple-50';
      case 'agility':
        return 'text-orange-600 bg-orange-50';
    }
  };

  const getStatusColor = (status: BundleSession['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'paused':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'preparing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatEstimatedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const activeParticipants = session.participants.filter(p => p.status === 'connected').length;
  const averageHeartRate = session.participants.length > 0
    ? Math.round(
        session.participants
          .filter(p => p.metrics.heartRate)
          .reduce((sum, p) => sum + (p.metrics.heartRate || 0), 0) / 
        session.participants.filter(p => p.metrics.heartRate).length
      ) || 0
    : 0;

  const handleCardClick = () => {
    onClick?.(session.id);
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4",
        session.workoutType === 'strength' && "border-l-blue-500",
        session.workoutType === 'conditioning' && "border-l-red-500",
        session.workoutType === 'hybrid' && "border-l-purple-500",
        session.workoutType === 'agility' && "border-l-orange-500",
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", getWorkoutColor(session.workoutType))}>
              {getWorkoutIcon(session.workoutType)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{session.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {session.workoutType}
                </Badge>
                {session.equipment && (
                  <Badge variant="secondary" className="text-xs">
                    {session.equipment}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Badge className={cn("border", getStatusColor(session.status))}>
            {session.status === 'active' && <PlayCircle className="h-3 w-3 mr-1" />}
            {session.status === 'paused' && <PauseCircle className="h-3 w-3 mr-1" />}
            {session.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">{t('sessions.progress')}</span>
            <span className="font-medium">{session.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                session.workoutType === 'strength' && "bg-blue-500",
                session.workoutType === 'conditioning' && "bg-red-500",
                session.workoutType === 'hybrid' && "bg-purple-500",
                session.workoutType === 'agility' && "bg-orange-500"
              )}
              style={{ width: `${session.progress}%` }}
            />
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{activeParticipants} / {session.participants.length} active</span>
          </div>
          <div className="flex -space-x-2">
            {session.participants.slice(0, 4).map((participant, idx) => (
              <div
                key={participant.id}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white",
                  participant.status === 'connected' 
                    ? 'bg-green-500 text-white' 
                    : participant.status === 'paused'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                )}
                title={`${participant.playerName} (${participant.playerNumber})`}
              >
                {participant.playerNumber}
              </div>
            ))}
            {session.participants.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium border-2 border-white">
                +{session.participants.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(session.elapsedTime)} / {formatEstimatedTime(session.estimatedDuration)}</span>
          </div>
          {session.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{session.location}</span>
            </div>
          )}
        </div>

        {/* Current Phase & Metrics */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            <span className="font-medium">{t('sessions.currentPhase')}:</span> {session.currentPhase}
          </div>
          {averageHeartRate > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <Activity className="h-4 w-4" />
              <span>{averageHeartRate} bpm avg</span>
            </div>
          )}
        </div>

        {/* View Button */}
        <Button 
          className="w-full" 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          {t('sessions.viewSession')}
        </Button>
      </CardContent>
    </Card>
  );
};