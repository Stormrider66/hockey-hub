'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay, endOfDay, eachDayOfInterval, getDay } from 'date-fns';
import { Calendar, Clock, MapPin, Users, AlertTriangle, Bell, Repeat, Save, ChevronRight, Check, X, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading';
import { toast } from 'react-hot-toast';
import { useCheckEventConflictsMutation, useCreateEventMutation, useCreateRecurringEventMutation, useGetEventsQuery, EventType, EventVisibility } from '@/store/api/calendarApi';
import { useGetPlayersQuery } from '@/store/api/userApi';
import { useGetFacilitiesQuery } from '@/store/api/facilityApi';
import type { Event } from '@/store/api/calendarApi';

export interface ScheduleData {
  startDate: Date;
  startTime: string;
  endTime: string;
  location?: string;
  facilityId?: string;
  recurrence?: RecurrenceData;
  reminders?: ReminderData;
  visibility?: EventVisibility;
  maxParticipants?: number;
  notes?: string;
}

export interface RecurrenceData {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
  endCount?: number;
  excludeDates?: Date[];
}

export interface ReminderData {
  enabled: boolean;
  minutesBefore: number[];
  types: ('email' | 'push' | 'sms')[];
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  schedule: ScheduleData;
  description?: string;
  icon?: string;
}

interface WorkoutSchedulerProps {
  workoutId?: string;
  workoutTitle?: string;
  workoutType?: string;
  playerIds: string[];
  teamIds: string[];
  onSchedule: (scheduleData: ScheduleData) => void;
  onCancel: () => void;
  existingSchedule?: ScheduleData;
  minDate?: Date;
  maxDate?: Date;
  estimatedDuration?: number; // in minutes
  requiredEquipment?: string[];
  organizationId: string;
  userId: string;
}

// Predefined schedule templates
const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'morning-training',
    name: 'Morning Training',
    description: 'Early morning session before work/school',
    icon: '🌅',
    schedule: {
      startDate: new Date(),
      startTime: '06:00',
      endTime: '07:30',
      recurrence: {
        enabled: true,
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      },
      reminders: {
        enabled: true,
        minutesBefore: [1440, 60], // 24h, 1h
        types: ['email', 'push'],
      },
    },
  },
  {
    id: 'evening-session',
    name: 'Evening Session',
    description: 'After-work training session',
    icon: '🌆',
    schedule: {
      startDate: new Date(),
      startTime: '18:00',
      endTime: '19:30',
      recurrence: {
        enabled: true,
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [2, 4], // Tue, Thu
      },
      reminders: {
        enabled: true,
        minutesBefore: [120, 30], // 2h, 30min
        types: ['push'],
      },
    },
  },
  {
    id: 'weekend-intensive',
    name: 'Weekend Intensive',
    description: 'Longer weekend training sessions',
    icon: '💪',
    schedule: {
      startDate: new Date(),
      startTime: '10:00',
      endTime: '12:00',
      recurrence: {
        enabled: true,
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [6], // Saturday
      },
      reminders: {
        enabled: true,
        minutesBefore: [1440], // 24h
        types: ['email', 'push'],
      },
    },
  },
];

// Time slot suggestions based on availability
const generateTimeSlotSuggestions = (
  date: Date,
  existingEvents: Event[],
  duration: number = 60
): { time: string; availability: 'available' | 'partial' | 'busy'; conflicts: number }[] => {
  const slots = [];
  const dayEvents = existingEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });

  // Generate slots from 6 AM to 9 PM
  for (let hour = 6; hour <= 21; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endHour = Math.floor((hour * 60 + duration) / 60);
    const endMinute = (hour * 60 + duration) % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    // Check conflicts
    let conflicts = 0;
    let hasPartialConflict = false;
    
    dayEvents.forEach(event => {
      const eventStart = format(new Date(event.startTime), 'HH:mm');
      const eventEnd = format(new Date(event.endTime), 'HH:mm');
      
      if (
        (startTime >= eventStart && startTime < eventEnd) ||
        (endTime > eventStart && endTime <= eventEnd) ||
        (startTime <= eventStart && endTime >= eventEnd)
      ) {
        conflicts++;
        hasPartialConflict = true;
      }
    });

    slots.push({
      time: startTime,
      availability: conflicts === 0 ? 'available' : hasPartialConflict ? 'partial' : 'busy',
      conflicts,
    });
  }

  return slots;
};

