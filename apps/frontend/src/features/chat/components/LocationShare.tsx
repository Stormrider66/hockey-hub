import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Share, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface LocationShareProps {
  onLocationShare: (location: LocationData) => void;
  className?: string;
}

export const LocationShare: React.FC<LocationShareProps> = ({
  onLocationShare,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiveSharing, setIsLiveSharing] = useState(false);
  const [liveShareDuration, setLiveShareDuration] = useState(15); // minutes

  const requestLocation = async (options: PositionOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
          ...options
        });
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      };

      // Try to get address from reverse geocoding (simplified)
      try {
        const address = await reverseGeocode(locationData.latitude, locationData.longitude);
        locationData.address = address;
      } catch {
        // Address lookup failed, but we still have coordinates
      }

      setLocation(locationData);
      toast.success('Location acquired successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // In a real app, you'd use a geocoding service like Google Maps, Mapbox, or OpenStreetMap
    // For demo purposes, we'll return a mock address
    return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
  };

  const shareCurrentLocation = () => {
    if (location) {
      onLocationShare(location);
      setIsOpen(false);
      toast.success('Location shared');
    }
  };

  const startLiveSharing = () => {
    setIsLiveSharing(true);
    requestLocation({ enableHighAccuracy: true, maximumAge: 0 });
    
    // Set up interval for live updates
    const interval = setInterval(() => {
      requestLocation({ enableHighAccuracy: true, maximumAge: 0 });
    }, 30000); // Update every 30 seconds

    // Stop after specified duration
    setTimeout(() => {
      clearInterval(interval);
      setIsLiveSharing(false);
      toast.success('Live location sharing ended');
    }, liveShareDuration * 60 * 1000);

    toast.success(`Started live location sharing for ${liveShareDuration} minutes`);
    setIsOpen(false);
  };

  const formatAccuracy = (accuracy: number) => {
    if (accuracy < 10) return 'Very High';
    if (accuracy < 50) return 'High';
    if (accuracy < 100) return 'Medium';
    return 'Low';
  };

  const openInMaps = () => {
    if (location) {
      const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      window.open(mapsUrl, '_blank');
    }
  };

  useEffect(() => {
    // Request permission on component mount
    if (navigator.geolocation && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setError('Location access denied. Please enable location permissions.');
        }
      });
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${className}`}
        >
          <MapPin className="h-4 w-4" />
          Location
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-600" />
            Share Location
          </DialogTitle>
          <DialogDescription>
            Share your current location or enable live location sharing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Permission Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Location Error</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          {/* Current Location Display */}
          {location && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Current Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coordinates:</span>
                    <span className="font-mono text-xs">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </span>
                  </div>
                  
                  {location.address && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="text-right text-xs">{location.address}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accuracy:</span>
                    <Badge variant="outline" className="text-xs">
                      {formatAccuracy(location.accuracy)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-xs">
                      {new Date(location.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openInMaps}
                    className="flex-1"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View in Maps
                  </Button>
                  <Button
                    onClick={shareCurrentLocation}
                    size="sm"
                    className="flex-1"
                  >
                    <Share className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => requestLocation()}
              disabled={isLoading}
              className="w-full"
              variant={location ? "outline" : "default"}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  {location ? 'Update Location' : 'Get Current Location'}
                </>
              )}
            </Button>

            {location && !isLiveSharing && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-sm">Live Location</span>
                    </div>
                    <select
                      value={liveShareDuration}
                      onChange={(e) => setLiveShareDuration(parseInt(e.target.value))}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">
                    Share your live location for {liveShareDuration} minutes. Updates every 30 seconds.
                  </p>
                  
                  <Button
                    onClick={startLiveSharing}
                    size="sm"
                    className="w-full"
                    variant="outline"
                  >
                    Start Live Sharing
                  </Button>
                </CardContent>
              </Card>
            )}

            {isLiveSharing && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Live location sharing active</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Your location is being shared for {liveShareDuration} minutes
                </p>
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="p-3 bg-gray-50 border rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Privacy Notice</h4>
            <p className="text-xs text-gray-600">
              Your location will only be shared with participants in this conversation. 
              You can stop sharing at any time.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Location Message Display Component
interface LocationMessageProps {
  location: LocationData;
  isLive?: boolean;
  sender: string;
  timestamp: string;
}

export const LocationMessage: React.FC<LocationMessageProps> = ({
  location,
  isLive = false,
  sender,
  timestamp
}) => {
  const openInMaps = () => {
    const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(mapsUrl, '_blank');
  };

  const getDirections = () => {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
    window.open(directionsUrl, '_blank');
  };

  return (
    <Card className="max-w-sm border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm">{sender} shared location</span>
          {isLive && (
            <Badge variant="outline" className="text-xs bg-orange-100 border-orange-300">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse mr-1" />
              Live
            </Badge>
          )}
        </div>
        
        {location.address && (
          <p className="text-sm text-gray-700 mb-2">{location.address}</p>
        )}
        
        <div className="text-xs text-gray-500 mb-3">
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          <br />
          Accuracy: ±{Math.round(location.accuracy)}m
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={openInMaps}
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            onClick={getDirections}
            size="sm"
            className="flex-1 text-xs"
          >
            <Navigation className="h-3 w-3 mr-1" />
            Directions
          </Button>
        </div>
        
        <p className="text-xs text-gray-400 mt-2">
          {new Date(timestamp).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
};