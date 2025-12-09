'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading';
import { 
  ArrowLeft,
  Users, 
  Activity, 
  Clock, 
  PlayCircle, 
  PauseCircle,
  Grid3X3,
  List,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { useLiveSession } from './LiveSessionProvider';
import { LiveMetricsPanel } from './LiveMetricsPanel';
import { ParticipantProgress } from './ParticipantProgress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SessionSpectatorViewProps {
  sessionId?: string;
  onBack?: () => void;
  className?: string;
}

export const SessionSpectatorView: React.FC<SessionSpectatorViewProps> = ({ 
  sessionId,
  onBack,
  className 
}) => {
  const { selectedSession, clearSelection } = useLiveSession();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'focus'>('grid');
  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const session = selectedSession;

  if (!session) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <LoadingSpinner 
            size="xl" 
            variant="muted" 
            text="No session selected" 
            center={false}
          />
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    clearSelection();
    onBack?.();
  };

  const activeParticipants = session.participants.filter(p => p.status === 'connected');
  const averageProgress = session.participants.length > 0
    ? Math.round(session.participants.reduce((sum, p) => sum + p.progress, 0) / session.participants.length)
    : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: typeof session.status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'preparing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl">{session.workoutName}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Led by {session.trainerName} • Started {format(new Date(session.startTime), 'h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-white", getStatusColor(session.status))}>
                {session.status === 'active' && <PlayCircle className="h-3 w-3 mr-1" />}
                {session.status === 'paused' && <PauseCircle className="h-3 w-3 mr-1" />}
                {session.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(autoRefresh && "bg-blue-50")}
              >
                <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Participants</p>
                <p className="font-semibold">{activeParticipants.length} / {session.participants.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{formatDuration(session.elapsedTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Current Phase</p>
                <p className="font-semibold">{session.currentPhase}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-full">
                <p className="text-sm text-gray-600 mb-1">Average Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${averageProgress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{averageProgress}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="grid">
              <Grid3X3 className="h-4 w-4 mr-2" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="focus">
              <Maximize2 className="h-4 w-4 mr-2" />
              Focus View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Participants View */}
      <div>
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {session.participants.map((participant) => (
              <ParticipantProgress
                key={participant.id}
                participant={participant}
                onClick={() => {
                  setFocusedParticipantId(participant.id);
                  setViewMode('focus');
                }}
              />
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {session.participants.map((participant) => (
                  <div 
                    key={participant.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setFocusedParticipantId(participant.id);
                      setViewMode('focus');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                          participant.status === 'connected' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        )}>
                          {participant.playerNumber}
                        </div>
                        <div>
                          <p className="font-medium">{participant.playerName}</p>
                          <p className="text-sm text-gray-600">{participant.teamName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <LiveMetricsPanel 
                          metrics={participant.metrics} 
                          compact 
                        />
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Progress</p>
                          <p className="font-semibold">{participant.progress}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {viewMode === 'focus' && focusedParticipantId && (
          <div className="space-y-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Participants
            </Button>
            {session.participants
              .filter(p => p.id === focusedParticipantId)
              .map((participant) => (
                <div key={participant.id} className="space-y-4">
                  <ParticipantProgress
                    participant={participant}
                    expanded
                  />
                  <LiveMetricsPanel 
                    metrics={participant.metrics} 
                    detailed 
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};