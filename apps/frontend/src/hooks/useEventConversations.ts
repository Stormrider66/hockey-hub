import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  useGetEventConversationsForEventQuery,
  useQuickCreateEventConversationMutation,
  useCreateEventConversationMutation,
  useNotifyEventChangesMutation,
  CreateEventConversationRequest,
} from '@/store/api/eventConversationApi';
import { useAppDispatch } from '@/store/hooks';
import { setActiveConversation } from '@/store/slices/chatSlice';

interface UseEventConversationsOptions {
  eventId: string;
  autoRefetch?: boolean;
  onChatCreated?: (conversationId: string) => void;
  onChatOpened?: (conversationId: string) => void;
}

interface CreateEventChatOptions {
  scope?: 'all_participants' | 'coaches_only' | 'players_only' | 'parents_only' | 'custom';
  name?: string;
  description?: string;
  settings?: Record<string, any>;
  customParticipantIds?: string[];
}

export const useEventConversations = ({
  eventId,
  autoRefetch = true,
  onChatCreated,
  onChatOpened,
}: UseEventConversationsOptions) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // State
  const [isNavigatingToChat, setIsNavigatingToChat] = useState(false);
  
  // API hooks
  const {
    data: conversationsData,
    isLoading,
    error,
    refetch,
  } = useGetEventConversationsForEventQuery(eventId, {
    refetchOnMountOrArgChange: autoRefetch,
  });
  
  const [quickCreateConversation, { isLoading: isQuickCreating }] = useQuickCreateEventConversationMutation();
  const [createConversation, { isLoading: isCreating }] = useCreateEventConversationMutation();
  const [notifyEventChanges] = useNotifyEventChangesMutation();

  // Computed values
  const conversations = conversationsData?.data || [];
  const activeConversations = conversations.filter(conv => conv.status === 'active');
  const hasActiveConversations = activeConversations.length > 0;
  
  // Quick create event conversation
  const quickCreateEventChat = useCallback(async (conversationType: string) => {
    try {
      const result = await quickCreateConversation({
        event_id: eventId,
        conversation_type: conversationType,
      }).unwrap();

      if (result.success) {
        const scopeLabels: Record<string, string> = {
          all_participants: 'All Participants',
          coaches_only: 'Coaches Only',
          players_only: 'Players Only',
          parents_only: 'Parents Only',
        };
        
        toast.success(`${scopeLabels[conversationType] || 'Event'} chat created!`);
        onChatCreated?.(result.data.conversation_id);
        refetch();
        
        return result.data;
      }
    } catch (error: any) {
      console.error('Error creating quick conversation:', error);
      
      if (error.data?.message?.includes('already exists')) {
        toast.error('A conversation for this scope already exists');
      } else {
        toast.error('Failed to create conversation');
      }
      
      throw error;
    }
  }, [eventId, quickCreateConversation, onChatCreated, refetch]);

  // Create custom event conversation
  const createEventChat = useCallback(async (options: CreateEventChatOptions) => {
    try {
      const request: CreateEventConversationRequest = {
        event_id: eventId,
        scope: options.scope || 'all_participants',
        name: options.name,
        description: options.description,
        settings: options.settings,
        custom_participant_ids: options.customParticipantIds,
      };

      const result = await createConversation(request).unwrap();

      if (result.success) {
        toast.success('Event conversation created successfully!');
        onChatCreated?.(result.data.conversation_id);
        refetch();
        
        return result.data;
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      
      if (error.data?.message?.includes('already exists')) {
        toast.error('A conversation for this scope already exists');
      } else {
        toast.error('Failed to create conversation');
      }
      
      throw error;
    }
  }, [eventId, createConversation, onChatCreated, refetch]);

  // Open chat conversation
  const openChat = useCallback(async (conversationId: string) => {
    try {
      setIsNavigatingToChat(true);
      
      // Set active conversation in Redux store
      dispatch(setActiveConversation(conversationId));
      
      // Navigate to chat
      router.push(`/chat?conversation=${conversationId}`);
      
      onChatOpened?.(conversationId);
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('Failed to open chat');
    } finally {
      setIsNavigatingToChat(false);
    }
  }, [dispatch, router, onChatOpened]);

  // Send event change notification to all event conversations
  const notifyParticipantsOfEventChange = useCallback(async (changeDescription: string) => {
    try {
      await notifyEventChanges({
        eventId,
        change_description: changeDescription,
      }).unwrap();
      
      toast.success('Event change notifications sent to chat participants');
      
      return true;
    } catch (error) {
      console.error('Error sending event change notifications:', error);
      toast.error('Failed to send event change notifications');
      
      return false;
    }
  }, [eventId, notifyEventChanges]);

  // Get conversation by scope
  const getConversationByScope = useCallback((scope: string) => {
    return activeConversations.find(conv => conv.scope === scope);
  }, [activeConversations]);

  // Check if scope has active conversation
  const hasScopeConversation = useCallback((scope: string) => {
    return activeConversations.some(conv => conv.scope === scope);
  }, [activeConversations]);

  // Get available scopes for quick creation
  const getAvailableScopes = useCallback(() => {
    const allScopes = ['all_participants', 'coaches_only', 'players_only', 'parents_only'];
    const existingScopes = activeConversations.map(conv => conv.scope);
    
    return allScopes.filter(scope => !existingScopes.includes(scope as any));
  }, [activeConversations]);

  // Create and open chat in one action
  const quickCreateAndOpenChat = useCallback(async (conversationType: string) => {
    try {
      const result = await quickCreateEventChat(conversationType);
      if (result) {
        await openChat(result.conversation_id);
      }
    } catch (error) {
      // Error already handled in quickCreateEventChat
    }
  }, [quickCreateEventChat, openChat]);

  return {
    // Data
    conversations,
    activeConversations,
    hasActiveConversations,
    
    // Loading states
    isLoading,
    isQuickCreating,
    isCreating,
    isNavigatingToChat,
    error,
    
    // Actions
    quickCreateEventChat,
    createEventChat,
    openChat,
    quickCreateAndOpenChat,
    notifyParticipantsOfEventChange,
    refetch,
    
    // Helpers
    getConversationByScope,
    hasScopeConversation,
    getAvailableScopes,
  };
};

export default useEventConversations;