"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
// Replace missing DatePicker with native input for build
import { 
  Calendar, Clock, User, Stethoscope, AlertTriangle,
  MapPin, FileText, Users, Plus, X
} from "lucide-react";
import { format } from "date-fns";
import { useCreateEventMutation, EventType, EventVisibility } from "@/store/api/calendarApi";

interface CreateMedicalEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialEndDate?: Date;
  template?: any;
}

export function CreateMedicalEventModal({ 
  isOpen, 
  onClose, 
  initialDate, 
  initialEndDate,
  template 
}: CreateMedicalEventModalProps) {
  const [createEvent] = useCreateEventMutation();
  
  const [formData, setFormData] = useState({
    title: template?.name || "",
    type: "medical",
    subtype: template?.category || "checkup",
    date: initialDate || new Date(),
    startTime: initialDate ? format(initialDate, "HH:mm") : "09:00",
    endTime: initialEndDate ? format(initialEndDate, "HH:mm") : "09:30",
    patientType: "individual",
    patients: [] as string[],
    staff: [] as string[],
    location: "",
    description: template?.description || "",
    priority: "normal",
    equipment: template?.equipment || [],
    protocols: template?.protocols || [],
    requiresFollowUp: false,
    recurringSchedule: false,
  });

  const medicalEventTypes = [
    { value: "checkup", label: "Routine Checkup", icon: "🩺" },
    { value: "injury_assessment", label: "Injury Assessment", icon: "🚨" },
    { value: "treatment", label: "Treatment Session", icon: "💊" },
    { value: "surgery", label: "Surgery/Procedure", icon: "🏥" },
    { value: "screening", label: "Medical Screening", icon: "📋" },
    { value: "rehabilitation", label: "Rehabilitation", icon: "🏃" },
    { value: "consultation", label: "Specialist Consultation", icon: "👨‍⚕️" },
  ];

  const priorities = [
    { value: "urgent", label: "Urgent", color: "text-red-600" },
    { value: "high", label: "High", color: "text-orange-600" },
    { value: "normal", label: "Normal", color: "text-blue-600" },
    { value: "low", label: "Low", color: "text-gray-600" },
  ];

  const locations = [
    "Treatment Room 1",
    "Treatment Room 2",
    "Examination Room A",
    "Examination Room B",
    "Therapy Pool",
    "Testing Lab",
    "Recovery Suite",
    "Team Medical Office",
    "External - Hospital",
    "External - Specialist Clinic",
  ];

  const handleSubmit = async () => {
    try {
      const startDateTime = new Date(formData.date);
      const [startHour, startMinute] = formData.startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

      const endDateTime = new Date(formData.date);
      const [endHour, endMinute] = formData.endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

      await createEvent({
        title: formData.title,
        type: EventType.MEDICAL,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        organizationId: 'org-1',
        createdBy: 'system',
        location: formData.location,
        description: formData.description,
        metadata: {
          subtype: formData.subtype,
          priority: formData.priority,
          patientType: formData.patientType,
          patients: formData.patients,
          staff: formData.staff,
          equipment: formData.equipment,
          protocols: formData.protocols,
          requiresFollowUp: formData.requiresFollowUp,
        },
        visibility: EventVisibility.ROLE_BASED,
      }).unwrap();

      onClose();
    } catch (error) {
      console.error('Failed to create medical event:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Schedule Medical Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Type */}
          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <RadioGroup 
              value={formData.subtype} 
              onValueChange={(value) => setFormData({...formData, subtype: value})}
            >
              <div className="grid grid-cols-2 gap-3">
                {medicalEventTypes.map(type => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <Label 
                      htmlFor={type.value} 
                      className="flex items-center gap-2 cursor-pointer font-normal"
                    >
                      <span>{type.icon}</span>
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Title and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Post-Game Recovery Session"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <span className={priority.color}>{priority.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={format(formData.date, 'yyyy-MM-dd')}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
          </div>

          {/* Patient Selection */}
          <div className="space-y-2">
            <Label>Patient(s)</Label>
            <RadioGroup
              value={formData.patientType}
              onValueChange={(value) => setFormData({...formData, patientType: value})}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual">Individual Player</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="group" id="group" />
                  <Label htmlFor="group">Multiple Players</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="team" id="team" />
                  <Label htmlFor="team">Entire Team</Label>
                </div>
              </div>
            </RadioGroup>
            
            {formData.patientType !== "team" && (
              <div className="mt-2">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player(s)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player1">Erik Andersson (#15)</SelectItem>
                    <SelectItem value="player2">Marcus Lindberg (#7)</SelectItem>
                    <SelectItem value="player3">Viktor Nilsson (#23)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={formData.location}
              onValueChange={(value) => setFormData({...formData, location: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {location}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Medical Staff */}
          <div className="space-y-2">
            <Label>Medical Staff</Label>
            <div className="space-y-2">
              <Checkbox id="doctor" />
              <Label htmlFor="doctor" className="ml-2 font-normal">Dr. Sarah Johnson (Team Physician)</Label>
              <br />
              <Checkbox id="physio" />
              <Label htmlFor="physio" className="ml-2 font-normal">Mike Thompson (Physiotherapist)</Label>
              <br />
              <Checkbox id="therapist" />
              <Label htmlFor="therapist" className="ml-2 font-normal">Anna Chen (Athletic Therapist)</Label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes / Special Instructions</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Add any relevant medical notes or special instructions..."
              rows={3}
            />
          </div>

          {/* Additional Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="followUp"
                checked={formData.requiresFollowUp}
                onCheckedChange={(checked) => setFormData({...formData, requiresFollowUp: !!checked})}
              />
              <Label htmlFor="followUp" className="font-normal">
                Requires follow-up appointment
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="recurring"
                checked={formData.recurringSchedule}
                onCheckedChange={(checked) => setFormData({...formData, recurringSchedule: !!checked})}
              />
              <Label htmlFor="recurring" className="font-normal">
                Set as recurring appointment
              </Label>
            </div>
          </div>

          {/* Template Info */}
          {template && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Using Template: {template.name}</p>
              <div className="flex flex-wrap gap-2">
                {template.protocols?.map((protocol: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {protocol}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}