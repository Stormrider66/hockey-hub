import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface CreateMeetingRequestModalProps {
  conversationId: string;
  coaches: any[];
  playerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const meetingTypes = [
  { value: 'in_person', label: 'In Person' },
  { value: 'video_call', label: 'Video Call' },
  { value: 'phone_call', label: 'Phone Call' },
];

const meetingPurposes = [
  { value: 'general_discussion', label: 'General Discussion' },
  { value: 'performance_review', label: 'Performance Review' },
  { value: 'injury_discussion', label: 'Injury Discussion' },
  { value: 'academic_concern', label: 'Academic Concern' },
  { value: 'behavioral_concern', label: 'Behavioral Concern' },
  { value: 'progress_update', label: 'Progress Update' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' },
];

const durations = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
];

export const CreateMeetingRequestModal: React.FC<CreateMeetingRequestModalProps> = ({
  conversationId,
  coaches,
  playerId,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    coachId: coaches[0]?.user_id || '',
    type: 'in_person',
    purpose: 'general_discussion',
    subject: '',
    message: '',
    proposedDate: undefined as Date | undefined,
    proposedTime: '09:00',
    alternateDate1: undefined as Date | undefined,
    alternateTime1: '09:00',
    alternateDate2: undefined as Date | undefined,
    alternateTime2: '09:00',
    duration: '30',
    location: '',
  });

  const handleSubmit = async () => {
    if (!formData.subject || !formData.message || !formData.proposedDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const proposedDateTime = new Date(formData.proposedDate);
      const [hours, minutes] = formData.proposedTime.split(':');
      proposedDateTime.setHours(parseInt(hours), parseInt(minutes));

      let alternateDateTime1 = undefined;
      if (formData.alternateDate1) {
        alternateDateTime1 = new Date(formData.alternateDate1);
        const [h1, m1] = formData.alternateTime1.split(':');
        alternateDateTime1.setHours(parseInt(h1), parseInt(m1));
      }

      let alternateDateTime2 = undefined;
      if (formData.alternateDate2) {
        alternateDateTime2 = new Date(formData.alternateDate2);
        const [h2, m2] = formData.alternateTime2.split(':');
        alternateDateTime2.setHours(parseInt(h2), parseInt(m2));
      }

      const response = await fetch('/api/private-coach-channels/meeting-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          conversationId,
          requesterId: localStorage.getItem('userId'), // In a real app, get from auth state
          coachId: formData.coachId,
          playerId,
          type: formData.type,
          purpose: formData.purpose,
          subject: formData.subject,
          message: formData.message,
          proposedDate: proposedDateTime.toISOString(),
          alternateDate1: alternateDateTime1?.toISOString(),
          alternateDate2: alternateDateTime2?.toISOString(),
          duration: parseInt(formData.duration),
          location: formData.location || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting request');
      }

      toast({
        title: 'Success',
        description: 'Meeting request sent successfully',
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send meeting request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a Meeting</DialogTitle>
          <DialogDescription>
            Schedule a meeting with your child's coach
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Coach Selection */}
          <div className="space-y-2">
            <Label htmlFor="coach">Select Coach *</Label>
            <Select
              value={formData.coachId}
              onValueChange={(value) => setFormData({ ...formData, coachId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a coach" />
              </SelectTrigger>
              <SelectContent>
                {coaches.map((coach) => (
                  <SelectItem key={coach.user_id} value={coach.user_id}>
                    {coach.user?.name || coach.nickname || 'Coach'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Type */}
          <div className="space-y-2">
            <Label>Meeting Type *</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <div className="grid grid-cols-3 gap-2">
                {meetingTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <Label htmlFor={type.value} className="font-normal cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose *</Label>
            <Select
              value={formData.purpose}
              onValueChange={(value) => setFormData({ ...formData, purpose: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meetingPurposes.map((purpose) => (
                  <SelectItem key={purpose.value} value={purpose.value}>
                    {purpose.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of the meeting topic"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Provide more details about what you'd like to discuss..."
              rows={4}
            />
          </div>

          {/* Proposed Date/Time */}
          <div className="space-y-2">
            <Label>Proposed Date & Time *</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !formData.proposedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.proposedDate ? (
                      format(formData.proposedDate, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.proposedDate}
                    onSelect={(date) => setFormData({ ...formData, proposedDate: date })}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={formData.proposedTime}
                onChange={(e) => setFormData({ ...formData, proposedTime: e.target.value })}
                className="w-32"
              />
            </div>
          </div>

          {/* Alternative Times */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Providing alternative times increases the chance of finding a suitable slot
            </AlertDescription>
          </Alert>

          {/* Alternative 1 */}
          <div className="space-y-2">
            <Label>Alternative Date & Time 1 (Optional)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !formData.alternateDate1 && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.alternateDate1 ? (
                      format(formData.alternateDate1, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.alternateDate1}
                    onSelect={(date) => setFormData({ ...formData, alternateDate1: date })}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={formData.alternateTime1}
                onChange={(e) => setFormData({ ...formData, alternateTime1: e.target.value })}
                className="w-32"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData({ ...formData, duration: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          {formData.type === 'in_person' && (
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., School office, Hockey rink"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};