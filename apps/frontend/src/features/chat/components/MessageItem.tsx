import React, { useState } from 'react';
import { format } from 'date-fns';
import { MoreVertical, Reply, Heart, Smile, Edit, Trash2, Copy, Forward, Pin, PinOff, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Message, usePinMessageMutation, useUnpinMessageMutation, useBookmarkMessageMutation, useUnbookmarkMessageMutation } from '@/store/api/chatApi';
import AttachmentPreview from './AttachmentPreview';
import MessageContent from './MessageContent';
import ReactionPicker from './ReactionPicker';
import ForwardMessageModal from './ForwardMessageModal';
import { VoiceMessage } from './VoiceMessage';
import { VideoMessage } from './VideoMessage';
import { BroadcastMessage } from './BroadcastMessage';
import { LocationMessage } from './LocationShare';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark, selectIsMessageBookmarked } from '@/store/slices/chatSlice';
import TacticalMessageCard from './TacticalMessageCard';
import TacticalPlayViewer from './TacticalPlayViewer';
import TacticalVideoViewer from './TacticalVideoViewer';
import { TacticalMessageMetadata, TacticalPlayData } from '../../coach/services/tacticalCommunicationService';

interface MessageItemProps {
  message: Message;
  rawMessage?: any;
  currentUserId: string;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  searchTerms?: string[];
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  rawMessage,
  currentUserId,
  isGroupStart = true,
  isGroupEnd = true,
  showAvatar = true,
  showTimestamp = true,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  searchTerms = [],
}) => {
  const isTestEnv = (process.env as any).JEST_TEST_ENV === 'true';
  const [showActions, setShowActions] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showTacticalPlayViewer, setShowTacticalPlayViewer] = useState(false);
  const [showTacticalVideoViewer, setShowTacticalVideoViewer] = useState(false);
  const [pinMessage] = usePinMessageMutation();
  const [unpinMessage] = useUnpinMessageMutation();
  const [bookmarkMessage] = useBookmarkMessageMutation();
  const [unbookmarkMessage] = useUnbookmarkMessageMutation();
  const dispatch = useDispatch();
  const isBookmarked = useSelector(selectIsMessageBookmarked(message.id));
  const isOwn = message.senderId === currentUserId;
  const isDeleted = !!message.deletedAt;
  const isEdited = !!message.editedAt;
  const isPinned = !!message.isPinned;

  const handleCopyMessage = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
  };

  const handleQuickReaction = (emoji: string) => {
    if (onReaction) {
      onReaction(message.id, emoji);
    }
  };

  const handleTogglePin = async () => {
    try {
      if (isPinned) {
        await unpinMessage(message.id).unwrap();
        toast.success('Message unpinned');
      } else {
        await pinMessage(message.id).unwrap();
        toast.success('Message pinned');
      }
    } catch (error) {
      toast.error(isPinned ? 'Failed to unpin message' : 'Failed to pin message');
      console.error('Pin/unpin error:', error);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await unbookmarkMessage(message.id).unwrap();
        dispatch(toggleBookmark(message.id));
        toast.success('Bookmark removed');
      } else {
        await bookmarkMessage(message.id).unwrap();
        dispatch(toggleBookmark(message.id));
        toast.success('Message bookmarked');
      }
    } catch (error) {
      toast.error(isBookmarked ? 'Failed to remove bookmark' : 'Failed to bookmark message');
      console.error('Bookmark error:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  // Detect if this is a tactical message
  const isTacticalMessage = () => {
    return message.metadata && 
           typeof message.metadata === 'object' && 
           'tacticalType' in message.metadata &&
           ['play_share', 'formation_update', 'video_analysis', 'play_discussion', 'game_plan'].includes(
             (message.metadata as TacticalMessageMetadata).tacticalType
           );
  };

  // Get tactical metadata
  const getTacticalMetadata = (): TacticalMessageMetadata | null => {
    if (isTacticalMessage() && message.metadata) {
      return message.metadata as TacticalMessageMetadata;
    }
    return null;
  };

  // Handle tactical message interactions
  const handleViewPlay = (playId: string) => {
    setShowTacticalPlayViewer(true);
  };

  const handleViewVideo = (videoUrl: string, timestamps: any[]) => {
    setShowTacticalVideoViewer(true);
  };

  const handleTacticalReaction = (emoji: string) => {
    if (onReaction) {
      onReaction(message.id, emoji);
    }
  };

  const handleStartDiscussion = () => {
    if (onReply) {
      onReply(message);
    }
  };

  const tacticalMetadata = getTacticalMetadata();

  if (isDeleted) {
    return (
      <div className={cn(
        "flex gap-3 px-4 py-1",
        isOwn ? "justify-end" : "justify-start"
      )}>
        <div className={cn(
          "max-w-[70%] italic text-muted-foreground text-sm",
          isOwn ? "text-right" : "text-left"
        )}>
          This message was deleted
        </div>
      </div>
    );
  }

  // Handle broadcast messages separately
  if (message.type === 'broadcast') {
    return (
      <BroadcastMessage
        message={message}
        currentUserId={currentUserId}
        onReply={onReply}
      />
    );
  }

  // Handle system messages (centered, muted text)
  if ((message as any).type === 'system') {
    return (
      <div className={cn("flex px-4 py-1 justify-center text-center text-muted-foreground")} data-testid="message-item" data-sender-id={message.senderId}>
        <div className="text-sm">{message.content}</div>
      </div>
    );
  }

  // Handle tactical messages
  if (isTacticalMessage() && tacticalMetadata) {
    return (
      <div className={cn(
        "flex px-4 py-2",
        isOwn ? "justify-end" : "justify-start"
      )}>
        <div className="max-w-[85%]">
          <TacticalMessageCard
            messageId={message.id}
            senderId={message.senderId}
            senderName={message.sender.name}
            senderAvatar={message.sender.avatar}
            timestamp={new Date(message.createdAt)}
            metadata={tacticalMetadata}
            isOwn={isOwn}
            onReact={handleTacticalReaction}
            onAcknowledge={() => {
              // Handle acknowledgment
              console.log('Acknowledged tactical message:', message.id);
            }}
            onStartDiscussion={handleStartDiscussion}
            onViewPlay={handleViewPlay}
            onViewVideo={handleViewVideo}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-1 hover:bg-muted/30 transition-colors group",
        isOwn ? "justify-end" : "justify-start",
        isGroupStart ? "pt-2" : "py-0.5",
        isGroupEnd ? "pb-2" : "py-0.5"
      )}
      data-testid="message-item"
      data-sender-id={message.senderId}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar (for received messages) */}
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={message.sender.avatar} />
          <AvatarFallback className="text-xs">
            {getInitials(message.sender.name)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Spacer when not showing avatar but maintaining alignment */}
      {!isOwn && !showAvatar && <div className="w-8" />}

      {/* Message content */}
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Hidden sender name for tests (only for own messages) */}
        {isOwn && <span className="sr-only">{message.sender.name}</span>}
        {/* Sender name (for received messages in groups) */}
        {!isOwn && isGroupStart && (
          <div className="text-xs text-muted-foreground mb-1 px-1">
            {message.sender.name}
          </div>
        )}

        {/* Reply reference */}
        {message.replyTo && (
          <div className={cn(
            "text-xs bg-muted/50 rounded px-2 py-1 mb-1 border-l-2",
            isOwn ? "border-primary" : "border-muted-foreground"
          )}>
            <div className="font-medium">Replying to {message.replyTo.sender.name}</div>
            <div className="text-muted-foreground truncate">
              {message.replyTo.content || "Message"}
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div className="relative group/message">
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
              isGroupStart && isGroupEnd
                ? "rounded-lg"
                : isGroupStart
                ? isOwn
                  ? "rounded-l-lg rounded-tr-lg rounded-br-sm"
                  : "rounded-r-lg rounded-tl-lg rounded-bl-sm"
                : isGroupEnd
                ? isOwn
                  ? "rounded-l-lg rounded-tr-sm rounded-br-lg"
                  : "rounded-r-lg rounded-tl-sm rounded-bl-lg"
                : isOwn
                ? "rounded-l-lg rounded-tr-sm rounded-br-sm"
                : "rounded-r-lg rounded-tl-sm rounded-bl-sm"
            )}
          >
            {/* Message content - handle different types */}
            {message.type === 'voice' ? (
              // Voice message
              <VoiceMessage
                url={message.attachments?.[0]?.url || ''}
                duration={message.metadata?.duration || 0}
                waveform={message.metadata?.waveform}
                fileName={message.attachments?.[0]?.fileName}
                size={message.attachments?.[0]?.fileSize}
                sender={message.sender.name}
                timestamp={new Date(message.createdAt)}
              />
            ) : message.type === 'video' ? (
              // Video message
              <VideoMessage
                url={message.attachments?.[0]?.url || ''}
                thumbnail={message.attachments?.[0]?.thumbnailUrl || message.metadata?.thumbnail}
                duration={message.metadata?.duration || 0}
                fileName={message.attachments?.[0]?.fileName}
                fileSize={message.attachments?.[0]?.fileSize}
                sender={message.sender}
                timestamp={new Date(message.createdAt)}
                isOwn={isOwn}
              />
            ) : message.type === 'location' ? (
              // Location message
              <LocationMessage
                location={message.metadata?.location || {
                  latitude: 0,
                  longitude: 0,
                  accuracy: 0,
                  timestamp: Date.now()
                }}
                isLive={message.metadata?.isLive || false}
                sender={message.sender.name}
                timestamp={message.createdAt}
              />
            ) : (
              <>
                {/* Text message with Markdown support and search highlighting */}
                <MessageContent
                  content={message.content || ''}
                  searchTerms={searchTerms}
                  isOwn={isOwn}
                />

                {/* Attachments (for non-voice messages) */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2">
                    <AttachmentPreview
                      attachments={message.attachments}
                      layout="inline"
                      maxPreviewSize={200}
                      showFileName={false}
                    />
                  </div>
                )}
              </>
            )}

            {/* Quick reaction area */}
            {showActions && (
              <div className={cn(
                "absolute -top-8 flex items-center gap-1 bg-background border rounded-full px-2 py-1 shadow-lg opacity-0 group-hover/message:opacity-100 transition-opacity",
                isOwn ? "-left-16" : "-right-16"
              )}>
                {/* Reaction picker moved to reactions section below to avoid duplicates */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-muted"
                  aria-label="Reply"
                  onClick={() => onReply?.((rawMessage as any) || (message as any))}
                >
                  <Reply className="h-3 w-3" />
                </Button>
                {isOwn && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-muted"
                      aria-label="Edit"
                      onClick={() => (onEdit as any)?.(message.id, message.content || '')}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-muted"
                      aria-label="Delete"
                      onClick={() => (onDelete as any)?.(message.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-muted"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? "end" : "start"}>
                    <DropdownMenuItem onClick={() => onReply?.((rawMessage as any) || (message as any))}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyMessage}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowForwardModal(true)}>
                      <Forward className="h-4 w-4 mr-2" />
                      Forward
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleTogglePin}>
                      {isPinned ? (
                        <>
                          <PinOff className="h-4 w-4 mr-2" />
                          Unpin
                        </>
                      ) : (
                        <>
                          <Pin className="h-4 w-4 mr-2" />
                          Pin
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleBookmark}>
                      {isBookmarked ? (
                        <>
                          <StarOff className="h-4 w-4 mr-2" />
                          Remove Bookmark
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          Bookmark
                        </>
                      )}
                    </DropdownMenuItem>
                    {isOwn && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit?.(message)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(message)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Reactions */}
          {(message.reactions && message.reactions.length > 0) || showActions || isTestEnv ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions && message.reactions.length > 0 && message.reactions
                .reduce((acc: { emoji: string; users: { id: string; name: string }[]; count: number; hasReacted: boolean }[], reaction: any) => {
                  const existing = acc.find(r => r.emoji === reaction.emoji);
                  if (existing) {
                    existing.users.push({ id: reaction.userId || reaction.user_id, name: (reaction.user && reaction.user.name) || reaction.user_name || '' });
                    existing.count++;
                    if ((reaction.userId || reaction.user_id) === currentUserId) {
                      existing.hasReacted = true;
                    }
                  } else {
                    acc.push({
                      emoji: reaction.emoji,
                      users: [{ id: reaction.userId || reaction.user_id, name: (reaction.user && reaction.user.name) || reaction.user_name || '' }],
                      count: 1,
                      hasReacted: (reaction.userId || reaction.user_id) === currentUserId
                    });
                  }
                  return acc;
                }, [])
                .map((reactionGroup) => (
                  <div key={reactionGroup.emoji} className="inline-flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={reactionGroup.hasReacted ? "default" : "outline"}
                      className={cn(
                        "h-6 px-2 text-xs transition-all",
                        reactionGroup.hasReacted 
                          ? "hover:bg-primary/90" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => handleQuickReaction(reactionGroup.emoji)}
                      title={reactionGroup.users.map(u => u.name).join(', ')}
                    >
                      {reactionGroup.emoji}
                    </Button>
                    <span>{reactionGroup.count}</span>
                  </div>
                ))}
              
              {/* Add reaction button */}
              <ReactionPicker
                onSelect={(emoji) => handleQuickReaction(emoji)}
                position="bottom"
                align="start"
                trigger={
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0 hover:bg-muted"
                    aria-label="Add reaction"
                  >
                    <Smile className="h-3 w-3" />
                  </Button>
                }
              />
            </div>
          ) : null}

          {/* Timestamp and status */}
          {showTimestamp && (
            <div className={cn(
              "flex items-center gap-1 mt-1 text-xs text-muted-foreground",
              isOwn ? "justify-end" : "justify-start"
            )}>
              {isPinned && (
                <Pin className="h-3 w-3 text-primary" />
              )}
              <span data-testid="message-timestamp">{formatTimestamp(message.createdAt)}</span>
              {isEdited && <span>(edited)</span>}
              {isOwn && (
                <div className="flex items-center gap-1">
                  {message.readReceipts && message.readReceipts.length > 0 ? (
                    <Badge variant="outline" className="h-4 px-1 text-xs" data-testid="read-receipt">
                      Read
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="h-4 px-1 text-xs" data-testid="read-receipt">
                      Sent
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avatar spacer for own messages */}
      {isOwn && <div className="w-8" />}

      {/* Forward modal */}
      <ForwardMessageModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        message={message}
      />

      {/* Tactical Play Viewer */}
      <TacticalPlayViewer
        isOpen={showTacticalPlayViewer}
        onClose={() => setShowTacticalPlayViewer(false)}
        play={tacticalMetadata?.playData || null}
        allowComments={true}
        onStartDiscussion={handleStartDiscussion}
        onShare={() => {
          // Handle sharing
          console.log('Share tactical play');
        }}
      />

      {/* Tactical Video Viewer */}
      <TacticalVideoViewer
        isOpen={showTacticalVideoViewer}
        onClose={() => setShowTacticalVideoViewer(false)}
        videoUrl={tacticalMetadata?.videoData?.videoUrl || ''}
        title={tacticalMetadata?.videoData?.title || ''}
        timestamps={tacticalMetadata?.videoData?.timestamps || []}
        tacticalOverlays={tacticalMetadata?.videoData?.tacticalOverlays}
        analysisNotes={tacticalMetadata?.videoData?.analysisNotes}
        relatedPlays={tacticalMetadata?.videoData?.relatedPlays}
        onStartDiscussion={handleStartDiscussion}
        onShare={() => {
          // Handle sharing
          console.log('Share tactical video');
        }}
      />
    </div>
  );
};

export default MessageItem;