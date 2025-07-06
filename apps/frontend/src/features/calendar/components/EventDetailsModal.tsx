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
} from 'lucide-react';
import { format } from 'date-fns';
import {
  CalendarEvent,
  EventType,
  ParticipantStatus,
  useUpdateParticipantStatusMutation,
  useDeleteEventMutation,
} from '@/store/api/calendarApi';
import { toast } from 'react-hot-toast';

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

  const userParticipant = event.participants?.find(p => p.participantId === userId);
  const isOrganizer = event.createdBy === userId;
  const canEdit = isOrganizer || userRole === 'admin' || userRole === 'coach';

  const handleRSVP = async (status: ParticipantStatus) => {
    if (!userParticipant) return;

    try {
      await updateParticipantStatus({
        eventId: event.id,
        participantId: userId,
        data: { status, responseMessage },
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

  const acceptedCount = event.participants?.filter(
    p => p.status === ParticipantStatus.ACCEPTED
  ).length || 0;

  const totalParticipants = event.participants?.length || 0;

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
              <Badge variant="secondary" className="mt-2">
                {eventTypeLabels[event.type]}
              </Badge>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
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

            {userParticipant && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Your Response</h4>
                <div className="flex gap-2 mb-3">
                  <Button
                    size="sm"
                    variant={userParticipant.status === ParticipantStatus.ACCEPTED ? 'default' : 'outline'}
                    onClick={() => handleRSVP(ParticipantStatus.ACCEPTED)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant={userParticipant.status === ParticipantStatus.TENTATIVE ? 'default' : 'outline'}
                    onClick={() => handleRSVP(ParticipantStatus.TENTATIVE)}
                  >
                    Maybe
                  </Button>
                  <Button
                    size="sm"
                    variant={userParticipant.status === ParticipantStatus.DECLINED ? 'default' : 'outline'}
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

          <TabsContent value="participants">
            <div className="space-y-2">
              {event.participants?.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {participant.participantId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        User {participant.participantId.slice(0, 8)}
                      </p>
                      {participant.isOrganizer && (
                        <Badge variant="secondary" className="text-xs">
                          Organizer
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {participantStatusIcons[participant.status]}
                    <span className="text-xs text-muted-foreground">
                      {participant.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-4">
              {event.notes ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.notes}
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