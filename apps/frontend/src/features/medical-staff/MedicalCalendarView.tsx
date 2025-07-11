"use client";

import React, { useState } from "react";
import { CalendarView } from "@/features/calendar/components/CalendarView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, Plus, Calendar, Clock, AlertTriangle, 
  UserCheck, Syringe, ClipboardList, Activity, Users,
  FileText, ChevronDown, Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { QuickMedicalActions } from "./components/QuickMedicalActions";
import { MedicalStatusOverlay } from "./components/MedicalStatusOverlay";
import { MedicalAvailabilityOverlay } from "./components/MedicalAvailabilityOverlay";
import { CreateMedicalEventModal } from "./components/CreateMedicalEventModal";
import { TreatmentTemplates } from "./components/TreatmentTemplates";
import { BulkMedicalScheduling } from "./components/BulkMedicalScheduling";
import { useGetCalendarEventsQuery } from "@/store/api/calendarApi";
import { cn } from "@/lib/utils";

interface MedicalCalendarViewProps {
  teamId?: string | null;
}

export function MedicalCalendarView({ teamId }: MedicalCalendarViewProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showStatusOverlay, setShowStatusOverlay] = useState(false);
  const [showAvailabilityOverlay, setShowAvailabilityOverlay] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBulkScheduling, setShowBulkScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  // Get medical-related calendar events
  const { data: events } = useGetCalendarEventsQuery({
    type: ['medical', 'checkup', 'treatment', 'screening'],
    teamId: teamId || undefined
  });

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setShowQuickActions(true);
  };

  const handleSelectEvent = (event: any) => {
    // Handle event click - show details or edit modal
    console.log('Selected event:', event);
  };

  const handleQuickAction = (actionType: string) => {
    setShowQuickActions(false);
    setShowCreateModal(true);
    // Pass the action type to the create modal
  };

  const getMedicalEventStyle = (event: any) => {
    const baseStyle = {
      borderRadius: '4px',
      border: 'none',
      padding: '2px 4px',
      fontSize: '12px',
      fontWeight: 500,
    };

    switch (event.metadata?.subtype) {
      case 'injury_assessment':
        return { ...baseStyle, backgroundColor: '#fee2e2', color: '#dc2626' };
      case 'treatment':
        return { ...baseStyle, backgroundColor: '#dbeafe', color: '#2563eb' };
      case 'checkup':
        return { ...baseStyle, backgroundColor: '#d1fae5', color: '#059669' };
      case 'surgery':
        return { ...baseStyle, backgroundColor: '#fef3c7', color: '#d97706' };
      case 'screening':
        return { ...baseStyle, backgroundColor: '#e9d5ff', color: '#7c3aed' };
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
            <Stethoscope className="h-6 w-6" />
            Medical Calendar
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              {events?.length || 0} Events This Week
            </Badge>
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
              <AlertTriangle className="h-3 w-3" />
              3 Urgent
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Quick Actions
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleQuickAction('injury')}>
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                New Injury Assessment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('treatment')}>
                <Syringe className="h-4 w-4 mr-2 text-blue-600" />
                Schedule Treatment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('checkup')}>
                <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                Routine Checkup
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('screening')}>
                <Users className="h-4 w-4 mr-2 text-purple-600" />
                Team Screening
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowTemplates(true)}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Use Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBulkScheduling(true)}>
                <Users className="h-4 w-4 mr-2" />
                Bulk Scheduling
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                View Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Injury Status
                  </label>
                  <Switch
                    checked={showStatusOverlay}
                    onCheckedChange={setShowStatusOverlay}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Staff Availability
                  </label>
                  <Switch
                    checked={showAvailabilityOverlay}
                    onCheckedChange={setShowAvailabilityOverlay}
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Main Calendar with Overlays */}
      <div className="flex-1 relative">
        <CalendarView
          events={events || []}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventStyleGetter={getMedicalEventStyle}
          className="h-full"
        />

        {/* Overlays */}
        {showStatusOverlay && (
          <div className="absolute top-4 left-4 z-20">
            <MedicalStatusOverlay />
          </div>
        )}

        {showAvailabilityOverlay && (
          <div className="absolute top-4 right-4 z-20">
            <MedicalAvailabilityOverlay />
          </div>
        )}
      </div>

      {/* Quick Actions Modal */}
      {showQuickActions && selectedSlot && (
        <QuickMedicalActions
          selectedSlot={selectedSlot}
          onClose={() => setShowQuickActions(false)}
          onAction={handleQuickAction}
        />
      )}

      {/* Create Medical Event Modal */}
      {showCreateModal && (
        <CreateMedicalEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          initialDate={selectedSlot?.start}
          initialEndDate={selectedSlot?.end}
        />
      )}

      {/* Treatment Templates Modal */}
      {showTemplates && (
        <TreatmentTemplates
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={(template) => {
            setShowTemplates(false);
            setShowCreateModal(true);
            // Pass template data to create modal
          }}
        />
      )}

      {/* Bulk Medical Scheduling Modal */}
      {showBulkScheduling && (
        <BulkMedicalScheduling
          isOpen={showBulkScheduling}
          onClose={() => setShowBulkScheduling(false)}
        />
      )}
    </div>
  );
}