'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Play,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CalendarEvent,
  EventType,
  ParticipantStatus,
  useUpdateParticipantStatusMutation,
  useDeleteEventMutation,
} from '@/store/api/calendarApi';
import { toast } from 'react-hot-toast';
import { PlayerWorkoutLauncher } from '@/features/player/components/PlayerWorkoutLauncher';
import { PlayerWorkoutPreview } from '@/features/player/components/PlayerWorkoutPreview';
import { useRouter } from 'next/navigation';
import { LiveSessionIndicator } from './LiveSessionIndicator';
import { useCalendarLiveUpdates } from '../hooks/useCalendarLiveUpdates';

interface EventDetailsModalProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userRole: string;
}

const eventTypeLabels: Record<EventType, string> = {
  [EventType.TRAINING]: 'Training',
  [EventType.GAME]: 'Game',
  [EventType.MEETING]: 'Meeting',
  [EventType.MEDICAL]: 'Medical Appointment',
  [EventType.EQUIPMENT]: 'Equipment Session',
  [EventType.TEAM_EVENT]: 'Team Event',
  [EventType.PERSONAL]: 'Personal',
  [EventType.OTHER]: 'Other',
  [EventType.PRACTICE]: 'Practice',
  [EventType.WORKOUT_SESSION]: 'Workout Session',
};

const participantStatusIcons = {
  [ParticipantStatus.ACCEPTED]: <CheckCircle className="h-4 w-4 text-green-500" />,
  [ParticipantStatus.DECLINED]: <XCircle className="h-4 w-4 text-red-500" />,
  [ParticipantStatus.TENTATIVE]: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  [ParticipantStatus.PENDING]: <AlertCircle className="h-4 w-4 text-gray-500" />,
  [ParticipantStatus.NO_RESPONSE]: <User className="h-4 w-4 text-gray-400" />,
};

