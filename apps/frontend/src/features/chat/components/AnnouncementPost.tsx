import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Pin,
  PinOff,
  AlertCircle,
  AlertTriangle,
  Eye,
  Heart,
  ThumbsUp,
  MessageCircle,
  Smile,
  MoreVertical,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useTogglePinAnnouncementMutation,
  useReactToAnnouncementMutation,
  useGetAnnouncementReadReceiptsQuery,
  type Message,
  type Conversation,
} from '@/store/api/chatApi';
import { selectCurrentUser } from '@/store/slices/authSlice';
import MessageContent from './MessageContent';
import ReactionPicker from './ReactionPicker';
import { formatDistanceToNow } from 'date-fns';

interface AnnouncementPostProps {
  message: Message;
  conversation: Conversation;
  isPinned?: boolean;
  canManage?: boolean;
  compact?: boolean;
  className?: string;
}

const AnnouncementPost: React.FC<AnnouncementPostProps> = ({
  message,
  conversation,
  isPinned = false,
  canManage = false,
  compact = false,
  className,
}) => {
  const currentUser = useSelector(selectCurrentUser);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReadReceipts, setShowReadReceipts] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  const [togglePin] = useTogglePinAnnouncementMutation();
  const [reactToAnnouncement] = useReactToAnnouncementMutation();

  // Fetch read receipts if expanded
  const { data: readReceipts } = useGetAnnouncementReadReceiptsQuery(
    message.id,
    { skip: !showReadReceipts || !canManage }
  );

  // Get priority icon and color
  const getPriorityIcon = () => {
    switch (message.metadata?.priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      case 'important':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPriorityColor = () => {
    switch (message.metadata?.priority) {
      case 'urgent':
        return 'destructive';
      case 'important':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Handle pin toggle
  const handleTogglePin = async () => {
    try {
      await togglePin({
        conversationId: conversation.id,
        messageId: message.id,
      }).unwrap();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  // Handle reaction
  const handleReaction = async (emoji: string) => {
    try {
      await reactToAnnouncement({
        conversationId: conversation.id,
        messageId: message.id,
        emoji,
      }).unwrap();
      setShowReactionPicker(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  // Count reactions
  const reactionCounts = message.reactions?.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Check if user has reacted
  const userReactions = message.reactions?.filter(
    (r) => r.userId === currentUser?.id
  ).map((r) => r.emoji) || [];

  const content = (
    <>
      <CardHeader className={cn("pb-3", compact && "p-3")}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
              <AvatarImage src={message.sender.avatar} />
              <AvatarFallback>
                {message.sender.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("font-medium", compact && "text-sm")}>
                  {message.sender.name}
                </span>
                {message.metadata?.priority && (
                  <Badge
                    variant={getPriorityColor() as any}
                    className="gap-1"
                  >
                    {getPriorityIcon()}
                    {message.metadata.priority}
                  </Badge>
                )}
                {isPinned && (
                  <Badge variant="outline" className="gap-1">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.createdAt))} ago
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {compact && !expanded && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setExpanded(true)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
            
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleTogglePin}>
                    {isPinned ? (
                      <>
                        <PinOff className="h-4 w-4 mr-2" />
                        Unpin Announcement
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Pin Announcement
                      </>
                    )}
                  </DropdownMenuItem>
                  {canManage && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowReadReceipts(!showReadReceipts)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Read Receipts
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <>
          <CardContent className={compact ? "px-3 pb-3" : ""}>
            <div className={cn("prose prose-sm max-w-none", compact && "text-sm")}>
              <MessageContent content={message.content || ''} />
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded-md"
                  >
                    {/* Render attachment based on type */}
                    <span className="text-sm">{attachment.fileName}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reactions and Actions */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Reaction summary */}
                {Object.entries(reactionCounts).length > 0 && (
                  <div className="flex items-center gap-1">
                    {Object.entries(reactionCounts).map(([emoji, count]) => (
                      <TooltipProvider key={emoji}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={userReactions.includes(emoji) ? "secondary" : "ghost"}
                              size="sm"
                              className="h-7 px-2 gap-1"
                              onClick={() => handleReaction(emoji)}
                            >
                              <span>{emoji}</span>
                              <span className="text-xs">{count}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {userReactions.includes(emoji)
                              ? "Click to remove reaction"
                              : "Click to react"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}

                {/* Add reaction button */}
                {conversation.metadata?.allowPlayerReactions !== false && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setShowReactionPicker(!showReactionPicker)}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    {showReactionPicker && (
                      <div className="absolute bottom-full left-0 mb-2 z-50">
                        <ReactionPicker
                          onSelect={handleReaction}
                          onClose={() => setShowReactionPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Read count */}
              {canManage && message.readReceipts && (
                <button
                  onClick={() => setShowReadReceipts(!showReadReceipts)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye className="h-3 w-3 inline mr-1" />
                  {message.readReceipts.length} read
                </button>
              )}
            </div>

            {/* Read receipts list */}
            {showReadReceipts && readReceipts && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Read by:</p>
                <div className="space-y-1">
                  {readReceipts.map((receipt) => (
                    <div key={receipt.userId} className="text-xs text-muted-foreground">
                      {receipt.user?.name} • {formatDistanceToNow(new Date(receipt.readAt))} ago
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          {compact && (
            <div className="px-3 pb-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7"
                onClick={() => setExpanded(false)}
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      {content}
    </Card>
  );
};

export default AnnouncementPost;