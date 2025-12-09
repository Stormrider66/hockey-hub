import React, { useState } from 'react';
import { Pin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGetPinnedMessagesQuery, useUnpinMessageMutation } from '@/store/api/chatApi';
import MarkdownRenderer from './MarkdownRenderer';
import { toast } from 'react-hot-toast';

interface PinnedMessagesProps {
  conversationId: string;
  currentUserId: string;
  onJumpToMessage?: (messageId: string) => void;
  className?: string;
}

const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  conversationId,
  currentUserId,
  onJumpToMessage,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: pinnedMessages = [], isLoading } = useGetPinnedMessagesQuery(conversationId);
  const [unpinMessage] = useUnpinMessageMutation();

  const handleUnpin = async (messageId: string) => {
    try {
      await unpinMessage(messageId).unwrap();
      toast.success('Message unpinned');
    } catch (error) {
      toast.error('Failed to unpin message');
      console.error('Unpin error:', error);
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

  if (pinnedMessages.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "border-b bg-muted/30",
      className
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Pinned messages list */}
      {isExpanded && (
        <ScrollArea className="max-h-[300px]">
          <div className="px-4 pb-2 space-y-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading pinned messages...
              </div>
            ) : (
              pinnedMessages.map((message) => (
                <div
                  key={message.id}
                  className="flex gap-3 p-3 bg-background rounded-lg border hover:shadow-sm transition-shadow"
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback className="text-xs">
                      {getInitials(message.sender.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {message.sender.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                        </span>
                        {message.pinnedBy && (
                          <span className="text-xs text-muted-foreground">
                            • Pinned by {message.pinnedBy.name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div 
                      className="text-sm cursor-pointer hover:text-primary transition-colors line-clamp-2"
                      onClick={() => onJumpToMessage?.(message.id)}
                    >
                      <MarkdownRenderer content={message.content || ''} />
                    </div>

                    {/* Attachments indicator */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-start gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-muted"
                      onClick={() => onJumpToMessage?.(message.id)}
                      title="Jump to message"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-muted"
                      onClick={() => handleUnpin(message.id)}
                      title="Unpin message"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default PinnedMessages;