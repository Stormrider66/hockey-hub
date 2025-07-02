import React, { useState } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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
import { cn } from '@/lib/utils';
import { useCreateConversationMutation, useSendMessageMutation } from '@/store/api/chatApi';
import { User } from '@/components/ui/user-picker';

interface QuickMessageActionProps {
  user: User;
  currentUserId: string;
  onConversationCreated?: (conversationId: string) => void;
  onMessageSent?: () => void;
  variant?: 'button' | 'icon' | 'minimal';
  mode?: 'popup' | 'dialog';
  showUserInfo?: boolean;
  className?: string;
}

const QuickMessageAction: React.FC<QuickMessageActionProps> = ({
  user,
  currentUserId,
  onConversationCreated,
  onMessageSent,
  variant = 'button',
  mode = 'popup',
  showUserInfo = true,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [createConversation] = useCreateConversationMutation();
  const [sendMessage] = useSendMessageMutation();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || user.id === currentUserId) return;

    setIsLoading(true);

    try {
      // First, create or find the direct conversation
      const conversationResponse = await createConversation({
        type: 'direct',
        participantIds: [user.id], // The current user is automatically added by the backend
      }).unwrap();

      const conversationId = conversationResponse.id;

      // Send the message
      await sendMessage({
        conversationId,
        content: message.trim(),
        type: 'text',
      }).unwrap();

      // Notify parent components
      if (onConversationCreated) {
        onConversationCreated(conversationId);
      }
      if (onMessageSent) {
        onMessageSent();
      }

      // Close the dialog/popup and clear message
      setIsOpen(false);
      setMessage('');
    } catch (error) {
      console.error('Failed to send quick message:', error);
      // TODO: Show error toast notification
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderTrigger = () => {
    switch (variant) {
      case 'icon':
        return (
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", className)}
            disabled={user.id === currentUserId}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        );
      
      case 'minimal':
        return (
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-6 px-2 text-xs", className)}
            disabled={user.id === currentUserId}
          >
            Message
          </Button>
        );
      
      default:
        return (
          <Button
            variant="outline"
            size="sm"
            className={className}
            disabled={user.id === currentUserId}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
        );
    }
  };

  const renderContent = () => (
    <div className="space-y-4">
      {/* User info */}
      {showUserInfo && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            {user.status && (
              <div className={cn(
                "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                user.status === 'online' ? 'bg-green-500' :
                user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
              )} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{user.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{user.email}</span>
              {user.role && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {user.role}
                </Badge>
              )}
              {user.team && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {user.team}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Message</label>
          <Textarea
            placeholder={`Send a message to ${user.name}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="mt-1 min-h-[80px] resize-none"
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Don't render if trying to message yourself
  if (user.id === currentUserId) {
    return null;
  }

  if (mode === 'dialog') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {renderTrigger()}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a direct message to {user.name}
            </DialogDescription>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {renderTrigger()}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Send Message</h4>
          <p className="text-xs text-muted-foreground">
            Send a direct message to {user.name}
          </p>
        </div>
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
};

export default QuickMessageAction;