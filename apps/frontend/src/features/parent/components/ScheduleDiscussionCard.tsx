import React, { useState } from 'react';
import { Calendar, MessageSquare, Car, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetClarificationsQuery, ScheduleConflictModal } from '@/features/chat';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface ScheduleDiscussionCardProps {
  teamId: string;
  userId: string;
  organizationId: string;
}

export const ScheduleDiscussionCard: React.FC<ScheduleDiscussionCardProps> = ({
  teamId,
  userId,
  organizationId,
}) => {
  const router = useRouter();
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { data: clarifications, isLoading } = useGetClarificationsQuery({
    teamId,
    participantId: userId,
    status: 'open',
  });

  const openDiscussion = (clarificationId: string, conversationId: string) => {
    router.push(`/chat?conversation=${conversationId}&clarification=${clarificationId}`);
  };

  const reportConflict = (event: any) => {
    setSelectedEvent(event);
    setShowConflictModal(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'schedule_conflict':
        return AlertTriangle;
      case 'transportation_coordination':
        return Car;
      default:
        return Calendar;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'schedule_conflict':
        return 'destructive';
      case 'weather_concern':
        return 'warning';
      case 'transportation_coordination':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeClarifications = clarifications || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Schedule Discussions</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => reportConflict(null)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Report Issue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeClarifications.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">No active schedule discussions</p>
              <p className="text-sm text-gray-500 mt-1">
                Report conflicts or coordinate transportation here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeClarifications.slice(0, 3).map((clarification) => {
                const Icon = getTypeIcon(clarification.type);
                return (
                  <div
                    key={clarification.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openDiscussion(clarification.id, clarification.conversation_id)}
                  >
                    <div className={`p-2 rounded-lg bg-${getTypeColor(clarification.type)}-100`}>
                      <Icon className={`h-4 w-4 text-${getTypeColor(clarification.type)}-600`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{clarification.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {clarification.event_details.event_name} • {' '}
                        {format(parseISO(clarification.event_details.original_date), 'MMM d')}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getTypeColor(clarification.type)} className="text-xs">
                          {clarification.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {clarification.message_count || 0} messages
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {activeClarifications.length > 3 && (
                <Button
                  variant="link"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/parent/schedule-discussions')}
                >
                  View all {activeClarifications.length} discussions
                </Button>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <h5 className="text-sm font-medium mb-2">Quick Actions</h5>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEvent(null);
                  setShowConflictModal(true);
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Report Conflict
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/parent/carpool')}
              >
                <Car className="h-4 w-4 mr-1" />
                Find Carpool
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showConflictModal && (
        <ScheduleConflictModal
          eventId={selectedEvent?.id || ''}
          eventDetails={selectedEvent || {
            name: 'Select Event',
            date: new Date(),
            time: '',
            location: '',
            type: 'practice',
          }}
          organizationId={organizationId}
          teamId={teamId}
          currentUserId={userId}
          onClose={() => {
            setShowConflictModal(false);
            setSelectedEvent(null);
          }}
          onSuccess={(clarificationId) => {
            // Optionally navigate to the new discussion
            console.log('Created clarification:', clarificationId);
          }}
        />
      )}
    </>
  );
};