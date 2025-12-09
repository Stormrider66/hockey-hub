"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Calendar as DateIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button as ShadButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Calendar, Clock, MapPin, FileText, 
  AlertCircle, CheckCircle2, Plus, Search,
  UserCheck, UserX, Filter, ChevronRight,
  Clipboard, Activity, Heart, Brain, Shield,
  Stethoscope, Timer, Target, TrendingUp
} from "lucide-react";
import { format, addDays, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateEventMutation, EventType, EventVisibility } from "@/store/api/calendarApi";

interface BulkMedicalSchedulingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
  team: string;
  lastMedical: string;
  status: 'available' | 'injured' | 'limited';
  medicalFlags: string[];
}

export function BulkMedicalScheduling({ isOpen, onClose }: BulkMedicalSchedulingProps) {
  const [createEvent] = useCreateEventMutation();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [currentStep, setCurrentStep] = useState(1);
  
  const [schedulingData, setSchedulingData] = useState({
    type: "screening",
    title: "",
    startDate: new Date(),
    timeSlot: "morning",
    duration: 30,
    location: "",
    staff: [] as string[],
    tests: [] as string[],
    groupSize: 5,
    breakBetweenGroups: 15,
    notes: "",
    sendNotifications: true,
    autoReminders: true,
  });

  // Mock player data
  const allPlayers: Player[] = [
    { id: "1", name: "Erik Andersson", number: "15", position: "C", team: "Senior", lastMedical: "3 months ago", status: "injured", medicalFlags: ["ACL Recovery"] },
    { id: "2", name: "Marcus Lindberg", number: "7", position: "LW", team: "Senior", lastMedical: "2 months ago", status: "limited", medicalFlags: ["Hamstring"] },
    { id: "3", name: "Viktor Nilsson", number: "23", position: "D", team: "Senior", lastMedical: "4 months ago", status: "available", medicalFlags: [] },
    { id: "4", name: "Johan Bergström", number: "14", position: "RW", team: "Senior", lastMedical: "2 months ago", status: "available", medicalFlags: [] },
    { id: "5", name: "Anders Johansson", number: "9", position: "D", team: "Senior", lastMedical: "5 months ago", status: "available", medicalFlags: ["Allergies"] },
    { id: "6", name: "Niklas Svensson", number: "21", position: "G", team: "Senior", lastMedical: "1 month ago", status: "available", medicalFlags: [] },
    { id: "7", name: "Peter Larsson", number: "88", position: "C", team: "U20", lastMedical: "6 months ago", status: "available", medicalFlags: [] },
    { id: "8", name: "David Eriksson", number: "19", position: "LW", team: "U20", lastMedical: "3 months ago", status: "available", medicalFlags: [] },
  ];

  const bulkActivityTypes = [
    { value: "screening", label: "Pre-Season Screening", icon: Clipboard, description: "Comprehensive medical evaluation" },
    { value: "fitness", label: "Fitness Testing", icon: Activity, description: "Physical performance assessment" },
    { value: "cardiac", label: "Cardiac Screening", icon: Heart, description: "Heart health evaluation" },
    { value: "cognitive", label: "Cognitive Testing", icon: Brain, description: "Baseline concussion testing" },
    { value: "vaccination", label: "Team Vaccination", icon: Shield, description: "Flu shots or other vaccines" },
    { value: "checkup", label: "Routine Checkups", icon: Stethoscope, description: "Regular health maintenance" },
  ];

  const medicalTests = {
    screening: ["Physical Exam", "Blood Work", "ECG", "Vision Test", "Musculoskeletal Assessment", "Medical History Review"],
    fitness: ["VO2 Max", "Strength Testing", "Flexibility Assessment", "Body Composition", "Agility Tests"],
    cardiac: ["ECG", "Echocardiogram", "Stress Test", "Blood Pressure", "Family History"],
    cognitive: ["ImPACT Test", "Balance Assessment", "Reaction Time", "Memory Tests"],
    vaccination: ["Flu Shot", "Hepatitis B", "Tetanus Update"],
    checkup: ["Vitals Check", "General Assessment", "Injury Follow-up", "Medication Review"],
  };

  const timeSlots = [
    { value: "morning", label: "Morning (8:00 AM - 12:00 PM)" },
    { value: "afternoon", label: "Afternoon (1:00 PM - 5:00 PM)" },
    { value: "evening", label: "Evening (5:00 PM - 8:00 PM)" },
    { value: "custom", label: "Custom Time" },
  ];

  const filteredPlayers = allPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.number.includes(searchQuery);
    const matchesTeam = teamFilter === "all" || player.team === teamFilter;
    return matchesSearch && matchesTeam;
  });

  const availablePlayers = filteredPlayers.filter(p => p.status === "available");
  const totalDuration = calculateTotalDuration();

  function calculateTotalDuration() {
    if (selectedPlayers.length === 0) return 0;
    const groups = Math.ceil(selectedPlayers.length / schedulingData.groupSize);
    const totalMinutes = (groups * schedulingData.duration * schedulingData.groupSize) + 
                        ((groups - 1) * schedulingData.breakBetweenGroups);
    return totalMinutes;
  }

  const handleSelectAll = () => {
    const availablePlayerIds = availablePlayers.map(p => p.id);
    setSelectedPlayers(availablePlayerIds);
  };

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const handleSchedule = async () => {
    try {
      // Calculate appointment slots for each group
      const groups = [];
      const playersPerGroup = schedulingData.groupSize;
      
      for (let i = 0; i < selectedPlayers.length; i += playersPerGroup) {
        groups.push(selectedPlayers.slice(i, i + playersPerGroup));
      }

      // Create events for each group
      let currentStartTime = new Date(schedulingData.startDate);
      
      for (const [index, group] of groups.entries()) {
        const endTime = new Date(currentStartTime);
        endTime.setMinutes(endTime.getMinutes() + schedulingData.duration * group.length);

        await createEvent({
          title: `${schedulingData.title} - Group ${index + 1}`,
          type: EventType.MEDICAL,
          startTime: currentStartTime.toISOString(),
          endTime: endTime.toISOString(),
          organizationId: 'org-1',
          createdBy: 'system',
          location: schedulingData.location,
          description: schedulingData.notes,
          metadata: {
            subtype: schedulingData.type,
            bulkScheduling: true,
            groupNumber: index + 1,
            totalGroups: groups.length,
            players: group,
            tests: schedulingData.tests,
            staff: schedulingData.staff,
          },
          visibility: EventVisibility.ROLE_BASED,
        }).unwrap();

        // Add break time between groups
        currentStartTime = new Date(endTime);
        currentStartTime.setMinutes(currentStartTime.getMinutes() + schedulingData.breakBetweenGroups);
      }

      onClose();
    } catch (error) {
      console.error('Failed to create bulk medical events:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Activity Type</h3>
            <RadioGroup
              value={schedulingData.type}
              onValueChange={(value) => setSchedulingData({...schedulingData, type: value})}
            >
              <div className="grid grid-cols-2 gap-3">
                {bulkActivityTypes.map(type => (
                  <Card 
                    key={type.value} 
                    className={cn(
                      "cursor-pointer transition-colors",
                      schedulingData.type === type.value && "ring-2 ring-primary"
                    )}
                    onClick={() => setSchedulingData({...schedulingData, type: type.value})}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={type.value} id={type.value} />
                        <div className="flex-1">
                          <Label htmlFor={type.value} className="flex items-center gap-2 cursor-pointer">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Players</h3>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="U20">U20</SelectItem>
                  <SelectItem value="U18">U18</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSelectAll}>
                Select All Available
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>{selectedPlayers.length} players selected</span>
              <span className="text-muted-foreground">
                {availablePlayers.length} available, {filteredPlayers.length - availablePlayers.length} unavailable
              </span>
            </div>

            <ScrollArea className="h-80 border rounded-lg p-4">
              <div className="space-y-2">
                {filteredPlayers.map(player => (
                  <Card 
                    key={player.id} 
                    className={cn(
                      "p-3 cursor-pointer transition-colors",
                      selectedPlayers.includes(player.id) && "bg-accent",
                      player.status !== "available" && "opacity-50"
                    )}
                    onClick={() => player.status === "available" && handlePlayerToggle(player.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedPlayers.includes(player.id)}
                          disabled={player.status !== "available"}
                        />
                        <div>
                          <p className="font-medium">
                            {player.name} <span className="text-muted-foreground">#{player.number}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {player.position} • {player.team} • Last: {player.lastMedical}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {player.medicalFlags.map((flag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {flag}
                          </Badge>
                        ))}
                        {player.status === "injured" && (
                          <Badge variant="destructive" className="text-xs">Injured</Badge>
                        )}
                        {player.status === "limited" && (
                          <Badge variant="default" className="text-xs">Limited</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Schedule Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input
                  value={schedulingData.title}
                  onChange={(e) => setSchedulingData({...schedulingData, title: e.target.value})}
                  placeholder="e.g., Pre-Season Medical Screening 2024"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={schedulingData.location}
                  onValueChange={(value) => setSchedulingData({...schedulingData, location: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medical Center">Medical Center - All Rooms</SelectItem>
                    <SelectItem value="Testing Lab">Testing Lab</SelectItem>
                    <SelectItem value="Training Facility">Training Facility</SelectItem>
                    <SelectItem value="External Hospital">External - Hospital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <ShadButton
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !schedulingData.startDate && "text-muted-foreground"
                      )}
                    >
                      <DateIcon className="mr-2 h-4 w-4" />
                      {schedulingData.startDate ? format(schedulingData.startDate, "PPP") : <span>Pick a date</span>}
                    </ShadButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    {/* You can replace with your Calendar component if present */}
                    <div className="p-3">
                      <input type="date" className="border rounded p-2"
                        value={format(schedulingData.startDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSchedulingData({ ...schedulingData, startDate: new Date(e.target.value) })}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Time Slot</Label>
                <Select
                  value={schedulingData.timeSlot}
                  onValueChange={(value) => setSchedulingData({...schedulingData, timeSlot: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Minutes per Player</Label>
                <Input
                  type="number"
                  value={schedulingData.duration}
                  onChange={(e) => setSchedulingData({...schedulingData, duration: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Players per Group</Label>
                <Input
                  type="number"
                  value={schedulingData.groupSize}
                  onChange={(e) => setSchedulingData({...schedulingData, groupSize: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Break Between Groups</Label>
                <Input
                  type="number"
                  value={schedulingData.breakBetweenGroups}
                  onChange={(e) => setSchedulingData({...schedulingData, breakBetweenGroups: parseInt(e.target.value)})}
                  placeholder="Minutes"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tests/Procedures</Label>
              <div className="space-y-2">
                {medicalTests[schedulingData.type as keyof typeof medicalTests]?.map(test => (
                  <div key={test} className="flex items-center space-x-2">
                    <Checkbox
                      id={test}
                      checked={schedulingData.tests.includes(test)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSchedulingData({...schedulingData, tests: [...schedulingData.tests, test]});
                        } else {
                          setSchedulingData({...schedulingData, tests: schedulingData.tests.filter(t => t !== test)});
                        }
                      }}
                    />
                    <Label htmlFor={test} className="font-normal">{test}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={schedulingData.notes}
                onChange={(e) => setSchedulingData({...schedulingData, notes: e.target.value})}
                placeholder="Special instructions or notes..."
                rows={3}
              />
            </div>

            <Card className="bg-muted">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Players:</span>
                    <span className="font-medium">{selectedPlayers.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Number of Groups:</span>
                    <span className="font-medium">
                      {Math.ceil(selectedPlayers.length / schedulingData.groupSize)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Duration:</span>
                    <span className="font-medium">
                      {Math.floor(totalDuration / 60)}h {totalDuration % 60}min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Medical Scheduling
          </DialogTitle>
          <DialogDescription>
            Schedule medical activities for multiple players at once
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map(step => (
            <div key={step} className="flex items-center flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-medium",
                currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {step}
              </div>
              {step < 3 && (
                <div className={cn(
                  "flex-1 h-1 mx-2",
                  currentStep > step ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </Button>
          {currentStep < 3 ? (
            <Button 
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                (currentStep === 1 && !schedulingData.type) ||
                (currentStep === 2 && selectedPlayers.length === 0)
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSchedule}
              disabled={!schedulingData.title || !schedulingData.location}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule {selectedPlayers.length} Players
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}