export default function EventDetailsModal({
  event,
  isOpen,
  onClose,
  userId,
  userRole,
}: EventDetailsModalProps) {
  const [responseMessage, setResponseMessage] = useState('');
  const [updateParticipantStatus] = useUpdateParticipantStatusMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const router = useRouter();
  
  // Get live updates hook (organizationId would come from context in real app)
  const { emitSessionStarted } = useCalendarLiveUpdates({
    organizationId: event.organizationId || 'default',
    teamId: event.teamId,
    userId,
  });

  const userParticipant: any = (event as any).participants?.find((p: any) => (p.userId ?? p.participantId) === userId);
  const isOrganizer = event.createdBy === userId;
  const canEdit = isOrganizer || userRole === 'admin' || userRole === 'coach';

  const handleRSVP = async (status: ParticipantStatus) => {
    if (!userParticipant) return;

    try {
      await updateParticipantStatus({
        eventId: event.id,
        participantId: userId,
        status,
      }).unwrap();
      toast.success('Your response has been recorded');
      setResponseMessage('');
    } catch (error) {
      toast.error('Failed to update your response');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEvent(event.id).unwrap();
      toast.success('Event deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const participantArray: any[] = (event as any).participants || (event as any).participants_details || [];
  const acceptedCount = participantArray.filter(
    (p: any) => (p.status || p.participationStatus || '').toString().toLowerCase() === 'accepted'
  ).length || 0;

  const totalParticipants = participantArray.length || 0;

  const notesText: string | undefined = (event as any).notes ?? event.description;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{event.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {eventTypeLabels[event.type]}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {eventTypeLabels[event.type]}
                </Badge>
                {event.isLive && (
                  <LiveSessionIndicator
                    isLive={event.isLive}
                    progress={event.currentProgress}
                    participantCount={event.activeParticipants}
                    currentActivity={event.currentActivity}
                    compact
                  />
                )}
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className={cn(
            "grid w-full",
            event.type === EventType.TRAINING && event.metadata?.workoutId && userRole === 'player'
              ? "grid-cols-4"
              : "grid-cols-3"
          )}>
            <TabsTrigger value="details">Details</TabsTrigger>
            {event.type === EventType.TRAINING && event.metadata?.workoutId && userRole === 'player' && (
              <TabsTrigger value="workout">Workout</TabsTrigger>
            )}
            <TabsTrigger value="participants">
              Participants ({acceptedCount}/{totalParticipants})
            </TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(event.startTime), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(event.startTime), 'h:mm a')} -{' '}
                  {format(new Date(event.endTime), 'h:mm a')}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.onlineUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={event.onlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Join Online
                  </a>
                </div>
              )}
            </div>

            {event.description && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Live Session Info */}
            {event.isLive && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Live Training Session</h4>
                <LiveSessionIndicator
                  isLive={event.isLive}
                  progress={event.currentProgress}
                  participantCount={event.activeParticipants}
                  currentActivity={event.currentActivity}
                />
                
                {/* Join Live Session Button */}
                {userRole === 'player' && event.metadata?.workoutId && (
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        const meta = event.metadata as any;
                        emitSessionStarted(event.id, (meta?.workoutType as any) || 'strength');
                        const workoutType = (meta?.workoutType as any) || 'strength';
                        const routes: Record<string, string> = {
                          strength: `/player/workout/${meta?.workoutId}`,
                          conditioning: `/player/workout/conditioning/${meta?.workoutId}`,
                          hybrid: `/player/workout/hybrid/${meta?.workoutId}`,
                          agility: `/player/workout/agility/${meta?.workoutId}`,
                        };
                        router.push(routes[workoutType] || routes.strength);
                      }}
                      className="w-full"
                      size="lg"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Join Live Session
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Workout Launch (when not live) */}
            {event.type === EventType.TRAINING && event.metadata?.workoutId && userRole === 'player' && !event.isLive && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Training Session
                </h4>
                <div className="space-y-3">
                  <PlayerWorkoutLauncher
                    eventId={event.id}
                    eventTitle={event.title}
                    metadata={event.metadata as any}
                    startTime={event.startTime}
                    location={event.location || 'Training Center'}
                  />
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {event.metadata?.workoutPreview?.duration && (
                      <span>Duration: {event.metadata?.workoutPreview?.duration}</span>
                    )}
                    {event.metadata?.workoutPreview?.intensity && (
                      <span className="capitalize">Intensity: {event.metadata?.workoutPreview?.intensity}</span>
                    )}
                    {event.metadata?.workoutPreview?.estimatedCalories && (
                      <span>~{event.metadata?.workoutPreview?.estimatedCalories} cal</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 View the "Workout" tab for detailed preview and equipment requirements
                  </p>
                </div>
              </div>
            )}

            {userParticipant && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Your Response</h4>
                <div className="flex gap-2 mb-3">
                  <Button
                    size="sm"
                    variant={(userParticipant?.status as ParticipantStatus) === ParticipantStatus.ACCEPTED ? 'default' : 'outline'}
                    onClick={() => handleRSVP(ParticipantStatus.ACCEPTED)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant={(userParticipant?.status as ParticipantStatus) === ParticipantStatus.TENTATIVE ? 'default' : 'outline'}
                    onClick={() => handleRSVP(ParticipantStatus.TENTATIVE)}
                  >
                    Maybe
                  </Button>
                  <Button
                    size="sm"
                    variant={(userParticipant?.status as ParticipantStatus) === ParticipantStatus.DECLINED ? 'default' : 'outline'}
                    onClick={() => handleRSVP(ParticipantStatus.DECLINED)}
                  >
                    Decline
                  </Button>
                </div>
                <Textarea
                  placeholder="Add a message (optional)"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </TabsContent>

          {/* Dedicated Workout Tab for Players */}
          {event.type === EventType.TRAINING && event.metadata?.workoutId && userRole === 'player' && (
            <TabsContent value="workout" className="space-y-4">
              <PlayerWorkoutPreview
                metadata={event.metadata as any}
                eventTitle={event.title}
                location={event.location}
                startTime={event.startTime}
              />
              
              {/* Enhanced Launch Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Ready to Start?</h4>
                  {event.isLive ? (
                    <Badge variant="destructive" className="animate-pulse">
                      <div className="h-2 w-2 bg-white rounded-full mr-2" />
                      Live Session
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Scheduled</Badge>
                  )}
                </div>
                
                {event.isLive ? (
                  <Button
                    onClick={() => {
                      const meta = event.metadata as any;
                      emitSessionStarted(event.id, (meta?.workoutType as any) || 'strength');
                      const workoutType = (meta?.workoutType as any) || 'strength';
                      const routes: Record<string, string> = {
                        strength: `/player/workout/${meta?.workoutId}`,
                        STRENGTH: `/player/workout/${meta?.workoutId}`,
                        conditioning: `/player/workout/conditioning/${meta?.workoutId}`,
                        CONDITIONING: `/player/workout/conditioning/${meta?.workoutId}`,
                        hybrid: `/player/workout/hybrid/${meta?.workoutId}`,
                        HYBRID: `/player/workout/hybrid/${meta?.workoutId}`,
                        agility: `/player/workout/agility/${meta?.workoutId}`,
                        AGILITY: `/player/workout/agility/${meta?.workoutId}`,
                      };
                      router.push(routes[workoutType] || routes.strength);
                    }}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Join Live Session
                  </Button>
                ) : (
                  <PlayerWorkoutLauncher
                    eventId={event.id}
                    eventTitle={event.title}
                    metadata={event.metadata as any}
                    startTime={event.startTime}
                    location={event.location || 'Training Center'}
                  />
                )}
                
                {/* Additional Information */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Before You Start:</p>
                      <ul className="text-xs space-y-1">
                        <li>• Ensure all required equipment is available</li>
                        <li>• Complete a proper warm-up if not included</li>
                        <li>• Have water and towel ready</li>
                        {event.metadata?.targetMetrics?.heartRateZone && (
                          <li>• Monitor heart rate: {event.metadata?.targetMetrics?.heartRateZone}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="participants">
            <div className="space-y-2">
              {/* Live participant indicator */}
              {event.isLive && (event.activeParticipants || 0) > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-sm font-medium text-green-700">
                      {event.activeParticipants} participants currently in session
                    </p>
                  </div>
                </div>
              )}
              
              {participantArray.map((participant: any, index: number) => {
                // Mock check if participant is in live session (would come from WebSocket in real app)
                const isInLiveSession = event.isLive && Math.random() > 0.5;
                
                return (
                  <div
                    key={(participant.userId ?? participant.participantId) || `participant-${index}`}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      isInLiveSession ? "bg-green-50 border border-green-200" : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(String(participant.userId ?? participant.participantId)).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isInLiveSession && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          User {(String(participant.userId ?? participant.participantId)).slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-2">
                          {participant.isOrganizer && (
                            <Badge variant="secondary" className="text-xs">
                              Organizer
                            </Badge>
                          )}
                          {isInLiveSession && (
                            <Badge variant="outline" className="text-xs text-green-700">
                              In Session
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {participantStatusIcons[(participant.status as ParticipantStatus) || ParticipantStatus.NO_RESPONSE]}
                      <span className="text-xs text-muted-foreground">
                        {String(participant.status || 'no_response').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-4">
              {notesText ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {notesText}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No notes for this event.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}