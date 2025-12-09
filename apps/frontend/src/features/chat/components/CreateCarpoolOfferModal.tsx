import React, { useState } from 'react';
import { X, Car, MapPin, Clock, Users, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useCreateCarpoolOfferMutation } from '@/store/api/scheduleClarificationApi';
import { toast } from 'react-hot-toast';

interface CreateCarpoolOfferModalProps {
  clarificationId: string;
  eventId: string;
  eventDate: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateCarpoolOfferModal: React.FC<CreateCarpoolOfferModalProps> = ({
  clarificationId,
  eventId,
  eventDate,
  onClose,
  onSuccess,
}) => {
  const [vehicleType, setVehicleType] = useState('suv');
  const [availableSeats, setAvailableSeats] = useState(3);
  const [pickupLocation, setPickupLocation] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [notes, setNotes] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('app');
  
  // Driver preferences
  const [maxDetour, setMaxDetour] = useState(10);
  const [hasEquipmentSpace, setHasEquipmentSpace] = useState(true);
  const [childSeatAvailable, setChildSeatAvailable] = useState(false);
  const [nonSmoking, setNonSmoking] = useState(true);
  const [petFriendly, setPetFriendly] = useState(false);

  const [createOffer, { isLoading }] = useCreateCarpoolOfferMutation();

  const vehicleTypes = [
    { value: 'car', label: 'Car', seats: '1-3' },
    { value: 'suv', label: 'SUV', seats: '3-6' },
    { value: 'van', label: 'Van', seats: '6-7' },
    { value: 'minibus', label: 'Minibus', seats: '8+' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupLocation || !departureTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createOffer({
        clarificationId,
        eventId,
        eventDate,
        vehicleType,
        availableSeats,
        pickupLocation,
        departureTime,
        returnTime: isRoundTrip ? returnTime : undefined,
        isRoundTrip,
        driverPreferences: {
          max_detour_minutes: maxDetour,
          equipment_space: hasEquipmentSpace,
          child_seat_available: childSeatAvailable,
          non_smoking: nonSmoking,
          pet_friendly: petFriendly,
        },
        notes,
        contactInfo: {
          phone: phoneNumber,
          preferred_contact_method: preferredContactMethod,
        },
      }).unwrap();

      toast.success('Carpool offer created successfully!');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast.error('Failed to create carpool offer');
      console.error('Failed to create carpool offer:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              Offer Carpool Ride
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Vehicle Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex justify-between items-center w-full">
                            <span>{type.label}</span>
                            <span className="text-xs text-gray-500 ml-2">({type.seats} seats)</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableSeats">Available Seats</Label>
                  <Input
                    id="availableSeats"
                    type="number"
                    min="1"
                    max="15"
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pickup Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Pickup Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="pickupLocation">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Pickup Location *
                </Label>
                <Input
                  id="pickupLocation"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g., Parking lot at Main St & 5th Ave"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureTime">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Departure Time *
                  </Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isRoundTrip">Round Trip</Label>
                    <Switch
                      id="isRoundTrip"
                      checked={isRoundTrip}
                      onCheckedChange={setIsRoundTrip}
                    />
                  </div>
                  {isRoundTrip && (
                    <Input
                      type="time"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      placeholder="Return time"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Driver Preferences */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Driver Preferences</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxDetour" className="flex items-center gap-1">
                    Max Detour Time
                    <Info className="h-3 w-3 text-gray-400" />
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxDetour"
                      type="number"
                      min="0"
                      max="30"
                      value={maxDetour}
                      onChange={(e) => setMaxDetour(parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">minutes</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasEquipmentSpace"
                      checked={hasEquipmentSpace}
                      onCheckedChange={(checked) => setHasEquipmentSpace(checked as boolean)}
                    />
                    <label htmlFor="hasEquipmentSpace" className="text-sm">
                      Equipment space available (hockey bags)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="childSeatAvailable"
                      checked={childSeatAvailable}
                      onCheckedChange={(checked) => setChildSeatAvailable(checked as boolean)}
                    />
                    <label htmlFor="childSeatAvailable" className="text-sm">
                      Child seat available
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="nonSmoking"
                      checked={nonSmoking}
                      onCheckedChange={(checked) => setNonSmoking(checked as boolean)}
                    />
                    <label htmlFor="nonSmoking" className="text-sm">
                      Non-smoking vehicle
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="petFriendly"
                      checked={petFriendly}
                      onCheckedChange={(checked) => setPetFriendly(checked as boolean)}
                    />
                    <label htmlFor="petFriendly" className="text-sm">
                      Pet-friendly
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Notes */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Contact Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="For emergencies"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredContact">Preferred Contact</Label>
                  <Select value={preferredContactMethod} onValueChange={setPreferredContactMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app">In-App Message</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="text">Text Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information for riders..."
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                <Car className="h-4 w-4 mr-1" />
                Create Offer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};