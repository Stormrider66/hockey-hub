import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Users,
  Car,
  MessageSquare,
  HandHelpingIcon,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

interface Child {
  id: string;
  name: string;
  team: string;
  jersey: string;
}

interface Event {
  id: string;
  title: string;
  start: Date;
  eventType: string;
  location?: string;
  childId: string;
  childName: string;
  rsvpStatus: 'accepted' | 'declined' | 'maybe' | 'pending';
  requiresVolunteer?: boolean;
  volunteerNeeded?: string;
}

interface ParentQuickActionsProps {
  onClose: () => void;
  children: Child[];
  pendingEvents: Event[];
}

const ParentQuickActions: React.FC<ParentQuickActionsProps> = ({
  onClose,
  children,
  pendingEvents,
}) => {
  const [activeTab, setActiveTab] = useState('rsvp');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [bulkResponse, setBulkResponse] = useState<'accept' | 'decline' | 'maybe'>('accept');
  const [responseNotes, setResponseNotes] = useState('');
  const [volunteerSignups, setVolunteerSignups] = useState<Record<string, boolean>>({});

  // Group events by child
  const eventsByChild = pendingEvents.reduce((acc, event) => {
    if (!acc[event.childId]) {
      acc[event.childId] = [];
    }
    acc[event.childId].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Get events that need volunteers
  const volunteerEvents = pendingEvents.filter(e => e.requiresVolunteer);

  const handleSelectAll = (childId: string) => {
    const childEvents = eventsByChild[childId] || [];
    const childEventIds = childEvents.map(e => e.id);
    const allSelected = childEventIds.every(id => selectedEvents.includes(id));
    
    if (allSelected) {
      setSelectedEvents(selectedEvents.filter(id => !childEventIds.includes(id)));
    } else {
      setSelectedEvents([...new Set([...selectedEvents, ...childEventIds])]);
    }
  };

  const handleBulkRSVP = () => {
    // In real app, would call API to update RSVPs
    console.log('Bulk RSVP:', {
      events: selectedEvents,
      response: bulkResponse,
      notes: responseNotes,
    });
    onClose();
  };

  const handleVolunteerSignup = () => {
    const signedUpEvents = Object.entries(volunteerSignups)
      .filter(([_, signed]) => signed)
      .map(([eventId]) => eventId);
    
    // In real app, would call API to sign up for volunteer positions
    console.log('Volunteer signups:', signedUpEvents);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Quick Actions</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mx-6">
            <TabsTrigger value="rsvp" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Bulk RSVP
              {pendingEvents.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingEvents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="volunteer" className="flex items-center gap-2">
              <HandHelpingIcon className="h-4 w-4" />
              Volunteer Signup
              {volunteerEvents.length > 0 && (
                <Badge className="ml-1">{volunteerEvents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="absence" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Report Absence
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] px-6">
            <TabsContent value="rsvp" className="space-y-4">
              {pendingEvents.length === 0 ? (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    All RSVPs are up to date! No pending responses.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {Object.entries(eventsByChild).map(([childId, events]) => {
                    const child = children.find(c => c.id === childId);
                    const childEventIds = events.map(e => e.id);
                    const allSelected = childEventIds.every(id => selectedEvents.includes(id));
                    
                    return (
                      <Card key={childId}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              {child?.name}
                              <Badge variant="outline">{child?.team}</Badge>
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectAll(childId)}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {events.map(event => (
                            <div
                              key={event.id}
                              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent"
                            >
                              <Checkbox
                                checked={selectedEvents.includes(event.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEvents([...selectedEvents, event.id]);
                                  } else {
                                    setSelectedEvents(selectedEvents.filter(id => id !== event.id));
                                  }
                                }}
                              />
                              <div className="flex-1 space-y-1">
                                <div className="font-medium">{event.title}</div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(event.start, 'MMM d')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(event.start, 'h:mm a')}
                                  </span>
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {event.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge
                                variant={event.eventType === 'game' ? 'default' : 'secondary'}
                              >
                                {event.eventType}
                              </Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {selectedEvents.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Response for {selectedEvents.length} events
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <RadioGroup value={bulkResponse} onValueChange={(value: any) => setBulkResponse(value)}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="accept" id="accept" />
                            <Label htmlFor="accept" className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              Accept All
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="maybe" id="maybe" />
                            <Label htmlFor="maybe" className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              Maybe
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="decline" id="decline" />
                            <Label htmlFor="decline" className="flex items-center gap-2">
                              <X className="h-4 w-4 text-red-600" />
                              Decline All
                            </Label>
                          </div>
                        </RadioGroup>

                        <div className="space-y-2">
                          <Label>Additional Notes (Optional)</Label>
                          <Textarea
                            placeholder="Add any notes about availability, transportation needs, etc."
                            value={responseNotes}
                            onChange={(e) => setResponseNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="volunteer" className="space-y-4">
              {volunteerEvents.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No events currently need volunteers.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      These events need parent volunteers. Your help is greatly appreciated!
                    </AlertDescription>
                  </Alert>

                  {volunteerEvents.map(event => (
                    <Card key={event.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{event.title}</CardTitle>
                          <Badge>{event.volunteerNeeded}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(event.start, 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(event.start, 'h:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.childName}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                          <div>
                            <p className="font-medium">Volunteer for {event.volunteerNeeded}</p>
                            <p className="text-sm text-muted-foreground">
                              Help needed for this {event.eventType}
                            </p>
                          </div>
                          <Checkbox
                            checked={volunteerSignups[event.id] || false}
                            onCheckedChange={(checked) => {
                              setVolunteerSignups({
                                ...volunteerSignups,
                                [event.id]: checked as boolean,
                              });
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="absence" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Absence Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      For detailed absence reporting, please use the Absences tab in your dashboard.
                      This quick action will notify coaches of immediate absences.
                    </AlertDescription>
                  </Alert>
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Navigate to absences tab
                        onClose();
                      }}
                    >
                      Go to Absences Tab
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {activeTab === 'rsvp' && selectedEvents.length > 0 && (
            <Button onClick={handleBulkRSVP}>
              Submit {selectedEvents.length} RSVPs
            </Button>
          )}
          {activeTab === 'volunteer' && Object.values(volunteerSignups).some(v => v) && (
            <Button onClick={handleVolunteerSignup}>
              Sign Up for {Object.values(volunteerSignups).filter(v => v).length} Events
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ParentQuickActions;