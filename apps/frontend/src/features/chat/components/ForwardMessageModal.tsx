import React, { useState, useEffect } from 'react';
import { Forward, Search, Send, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Message, Conversation, useGetConversationsQuery, useSendMessageMutation } from '@/store/api/chatApi';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
}

const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: conversationsData, isLoading } = useGetConversationsQuery({ limit: 50 });
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedConversations([]);
      setAdditionalMessage('');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter conversations based on search
  const filteredConversations = conversationsData?.conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const conversationName = conv.name || conv.participants
      .filter(p => p.userId !== localStorage.getItem('current_user_id'))
      .map(p => p.user.name)
      .join(', ');
    
    return conversationName.toLowerCase().includes(searchLower);
  }) || [];

  // Handle conversation selection
  const handleToggleConversation = (conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  // Handle forward action
  const handleForward = async () => {
    if (selectedConversations.length === 0) {
      toast.error('Please select at least one conversation');
      return;
    }

    try {
      // Forward to each selected conversation
      const forwardPromises = selectedConversations.map(conversationId => {
        let forwardContent = `[Forwarded message from ${message.sender.name}]\n\n${message.content}`;
        
        if (additionalMessage.trim()) {
          forwardContent = `${additionalMessage}\n\n${forwardContent}`;
        }

        return sendMessage({
          conversationId,
          data: {
            content: forwardContent,
            type: message.type,
            attachmentIds: message.attachments?.map(a => a.id) || [],
          },
        });
      });

      await Promise.all(forwardPromises);
      
      toast.success(
        selectedConversations.length === 1 
          ? 'Message forwarded successfully' 
          : `Message forwarded to ${selectedConversations.length} conversations`
      );
      
      onClose();
    } catch (error) {
      toast.error('Failed to forward message');
      console.error('Forward error:', error);
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    const otherParticipants = conversation.participants.filter(
      p => p.userId !== localStorage.getItem('current_user_id')
    );
    
    return otherParticipants.map(p => p.user.name).join(', ');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar) return conversation.avatar;
    
    const otherParticipants = conversation.participants.filter(
      p => p.userId !== localStorage.getItem('current_user_id')
    );
    
    return otherParticipants[0]?.user.avatar;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5" />
            Forward Message
          </DialogTitle>
          <DialogDescription>
            Select conversations to forward this message to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Conversation list */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Select conversations ({selectedConversations.length} selected)
            </Label>
            <ScrollArea className="h-[200px] border rounded-lg p-2">
              {isLoading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No conversations found
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedConversations.includes(conversation.id)
                          ? "bg-primary/10 hover:bg-primary/20"
                          : "hover:bg-muted"
                      )}
                      onClick={() => handleToggleConversation(conversation.id)}
                    >
                      <Checkbox
                        checked={selectedConversations.includes(conversation.id)}
                        onCheckedChange={() => handleToggleConversation(conversation.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getConversationAvatar(conversation)} />
                        <AvatarFallback className="text-xs">
                          {getInitials(getConversationName(conversation))}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {getConversationName(conversation)}
                        </div>
                        {conversation.type !== 'direct' && (
                          <Badge variant="secondary" className="text-xs">
                            {conversation.type}
                          </Badge>
                        )}
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Additional message */}
          <div>
            <Label htmlFor="additional-message" className="text-sm font-medium">
              Add a message (optional)
            </Label>
            <Textarea
              id="additional-message"
              placeholder="Add a comment..."
              value={additionalMessage}
              onChange={(e) => setAdditionalMessage(e.target.value)}
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          {/* Original message preview */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Forwarding message from {message.sender.name}
            </div>
            <div className="text-sm line-clamp-3">
              {message.content}
            </div>
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Forward className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={selectedConversations.length === 0 || isSending}
          >
            {isSending ? (
              <>Forwarding...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Forward to {selectedConversations.length || 0}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageModal;