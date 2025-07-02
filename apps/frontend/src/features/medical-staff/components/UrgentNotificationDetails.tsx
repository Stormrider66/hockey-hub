import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  User,
  Users,
  Building2,
  TrendingUp,
  FileText,
  Download,
  Shield,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Smartphone,
  Calendar,
  MapPin,
  Activity,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  useGetNotificationDetailsQuery,
  useAcknowledgeNotificationMutation,
  useEscalateNotificationMutation,
  useResolveNotificationMutation,
} from '@/store/api/urgentMedicalApi';
import {
  UrgencyLevel,
  MedicalNotificationStatus,
  AcknowledgmentMethod,
  EscalationReason,
} from '../types/urgent-notification';
import { useToast } from '@/components/ui/use-toast';

interface UrgentNotificationDetailsProps {
  notificationId: string;
  currentUserId: string;
  userRole: string;
  onClose: () => void;
  onUpdate: () => void;
}

const UrgentNotificationDetails: React.FC<UrgentNotificationDetailsProps> = ({
  notificationId,
  currentUserId,
  userRole,
  onClose,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [acknowledgmentMessage, setAcknowledgmentMessage] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [escalationMessage, setEscalationMessage] = useState('');
  const [showAcknowledgeForm, setShowAcknowledgeForm] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [showEscalateForm, setShowEscalateForm] = useState(false);

  const { data: notification, isLoading } = useGetNotificationDetailsQuery(notificationId);
  const [acknowledgeNotification, { isLoading: isAcknowledging }] = useAcknowledgeNotificationMutation();
  const [escalateNotification, { isLoading: isEscalating }] = useEscalateNotificationMutation();
  const [resolveNotification, { isLoading: isResolving }] = useResolveNotificationMutation();

  const getUrgencyIcon = (level: UrgencyLevel) => {
    switch (level) {
      case UrgencyLevel.URGENT:
        return <Info className="h-5 w-5" />;
      case UrgencyLevel.CRITICAL:
        return <AlertCircle className="h-5 w-5" />;
      case UrgencyLevel.EMERGENCY:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getUrgencyColor = (level: UrgencyLevel): string => {
    switch (level) {
      case UrgencyLevel.URGENT:
        return 'default';
      case UrgencyLevel.CRITICAL:
        return 'warning';
      case UrgencyLevel.EMERGENCY:
        return 'destructive';
    }
  };

  const getStatusBadgeVariant = (status: MedicalNotificationStatus) => {
    switch (status) {
      case MedicalNotificationStatus.PENDING:
        return 'secondary';
      case MedicalNotificationStatus.DELIVERED:
        return 'default';
      case MedicalNotificationStatus.ACKNOWLEDGED:
        return 'success';
      case MedicalNotificationStatus.ESCALATED:
        return 'warning';
      case MedicalNotificationStatus.RESOLVED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'in_app':
        return <Bell className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledgeNotification({
        id: notificationId,
        data: {
          method: AcknowledgmentMethod.IN_APP,
          message: acknowledgmentMessage,
        },
      }).unwrap();

      toast({
        title: 'Success',
        description: 'Notification acknowledged successfully',
      });
      setShowAcknowledgeForm(false);
      setAcknowledgmentMessage('');
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge notification',
        variant: 'destructive',
      });
    }
  };

  const handleEscalate = async () => {
    try {
      await escalateNotification({
        id: notificationId,
        data: {
          reason: EscalationReason.MANUAL,
          message: escalationMessage,
        },
      }).unwrap();

      toast({
        title: 'Success',
        description: 'Notification escalated successfully',
      });
      setShowEscalateForm(false);
      setEscalationMessage('');
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to escalate notification',
        variant: 'destructive',
      });
    }
  };

  const handleResolve = async () => {
    try {
      await resolveNotification({
        id: notificationId,
        resolutionNotes,
      }).unwrap();

      toast({
        title: 'Success',
        description: 'Notification resolved successfully',
      });
      setShowResolveForm(false);
      setResolutionNotes('');
      onUpdate();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve notification',
        variant: 'destructive',
      });
    }
  };

  const isUserAcknowledged = () => {
    return notification?.acknowledgmentProgress?.acknowledgedBy?.some(
      (ack) => ack.userId === currentUserId
    );
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!notification) {
    return null;
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={getUrgencyColor(notification.urgency_level) as any}>
                  {getUrgencyIcon(notification.urgency_level)}
                  <span className="ml-1">{notification.urgency_level.toUpperCase()}</span>
                </Badge>
                <Badge variant={getStatusBadgeVariant(notification.status) as any}>
                  {notification.status.replace(/_/g, ' ')}
                </Badge>
                {notification.escalation_level > 0 && (
                  <Badge variant="secondary">
                    Escalation L{notification.escalation_level}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl">{notification.title}</DialogTitle>
              <DialogDescription>
                Created {format(new Date(notification.created_at), 'PPpp')} by Medical Staff
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="acknowledgments">
                Acknowledgments ({notification.acknowledged_count})
              </TabsTrigger>
              <TabsTrigger value="escalations">
                Escalations ({notification.escalationHistory?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="delivery">Delivery Status</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{notification.message}</p>
                </CardContent>
              </Card>

              {/* Medical Data */}
              {notification.medical_data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Medical Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {notification.medical_data.player_id && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Player ID: {notification.medical_data.player_id}</span>
                      </div>
                    )}
                    {notification.medical_data.additional_notes && (
                      <Alert>
                        <AlertDescription>
                          {notification.medical_data.additional_notes}
                        </AlertDescription>
                      </Alert>
                    )}
                    {notification.medical_data.medications && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Medications</h4>
                        <div className="space-y-1">
                          {notification.medical_data.medications.map((med: any, idx: number) => (
                            <div key={idx} className="text-sm text-gray-600">
                              • {med.name} - {med.dosage} ({med.frequency})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Target Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Target Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {notification.target_type === 'player' && <User className="h-4 w-4" />}
                      {notification.target_type === 'team' && <Users className="h-4 w-4" />}
                      {notification.target_type === 'organization' && <Building2 className="h-4 w-4" />}
                      <span className="capitalize">{notification.target_type}</span>
                    </div>
                    <Badge variant="outline">{notification.total_recipients} recipients</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Timing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {notification.sent_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sent</span>
                      <span>{format(new Date(notification.sent_at), 'PPpp')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expires</span>
                    <span className="font-medium text-orange-600">
                      {format(new Date(notification.expires_at), 'PPpp')}
                    </span>
                  </div>
                  {notification.acknowledgment_timeout_minutes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Acknowledgment Timeout</span>
                      <span>{notification.acknowledgment_timeout_minutes} minutes</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="acknowledgments" className="space-y-4 mt-4">
              {notification.requires_acknowledgment && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Acknowledgment Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Progress
                          value={notification.acknowledgmentProgress?.percentage || 0}
                          className="h-3"
                        />
                        <div className="flex justify-between text-sm">
                          <span>
                            {notification.acknowledged_count} of{' '}
                            {notification.min_acknowledgments_required} required
                          </span>
                          <span className="font-medium">
                            {notification.acknowledgmentProgress?.percentage?.toFixed(0) || 0}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Acknowledgments Received</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {notification.acknowledgmentProgress?.acknowledgedBy?.length > 0 ? (
                        <div className="space-y-3">
                          {notification.acknowledgmentProgress.acknowledgedBy.map((ack, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="font-medium text-sm">{ack.userName}</p>
                                  <p className="text-xs text-gray-500 capitalize">
                                    {ack.userRole.replace(/_/g, ' ')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm">
                                  {formatDistanceToNow(new Date(ack.acknowledgedAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Response time: {ack.responseTime}s
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No acknowledgments received yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="escalations" className="space-y-4 mt-4">
              {notification.escalationHistory && notification.escalationHistory.length > 0 ? (
                notification.escalationHistory.map((escalation, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        Escalation Level {escalation.level}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Reason:</span>
                          <p className="font-medium capitalize">
                            {escalation.reason.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <Badge variant="outline" className="mt-1">
                            {escalation.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-600">Triggered:</span>
                          <p>{format(new Date(escalation.triggeredAt), 'PPpp')}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Targets:</span>
                          <p>{escalation.targetCount} recipients</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No escalations have occurred</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Delivery Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {notification.delivery_channels.map((channel) => (
                      <div
                        key={channel}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        {getChannelIcon(channel)}
                        <span className="capitalize text-sm">{channel.replace(/_/g, ' ')}</span>
                        <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {notification.attachments && notification.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Attachments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {notification.attachments.map((attachment: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{attachment.filename}</span>
                            {attachment.is_medical_report && (
                              <Badge variant="secondary" className="text-xs">
                                Medical Report
                              </Badge>
                            )}
                          </div>
                          <Button size="sm" variant="ghost">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <div className="w-full space-y-3">
            {/* Acknowledgment Form */}
            {showAcknowledgeForm && (
              <div className="space-y-3 p-4 border rounded-lg">
                <Label>Acknowledgment Message (Optional)</Label>
                <Textarea
                  value={acknowledgmentMessage}
                  onChange={(e) => setAcknowledgmentMessage(e.target.value)}
                  placeholder="Add any notes or comments..."
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAcknowledgeForm(false)}
                    disabled={isAcknowledging}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAcknowledge} disabled={isAcknowledging}>
                    {isAcknowledging ? 'Acknowledging...' : 'Confirm Acknowledgment'}
                  </Button>
                </div>
              </div>
            )}

            {/* Escalation Form */}
            {showEscalateForm && (
              <div className="space-y-3 p-4 border rounded-lg">
                <Label>Escalation Message</Label>
                <Textarea
                  value={escalationMessage}
                  onChange={(e) => setEscalationMessage(e.target.value)}
                  placeholder="Reason for manual escalation..."
                  rows={3}
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEscalateForm(false)}
                    disabled={isEscalating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEscalate}
                    disabled={isEscalating || !escalationMessage.trim()}
                  >
                    {isEscalating ? 'Escalating...' : 'Confirm Escalation'}
                  </Button>
                </div>
              </div>
            )}

            {/* Resolution Form */}
            {showResolveForm && (
              <div className="space-y-3 p-4 border rounded-lg">
                <Label>Resolution Notes</Label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="How was this notification resolved?"
                  rows={3}
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowResolveForm(false)}
                    disabled={isResolving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleResolve}
                    disabled={isResolving || !resolutionNotes.trim()}
                  >
                    {isResolving ? 'Resolving...' : 'Confirm Resolution'}
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!showAcknowledgeForm && !showEscalateForm && !showResolveForm && (
              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <div className="flex gap-2">
                  {notification.requires_acknowledgment &&
                    !isUserAcknowledged() &&
                    notification.status !== MedicalNotificationStatus.RESOLVED && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAcknowledgeForm(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Acknowledge
                      </Button>
                    )}
                  {userRole === 'medical_staff' &&
                    notification.status === MedicalNotificationStatus.DELIVERED && (
                      <Button
                        variant="outline"
                        onClick={() => setShowEscalateForm(true)}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Escalate
                      </Button>
                    )}
                  {userRole === 'medical_staff' &&
                    notification.status !== MedicalNotificationStatus.RESOLVED && (
                      <Button onClick={() => setShowResolveForm(true)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                </div>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UrgentNotificationDetails;