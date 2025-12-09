import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MessageCircle, Plus, Users, MessageSquare, UserCheck, Baby } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useQuickCreateEventConversationMutation,
  useCreateEventConversationMutation,
  useGetEventConversationsForEventQuery,
  CreateEventConversationRequest,
} from '@/store/api/eventConversationApi';

interface EventChatActionsProps {
  eventId: string;
  eventTitle: string;
  eventType: string;
  participantCount?: number;
  onChatCreated?: (conversationId: string) => void;
  className?: string;
}

interface CreateConversationFormData {
  scope: 'all_participants' | 'coaches_only' | 'players_only' | 'parents_only' | 'custom';
  name: string;
  description: string;
  auto_add_participants: boolean;
  send_welcome_message: boolean;
  settings: {
    allowFileSharing: boolean;
    allowVoiceMessages: boolean;
    allowVideoMessages: boolean;
    moderatedMode: boolean;
    notifyOnEventReminders: boolean;
    notifyOnEventChanges: boolean;
    notifyOnRSVPChanges: boolean;
    autoArchiveAfterEvent: boolean;
    archiveDelayHours: number;
    showEventDetails: boolean;
    allowQuickActions: boolean;
  };
}

const EventChatActions: React.FC<EventChatActionsProps> = ({
  eventId,
  eventTitle,
  eventType,
  participantCount = 0,
  onChatCreated,
  className = '',
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CreateConversationFormData>({
    scope: 'all_participants',
    name: `${eventTitle} Discussion`,
    description: `Chat for ${eventTitle}`,
    auto_add_participants: true,
    send_welcome_message: true,
    settings: {
      allowFileSharing: true,
      allowVoiceMessages: true,
      allowVideoMessages: true,
      moderatedMode: false,
      notifyOnEventReminders: true,
      notifyOnEventChanges: true,
      notifyOnRSVPChanges: true,
      autoArchiveAfterEvent: true,
      archiveDelayHours: 24,
      showEventDetails: true,
      allowQuickActions: true,
    },
  });

  // API hooks
  const [quickCreateConversation, { isLoading: isQuickCreating }] = useQuickCreateEventConversationMutation();
  const [createConversation, { isLoading: isCreating }] = useCreateEventConversationMutation();
  const { data: existingConversations, refetch } = useGetEventConversationsForEventQuery(eventId);

  const handleQuickCreate = async (conversationType: string) => {
    try {
      const result = await quickCreateConversation({
        event_id: eventId,
        conversation_type: conversationType,
      }).unwrap();

      if (result.success) {
        toast.success(`${getScopeLabel(conversationType)} chat created!`);
        onChatCreated?.(result.data.conversation_id);
        refetch();
      }
    } catch (error: any) {
      console.error('Error creating quick conversation:', error);
      if (error.data?.message?.includes('already exists')) {
        toast.error('A conversation for this scope already exists');
      } else {
        toast.error('Failed to create conversation');
      }
    }
  };

  const handleCreateConversation = async () => {
    try {
      const request: CreateEventConversationRequest = {
        event_id: eventId,
        scope: formData.scope,
        name: formData.name,
        description: formData.description,
        auto_add_participants: formData.auto_add_participants,
        send_welcome_message: formData.send_welcome_message,
        settings: formData.settings,
      };

      const result = await createConversation(request).unwrap();

      if (result.success) {
        toast.success('Event conversation created successfully!');
        setShowCreateDialog(false);
        onChatCreated?.(result.data.conversation_id);
        refetch();
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      if (error.data?.message?.includes('already exists')) {
        toast.error('A conversation for this scope already exists');
      } else {
        toast.error('Failed to create conversation');
      }
    }
  };

  const getScopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      all_participants: 'All Participants',
      coaches_only: 'Coaches Only',
      players_only: 'Players Only',
      parents_only: 'Parents Only',
    };
    return labels[scope] || scope;
  };

  const getScopeIcon = (scope: string) => {
    const icons: Record<string, React.ReactNode> = {
      all_participants: <Users className="w-4 h-4" />,
      coaches_only: <UserCheck className="w-4 h-4" />,
      players_only: <MessageSquare className="w-4 h-4" />,
      parents_only: <Baby className="w-4 h-4" />,
    };
    return icons[scope] || <MessageCircle className="w-4 h-4" />;
  };

  const existingScopes = existingConversations?.data
    ?.filter(ec => ec.status === 'active')
    ?.map(ec => ec.scope) || [];

  const quickCreateOptions = [
    { scope: 'all_participants', label: 'All Participants', icon: <Users className="w-4 h-4" /> },
    { scope: 'coaches_only', label: 'Coaches Only', icon: <UserCheck className="w-4 h-4" /> },
    { scope: 'players_only', label: 'Players Only', icon: <MessageSquare className="w-4 h-4" /> },
    { scope: 'parents_only', label: 'Parents Only', icon: <Baby className="w-4 h-4" /> },
  ].filter(option => !existingScopes.includes(option.scope as any));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {quickCreateOptions.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                Quick Create
              </div>
              {quickCreateOptions.map((option) => (
                <DropdownMenuItem
                  key={option.scope}
                  onClick={() => handleQuickCreate(option.scope)}
                  disabled={isQuickCreating}
                  className="cursor-pointer"
                >
                  {option.icon}
                  <span className="ml-2">{option.label}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-2">Custom Chat</span>
          </DropdownMenuItem>
          
          {existingConversations?.data && existingConversations.data.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                Existing Chats
              </div>
              {existingConversations.data
                .filter(ec => ec.status === 'active')
                .map((conversation) => (
                  <DropdownMenuItem
                    key={conversation.id}
                    onClick={() => onChatCreated?.(conversation.conversation_id)}
                    className="cursor-pointer"
                  >
                    {getScopeIcon(conversation.scope)}
                    <span className="ml-2">{getScopeLabel(conversation.scope)}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {conversation.participantCount}
                    </span>
                  </DropdownMenuItem>
                ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Conversation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Event Chat</DialogTitle>
            <DialogDescription>
              Create a custom chat for "{eventTitle}" with specific settings and participants.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="scope">Participant Scope</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, scope: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_participants">All Participants</SelectItem>
                    <SelectItem value="coaches_only">Coaches Only</SelectItem>
                    <SelectItem value="players_only">Players Only</SelectItem>
                    <SelectItem value="parents_only">Parents Only</SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Chat Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter chat name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Enter chat description"
                  rows={2}
                />
              </div>
            </div>

            {/* Chat Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Chat Options</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-add">Auto-add new event participants</Label>
                <Switch
                  id="auto-add"
                  checked={formData.auto_add_participants}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, auto_add_participants: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="welcome">Send welcome message</Label>
                <Switch
                  id="welcome"
                  checked={formData.send_welcome_message}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, send_welcome_message: checked }))
                  }
                />
              </div>
            </div>

            {/* Feature Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Features</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="file-sharing">File sharing</Label>
                  <Switch
                    id="file-sharing"
                    checked={formData.settings.allowFileSharing}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, allowFileSharing: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-messages">Voice messages</Label>
                  <Switch
                    id="voice-messages"
                    checked={formData.settings.allowVoiceMessages}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, allowVoiceMessages: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="video-messages">Video messages</Label>
                  <Switch
                    id="video-messages"
                    checked={formData.settings.allowVideoMessages}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, allowVideoMessages: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="moderated">Moderated mode</Label>
                  <Switch
                    id="moderated"
                    checked={formData.settings.moderatedMode}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, moderatedMode: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notifications</h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-reminders">Event reminders</Label>
                  <Switch
                    id="notify-reminders"
                    checked={formData.settings.notifyOnEventReminders}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, notifyOnEventReminders: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-changes">Event changes</Label>
                  <Switch
                    id="notify-changes"
                    checked={formData.settings.notifyOnEventChanges}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, notifyOnEventChanges: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-rsvp">RSVP changes</Label>
                  <Switch
                    id="notify-rsvp"
                    checked={formData.settings.notifyOnRSVPChanges}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, notifyOnRSVPChanges: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Auto-archive Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-archive">Auto-archive after event</Label>
                <Switch
                  id="auto-archive"
                  checked={formData.settings.autoArchiveAfterEvent}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, autoArchiveAfterEvent: checked }
                    }))
                  }
                />
              </div>

              {formData.settings.autoArchiveAfterEvent && (
                <div>
                  <Label htmlFor="archive-delay">Archive delay (hours after event ends)</Label>
                  <Input
                    id="archive-delay"
                    type="number"
                    min="1"
                    max="168"
                    value={formData.settings.archiveDelayHours}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, archiveDelayHours: parseInt(e.target.value) || 24 }
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={isCreating || !formData.name.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Chat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventChatActions;