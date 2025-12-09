'use client';

import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { 
  Users, 
  Activity, 
  Clock, 
  PlayCircle, 
  PauseCircle,
  Eye,
  Dumbbell,
  Heart,
  Zap,
  Target
} from 'lucide-react';
import { useLiveSession } from './LiveSessionProvider';
import { LiveSession } from './types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LiveSessionGridProps {
  onSessionClick?: (sessionId: string) => void;
  className?: string;
}

export const LiveSessionGrid: React.FC<LiveSessionGridProps> = ({ 
  onSessionClick,
  className 
}) => {
  const { sessions, connected, error, selectSession } = useLiveSession();

  const handleSessionClick = (session: LiveSession) => {
    selectSession(session.id);
    onSessionClick?.(session.id);
  };

  const getWorkoutIcon = (type: LiveSession['workoutType']) => {
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

  const getStatusColor = (status: LiveSession['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'paused':
        return 'text-yellow-600 bg-yellow-50';
      case 'preparing':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!connected) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <LoadingSpinner 
          size="xl" 
          variant="muted" 
          text="Connecting to live sessions..." 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No active sessions at the moment</p>
          <p className="text-sm text-gray-400 mt-2">
            Sessions will appear here when trainers start them
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {sessions.map((session) => {
        const activeParticipants = session.participants.filter(p => p.status === 'connected').length;
        const averageProgress = session.participants.length > 0
          ? Math.round(session.participants.reduce((sum, p) => sum + p.progress, 0) / session.participants.length)
          : 0;

        return (
          <Card 
            key={session.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleSessionClick(session)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getWorkoutIcon(session.workoutType)}
                  <CardTitle className="text-lg">{session.workoutName}</CardTitle>
                </div>
                <Badge className={cn("ml-2", getStatusColor(session.status))}>
                  {session.status === 'active' && <PlayCircle className="h-3 w-3 mr-1" />}
                  {session.status === 'paused' && <PauseCircle className="h-3 w-3 mr-1" />}
                  {session.status}
                </Badge>
              </div>
              <CardDescription className="mt-2">
                Led by {session.trainerName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Participants */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{activeParticipants} / {session.participants.length} active</span>
                  </div>
                  <div className="flex -space-x-2">
                    {session.participants.slice(0, 5).map((participant, idx) => (
                      <div
                        key={participant.id}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white",
                          participant.status === 'connected' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        )}
                        title={participant.playerName}
                      >
                        {participant.playerNumber}
                      </div>
                    ))}
                    {session.participants.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium border-2 border-white">
                        +{session.participants.length - 5}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Average Progress</span>
                    <span className="font-medium">{averageProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${averageProgress}%` }}
                    />
                  </div>
                </div>

                {/* Time and Phase */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(session.elapsedTime)}</span>
                  </div>
                  <span className="text-gray-600">{session.currentPhase}</span>
                </div>

                {/* View Button */}
                <Button 
                  className="w-full" 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSessionClick(session);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Live Session
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};