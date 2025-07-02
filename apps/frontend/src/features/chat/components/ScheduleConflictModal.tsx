import React, { useState } from 'react';
import { X, AlertTriangle, Calendar, Clock, Users, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useScheduleClarificationApi } from '@/store/api/scheduleClarificationApi';
import { format } from 'date-fns';

interface ScheduleConflictModalProps {
  eventId: string;
  eventDetails: {
    name: string;
    date: Date;
    time: string;
    location: string;
    type: string;
  };
  organizationId: string;
  teamId: string;
  currentUserId: string;
  onClose: () => void;
  onSuccess?: (clarificationId: string) => void;
}

export const ScheduleConflictModal: React.FC<ScheduleConflictModalProps> = ({
  eventId,
  eventDetails,
  organizationId,
  teamId,
  currentUserId,
  onClose,
  onSuccess,
}) => {
  const [conflictType, setConflictType] = useState('schedule_conflict');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [conflictingEventName, setConflictingEventName] = useState('');
  const [conflictReason, setConflictReason] = useState('');
  const [affectedPlayers, setAffectedPlayers] = useState<string[]>([]);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [proposedLocation, setProposedLocation] = useState('');
  const [includeCoaches, setIncludeCoaches] = useState(true);
  const [includeTeamManager, setIncludeTeamManager] = useState(true);
  const [includeParents, setIncludeParents] = useState(false);

  const [createClarification, { isLoading }] = useScheduleClarificationApi.useCreateClarificationMutation();

  const conflictTypes = [
    { value: 'schedule_conflict', label: 'Schedule Conflict' },
    { value: 'time_change', label: 'Request Time Change' },
    { value: 'location_change', label: 'Request Location Change' },
    { value: 'weather_concern', label: 'Weather Concern' },
    { value: 'transportation_coordination', label: 'Transportation Issue' },
    { value: 'cancellation', label: 'Request Cancellation' },
    { value: 'general_inquiry', label: 'General Question' },
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'text-gray-500' },
    { value: 'medium', label: 'Medium', color: 'text-blue-500' },
    { value: 'high', label: 'High', color: 'text-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Build participant list based on selections
      const participantIds = [currentUserId];
      // In a real app, you would fetch actual user IDs for coaches, managers, etc.
      // For now, we'll use placeholder logic

      const conflictDetails = conflictType === 'schedule_conflict' ? {
        conflicting_event_name: conflictingEventName,
        conflict_reason: conflictReason,
        affected_players: affectedPlayers,
      } : undefined;

      const eventDetailsWithProposed = {
        event_name: eventDetails.name,
        event_type: eventDetails.type,
        original_date: eventDetails.date,
        original_time: eventDetails.time,
        original_location: eventDetails.location,
        proposed_date: proposedDate || undefined,
        proposed_time: proposedTime || undefined,
        proposed_location: proposedLocation || undefined,
      };

      const result = await createClarification({
        eventId,
        eventDetails: eventDetailsWithProposed,
        type: conflictType,
        title: title || `${conflictTypes.find(t => t.value === conflictType)?.label} - ${eventDetails.name}`,
        description,
        teamId,
        participantIds,
        priority,
        conflictDetails,
      }).unwrap();

      if (onSuccess) {
        onSuccess(result.id);
      }
      onClose();
    } catch (error) {
      console.error('Failed to create clarification:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Report Schedule Issue
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Event Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{format(eventDetails.date, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{eventDetails.time}</span>
                </div>
                <div className="col-span-2">{eventDetails.name}</div>
                <div className="col-span-2 text-gray-600">{eventDetails.location}</div>
              </div>
            </div>

            {/* Conflict Type */}
            <div className="space-y-2">
              <Label htmlFor="conflictType">Issue Type</Label>
              <Select value={conflictType} onValueChange={setConflictType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conflictTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <span className={level.color}>{level.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide details about the issue..."
                rows={4}
                required
              />
            </div>

            {/* Conflict-specific fields */}
            {conflictType === 'schedule_conflict' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Conflict Details</h4>
                <div className="space-y-2">
                  <Label htmlFor="conflictingEvent">Conflicting Event</Label>
                  <Input
                    id="conflictingEvent"
                    value={conflictingEventName}
                    onChange={(e) => setConflictingEventName(e.target.value)}
                    placeholder="Name of conflicting event"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conflictReason">Reason for Conflict</Label>
                  <Textarea
                    id="conflictReason"
                    value={conflictReason}
                    onChange={(e) => setConflictReason(e.target.value)}
                    placeholder="Explain why this is a conflict..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Proposed Changes */}
            {(conflictType === 'time_change' || conflictType === 'location_change' || conflictType === 'rescheduling_request') && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Proposed Changes</h4>
                {(conflictType === 'time_change' || conflictType === 'rescheduling_request') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="proposedDate">Proposed Date</Label>
                      <Input
                        id="proposedDate"
                        type="date"
                        value={proposedDate}
                        onChange={(e) => setProposedDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proposedTime">Proposed Time</Label>
                      <Input
                        id="proposedTime"
                        type="time"
                        value={proposedTime}
                        onChange={(e) => setProposedTime(e.target.value)}
                      />
                    </div>
                  </>
                )}
                {(conflictType === 'location_change' || conflictType === 'rescheduling_request') && (
                  <div className="space-y-2">
                    <Label htmlFor="proposedLocation">Proposed Location</Label>
                    <Input
                      id="proposedLocation"
                      value={proposedLocation}
                      onChange={(e) => setProposedLocation(e.target.value)}
                      placeholder="Suggested alternative location"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Notification Recipients */}
            <div className="space-y-3">
              <Label>Notify</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCoaches"
                    checked={includeCoaches}
                    onCheckedChange={(checked) => setIncludeCoaches(checked as boolean)}
                  />
                  <label htmlFor="includeCoaches" className="text-sm">
                    Coaches
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTeamManager"
                    checked={includeTeamManager}
                    onCheckedChange={(checked) => setIncludeTeamManager(checked as boolean)}
                  />
                  <label htmlFor="includeTeamManager" className="text-sm">
                    Team Manager
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeParents"
                    checked={includeParents}
                    onCheckedChange={(checked) => setIncludeParents(checked as boolean)}
                  />
                  <label htmlFor="includeParents" className="text-sm">
                    All Parents
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !description}
              >
                <Send className="h-4 w-4 mr-1" />
                Submit Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};