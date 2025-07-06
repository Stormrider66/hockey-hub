import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Plus, Filter, SortAsc, SortDesc, Users, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useGetConversationsQuery,
  type Conversation,
} from '@/store/api/chatApi';
import {
  selectActiveConversationId,
  selectSearchQuery,
  setSearchQuery,
} from '@/store/slices/chatSlice';
import { useDispatch } from 'react-redux';
import ConversationItem from './ConversationItem';
import LoadingSkeleton from './LoadingSkeleton';

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  className?: string;
}

type SortOption = 'recent' | 'alphabetical' | 'unread';
type FilterOption = 'all' | 'direct' | 'group' | 'team' | 'announcement' | 'private_coach_channel' | 'unread';

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  onNewConversation,
  className,
}) => {
  const dispatch = useDispatch();
  const activeConversationId = useSelector(selectActiveConversationId);
  const searchQuery = useSelector(selectSearchQuery);

  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch conversations
  const {
    data: conversationsData,
    error,
    isLoading,
    refetch,
  } = useGetConversationsQuery({});

  // Filter and sort conversations
  const filteredAndSortedConversations = useMemo(() => {
    if (!conversationsData?.conversations) return [];

    let filtered = conversationsData.conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conversation => {
        // Search in conversation name
        if (conversation.name?.toLowerCase().includes(query)) return true;
        
        // Search in participant names
        return conversation.participants.some(participant =>
          participant.user.name.toLowerCase().includes(query) ||
          participant.user.email.toLowerCase().includes(query)
        );
      });
    }

    // Apply type filter
    if (filterBy !== 'all') {
      if (filterBy === 'unread') {
        filtered = filtered.filter(conversation => conversation.unreadCount > 0);
      } else {
        filtered = filtered.filter(conversation => conversation.type === filterBy);
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'recent':
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case 'alphabetical':
          const nameA = a.name || getConversationDisplayName(a);
          const nameB = b.name || getConversationDisplayName(b);
          comparison = nameA.localeCompare(nameB);
          break;
        case 'unread':
          comparison = b.unreadCount - a.unreadCount;
          break;
      }

      return sortDirection === 'asc' ? -comparison : comparison;
    });

    return sorted;
  }, [conversationsData?.conversations, searchQuery, filterBy, sortBy, sortDirection]);

  // Get display name for conversation
  const getConversationDisplayName = useCallback((conversation: Conversation): string => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      // For direct conversations, show the other participant's name
      const currentUserId = localStorage.getItem('current_user_id') || 'current-user-id';
      const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
      return otherParticipant?.user.name || 'Unknown';
    }
    
    // For group conversations without names
    const participantNames = conversation.participants
      .slice(0, 3)
      .map(p => p.user.name.split(' ')[0])
      .join(', ');
    
    if (conversation.participants.length > 3) {
      return `${participantNames} and ${conversation.participants.length - 3} others`;
    }
    
    return participantNames || 'Group Chat';
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    dispatch(setSearchQuery(value));
  }, [dispatch]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy]);

  // Clear search when component unmounts
  useEffect(() => {
    return () => {
      dispatch(setSearchQuery(''));
    };
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-4 border-b">
          <LoadingSkeleton className="h-10 w-full mb-2" />
          <LoadingSkeleton className="h-8 w-24" />
        </div>
        <div className="flex-1 p-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingSkeleton key={index} className="h-16 w-full mb-2 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div>
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              Failed to load conversations
            </p>
            <Button size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalUnreadCount = filteredAndSortedConversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  return (
    <div className={cn("flex flex-col h-full bg-background overflow-hidden", className)}>
      {/* Header */}
      <div className="p-3 border-b space-y-3 flex-shrink-0 overflow-visible">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Filter Button */}
            <Button
              size="sm"
              variant={showFilters ? "secondary" : "ghost"}
              onClick={() => setShowFilters(!showFilters)}
              className="h-8"
            >
              <Filter className="h-3 w-3 mr-1" />
              Filter
              {filterBy !== 'all' && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  1
                </Badge>
              )}
            </Button>

            {/* Sort Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSortChange(sortBy)}
              className="h-8"
            >
              {sortDirection === 'desc' ? (
                <SortDesc className="h-3 w-3 mr-1" />
              ) : (
                <SortAsc className="h-3 w-3 mr-1" />
              )}
              Sort
            </Button>
          </div>

          {/* New Conversation Button */}
          <Button
            size="sm"
            onClick={onNewConversation}
            className="h-8"
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {(['all', 'direct', 'group', 'team', 'announcement', 'private_coach_channel', 'unread'] as FilterOption[]).map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={filterBy === option ? "secondary" : "ghost"}
                  onClick={() => setFilterBy(option)}
                  className="h-7 px-2 text-xs capitalize"
                >
                  {option === 'unread' && totalUnreadCount > 0 && (
                    <Badge variant="destructive" className="mr-1 h-3 px-1 text-xs">
                      {totalUnreadCount}
                    </Badge>
                  )}
                  {option === 'private_coach_channel' ? 'Coach Channels' : option}
                </Button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-1">
              {(['recent', 'alphabetical', 'unread'] as SortOption[]).map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={sortBy === option ? "secondary" : "ghost"}
                  onClick={() => handleSortChange(option)}
                  className="h-7 px-2 text-xs capitalize"
                >
                  {option}
                  {sortBy === option && (
                    sortDirection === 'desc' ? (
                      <SortDesc className="h-3 w-3 ml-1" />
                    ) : (
                      <SortAsc className="h-3 w-3 ml-1" />
                    )
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 h-full">
        <div className="p-2 space-y-1 min-h-0">
          {filteredAndSortedConversations.length === 0 ? (
            <div className="text-center py-8">
              {searchQuery ? (
                <div>
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No conversations found for "{searchQuery}"
                  </p>
                </div>
              ) : filterBy !== 'all' ? (
                <div>
                  <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No {filterBy} conversations
                  </p>
                </div>
              ) : (
                <div>
                  <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No conversations yet
                  </p>
                  <Button size="sm" onClick={onNewConversation}>
                    <Users className="h-4 w-4 mr-2" />
                    Start your first conversation
                  </Button>
                </div>
              )}
            </div>
          ) : (
            filteredAndSortedConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation.id)}
                displayName={getConversationDisplayName(conversation)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {filteredAndSortedConversations.length > 0 && (
        <div className="p-3 border-t text-center">
          <p className="text-xs text-muted-foreground">
            {filteredAndSortedConversations.length} conversation{filteredAndSortedConversations.length !== 1 ? 's' : ''}
            {totalUnreadCount > 0 && (
              <span className="ml-2">
                • {totalUnreadCount} unread
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConversationList;