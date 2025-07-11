'use client';

import React, { useState, useCallback } from 'react';
import { CalendarView } from '@/features/calendar/components/CalendarView';
import QuickSessionScheduler from './QuickSessionScheduler';
import TrainingLoadOverlay from '@/features/calendar/components/TrainingLoadOverlay';
import PlayerAvailabilityOverlay from '@/features/calendar/components/PlayerAvailabilityOverlay';
import { Button } from '@/components/ui/button';
import { Plus, Zap, Activity, Users } from 'lucide-react';
import type { CalendarEvent } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGetEventsByDateRangeQuery } from '@/store/api/calendarApi';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

interface TrainerCalendarViewProps {
  organizationId: string;
  userId: string;
  teamId?: string;
}

export default function TrainerCalendarView({
  organizationId,
  userId,
  teamId
}: TrainerCalendarViewProps) {
  const [quickSchedulerOpen, setQuickSchedulerOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<{
    date: Date;
    time: string;
  } | null>(null);
  const [showTrainingLoad, setShowTrainingLoad] = useState(true);
  const [showPlayerAvailability, setShowPlayerAvailability] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch events for training load calculation
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(addMonths(currentDate, 1));
  
  const { data: events = [] } = useGetEventsByDateRangeQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    teamIds: teamId ? [teamId] : undefined,
  });

  const handleQuickSchedule = useCallback((date?: Date, time?: string) => {
    setSelectedDateTime({
      date: date || new Date(),
      time: time || '09:00'
    });
    setQuickSchedulerOpen(true);
  }, []);

  // This would be integrated with the calendar's slot selection
  const handleSlotSelect = useCallback((slotInfo: { start: Date; end: Date }) => {
    const date = new Date(slotInfo.start);
    const time = date.toTimeString().slice(0, 5);
    handleQuickSchedule(date, time);
  }, [handleQuickSchedule]);

  return (
    <div className="relative h-full">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-4">
        {/* Training Load Toggle */}
        <div className="flex items-center space-x-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg p-2">
          <Switch
            id="training-load"
            checked={showTrainingLoad}
            onCheckedChange={setShowTrainingLoad}
          />
          <Label htmlFor="training-load" className="flex items-center cursor-pointer">
            <Activity className="h-4 w-4 mr-1" />
            Training Load
          </Label>
        </div>

        {/* Player Availability Toggle */}
        <div className="flex items-center space-x-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg p-2">
          <Switch
            id="player-availability"
            checked={showPlayerAvailability}
            onCheckedChange={setShowPlayerAvailability}
          />
          <Label htmlFor="player-availability" className="flex items-center cursor-pointer">
            <Users className="h-4 w-4 mr-1" />
            Availability
          </Label>
        </div>

        {/* Quick Actions Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Quick Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleQuickSchedule()}>
              <Plus className="h-4 w-4 mr-2" />
              Quick Session (Now)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickSchedule(new Date(), '07:00')}>
              Morning Session (7:00 AM)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickSchedule(new Date(), '16:00')}>
              Afternoon Session (4:00 PM)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Training Load Overlay */}
      {showTrainingLoad && (
        <div className="absolute -top-4 left-4 z-10 w-80">
          <TrainingLoadOverlay
            events={events}
            currentDate={currentDate}
            view={view}
            teamId={teamId}
          />
        </div>
      )}

      {/* Player Availability Overlay */}
      {showPlayerAvailability && (
        <div className="absolute top-20 right-4 z-10 w-96">
          <PlayerAvailabilityOverlay
            selectedDate={selectedDate}
            teamId={teamId}
            events={events}
            onPlayerSelect={(playerId) => {
              console.log('Selected player:', playerId);
              // Could open player details or filter calendar
            }}
          />
        </div>
      )}

      {/* Regular Calendar View */}
      <div className="h-full pt-16">
        <CalendarView
          organizationId={organizationId}
          teamId={teamId}
          userId={userId}
          userRole="physicaltrainer"
        />
      </div>

      {/* Quick Session Scheduler Modal */}
      {selectedDateTime && (
        <QuickSessionScheduler
          open={quickSchedulerOpen}
          onOpenChange={setQuickSchedulerOpen}
          preSelectedDate={selectedDateTime.date}
          preSelectedTime={selectedDateTime.time}
          onSuccess={() => {
            // Could trigger a calendar refresh here
            console.log('Quick session created successfully');
          }}
        />
      )}
    </div>
  );
}