import React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Clock, MapPin, Users, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as Icons from '@/components/icons';
import { useGetEventQuery } from '@/store/api/scheduleApi';
import { EVENT_CONFIG, EventType, hasPermission } from '../types';
import { LaunchActions } from './LaunchActions';
import { EventContent } from './event-content/EventContent';
import { useAuth } from '@/contexts/AuthContext';

interface EventPreviewPageProps {
  eventId: string;
}

const EventMetadata: React.FC<{ event: any }> = ({ event }) => {
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
    } catch {
      return dateString;
    }
  };

  const getDuration = () => {
    try {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const durationMs = end.getTime() - start.getTime();
      const minutes = Math.floor(durationMs / 60000);
      if (minutes < 60) return `${minutes} minutes`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours} hours`;
    } catch {
      return '90 minutes';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Calendar className="h-4 w-4" />
        <span>{formatDateTime(event.startTime)}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="h-4 w-4" />
        <span>{getDuration()}</span>
      </div>
      {event.location && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{event.location}</span>
        </div>
      )}
      {event.participants && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{event.participants.length} participants</span>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, className: 'bg-green-500', label: 'ACTIVE' };
      case 'upcoming':
        return { variant: 'secondary' as const, className: '', label: 'UPCOMING' };
      case 'completed':
        return { variant: 'outline' as const, className: '', label: 'COMPLETED' };
      case 'cancelled':
        return { variant: 'destructive' as const, className: '', label: 'CANCELLED' };
      default:
        return { variant: 'outline' as const, className: '', label: status.toUpperCase() };
    }
  };

  const config = getStatusConfig();
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {status === 'active' && (
        <span className="relative flex h-2 w-2 mr-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
      )}
      {config.label}
    </Badge>
  );
};

export const EventPreviewPage: React.FC<EventPreviewPageProps> = ({ eventId }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: event, isLoading, error } = useGetEventQuery(eventId);

  const userRole = user?.role || 'player';

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error ? 'Failed to load event details' : 'Event not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const config = EVENT_CONFIG[event.type];
  const Icon = Icons[config.icon as keyof typeof Icons];
  const canEdit = hasPermission(event.type, 'edit', userRole as any);
  const canView = hasPermission(event.type, 'view', userRole as any);

  if (!canView) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view this event.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
        {canEdit && (
          <Button
            variant="outline"
            onClick={() => {
              if (event.type === EventType.TRAINING) {
                router.push(`/physicaltrainer/session/edit/${event.id}`);
              }
              // Add other event type edit routes as needed
            }}
          >
            <Icons.Edit className="mr-2 h-4 w-4" />
            Edit Event
          </Button>
        )}
      </div>

      {/* Event Details Card */}
      <Card className="mb-6">
        <CardHeader className={`${config.bgColor} border-b`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {Icon && <Icon className="h-8 w-8" style={{ color: config.color }} />}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                  <p className="text-gray-600 mt-1">{event.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Badge 
                  style={{ 
                    backgroundColor: `${config.color}20`,
                    color: config.color 
                  }}
                >
                  {config.badge}
                </Badge>
                <StatusBadge status={event.status} />
                {event.intensity && (
                  <Badge variant="outline">
                    {event.intensity.toUpperCase()} INTENSITY
                  </Badge>
                )}
                {event.confidential && (
                  <Badge variant="destructive">
                    <Icons.Lock className="h-3 w-3 mr-1" />
                    CONFIDENTIAL
                  </Badge>
                )}
              </div>
            </div>
            <div className="ml-6">
              <EventMetadata event={event} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Dynamic content based on event type */}
          <EventContent event={event} role={userRole as any} />
        </CardContent>
      </Card>

      {/* Launch Actions */}
      {event.status !== 'completed' && event.status !== 'cancelled' && (
        <LaunchActions event={event} role={userRole as any} />
      )}

      {/* Related Events */}
      {event.metadata?.relatedEvents && event.metadata.relatedEvents.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Related Events</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {event.metadata.relatedEvents.map((relatedEvent: any) => (
                <div 
                  key={relatedEvent.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/event-preview/${relatedEvent.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{relatedEvent.type}</Badge>
                    <span className="font-medium">{relatedEvent.title}</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(relatedEvent.startTime), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <Icons.ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};