'use client';

import React, { useState, useCallback } from 'react';
import CalendarView from '@/features/calendar/components/CalendarView';
import IceTimeUtilizationOverlay from '@/features/calendar/components/IceTimeUtilizationOverlay';
import LineManagementOverlay from '@/features/calendar/components/LineManagementOverlay';
import PracticePlanBuilder from './PracticePlanBuilder';
import { Button } from '@/components/ui/button';
import { Plus, Snowflake, Users, FileText, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetEventsByDateRangeQuery } from '@/store/api/calendarApi';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

interface IceCoachCalendarViewProps {
  organizationId: string;
  userId: string;
  teamId?: string;
}

export default function IceCoachCalendarView({
  organizationId,
  userId,
  teamId
}: IceCoachCalendarViewProps) {
  const [showIceUtilization, setShowIceUtilization] = useState(true);
  const [showLineManagement, setShowLineManagement] = useState(false);
  const [showPracticePlanBuilder, setShowPracticePlanBuilder] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Fetch events for overlays
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(addMonths(currentDate, 1));
  
  const { data: events = [] } = useGetEventsByDateRangeQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    teamIds: teamId ? [teamId] : undefined,
  });

  const handleQuickActions = useCallback((action: string) => {
    switch (action) {
      case 'practice':
        setShowPracticePlanBuilder(true);
        break;
      case 'game':
        // Open game creation modal
        console.log('Create game');
        break;
      case 'meeting':
        // Open team meeting modal
        console.log('Create team meeting');
        break;
    }
  }, []);

  const handleSavePracticePlan = (plan: any) => {
    console.log('Saving practice plan:', plan);
    // Here you would save the plan and create a calendar event
    setShowPracticePlanBuilder(false);
  };

  const handleSaveLines = (lines: any) => {
    console.log('Saving lines:', lines);
    // Here you would save the line configuration
  };

  // Handle calendar slot selection for quick practice scheduling
  const handleSlotSelect = useCallback((slotInfo: any) => {
    const date = new Date(slotInfo.start);
    setSelectedEvent({
      startTime: date,
      endTime: slotInfo.end,
      type: 'practice',
    });
    setShowPracticePlanBuilder(true);
  }, []);

  return (
    <div className="relative h-full">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-4">
        {/* Ice Utilization Toggle */}
        <div className="flex items-center space-x-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg p-2">
          <Switch
            id="ice-utilization"
            checked={showIceUtilization}
            onCheckedChange={setShowIceUtilization}
          />
          <Label htmlFor="ice-utilization" className="flex items-center cursor-pointer">
            <Snowflake className="h-4 w-4 mr-1" />
            Ice Time
          </Label>
        </div>

        {/* Line Management Toggle */}
        <div className="flex items-center space-x-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg p-2">
          <Switch
            id="line-management"
            checked={showLineManagement}
            onCheckedChange={setShowLineManagement}
          />
          <Label htmlFor="line-management" className="flex items-center cursor-pointer">
            <Users className="h-4 w-4 mr-1" />
            Lines
          </Label>
        </div>

        {/* Quick Actions Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Quick Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleQuickActions('practice')}>
              <FileText className="h-4 w-4 mr-2" />
              Create Practice Plan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickActions('game')}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Game
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickActions('meeting')}>
              <Users className="h-4 w-4 mr-2" />
              Team Meeting
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Ice Time Utilization Overlay */}
      {showIceUtilization && (
        <div className="absolute top-20 left-4 z-10 w-80">
          <IceTimeUtilizationOverlay
            events={events}
            currentDate={currentDate}
            view={view}
            rinkHoursPerDay={16}
            costPerHour={250}
          />
        </div>
      )}

      {/* Line Management Overlay */}
      {showLineManagement && (
        <div className="absolute top-20 right-4 z-10 w-[500px]">
          <LineManagementOverlay
            selectedEvent={selectedEvent}
            teamId={teamId}
            onSaveLines={handleSaveLines}
          />
        </div>
      )}

      {/* Regular Calendar View */}
      <CalendarView
        organizationId={organizationId}
        teamId={teamId}
        userId={userId}
        userRole="coach"
      />

      {/* Practice Plan Builder Dialog */}
      <Dialog open={showPracticePlanBuilder} onOpenChange={setShowPracticePlanBuilder}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Practice Plan</DialogTitle>
            <DialogDescription>
              Build a structured practice plan with drills and objectives.
            </DialogDescription>
          </DialogHeader>
          <PracticePlanBuilder
            onSavePlan={handleSavePracticePlan}
            teamId={teamId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}