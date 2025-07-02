import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserPicker } from '@/components/ui/user-picker';
import { CalendarIcon, Clock, MapPin, Users, Globe, AlertCircle } from 'lucide-react';
import { format, addHours, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  EventType,
  EventVisibility,
  CreateEventDto,
  useCreateEventMutation,
  useCheckEventConflictsMutation,
  useGetUserTeamsQuery,
} from '@/store/api/calendarApi';
import { useCreateEventConversationMutation } from '@/store/api/eventConversationApi';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  suggestedTitle?: string;
  suggestedDate?: string;
  suggestedParticipants?: string[];
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  suggestedTitle = '',
  suggestedDate,
  suggestedParticipants = [],
}) => {
  const userId = localStorage.getItem('current_user_id') || '';
  const organizationId = localStorage.getItem('organization_id') || '';
  
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [checkConflicts] = useCheckEventConflictsMutation();
  const [createEventConversation] = useCreateEventConversationMutation();
  const { data: userTeams } = useGetUserTeamsQuery(userId);

  const [formData, setFormData] = useState<Partial<CreateEventDto>>({
    title: suggestedTitle,
    type: EventType.MEETING,
    startTime: suggestedDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addHours(new Date(suggestedDate || new Date()), 1), "yyyy-MM-dd'T'HH:mm"),
    description: '',
    location: '',
    onlineUrl: '',
    teamId: '',
    visibility: EventVisibility.TEAM,
    participants: suggestedParticipants.map(id => ({ userId: id, type: 'required' as const })),
    sendReminders: true,
    reminderMinutes: [60, 15],
    organizationId,
    createdBy: userId,
  });

  const [conflicts, setConflicts] = useState<any[]>([]);
  const [createChatForEvent, setCreateChatForEvent] = useState(!!conversationId);

  // Check for conflicts when date/time changes
  useEffect(() => {
    if (formData.startTime && formData.endTime && formData.participants?.length) {
      checkConflicts({
        startTime: formData.startTime,
        endTime: formData.endTime,
        participantIds: formData.participants.map(p => p.userId),
      }).then((result) => {
        if ('data' in result && result.data.hasConflict) {
          setConflicts(result.data.conflictingEvents || []);
        } else {
          setConflicts([]);
        }
      });
    }
  }, [formData.startTime, formData.endTime, formData.participants, checkConflicts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const eventData: CreateEventDto = {
        ...formData as CreateEventDto,
        metadata: conversationId ? { fromConversationId: conversationId } : {},
      };

      const result = await createEvent(eventData).unwrap();
      
      // Create event conversation if requested
      if (createChatForEvent && result.id) {
        await createEventConversation({
          event_id: result.id,
          scope: 'all_participants',
          send_welcome_message: true,
          settings: {
            showEventDetails: true,
            allowQuickActions: true,
            notifyOnEventChanges: true,
            notifyOnEventReminders: true,
          },
        }).unwrap();
      }
      
      toast.success('Event created successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to create event');
      console.error('Error creating event:', error);
    }
  };

  const eventTypeOptions = [
    { value: EventType.MEETING, label: 'Meeting' },
    { value: EventType.TRAINING, label: 'Training' },
    { value: EventType.GAME, label: 'Game' },
    { value: EventType.TEAM_EVENT, label: 'Team Event' },
    { value: EventType.PERSONAL, label: 'Personal' },
    { value: EventType.OTHER, label: 'Other' },
  ];

  const reminderOptions = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 1440, label: '1 day' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Schedule a new event and optionally create a chat conversation for it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <div className="relative">
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="relative">
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Conflicts Warning */}
          {conflicts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Schedule Conflicts Detected</p>
                  <ul className="mt-1 text-sm text-yellow-700">
                    {conflicts.map((conflict, idx) => (
                      <li key={idx}>
                        • {conflict.title} ({format(parseISO(conflict.startTime), 'MMM d, h:mm a')})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add event details..."
              rows={3}
            />
          </div>

          {/* Location and Online URL */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter location"
                />
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="onlineUrl">Online Meeting URL</Label>
              <div className="relative">
                <Input
                  id="onlineUrl"
                  type="url"
                  value={formData.onlineUrl}
                  onChange={(e) => setFormData({ ...formData, onlineUrl: e.target.value })}
                  placeholder="https://..."
                />
                <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Team and Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team">Team (Optional)</Label>
              <Select
                value={formData.teamId}
                onValueChange={(value) => setFormData({ ...formData, teamId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No team</SelectItem>
                  {userTeams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) => setFormData({ ...formData, visibility: value as EventVisibility })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EventVisibility.PUBLIC}>Public</SelectItem>
                  <SelectItem value={EventVisibility.TEAM}>Team Only</SelectItem>
                  <SelectItem value={EventVisibility.PRIVATE}>Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Participants</Label>
            <UserPicker
              value={formData.participants?.map(p => p.userId) || []}
              onChange={(userIds) => 
                setFormData({
                  ...formData,
                  participants: userIds.map(id => ({ userId: id, type: 'required' as const }))
                })
              }
              multiple
              placeholder="Add participants..."
            />
            <p className="text-xs text-muted-foreground">
              Selected participants will be notified about the event
            </p>
          </div>

          {/* Reminders */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminders">Send Reminders</Label>
              <Switch
                id="reminders"
                checked={formData.sendReminders}
                onCheckedChange={(checked) => setFormData({ ...formData, sendReminders: checked })}
              />
            </div>
            
            {formData.sendReminders && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {reminderOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.reminderMinutes?.includes(option.value)}
                      onChange={(e) => {
                        const current = formData.reminderMinutes || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            reminderMinutes: [...current, option.value].sort((a, b) => b - a)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            reminderMinutes: current.filter(m => m !== option.value)
                          });
                        }
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Create Chat Option */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="space-y-1">
              <Label htmlFor="createChat">Create Event Chat</Label>
              <p className="text-xs text-muted-foreground">
                Automatically create a chat conversation for this event
              </p>
            </div>
            <Switch
              id="createChat"
              checked={createChatForEvent}
              onCheckedChange={setCreateChatForEvent}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};