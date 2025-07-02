import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Calendar, MapPin, Video, Phone, User } from 'lucide-react';
import { format } from 'date-fns';

interface CoachAvailabilityDisplayProps {
  availability: Record<string, any[]>;
  coaches: any[];
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const availabilityTypeConfig = {
  office_hours: {
    label: 'Office Hours',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  by_appointment: {
    label: 'By Appointment',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  emergency: {
    label: 'Emergency Only',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
  },
  not_available: {
    label: 'Not Available',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
  },
};

export const CoachAvailabilityDisplay: React.FC<CoachAvailabilityDisplayProps> = ({
  availability,
  coaches,
}) => {
  const getCoachInfo = (coachId: string) => {
    return coaches.find((c) => c.user_id === coachId);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!Object.keys(availability).length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No availability information available</p>
        <p className="text-sm mt-1">Coaches will update their availability soon</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(availability).map(([coachId, slots]) => {
        const coach = getCoachInfo(coachId);
        if (!coach || !slots.length) return null;

        // Group slots by day
        const slotsByDay = slots.reduce((acc: any, slot: any) => {
          if (slot.dayOfWeek !== undefined && slot.dayOfWeek !== null) {
            if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
            acc[slot.dayOfWeek].push(slot);
          }
          return acc;
        }, {});

        // Get specific date slots
        const specificDateSlots = slots.filter((slot: any) => slot.specificDate);

        return (
          <Card key={coachId} className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={coach.user?.avatar} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium">{coach.user?.name || coach.nickname || 'Coach'}</h4>
                <p className="text-sm text-muted-foreground">{coach.user?.email}</p>
              </div>
            </div>

            {/* Regular Schedule */}
            {Object.keys(slotsByDay).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Regular Schedule</p>
                {Object.entries(slotsByDay).map(([day, daySlots]: [string, any]) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24">{dayNames[parseInt(day)]}</span>
                    <div className="flex flex-wrap gap-2">
                      {(daySlots as any[]).map((slot: any, idx: number) => {
                        const config = availabilityTypeConfig[slot.type as keyof typeof availabilityTypeConfig];
                        return (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className={`${config.bgColor} ${config.textColor} border-0`}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            {slot.type !== 'office_hours' && (
                              <span className="ml-2 text-xs opacity-75">({config.label})</span>
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Specific Dates */}
            {specificDateSlots.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Special Availability</p>
                {specificDateSlots.map((slot: any, idx: number) => {
                  const config = availabilityTypeConfig[slot.type as keyof typeof availabilityTypeConfig];
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{format(new Date(slot.specificDate), 'PPP')}</span>
                      <Badge
                        variant="secondary"
                        className={`${config.bgColor} ${config.textColor} border-0`}
                      >
                        {slot.startTime && slot.endTime ? (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </>
                        ) : (
                          config.label
                        )}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Additional Info */}
            {slots[0]?.metadata && (
              <div className="mt-4 pt-3 border-t space-y-2">
                {slots[0].metadata.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{slots[0].metadata.location}</span>
                  </div>
                )}
                {slots[0].metadata.meetingUrl && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="h-3 w-3" />
                    <span>Video meetings available</span>
                  </div>
                )}
                {slots[0].allowMeetingRequests && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Accepts meeting requests • {slots[0].defaultMeetingDuration} min sessions
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {slots[0]?.notes && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                <p className="text-sm">{slots[0].notes}</p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};