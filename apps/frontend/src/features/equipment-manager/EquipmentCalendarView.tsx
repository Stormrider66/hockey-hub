"use client";

import React, { useState } from "react";
import { CalendarView } from "@/features/calendar/components/CalendarView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, Plus, Calendar, Clock, AlertTriangle, 
  Users, Wrench, Scissors, Truck, Activity,
  FileText, ChevronDown, Settings, ShirtIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { QuickEquipmentActions } from "./components/QuickEquipmentActions";
import { EquipmentAvailabilityOverlay } from "./components/EquipmentAvailabilityOverlay";
import { MaintenanceScheduleOverlay } from "./components/MaintenanceScheduleOverlay";
import { EquipmentFittingModal } from "./components/EquipmentFittingModal";
import { EquipmentTemplates } from "./components/EquipmentTemplates";
import { useGetCalendarEventsQuery } from "@/store/api/calendarApi";
import { cn } from "@/lib/utils";

export function EquipmentCalendarView() {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showAvailabilityOverlay, setShowAvailabilityOverlay] = useState(false);
  const [showMaintenanceOverlay, setShowMaintenanceOverlay] = useState(false);
  const [showFittingModal, setShowFittingModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  // Get equipment-related calendar events
  const { data: events } = useGetCalendarEventsQuery({
    type: ['equipment', 'fitting', 'maintenance', 'inventory']
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
    if (actionType === 'fitting') {
      setShowFittingModal(true);
    }
    // Handle other action types
  };

  const getEquipmentEventStyle = (event: any) => {
    const baseStyle = {
      borderRadius: '4px',
      border: 'none',
      padding: '2px 4px',
      fontSize: '12px',
      fontWeight: 500,
    };

    switch (event.metadata?.subtype) {
      case 'fitting':
        return { ...baseStyle, backgroundColor: '#dbeafe', color: '#2563eb' };
      case 'maintenance':
        return { ...baseStyle, backgroundColor: '#fef3c7', color: '#d97706' };
      case 'inventory':
        return { ...baseStyle, backgroundColor: '#d1fae5', color: '#059669' };
      case 'delivery':
        return { ...baseStyle, backgroundColor: '#e9d5ff', color: '#7c3aed' };
      case 'tryout':
        return { ...baseStyle, backgroundColor: '#fee2e2', color: '#dc2626' };
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
            <Package className="h-6 w-6" />
            Equipment Calendar
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              {events?.length || 0} Events This Week
            </Badge>
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
              <AlertTriangle className="h-3 w-3" />
              5 Maintenance Due
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
              <DropdownMenuItem onClick={() => handleQuickAction('fitting')}>
                <ShirtIcon className="h-4 w-4 mr-2 text-blue-600" />
                Equipment Fitting
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('maintenance')}>
                <Wrench className="h-4 w-4 mr-2 text-amber-600" />
                Schedule Maintenance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('tryout')}>
                <Scissors className="h-4 w-4 mr-2 text-red-600" />
                Try-Out Session
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('delivery')}>
                <Truck className="h-4 w-4 mr-2 text-purple-600" />
                Equipment Delivery
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowTemplates(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Use Template
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
                    <Package className="h-4 w-4" />
                    Equipment Availability
                  </label>
                  <Switch
                    checked={showAvailabilityOverlay}
                    onCheckedChange={setShowAvailabilityOverlay}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Maintenance Schedule
                  </label>
                  <Switch
                    checked={showMaintenanceOverlay}
                    onCheckedChange={setShowMaintenanceOverlay}
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowFittingModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Main Calendar with Overlays */}
      <div className="flex-1 relative">
        <CalendarView
          events={events || []}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventStyleGetter={getEquipmentEventStyle}
          className="h-full"
        />

        {/* Overlays */}
        {showAvailabilityOverlay && (
          <div className="absolute top-4 left-4 z-20">
            <EquipmentAvailabilityOverlay />
          </div>
        )}

        {showMaintenanceOverlay && (
          <div className="absolute top-4 right-4 z-20">
            <MaintenanceScheduleOverlay />
          </div>
        )}
      </div>

      {/* Quick Actions Modal */}
      {showQuickActions && selectedSlot && (
        <QuickEquipmentActions
          selectedSlot={selectedSlot}
          onClose={() => setShowQuickActions(false)}
          onAction={handleQuickAction}
        />
      )}

      {/* Equipment Fitting Modal */}
      {showFittingModal && (
        <EquipmentFittingModal
          isOpen={showFittingModal}
          onClose={() => setShowFittingModal(false)}
          initialDate={selectedSlot?.start}
          initialEndDate={selectedSlot?.end}
        />
      )}

      {/* Equipment Templates Modal */}
      {showTemplates && (
        <EquipmentTemplates
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={(template) => {
            setShowTemplates(false);
            setShowFittingModal(true);
            // Pass template data to fitting modal
          }}
        />
      )}
    </div>
  );
}