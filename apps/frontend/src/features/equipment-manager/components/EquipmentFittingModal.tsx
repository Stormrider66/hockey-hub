"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateCalendarEventMutation } from "@/store/api/calendarApi";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, Clock, Users, ShirtIcon, 
  Package, AlertCircle, Search, ChevronRight,
  Ruler, Weight, FileText, MapPin, User
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface EquipmentFittingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialEndDate?: Date;
  template?: any;
}

interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
  currentSizes?: {
    jersey?: string;
    pants?: string;
    helmet?: string;
    skates?: string;
    gloves?: string;
  };
}

export function EquipmentFittingModal({
  isOpen,
  onClose,
  initialDate,
  initialEndDate,
  template
}: EquipmentFittingModalProps) {
  const [createEvent] = useCreateCalendarEventMutation();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [eventType, setEventType] = useState<string>("individual");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(initialDate || new Date());
  const [startTime, setStartTime] = useState(initialDate ? format(initialDate, "HH:mm") : "14:00");
  const [endTime, setEndTime] = useState(initialEndDate ? format(initialEndDate, "HH:mm") : "15:00");
  const [location, setLocation] = useState("Equipment Room");
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [measurements, setMeasurements] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");

  // Mock data - would come from API
  const players: Player[] = [
    { 
      id: "1", 
      name: "Marcus Lindberg", 
      number: "23", 
      position: "Forward",
      currentSizes: { jersey: "L", pants: "M", helmet: "L", skates: "10.5", gloves: "14" }
    },
    { 
      id: "2", 
      name: "Erik Andersson", 
      number: "15", 
      position: "Defense",
      currentSizes: { jersey: "XL", pants: "L", helmet: "XL", skates: "11", gloves: "15" }
    },
    { 
      id: "3", 
      name: "Viktor Olsson", 
      number: "30", 
      position: "Goalie",
      currentSizes: { jersey: "XL", pants: "L", helmet: "L", skates: "10", gloves: "SR" }
    },
    { 
      id: "4", 
      name: "Johan Nilsson", 
      number: "8", 
      position: "Forward",
      currentSizes: { jersey: "M", pants: "M", helmet: "M", skates: "9.5", gloves: "14" }
    }
  ];

  const teams = [
    { id: "senior", name: "Senior Team" },
    { id: "junior", name: "Junior A" },
    { id: "u16", name: "U16 Boys" }
  ];

  const equipmentOptions = [
    { id: "jerseys", label: "Jerseys", icon: ShirtIcon },
    { id: "pants", label: "Pants", icon: Package },
    { id: "helmets", label: "Helmets", icon: Package },
    { id: "skates", label: "Skates", icon: Package },
    { id: "gloves", label: "Gloves", icon: Package },
    { id: "sticks", label: "Sticks", icon: Package },
    { id: "protective", label: "Protective Gear", icon: Package },
    { id: "goalie", label: "Goalie Equipment", icon: Package }
  ];

  const locationOptions = [
    "Equipment Room",
    "Main Rink",
    "Practice Rink",
    "Team Locker Room",
    "Conference Room"
  ];

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
    player.number.includes(playerSearch)
  );

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleEquipment = (equipmentId: string) => {
    setEquipmentTypes(prev =>
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const handleSubmit = async () => {
    if (!date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    if (eventType === "individual" && selectedPlayers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one player",
        variant: "destructive",
      });
      return;
    }

    if (eventType === "team" && !selectedTeam) {
      toast({
        title: "Error",
        description: "Please select a team",
        variant: "destructive",
      });
      return;
    }

    if (equipmentTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one equipment type",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const startDateTime = new Date(date);
      const [startHour, startMinute] = startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

      const endDateTime = new Date(date);
      const [endHour, endMinute] = endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

      const participants = eventType === "individual" 
        ? selectedPlayers.map(id => ({ userId: id, status: 'invited' as const }))
        : [];

      const selectedEquipmentLabels = equipmentOptions
        .filter(eq => equipmentTypes.includes(eq.id))
        .map(eq => eq.label)
        .join(", ");

      await createEvent({
        title: eventType === "individual" 
          ? `Equipment Fitting - ${players.find(p => selectedPlayers.includes(p.id))?.name}${selectedPlayers.length > 1 ? ` +${selectedPlayers.length - 1}` : ''}`
          : `Team Equipment Fitting - ${teams.find(t => t.id === selectedTeam)?.name}`,
        description: `Equipment fitting session for: ${selectedEquipmentLabels}${notes ? `\n\nNotes: ${notes}` : ''}`,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location,
        type: 'equipment',
        participants,
        metadata: {
          subtype: 'fitting',
          eventType,
          teamId: eventType === "team" ? selectedTeam : undefined,
          equipmentTypes,
          requiresMeasurements: measurements
        }
      }).unwrap();

      toast({
        title: "Success",
        description: "Equipment fitting scheduled successfully",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule equipment fitting",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShirtIcon className="h-5 w-5" />
            Schedule Equipment Fitting
          </DialogTitle>
          <DialogDescription>
            Schedule equipment fitting sessions for individual players or entire teams
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 pr-4">
            {/* Event Type Selection */}
            <div className="space-y-3">
              <Label>Fitting Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={eventType === "individual" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setEventType("individual")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Individual Players
                </Button>
                <Button
                  type="button"
                  variant={eventType === "team" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setEventType("team")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Entire Team
                </Button>
              </div>
            </div>

            {/* Player/Team Selection */}
            {eventType === "individual" ? (
              <div className="space-y-3">
                <Label>Select Players</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search players by name or number..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <ScrollArea className="h-48 border rounded-md p-3">
                  <div className="space-y-2">
                    {filteredPlayers.map(player => (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                          selectedPlayers.includes(player.id) 
                            ? "bg-primary/10 border border-primary" 
                            : "hover:bg-muted"
                        )}
                        onClick={() => togglePlayer(player.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedPlayers.includes(player.id)}
                            onCheckedChange={() => togglePlayer(player.id)}
                          />
                          <div>
                            <p className="font-medium">
                              #{player.number} {player.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {player.position} • Current sizes: J-{player.currentSizes?.jersey}, 
                              S-{player.currentSizes?.skates}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {selectedPlayers.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedPlayers.length} player(s) selected
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="team">Select Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Equipment Types */}
            <div className="space-y-3">
              <Label>Equipment Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {equipmentOptions.map(option => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                      equipmentTypes.includes(option.id)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleEquipment(option.id)}
                  >
                    <Checkbox
                      checked={equipmentTypes.includes(option.id)}
                      onCheckedChange={() => toggleEquipment(option.id)}
                    />
                    <option.icon className="h-4 w-4" />
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map(loc => (
                    <SelectItem key={loc} value={loc}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {loc}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="measurements"
                  checked={measurements}
                  onCheckedChange={(checked) => setMeasurements(checked as boolean)}
                />
                <label
                  htmlFor="measurements"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Take new measurements during fitting
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule Fitting
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}