'use client';

import React from 'react';
import { Event as BigCalendarEvent } from 'react-big-calendar';
import { Users } from 'lucide-react';
import { CalendarEvent } from '@/store/api/calendarApi';
import { cn } from '@/lib/utils';

interface LiveEventComponentProps {
  event: BigCalendarEvent & { resource: CalendarEvent };
  title: string;
}

export function LiveEventComponent({ event, title }: LiveEventComponentProps) {
  const calendarEvent = event.resource;
  const isLive = calendarEvent.isLive;
  const hasParticipants = isLive && calendarEvent.activeParticipants > 0;

  return (
    <div className="relative h-full w-full p-1">
      {/* Live indicator dot */}
      {isLive && (
        <div className="absolute top-0.5 right-0.5 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-full animate-ping" />
            <div className="relative bg-white rounded-full h-2 w-2" />
          </div>
        </div>
      )}
      
      {/* Event title */}
      <div className={cn("text-xs truncate", isLive && "font-semibold")}>
        {title}
      </div>
      
      {/* Live details - only show in week/day view */}
      {isLive && (
        <div className="mt-0.5 space-y-0.5">
          {/* Participant count */}
          {hasParticipants && (
            <div className="flex items-center gap-0.5 text-xs opacity-90">
              <Users className="h-3 w-3" />
              <span>{calendarEvent.activeParticipants}</span>
            </div>
          )}
          
          {/* Progress bar for month view */}
          {calendarEvent.currentProgress !== undefined && calendarEvent.currentProgress > 0 && (
            <div className="w-full bg-white/20 rounded-full h-1">
              <div 
                className="bg-white/80 h-1 rounded-full transition-all duration-300"
                style={{ width: `${calendarEvent.currentProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Week/Day view component with more details
export function LiveEventDetailComponent({ event, title }: LiveEventComponentProps) {
  const calendarEvent = event.resource;
  const isLive = calendarEvent.isLive;

  return (
    <div className="relative h-full w-full p-2">
      {/* Live badge */}
      {isLive && (
        <div className="absolute top-1 right-1 z-10">
          <div className="flex items-center gap-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
            <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
      )}
      
      {/* Event content */}
      <div className="space-y-1">
        <div className={cn("font-medium truncate", isLive && "pr-12")}>
          {title}
        </div>
        
        {isLive && (
          <>
            {/* Participants */}
            {calendarEvent.activeParticipants > 0 && (
              <div className="flex items-center gap-1 text-xs opacity-90">
                <Users className="h-3 w-3" />
                <span>{calendarEvent.activeParticipants} active</span>
              </div>
            )}
            
            {/* Current activity */}
            {calendarEvent.currentActivity && (
              <div className="text-xs opacity-80 truncate">
                {calendarEvent.currentActivity.name}
              </div>
            )}
            
            {/* Progress */}
            {calendarEvent.currentProgress !== undefined && (
              <div className="space-y-0.5">
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div 
                    className="bg-white/90 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${calendarEvent.currentProgress}%` }}
                  />
                </div>
                <div className="text-xs opacity-70">
                  {calendarEvent.currentProgress}% complete
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}