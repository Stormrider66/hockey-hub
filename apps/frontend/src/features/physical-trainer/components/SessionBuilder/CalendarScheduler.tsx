import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Repeat, 
  Bell,
  AlertCircle,
  Info,
  Users,
  Check
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { 
  SessionTemplate, 
  SessionSchedule 
} from '../../types/session-builder.types';
import { useCheckEventConflictsMutation } from '@/store/api/calendarApi';
import { useToast } from '@/components/ui/use-toast';

interface CalendarSchedulerProps {
  session: SessionTemplate;
  schedule: SessionSchedule;
  onScheduleUpdate: (schedule: SessionSchedule) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
];

const LOCATIONS = [
  'Main Gym',
  'Training Field',
  'Ice Rink',
  'Weight Room',
  'Outdoor Track',
  'Recovery Center'
];

export const CalendarScheduler: React.FC<CalendarSchedulerProps> = ({ 
  session, 
  schedule, 
  onScheduleUpdate 
}) => {
  const { toast } = useToast();
  const [showRecurring, setShowRecurring] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [checkConflicts] = useCheckEventConflictsMutation();

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      onScheduleUpdate({
        ...schedule,
        startDate: date
      });
    }
  };

  const handleTimeChange = (time: string) => {
    onScheduleUpdate({
      ...schedule,
      startTime: time
    });
  };

  const handleLocationChange = (location: string) => {
    onScheduleUpdate({
      ...schedule,
      location
    });
  };

  const handleRecurringToggle = (enabled: boolean) => {
    setShowRecurring(enabled);
    if (!enabled) {
      onScheduleUpdate({
        ...schedule,
        recurrence: undefined
      });
    } else {
      onScheduleUpdate({
        ...schedule,
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [schedule.startDate.getDay()],
          count: 4
        }
      });
    }
  };

  const handleRecurrenceChange = (field: string, value: any) => {
    onScheduleUpdate({
      ...schedule,
      recurrence: {
        ...schedule.recurrence!,
        [field]: value
      }
    });
  };

  const handleDayToggle = (day: number) => {
    const currentDays = schedule.recurrence?.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    handleRecurrenceChange('daysOfWeek', newDays);
  };

  const handleCheckConflicts = async () => {
    const startDateTime = new Date(schedule.startDate);
    const [hours, minutes] = schedule.startTime.split(':');
    startDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + session.totalDuration);

    try {
      const result = await checkConflicts({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participantIds: [
          ...(schedule.participants.playerIds || []),
          ...(schedule.participants.teamIds || [])
        ]
      }).unwrap();

      if (result.conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts);
        toast({
          title: 'Conflicts found',
          description: `${result.conflicts.length} scheduling conflicts detected`,
          variant: 'warning'
        });
      } else {
        setConflicts([]);
        toast({
          title: 'No conflicts',
          description: 'The selected time slot is available',
        });
      }
    } catch (error) {
      toast({
        title: 'Error checking conflicts',
        description: 'Could not verify scheduling conflicts',
        variant: 'destructive'
      });
    }
  };

  const getRecurrencePreview = () => {
    if (!schedule.recurrence) return [];
    
    const dates = [];
    let currentDate = new Date(schedule.startDate);
    const count = schedule.recurrence.count || 10;
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      if (schedule.recurrence.frequency === 'daily') {
        dates.push(new Date(currentDate));
        currentDate = addDays(currentDate, schedule.recurrence.interval);
      } else if (schedule.recurrence.frequency === 'weekly') {
        // For weekly, we need to handle multiple days of week
        if (schedule.recurrence.daysOfWeek && schedule.recurrence.daysOfWeek.length > 0) {
          schedule.recurrence.daysOfWeek.forEach(day => {
            const nextDate = new Date(currentDate);
            const daysUntil = (day - nextDate.getDay() + 7) % 7 || 7;
            nextDate.setDate(nextDate.getDate() + daysUntil);
            if (i === 0 || nextDate > currentDate) {
              dates.push(new Date(nextDate));
            }
          });
        }
        currentDate = addWeeks(currentDate, schedule.recurrence.interval);
      } else if (schedule.recurrence.frequency === 'monthly') {
        dates.push(new Date(currentDate));
        currentDate = addMonths(currentDate, schedule.recurrence.interval);
      }
    }
    
    return dates.slice(0, 5);
  };

  const totalParticipants = (schedule.participants.playerIds?.length || 0) + 
                           (schedule.participants.teamIds?.length || 0);

  return (
    <div className="space-y-4">
      {/* Date and Time */}
      <Card className="p-4 space-y-4">
        <h4 className="font-medium">Schedule Details</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={format(schedule.startDate, 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange(new Date(e.target.value))}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="time"
                value={schedule.startTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Location</Label>
          <Select value={schedule.location} onValueChange={handleLocationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select location..." />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map(location => (
                <SelectItem key={location} value={location}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {location}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Session Duration</span>
          </div>
          <Badge variant="secondary">{session.totalDuration} minutes</Badge>
        </div>
      </Card>

      {/* Recurring Schedule */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Recurring Schedule</h4>
          <Switch
            checked={showRecurring}
            onCheckedChange={handleRecurringToggle}
          />
        </div>

        {showRecurring && schedule.recurrence && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select 
                  value={schedule.recurrence.frequency} 
                  onValueChange={(value) => handleRecurrenceChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Repeat every</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={schedule.recurrence.interval}
                    onChange={(e) => handleRecurrenceChange('interval', parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    {schedule.recurrence.frequency === 'daily' ? 'days' :
                     schedule.recurrence.frequency === 'weekly' ? 'weeks' : 'months'}
                  </span>
                </div>
              </div>
            </div>

            {schedule.recurrence.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <Label
                      key={day.value}
                      className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <Checkbox
                        checked={schedule.recurrence?.daysOfWeek?.includes(day.value) || false}
                        onCheckedChange={() => handleDayToggle(day.value)}
                      />
                      <span className="text-xs">{day.short}</span>
                    </Label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>End after</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={schedule.recurrence.count || ''}
                  onChange={(e) => handleRecurrenceChange('count', parseInt(e.target.value) || undefined)}
                  placeholder="Number of sessions"
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">sessions</span>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview (first 5 sessions)</Label>
              <div className="space-y-1">
                {getRecurrencePreview().map((date, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3 w-3" />
                    {format(date, 'EEEE, MMMM d, yyyy')} at {schedule.startTime}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Participants Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Participants</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {totalParticipants === 0 
                ? 'No participants assigned' 
                : `${totalParticipants} participants will receive calendar invites`}
            </p>
          </div>
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>

      {/* Reminders */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Reminders</h4>
          <Switch
            checked={schedule.reminders?.enabled || false}
            onCheckedChange={(enabled) => onScheduleUpdate({
              ...schedule,
              reminders: {
                enabled,
                minutesBefore: enabled ? [60, 15] : []
              }
            })}
          />
        </div>

        {schedule.reminders?.enabled && (
          <div className="space-y-2">
            <Label>Send reminders at:</Label>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Checkbox defaultChecked />
                <span className="text-sm">1 hour before</span>
              </Label>
              <Label className="flex items-center gap-2 cursor-pointer">
                <Checkbox defaultChecked />
                <span className="text-sm">15 minutes before</span>
              </Label>
            </div>
          </div>
        )}
      </Card>

      {/* Conflict Check */}
      <div className="space-y-2">
        <Button 
          onClick={handleCheckConflicts} 
          variant="outline" 
          className="w-full"
          disabled={totalParticipants === 0}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Check for Conflicts
        </Button>

        {conflicts.length > 0 && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Scheduling conflicts detected:</p>
              <ul className="text-sm space-y-1">
                {conflicts.slice(0, 3).map((conflict, index) => (
                  <li key={index}>
                    • {conflict.participantName}: {conflict.eventTitle} at {conflict.time}
                  </li>
                ))}
                {conflicts.length > 3 && (
                  <li>• ...and {conflicts.length - 3} more conflicts</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Sessions will be automatically added to participants' calendars when you save.
          Players will receive notifications based on their preferences.
        </AlertDescription>
      </Alert>
    </div>
  );
};