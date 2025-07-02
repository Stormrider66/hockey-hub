import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Car,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, startOfDay, differenceInMinutes } from 'date-fns';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  eventType: string;
  location?: string;
  childId: string;
  childName: string;
  rsvpStatus?: 'accepted' | 'declined' | 'maybe' | 'pending';
  transportation?: {
    needed: boolean;
    driver?: string;
  };
}

interface Child {
  id: string;
  name: string;
  team: string;
  jersey: string;
}

interface ChildScheduleOverlayProps {
  events: Event[];
  children: Child[];
  onSelectEvent: (event: Event) => void;
  onClose: () => void;
}

const ChildScheduleOverlay: React.FC<ChildScheduleOverlayProps> = ({
  events,
  children,
  onSelectEvent,
  onClose,
}) => {
  // Group events by child and date
  const getEventsByChildAndDate = () => {
    const grouped: Record<string, Record<string, Event[]>> = {};
    
    events.forEach(event => {
      if (!grouped[event.childId]) {
        grouped[event.childId] = {};
      }
      
      const dateKey = format(event.start, 'yyyy-MM-dd');
      if (!grouped[event.childId][dateKey]) {
        grouped[event.childId][dateKey] = [];
      }
      
      grouped[event.childId][dateKey].push(event);
    });

    // Sort events within each date
    Object.values(grouped).forEach(childEvents => {
      Object.values(childEvents).forEach(dateEvents => {
        dateEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      });
    });

    return grouped;
  };

  const eventsByChild = getEventsByChildAndDate();

  // Get upcoming dates with events
  const getUpcomingDates = () => {
    const dates = new Set<string>();
    Object.values(eventsByChild).forEach(childEvents => {
      Object.keys(childEvents).forEach(date => dates.add(date));
    });
    
    return Array.from(dates)
      .sort()
      .filter(date => new Date(date) >= startOfDay(new Date()))
      .slice(0, 7); // Show next 7 days with events
  };

  const upcomingDates = getUpcomingDates();

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const getRSVPIcon = (status?: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'declined':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'maybe':
        return <HelpCircle className="h-3 w-3 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="h-3 w-3 text-orange-500" />;
      default:
        return null;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'training':
        return 'bg-green-500';
      case 'game':
        return 'bg-orange-500';
      case 'meeting':
        return 'bg-purple-500';
      case 'medical':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Check for conflicts between children's events
  const hasConflict = (event: Event, date: string) => {
    const otherChildEvents = Object.entries(eventsByChild)
      .filter(([childId]) => childId !== event.childId)
      .flatMap(([_, childEvents]) => childEvents[date] || []);

    return otherChildEvents.some(otherEvent => {
      const eventStart = event.start.getTime();
      const eventEnd = event.end.getTime();
      const otherStart = otherEvent.start.getTime();
      const otherEnd = otherEvent.end.getTime();
      
      // Check for overlap
      return (eventStart < otherEnd && eventEnd > otherStart);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Multi-Child Schedule View</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {upcomingDates.map(date => (
            <div key={date}>
              <h4 className="font-semibold text-sm mb-3 sticky top-0 bg-background py-1">
                {getDateLabel(date)}
                <span className="text-muted-foreground ml-2 font-normal">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </span>
              </h4>
              
              <div className="grid grid-cols-1 gap-3">
                {children.map(child => {
                  const childEvents = eventsByChild[child.id]?.[date] || [];
                  
                  return (
                    <Card key={child.id} className="overflow-hidden">
                      <CardHeader className="py-2 px-3 bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {child.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{child.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {child.team}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2">
                        {childEvents.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2 text-center">
                            No events scheduled
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {childEvents.map(event => {
                              const conflict = hasConflict(event, date);
                              
                              return (
                                <div
                                  key={event.id}
                                  className={`
                                    p-2 rounded-md border cursor-pointer transition-colors
                                    hover:bg-accent
                                    ${conflict ? 'border-orange-500 bg-orange-50' : ''}
                                  `}
                                  onClick={() => onSelectEvent(event)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getEventTypeColor(event.eventType)}`} />
                                        <span className="font-medium text-sm">
                                          {event.title}
                                        </span>
                                        {getRSVPIcon(event.rsvpStatus)}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {format(event.start, 'h:mm a')}
                                        </span>
                                        {event.location && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {event.location}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {event.transportation?.needed && (
                                        <Car className={`h-3 w-3 ${
                                          event.transportation.driver ? 'text-green-500' : 'text-orange-500'
                                        }`} />
                                      )}
                                      {conflict && (
                                        <AlertCircle className="h-3 w-3 text-orange-500" />
                                      )}
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Separator className="mt-4" />
            </div>
          ))}

          {upcomingDates.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming events scheduled</p>
            </div>
          )}

          {/* Summary Statistics */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">This Week's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {children.map(child => {
                const thisWeekEvents = Object.values(eventsByChild[child.id] || {})
                  .flat()
                  .filter(event => isThisWeek(event.start));
                
                const gameCount = thisWeekEvents.filter(e => e.eventType === 'game').length;
                const practiceCount = thisWeekEvents.filter(e => e.eventType === 'training').length;
                const totalHours = thisWeekEvents.reduce((sum, event) => {
                  return sum + differenceInMinutes(event.end, event.start) / 60;
                }, 0);

                return (
                  <div key={child.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{child.name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{gameCount} games</span>
                      <span>{practiceCount} practices</span>
                      <span>{totalHours.toFixed(1)}h total</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChildScheduleOverlay;