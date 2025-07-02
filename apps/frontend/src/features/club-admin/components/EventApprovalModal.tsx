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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle, XCircle, AlertCircle, Clock, Users, 
  Calendar, MapPin, DollarSign, FileText, User,
  MessageSquare, ChevronRight, AlertTriangle
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface EventApprovalModalProps {
  onClose: () => void;
  pendingEvents: any[];
  selectedEvent?: any;
}

export function EventApprovalModal({ 
  onClose, 
  pendingEvents, 
  selectedEvent 
}: EventApprovalModalProps) {
  const [currentEventIndex, setCurrentEventIndex] = useState(
    selectedEvent ? pendingEvents.findIndex(e => e.id === selectedEvent.id) : 0
  );
  const [decision, setDecision] = useState<'approve' | 'reject' | 'pending'>('pending');
  const [notes, setNotes] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);

  const currentEvent = pendingEvents[currentEventIndex];
  const hasNext = currentEventIndex < pendingEvents.length - 1;
  const hasPrevious = currentEventIndex > 0;

  // Mock conflict check - would come from API
  const conflicts = currentEvent?.metadata?.conflicts || [
    {
      type: 'facility',
      severity: 'medium',
      description: 'Main rink booked for Senior Team practice',
      alternatives: ['Practice Rink available', 'Reschedule to 8pm slot']
    }
  ];

  const handleApprove = () => {
    // API call to approve event
    console.log('Approving event:', currentEvent.id, { notes, conditions });
    
    if (hasNext) {
      setCurrentEventIndex(currentEventIndex + 1);
      setDecision('pending');
      setNotes('');
      setConditions([]);
    } else {
      onClose();
    }
  };

  const handleReject = () => {
    // API call to reject event
    console.log('Rejecting event:', currentEvent.id, { notes });
    
    if (hasNext) {
      setCurrentEventIndex(currentEventIndex + 1);
      setDecision('pending');
      setNotes('');
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    if (hasNext) {
      setCurrentEventIndex(currentEventIndex + 1);
      setDecision('pending');
      setNotes('');
      setConditions([]);
    }
  };

  if (!currentEvent) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Pending Events</DialogTitle>
          </DialogHeader>
          <p className="text-center py-8 text-muted-foreground">
            All events have been reviewed!
          </p>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const daysUntilEvent = differenceInDays(new Date(currentEvent.start), new Date());
  const isUrgent = daysUntilEvent <= 3;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl">Event Approval</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Reviewing {currentEventIndex + 1} of {pendingEvents.length} pending events
              </p>
            </div>
            <div className="flex gap-2">
              {isUrgent && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Urgent
                </Badge>
              )}
              <Badge variant="outline">
                {daysUntilEvent} days until event
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Event Details Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{currentEvent.title}</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(currentEvent.start), "MMM d, yyyy")}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(currentEvent.start), "h:mm a")} - 
                          {format(new Date(currentEvent.end), "h:mm a")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{currentEvent.location || "Main Facility"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{currentEvent.metadata?.expectedAttendance || "50"} expected</span>
                      </div>

                      {currentEvent.metadata?.cost && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Estimated cost: ${currentEvent.metadata.cost}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Requested by</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{currentEvent.metadata?.requestedBy || "Coach Johnson"}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">Event Type</p>
                      <Badge>{currentEvent.type}</Badge>
                    </div>

                    {currentEvent.description && (
                      <div>
                        <p className="text-sm font-medium mb-1">Description</p>
                        <p className="text-sm text-muted-foreground">
                          {currentEvent.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conflicts & Issues */}
            {conflicts.length > 0 && (
              <Card className="border-amber-200">
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Potential Conflicts
                  </h4>
                  <div className="space-y-2">
                    {conflicts.map((conflict: any, idx: number) => (
                      <div key={idx} className="text-sm space-y-1">
                        <p className="font-medium">{conflict.description}</p>
                        {conflict.alternatives && (
                          <p className="text-muted-foreground pl-4">
                            Alternatives: {conflict.alternatives.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Decision Section */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-3">Decision</h4>
                <RadioGroup value={decision} onValueChange={(v: any) => setDecision(v)}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                      <RadioGroupItem value="approve" id="approve" />
                      <Label htmlFor="approve" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Approve Event</span>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                      <RadioGroupItem value="reject" id="reject" />
                      <Label htmlFor="reject" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium">Reject Event</span>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {decision === 'approve' && conflicts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Approval Conditions (optional)</p>
                    <div className="space-y-2">
                      {['Must use alternative facility', 'Reduce attendee limit', 'Adjust time slot'].map((condition) => (
                        <label key={condition} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={conditions.includes(condition)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConditions([...conditions, condition]);
                              } else {
                                setConditions(conditions.filter(c => c !== condition));
                              }
                            }}
                          />
                          {condition}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes (will be sent to requester)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes or feedback..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentEventIndex(currentEventIndex - 1)}
              disabled={!hasPrevious}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={!hasNext}
            >
              Skip
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {decision === 'approve' && (
              <Button onClick={handleApprove} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Approve {hasNext && `& Next`}
              </Button>
            )}
            {decision === 'reject' && (
              <Button onClick={handleReject} variant="destructive" className="gap-2">
                <XCircle className="h-4 w-4" />
                Reject {hasNext && `& Next`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}