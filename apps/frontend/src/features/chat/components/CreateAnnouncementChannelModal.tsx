import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Megaphone,
  Users,
  Info,
  Settings,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useCreateAnnouncementChannelMutation,
  useGetUsersQuery,
} from '@/store/api/chatApi';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { useToast } from '@/components/ui/use-toast';

interface CreateAnnouncementChannelModalProps {
  teamId: string;
  organizationId: string;
  onClose: () => void;
  onSuccess?: (channelId: string) => void;
}

const CreateAnnouncementChannelModal: React.FC<CreateAnnouncementChannelModalProps> = ({
  teamId,
  organizationId,
  onClose,
  onSuccess,
}) => {
  const currentUser = useSelector(selectCurrentUser);
  const { toast } = useToast();
  const [createChannel, { isLoading }] = useCreateAnnouncementChannelMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allowPlayerReactions, setAllowPlayerReactions] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch team members
  const { data: users, isLoading: isLoadingUsers } = useGetUsersQuery({
    // In a real app, this would filter by teamId
    limit: 100,
  });

  const teamMembers = users || [];

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedParticipants(teamMembers.map(user => user.id));
    } else {
      setSelectedParticipants([]);
    }
  };

  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a channel name',
        variant: 'destructive',
      });
      return;
    }

    if (selectedParticipants.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one team member',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createChannel({
        name: name.trim(),
        description: description.trim(),
        teamId,
        organizationId,
        allowPlayerReactions,
        participantIds: selectedParticipants,
      }).unwrap();

      toast({
        title: 'Success',
        description: 'Announcement channel created successfully',
      });

      if (onSuccess) {
        onSuccess(result.id);
      } else {
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create announcement channel',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Create Announcement Channel
          </DialogTitle>
          <DialogDescription>
            Create a dedicated channel for team announcements. Only coaches can post in announcement channels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" />
              Channel Information
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Channel Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Team Announcements, Game Updates"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this announcement channel"
                rows={3}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Channel Settings
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reactions">Allow Player Reactions</Label>
                <p className="text-sm text-muted-foreground">
                  Players can react to announcements with emojis
                </p>
              </div>
              <Switch
                id="reactions"
                checked={allowPlayerReactions}
                onCheckedChange={setAllowPlayerReactions}
              />
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Team Members
              </div>
              <Badge variant="secondary">
                {selectedParticipants.length} selected
              </Badge>
            </div>

            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                Select all team members
              </Label>
            </div>

            <ScrollArea className="h-[200px]">
              {isLoadingUsers ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading team members...
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((user) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedParticipants.includes(user.id)
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      )}
                      onClick={() => handleToggleParticipant(user.id)}
                    >
                      <Checkbox
                        checked={selectedParticipants.includes(user.id)}
                        onCheckedChange={() => handleToggleParticipant(user.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              As the creator, you will automatically be added as a moderator of this channel.
              You can add additional moderators after creating the channel.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !name.trim() || selectedParticipants.length === 0}
          >
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2">⏳</span>
                Creating...
              </>
            ) : (
              <>
                <Megaphone className="h-4 w-4 mr-2" />
                Create Channel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAnnouncementChannelModal;