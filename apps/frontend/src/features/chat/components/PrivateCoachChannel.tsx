import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  Lock,
  MessageSquare,
  Phone,
  Video,
  UserCheck,
  Users,
  AlertCircle,
  Info,
  CalendarPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useAppSelector } from '@/store/hooks';
import { CreateMeetingRequestModal } from './CreateMeetingRequestModal';
import { CoachAvailabilityDisplay } from './CoachAvailabilityDisplay';
import { MeetingRequestsList } from './MeetingRequestsList';

interface PrivateCoachChannelProps {
  conversationId: string;
  conversation: any;
}

export const PrivateCoachChannel: React.FC<PrivateCoachChannelProps> = ({
  conversationId,
  conversation,
}) => {
  const [activeTab, setActiveTab] = useState('messages');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [coachAvailability, setCoachAvailability] = useState<any[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<any[]>([]);
  
  const currentUser = useAppSelector((state) => state.auth.user);
  const isParent = currentUser?.role === 'parent';
  const isCoach = currentUser?.role === 'coach';

  const playerName = conversation?.metadata?.playerName || 'Player';
  const teamName = conversation?.metadata?.teamName || 'Team';

  useEffect(() => {
    // Fetch coach availability
    if (conversation?.metadata?.coachIds?.length > 0) {
      fetchCoachAvailability();
    }
    // Fetch meeting requests
    fetchMeetingRequests();
  }, [conversationId]);

  const fetchCoachAvailability = async () => {
    try {
      const response = await fetch(
        `/api/private-coach-channels/team/${conversation.metadata.teamId}/coaches/availability`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCoachAvailability(data);
      }
    } catch (error) {
      console.error('Failed to fetch coach availability:', error);
    }
  };

  const fetchMeetingRequests = async () => {
    try {
      const response = await fetch(
        `/api/private-coach-channels/conversation/${conversationId}/meeting-requests`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMeetingRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch meeting requests:', error);
    }
  };

  const getParticipantInfo = () => {
    const coaches = conversation?.participants?.filter(
      (p: any) => conversation.metadata?.coachIds?.includes(p.user_id)
    ) || [];
    
    return { coaches };
  };

  const { coaches } = getParticipantInfo();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
              <Badge 
                className="absolute -bottom-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                variant="secondary"
              >
                <UserCheck className="h-3 w-3" />
              </Badge>
            </div>
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                Private Coach Channel - {playerName}
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-3 w-3" />
                {coaches.length} coach{coaches.length !== 1 ? 'es' : ''} • {teamName}
              </p>
            </div>
          </div>
          
          {isParent && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMeetingModal(true)}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-3 p-2 bg-muted/50 rounded-md flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            This is a private channel between you and your {isParent ? "child's coaches" : "player's parent"}. 
            All communications are confidential and only visible to participants.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Calendar className="h-4 w-4 mr-2" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="availability">
            <Clock className="h-4 w-4 mr-2" />
            Availability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="flex-1 flex flex-col mt-0">
          <div className="flex-1 flex flex-col">
            <MessageList conversationId={conversationId} />
            <MessageInput 
              conversationId={conversationId} 
              placeholder="Send a private message to coaches..."
            />
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="flex-1 overflow-auto p-4">
          <MeetingRequestsList 
            requests={meetingRequests}
            isCoach={isCoach}
            onUpdate={fetchMeetingRequests}
          />
        </TabsContent>

        <TabsContent value="availability" className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coach Office Hours</CardTitle>
                <CardDescription>
                  View when coaches are available for meetings and discussions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CoachAvailabilityDisplay 
                  availability={coachAvailability}
                  coaches={coaches}
                />
              </CardContent>
            </Card>

            {isParent && (
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Need to schedule a meeting?</p>
                      <p className="text-sm text-muted-foreground">
                        Request a meeting during available office hours
                      </p>
                    </div>
                    <Button onClick={() => setShowMeetingModal(true)}>
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Request Meeting
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Meeting Request Modal */}
      {showMeetingModal && (
        <CreateMeetingRequestModal
          conversationId={conversationId}
          coaches={coaches}
          playerId={conversation.metadata?.playerId}
          onClose={() => setShowMeetingModal(false)}
          onSuccess={() => {
            setShowMeetingModal(false);
            fetchMeetingRequests();
          }}
        />
      )}
    </div>
  );
};