import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  MessageSquare,
  UserCheck,
  Baby,
  MoreVertical,
  Archive,
  UserPlus,
  MessageCircle,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  useGetEventConversationsForEventQuery,
  useArchiveEventConversationMutation,
  EventConversation,
} from '@/store/api/eventConversationApi';

interface EventConversationListProps {
  eventId: string;
  eventTitle?: string;
  onOpenChat?: (conversationId: string) => void;
  onAddParticipants?: (eventConversationId: string) => void;
  className?: string;
}

const EventConversationList: React.FC<EventConversationListProps> = ({
  eventId,
  eventTitle,
  onOpenChat,
  onAddParticipants,
  className = '',
}) => {
  const { data: conversationsData, isLoading, refetch } = useGetEventConversationsForEventQuery(eventId);
  const [archiveConversation, { isLoading: isArchiving }] = useArchiveEventConversationMutation();

  const conversations = conversationsData?.data || [];
  const activeConversations = conversations.filter(conv => conv.status === 'active');

  const handleArchiveConversation = async (eventConversationId: string, conversationName: string) => {
    try {
      await archiveConversation(eventConversationId).unwrap();
      toast.success(`"${conversationName}" has been archived`);
      refetch();
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to archive conversation');
    }
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'all_participants':
        return <Users className="w-4 h-4" />;
      case 'coaches_only':
        return <UserCheck className="w-4 h-4" />;
      case 'players_only':
        return <MessageSquare className="w-4 h-4" />;
      case 'parents_only':
        return <Baby className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getScopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      all_participants: 'All Participants',
      coaches_only: 'Coaches Only',
      players_only: 'Players Only',
      parents_only: 'Parents Only',
      custom: 'Custom',
    };
    return labels[scope] || scope;
  };

  const getScopeBadgeVariant = (scope: string) => {
    switch (scope) {
      case 'all_participants':
        return 'default';
      case 'coaches_only':
        return 'secondary';
      case 'players_only':
        return 'outline';
      case 'parents_only':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="space-y-2">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (activeConversations.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No Event Chats</h3>
        <p className="text-muted-foreground mb-4">
          Create a chat to discuss this event with participants.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Event Chats</h3>
        <Badge variant="outline" className="text-xs">
          {activeConversations.length} active
        </Badge>
      </div>

      <div className="space-y-3">
        {activeConversations.map((conversation) => (
          <ConversationCard
            key={conversation.id}
            conversation={conversation}
            onOpenChat={onOpenChat}
            onAddParticipants={onAddParticipants}
            onArchive={handleArchiveConversation}
            isArchiving={isArchiving}
            getScopeIcon={getScopeIcon}
            getScopeLabel={getScopeLabel}
            getScopeBadgeVariant={getScopeBadgeVariant}
          />
        ))}
      </div>
    </div>
  );
};

interface ConversationCardProps {
  conversation: EventConversation;
  onOpenChat?: (conversationId: string) => void;
  onAddParticipants?: (eventConversationId: string) => void;
  onArchive: (eventConversationId: string, conversationName: string) => void;
  isArchiving: boolean;
  getScopeIcon: (scope: string) => React.ReactNode;
  getScopeLabel: (scope: string) => string;
  getScopeBadgeVariant: (scope: string) => "default" | "secondary" | "outline" | "destructive";
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onOpenChat,
  onAddParticipants,
  onArchive,
  isArchiving,
  getScopeIcon,
  getScopeLabel,
  getScopeBadgeVariant,
}) => {
  const lastActivity = conversation.lastActivity
    ? formatDistanceToNow(new Date(conversation.lastActivity), { addSuffix: true })
    : 'No activity';

  const eventDate = conversation.eventDetails?.startTime
    ? new Date(conversation.eventDetails.startTime)
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getScopeIcon(conversation.scope)}
            <div>
              <CardTitle className="text-base">
                {conversation.conversation?.name || `${getScopeLabel(conversation.scope)} Chat`}
              </CardTitle>
              <Badge
                variant={getScopeBadgeVariant(conversation.scope)}
                className="text-xs mt-1"
              >
                {getScopeLabel(conversation.scope)}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onOpenChat?.(conversation.conversation_id)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Open Chat
              </DropdownMenuItem>
              
              {onAddParticipants && (
                <DropdownMenuItem
                  onClick={() => onAddParticipants(conversation.id)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Participants
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => onArchive(conversation.id, conversation.conversation?.name || 'Chat')}
                disabled={isArchiving}
                className="text-destructive"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent
        className="pt-0"
        onClick={() => onOpenChat?.(conversation.conversation_id)}
      >
        {conversation.conversation?.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {conversation.conversation.description}
          </p>
        )}

        {/* Event Details */}
        {conversation.eventDetails && (
          <div className="space-y-2 mb-3 p-2 bg-muted/30 rounded-md">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              {eventDate && (
                <span>
                  {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            
            {conversation.eventDetails.location && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{conversation.eventDetails.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Statistics */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>{conversation.participantCount || 0}</span>
            </div>
            
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              <span>{conversation.messageCount || 0}</span>
            </div>
          </div>

          <div className="flex items-center text-xs">
            <Clock className="w-3 h-3 mr-1" />
            <span>{lastActivity}</span>
          </div>
        </div>

        {/* Settings Overview */}
        {conversation.settings && (
          <div className="flex flex-wrap gap-1 mt-3">
            {conversation.settings.moderatedMode && (
              <Badge variant="outline" className="text-xs">
                Moderated
              </Badge>
            )}
            {conversation.settings.autoArchiveAfterEvent && (
              <Badge variant="outline" className="text-xs">
                Auto-archive
              </Badge>
            )}
            {conversation.settings.notifyOnEventChanges && (
              <Badge variant="outline" className="text-xs">
                Event updates
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventConversationList;