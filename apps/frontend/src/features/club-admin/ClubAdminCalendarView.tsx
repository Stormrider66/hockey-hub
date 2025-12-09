"use client";

import React, { useState } from "react";
import { CalendarView } from "@/features/calendar/components/CalendarView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Plus, Calendar, Clock, Users, 
  CheckCircle, XCircle, AlertCircle, TrendingUp,
  FileText, ChevronDown, Filter, Eye, Settings,
  DollarSign, Home, Briefcase, GraduationCap
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
import { QuickAdminActions } from "./components/QuickAdminActions";
import { ResourceAllocationOverlay } from "./components/ResourceAllocationOverlay";
import { EventApprovalModal } from "./components/EventApprovalModal";
import { CalendarAnalyticsOverlay } from "./components/CalendarAnalyticsOverlay";
import { MeetingRoomBookingModal } from "./components/MeetingRoomBookingModal";
import { OrganizationEventModal } from "./components/OrganizationEventModal";
import { useGetCalendarEventsQuery } from "@/store/api/calendarApi";
import { cn } from "@/lib/utils";

interface ClubAdminCalendarViewProps {
  teamId?: string | null;
}

export function ClubAdminCalendarView({ teamId }: ClubAdminCalendarViewProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showResourceOverlay, setShowResourceOverlay] = useState(false);
  const [showAnalyticsOverlay, setShowAnalyticsOverlay] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRoomBooking, setShowRoomBooking] = useState(false);
  const [showOrgEventModal, setShowOrgEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [viewFilter, setViewFilter] = useState("all");
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  // Get calendar events - either for all teams or specific team
  const { data: events } = useGetCalendarEventsQuery({
    organizationWide: !teamId, // If no specific team, get organization-wide
    teamId: teamId || undefined,
    includePending: true
  });

  // Count pending events
  const pendingEvents = events?.filter(e => e.status === 'pending') || [];
  const approvedEvents = events?.filter(e => e.status === 'approved') || [];
  const conflictingEvents = events?.filter(e => e.metadata?.hasConflict) || [];

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setShowQuickActions(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    if (event.status === 'pending') {
      setShowApprovalModal(true);
    }
  };

  const handleQuickAction = (actionType: string) => {
    setShowQuickActions(false);
    switch (actionType) {
      case 'meeting':
        setShowRoomBooking(true);
        break;
      case 'organization-event':
        setShowOrgEventModal(true);
        break;
      case 'review-pending':
        setShowApprovalModal(true);
        break;
    }
  };

  const getAdminEventStyle = (event: any) => {
    const baseStyle = {
      borderRadius: '4px',
      border: 'none',
      padding: '2px 4px',
      fontSize: '12px',
      fontWeight: 500,
    };

    // Color by status first
    if (event.status === 'pending') {
      return { ...baseStyle, backgroundColor: '#fef3c7', color: '#d97706', border: '1px dashed #f59e0b' };
    }
    if (event.metadata?.hasConflict) {
      return { ...baseStyle, backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #ef4444' };
    }

    // Then by type
    switch (event.type) {
      case 'meeting':
        return { ...baseStyle, backgroundColor: '#dbeafe', color: '#2563eb' };
      case 'tournament':
        return { ...baseStyle, backgroundColor: '#e9d5ff', color: '#7c3aed' };
      case 'board-meeting':
        return { ...baseStyle, backgroundColor: '#1e293b', color: '#f8fafc' };
      case 'fundraiser':
        return { ...baseStyle, backgroundColor: '#d1fae5', color: '#059669' };
      case 'training':
        return { ...baseStyle, backgroundColor: '#fce7f3', color: '#db2777' };
      case 'game':
        return { ...baseStyle, backgroundColor: '#ddd6fe', color: '#6366f1' };
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const filteredEvents = () => {
    if (showPendingOnly) return pendingEvents;
    if (viewFilter === "all") return events;
    return events?.filter(e => e.type === viewFilter) || [];
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Header with Actions */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Organization Calendar
          </h2>
          <div className="flex items-center gap-2">
            {pendingEvents.length > 0 && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
                <AlertCircle className="h-3 w-3" />
                {pendingEvents.length} Pending Approval
              </Badge>
            )}
            {conflictingEvents.length > 0 && (
              <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
                <XCircle className="h-3 w-3" />
                {conflictingEvents.length} Conflicts
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {approvedEvents.length} Scheduled
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
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="tournament">Tournaments</SelectItem>
              <SelectItem value="fundraiser">Fundraisers</SelectItem>
              <SelectItem value="board-meeting">Board Meetings</SelectItem>
            </SelectContent>
          </Select>

          {/* Pending Only Toggle */}
          <div className="flex items-center gap-2 px-3 py-1 border rounded-md">
            <Switch
              checked={showPendingOnly}
              onCheckedChange={setShowPendingOnly}
              id="pending-only"
            />
            <label htmlFor="pending-only" className="text-sm">Pending Only</label>
          </div>

          {/* Quick Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Quick Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Event Management</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleQuickAction('review-pending')}>
                <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
                Review Pending Events ({pendingEvents.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('organization-event')}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Organization Event
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Facility Management</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleQuickAction('meeting')}>
                <Briefcase className="h-4 w-4 mr-2" />
                Book Meeting Room
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowResourceOverlay(true)}>
                <Home className="h-4 w-4 mr-2" />
                View Resource Allocation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Analytics</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setShowAnalyticsOverlay(true)}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Calendar Analytics
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Generate Reports
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggles */}
          <div className="flex items-center gap-2 border-l pl-2">
            <Button
              size="sm"
              variant={showResourceOverlay ? "secondary" : "ghost"}
              onClick={() => setShowResourceOverlay(!showResourceOverlay)}
              title="Toggle resource allocation view"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={showAnalyticsOverlay ? "secondary" : "ghost"}
              onClick={() => setShowAnalyticsOverlay(!showAnalyticsOverlay)}
              title="Toggle analytics view"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status Bar for Important Alerts */}
      {(pendingEvents.length > 0 || conflictingEvents.length > 0) && (
        <Card className="mb-4 p-3 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">
                {pendingEvents.length > 0 && `${pendingEvents.length} events require approval`}
                {pendingEvents.length > 0 && conflictingEvents.length > 0 && " • "}
                {conflictingEvents.length > 0 && `${conflictingEvents.length} scheduling conflicts detected`}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowApprovalModal(true)}>
              Review Now
            </Button>
          </div>
        </Card>
      )}

      {/* Main Calendar */}
      <div className="flex-1 relative">
        <CalendarView
          events={filteredEvents() || []}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventStyleGetter={getAdminEventStyle}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
        />

        {/* Overlays */}
        {showResourceOverlay && (
          <ResourceAllocationOverlay
            onClose={() => setShowResourceOverlay(false)}
            selectedDate={selectedDate}
          />
        )}

        {showAnalyticsOverlay && (
          <CalendarAnalyticsOverlay
            onClose={() => setShowAnalyticsOverlay(false)}
            events={events || []}
          />
        )}
      </div>

      {/* Modals */}
      {showQuickActions && selectedSlot && (
        <QuickAdminActions
          onClose={() => setShowQuickActions(false)}
          onSelectAction={handleQuickAction}
          selectedSlot={selectedSlot}
          pendingCount={pendingEvents.length}
        />
      )}

      {showApprovalModal && (
        <EventApprovalModal
          onClose={() => setShowApprovalModal(false)}
          pendingEvents={pendingEvents}
          selectedEvent={selectedEvent}
        />
      )}

      {showRoomBooking && selectedSlot && (
        <MeetingRoomBookingModal
          onClose={() => setShowRoomBooking(false)}
          selectedSlot={selectedSlot}
        />
      )}

      {showOrgEventModal && selectedSlot && (
        <OrganizationEventModal
          onClose={() => setShowOrgEventModal(false)}
          selectedSlot={selectedSlot}
        />
      )}
    </div>
  );
}