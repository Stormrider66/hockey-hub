import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Event as BigCalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Car,
  Calendar as CalendarIcon,
  Clock,
  Users,
  ChevronDown,
  Bell,
  Download,
  Filter,
  Eye,
  UserCheck,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { useGetEventsQuery } from '@/store/api/calendarApi';
import EventDetailsModal from '@/features/calendar/EventDetailsModal';
import ParentQuickActions from './ParentQuickActions';
import TransportationCoordination from './TransportationCoordination';
import ChildScheduleOverlay from './ChildScheduleOverlay';
import FamilyCalendarSync from './FamilyCalendarSync';
import ChildRSVPModal from './ChildRSVPModal';

const localizer = momentLocalizer(moment);

interface CustomEvent extends BigCalendarEvent {
  id?: string;
  eventType?: string;
  location?: string;
  team?: string;
  childId?: string;
  childName?: string;
  status?: string;
  transportation?: {
    needed: boolean;
    driver?: string;
    seats?: number;
  };
  rsvpStatus?: 'accepted' | 'declined' | 'maybe' | 'pending';
  requiresVolunteer?: boolean;
  volunteerNeeded?: string;
}

// Mock children data - in real app, would come from API
const mockChildren = [
  { id: '1', name: 'Alex Johnson', team: 'U12 AAA', jersey: '17' },
  { id: '2', name: 'Emma Johnson', team: 'U10 AA', jersey: '23' },
];

