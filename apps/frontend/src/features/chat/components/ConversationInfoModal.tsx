import React from 'react';
import { Users, Settings, VolumeX, Volume2, UserMinus, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BlockUserAction } from './BlockUserAction';
import { useGetConversationQuery } from '@/store/api/chatApi';

interface ConversationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

const ConversationInfoModal: React.FC<ConversationInfoModalProps> = ({
  isOpen,
  onClose,
  conversationId,
}) => {
  const { data: conversation } = useGetConversationQuery(conversationId, {
    skip: !conversationId || !isOpen,
  });

  // Get current user ID
  const currentUserId = localStorage.getItem('current_user_id') || '';

  // Normalize RTK Query conversation shape -> legacy/mock shape used by this modal
  const normalizedConversation: any = (() => {
    if (!conversation) return undefined;
    const c: any = conversation as any;
    const participants = Array.isArray(c.participants) ? c.participants : [];

    // RTK Query shape: participants[] has { userId, user: { name/email/avatar }, role }
    if (participants.length > 0 && participants[0]?.user) {
      const displayName =
        c.name ||
        (c.type === 'direct'
          ? participants.find((p: any) => p.userId !== currentUserId)?.user?.name || 'Direct Message'
          : 'Conversation');

      return {
        id: c.id,
        name: displayName,
        type: c.type,
        createdAt: c.createdAt || new Date().toISOString(),
        participants: participants.map((p: any) => ({
          id: p.userId,
          user_id: p.userId,
          name: p.user?.name || 'Unknown',
          email: p.user?.email || '',
          role: p.role === 'admin' ? 'admin' : 'member',
          avatar: p.user?.avatar || null,
        })),
        isMuted: participants.some((p: any) => Boolean(p.isMuted)),
      };
    }

    return c;
  })();

  // Mock data as fallback
  const mockConversation = normalizedConversation || {
    id: conversationId,
    name: 'Team Discussion',
    type: 'group',
    createdAt: '2024-06-29T10:00:00Z',
    participants: [
      { id: '1', user_id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', avatar: null },
      { id: '2', user_id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'member', avatar: null },
      { id: '3', user_id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'member', avatar: null },
    ],
    isMuted: false,
  };

  // For direct conversations, get the other participant
  const otherParticipant = mockConversation.type === 'direct' 
    ? mockConversation.participants?.find((p: any) => p.user_id !== currentUserId)
    : null;

  const handleMuteToggle = () => {
    console.log('Toggle mute for conversation:', conversationId);
  };

  const handleLeaveConversation = () => {
    console.log('Leave conversation:', conversationId);
    onClose();
  };

  const handleRemoveParticipant = (userId: string) => {
    console.log('Remove participant:', userId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Conversation Info
          </DialogTitle>
          <DialogDescription>
            Manage conversation settings and participants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conversation Details */}
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">{mockConversation.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {mockConversation.type} • {mockConversation.participants.length} participants
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Created {new Date(mockConversation.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleMuteToggle}
            >
              {mockConversation.isMuted ? (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Unmute
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Mute
                </>
              )}
            </Button>
            
            {mockConversation.type === 'direct' && otherParticipant ? (
              <BlockUserAction
                userId={otherParticipant.user_id}
                userName={otherParticipant.name}
                asButton
                onSuccess={onClose}
              />
            ) : (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleLeaveConversation}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Leave
              </Button>
            )}
          </div>

          {/* Participants */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants ({mockConversation.participants.length})
            </h4>
            
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {mockConversation.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.avatar || undefined} alt={participant.name} />
                        <AvatarFallback className="text-sm">
                          {participant.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{participant.name}</span>
                          {participant.role === 'admin' && (
                            <Badge variant="secondary" className="h-5 px-2 text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{participant.email}</p>
                      </div>
                    </div>

                    {participant.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Add Participants */}
          <div>
            <Button variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Add Participants
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationInfoModal;