'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, MapPin, Video, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import RecurrenceSettings, { RecurrenceRule } from './RecurrenceSettings';
import {
  EventType,
  EventVisibility,
  useCreateEventMutation,
  useCreateRecurringEventMutation,
  useCheckConflictsMutation,
} from '@/store/api/calendarApi';
import { toast } from 'react-hot-toast';
import { SlotInfo } from 'react-big-calendar';
import { getEventTypesByRole, getDefaultEventVisibility } from '../utils/permissions';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  teamId?: string;
  userId: string;
  userRole: string;
  initialSlot?: SlotInfo | null;
}

const eventTypeOptions = [
  { value: EventType.TRAINING, label: 'Training' },
  { value: EventType.GAME, label: 'Game' },
  { value: EventType.MEETING, label: 'Meeting' },
  { value: EventType.MEDICAL, label: 'Medical Appointment' },
  { value: EventType.EQUIPMENT, label: 'Equipment Session' },
  { value: EventType.TEAM_EVENT, label: 'Team Event' },
  { value: EventType.PERSONAL, label: 'Personal' },
  { value: EventType.OTHER, label: 'Other' },
];

const visibilityOptions = [
  { value: EventVisibility.PUBLIC, label: 'Public' },
  { value: EventVisibility.TEAM, label: 'Team Only' },
  { value: EventVisibility.PRIVATE, label: 'Private' },
];

export default function CreateEventModal({
  isOpen,
  onClose,
  organizationId,
  teamId,
  userId,
  userRole,
  initialSlot,
}: CreateEventModalProps) {
  const [createEvent, { isLoading }] = useCreateEventMutation();
  const [createRecurringEvent, { isLoading: isCreatingRecurring }] = useCreateRecurringEventMutation();
  const [checkConflicts] = useCheckConflictsMutation();

  // Get allowed event types for user role
  const allowedEventTypes = getEventTypesByRole(userRole);
  const filteredEventTypeOptions = eventTypeOptions.filter(option => 
    allowedEventTypes.includes(option.value)
  );

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: allowedEventTypes[0] || EventType.OTHER,
    visibility: getDefaultEventVisibility(userRole, allowedEventTypes[0] || EventType.OTHER),
    startDate: initialSlot?.start || new Date(),
    startTime: format(initialSlot?.start || new Date(), 'HH:mm'),
    endDate: initialSlot?.end || new Date(),
    endTime: format(initialSlot?.end || new Date(), 'HH:mm'),
    location: '',
    onlineUrl: '',
    allDay: false,
    sendReminders: true,
    maxParticipants: '',
    isRecurring: false,
    recurrenceRule: undefined as RecurrenceRule | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }

    const startDateTime = new Date(formData.startDate);
    const [startHour, startMinute] = formData.startTime.split(':');
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

    const endDateTime = new Date(formData.endDate);
    const [endHour, endMinute] = formData.endTime.split(':');
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      // Check for conflicts first
      const conflictResult = await checkConflicts({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participantIds: [userId],
      }).unwrap();

      if (conflictResult.hasConflict) {
        const proceed = confirm(
          'You have conflicting events at this time. Do you want to continue?'
        );
        if (!proceed) return;
      }

      const eventData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        visibility: formData.visibility,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: formData.location,
        onlineUrl: formData.onlineUrl,
        organizationId,
        teamId,
        createdBy: userId,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        sendReminders: formData.sendReminders,
        participants: [{ userId, role: 'organizer' as const }],
      };

      // Add recurrence data if enabled and use the appropriate endpoint
      if (formData.isRecurring && formData.recurrenceRule) {
        eventData.recurrence = {
          frequency: formData.recurrenceRule.frequency,
          interval: formData.recurrenceRule.interval,
          count: formData.recurrenceRule.count,
          endDate: formData.recurrenceRule.until?.toISOString(),
          weekDays: formData.recurrenceRule.byWeekday,
          monthDays: formData.recurrenceRule.byMonthDay,
          months: formData.recurrenceRule.byMonth,
          exceptionDates: formData.recurrenceRule.exceptions?.map(d => d.toISOString()),
        };
        await createRecurringEvent(eventData).unwrap();
      } else {
        await createEvent(eventData).unwrap();
      }

      toast.success('Event created successfully');
      handleClose();
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: EventType.OTHER,
      visibility: EventVisibility.TEAM,
      startDate: new Date(),
      startTime: format(new Date(), 'HH:mm'),
      endDate: new Date(),
      endTime: format(new Date(), 'HH:mm'),
      location: '',
      onlineUrl: '',
      allDay: false,
      sendReminders: true,
      maxParticipants: '',
      isRecurring: false,
      recurrenceRule: undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: EventType) =>
                  setFormData({ 
                    ...formData, 
                    type: value,
                    visibility: getDefaultEventVisibility(userRole, value)
                  })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredEventTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value: EventVisibility) =>
                  setFormData({ ...formData, visibility: value })
                }
              >
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibilityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allDay"
              checked={formData.allDay}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allDay: checked })
              }
            />
            <Label htmlFor="allDay">All day event</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal flex-1',
                        !formData.startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.startDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, startDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {!formData.allDay && (
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="pl-10 w-32"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal flex-1',
                        !formData.endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.endDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, endDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {!formData.allDay && (
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="pl-10 w-32"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Enter location"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onlineUrl">Online Meeting URL</Label>
            <div className="relative">
              <Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="onlineUrl"
                type="url"
                value={formData.onlineUrl}
                onChange={(e) =>
                  setFormData({ ...formData, onlineUrl: e.target.value })
                }
                placeholder="https://meet.example.com/..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Maximum Participants</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) =>
                  setFormData({ ...formData, maxParticipants: e.target.value })
                }
                placeholder="Leave empty for unlimited"
                className="pl-10"
                min="1"
              />
            </div>
          </div>

          {/* Recurrence Settings */}
          <RecurrenceSettings
            enabled={formData.isRecurring}
            onEnabledChange={(enabled) =>
              setFormData({ ...formData, isRecurring: enabled })
            }
            recurrenceRule={formData.recurrenceRule}
            onRecurrenceChange={(rule) =>
              setFormData({ ...formData, recurrenceRule: rule })
            }
            startDate={formData.startDate}
          />

          <div className="flex items-center space-x-2">
            <Switch
              id="sendReminders"
              checked={formData.sendReminders}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, sendReminders: checked })
              }
            />
            <Label htmlFor="sendReminders">Send reminders</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isCreatingRecurring}>
              {isLoading || isCreatingRecurring ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}