import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Repeat, 
  AlertCircle,
  Info,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  User
} from '@/components/icons';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useCheckEventConflictsMutation } from '@/store/api/calendarApi';
import { useGetOrganizationUsersQuery } from '@/store/api/userApi';
import { PlayerTeamAssignment } from './PlayerTeamAssignment';
import { useTranslation } from 'react-i18next';

// Types
export interface UnifiedSchedule {
  startDate: Date;
  startTime: string;
  location?: string;
  participants: {
    playerIds: string[];
    teamIds: string[];
  };
  recurrence?: RecurrenceConfig;
  reminders?: ReminderConfig;
  assignedCoachId?: string;
  assignedCoachRole?: 'physical_trainer' | 'ice_coach';
}

export interface RecurrenceConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  count?: number;
  endDate?: Date;
}

export interface ReminderConfig {
  enabled: boolean;
  minutesBefore: number[];
}

export interface UnifiedSchedulerProps {
  // Required props
  schedule: UnifiedSchedule;
  onScheduleUpdate: (schedule: UnifiedSchedule) => void;
  duration: number; // Total duration in minutes
  
  // Optional customization
  title?: string;
  description?: string;
  showLocation?: boolean;
  showRecurrence?: boolean;
  showReminders?: boolean;
  showConflictCheck?: boolean;
  
  // Optional location configuration
  locations?: string[];
  defaultLocation?: string;
  
  // Optional callbacks
  onConflictsFound?: (conflicts: any[]) => void;
  
  // Optional display settings
  collapsible?: boolean;
  defaultExpanded?: boolean;
  variant?: 'card' | 'inline';
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

const DEFAULT_LOCATIONS = [
  'Main Gym',
  'Training Field',
  'Ice Rink',
  'Weight Room',
  'Outdoor Track',
  'Recovery Center'
];

export const UnifiedScheduler: React.FC<UnifiedSchedulerProps> = ({
  schedule,
  onScheduleUpdate,
  duration,
  title = 'Schedule & Assignment',
  description,
  showLocation = true,
  showRecurrence = true,
  showReminders = true,
  showConflictCheck = true,
  locations = DEFAULT_LOCATIONS,
  defaultLocation,
  onConflictsFound,
  collapsible = true,
  defaultExpanded = true,
  variant = 'card'
}) => {
  try {
  console.log('UnifiedScheduler rendering with props:', { schedule, duration, title });
  
  const { t } = useTranslation('physicalTrainer');
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState('schedule');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [checkConflicts] = useCheckEventConflictsMutation();
  
  // Fetch coaches
  const { data: physicalTrainers = [], isLoading: ptLoading, error: ptError } = useGetOrganizationUsersQuery({
    organizationId: 'org-123', // This would come from context in production
    role: 'physical_trainer'
  });
  
  const { data: iceCoaches = [], isLoading: icLoading, error: icError } = useGetOrganizationUsersQuery({
    organizationId: 'org-123', // This would come from context in production
    role: 'ice_coach'
  });
  
  // Debug logging
  console.log('Physical Trainers Query:', { data: physicalTrainers, isLoading: ptLoading, error: ptError });
  console.log('Ice Coaches Query:', { data: iceCoaches, isLoading: icLoading, error: icError });
  
  // Combine coaches for dropdown
  const allCoaches = [
    ...physicalTrainers.map(pt => ({ ...pt, coachRole: 'physical_trainer' as const })),
    ...iceCoaches.map(ic => ({ ...ic, coachRole: 'ice_coach' as const }))
  ];
  
  console.log('All Coaches Combined:', allCoaches);

  // Ensure schedule.startDate is a valid Date
  if (!schedule.startDate || !(schedule.startDate instanceof Date) || isNaN(schedule.startDate.getTime())) {
    console.error('UnifiedScheduler: Invalid startDate provided', schedule.startDate);
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invalid date provided to scheduler. Please check your configuration.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  // Initialize location if needed
  useEffect(() => {
    if (showLocation && !schedule.location && defaultLocation) {
      onScheduleUpdate({
        ...schedule,
        location: defaultLocation
      });
    }
  }, []);

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

  const handlePlayersChange = (playerIds: string[]) => {
    onScheduleUpdate({
      ...schedule,
      participants: {
        ...schedule.participants,
        playerIds
      }
    });
  };

  const handleTeamsChange = (teamIds: string[]) => {
    onScheduleUpdate({
      ...schedule,
      participants: {
        ...schedule.participants,
        teamIds
      }
    });
  };
  
  const handleCoachChange = (coachId: string) => {
    const selectedCoach = allCoaches.find(c => c.id === coachId);
    if (selectedCoach) {
      onScheduleUpdate({
        ...schedule,
        assignedCoachId: coachId,
        assignedCoachRole: selectedCoach.coachRole
      });
    }
  };

  const handleRecurrenceToggle = (enabled: boolean) => {
    if (!enabled) {
      onScheduleUpdate({
        ...schedule,
        recurrence: undefined
      });
    } else {
      onScheduleUpdate({
        ...schedule,
        recurrence: {
          enabled: true,
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [schedule.startDate.getDay()],
          count: 4
        }
      });
    }
  };

  const handleRecurrenceChange = (field: keyof RecurrenceConfig, value: any) => {
    if (!schedule.recurrence) return;
    
    onScheduleUpdate({
      ...schedule,
      recurrence: {
        ...schedule.recurrence,
        [field]: value
      }
    });
  };

  const handleDayToggle = (day: number) => {
    if (!schedule.recurrence) return;
    
    const currentDays = schedule.recurrence.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    handleRecurrenceChange('daysOfWeek', newDays);
  };

  const handleRemindersToggle = (enabled: boolean) => {
    if (!enabled) {
      onScheduleUpdate({
        ...schedule,
        reminders: undefined
      });
    } else {
      onScheduleUpdate({
        ...schedule,
        reminders: {
          enabled: true,
          minutesBefore: [60, 15]
        }
      });
    }
  };

  const handleCheckConflicts = async () => {
    const startDateTime = new Date(schedule.startDate);
    const [hours, minutes] = schedule.startTime.split(':');
    startDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + duration);

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
        onConflictsFound?.(result.conflicts);
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
    if (!schedule.recurrence || !schedule.recurrence.enabled) return [];
    
    const dates = [];
    let currentDate = new Date(schedule.startDate);
    const count = schedule.recurrence.count || 10;
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      if (schedule.recurrence.frequency === 'daily') {
        dates.push(new Date(currentDate));
        currentDate = addDays(currentDate, schedule.recurrence.interval);
      } else if (schedule.recurrence.frequency === 'weekly') {
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

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {collapsible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );

  const content = (
    <>
      {(!collapsible || isExpanded) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="assignment">
              <Users className="h-4 w-4 mr-2" />
              Assignment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            {/* Date and Time */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={schedule.startDate ? format(schedule.startDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const newDate = new Date(e.target.value);
                          if (!isNaN(newDate.getTime())) {
                            handleDateChange(newDate);
                          }
                        }
                      }}
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

              {showLocation && (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Select value={schedule.location} onValueChange={handleLocationChange}>
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder="Select location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Session Duration</span>
                </div>
                <Badge variant="secondary">{duration} minutes</Badge>
              </div>
            </div>

            {/* Recurring Schedule */}
            {showRecurrence && (
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Recurring Schedule</h4>
                  <Switch
                    checked={schedule.recurrence?.enabled || false}
                    onCheckedChange={handleRecurrenceToggle}
                  />
                </div>

                {schedule.recurrence?.enabled && (
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
            )}

            {/* Reminders */}
            {showReminders && (
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Reminders</h4>
                  <Switch
                    checked={schedule.reminders?.enabled || false}
                    onCheckedChange={handleRemindersToggle}
                  />
                </div>

                {schedule.reminders?.enabled && (
                  <div className="space-y-2">
                    <Label>Send reminders at:</Label>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={schedule.reminders.minutesBefore.includes(60)}
                          onCheckedChange={(checked) => {
                            const newMinutes = checked 
                              ? [...schedule.reminders!.minutesBefore, 60]
                              : schedule.reminders!.minutesBefore.filter(m => m !== 60);
                            onScheduleUpdate({
                              ...schedule,
                              reminders: {
                                ...schedule.reminders!,
                                minutesBefore: newMinutes
                              }
                            });
                          }}
                        />
                        <span className="text-sm">1 hour before</span>
                      </Label>
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={schedule.reminders.minutesBefore.includes(15)}
                          onCheckedChange={(checked) => {
                            const newMinutes = checked 
                              ? [...schedule.reminders!.minutesBefore, 15]
                              : schedule.reminders!.minutesBefore.filter(m => m !== 15);
                            onScheduleUpdate({
                              ...schedule,
                              reminders: {
                                ...schedule.reminders!,
                                minutesBefore: newMinutes
                              }
                            });
                          }}
                        />
                        <span className="text-sm">15 minutes before</span>
                      </Label>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Conflict Check */}
            {showConflictCheck && (
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
            )}
          </TabsContent>

          <TabsContent value="assignment" className="mt-4">
            {/* Coach Assignment */}
            <Card className="p-4 mb-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Session Coach
                  </h4>
                  {schedule.assignedCoachId && (
                    <Badge variant="secondary">
                      {schedule.assignedCoachRole === 'physical_trainer' ? 'Physical Trainer' : 'Ice Coach'}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Assign a coach to run this session</Label>
                  <Select value={schedule.assignedCoachId || ''} onValueChange={handleCoachChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a coach..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allCoaches.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No coaches available
                        </div>
                      ) : (
                        <>
                          {physicalTrainers.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Physical Trainers
                              </div>
                              {physicalTrainers.map(trainer => (
                                <SelectItem key={trainer.id} value={trainer.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{trainer.name || `${trainer.firstName} ${trainer.lastName}`}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                          {iceCoaches.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Ice Coaches
                              </div>
                              {iceCoaches.map(coach => (
                                <SelectItem key={coach.id} value={coach.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{coach.name || `${coach.firstName} ${coach.lastName}`}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The assigned coach will see this session in their calendar and receive notifications
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Player/Team Assignment */}
            <PlayerTeamAssignment
              selectedPlayers={schedule.participants.playerIds}
              selectedTeams={schedule.participants.teamIds}
              onPlayersChange={handlePlayersChange}
              onTeamsChange={handleTeamsChange}
              showTeams={true}
              showMedical={true}
              showFilters={true}
              showSummary={false}
              inline={true}
              maxHeight={400}
            />

            {/* Participants Summary */}
            <Card className="p-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Participants Summary</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalParticipants === 0 
                      ? 'No participants assigned' 
                      : `${totalParticipants} participants will receive calendar invites`}
                  </p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Info */}
      {(!collapsible || isExpanded) && (
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Sessions will be automatically added to participants' calendars when you save.
            Players will receive notifications based on their preferences.
          </AlertDescription>
        </Alert>
      )}
    </>
  );

  if (variant === 'inline') {
    return (
      <div className="space-y-4">
        {header}
        {content}
      </div>
    );
  }

  return (
    <Card className="p-6">
      {header}
      {content}
    </Card>
  );
  } catch (error) {
    console.error('UnifiedScheduler Error:', error);
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            An error occurred while rendering the scheduler. Please refresh the page or contact support.
            <div className="text-xs mt-2 font-mono">{error instanceof Error ? error.message : 'Unknown error'}</div>
          </AlertDescription>
        </Alert>
      </Card>
    );
  }
};