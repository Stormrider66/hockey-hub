"use client";

import React, { useState } from "react";
import { CalendarView } from "@/features/calendar/components/CalendarView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Plus, Clock, Users, MapPin, 
  CheckCircle, XCircle, AlertCircle, Dumbbell,
  Heart, Trophy, Briefcase, Activity, Filter,
  Download, Upload, ChevronDown, Bell
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RSVPModal } from "./components/RSVPModal";
import { PersonalTrainingBooking } from "./components/PersonalTrainingBooking";
import { ConflictAlert } from "./components/ConflictAlert";
import { CalendarSyncModal } from "./components/CalendarSyncModal";
import { EventFilters } from "./components/EventFilters";
import { useGetCalendarEventsQuery } from "@/store/api/calendarApi";
import { useGetPlayerOverviewQuery } from "@/store/api/playerApi";
import { cn } from "@/lib/utils";

export function PlayerCalendarView() {
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [showTrainingBooking, setShowTrainingBooking] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [viewFilter, setViewFilter] = useState("all");
  const [showConflicts, setShowConflicts] = useState(true);
  const [showPersonalOnly, setShowPersonalOnly] = useState(false);

  // Get player's events
  const { data: events } = useGetCalendarEventsQuery({
    playerId: 'current', // API should use auth context
    includeTeamEvents: true,
    includePersonal: true
  });

  // Get player info for team filtering
  const { data: playerData } = useGetPlayerOverviewQuery('current');
  const playerTeam = playerData?.info?.team || 'Senior Team';

  // Filter events
  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    
    let filtered = [...events];
    
    // Apply view filter
    if (viewFilter !== 'all') {
      filtered = filtered.filter(e => e.type === viewFilter);
    }
    
    // Apply personal only filter
    if (showPersonalOnly) {
      filtered = filtered.filter(e => e.metadata?.isPersonal || e.createdBy === 'current');
    }
    
    return filtered;
  }, [events, viewFilter, showPersonalOnly]);

  // Count events by RSVP status
  const rsvpCounts = React.useMemo(() => {
    if (!events) return { pending: 0, accepted: 0, declined: 0 };
    
    return events.reduce((acc, event) => {
      const playerRSVP = event.participants?.find(p => p.userId === 'current');
      if (playerRSVP) {
        if (playerRSVP.status === 'pending') acc.pending++;
        else if (playerRSVP.status === 'accepted') acc.accepted++;
        else if (playerRSVP.status === 'declined') acc.declined++;
      }
      return acc;
    }, { pending: 0, accepted: 0, declined: 0 });
  }, [events]);

  // Detect conflicts
  const conflicts = React.useMemo(() => {
    if (!events || events.length < 2) return [];
    
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    
    const conflicts: any[] = [];
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];
      
      const currentEnd = new Date(current.end);
      const nextStart = new Date(next.start);
      
      if (currentEnd > nextStart) {
        conflicts.push({
          event1: current,
          event2: next,
          type: 'overlap'
        });
      } else if (currentEnd.getTime() === nextStart.getTime()) {
        conflicts.push({
          event1: current,
          event2: next,
          type: 'back-to-back'
        });
      }
    }
    
    return conflicts;
  }, [events]);

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setShowTrainingBooking(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    // Check if player needs to RSVP
    const playerRSVP = event.participants?.find((p: any) => p.userId === 'current');
    if (playerRSVP && playerRSVP.status === 'pending') {
      setShowRSVPModal(true);
    }
  };

  const getPlayerEventStyle = (event: any) => {
    const baseStyle = {
      borderRadius: '4px',
      border: 'none',
      padding: '2px 4px',
      fontSize: '12px',
      fontWeight: 500,
    };

    // Check player's RSVP status
    const playerRSVP = event.participants?.find((p: any) => p.userId === 'current');
    const rsvpStatus = playerRSVP?.status;

    // Style by RSVP status first
    if (rsvpStatus === 'declined') {
      return { ...baseStyle, backgroundColor: '#fee2e2', color: '#dc2626', opacity: 0.6 };
    }
    if (rsvpStatus === 'pending') {
      return { ...baseStyle, backgroundColor: '#fef3c7', color: '#d97706', border: '1px dashed #f59e0b' };
    }

    // Then by event type
    switch (event.type) {
      case 'training':
        return { ...baseStyle, backgroundColor: '#dbeafe', color: '#2563eb' };
      case 'game':
        return { ...baseStyle, backgroundColor: '#d1fae5', color: '#059669' };
      case 'medical':
        return { ...baseStyle, backgroundColor: '#fee2e2', color: '#dc2626' };
      case 'meeting':
        return { ...baseStyle, backgroundColor: '#e9d5ff', color: '#7c3aed' };
      case 'personal':
        return { ...baseStyle, backgroundColor: '#fce7f3', color: '#db2777' };
      case 'team-event':
        return { ...baseStyle, backgroundColor: '#ddd6fe', color: '#6366f1' };
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Header with Actions */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            My Calendar
          </h2>
          <div className="flex items-center gap-2">
            {rsvpCounts.pending > 0 && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
                <AlertCircle className="h-3 w-3" />
                {rsvpCounts.pending} Pending RSVP
              </Badge>
            )}
            {conflicts.length > 0 && showConflicts && (
              <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
                <AlertCircle className="h-3 w-3" />
                {conflicts.length} Conflicts
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {rsvpCounts.accepted} Confirmed
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Filter */}
          <Select value={viewFilter} onValueChange={setViewFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="game">Games</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="meeting">Team Meetings</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>

          {/* Personal Only Toggle */}
          <div className="flex items-center gap-2 px-3 py-1 border rounded-md">
            <Switch
              checked={showPersonalOnly}
              onCheckedChange={setShowPersonalOnly}
              id="personal-only"
            />
            <label htmlFor="personal-only" className="text-sm">Personal Only</label>
          </div>

          {/* Quick Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Calendar Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setShowTrainingBooking(true)}>
                <Dumbbell className="h-4 w-4 mr-2" />
                Book Personal Training
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setShowRSVPModal(true);
                setSelectedEvent(null);
              }}>
                <Bell className="h-4 w-4 mr-2" />
                View Pending RSVPs ({rsvpCounts.pending})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSyncModal(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSyncModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Sync with External Calendar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowConflicts(!showConflicts)}>
                <AlertCircle className="h-4 w-4 mr-2" />
                {showConflicts ? 'Hide' : 'Show'} Conflicts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Conflict Alert Bar */}
      {showConflicts && conflicts.length > 0 && (
        <ConflictAlert 
          conflicts={conflicts} 
          onResolve={(conflict) => {
            // Handle conflict resolution
            console.log('Resolving conflict:', conflict);
          }}
        />
      )}

      {/* RSVP Alert for Pending Events */}
      {rsvpCounts.pending > 0 && (
        <Card className="mb-4 p-3 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">
                You have {rsvpCounts.pending} event{rsvpCounts.pending > 1 ? 's' : ''} awaiting your response
              </span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setShowRSVPModal(true);
                setSelectedEvent(null);
              }}
            >
              Respond Now
            </Button>
          </div>
        </Card>
      )}

      {/* Main Calendar */}
      <div className="flex-1 relative">
        <CalendarView
          events={filteredEvents}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventStyleGetter={getPlayerEventStyle}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="week"
          step={30}
          timeslots={2}
        />
      </div>

      {/* Modals */}
      {showRSVPModal && (
        <RSVPModal
          onClose={() => setShowRSVPModal(false)}
          event={selectedEvent}
          pendingEvents={selectedEvent ? [selectedEvent] : 
            events?.filter(e => {
              const playerRSVP = e.participants?.find((p: any) => p.userId === 'current');
              return playerRSVP?.status === 'pending';
            }) || []
          }
        />
      )}

      {showTrainingBooking && (
        <PersonalTrainingBooking
          onClose={() => setShowTrainingBooking(false)}
          selectedSlot={selectedSlot}
          playerTeam={playerTeam}
        />
      )}

      {showSyncModal && (
        <CalendarSyncModal
          onClose={() => setShowSyncModal(false)}
          events={events || []}
        />
      )}
    </div>
  );
}