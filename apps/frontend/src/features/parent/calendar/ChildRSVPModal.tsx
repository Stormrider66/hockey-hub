import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Car,
  AlertCircle,
  Check,
  X,
  HelpCircle,
  Info,
  Shirt,
} from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  eventType: string;
  location?: string;
  description?: string;
  requiresVolunteer?: boolean;
  volunteerNeeded?: string;
  transportation?: {
    needed: boolean;
    driver?: string;
  };
}

interface ChildRSVPModalProps {
  event: Event;
  onClose: () => void;
  childName: string;
}

const ChildRSVPModal: React.FC<ChildRSVPModalProps> = ({
  event,
  onClose,
  childName,
}) => {
  const [response, setResponse] = useState<'accept' | 'maybe' | 'decline'>('accept');
  const [notes, setNotes] = useState('');
  const [transportationNeeded, setTransportationNeeded] = useState(false);
  const [canVolunteer, setCanVolunteer] = useState(false);

  const handleSubmit = () => {
    // In real app, would call API to save RSVP
    console.log('RSVP submitted:', {
      eventId: event.id,
      response,
      notes,
      transportationNeeded,
      canVolunteer,
    });
    onClose();
  };

  const isGameDay = event.eventType === 'game';
  const isMandatory = event.eventType === 'game' || event.eventType === 'tournament';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>RSVP for {childName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Details */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold">{event.title}</h4>
                  <Badge variant={isGameDay ? 'default' : 'secondary'}>
                    {event.eventType}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(event.start, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>

                {isGameDay && (
                  <Alert className="mt-3">
                    <Shirt className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Game Day Requirements:</strong>
                      <ul className="mt-1 ml-5 list-disc">
                        <li>Arrive 45 minutes before game time</li>
                        <li>Full equipment required</li>
                        <li>Bring both home and away jerseys</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* RSVP Response */}
          <div className="space-y-3">
            <Label>Response</Label>
            {isMandatory && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  This is a mandatory event. Please contact the coach if {childName} cannot attend.
                </AlertDescription>
              </Alert>
            )}
            
            <RadioGroup value={response} onValueChange={(value: any) => setResponse(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="accept" id="accept" />
                <Label htmlFor="accept" className="flex items-center gap-2 font-normal">
                  <Check className="h-4 w-4 text-green-600" />
                  {childName} will attend
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maybe" id="maybe" />
                <Label htmlFor="maybe" className="flex items-center gap-2 font-normal">
                  <HelpCircle className="h-4 w-4 text-yellow-600" />
                  Not sure yet
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decline" id="decline" />
                <Label htmlFor="decline" className="flex items-center gap-2 font-normal">
                  <X className="h-4 w-4 text-red-600" />
                  {childName} cannot attend
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Additional Options */}
          {response === 'accept' && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <Label>Additional Options</Label>
                
                {event.transportation?.needed && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="transportation"
                      checked={transportationNeeded}
                      onChange={(e) => setTransportationNeeded(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="transportation" className="font-normal">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        We need transportation to this event
                      </div>
                    </Label>
                  </div>
                )}

                {event.requiresVolunteer && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="volunteer"
                      checked={canVolunteer}
                      onChange={(e) => setCanVolunteer(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="volunteer" className="font-normal">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        I can volunteer as {event.volunteerNeeded}
                      </div>
                    </Label>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder={
                response === 'decline' 
                  ? "Please provide a reason for absence..."
                  : "Any additional information for the coach..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {response === 'decline' && isMandatory && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Missing mandatory events may affect {childName}'s playing time and team standing.
                Please ensure the coach is notified.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            Submit RSVP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChildRSVPModal;