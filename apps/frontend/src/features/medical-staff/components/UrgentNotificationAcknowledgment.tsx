'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  User,
  Phone,
  MessageSquare,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Send,
  FileText,
  Download,
  Lock,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { 
  UrgentMedicalNotification, 
  UrgencyLevel, 
  AcknowledgmentMethod,
  DeliveryChannel 
} from '../types/urgent-notification';

interface UrgentNotificationAcknowledgmentProps {
  notification: UrgentMedicalNotification;
  userId: string;
  userName: string;
  userRole: string;
  onAcknowledge?: (acknowledgmentData: any) => void;
  onClose?: () => void;
}

export const UrgentNotificationAcknowledgment: React.FC<UrgentNotificationAcknowledgmentProps> = ({
  notification,
  userId,
  userName,
  userRole,
  onAcknowledge,
  onClose,
}) => {
  const { toast } = useToast();
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [acknowledgmentMethod, setAcknowledgmentMethod] = useState<AcknowledgmentMethod>(
    AcknowledgmentMethod.IN_APP
  );
  const [responseMessage, setResponseMessage] = useState('');
  const [viewedAttachments, setViewedAttachments] = useState(false);
  const [showMedicalData, setShowMedicalData] = useState(false);
  const [pin, setPin] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [additionalActions, setAdditionalActions] = useState({
    viewedAttachments: false,
    addedNotes: false,
    initiatedCall: false,
  });

  // Calculate time since notification was sent
  const timeSinceSent = notification.sentAt 
    ? Math.floor((Date.now() - new Date(notification.sentAt).getTime()) / 1000)
    : null;

  const getUrgencyIcon = (level: UrgencyLevel) => {
    switch (level) {
      case UrgencyLevel.EMERGENCY:
        return <AlertTriangle className="h-5 w-5" />;
      case UrgencyLevel.CRITICAL:
        return <AlertCircle className="h-5 w-5" />;
      case UrgencyLevel.URGENT:
        return <Info className="h-5 w-5" />;
    }
  };

  const getUrgencyColor = (level: UrgencyLevel) => {
    switch (level) {
      case UrgencyLevel.EMERGENCY:
        return 'destructive';
      case UrgencyLevel.CRITICAL:
        return 'warning';
      case UrgencyLevel.URGENT:
        return 'default';
    }
  };

  const handleAcknowledge = async () => {
    // Validate PIN if required
    if (notification.privacySettings?.requirePinForAccess && !isPinVerified) {
      toast({
        title: 'PIN Required',
        description: 'Please enter the PIN to acknowledge this notification',
        variant: 'destructive',
      });
      return;
    }

    setIsAcknowledging(true);

    try {
      const acknowledgmentData = {
        notificationId: notification.id,
        userId,
        userName,
        userRole,
        method: acknowledgmentMethod,
        message: responseMessage,
        deviceInfo: {
          userAgent: navigator.userAgent,
          deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          location: await getCurrentLocation(),
        },
        isEmergencyContact: false,
        additionalActions: {
          ...additionalActions,
          viewedAttachments,
        },
      };

      if (onAcknowledge) {
        await onAcknowledge(acknowledgmentData);
      }

      toast({
        title: 'Acknowledged',
        description: 'You have successfully acknowledged this urgent notification',
      });

      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAcknowledging(false);
    }
  };

  const getCurrentLocation = async (): Promise<any> => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch {
      return null;
    }
  };

  const verifyPin = () => {
    // In production, this would verify against a backend
    if (pin === '1234') {
      setIsPinVerified(true);
      toast({
        title: 'PIN Verified',
        description: 'You can now view medical information',
      });
    } else {
      toast({
        title: 'Invalid PIN',
        description: 'Please enter the correct PIN',
        variant: 'destructive',
      });
    }
  };

  const formatTimeElapsed = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    return `${Math.floor(seconds / 3600)} hours`;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className={notification.urgencyLevel === UrgencyLevel.EMERGENCY ? 'bg-red-50' : ''}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              Urgent Medical Notification
            </CardTitle>
            <CardDescription className="mt-2">
              Immediate acknowledgment required
            </CardDescription>
          </div>
          <Badge variant={getUrgencyColor(notification.urgencyLevel)} className="text-base px-3 py-1">
            {getUrgencyIcon(notification.urgencyLevel)}
            <span className="ml-2">{notification.urgencyLevel.toUpperCase()}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Notification Header */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{notification.title}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>From: Medical Staff</span>
            <span>•</span>
            <span>Sent: {notification.sentAt && format(new Date(notification.sentAt), 'PPp')}</span>
            {timeSinceSent && (
              <>
                <span>•</span>
                <span className="text-orange-600 font-medium">
                  {formatTimeElapsed(timeSinceSent)} ago
                </span>
              </>
            )}
          </div>
        </div>

        {/* Acknowledgment Progress */}
        {notification.minAcknowledgmentsRequired > 1 && (
          <Alert>
            <AlertTitle>Acknowledgment Progress</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <Progress 
                value={(notification.acknowledgedCount / notification.minAcknowledgmentsRequired) * 100} 
                className="h-3"
              />
              <p className="text-sm">
                {notification.acknowledgedCount} of {notification.minAcknowledgmentsRequired} required acknowledgments received
              </p>
              {notification.escalationLevel > 0 && (
                <Badge variant="secondary" className="mt-1">
                  Escalated to Level {notification.escalationLevel}
                </Badge>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Message */}
        <Alert className={notification.urgencyLevel === UrgencyLevel.EMERGENCY ? 'border-red-300' : ''}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Message</AlertTitle>
          <AlertDescription className="mt-2 whitespace-pre-wrap">
            {notification.message}
          </AlertDescription>
        </Alert>

        {/* Medical Information */}
        {notification.medicalData && (
          <Accordion type="single" collapsible>
            <AccordionItem value="medical-info">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Medical Information
                  {notification.privacySettings?.requirePinForAccess && !isPinVerified && (
                    <Lock className="h-3 w-3 ml-1" />
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {notification.privacySettings?.requirePinForAccess && !isPinVerified ? (
                  <div className="space-y-3">
                    <Alert>
                      <Lock className="h-4 w-4" />
                      <AlertTitle>PIN Required</AlertTitle>
                      <AlertDescription>
                        This notification contains protected health information. Enter PIN to view.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="Enter PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="max-w-xs"
                      />
                      <Button onClick={verifyPin}>Verify</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notification.medicalData.medications && (
                      <div>
                        <h5 className="font-medium mb-2">Medications</h5>
                        <div className="space-y-1">
                          {notification.medicalData.medications.map((med, idx) => (
                            <div key={idx} className="text-sm">
                              • {med.name} - {med.dosage} ({med.frequency})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {notification.medicalData.restrictions && (
                      <div>
                        <h5 className="font-medium mb-2">Activity Restrictions</h5>
                        <div className="space-y-1">
                          {notification.medicalData.restrictions.map((restriction, idx) => (
                            <div key={idx} className="text-sm">
                              • {restriction}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {notification.medicalData.protocols && (
                      <div>
                        <h5 className="font-medium mb-2">Protocols to Follow</h5>
                        <div className="space-y-1">
                          {notification.medicalData.protocols.map((protocol, idx) => (
                            <div key={idx} className="text-sm">
                              • {protocol}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Attachments */}
        {notification.attachments && notification.attachments.length > 0 && (
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="space-y-2">
              {notification.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{attachment.filename}</span>
                    {attachment.isMedicalReport && (
                      <Badge variant="secondary" className="text-xs">Medical Report</Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewedAttachments(true);
                      setAdditionalActions(prev => ({ ...prev, viewedAttachments: true }));
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acknowledgment Method */}
        <div className="space-y-3">
          <Label>How are you acknowledging this notification?</Label>
          <RadioGroup
            value={acknowledgmentMethod}
            onValueChange={(value) => setAcknowledgmentMethod(value as AcknowledgmentMethod)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={AcknowledgmentMethod.IN_APP} id="in-app" />
              <Label htmlFor="in-app" className="font-normal">In-app acknowledgment</Label>
            </div>
            {notification.deliveryChannels.includes(DeliveryChannel.SMS) && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={AcknowledgmentMethod.SMS_REPLY} id="sms" />
                <Label htmlFor="sms" className="font-normal">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    SMS reply
                  </div>
                </Label>
              </div>
            )}
            {notification.deliveryChannels.includes(DeliveryChannel.PHONE) && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={AcknowledgmentMethod.PHONE_CONFIRMATION} id="phone" />
                <Label htmlFor="phone" className="font-normal">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Phone confirmation
                  </div>
                </Label>
              </div>
            )}
          </RadioGroup>
        </div>

        {/* Response Message */}
        <div className="space-y-2">
          <Label htmlFor="response">Response Message (Optional)</Label>
          <Textarea
            id="response"
            placeholder="Add any additional information or questions..."
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            rows={3}
          />
        </div>

        {/* Additional Actions */}
        <div className="space-y-2">
          <Label>Additional Actions</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notes"
                checked={additionalActions.addedNotes}
                onCheckedChange={(checked) =>
                  setAdditionalActions(prev => ({ ...prev, addedNotes: checked as boolean }))
                }
              />
              <Label htmlFor="notes" className="font-normal">
                I have added this to the patient's notes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="call"
                checked={additionalActions.initiatedCall}
                onCheckedChange={(checked) =>
                  setAdditionalActions(prev => ({ ...prev, initiatedCall: checked as boolean }))
                }
              />
              <Label htmlFor="call" className="font-normal">
                I have contacted the relevant parties
              </Label>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        {notification.medicalData?.emergencyContacts && (
          <Alert>
            <Phone className="h-4 w-4" />
            <AlertTitle>Emergency Contacts</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                {notification.medicalData.emergencyContacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">
                      {contact.name} ({contact.relationship})
                    </span>
                    <a href={`tel:${contact.phone}`} className="text-sm font-medium text-blue-600">
                      {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <Separator />
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {notification.requiresAcknowledgment && notification.acknowledgmentTimeoutMinutes && (
              <span className="text-orange-600">
                Acknowledgment required within {notification.acknowledgmentTimeoutMinutes} minutes
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={isAcknowledging}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleAcknowledge}
              disabled={isAcknowledging}
              className={
                notification.urgencyLevel === UrgencyLevel.EMERGENCY
                  ? 'bg-red-600 hover:bg-red-700'
                  : notification.urgencyLevel === UrgencyLevel.CRITICAL
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : ''
              }
            >
              {isAcknowledging ? (
                'Acknowledging...'
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Acknowledge Notification
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};