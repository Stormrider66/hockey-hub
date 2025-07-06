'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useGetUpcomingEventsQuery, EventType } from '@/store/api/calendarApi';
import Link from 'next/link';

interface CalendarWidgetProps {
  organizationId: string;
  userId: string;
  days?: number;
}

const eventTypeColors: Record<EventType, string> = {
  [EventType.TRAINING]: 'bg-green-500',
  [EventType.GAME]: 'bg-red-500',
  [EventType.MEETING]: 'bg-blue-500',
  [EventType.MEDICAL]: 'bg-purple-500',
  [EventType.EQUIPMENT]: 'bg-amber-500',
  [EventType.TEAM_EVENT]: 'bg-cyan-500',
  [EventType.PERSONAL]: 'bg-gray-500',
  [EventType.OTHER]: 'bg-slate-500',
};

export default function CalendarWidget({
  organizationId,
  userId,
  days = 7,
}: CalendarWidgetProps) {
  const { data: eventsData, isLoading } = useGetUpcomingEventsQuery({
    userId,
    organizationId,
    days,
  });

  const events = eventsData?.data || [];
  const upcomingEvents = events.slice(0, 5); // Show max 5 events

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Upcoming events list">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                tabIndex={0}
                role="article"
                aria-label={`Event: ${event.title} on ${format(new Date(event.startTime), 'MMM d, h:mm a')}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    // You could add navigation to event details here
                    e.preventDefault();
                  }
                }}
              >
                <div
                  className={`w-1 h-full rounded-full ${
                    eventTypeColors[event.type]
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium leading-none">
                      {event.title}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <span>
                        {format(new Date(event.startTime), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        <span className="truncate max-w-[100px]">
                          {event.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Link href="/calendar">
            <Button variant="outline" className="w-full" size="sm">
              View All Events
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}