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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Users,
  Phone,
  MessageSquare,
  AlertCircle,
  UserPlus,
  Navigation,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  start: Date;
  location?: string;
  childId: string;
  childName: string;
  transportation?: {
    needed: boolean;
    driver?: string;
    seats?: number;
  };
}

interface Child {
  id: string;
  name: string;
  team: string;
}

interface Carpool {
  id: string;
  eventId: string;
  driver: {
    name: string;
    phone: string;
    avatar?: string;
  };
  availableSeats: number;
  passengers: string[];
  meetingPoint?: string;
  departureTime?: Date;
  notes?: string;
}

interface TransportationCoordinationProps {
  onClose: () => void;
  events: Event[];
  children: Child[];
}

// Mock carpool data
const mockCarpools: Carpool[] = [
  {
    id: '1',
    eventId: '1',
    driver: {
      name: 'Sarah Miller',
      phone: '(555) 123-4567',
    },
    availableSeats: 2,
    passengers: ['Tommy Smith'],
    meetingPoint: 'Arena Parking Lot - North Entrance',
    departureTime: new Date(Date.now() + 3600000),
    notes: 'Blue Honda Pilot',
  },
];

const TransportationCoordination: React.FC<TransportationCoordinationProps> = ({
  onClose,
  events,
  children,
}) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [offerMode, setOfferMode] = useState<'offer' | 'request'>('offer');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [seats, setSeats] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [transportNotes, setTransportNotes] = useState('');

  // Filter events that need transportation
  const eventsNeedingTransport = events.filter(e => e.transportation?.needed);
  const upcomingEvents = eventsNeedingTransport.filter(
    e => e.start > new Date() && e.start < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  const handleSubmitTransportation = () => {
    // In real app, would call API to save transportation offer/request
    console.log('Transportation:', {
      mode: offerMode,
      event: selectedEvent,
      seats,
      meetingPoint,
      notes: transportNotes,
    });
    onClose();
  };

  const getCarpoolsForEvent = (eventId: string) => {
    return mockCarpools.filter(c => c.eventId === eventId);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Transportation Coordination
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mx-6">
            <TabsTrigger value="upcoming">
              Upcoming Events
              {upcomingEvents.length > 0 && (
                <Badge className="ml-2">{upcomingEvents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="arrange">Arrange Transportation</TabsTrigger>
            <TabsTrigger value="carpools">Active Carpools</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[450px] px-6">
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No upcoming events need transportation arrangements.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      These events are within the next 7 days and may need transportation arrangements.
                    </AlertDescription>
                  </Alert>

                  {upcomingEvents.map(event => {
                    const carpools = getCarpoolsForEvent(event.id);
                    const totalSeats = carpools.reduce((sum, c) => sum + c.availableSeats, 0);
                    
                    return (
                      <Card key={event.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              {event.title}
                              <Badge variant="outline">{event.childName}</Badge>
                            </CardTitle>
                            {event.transportation?.driver === 'You' ? (
                              <Badge variant="default" className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                You're Driving
                              </Badge>
                            ) : totalSeats > 0 ? (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {totalSeats} Seats Available
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Needs Transport
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(event.start, 'MMM d, yyyy')}
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

                          {carpools.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Available Carpools:</p>
                              {carpools.map(carpool => (
                                <div key={carpool.id} className="p-3 bg-accent rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={carpool.driver.avatar} />
                                        <AvatarFallback>
                                          {carpool.driver.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-sm">{carpool.driver.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {carpool.availableSeats} seats • {carpool.passengers.length} passengers
                                        </p>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                      <Phone className="h-3 w-3 mr-2" />
                                      Contact
                                    </Button>
                                  </div>
                                  {carpool.meetingPoint && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      <MapPin className="h-3 w-3 inline mr-1" />
                                      {carpool.meetingPoint}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEvent(event.id);
                                setActiveTab('arrange');
                              }}
                            >
                              <Car className="h-3 w-3 mr-2" />
                              Offer Ride
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEvent(event.id);
                                setOfferMode('request');
                                setActiveTab('arrange');
                              }}
                            >
                              <Users className="h-3 w-3 mr-2" />
                              Request Ride
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              )}
            </TabsContent>

            <TabsContent value="arrange" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Transportation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={offerMode} onValueChange={(value: any) => setOfferMode(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="offer" id="offer" />
                      <Label htmlFor="offer" className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        I can drive (Offer transportation)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="request" id="request" />
                      <Label htmlFor="request" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Need a ride (Request transportation)
                      </Label>
                    </div>
                  </RadioGroup>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Event</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                    >
                      <option value="">Select an event...</option>
                      {eventsNeedingTransport.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title} - {format(event.start, 'MMM d, h:mm a')} ({event.childName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {offerMode === 'offer' && (
                    <>
                      <div className="space-y-2">
                        <Label>Available Seats</Label>
                        <Input
                          type="number"
                          min="1"
                          max="8"
                          placeholder="Number of available seats"
                          value={seats}
                          onChange={(e) => setSeats(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Meeting Point</Label>
                        <Input
                          placeholder="e.g., Arena parking lot, School entrance"
                          value={meetingPoint}
                          onChange={(e) => setMeetingPoint(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      placeholder={
                        offerMode === 'offer'
                          ? "e.g., Blue Honda Pilot, departing 15 minutes before game time"
                          : "e.g., Can meet at any location, flexible on timing"
                      }
                      value={transportNotes}
                      onChange={(e) => setTransportNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Alert>
                    <Phone className="h-4 w-4" />
                    <AlertDescription>
                      Your contact information will be shared with other parents who accept or offer transportation.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="carpools" className="space-y-4">
              <Alert>
                <Car className="h-4 w-4" />
                <AlertDescription>
                  Your active carpool arrangements and transportation commitments.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">You're Driving</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Tournament Game vs Eagles</h4>
                      <Badge variant="default">Driver</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Saturday, Jan 15 - 8:00 AM
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        3 passengers: Alex Johnson, Tommy Smith, Sarah Chen
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Meeting at Arena North Entrance - 7:30 AM
                      </p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-3 w-3 mr-2" />
                        Message Group
                      </Button>
                      <Button size="sm" variant="outline">
                        <Navigation className="h-3 w-3 mr-2" />
                        Get Directions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Riding With Others</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Practice - West Rink</h4>
                      <Badge variant="secondary">Passenger</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Thursday, Jan 13 - 4:30 PM
                      </p>
                      <p className="flex items-center gap-2">
                        <Car className="h-3 w-3" />
                        Driver: Mike Thompson
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        (555) 987-6543
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="mt-3">
                      <Phone className="h-3 w-3 mr-2" />
                      Contact Driver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {activeTab === 'arrange' && selectedEvent && (
            <Button onClick={handleSubmitTransportation}>
              {offerMode === 'offer' ? 'Offer Transportation' : 'Request Transportation'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransportationCoordination;