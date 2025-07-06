import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, Info, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGetMessagesQuery, useSendMessageMutation, chatApi, useSearchMessagesQuery } from '@/store/api/chatApi';
import { useDispatch } from 'react-redux';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import LoadingSkeleton from './LoadingSkeleton';
import JumpToDate from './JumpToDate';
import MessageSearch from './MessageSearch';
import SearchResultNavigator from './SearchResultNavigator';
import { SearchHighlight, useSearchTerms } from './SearchHighlight';
import AudioRecordingService, { AudioRecordingData } from '@/services/AudioRecordingService';
import { useToast } from '@/components/ui/use-toast';

interface MessageAreaProps {
  conversationId: string;
  onShowConversationList: () => void;
  showBackButton?: boolean;
  className?: string;
  disableAutoFocus?: boolean;
}

const MessageArea: React.FC<MessageAreaProps> = ({
  conversationId,
  onShowConversationList,
  showBackButton = false,
  className,
  disableAutoFocus = false,
}) => {
  const dispatch = useDispatch();
  const messageListRef = useRef<any>(null);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const { toast } = useToast();
  
  // Get current user ID from localStorage (temporary solution)
  const currentUserId = localStorage.getItem('current_user_id') || 'user-1';
  
  // Fetch initial messages for this conversation
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useGetMessagesQuery({
    conversationId,
    limit: 50,
  });
  
  const [sendMessage, { isLoading: isSendingMessage }] = useSendMessageMutation();
  
  // Handle loading more messages
  const handleLoadMore = useCallback(async () => {
    if (!messagesData?.hasMore || !messagesData?.nextCursor || isLoadingMore) {
      return;
    }
    
    setIsLoadingMore(true);
    try {
      // Load more messages with cursor
      await dispatch(
        chatApi.endpoints.getMessages.initiate({
          conversationId,
          cursor: messagesData.nextCursor,
          limit: 50,
        })
      ).unwrap();
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, messagesData?.hasMore, messagesData?.nextCursor, isLoadingMore, dispatch]);
  
  // Mock typing users (in real app, this would come from socket)
  const typingUsers = [
    // { id: 'user-2', name: 'John Doe', avatar: undefined }
  ];
  
  const messages = messagesData?.messages || [];
  const searchTerms = useSearchTerms(searchQuery);
  
  // Search messages query
  const { 
    data: searchData, 
    isLoading: isSearching 
  } = useSearchMessagesQuery({
    query: searchQuery,
    conversationId,
    limit: 100,
  }, {
    skip: searchQuery.length < 2,
  });
  
  // Update search results when search data changes
  useEffect(() => {
    if (searchData?.messages) {
      setSearchResults(searchData.messages);
      setCurrentSearchIndex(0);
    } else {
      setSearchResults([]);
    }
  }, [searchData]);
  
  // Keyboard shortcut for search (Ctrl/Cmd + F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleSendMessage = async (content: string, replyToId?: string) => {
    try {
      await sendMessage({
        conversationId,
        content,
        type: 'text',
        replyToId,
      }).unwrap();
      
      // Clear reply if it was a reply
      if (replyToId) {
        setReplyToMessage(null);
      }
      
      // Refetch messages to get the latest
      refetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  const handleTypingStart = () => {
    // TODO: Emit typing start event via socket
    console.log('Typing started');
  };
  
  const handleTypingStop = () => {
    // TODO: Emit typing stop event via socket
    console.log('Typing stopped');
  };
  
  const handleFileSelect = async (files: File[]) => {
    try {
      for (const file of files) {
        // Create a preview URL for the file
        const url = URL.createObjectURL(file);
        
        // Convert file to base64 for sending (in a real app, you'd upload to a server)
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // Create attachment data
        const attachment = {
          url,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        };
        
        // Determine message type based on file type
        const messageType = file.type.startsWith('image/') ? 'image' : 'file';
        
        // Send message with attachment
        await sendMessage({
          conversationId,
          content: file.name, // Use filename as message content
          type: messageType,
          attachments: [attachment],
          metadata: {
            base64File: base64, // Include base64 for backend to process
          },
        }).unwrap();
      }
      
      toast({
        title: 'Files sent',
        description: `${files.length} file${files.length > 1 ? 's' : ''} sent successfully.`,
      });
      
      // Refetch messages to get the latest
      refetchMessages();
    } catch (error) {
      console.error('Failed to send files:', error);
      toast({
        title: 'Failed to send files',
        description: 'There was an error uploading your files. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSendVoiceNote = async (audioData: AudioRecordingData) => {
    try {
      // Convert blob to base64 for sending
      const base64Audio = await AudioRecordingService.blobToBase64(audioData.blob);
      
      // Create attachment data
      const attachment = {
        url: audioData.url,
        fileName: `voice-note-${Date.now()}.webm`,
        fileType: audioData.blob.type,
        fileSize: audioData.blob.size,
      };
      
      // Send message with voice type
      await sendMessage({
        conversationId,
        content: '', // Voice messages don't have text content
        type: 'voice',
        attachments: [attachment],
        metadata: {
          duration: audioData.duration,
          waveform: audioData.waveform,
          base64Audio, // Include base64 for backend to process
        },
      }).unwrap();
      
      toast({
        title: 'Voice message sent',
        description: `${AudioRecordingService.formatDuration(audioData.duration)} voice message sent successfully.`,
      });
      
      // Refetch messages to get the latest
      refetchMessages();
    } catch (error) {
      console.error('Failed to send voice note:', error);
      toast({
        title: 'Failed to send voice message',
        description: 'There was an error sending your voice message. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSendVideoNote = async (videoBlob: Blob, thumbnail: string, duration: number) => {
    try {
      // Convert blob to base64 for sending
      const reader = new FileReader();
      const base64Video = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(videoBlob);
      });
      
      // Create attachment data
      const attachment = {
        url: URL.createObjectURL(videoBlob),
        fileName: `video-message-${Date.now()}.mp4`,
        fileType: videoBlob.type,
        fileSize: videoBlob.size,
        thumbnailUrl: thumbnail,
      };
      
      // Send message with video type
      await sendMessage({
        conversationId,
        content: '', // Video messages don't have text content
        type: 'video',
        attachments: [attachment],
        metadata: {
          duration,
          thumbnail,
          base64Video, // Include base64 for backend to process
        },
      }).unwrap();
      
      toast({
        title: 'Video message sent',
        description: `${Math.floor(duration)}s video message sent successfully.`,
      });
      
      // Refetch messages to get the latest
      refetchMessages();
    } catch (error) {
      console.error('Failed to send video note:', error);
      toast({
        title: 'Failed to send video message',
        description: 'There was an error sending your video message. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleReply = (message: any) => {
    setReplyToMessage(message);
  };
  
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };
  
  const handleJumpToMessage = useCallback((messageId: string) => {
    // Find the message index in the current list
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1 && messageListRef.current) {
      // Scroll to the message
      messageListRef.current.scrollToItem(messageIndex, 'center');
      
      // Highlight the message temporarily
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    } else {
      // Message not in current view, might need to load more messages
      // This would require a more complex implementation to load messages around a specific date
      console.log('Message not found in current view:', messageId);
    }
  }, [messages]);
  
  const handleSearchNavigate = useCallback((index: number) => {
    if (searchResults.length === 0 || !searchResults[index]) return;
    
    const targetMessage = searchResults[index];
    setCurrentSearchIndex(index);
    
    // Find the message in the current messages list
    const messageIndex = messages.findIndex(msg => msg.id === targetMessage.id);
    
    if (messageIndex !== -1 && messageListRef.current) {
      // Message is already loaded, scroll to it
      messageListRef.current.scrollToItem(messageIndex, 'center');
      setHighlightedMessageId(targetMessage.id);
      setTimeout(() => setHighlightedMessageId(null), 3000);
    } else {
      // Message not in current view, jump to its date
      handleJumpToMessage(targetMessage.id);
    }
  }, [searchResults, messages, handleJumpToMessage]);
  
  const handleSearchClose = useCallback(() => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setSearchResults([]);
    setCurrentSearchIndex(0);
  }, []);
  
  const handleMessageSelect = useCallback((message: any) => {
    // Navigate to the selected message
    const index = searchResults.findIndex(msg => msg.id === message.id);
    if (index !== -1) {
      handleSearchNavigate(index);
    }
  }, [searchResults, handleSearchNavigate]);
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onShowConversationList}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium">C</span>
            </div>
            <div>
              <h3 className="font-medium text-sm">Conversation</h3>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <MessageSearch
            trigger={
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Search className="h-4 w-4" />
              </Button>
            }
            onMessageSelect={handleMessageSelect}
            mode="dialog"
            defaultFilters={{ conversationId }}
          />
          <JumpToDate
            conversationId={conversationId}
            onJumpToMessage={handleJumpToMessage}
            className="mr-2"
          />
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Video className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {isLoadingMessages ? (
          <div className="flex-1 p-4">
            <LoadingSkeleton type="messages" count={5} />
          </div>
        ) : messagesError ? (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-destructive">Error Loading Messages</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Failed to load conversation messages
              </p>
              <Button variant="outline" onClick={() => refetchMessages()}>
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <MessageList
            ref={messageListRef}
            messages={messages}
            conversationId={conversationId}
            currentUserId={currentUserId}
            isLoading={isLoadingMore}
            hasMore={messagesData?.hasMore || false}
            onLoadMore={handleLoadMore}
            onReply={handleReply}
            onEdit={(message) => {
              // TODO: Implement edit functionality
              console.log('Edit message:', message);
            }}
            onDelete={(message) => {
              // TODO: Implement delete functionality
              console.log('Delete message:', message);
            }}
            onReaction={(messageId, emoji) => {
              // TODO: Implement reaction functionality
              console.log('Add reaction:', messageId, emoji);
            }}
            highlightedMessageId={highlightedMessageId}
            searchTerms={searchTerms}
          />
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator 
            typingUsers={typingUsers}
            className="border-t"
          />
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        conversationId={conversationId}
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        onFileSelect={handleFileSelect}
        onSendVoiceNote={handleSendVoiceNote}
        onSendVideoNote={handleSendVideoNote}
        replyToMessage={replyToMessage}
        onCancelReply={handleCancelReply}
        disabled={isSendingMessage}
        placeholder="Type a message..."
        disableAutoFocus={disableAutoFocus}
      />
      
      {/* Search Result Navigator */}
      {searchResults.length > 0 && (
        <SearchResultNavigator
          searchResults={searchResults}
          currentIndex={currentSearchIndex}
          onNavigate={handleSearchNavigate}
          onClose={handleSearchClose}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
};

export default MessageArea;