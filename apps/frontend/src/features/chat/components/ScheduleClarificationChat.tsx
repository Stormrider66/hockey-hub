import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  CloudRain, 
  AlertTriangle,
  Users,
  CheckCircle,
  XCircle,
  BarChart3,
  Send,
  Plus,
  Navigation
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useGetClarificationQuery,
  useGetCarpoolOffersQuery,
  useGetPollsQuery,
  useUpdateClarificationStatusMutation,
} from '@/store/api/scheduleClarificationApi';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { CreateCarpoolOfferModal } from './CreateCarpoolOfferModal';
import { CarpoolOfferCard } from './CarpoolOfferCard';
import { AvailabilityPollCard } from './AvailabilityPollCard';
import { CreateAvailabilityPollModal } from './CreateAvailabilityPollModal';
import { WeatherAlert } from './WeatherAlert';
import { ConflictResolutionCard } from './ConflictResolutionCard';
import { format, parseISO } from 'date-fns';

interface ScheduleClarificationChatProps {
  clarificationId: string;
  eventId: string;
  conversationId: string;
  currentUserId: string;
  isCoordinator?: boolean;
}

export const ScheduleClarificationChat: React.FC<ScheduleClarificationChatProps> = ({
  clarificationId,
  eventId,
  conversationId,
  currentUserId,
  isCoordinator = false,
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [showCarpoolModal, setShowCarpoolModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);

  const {
    data: clarification,
    isLoading: clarificationLoading,
  } = useGetClarificationQuery(clarificationId);

  const {
    data: carpoolOffers,
    isLoading: carpoolLoading,
  } = useGetCarpoolOffersQuery({
    clarificationId,
  });

  const {
    data: polls,
    isLoading: pollsLoading,
  } = useGetPollsQuery({
    clarificationId,
  });

  const [updateStatus] = useUpdateClarificationStatusMutation();

  if (clarificationLoading) {
    return <div>Loading clarification details...</div>;
  }

  if (!clarification) {
    return <div>Clarification not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'escalated':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({
        id: clarificationId,
        status: newStatus,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const quickActions = [
    {
      label: 'Report Conflict',
      icon: AlertTriangle,
      action: () => setActiveTab('conflict'),
    },
    {
      label: 'Offer Carpool',
      icon: Car,
      action: () => setShowCarpoolModal(true),
    },
    {
      label: 'Create Poll',
      icon: BarChart3,
      action: () => setShowPollModal(true),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">{clarification.title}</h2>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(clarification.status)}>
              {clarification.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant={getPriorityColor(clarification.priority)}>
              {clarification.priority.toUpperCase()}
            </Badge>
          </div>
        </div>
        
        {/* Event Details Bar */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(parseISO(clarification.event_details.original_date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{clarification.event_details.original_time}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{clarification.event_details.original_location}</span>
          </div>
          {clarification.participant_ids && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{clarification.participant_ids.length} participants</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={action.action}
              className="flex items-center gap-1"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Weather Alert if applicable */}
      {clarification.type === 'weather_concern' && clarification.weather_info && (
        <WeatherAlert weatherInfo={clarification.weather_info} />
      )}

      {/* Conflict Alert if applicable */}
      {clarification.type === 'schedule_conflict' && clarification.conflict_details && (
        <ConflictResolutionCard
          conflictDetails={clarification.conflict_details}
          onResolve={(resolution) => {
            handleStatusChange('resolved');
          }}
          isCoordinator={isCoordinator}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="chat">Discussion</TabsTrigger>
          <TabsTrigger value="carpool">Carpool</TabsTrigger>
          <TabsTrigger value="polls">Polls</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col p-0">
          <div className="flex-1 flex flex-col">
            <MessageList 
              conversationId={conversationId}
              currentUserId={currentUserId}
            />
            <MessageInput
              conversationId={conversationId}
              currentUserId={currentUserId}
              placeholder="Type your message about the schedule..."
            />
          </div>
        </TabsContent>

        <TabsContent value="carpool" className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Carpool Arrangements</h3>
              <Button onClick={() => setShowCarpoolModal(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Offer Ride
              </Button>
            </div>

            {carpoolLoading ? (
              <div>Loading carpool offers...</div>
            ) : carpoolOffers && carpoolOffers.length > 0 ? (
              <div className="grid gap-4">
                {carpoolOffers.map((offer) => (
                  <CarpoolOfferCard
                    key={offer.id}
                    offer={offer}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Car className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No carpool offers yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Be the first to offer a ride!
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="polls" className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Availability Polls</h3>
              {isCoordinator && (
                <Button onClick={() => setShowPollModal(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Poll
                </Button>
              )}
            </div>

            {pollsLoading ? (
              <div>Loading polls...</div>
            ) : polls && polls.length > 0 ? (
              <div className="space-y-4">
                {polls.map((poll) => (
                  <AvailabilityPollCard
                    key={poll.id}
                    poll={poll}
                    currentUserId={currentUserId}
                    isCoordinator={isCoordinator}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No polls created</p>
                {isCoordinator && (
                  <p className="text-sm text-gray-500 mt-1">
                    Create a poll to gather availability
                  </p>
                )}
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="p-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clarification Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="text-sm">{clarification.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm">{clarification.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Initiated By</label>
                    <p className="text-sm">{clarification.initiated_by}</p>
                  </div>
                  {clarification.deadline && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Deadline</label>
                      <p className="text-sm">
                        {format(parseISO(clarification.deadline), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Proposed Changes */}
            {(clarification.event_details.proposed_date || 
              clarification.event_details.proposed_time || 
              clarification.event_details.proposed_location) && (
              <Card>
                <CardHeader>
                  <CardTitle>Proposed Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {clarification.event_details.proposed_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          New Date: {format(parseISO(clarification.event_details.proposed_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    {clarification.event_details.proposed_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          New Time: {clarification.event_details.proposed_time}
                        </span>
                      </div>
                    )}
                    {clarification.event_details.proposed_location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          New Location: {clarification.event_details.proposed_location}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Actions for Coordinators */}
            {isCoordinator && clarification.status !== 'resolved' && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => handleStatusChange('resolved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Resolved
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange('cancelled')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showCarpoolModal && (
        <CreateCarpoolOfferModal
          clarificationId={clarificationId}
          eventId={eventId}
          eventDate={clarification.event_details.original_date}
          onClose={() => setShowCarpoolModal(false)}
        />
      )}

      {showPollModal && (
        <CreateAvailabilityPollModal
          clarificationId={clarificationId}
          onClose={() => setShowPollModal(false)}
        />
      )}
    </div>
  );
};