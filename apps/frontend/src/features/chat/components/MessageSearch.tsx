import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  MessageSquare, 
  X, 
  Clock,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useSearchMessagesQuery, useGetConversationsQuery } from '@/store/api/chatApi';
import { Message, Conversation } from '@/store/api/chatApi';
import LoadingSkeleton from './LoadingSkeleton';

interface SearchFilters {
  sender?: string;
  conversationId?: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  dateRange?: {
    from: Date;
    to: Date;
  };
  hasAttachments?: boolean;
}

interface MessageSearchProps {
  trigger?: React.ReactNode;
  onMessageSelect?: (message: Message, conversation: Conversation) => void;
  onConversationSelect?: (conversation: Conversation) => void;
  placeholder?: string;
  className?: string;
  mode?: 'dialog' | 'inline';
  defaultFilters?: SearchFilters;
}

interface SearchResult {
  message: Message;
  conversation: Conversation;
  highlightedContent: string;
}

const MessageSearch: React.FC<MessageSearchProps> = ({
  trigger,
  onMessageSelect,
  onConversationSelect,
  placeholder = "Search messages and conversations...",
  className,
  mode = 'dialog',
  defaultFilters = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  const [activeTab, setActiveTab] = useState<'messages' | 'conversations'>('messages');

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch conversations for filtering
  const { data: conversationsData } = useGetConversationsQuery({
    page: 1,
    limit: 100,
  });
  const conversations = conversationsData?.conversations || [];

  // Search messages
  const { 
    data: searchResults, 
    isLoading: isSearching, 
    error: searchError 
  } = useSearchMessagesQuery({
    query: debouncedQuery,
    senderId: filters.sender,
    conversationId: filters.conversationId,
    messageType: filters.messageType,
    startDate: filters.dateRange?.from?.toISOString(),
    endDate: filters.dateRange?.to?.toISOString(),
    hasAttachments: filters.hasAttachments,
    page: 1,
    limit: 50,
  }, {
    skip: debouncedQuery.length < 2,
  });

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    
    return conversations.filter(conversation => {
      const name = conversation.name || 
        conversation.participants
          .filter(p => p.userId !== localStorage.getItem('current_user_id'))
          .map(p => p.user.name)
          .join(', ');
      
      return name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        conversation.participants.some(p => 
          p.user.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          p.user.email.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
    });
  }, [conversations, debouncedQuery]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50">
          {part}
        </mark>
      ) : part
    );
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    const currentUserId = localStorage.getItem('current_user_id');
    const otherParticipants = conversation.participants.filter(p => p.userId !== currentUserId);
    
    if (otherParticipants.length === 0) return 'You';
    if (otherParticipants.length === 1) return otherParticipants[0].user.name;
    return otherParticipants.map(p => p.user.name).join(', ');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar) return conversation.avatar;
    
    const currentUserId = localStorage.getItem('current_user_id');
    const otherParticipants = conversation.participants.filter(p => p.userId !== currentUserId);
    
    if (otherParticipants.length === 1) {
      return otherParticipants[0].user.avatar;
    }
    return undefined;
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const DateRangeSelector = () => {
    const [isDateOpen, setIsDateOpen] = useState(false);
    
    const presetRanges = [
      { label: 'Today', range: { from: new Date(), to: new Date() } },
      { label: 'Last 7 days', range: { from: subDays(new Date(), 7), to: new Date() } },
      { label: 'Last 30 days', range: { from: subDays(new Date(), 30), to: new Date() } },
      { label: 'Last 3 months', range: { from: subMonths(new Date(), 3), to: new Date() } },
    ];

    return (
      <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {filters.dateRange 
              ? `${format(filters.dateRange.from, 'MMM d')} - ${format(filters.dateRange.to, 'MMM d')}`
              : 'Date range'
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Quick ranges</h4>
              <div className="grid grid-cols-2 gap-1">
                {presetRanges.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('dateRange', preset.range);
                      setIsDateOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
            <CalendarComponent
              mode="range"
              selected={filters.dateRange}
              onSelect={(range) => range && handleFilterChange('dateRange', range)}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const SearchContent = () => (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters and tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex border rounded-lg p-1">
            <Button
              variant={activeTab === 'messages' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('messages')}
              className="h-7"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Messages
            </Button>
            <Button
              variant={activeTab === 'conversations' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('conversations')}
              className="h-7"
            >
              <User className="h-3 w-3 mr-1" />
              Chats
            </Button>
          </div>

          {/* Filters (only for messages) */}
          {activeTab === 'messages' && (
            <div className="flex items-center gap-2">
              <DateRangeSelector />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                        {Object.keys(filters).length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleFilterChange('messageType', 'text')}>
                    Text messages
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange('messageType', 'image')}>
                    Images
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange('messageType', 'file')}>
                    Files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange('hasAttachments', true)}>
                    With attachments
                  </DropdownMenuItem>
                  {hasActiveFilters && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearFilters}>
                        Clear filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Sort */}
        {activeTab === 'messages' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {sortBy === 'relevance' ? 'Relevance' : 'Date'}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('relevance')}>
                Sort by relevance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                Sort by date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Results */}
      <ScrollArea className="h-96">
        {debouncedQuery.length < 2 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start typing to search messages and conversations</p>
          </div>
        ) : activeTab === 'messages' ? (
          <div className="space-y-2">
            {isSearching ? (
              <LoadingSkeleton type="messages" count={3} />
            ) : searchError ? (
              <div className="text-center py-8 text-destructive">
                <p>Error searching messages</p>
              </div>
            ) : !searchResults?.messages?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages found</p>
              </div>
            ) : (
              searchResults.messages.map((message) => {
                const conversation = conversations.find(c => c.id === message.conversationId);
                if (!conversation) return null;

                return (
                  <div
                    key={message.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      onMessageSelect?.(message, conversation);
                      if (mode === 'dialog') setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender.avatar} />
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.sender.name}</span>
                          <span className="text-xs text-muted-foreground">
                            in {getConversationName(conversation)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {highlightText(message.content, debouncedQuery)}
                        </div>
                        
                        {message.attachments?.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {message.attachments.length} attachment{message.attachments.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    onConversationSelect?.(conversation);
                    if (mode === 'dialog') setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getConversationAvatar(conversation)} />
                      <AvatarFallback>
                        {getInitials(getConversationName(conversation))}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1">
                        {highlightText(getConversationName(conversation), debouncedQuery)}
                      </div>
                      
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {conversation.type}
                        </Badge>
                        <span>{conversation.participants.length} member{conversation.participants.length !== 1 ? 's' : ''}</span>
                        {conversation.lastMessage && (
                          <span>
                            Last: {format(new Date(conversation.lastMessage.createdAt), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {conversation.unreadCount > 0 && (
                      <Badge variant="default" className="ml-auto">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (mode === 'inline') {
    return (
      <div className={className}>
        <SearchContent />
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search Messages & Conversations</DialogTitle>
          <DialogDescription>
            Find messages, conversations, and contacts across your chat history
          </DialogDescription>
        </DialogHeader>
        <SearchContent />
      </DialogContent>
    </Dialog>
  );
};

export default MessageSearch;