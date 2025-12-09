import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Star, X, MessageSquare, Calendar } from 'lucide-react';
import { useGetBookmarkedMessagesQuery } from '@/store/api/chatApi';
import { useDispatch, useSelector } from 'react-redux';
import { setShowingBookmarks, selectActiveConversationId } from '@/store/slices/chatSlice';
import MessageItem from './MessageItem';
import { LoadingSkeleton } from '@/components/ui/loading';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface BookmarkedMessagesProps {
  onMessageClick?: (conversationId: string, messageId: string) => void;
}

const BookmarkedMessages: React.FC<BookmarkedMessagesProps> = ({ onMessageClick }) => {
  const dispatch = useDispatch();
  const activeConversationId = useSelector(selectActiveConversationId);
  const currentUserId = localStorage.getItem('current_user_id') || '';
  
  // Get bookmarked messages, optionally filtered by conversation
  const { data: messages, isLoading, error } = useGetBookmarkedMessagesQuery({
    conversationId: activeConversationId
  });

  const handleClose = () => {
    dispatch(setShowingBookmarks(false));
  };

  const handleMessageClick = (message: any) => {
    if (onMessageClick) {
      onMessageClick(message.conversationId, message.id);
    }
  };

  const groupMessagesByDate = (messages: any[]) => {
    const groups: Record<string, any[]> = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const formatGroupDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Bookmarked Messages</h2>
          {messages && (
            <span className="text-sm text-muted-foreground">
              ({messages.length})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4">
            <LoadingSkeleton type="messages" count={5} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Failed to load bookmarked messages
            </p>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookmarked messages</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Bookmark important messages to easily find them later. 
              Bookmarked messages are only visible to you.
            </p>
          </div>
        ) : (
          <div className="p-4">
            {Object.entries(groupMessagesByDate(messages))
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dateMessages]) => (
                <div key={date} className="mb-6">
                  {/* Date separator */}
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatGroupDate(date)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  {/* Messages for this date */}
                  <div className="space-y-2">
                    {dateMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "relative rounded-lg border p-2 cursor-pointer transition-colors",
                          "hover:bg-muted/50"
                        )}
                        onClick={() => handleMessageClick(message)}
                      >
                        {/* Conversation info */}
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-medium">
                            {message.conversation?.name || 'Direct Message'}
                          </span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {/* Message preview */}
                        <div className="pointer-events-none">
                          <MessageItem
                            message={message}
                            currentUserId={currentUserId}
                            showTimestamp={false}
                            showAvatar={true}
                          />
                        </div>
                        
                        {/* Bookmark indicator */}
                        <div className="absolute top-2 right-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer info */}
      {messages && messages.length > 0 && (
        <div className="p-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            {activeConversationId 
              ? 'Showing bookmarks from this conversation'
              : 'Showing all your bookmarked messages'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default BookmarkedMessages;