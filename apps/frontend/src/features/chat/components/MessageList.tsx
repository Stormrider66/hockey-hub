import React, { useEffect, useRef, useCallback, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Message } from '@/store/api/chatApi';
import MessageItem from './MessageItem';
import { LoadingSkeleton } from '@/components/ui/loading';

interface MessageListProps {
  messages: Message[];
  conversationId: string;
  currentUserId: string;
  isLoading?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  highlightedMessageId?: string | null;
  searchTerms?: string[];
  className?: string;
}

interface MessageWithDate extends Message {
  showDateSeparator?: boolean;
  dateLabel?: string;
}

const MessageList = React.forwardRef<List, MessageListProps>(({ 
  messages,
  conversationId,
  currentUserId,
  isLoading = false,
  loading = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  highlightedMessageId,
  searchTerms = [],
  className,
}, forwardedRef) => {
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [messagesWithDates, setMessagesWithDates] = useState<MessageWithDate[]>([]);
  
  // Normalize incoming message shape from tests (snake_case) to component expectations
  const normalizeMessage = useCallback((m: any): MessageWithDate => {
    const sender = m.sender || {};
    const normalizedSender = {
      id: sender.id || m.sender_id || m.senderId,
      name: sender.name || sender.firstName || '',
      avatar: sender.avatar || sender.avatar_url || sender.avatarUrl,
    };
    const normalizedAttachments = (m.attachments || []).map((a: any) => ({
      id: a.id || a.file_url || a.url || `${m.id}-att` as string,
      url: a.url || a.file_url,
      fileName: a.fileName || a.file_name,
      fileSize: a.fileSize || a.file_size,
      fileType: a.fileType || a.mime_type,
      thumbnailUrl: a.thumbnailUrl || a.thumbnail_url,
    }));
    const normalized: any = {
      id: m.id,
      conversationId: m.conversationId || m.conversation_id || conversationId,
      senderId: m.senderId || m.sender_id,
      sender: normalizedSender,
      content: m.content,
      type: (m.type || m.message_type || '').toString().toLowerCase(),
      status: m.status,
      createdAt: m.createdAt || m.created_at,
      editedAt: m.editedAt || m.edited_at,
      attachments: normalizedAttachments,
      reactions: m.reactions || [],
      readReceipts: m.readReceipts || (m.read_by ? m.read_by.map((uid: string) => ({ userId: uid })) : []),
      replyTo: m.reply_to ? { sender: { name: m.reply_to.sender?.name || '' }, content: m.reply_to.content } : m.replyTo,
      __raw: m,
    };
    return normalized as MessageWithDate;
  }, [conversationId]);
  
  // Expose scrollToItem method through ref
  React.useImperativeHandle(forwardedRef, () => listRef.current as List);

  // Process messages to add date separators
  useEffect(() => {
    const normalizedMessages: MessageWithDate[] = (messages || []).map(normalizeMessage);
    const processedMessages: MessageWithDate[] = [];
    
    normalizedMessages.forEach((message, index) => {
      const messageDate = new Date((message as any).createdAt);
      const prevMessage = normalizedMessages[index - 1] as any;
      const prevMessageDate = prevMessage ? new Date(prevMessage.createdAt) : null;
      
      // Check if we need a date separator
      const needsSeparator = !prevMessageDate || !isSameDay(messageDate, prevMessageDate);
      
      if (needsSeparator) {
        let dateLabel = '';
        if (isToday(messageDate)) {
          dateLabel = 'Today';
        } else if (isYesterday(messageDate)) {
          dateLabel = 'Yesterday';
        } else {
          dateLabel = format(messageDate, 'MMMM d, yyyy');
        }
        
        processedMessages.push({
          ...message,
          showDateSeparator: true,
          dateLabel,
        });
      } else {
        processedMessages.push(message);
      }
    });
    
    setMessagesWithDates(processedMessages);
  }, [messages, normalizeMessage]);

  // Auto-scroll to bottom when new messages arrive (if user isn't manually scrolling)
  useEffect(() => {
    if (!isUserScrolling && listRef.current && messagesWithDates.length > 0) {
      const timer = setTimeout(() => {
        listRef.current?.scrollToItem(messagesWithDates.length - 1, 'end');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messagesWithDates.length, isUserScrolling]);

  // Handle scroll events for "scroll to bottom" button and load more
  const handleScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested }: any) => {
      if (!scrollUpdateWasRequested) {
        setIsUserScrolling(true);
        
        // Clear user scrolling flag after a delay
        const timer = setTimeout(() => setIsUserScrolling(false), 1000);
        
        // Show/hide scroll to bottom button
        const container = containerRef.current;
        if (container) {
          const { scrollHeight, clientHeight } = container;
          const isNearBottom = scrollOffset + clientHeight >= scrollHeight - 100;
          setShowScrollToBottom(!isNearBottom && messagesWithDates.length > 0);
        }
        
        // Load more messages when scrolled to top
        if (scrollOffset === 0 && hasMore && onLoadMore && !isLoading) {
          onLoadMore();
        }
        
        return () => clearTimeout(timer);
      }
    },
    [hasMore, onLoadMore, isLoading, messagesWithDates.length]
  );

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    if (listRef.current && messagesWithDates.length > 0) {
      listRef.current.scrollToItem(messagesWithDates.length - 1, 'end');
      setShowScrollToBottom(false);
      setIsUserScrolling(false);
    }
  }, [messagesWithDates.length]);

  // Item renderer for react-window
  const renderMessage = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const message = messagesWithDates[index];
      const prevMessage = index > 0 ? messagesWithDates[index - 1] : null;
      const nextMessage = index < messagesWithDates.length - 1 ? messagesWithDates[index + 1] : null;
      
      // Group consecutive messages from same sender
      const isGroupStart = !prevMessage || 
        prevMessage.senderId !== message.senderId ||
        (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) > 300000; // 5 minutes
      
      const isGroupEnd = !nextMessage || 
        nextMessage.senderId !== message.senderId ||
        (nextMessage && new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000);

      return (
        <div style={style}>
          {message.showDateSeparator && (
            <div className="flex items-center justify-center py-4">
              <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                {message.dateLabel}
              </div>
            </div>
          )}
          <div className={cn(
            "transition-colors duration-300",
            highlightedMessageId === message.id && "bg-primary/10 animate-pulse"
          )}>
            <MessageItem
              message={message}
              rawMessage={(message as any).__raw}
              currentUserId={currentUserId}
              isGroupStart={isGroupStart}
              isGroupEnd={isGroupEnd}
              showAvatar={isGroupStart}
              showTimestamp={isGroupEnd}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReaction={onReaction}
              searchTerms={searchTerms}
            />
          </div>
        </div>
      );
    },
    [messagesWithDates, currentUserId, highlightedMessageId, onReply, onEdit, onDelete, onReaction, searchTerms]
  );

  // Calculate item height based on message content
  const getItemSize = useCallback((index: number) => {
    const message = messagesWithDates[index];
    let height = 40; // Base height
    
    // Add height for date separator
    if (message?.showDateSeparator) {
      height += 48;
    }
    
    // Add height based on content length (rough estimation)
    if (message?.content) {
      const lines = Math.ceil(message.content.length / 60); // Approximate characters per line
      height += Math.max(lines * 20, 40);
    }
    
    // Add height for attachments
    if (message?.attachments?.length > 0) {
      height += 100;
    }
    
    return Math.min(height, 200); // Cap maximum height
  }, [messagesWithDates]);

  const isLoadingFlag = isLoading || loading;

  if (isLoadingFlag && messagesWithDates.length === 0) {
    return (
      <div className={cn("flex-1 p-4", className)} data-testid="message-loading">
        <LoadingSkeleton type="messages" count={5} />
      </div>
    );
  }

  if (messagesWithDates.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="text-lg font-medium mb-2">No messages yet. Start the conversation!</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 relative", className)} ref={containerRef}>
      {isLoadingFlag && (
        <div data-testid="message-loading" className="absolute inset-0 z-20 pointer-events-none" />
      )}
      {/* Loading indicator for pagination */}
      {isLoading && hasMore && (
        <div className="absolute top-0 left-0 right-0 z-10 p-2">
          <div className="flex justify-center">
            <div className="bg-background border rounded-full px-3 py-1 text-xs text-muted-foreground">
              Loading more messages...
            </div>
          </div>
        </div>
      )}

      {/* Virtual scrolling message list */}
      <List
        ref={listRef}
        height={containerRef.current?.clientHeight || 400}
        itemCount={messagesWithDates.length}
        itemSize={getItemSize}
        onScroll={handleScroll}
        overscanCount={5}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {renderMessage}
      </List>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            size="sm"
            onClick={scrollToBottom}
            className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Load more button (test-friendly) */}
      {hasMore && !isLoading && (
        <div className="absolute top-2 left-0 right-0 z-10 flex justify-center">
          <Button size="sm" variant="outline" onClick={onLoadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export { MessageList };
export default MessageList;