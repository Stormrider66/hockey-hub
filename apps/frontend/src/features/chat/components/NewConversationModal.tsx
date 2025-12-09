import React, { useState } from 'react';
import { X, Plus, Users, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
}) => {
  const [conversationType, setConversationType] = useState<'direct' | 'group' | 'team'>('direct');
  const [conversationName, setConversationName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateConversation = () => {
    // TODO: Implement conversation creation
    console.log('Creating conversation:', { conversationType, conversationName, selectedUsers });
    
    // Mock conversation ID
    const mockConversationId = `conv-${Date.now()}`;
    onConversationCreated(mockConversationId);
  };

  const handleClose = () => {
    setConversationType('direct');
    setConversationName('');
    setSelectedUsers([]);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Conversation
          </DialogTitle>
          <DialogDescription>
            Start a new conversation with your team members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conversation Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Conversation Type</label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={conversationType === 'direct' ? "default" : "outline"}
                onClick={() => setConversationType('direct')}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-2" />
                Direct
              </Button>
              <Button
                size="sm"
                variant={conversationType === 'group' ? "default" : "outline"}
                onClick={() => setConversationType('group')}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Group
              </Button>
              <Button
                size="sm"
                variant={conversationType === 'team' ? "default" : "outline"}
                onClick={() => setConversationType('team')}
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Team
              </Button>
            </div>
          </div>

          {/* Conversation Name (for groups) */}
          {conversationType !== 'direct' && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                {conversationType === 'group' ? 'Group Name' : 'Team Chat Name'}
              </label>
              <Input
                placeholder={`Enter ${conversationType} name...`}
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
              />
            </div>
          )}

          {/* User Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">Add Participants</label>
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Selected ({selectedUsers.length})</label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((userId) => (
                  <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                    User {userId}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedUsers(prev => prev.filter(id => id !== userId))}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User List (placeholder) */}
          <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
            <div className="text-center py-4 text-sm text-muted-foreground">
              User search will be implemented here
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateConversation}
            disabled={conversationType !== 'direct' && selectedUsers.length === 0}
          >
            Create Conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationModal;