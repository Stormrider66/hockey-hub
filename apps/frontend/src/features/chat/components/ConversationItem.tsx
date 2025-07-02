import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { 
  VolumeX, 
  Pin, 
  Users, 
  User, 
  MessageSquare, 
  Image, 
  FileText, 
  Settings,
  CheckCheck,
  Check,
  Megaphone,
  Lock
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  selectTypingUsersForConversation,
  selectUserPresence,
  selectUnreadCount,
} from '@/store/slices/chatSlice';
import type { Conversation } from '@/store/api/chatApi';

interface ConversationItemProps {
  conversation: Conversation;
  displayName: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  displayName,
  isActive,
  onClick,
  className,
}) => {
  const typingUsers = useSelector(selectTypingUsersForConversation(conversation.id));
  const unreadCount = useSelector(selectUnreadCount(conversation.id));

  // Get avatar and presence info
  const { avatarSrc, avatarFallback, presenceStatus } = useMemo(() => {
    if (conversation.type === 'direct') {
      // For direct conversations, show the other participant's avatar and presence
      const currentUserId = localStorage.getItem('current_user_id') || 'current-user-id';
      const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
      const userPresence = useSelector(selectUserPresence(otherParticipant?.userId || ''));
      
      return {
        avatarSrc: otherParticipant?.user.avatar || conversation.avatar,
        avatarFallback: otherParticipant?.user.name.slice(0, 2).toUpperCase() || 'U',
        presenceStatus: userPresence?.status || 'offline',
      };
    } else if (conversation.type === 'private_coach_channel') {
      // For private coach channels, show a lock icon
      return {
        avatarSrc: null,
        avatarFallback: 'PC',
        presenceStatus: null,
      };
    } else {
      // For group conversations, show conversation avatar
      return {
        avatarSrc: conversation.avatar,
        avatarFallback: conversation.name?.slice(0, 2).toUpperCase() || 'G',
        presenceStatus: null,
      };
    }
  }, [conversation]);

  // Format last message
  const lastMessageDisplay = useMemo(() => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }

    const message = conversation.lastMessage;
    let content = '';

    switch (message.type) {
      case 'image':
        content = '📷 Image';
        break;
      case 'file':
        content = '📎 File';
        break;
      case 'system':
        content = message.content;
        break;
      case 'announcement':
        content = '📢 ' + message.content;
        break;
      default:
        content = message.content;
    }

    // Truncate long messages
    if (content.length > 50) {
      content = content.substring(0, 50) + '...';
    }

    return content;
  }, [conversation.lastMessage]);

  // Format timestamp
  const timestampDisplay = useMemo(() => {
    if (!conversation.lastMessage) {
      return formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true });
    }

    const messageDate = new Date(conversation.lastMessage.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, [conversation.lastMessage, conversation.createdAt]);

  // Conversation type icon
  const ConversationTypeIcon = () => {
    switch (conversation.type) {
      case 'group':
        return <Users className="h-3 w-3" />;
      case 'team':
        return <Users className="h-3 w-3" />;
      case 'broadcast':
        return <MessageSquare className="h-3 w-3" />;
      case 'announcement':
        return <Megaphone className="h-3 w-3" />;
      case 'private_coach_channel':
        return <Lock className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  // Presence indicator
  const PresenceIndicator = () => {
    if (!presenceStatus || conversation.type !== 'direct') return null;

    return (
      <div
        className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
          presenceStatus === 'online' && "bg-green-500",
          presenceStatus === 'away' && "bg-yellow-500",
          presenceStatus === 'offline' && "bg-gray-400"
        )}
      />
    );
  };

  // Message status indicator
  const MessageStatusIcon = () => {
    const currentUserId = localStorage.getItem('current_user_id') || 'current-user-id';
    if (!conversation.lastMessage || conversation.lastMessage.senderId === currentUserId) {
      return null;
    }

    // Show read receipts for own messages
    const readReceipts = conversation.lastMessage.readReceipts || [];
    const allParticipantsRead = conversation.participants
      .filter(p => p.userId !== conversation.lastMessage?.senderId)
      .every(p => readReceipts.some(r => r.userId === p.userId));

    if (allParticipantsRead) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else if (readReceipts.length > 0) {
      return <Check className="h-3 w-3 text-gray-500" />;
    }

    return null;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150",
        "hover:bg-muted/50 active:bg-muted/70",
        isActive && "bg-primary/10 border border-primary/20",
        unreadCount > 0 && !isActive && "bg-muted/30",
        className
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className={cn(
          "h-12 w-12",
          conversation.type === 'announcement' && "bg-primary/10"
        )}>
          {conversation.type === 'announcement' ? (
            <AvatarFallback className="bg-primary/10">
              <Megaphone className="h-6 w-6 text-primary" />
            </AvatarFallback>
          ) : conversation.type === 'private_coach_channel' ? (
            <AvatarFallback className="bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage src={avatarSrc} alt={displayName} />
              <AvatarFallback className="text-sm font-medium">
                {avatarFallback}
              </AvatarFallback>
            </>
          )}
        </Avatar>
        <PresenceIndicator />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className={cn(
              "font-medium text-sm truncate",
              unreadCount > 0 && "font-semibold"
            )}>
              {displayName}
            </h3>
            
            {/* Conversation type and indicators */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <ConversationTypeIcon />
              
              {/* Muted indicator */}
              {conversation.participants.some(p => p.isMuted) && (
                <VolumeX className="h-3 w-3 text-muted-foreground" />
              )}
              
              {/* Pinned indicator */}
              {/* TODO: Add pinned property to conversation model */}
              {/* {conversation.isPinned && (
                <Pin className="h-3 w-3 text-primary" />
              )} */}
            </div>
          </div>

          {/* Timestamp */}
          <span className={cn(
            "text-xs text-muted-foreground flex-shrink-0",
            unreadCount > 0 && "text-primary font-medium"
          )}>
            {timestampDisplay}
          </span>
        </div>

        {/* Last message or typing indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {typingUsers.length > 0 ? (
              <div className="flex items-center gap-1">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-xs text-primary font-medium">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].userName} is typing` 
                    : `${typingUsers.length} people are typing`
                  }
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 min-w-0">
                <MessageStatusIcon />
                <p className={cn(
                  "text-xs text-muted-foreground truncate",
                  unreadCount > 0 && "font-medium text-foreground"
                )}>
                  {lastMessageDisplay}
                </p>
              </div>
            )}
          </div>

          {/* Unread count */}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="h-5 min-w-[20px] px-1.5 text-xs font-medium"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;