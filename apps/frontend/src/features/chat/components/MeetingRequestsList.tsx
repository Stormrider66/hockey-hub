import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface MeetingRequest {
  id: string;
  status: string;
  type: string;
  purpose: string;
  subject: string;
  message: string;
  proposedDate: string;
  alternateDate1?: string;
  alternateDate2?: string;
  scheduledDate?: string;
  duration: number;
  location?: string;
  meetingUrl?: string;
  coachNotes?: string;
  declineReason?: string;
  rescheduleReason?: string;
  createdAt: string;
  respondedAt?: string;
  completedAt?: string;
}

interface MeetingRequestsListProps {
  requests: MeetingRequest[];
  isCoach: boolean;
  onUpdate: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: AlertCircle },
  accepted: { label: 'Accepted', color: 'bg-green-500', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-500', icon: XCircle },
  rescheduled: { label: 'Rescheduled', color: 'bg-blue-500', icon: RefreshCw },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-purple-500', icon: CheckCircle },
};

const typeIcons = {
  in_person: MapPin,
  video_call: Video,
  phone_call: Phone,
};

export const MeetingRequestsList: React.FC<MeetingRequestsListProps> = ({
  requests,
  isCoach,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [respondDialog, setRespondDialog] = useState<{
    open: boolean;
    request: MeetingRequest | null;
    action: 'accept' | 'decline' | 'reschedule' | null;
  }>({ open: false, request: null, action: null });
  const [responseData, setResponseData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    meetingUrl: '',
    coachNotes: '',
    declineReason: '',
    rescheduleReason: '',
  });

  const upcomingRequests = requests.filter(
    (r) => ['pending', 'accepted', 'rescheduled'].includes(r.status)
  );
  const pastRequests = requests.filter(
    (r) => ['declined', 'cancelled', 'completed'].includes(r.status)
  );

  const handleResponse = async () => {
    if (!respondDialog.request || !respondDialog.action) return;

    try {
      const { request, action } = respondDialog;
      let status = action;
      let scheduledDate = undefined;

      if (action === 'accept' && responseData.scheduledDate) {
        const date = new Date(responseData.scheduledDate);
        const [hours, minutes] = responseData.scheduledTime.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
        scheduledDate = date.toISOString();
      }

      const response = await fetch(
        `/api/private-coach-channels/meeting-requests/${request.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            coachId: localStorage.getItem('userId'), // In a real app, get from auth state
            status,
            scheduledDate,
            location: responseData.location || undefined,
            meetingUrl: responseData.meetingUrl || undefined,
            coachNotes: responseData.coachNotes || undefined,
            declineReason: responseData.declineReason || undefined,
            rescheduleReason: responseData.rescheduleReason || undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update meeting request');
      }

      toast({
        title: 'Success',
        description: `Meeting request ${action}ed successfully`,
      });
      onUpdate();
      setRespondDialog({ open: false, request: null, action: null });
      setResponseData({
        scheduledDate: '',
        scheduledTime: '',
        location: '',
        meetingUrl: '',
        coachNotes: '',
        declineReason: '',
        rescheduleReason: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update meeting request',
        variant: 'destructive',
      });
    }
  };

  const renderRequest = (request: MeetingRequest) => {
    const StatusIcon = statusConfig[request.status as keyof typeof statusConfig].icon;
    const TypeIcon = typeIcons[request.type as keyof typeof typeIcons];

    return (
      <Card key={request.id} className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className={`${
                    statusConfig[request.status as keyof typeof statusConfig].color
                  } text-white border-0`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig[request.status as keyof typeof statusConfig].label}
                </Badge>
                <Badge variant="outline">
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {request.type.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">{request.purpose.replace('_', ' ')}</Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1">{request.subject}</h3>
              <p className="text-sm text-muted-foreground mb-3">{request.message}</p>
            </div>
          </div>

          {/* Date/Time Information */}
          <div className="space-y-2 mb-4">
            {request.scheduledDate ? (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Scheduled:</span>
                <span>{format(new Date(request.scheduledDate), 'PPP p')}</span>
                <Badge variant="secondary" className="ml-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {request.duration} min
                </Badge>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Proposed:</span>
                  <span>{format(new Date(request.proposedDate), 'PPP p')}</span>
                </div>
                {request.alternateDate1 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="ml-6">Alt 1:</span>
                    <span>{format(new Date(request.alternateDate1), 'PPP p')}</span>
                  </div>
                )}
                {request.alternateDate2 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="ml-6">Alt 2:</span>
                    <span>{format(new Date(request.alternateDate2), 'PPP p')}</span>
                  </div>
                )}
              </>
            )}

            {request.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{request.location}</span>
              </div>
            )}

            {request.meetingUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Video className="h-4 w-4 text-muted-foreground" />
                <a href={request.meetingUrl} className="text-primary hover:underline">
                  Join video call
                </a>
              </div>
            )}
          </div>

          {/* Coach Notes or Decline Reason */}
          {request.coachNotes && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <p className="text-sm font-medium mb-1">Coach Notes:</p>
              <p className="text-sm">{request.coachNotes}</p>
            </div>
          )}

          {request.declineReason && (
            <div className="mb-4 p-3 bg-red-50 rounded-md">
              <p className="text-sm font-medium mb-1 text-red-900">Decline Reason:</p>
              <p className="text-sm text-red-800">{request.declineReason}</p>
            </div>
          )}

          {/* Actions */}
          {isCoach && request.status === 'pending' && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={() =>
                  setRespondDialog({ open: true, request, action: 'accept' })
                }
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setRespondDialog({ open: true, request, action: 'reschedule' })
                }
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  setRespondDialog({ open: true, request, action: 'decline' })
                }
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span>Requested {format(new Date(request.createdAt), 'PPp')}</span>
            {request.respondedAt && (
              <span>• Responded {format(new Date(request.respondedAt), 'PPp')}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingRequests.length > 0 ? (
            upcomingRequests.map(renderRequest)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming meeting requests</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-4">
          {pastRequests.length > 0 ? (
            pastRequests.map(renderRequest)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No past meeting requests</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <AlertDialog
        open={respondDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRespondDialog({ open: false, request: null, action: null });
            setResponseData({
              scheduledDate: '',
              scheduledTime: '',
              location: '',
              meetingUrl: '',
              coachNotes: '',
              declineReason: '',
              rescheduleReason: '',
            });
          }
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {respondDialog.action === 'accept' && 'Accept Meeting Request'}
              {respondDialog.action === 'decline' && 'Decline Meeting Request'}
              {respondDialog.action === 'reschedule' && 'Reschedule Meeting Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {respondDialog.request?.subject}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {respondDialog.action === 'accept' && (
              <>
                <div className="space-y-2">
                  <Label>Confirm Date & Time</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={responseData.scheduledDate}
                      onChange={(e) =>
                        setResponseData({ ...responseData, scheduledDate: e.target.value })
                      }
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                      type="time"
                      value={responseData.scheduledTime}
                      onChange={(e) =>
                        setResponseData({ ...responseData, scheduledTime: e.target.value })
                      }
                      className="w-32"
                    />
                  </div>
                </div>
                {respondDialog.request?.type === 'in_person' && (
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={responseData.location}
                      onChange={(e) =>
                        setResponseData({ ...responseData, location: e.target.value })
                      }
                      placeholder="Confirm or specify meeting location"
                    />
                  </div>
                )}
                {respondDialog.request?.type === 'video_call' && (
                  <div className="space-y-2">
                    <Label>Meeting URL</Label>
                    <Input
                      value={responseData.meetingUrl}
                      onChange={(e) =>
                        setResponseData({ ...responseData, meetingUrl: e.target.value })
                      }
                      placeholder="Provide video call link"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={responseData.coachNotes}
                    onChange={(e) =>
                      setResponseData({ ...responseData, coachNotes: e.target.value })
                    }
                    placeholder="Any additional information for the parent..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {respondDialog.action === 'decline' && (
              <div className="space-y-2">
                <Label>Reason for Declining</Label>
                <Textarea
                  value={responseData.declineReason}
                  onChange={(e) =>
                    setResponseData({ ...responseData, declineReason: e.target.value })
                  }
                  placeholder="Please provide a reason for declining this meeting request..."
                  rows={4}
                  required
                />
              </div>
            )}

            {respondDialog.action === 'reschedule' && (
              <div className="space-y-2">
                <Label>Reason for Rescheduling</Label>
                <Textarea
                  value={responseData.rescheduleReason}
                  onChange={(e) =>
                    setResponseData({ ...responseData, rescheduleReason: e.target.value })
                  }
                  placeholder="Please explain why you need to reschedule and suggest alternative times..."
                  rows={4}
                  required
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResponse}>
              {respondDialog.action === 'accept' && 'Confirm Meeting'}
              {respondDialog.action === 'decline' && 'Decline Request'}
              {respondDialog.action === 'reschedule' && 'Request Reschedule'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};