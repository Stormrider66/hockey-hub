import React, { useState } from 'react';
import { Car, MapPin, Clock, Users, Phone, MessageSquare, CheckCircle, XCircle, Navigation } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useScheduleClarificationApi } from '@/store/api/scheduleClarificationApi';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface CarpoolOfferCardProps {
  offer: any; // Replace with proper type
  currentUserId: string;
  onRequestSubmit?: () => void;
}

export const CarpoolOfferCard: React.FC<CarpoolOfferCardProps> = ({
  offer,
  currentUserId,
  onRequestSubmit,
}) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [seatsRequested, setSeatsRequested] = useState(1);

  const [requestCarpool] = useScheduleClarificationApi.useRequestCarpoolMutation();
  const [respondToRequest] = useScheduleClarificationApi.useRespondToCarpoolRequestMutation();

  const isDriver = offer.driver_id === currentUserId;
  const hasRequested = offer.requests?.some((r: any) => r.requester_id === currentUserId);
  const availableSeats = offer.available_seats - offer.occupied_seats;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'partially_filled':
        return 'warning';
      case 'full':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const handleRequestSubmit = async () => {
    try {
      await requestCarpool({
        offerId: offer.id,
        playerId: currentUserId, // In real app, would select which child
        seatsRequested,
        pickupAddress,
        needsReturnTrip: offer.is_round_trip,
        notes: requestNotes,
      }).unwrap();

      toast.success('Carpool request sent!');
      setShowRequestForm(false);
      setRequestNotes('');
      setPickupAddress('');
      if (onRequestSubmit) {
        onRequestSubmit();
      }
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const handleRespondToRequest = async (requestId: string, accepted: boolean) => {
    try {
      await respondToRequest({
        requestId,
        accepted,
        responseMessage: accepted ? 'Request accepted! See you there.' : 'Sorry, unable to accommodate this request.',
      }).unwrap();

      toast.success(accepted ? 'Request accepted' : 'Request declined');
    } catch (error) {
      toast.error('Failed to respond to request');
    }
  };

  const openInMaps = () => {
    const encodedLocation = encodeURIComponent(offer.pickup_location);
    window.open(`https://maps.google.com/?q=${encodedLocation}`, '_blank');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={`/api/users/${offer.driver_id}/avatar`} />
              <AvatarFallback>
                <Car className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{offer.driver_name || 'Parent Driver'}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant={getStatusColor(offer.status)}>
                  {offer.status.replace('_', ' ')}
                </Badge>
                <span>{offer.vehicle_type.toUpperCase()}</span>
              </div>
            </div>
          </div>
          {!isDriver && availableSeats > 0 && !hasRequested && (
            <Button
              size="sm"
              onClick={() => setShowRequestForm(!showRequestForm)}
            >
              Request Ride
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Ride Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span>{availableSeats} of {offer.available_seats} seats available</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>Departure: {offer.departure_time}</span>
          </div>
          <div className="col-span-2 flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p>{offer.pickup_location}</p>
              <button
                onClick={openInMaps}
                className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
              >
                <Navigation className="h-3 w-3" />
                View in Maps
              </button>
            </div>
          </div>
        </div>

        {/* Driver Preferences */}
        {offer.driver_preferences && (
          <div className="flex flex-wrap gap-2">
            {offer.driver_preferences.equipment_space && (
              <Badge variant="outline" className="text-xs">Equipment OK</Badge>
            )}
            {offer.driver_preferences.child_seat_available && (
              <Badge variant="outline" className="text-xs">Child Seat</Badge>
            )}
            {offer.driver_preferences.non_smoking && (
              <Badge variant="outline" className="text-xs">Non-Smoking</Badge>
            )}
            {offer.is_round_trip && (
              <Badge variant="outline" className="text-xs">
                Return: {offer.return_time}
              </Badge>
            )}
          </div>
        )}

        {/* Notes */}
        {offer.notes && (
          <p className="text-sm text-gray-600 italic">"{offer.notes}"</p>
        )}

        {/* Request Form */}
        {showRequestForm && !isDriver && (
          <div className="border-t pt-3 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pickup Address (if different)</label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Leave empty to use default location"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Seats</label>
              <input
                type="number"
                min="1"
                max={availableSeats}
                value={seatsRequested}
                onChange={(e) => setSeatsRequested(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes for Driver</label>
              <Textarea
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Any special requests or information..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleRequestSubmit}
              >
                Send Request
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRequestForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Pending Requests (for driver) */}
        {isDriver && offer.requests?.filter((r: any) => r.status === 'pending').length > 0 && (
          <div className="border-t pt-3">
            <h5 className="text-sm font-medium mb-2">Pending Requests</h5>
            <div className="space-y-2">
              {offer.requests
                .filter((r: any) => r.status === 'pending')
                .map((request: any) => (
                  <div key={request.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{request.requester_name}</p>
                      <p className="text-xs text-gray-500">
                        {request.seats_requested} seat(s) • {request.pickup_address || 'Default pickup'}
                      </p>
                      {request.notes && (
                        <p className="text-xs text-gray-600 mt-1">"{request.notes}"</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRespondToRequest(request.id, true)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRespondToRequest(request.id, false)}
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Contact Options */}
        {hasRequested && offer.contact_info && (
          <div className="border-t pt-3 flex gap-2">
            {offer.contact_info.phone && (
              <Button size="sm" variant="outline">
                <Phone className="h-4 w-4 mr-1" />
                Call Driver
              </Button>
            )}
            <Button size="sm" variant="outline">
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};