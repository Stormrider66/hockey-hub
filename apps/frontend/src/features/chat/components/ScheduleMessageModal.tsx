import React, { useState } from 'react';
import { format, addMinutes, addHours, addDays, startOfDay, setHours, setMinutes } from 'date-fns';
import { CalendarDays, Clock, Send, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useCreateScheduledMessageMutation } from '@/store/api/scheduledMessageApi';

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  replyToMessage?: {
    id: string;
    content: string;
    sender: { name: string };
  };
  initialContent?: string;
}

type ScheduleOption = 'in-30-min' | 'in-1-hour' | 'in-3-hours' | 'tomorrow-morning' | 'tomorrow-afternoon' | 'custom';

const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  replyToMessage,
  initialContent = '',
}) => {
  const [content, setContent] = useState(initialContent);
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>('in-30-min');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState({ hour: '09', minute: '00' });
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  const [createScheduledMessage, { isLoading }] = useCreateScheduledMessageMutation();

  const getScheduledTime = (): Date => {
    const now = new Date();
    
    switch (scheduleOption) {
      case 'in-30-min':
        return addMinutes(now, 30);
      case 'in-1-hour':
        return addHours(now, 1);
      case 'in-3-hours':
        return addHours(now, 3);
      case 'tomorrow-morning':
        return setMinutes(setHours(addDays(startOfDay(now), 1), 9), 0);
      case 'tomorrow-afternoon':
        return setMinutes(setHours(addDays(startOfDay(now), 1), 14), 0);
      case 'custom':
        if (!customDate) return now;
        return setMinutes(
          setHours(customDate, parseInt(customTime.hour)),
          parseInt(customTime.minute)
        );
      default:
        return now;
    }
  };

  const handleSchedule = async () => {
    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const scheduledFor = getScheduledTime();
    
    if (scheduledFor <= new Date()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    try {
      await createScheduledMessage({
        conversationId,
        content: content.trim(),
        type: 'text',
        scheduledFor: scheduledFor.toISOString(),
        replyToId: replyToMessage?.id,
        timezone,
      }).unwrap();

      toast.success(`Message scheduled for ${format(scheduledFor, 'PPp')}`);
      onClose();
      setContent('');
      setScheduleOption('in-30-min');
      setCustomDate(undefined);
    } catch (error) {
      toast.error('Failed to schedule message');
      console.error('Schedule error:', error);
    }
  };

  const scheduleOptions = [
    { value: 'in-30-min', label: 'In 30 minutes' },
    { value: 'in-1-hour', label: 'In 1 hour' },
    { value: 'in-3-hours', label: 'In 3 hours' },
    { value: 'tomorrow-morning', label: 'Tomorrow at 9:00 AM' },
    { value: 'tomorrow-afternoon', label: 'Tomorrow at 2:00 PM' },
    { value: 'custom', label: 'Pick a custom time...' },
  ];

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Message</DialogTitle>
          <DialogDescription>
            Schedule your message to be sent at a specific time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reply preview */}
          {replyToMessage && (
            <div className="p-3 bg-muted/30 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">
                Replying to {replyToMessage.sender.name}
              </p>
              <p className="text-sm line-clamp-2">{replyToMessage.content}</p>
            </div>
          )}

          {/* Message content */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[100px]"
              autoFocus
            />
          </div>

          {/* Schedule options */}
          <div className="space-y-2">
            <Label>When to send</Label>
            <RadioGroup
              value={scheduleOption}
              onValueChange={(value) => setScheduleOption(value as ScheduleOption)}
            >
              {scheduleOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="font-normal cursor-pointer flex-1"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom date/time picker */}
          {scheduleOption === 'custom' && (
            <div className="space-y-3 p-3 border rounded-lg">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {customDate ? format(customDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={setCustomDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hour</Label>
                  <Select
                    value={customTime.hour}
                    onValueChange={(value) =>
                      setCustomTime((prev) => ({ ...prev, hour: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Minute</Label>
                  <Select
                    value={customTime.minute}
                    onValueChange={(value) =>
                      setCustomTime((prev) => ({ ...prev, minute: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Preview scheduled time */}
          <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              Will be sent: <strong>{format(getScheduledTime(), 'PPp')}</strong>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isLoading || !content.trim()}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Scheduling...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Schedule Message
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMessageModal;