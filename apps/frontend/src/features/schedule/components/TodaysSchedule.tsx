import React, { useState, useMemo } from 'react';
import { format, addDays, subDays, isToday, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import * as Icons from '@/components/icons';
import { ScheduleEventCard } from './ScheduleEventCard';
import { EventType, ScheduleEvent, UserRole, hasPermission } from '../types';
import { useGetTodayScheduleQuery } from '@/store/api/scheduleApi';

interface TodaysScheduleProps {
  role: UserRole;
  filterByPlayer?: string;
  filterByTeam?: string;
  className?: string;
  onEventSelect?: (event: ScheduleEvent | null) => void;
  selectedEventId?: string;
}

const QuickAddButton: React.FC<{ role: UserRole }> = ({ role }) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  const getAddOptions = () => {
    const options = [];
    
    if (role === 'physicalTrainer') {
      options.push({ label: 'Training Session', icon: 'Dumbbell', path: '/physicaltrainer?tab=sessions' });
    }
    if (role === 'iceCoach' || role === 'coach') {
      options.push({ label: 'Ice Practice', icon: 'Snowflake', path: '/coach/practice/new' });
    }
    if (role === 'medicalStaff') {
      options.push({ label: 'Medical Appointment', icon: 'Heart', path: '/medical/appointment/new' });
    }
    if (role === 'coach' || role === 'clubAdmin') {
      options.push({ label: 'Team Meeting', icon: 'Users', path: '/meetings/new' });
    }
    
    return options;
  };

  const options = getAddOptions();

  if (options.length === 0) return null;
  if (options.length === 1) {
    return (
      <Button
        size="sm"
        onClick={() => router.push(options[0].path)}
      >
        <Plus className="h-4 w-4 mr-1" />
        {options[0].label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Event
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option, idx) => {
          const Icon = Icons[option.icon as keyof typeof Icons];
          return (
            <DropdownMenuItem 
              key={idx}
              onClick={() => router.push(option.path)}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const TodaysSchedule: React.FC<TodaysScheduleProps> = ({
  role,
  filterByPlayer,
  filterByTeam,
  className = '',
  onEventSelect,
  selectedEventId
}) => {
  const { t } = useTranslation('physicalTrainer');
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: events, isLoading, refetch } = useGetTodayScheduleQuery(
    {
      date: format(selectedDate, 'yyyy-MM-dd'),
      playerId: filterByPlayer,
      teamId: filterByTeam,
      role
    },
    {
      pollingInterval: 30000, // Poll every 30 seconds for updates
    }
  );

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    let filtered = [...events];
    
    // Apply event type filter
    if (eventTypeFilter.length > 0) {
      filtered = filtered.filter(event => eventTypeFilter.includes(event.type));
    }
    
    // Sort by start time
    filtered.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    return filtered;
  }, [events, eventTypeFilter]);

  const stats = useMemo(() => {
    if (!filteredEvents) return { total: 0, upcoming: 0, active: 0, completed: 0 };
    
    return {
      total: filteredEvents.length,
      upcoming: filteredEvents.filter(e => e.status === 'upcoming').length,
      active: filteredEvents.filter(e => e.status === 'active').length,
      completed: filteredEvents.filter(e => e.status === 'completed').length,
    };
  }, [filteredEvents]);

  const handleDateChange = (days: number) => {
    setSelectedDate(prev => days === 0 ? new Date() : addDays(prev, days));
  };

  const handleView = (event: ScheduleEvent) => {
    router.push(`/event-preview/${event.id}`);
  };

  const handleQuickAction = (event: ScheduleEvent, action: string) => {
    switch (action) {
      case 'edit':
        // Navigate to appropriate edit page based on event type
        if (event.type === EventType.TRAINING) {
          router.push(`/physicaltrainer/session/edit/${event.id}`);
        }
        break;
      case 'duplicate':
        // Handle duplication
        console.log('Duplicate event:', event.id);
        break;
      case 'cancel':
        // Handle cancellation
        console.log('Cancel event:', event.id);
        break;
      case 'launch':
        // Launch the event immediately
        if (event.type === EventType.TRAINING) {
          router.push(`/trainer/monitor/${event.id}`);
        }
        break;
      case 'monitor':
        // Monitor active session
        router.push(`/trainer/monitor/${event.id}`);
        break;
      case 'share':
        // Share event
        console.log('Share event:', event.id);
        break;
    }
  };

  const toggleEventTypeFilter = (type: EventType) => {
    setEventTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isToday(selectedDate) ? t('ai.overview.todaysSchedule') : 'Schedule'}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filter
                {eventTypeFilter.length > 0 && (
                  <Badge className="ml-2">{eventTypeFilter.length}</Badge>
                )}
              </Button>
              <QuickAddButton role={role} />
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={isToday(selectedDate) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDateChange(0)}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700 ml-2">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="outline">{stats.total} Events</Badge>
              {stats.active > 0 && (
                <Badge className="bg-green-100 text-green-800">
                  {stats.active} Active
                </Badge>
              )}
              {stats.upcoming > 0 && (
                <Badge className="bg-blue-100 text-blue-800">
                  {stats.upcoming} Upcoming
                </Badge>
              )}
              {stats.completed > 0 && (
                <Badge className="bg-gray-100 text-gray-800">
                  {stats.completed} Done
                </Badge>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
              {Object.values(EventType).map(type => {
                const Icon = Icons[type as keyof typeof Icons];
                return (
                  <Badge
                    key={type}
                    variant={eventTypeFilter.includes(type) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleEventTypeFilter(type)}
                  >
                    {Icon && <Icon className="h-3 w-3 mr-1" />}
                    {type.replace('_', ' ')}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Icons.Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No events scheduled for this day</p>
            {role !== 'player' && (
              <p className="text-sm text-gray-400 mt-2">
                Click "Add Event" to create one
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className={`cursor-pointer transition-all ${
                  selectedEventId === event.id ? 'ring-2 ring-primary rounded-lg' : ''
                }`}
                onClick={() => onEventSelect?.(event)}
              >
                <ScheduleEventCard
                  event={event}
                  role={role}
                  onView={() => handleView(event)}
                  onQuickAction={(action) => handleQuickAction(event, action)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};