export default function WorkoutScheduler({
  workoutId,
  workoutTitle,
  workoutType,
  playerIds,
  teamIds,
  onSchedule,
  onCancel,
  existingSchedule,
  minDate = new Date(),
  maxDate,
  estimatedDuration = 60,
  requiredEquipment = [],
  organizationId,
  userId,
}: WorkoutSchedulerProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [activeTab, setActiveTab] = useState('single');
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(existingSchedule?.startDate || new Date());
  const [startTime, setStartTime] = useState(existingSchedule?.startTime || '09:00');
  const [endTime, setEndTime] = useState(existingSchedule?.endTime || '10:00');
  const [location, setLocation] = useState(existingSchedule?.location || '');
  const [facilityId, setFacilityId] = useState(existingSchedule?.facilityId || '');
  const [visibility, setVisibility] = useState<EventVisibility>(existingSchedule?.visibility || EventVisibility.TEAM);
  const [maxParticipants, setMaxParticipants] = useState(existingSchedule?.maxParticipants || 0);
  const [notes, setNotes] = useState(existingSchedule?.notes || '');
  
  // Recurrence state
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(existingSchedule?.recurrence?.enabled || false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>(existingSchedule?.recurrence?.frequency || 'weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(existingSchedule?.recurrence?.interval || 1);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(existingSchedule?.recurrence?.daysOfWeek || []);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'date' | 'count' | 'never'>('date');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date>(existingSchedule?.recurrence?.endDate || addMonths(new Date(), 3));
  const [recurrenceEndCount, setRecurrenceEndCount] = useState(existingSchedule?.recurrence?.endCount || 10);
  
  // Reminder state
  const [remindersEnabled, setRemindersEnabled] = useState(existingSchedule?.reminders?.enabled || true);
  const [reminderTimes, setReminderTimes] = useState<number[]>(existingSchedule?.reminders?.minutesBefore || [60, 1440]);
  const [reminderTypes, setReminderTypes] = useState<('email' | 'push' | 'sms')[]>(existingSchedule?.reminders?.types || ['email', 'push']);
  
  // Conflict checking
  const [showConflicts, setShowConflicts] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // API hooks
  const [checkConflicts, { data: conflictData, isLoading: isCheckingConflicts }] = useCheckEventConflictsMutation();
  const [createEvent, { isLoading: isCreatingEvent }] = useCreateEventMutation();
  const [createRecurringEvent, { isLoading: isCreatingRecurring }] = useCreateRecurringEventMutation();
  
  // Get players for availability checking
  const { data: playersData } = useGetPlayersQuery({ playerIds }, { skip: playerIds.length === 0 });
  const players = playersData?.data || [];
  
  // Get facilities
  const { data: facilitiesData } = useGetFacilitiesQuery({ organizationId });
  const facilities = facilitiesData?.data || [];
  
  // Get existing events for the selected date range
  const dateRange = useMemo(() => {
    const start = startOfDay(selectedDate);
    const end = recurrenceEnabled && recurrenceEndType === 'date' 
      ? endOfDay(recurrenceEndDate)
      : endOfDay(addDays(selectedDate, 30)); // Show 30 days of conflicts
    return { start, end };
  }, [selectedDate, recurrenceEnabled, recurrenceEndType, recurrenceEndDate]);
  
  const { data: eventsData } = useGetEventsQuery({
    startDate: format(dateRange.start, 'yyyy-MM-dd'),
    endDate: format(dateRange.end, 'yyyy-MM-dd'),
    organizationId,
    participantId: playerIds[0], // Check for first player's conflicts
  });
  const existingEvents = eventsData?.data || [];
  
  // Calculate end time based on duration
  useEffect(() => {
    if (startTime && estimatedDuration) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + estimatedDuration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      setEndTime(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`);
    }
  }, [startTime, estimatedDuration]);
  
  // Check for conflicts when date/time changes
  useEffect(() => {
    if (playerIds.length > 0 && startTime && endTime) {
      const startDateTime = new Date(selectedDate);
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      checkConflicts({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participantIds: playerIds,
        excludeEventId: workoutId,
      });
    }
  }, [selectedDate, startTime, endTime, playerIds, workoutId, checkConflicts]);
  
  // Time slot suggestions
  const timeSlotSuggestions = useMemo(() => {
    return generateTimeSlotSuggestions(selectedDate, existingEvents, estimatedDuration);
  }, [selectedDate, existingEvents, estimatedDuration]);
  
  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = SCHEDULE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setStartTime(template.schedule.startTime);
      setEndTime(template.schedule.endTime);
      setRecurrenceEnabled(template.schedule.recurrence?.enabled || false);
      setRecurrenceFrequency(template.schedule.recurrence?.frequency || 'weekly');
      setRecurrenceInterval(template.schedule.recurrence?.interval || 1);
      setRecurrenceDays(template.schedule.recurrence?.daysOfWeek || []);
      setRemindersEnabled(template.schedule.reminders?.enabled || false);
      setReminderTimes(template.schedule.reminders?.minutesBefore || [60]);
      setReminderTypes(template.schedule.reminders?.types || ['email', 'push']);
    }
  };
  
  // Generate recurrence preview
  const recurrencePreview = useMemo(() => {
    if (!recurrenceEnabled) return [];
    
    const dates: Date[] = [];
    let currentDate = new Date(selectedDate);
    let count = 0;
    const maxCount = recurrenceEndType === 'count' ? recurrenceEndCount : 20; // Show max 20 dates
    const endDate = recurrenceEndType === 'date' ? recurrenceEndDate : addMonths(currentDate, 6);
    
    while (count < maxCount && isBefore(currentDate, endDate)) {
      if (recurrenceFrequency === 'daily') {
        dates.push(new Date(currentDate));
        currentDate = addDays(currentDate, recurrenceInterval);
      } else if (recurrenceFrequency === 'weekly') {
        // Check if current day is in selected days
        const currentDay = getDay(currentDate);
        if (recurrenceDays.length === 0 || recurrenceDays.includes(currentDay)) {
          dates.push(new Date(currentDate));
          count++;
        }
        currentDate = addDays(currentDate, 1);
      } else if (recurrenceFrequency === 'monthly') {
        dates.push(new Date(currentDate));
        currentDate = addMonths(currentDate, recurrenceInterval);
      }
      count++;
    }
    
    return dates.slice(0, 10); // Show first 10 occurrences
  }, [selectedDate, recurrenceEnabled, recurrenceFrequency, recurrenceInterval, recurrenceDays, recurrenceEndType, recurrenceEndDate, recurrenceEndCount]);
  
  // Handle schedule submission
  const handleSchedule = async () => {
    try {
      const scheduleData: ScheduleData = {
        startDate: selectedDate,
        startTime,
        endTime,
        location,
        facilityId,
        visibility,
        maxParticipants: maxParticipants || undefined,
        notes,
        recurrence: recurrenceEnabled ? {
          enabled: true,
          frequency: recurrenceFrequency,
          interval: recurrenceInterval,
          daysOfWeek: recurrenceFrequency === 'weekly' ? recurrenceDays : undefined,
          endDate: recurrenceEndType === 'date' ? recurrenceEndDate : undefined,
          endCount: recurrenceEndType === 'count' ? recurrenceEndCount : undefined,
        } : undefined,
        reminders: remindersEnabled ? {
          enabled: true,
          minutesBefore: reminderTimes,
          types: reminderTypes,
        } : undefined,
      };
      
      // Create calendar event
      const startDateTime = new Date(selectedDate);
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      const eventData = {
        title: workoutTitle || 'Workout Session',
        type: EventType.TRAINING,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        organizationId,
        createdBy: userId,
        description: notes,
        location,
        teamId: teamIds[0],
        visibility,
        participants: playerIds.map(id => ({ userId: id, type: 'required' as const })),
        metadata: {
          workoutId,
          workoutType,
          requiredEquipment,
        },
        maxParticipants,
        sendReminders: remindersEnabled,
        reminderMinutes: reminderTimes,
        recurrence: scheduleData.recurrence ? {
          frequency: scheduleData.recurrence.frequency,
          interval: scheduleData.recurrence.interval,
          weekDays: scheduleData.recurrence.daysOfWeek,
          endDate: scheduleData.recurrence.endDate?.toISOString(),
          count: scheduleData.recurrence.endCount,
        } : undefined,
      };
      
      if (recurrenceEnabled) {
        await createRecurringEvent(eventData).unwrap();
      } else {
        await createEvent(eventData).unwrap();
      }
      
      toast.success(t('physicalTrainer:scheduler.scheduleSuccess'));
      onSchedule(scheduleData);
    } catch (error) {
      console.error('Failed to schedule workout:', error);
      toast.error(t('physicalTrainer:scheduler.scheduleError'));
    }
  };
  
  const isScheduling = isCreatingEvent || isCreatingRecurring;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('physicalTrainer:scheduler.title')}
        </CardTitle>
        <CardDescription>
          {workoutTitle && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{workoutTitle}</Badge>
              <span className="text-sm text-muted-foreground">
                {playerIds.length} {t('physicalTrainer:scheduler.players')} • 
                {teamIds.length} {t('physicalTrainer:scheduler.teams')}
              </span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">{t('physicalTrainer:scheduler.singleSession')}</TabsTrigger>
            <TabsTrigger value="recurring">{t('physicalTrainer:scheduler.recurringSession')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="space-y-6">
            {/* Quick Templates */}
            <div className="space-y-2">
              <Label>{t('physicalTrainer:scheduler.quickTemplates')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {SCHEDULE_TEMPLATES.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate === template.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyTemplate(template.id)}
                    className="justify-start"
                  >
                    <span className="mr-2">{template.icon}</span>
                    <span className="truncate">{template.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Date & Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t('physicalTrainer:scheduler.date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : <span>{t('physicalTrainer:scheduler.selectDate')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    {/* Calendar component would go here */}
                    <div className="p-4">
                      <Input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
                        max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>{t('physicalTrainer:scheduler.timeSlot')}</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="flex-1"
                  />
                  <span className="flex items-center px-2">-</span>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            
            {/* Time Slot Suggestions */}
            <div className="space-y-2">
              <Label>{t('physicalTrainer:scheduler.suggestedTimes')}</Label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlotSuggestions.slice(0, 8).map((slot) => (
                  <Button
                    key={slot.time}
                    variant={slot.availability === 'available' ? 'outline' : 'ghost'}
                    size="sm"
                    onClick={() => setStartTime(slot.time)}
                    disabled={slot.availability === 'busy'}
                    className={cn(
                      slot.availability === 'available' && 'border-green-500',
                      slot.availability === 'partial' && 'border-amber-500',
                      slot.availability === 'busy' && 'opacity-50'
                    )}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {slot.time}
                    {slot.conflicts > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                        {slot.conflicts}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Conflict Warning */}
            {conflictData?.hasConflict && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('physicalTrainer:scheduler.conflictDetected')}</AlertTitle>
                <AlertDescription>
                  {conflictData.conflictingEvents?.length} {t('physicalTrainer:scheduler.conflictingEvents')}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowConflicts(!showConflicts)}
                    className="ml-2"
                  >
                    {showConflicts ? t('common:hide') : t('common:show')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Conflicting Events List */}
            {showConflicts && conflictData?.conflictingEvents && (
              <div className="space-y-2">
                <Label>{t('physicalTrainer:scheduler.conflictingEvents')}</Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {conflictData.conflictingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recurring" className="space-y-6">
            {/* Enable Recurrence */}
            <div className="flex items-center justify-between">
              <Label htmlFor="recurrence-enabled" className="flex flex-col">
                <span>{t('physicalTrainer:scheduler.enableRecurrence')}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {t('physicalTrainer:scheduler.recurrenceDescription')}
                </span>
              </Label>
              <Switch
                id="recurrence-enabled"
                checked={recurrenceEnabled}
                onCheckedChange={setRecurrenceEnabled}
              />
            </div>
            
            {recurrenceEnabled && (
              <>
                {/* Recurrence Pattern */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('physicalTrainer:scheduler.frequency')}</Label>
                      <Select value={recurrenceFrequency} onValueChange={(v) => setRecurrenceFrequency(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">{t('physicalTrainer:scheduler.daily')}</SelectItem>
                          <SelectItem value="weekly">{t('physicalTrainer:scheduler.weekly')}</SelectItem>
                          <SelectItem value="monthly">{t('physicalTrainer:scheduler.monthly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t('physicalTrainer:scheduler.interval')}</Label>
                      <div className="flex items-center gap-2">
                        <span>{t('physicalTrainer:scheduler.every')}</span>
                        <Input
                          type="number"
                          value={recurrenceInterval}
                          onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                          min={1}
                          max={30}
                          className="w-16"
                        />
                        <span>
                          {recurrenceFrequency === 'daily' && t('physicalTrainer:scheduler.days')}
                          {recurrenceFrequency === 'weekly' && t('physicalTrainer:scheduler.weeks')}
                          {recurrenceFrequency === 'monthly' && t('physicalTrainer:scheduler.months')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Days of Week (for weekly recurrence) */}
                  {recurrenceFrequency === 'weekly' && (
                    <div className="space-y-2">
                      <Label>{t('physicalTrainer:scheduler.daysOfWeek')}</Label>
                      <div className="flex gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <Button
                            key={day}
                            variant={recurrenceDays.includes(index) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              if (recurrenceDays.includes(index)) {
                                setRecurrenceDays(recurrenceDays.filter(d => d !== index));
                              } else {
                                setRecurrenceDays([...recurrenceDays, index].sort());
                              }
                            }}
                            className="w-12"
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recurrence End */}
                  <div className="space-y-2">
                    <Label>{t('physicalTrainer:scheduler.recurrenceEnd')}</Label>
                    <RadioGroup value={recurrenceEndType} onValueChange={(v) => setRecurrenceEndType(v as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="date" id="end-date" />
                        <Label htmlFor="end-date" className="flex items-center gap-2">
                          {t('physicalTrainer:scheduler.endByDate')}
                          <Input
                            type="date"
                            value={format(recurrenceEndDate, 'yyyy-MM-dd')}
                            onChange={(e) => setRecurrenceEndDate(new Date(e.target.value))}
                            disabled={recurrenceEndType !== 'date'}
                            className="w-36"
                          />
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="count" id="end-count" />
                        <Label htmlFor="end-count" className="flex items-center gap-2">
                          {t('physicalTrainer:scheduler.endAfter')}
                          <Input
                            type="number"
                            value={recurrenceEndCount}
                            onChange={(e) => setRecurrenceEndCount(parseInt(e.target.value) || 1)}
                            min={1}
                            max={365}
                            disabled={recurrenceEndType !== 'count'}
                            className="w-16"
                          />
                          {t('physicalTrainer:scheduler.occurrences')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="never" id="end-never" />
                        <Label htmlFor="end-never">{t('physicalTrainer:scheduler.neverEnd')}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Recurrence Preview */}
                  <div className="space-y-2">
                    <Label>{t('physicalTrainer:scheduler.preview')}</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">
                        {t('physicalTrainer:scheduler.firstOccurrences', { count: recurrencePreview.length })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recurrencePreview.map((date, index) => (
                          <Badge key={index} variant="secondary">
                            {format(date, 'MMM d, yyyy')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Location & Facility */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="location">{t('physicalTrainer:scheduler.location')}</Label>
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 mt-2.5 text-muted-foreground" />
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('physicalTrainer:scheduler.locationPlaceholder')}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="facility">{t('physicalTrainer:scheduler.facility')}</Label>
            <Select value={facilityId} onValueChange={setFacilityId}>
              <SelectTrigger>
                <SelectValue placeholder={t('physicalTrainer:scheduler.selectFacility')} />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                    {facility.availability && (
                      <Badge variant="secondary" className="ml-2">
                        {facility.availability}
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Visibility & Participants */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="visibility">{t('physicalTrainer:scheduler.visibility')}</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as EventVisibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EventVisibility.TEAM}>{t('physicalTrainer:scheduler.teamOnly')}</SelectItem>
                <SelectItem value={EventVisibility.PUBLIC}>{t('physicalTrainer:scheduler.public')}</SelectItem>
                <SelectItem value={EventVisibility.PRIVATE}>{t('physicalTrainer:scheduler.private')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-participants">{t('physicalTrainer:scheduler.maxParticipants')}</Label>
            <Input
              id="max-participants"
              type="number"
              value={maxParticipants || ''}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 0)}
              placeholder={t('physicalTrainer:scheduler.unlimited')}
              min={0}
            />
          </div>
        </div>
        
        {/* Reminders */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="reminders-enabled" className="flex flex-col">
              <span>{t('physicalTrainer:scheduler.reminders')}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {t('physicalTrainer:scheduler.remindersDescription')}
              </span>
            </Label>
            <Switch
              id="reminders-enabled"
              checked={remindersEnabled}
              onCheckedChange={setRemindersEnabled}
            />
          </div>
          
          {remindersEnabled && (
            <div className="space-y-4 pl-4">
              <div className="space-y-2">
                <Label>{t('physicalTrainer:scheduler.reminderTimes')}</Label>
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 60, 120, 1440].map((minutes) => (
                    <Button
                      key={minutes}
                      variant={reminderTimes.includes(minutes) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (reminderTimes.includes(minutes)) {
                          setReminderTimes(reminderTimes.filter(m => m !== minutes));
                        } else {
                          setReminderTimes([...reminderTimes, minutes].sort((a, b) => a - b));
                        }
                      }}
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      {minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${minutes / 60}h` : `${minutes / 1440}d`}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t('physicalTrainer:scheduler.reminderTypes')}</Label>
                <div className="flex gap-4">
                  {(['email', 'push', 'sms'] as const).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`reminder-${type}`}
                        checked={reminderTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setReminderTypes([...reminderTypes, type]);
                          } else {
                            setReminderTypes(reminderTypes.filter(t => t !== type));
                          }
                        }}
                      />
                      <Label htmlFor={`reminder-${type}`} className="text-sm font-normal">
                        {t(`physicalTrainer:scheduler.${type}`)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Notes */}
        <div className="space-y-2 mt-6">
          <Label htmlFor="notes">{t('physicalTrainer:scheduler.notes')}</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('physicalTrainer:scheduler.notesPlaceholder')}
            className="w-full min-h-[80px] px-3 py-2 text-sm bg-background border rounded-md"
          />
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>
              {recurrenceEnabled 
                ? t('physicalTrainer:scheduler.willCreateRecurring', { count: recurrencePreview.length })
                : t('physicalTrainer:scheduler.willCreateSingle')
              }
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              {t('common:cancel')}
            </Button>
            <Button 
              onClick={handleSchedule} 
              disabled={isScheduling || !startTime || !endTime || (conflictData?.hasConflict && !showConflicts)}
            >
              {isScheduling ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  {t('physicalTrainer:scheduler.scheduling')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t('physicalTrainer:scheduler.schedule')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}