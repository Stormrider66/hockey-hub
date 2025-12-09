import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Megaphone,
  Pin,
  AlertCircle,
  Calendar,
  Users,
  Settings,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  useGetMessagesQuery,
  useGetPinnedAnnouncementsQuery,
  useMarkAsReadMutation,
  type Conversation,
  type Message,
} from '@/store/api/chatApi';
import { selectCurrentUser } from '@/store/slices/authSlice';
import AnnouncementPost from './AnnouncementPost';
import CreateAnnouncementModal from './CreateAnnouncementModal';
import AnnouncementChannelSettings from './AnnouncementChannelSettings';
import { LoadingSkeleton } from '@/components/ui/loading';
import { formatDistanceToNow } from 'date-fns';

interface AnnouncementChannelProps {
  conversation: Conversation;
  className?: string;
}

const AnnouncementChannel: React.FC<AnnouncementChannelProps> = ({
  conversation,
  className,
}) => {
  const currentUser = useSelector(selectCurrentUser);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [markAsRead] = useMarkAsReadMutation();

  // Fetch messages
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetMessagesQuery({
    conversationId: conversation.id,
    limit: 50,
  });

  // Fetch pinned announcements
  const {
    data: pinnedAnnouncements,
    isLoading: pinnedLoading,
  } = useGetPinnedAnnouncementsQuery(conversation.id);

  // Check if current user is a coach or moderator
  const isCoach = currentUser?.role === 'coach';
  const isModerator = conversation.metadata?.moderatorIds?.includes(currentUser?.id || '');
  const canPost = isCoach || isModerator;

  // Mark as read when viewing
  useEffect(() => {
    if (conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }
  }, [conversation.id, conversation.unreadCount, markAsRead]);

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach((message) => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const messageGroups = messagesData?.messages
    ? groupMessagesByDate(messagesData.messages)
    : {};

  if (messagesLoading || pinnedLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-4">
          <LoadingSkeleton className="h-8 w-48 mb-2" />
          <LoadingSkeleton className="h-4 w-full mb-4" />
          <LoadingSkeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {conversation.name}
                <Badge variant="secondary" className="text-xs">
                  Announcement Channel
                </Badge>
              </h2>
              {conversation.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {conversation.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {conversation.participants.length} members
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {formatDistanceToNow(new Date(conversation.createdAt))} ago
                </span>
              </div>
            </div>
          </div>

          {canPost && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCreateModal(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Announcement
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Channel Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={refetchMessages}>
                    Refresh
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Pinned Announcements */}
          {pinnedAnnouncements && pinnedAnnouncements.length > 0 && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Pinned Announcements
              </h3>
              <div className="space-y-3">
                {pinnedAnnouncements.map((announcement) => (
                  <AnnouncementPost
                    key={announcement.id}
                    message={announcement}
                    conversation={conversation}
                    isPinned
                    canManage={canPost}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Announcements */}
          <div className="space-y-6">
            {Object.entries(messageGroups).map(([date, messages]) => (
              <div key={date}>
                <div className="flex items-center gap-4 mb-4">
                  <Separator className="flex-1" />
                  <span className="text-sm text-muted-foreground px-2">
                    {date === new Date().toLocaleDateString() ? 'Today' :
                     date === new Date(Date.now() - 86400000).toLocaleDateString() ? 'Yesterday' :
                     date}
                  </span>
                  <Separator className="flex-1" />
                </div>
                
                <div className="space-y-4">
                  {messages
                    .filter(msg => !msg.isPinned) // Don't show pinned messages here
                    .map((message) => (
                      <AnnouncementPost
                        key={message.id}
                        message={message}
                        conversation={conversation}
                        canManage={canPost}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>

          {(!messagesData?.messages || messagesData.messages.length === 0) && (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-1">No announcements yet</p>
              <p className="text-sm text-muted-foreground">
                {canPost
                  ? "Create your first announcement to share important updates with the team."
                  : "Check back later for important team updates."}
              </p>
              {canPost && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4"
                  variant="outline"
                >
                  Create First Announcement
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Modals */}
      {showCreateModal && (
        <CreateAnnouncementModal
          conversation={conversation}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showSettings && (
        <AnnouncementChannelSettings
          conversation={conversation}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default AnnouncementChannel;