import React, { useState } from 'react';
import {
  Settings,
  Users,
  MessageCircle,
  Shield,
  Save,
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import {
  useUpdateAnnouncementChannelSettingsMutation,
  type Conversation,
} from '@/store/api/chatApi';

interface AnnouncementChannelSettingsProps {
  conversation: Conversation;
  onClose: () => void;
}

const AnnouncementChannelSettings: React.FC<AnnouncementChannelSettingsProps> = ({
  conversation,
  onClose,
}) => {
  const { toast } = useToast();
  const [updateSettings, { isLoading }] = useUpdateAnnouncementChannelSettingsMutation();

  const [name, setName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [allowPlayerReactions, setAllowPlayerReactions] = useState(
    conversation.metadata?.allowPlayerReactions !== false
  );

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Channel name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateSettings({
        conversationId: conversation.id,
        name: name.trim(),
        description: description.trim(),
        allowPlayerReactions,
      }).unwrap();

      toast({
        title: 'Success',
        description: 'Channel settings updated successfully',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update channel settings',
        variant: 'destructive',
      });
    }
  };

  // Get moderators from metadata
  const moderatorIds = conversation.metadata?.moderatorIds || [];
  const moderators = conversation.participants.filter(p => 
    moderatorIds.includes(p.userId)
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Announcement Channel Settings
          </DialogTitle>
          <DialogDescription>
            Manage settings for {conversation.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Channel Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter channel name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this announcement channel"
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Interaction Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Interaction Settings
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reactions">Allow Player Reactions</Label>
                <p className="text-sm text-muted-foreground">
                  Let players react to announcements with emojis
                </p>
              </div>
              <Switch
                id="reactions"
                checked={allowPlayerReactions}
                onCheckedChange={setAllowPlayerReactions}
              />
            </div>
          </div>

          <Separator />

          {/* Moderators */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Channel Moderators
            </h3>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Moderators can post announcements and manage channel settings
              </p>
              
              {moderators.length > 0 ? (
                <div className="space-y-2">
                  {moderators.map((moderator) => (
                    <div
                      key={moderator.userId}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={moderator.user.avatar} />
                        <AvatarFallback>
                          {moderator.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{moderator.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {moderator.user.email}
                        </p>
                      </div>
                      <Badge variant="secondary">Moderator</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No additional moderators assigned
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Channel Info */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Team: {conversation.metadata?.teamId || 'All Teams'}</p>
            <p>Members: {conversation.participants.length}</p>
            <p>Created: {new Date(conversation.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementChannelSettings;