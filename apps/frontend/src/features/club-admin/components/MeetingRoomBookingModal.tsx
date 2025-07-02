"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Briefcase, Users, Clock, Calendar, MapPin,
  Monitor, Wifi, Coffee, Phone, AlertCircle,
  CheckCircle, Video, Presentation
} from "lucide-react";
import { format, addMinutes } from "date-fns";

interface MeetingRoomBookingModalProps {
  onClose: () => void;
  selectedSlot: { start: Date; end: Date };
}

export function MeetingRoomBookingModal({ onClose, selectedSlot }: MeetingRoomBookingModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    roomId: '',
    duration: '60',
    attendees: '',
    type: 'internal',
    setupTime: '0',
    requirements: [] as string[],
    refreshments: false,
    videoConference: false,
    notes: ''
  });

  // Mock room data - would come from API
  const rooms = [
    {
      id: 'conf-a',
      name: 'Conference Room A',
      capacity: 20,
      features: ['projector', 'whiteboard', 'video', 'phone'],
      available: true,
      floor: '2nd Floor',
      rate: 0
    },
    {
      id: 'conf-b',
      name: 'Conference Room B',
      capacity: 10,
      features: ['tv', 'whiteboard', 'phone'],
      available: true,
      floor: '2nd Floor',
      rate: 0
    },
    {
      id: 'boardroom',
      name: 'Executive Boardroom',
      capacity: 30,
      features: ['projector', 'video', 'phone', 'catering'],
      available: false,
      conflictWith: 'Board Meeting',
      floor: '3rd Floor',
      rate: 0
    },
    {
      id: 'training',
      name: 'Training Room',
      capacity: 40,
      features: ['projector', 'sound', 'recording'],
      available: true,
      floor: '1st Floor',
      rate: 50
    }
  ];

  const handleSubmit = () => {
    console.log('Booking meeting room:', formData);
    onClose();
  };

  const selectedRoom = rooms.find(r => r.id === formData.roomId);
  const endTime = addMinutes(selectedSlot.start, parseInt(formData.duration) + parseInt(formData.setupTime));

  const featureIcons: Record<string, React.ElementType> = {
    projector: Monitor,
    whiteboard: Presentation,
    video: Video,
    phone: Phone,
    tv: Monitor,
    catering: Coffee,
    sound: Users,
    recording: Video
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book Meeting Room</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(selectedSlot.start, "EEEE, MMMM d, yyyy")} at {format(selectedSlot.start, "h:mm a")}
          </p>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Meeting Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Meeting Title*</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Board Meeting, Team Planning Session"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Meeting Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger id="type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal Meeting</SelectItem>
                    <SelectItem value="board">Board Meeting</SelectItem>
                    <SelectItem value="committee">Committee Meeting</SelectItem>
                    <SelectItem value="external">External/Client Meeting</SelectItem>
                    <SelectItem value="training">Training Session</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="attendees">Expected Attendees*</Label>
                <Input
                  id="attendees"
                  type="number"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  placeholder="Number of attendees"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select 
                  value={formData.duration} 
                  onValueChange={(v) => setFormData({ ...formData, duration: v })}
                >
                  <SelectTrigger id="duration" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="480">Full day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="setup">Setup Time</Label>
                <Select 
                  value={formData.setupTime} 
                  onValueChange={(v) => setFormData({ ...formData, setupTime: v })}
                >
                  <SelectTrigger id="setup" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No setup needed</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <Label>Select Room*</Label>
            <RadioGroup 
              value={formData.roomId} 
              onValueChange={(v) => setFormData({ ...formData, roomId: v })}
              className="mt-2"
            >
              <div className="grid gap-3">
                {rooms.map((room) => (
                  <Card 
                    key={room.id} 
                    className={`cursor-pointer transition-colors ${
                      formData.roomId === room.id ? 'ring-2 ring-primary' : ''
                    } ${!room.available ? 'opacity-60' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem 
                          value={room.id} 
                          id={room.id}
                          disabled={!room.available}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <Label htmlFor={room.id} className="font-medium cursor-pointer">
                                {room.name}
                              </Label>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {room.floor}
                                <span>•</span>
                                <Users className="h-3 w-3" />
                                Capacity: {room.capacity}
                                {room.rate > 0 && (
                                  <>
                                    <span>•</span>
                                    ${room.rate}/hour
                                  </>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {room.features.map((feature) => {
                                  const Icon = featureIcons[feature] || Briefcase;
                                  return (
                                    <Badge key={feature} variant="secondary" className="text-xs">
                                      <Icon className="h-3 w-3 mr-1" />
                                      {feature}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              {room.available ? (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Available
                                </Badge>
                              ) : (
                                <div className="text-right">
                                  <Badge variant="outline" className="text-red-600">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Booked
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {room.conflictWith}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Additional Requirements */}
          <div>
            <Label>Additional Requirements</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="refreshments"
                  checked={formData.refreshments}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, refreshments: checked as boolean })
                  }
                />
                <Label htmlFor="refreshments" className="text-sm font-normal cursor-pointer">
                  Refreshments needed (coffee, water, snacks)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="video"
                  checked={formData.videoConference}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, videoConference: checked as boolean })
                  }
                />
                <Label htmlFor="video" className="text-sm font-normal cursor-pointer">
                  Video conference setup required
                </Label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requirements or notes..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Booking Summary */}
          {formData.roomId && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room:</span>
                    <span>{selectedRoom?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(selectedSlot.start, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span>
                      {format(selectedSlot.start, "h:mm a")} - {format(endTime, "h:mm a")}
                    </span>
                  </div>
                  {selectedRoom && selectedRoom.rate > 0 && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="font-medium">
                        ${(selectedRoom.rate * parseInt(formData.duration) / 60).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.title || !formData.roomId || !formData.attendees}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}