const ParentCalendarView: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CustomEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showTransportation, setShowTransportation] = useState(false);
  const [showScheduleOverlay, setShowScheduleOverlay] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState<string[]>(['all']);
  const [showVolunteerOnly, setShowVolunteerOnly] = useState(false);

  // Get events from calendar API
  const { data: apiEvents = [] } = useGetEventsQuery({
    startDate: moment(currentDate).startOf('month').toISOString(),
    endDate: moment(currentDate).endOf('month').toISOString(),
  });

  // Transform API events to include child information
  const events = useMemo(() => {
    // In real app, would filter based on children's teams/events
    const childEvents: CustomEvent[] = apiEvents.flatMap((event: any) => {
      return mockChildren.map(child => ({
        ...event,
        id: `${event.id}-${child.id}`,
        title: `${event.title} - ${child.name}`,
        childId: child.id,
        childName: child.name,
        team: child.team,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        transportation: {
          needed: Math.random() > 0.5,
          driver: Math.random() > 0.7 ? 'You' : undefined,
          seats: Math.floor(Math.random() * 3) + 1,
        },
        rsvpStatus: ['accepted', 'declined', 'maybe', 'pending'][Math.floor(Math.random() * 4)] as any,
        requiresVolunteer: event.eventType === 'game' && Math.random() > 0.7,
        volunteerNeeded: event.eventType === 'game' && Math.random() > 0.7 ? 
          ['Timer', 'Scorekeeper', 'Penalty Box'][Math.floor(Math.random() * 3)] : undefined,
      }));
    });

    // Filter by selected children
    const filtered = childEvents.filter(event => 
      selectedChildren.includes('all') || selectedChildren.includes(event.childId!)
    );

    // Filter by volunteer needed if enabled
    return showVolunteerOnly ? filtered.filter(e => e.requiresVolunteer) : filtered;
  }, [apiEvents, selectedChildren, showVolunteerOnly]);

  // Count pending RSVPs
  const pendingRSVPs = events.filter(e => e.rsvpStatus === 'pending').length;

  const handleSelectEvent = useCallback((event: CustomEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  }, []);

  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const eventStyleGetter = (event: CustomEvent) => {
    let backgroundColor = '#3b82f6'; // Default blue
    let borderColor = backgroundColor;

    // Color by event type
    switch (event.eventType) {
      case 'training':
        backgroundColor = '#10b981';
        break;
      case 'game':
        backgroundColor = '#f59e0b';
        break;
      case 'meeting':
        backgroundColor = '#8b5cf6';
        break;
      case 'medical':
        backgroundColor = '#ef4444';
        break;
      case 'tournament':
        backgroundColor = '#ec4899';
        break;
    }

    // Add visual indicators for special statuses
    if (event.rsvpStatus === 'pending') {
      borderColor = '#ef4444';
    } else if (event.transportation?.needed && !event.transportation?.driver) {
      borderColor = '#f59e0b';
    }

    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        opacity: event.rsvpStatus === 'declined' ? 0.5 : 1,
      },
    };
  };

  const CustomEvent = ({ event }: { event: CustomEvent }) => (
    <div className="text-xs p-1">
      <div className="font-semibold truncate flex items-center gap-1">
        {event.childName && (
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {event.childName.split(' ')[0]}
          </Badge>
        )}
        <span className="truncate">{event.title?.split(' - ')[0]}</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        {event.rsvpStatus === 'pending' && (
          <AlertCircle className="h-3 w-3 text-yellow-500" />
        )}
        {event.transportation?.needed && (
          <Car className={`h-3 w-3 ${event.transportation.driver ? 'text-green-500' : 'text-orange-500'}`} />
        )}
        {event.requiresVolunteer && (
          <Users className="h-3 w-3 text-purple-500" />
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Family Calendar
            {pendingRSVPs > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRSVPs} Pending RSVPs
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Child Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {selectedChildren.includes('all') ? 'All Children' : `${selectedChildren.length} Selected`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setSelectedChildren(['all'])}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  All Children
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {mockChildren.map(child => (
                  <DropdownMenuItem
                    key={child.id}
                    onClick={() => {
                      if (selectedChildren.includes('all')) {
                        setSelectedChildren([child.id]);
                      } else if (selectedChildren.includes(child.id)) {
                        const filtered = selectedChildren.filter(id => id !== child.id);
                        setSelectedChildren(filtered.length ? filtered : ['all']);
                      } else {
                        setSelectedChildren([...selectedChildren, child.id]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{child.name}</span>
                      <Badge variant="outline">{child.team}</Badge>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Quick Actions
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowQuickActions(true)}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Manage RSVPs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowTransportation(true)}>
                  <Car className="h-4 w-4 mr-2" />
                  Transportation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCalendarSync(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export/Sync Calendar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Bell className="h-4 w-4 mr-2" />
                  Notification Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="schedule-overlay" className="text-sm font-normal">
                      Multi-Child Schedule View
                    </Label>
                    <Switch
                      id="schedule-overlay"
                      checked={showScheduleOverlay}
                      onCheckedChange={setShowScheduleOverlay}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="volunteer-filter" className="text-sm font-normal">
                      Show Volunteer Needed Only
                    </Label>
                    <Switch
                      id="volunteer-filter"
                      checked={showVolunteerOnly}
                      onCheckedChange={setShowVolunteerOnly}
                    />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div className={`h-full ${showScheduleOverlay ? 'pr-80' : ''}`}>
          <Calendar
            localizer={localizer}
            events={events}
            view={currentView}
            date={currentDate}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            style={{ height: '100%' }}
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent,
            }}
            views={['month', 'week', 'day', 'agenda']}
            popup
            showMultiDayTimes
          />
        </div>

        {/* Schedule Overlay */}
        {showScheduleOverlay && (
          <div className="absolute right-0 top-0 w-80 h-full bg-background border-l">
            <ChildScheduleOverlay
              events={events}
              children={mockChildren}
              onSelectEvent={handleSelectEvent}
              onClose={() => setShowScheduleOverlay(false)}
            />
          </div>
        )}
      </CardContent>

      {/* Modals */}
      {showEventDetails && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent as any}
          onClose={() => {
            setShowEventDetails(false);
            setSelectedEvent(null);
          }}
          onRSVP={() => {
            setShowEventDetails(false);
            setShowRSVPModal(true);
          }}
        />
      )}

      {showQuickActions && (
        <ParentQuickActions
          onClose={() => setShowQuickActions(false)}
          children={mockChildren}
          pendingEvents={events.filter(e => e.rsvpStatus === 'pending')}
        />
      )}

      {showTransportation && (
        <TransportationCoordination
          onClose={() => setShowTransportation(false)}
          events={events}
          children={mockChildren}
        />
      )}

      {showCalendarSync && (
        <FamilyCalendarSync
          onClose={() => setShowCalendarSync(false)}
          children={mockChildren}
        />
      )}

      {showRSVPModal && selectedEvent && (
        <ChildRSVPModal
          event={selectedEvent}
          onClose={() => {
            setShowRSVPModal(false);
            setSelectedEvent(null);
          }}
          childName={selectedEvent.childName || ''}
        />
      )}
    </Card>
  );
};

export default ParentCalendarView;