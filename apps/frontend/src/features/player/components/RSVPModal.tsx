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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle, XCircle, AlertCircle, Clock, Users, 
  Calendar, MapPin, User, MessageSquare, ChevronRight,
  Trophy, Dumbbell, Heart, Briefcase, Star
} from "lucide-react";
import { format, differenceInDays, addHours } from "date-fns";

interface RSVPModalProps {
  onClose: () => void;
  event?: any;
  pendingEvents?: any[];
}

export function RSVPModal({ onClose, event, pendingEvents = [] }: RSVPModalProps) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, { 
    status: 'accepted' | 'declined' | 'tentative', 
    note?: string 
  }>>({});

  // If single event provided, use it; otherwise use pending events list
  const eventsToRespond = event ? [event] : pendingEvents;
  const currentEvent = eventsToRespond[currentEventIndex];
  const hasNext = currentEventIndex < eventsToRespond.length - 1;
  const hasPrevious = currentEventIndex > 0;

  const handleResponse = (eventId: string, status: 'accepted' | 'declined' | 'tentative', note?: string) => {
    setResponses(prev => ({
      ...prev,
      [eventId]: { status, note }
    }));
  };

  const handleSubmit = async () => {
    // Submit all responses
    console.log('Submitting RSVP responses:', responses);
    
    // API call would go here
    // await submitRSVPResponses(responses);
    
    onClose();
  };

  const handleNext = () => {
    if (hasNext) {
      setCurrentEventIndex(currentEventIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentEventIndex(currentEventIndex - 1);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'game': return Trophy;
      case 'training': return Dumbbell;
      case 'medical': return Heart;
      case 'meeting': return Briefcase;
      default: return Calendar;
    }
  };

  if (!currentEvent) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Pending RSVPs</DialogTitle>
          </DialogHeader>
          <p className="text-center py-8 text-muted-foreground">
            You're all caught up! No events require your response.
          </p>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const daysUntilEvent = differenceInDays(new Date(currentEvent.start), new Date());
  const isUrgent = daysUntilEvent <= 2;
  const currentResponse = responses[currentEvent.id];
  const EventIcon = getEventIcon(currentEvent.type);

  // Check for conflicts
  const hasConflict = eventsToRespond.some(e => 
    e.id !== currentEvent.id && 
    new Date(e.start) < new Date(currentEvent.end) && 
    new Date(e.end) > new Date(currentEvent.start)
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl">Event RSVP</DialogTitle>
              {eventsToRespond.length > 1 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Responding to {currentEventIndex + 1} of {eventsToRespond.length} events
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {isUrgent && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Urgent
                </Badge>
              )}
              {currentEvent.mandatory && (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3" />
                  Mandatory
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Event Details */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    currentEvent.type === 'game' ? 'bg-green-100 text-green-600' :
                    currentEvent.type === 'training' ? 'bg-blue-100 text-blue-600' :
                    currentEvent.type === 'medical' ? 'bg-red-100 text-red-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    <EventIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{currentEvent.title}</h3>
                    <Badge variant="secondary" className="mt-1 capitalize">
                      {currentEvent.type}
                    </Badge>
                    
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(currentEvent.start), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(currentEvent.start), "h:mm a")} - 
                          {format(new Date(currentEvent.end), "h:mm a")}
                          <span className="text-muted-foreground ml-2">
                            ({Math.round((new Date(currentEvent.end).getTime() - new Date(currentEvent.start).getTime()) / (1000 * 60))} min)
                          </span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{currentEvent.location || "TBD"}</span>
                      </div>
                      
                      {currentEvent.metadata?.organizer && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Organized by {currentEvent.metadata.organizer}</span>
                        </div>
                      )}

                      {currentEvent.participants && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {currentEvent.participants.filter((p: any) => p.status === 'accepted').length} confirmed, 
                            {' '}{currentEvent.participants.filter((p: any) => p.status === 'pending').length} pending
                          </span>
                        </div>
                      )}
                    </div>

                    {currentEvent.description && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">{currentEvent.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conflict Warning */}
            {hasConflict && (
              <Card className="border-amber-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900">Schedule Conflict Detected</p>
                      <p className="text-amber-800 mt-1">
                        This event conflicts with another event in your calendar. 
                        Please review your schedule before confirming.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Important Notes */}
            {currentEvent.type === 'game' && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Game Day Information</p>
                      <ul className="mt-1 space-y-1 text-blue-800">
                        <li>• Arrival time: {format(addHours(new Date(currentEvent.start), -1.5), "h:mm a")}</li>
                        <li>• Warm-up starts: {format(addHours(new Date(currentEvent.start), -0.5), "h:mm a")}</li>
                        <li>• Bring both home and away jerseys</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Response Section */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-4">Your Response</h4>
                <RadioGroup 
                  value={currentResponse?.status || ''} 
                  onValueChange={(value: any) => handleResponse(currentEvent.id, value)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                      <RadioGroupItem value="accepted" id="accept" />
                      <Label htmlFor="accept" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Accept</span>
                          <span className="text-sm text-muted-foreground">- I will attend</span>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                      <RadioGroupItem value="tentative" id="tentative" />
                      <Label htmlFor="tentative" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="font-medium">Maybe</span>
                          <span className="text-sm text-muted-foreground">- Not sure yet</span>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                      <RadioGroupItem value="declined" id="decline" />
                      <Label htmlFor="decline" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium">Decline</span>
                          <span className="text-sm text-muted-foreground">- I cannot attend</span>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {currentResponse?.status && (
                  <div className="mt-4">
                    <Label htmlFor="note" className="text-sm">
                      Add a note (optional)
                    </Label>
                    <Textarea
                      id="note"
                      placeholder={
                        currentResponse.status === 'declined' 
                          ? "Let the organizer know why you can't attend..."
                          : "Any additional information..."
                      }
                      value={currentResponse.note || ''}
                      onChange={(e) => handleResponse(
                        currentEvent.id, 
                        currentResponse.status, 
                        e.target.value
                      )}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Impact for Games */}
            {currentEvent.type === 'game' && currentResponse?.status === 'declined' && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-900">Impact on Team</p>
                      <p className="text-red-800 mt-1">
                        Missing this game may affect team lineup and strategy. 
                        Please provide a reason to help coaches plan accordingly.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {eventsToRespond.length > 1 && (
              <>
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={!hasNext}
                >
                  Next
                </Button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {eventsToRespond.length === 1 ? (
              <Button 
                onClick={handleSubmit}
                disabled={!currentResponse}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Response
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={Object.keys(responses).length !== eventsToRespond.length}
              >
                Submit All ({Object.keys(responses).length}/{eventsToRespond.length})
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}