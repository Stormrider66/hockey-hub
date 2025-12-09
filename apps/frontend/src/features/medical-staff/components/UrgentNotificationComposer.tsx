'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Send, 
  Users, 
  User, 
  Building2,
  Clock,
  Shield,
  Paperclip,
  Phone,
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  UserPlus,
  ChevronDown,
  X,
  Info,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  UrgencyLevel,
  MedicalInfoType,
  NotificationTargetType,
  DeliveryChannel,
  CreateUrgentNotificationDto,
} from '../types/urgent-notification';
import { useCreateUrgentNotificationMutation } from '@/store/api/urgentMedicalApi';

interface EscalationLevel {
  level: number;
  delayMinutes: number;
  notifyRoles: string[];
  useEmergencyContacts: boolean;
  deliveryChannels: DeliveryChannel[];
}

interface UrgentNotificationComposerProps {
  onClose?: () => void;
  onSubmit?: (notification: CreateUrgentNotificationDto) => void;
  defaultPlayerId?: string;
  defaultTeamId?: string;
}

export const UrgentNotificationComposer: React.FC<UrgentNotificationComposerProps> = ({
  onClose,
  onSubmit,
  defaultPlayerId,
  defaultTeamId,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>(UrgencyLevel.URGENT);
  const [medicalType, setMedicalType] = useState<MedicalInfoType>(MedicalInfoType.INJURY_ALERT);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<NotificationTargetType>(
    defaultPlayerId ? NotificationTargetType.PLAYER : NotificationTargetType.TEAM
  );
  const [targetId, setTargetId] = useState(defaultPlayerId || defaultTeamId || '');
  const [customRecipients, setCustomRecipients] = useState<string[]>([]);
  const [deliveryChannels, setDeliveryChannels] = useState<DeliveryChannel[]>([
    DeliveryChannel.IN_APP,
    DeliveryChannel.EMAIL,
  ]);
  
  // Advanced settings
  const [requiresAcknowledgment, setRequiresAcknowledgment] = useState(true);
  const [acknowledgmentTimeout, setAcknowledgmentTimeout] = useState(30);
  const [minAcknowledgments, setMinAcknowledgments] = useState(1);
  const [enableEscalation, setEnableEscalation] = useState(true);
  const [escalationLevels, setEscalationLevels] = useState<EscalationLevel[]>([
    {
      level: 1,
      delayMinutes: 15,
      notifyRoles: ['coach', 'medical_director'],
      useEmergencyContacts: false,
      deliveryChannels: [DeliveryChannel.EMAIL, DeliveryChannel.SMS],
    },
    {
      level: 2,
      delayMinutes: 30,
      notifyRoles: ['admin', 'emergency_contact'],
      useEmergencyContacts: true,
      deliveryChannels: [DeliveryChannel.EMAIL, DeliveryChannel.SMS, DeliveryChannel.PHONE],
    },
  ]);
  
  // Privacy settings
  const [restrictToMedicalStaff, setRestrictToMedicalStaff] = useState(false);
  const [requirePin, setRequirePin] = useState(false);
  const [autoDeleteHours, setAutoDeleteHours] = useState(48);
  
  // Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  
  // Medical data
  const [includeVitals, setIncludeVitals] = useState(false);
  const [includeMedications, setIncludeMedications] = useState(false);
  const [includeRestrictions, setIncludeRestrictions] = useState(false);
  
  const getUrgencyIcon = (level: UrgencyLevel) => {
    switch (level) {
      case UrgencyLevel.EMERGENCY:
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case UrgencyLevel.CRITICAL:
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case UrgencyLevel.URGENT:
        return <Info className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getUrgencyColor = (level: UrgencyLevel) => {
    switch (level) {
      case UrgencyLevel.EMERGENCY:
        return 'bg-red-100 text-red-800 border-red-300';
      case UrgencyLevel.CRITICAL:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case UrgencyLevel.URGENT:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const handleChannelToggle = (channel: DeliveryChannel) => {
    setDeliveryChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!title || !message) {
      toast({
        title: 'Validation Error',
        description: 'Title and message are required',
        variant: 'destructive',
      });
      return;
    }

    if (deliveryChannels.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one delivery channel must be selected',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const notificationData = {
      urgencyLevel,
      medicalType,
      title,
      message,
      targetType,
      targetId: targetType === NotificationTargetType.CUSTOM_GROUP ? undefined : targetId,
      customRecipientIds: targetType === NotificationTargetType.CUSTOM_GROUP ? customRecipients : undefined,
      deliveryChannels,
      requiresAcknowledgment,
      acknowledgmentTimeoutMinutes: requiresAcknowledgment ? acknowledgmentTimeout : undefined,
      minAcknowledgmentsRequired: requiresAcknowledgment ? minAcknowledgments : undefined,
      enableEscalation,
      escalationConfig: enableEscalation ? { levels: escalationLevels } : undefined,
      privacySettings: {
        restrict_to_medical_staff: restrictToMedicalStaff,
        require_pin_for_access: requirePin,
        auto_delete_after_hours: autoDeleteHours,
      },
      attachments,
      medicalData: {
        includeVitals,
        includeMedications,
        includeRestrictions,
      },
      expiresInHours: 24,
    };

    try {
      // Call API or parent handler
      if (onSubmit) {
        await onSubmit(notificationData);
      }

      toast({
        title: 'Notification Sent',
        description: `${urgencyLevel.toUpperCase()} notification has been sent successfully`,
      });

      // Close modal if provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send urgent notification',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          Urgent Medical Notification
        </CardTitle>
        <CardDescription>
          Send critical health alerts that require immediate attention and acknowledgment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="escalation">Escalation</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Urgency Level */}
            <div className="space-y-2">
              <Label>Urgency Level</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(UrgencyLevel).map((level) => (
                  <button
                    key={level}
                    onClick={() => setUrgencyLevel(level)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      urgencyLevel === level
                        ? getUrgencyColor(level) + ' border-current'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {getUrgencyIcon(level)}
                      <span className="font-medium capitalize">{level}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Medical Type */}
            <div className="space-y-2">
              <Label htmlFor="medical-type">Medical Type</Label>
              <Select value={medicalType} onValueChange={(value) => setMedicalType(value as MedicalInfoType)}>
                <SelectTrigger id="medical-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MedicalInfoType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief, clear title for the notification"
                className={urgencyLevel === UrgencyLevel.EMERGENCY ? 'border-red-300' : ''}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Detailed message with clear instructions..."
                rows={4}
                className={urgencyLevel === UrgencyLevel.EMERGENCY ? 'border-red-300' : ''}
              />
            </div>

            {/* Medical Data Options */}
            <div className="space-y-2">
              <Label>Include Medical Information</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vitals"
                    checked={includeVitals}
                    onCheckedChange={setIncludeVitals}
                  />
                  <Label htmlFor="vitals" className="font-normal">
                    Include vital signs and health metrics
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="medications"
                    checked={includeMedications}
                    onCheckedChange={setIncludeMedications}
                  />
                  <Label htmlFor="medications" className="font-normal">
                    Include current medications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restrictions"
                    checked={includeRestrictions}
                    onCheckedChange={setIncludeRestrictions}
                  />
                  <Label htmlFor="restrictions" className="font-normal">
                    Include activity restrictions
                  </Label>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label>Attachments</Label>
              <Button variant="outline" className="w-full">
                <Paperclip className="h-4 w-4 mr-2" />
                Add Medical Reports or Instructions
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="recipients" className="space-y-4">
            {/* Target Type */}
            <div className="space-y-2">
              <Label>Notification Target</Label>
              <Select value={targetType} onValueChange={(value) => setTargetType(value as NotificationTargetType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NotificationTargetType.PLAYER}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Specific Player
                    </div>
                  </SelectItem>
                  <SelectItem value={NotificationTargetType.TEAM}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Entire Team
                    </div>
                  </SelectItem>
                  <SelectItem value={NotificationTargetType.ORGANIZATION}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Entire Organization
                    </div>
                  </SelectItem>
                  <SelectItem value={NotificationTargetType.CUSTOM_GROUP}>
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Custom Recipients
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Selection */}
            {targetType === NotificationTargetType.PLAYER && (
              <div className="space-y-2">
                <Label htmlFor="player">Select Player</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger id="player">
                    <SelectValue placeholder="Choose a player" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Player list would be populated from API */}
                    <SelectItem value="player1">John Smith</SelectItem>
                    <SelectItem value="player2">Jane Doe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {targetType === NotificationTargetType.TEAM && (
              <div className="space-y-2">
                <Label htmlFor="team">Select Team</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Team list would be populated from API */}
                    <SelectItem value="team1">U16 Elite</SelectItem>
                    <SelectItem value="team2">U18 AAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {targetType === NotificationTargetType.CUSTOM_GROUP && (
              <div className="space-y-2">
                <Label>Custom Recipients</Label>
                <div className="space-y-2">
                  <Input placeholder="Search and add recipients..." />
                  <div className="text-sm text-muted-foreground">
                    Selected: {customRecipients.length} recipients
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Privacy Settings</AlertTitle>
              <AlertDescription>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="medical-only" className="font-normal">
                      Restrict to medical staff only
                    </Label>
                    <Switch
                      id="medical-only"
                      checked={restrictToMedicalStaff}
                      onCheckedChange={setRestrictToMedicalStaff}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-pin" className="font-normal">
                      Require PIN for access
                    </Label>
                    <Switch
                      id="require-pin"
                      checked={requirePin}
                      onCheckedChange={setRequirePin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auto-delete" className="font-normal">
                      Auto-delete after {autoDeleteHours} hours
                    </Label>
                    <Slider
                      id="auto-delete"
                      min={24}
                      max={168}
                      step={24}
                      value={[autoDeleteHours]}
                      onValueChange={(value) => setAutoDeleteHours(value[0])}
                    />
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            {/* Delivery Channels */}
            <div className="space-y-2">
              <Label>Delivery Channels</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    deliveryChannels.includes(DeliveryChannel.IN_APP)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleChannelToggle(DeliveryChannel.IN_APP)}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <span>In-App</span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    deliveryChannels.includes(DeliveryChannel.EMAIL)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleChannelToggle(DeliveryChannel.EMAIL)}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    <span>Email</span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    deliveryChannels.includes(DeliveryChannel.SMS)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleChannelToggle(DeliveryChannel.SMS)}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>SMS</span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    deliveryChannels.includes(DeliveryChannel.PUSH)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleChannelToggle(DeliveryChannel.PUSH)}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    <span>Push</span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    deliveryChannels.includes(DeliveryChannel.PHONE)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }${urgencyLevel !== UrgencyLevel.EMERGENCY ? ' opacity-50' : ''}`}
                  onClick={() => {
                    if (urgencyLevel === UrgencyLevel.EMERGENCY) {
                      handleChannelToggle(DeliveryChannel.PHONE);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    <span>Phone Call</span>
                  </div>
                  {urgencyLevel !== UrgencyLevel.EMERGENCY && (
                    <div className="text-xs text-gray-500 mt-1">Emergency only</div>
                  )}
                </div>
              </div>
            </div>

            {/* Acknowledgment Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="require-ack" className="font-medium">
                  Require Acknowledgment
                </Label>
                <Switch
                  id="require-ack"
                  checked={requiresAcknowledgment}
                  onCheckedChange={setRequiresAcknowledgment}
                />
              </div>

              {requiresAcknowledgment && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ack-timeout">
                      Acknowledgment Timeout (minutes)
                    </Label>
                    <Input
                      id="ack-timeout"
                      type="number"
                      min={5}
                      max={120}
                      value={acknowledgmentTimeout}
                      onChange={(e) => setAcknowledgmentTimeout(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-acks">
                      Minimum Acknowledgments Required
                    </Label>
                    <Input
                      id="min-acks"
                      type="number"
                      min={1}
                      value={minAcknowledgments}
                      onChange={(e) => setMinAcknowledgments(parseInt(e.target.value))}
                    />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="escalation" className="space-y-4">
            {/* Enable Escalation */}
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-escalation" className="font-medium">
                Enable Automatic Escalation
              </Label>
              <Switch
                id="enable-escalation"
                checked={enableEscalation}
                onCheckedChange={setEnableEscalation}
              />
            </div>

            {enableEscalation && (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Escalation Process</AlertTitle>
                  <AlertDescription>
                    If acknowledgment is not received within the timeout period, the notification will automatically escalate to additional recipients.
                  </AlertDescription>
                </Alert>

                {/* Escalation Levels */}
                {escalationLevels.map((level, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Level {level.level} Escalation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Delay (minutes)</Label>
                          <Input
                            type="number"
                            value={level.delayMinutes}
                            onChange={(e) => {
                              const newLevels = [...escalationLevels];
                              newLevels[index].delayMinutes = parseInt(e.target.value);
                              setEscalationLevels(newLevels);
                            }}
                            min={5}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Notify Roles</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {level.notifyRoles.map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={level.useEmergencyContacts}
                          onCheckedChange={(checked) => {
                            const newLevels = [...escalationLevels];
                            newLevels[index].useEmergencyContacts = checked as boolean;
                            setEscalationLevels(newLevels);
                          }}
                        />
                        <Label className="text-sm font-normal">
                          Contact emergency contacts
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            {urgencyLevel === UrgencyLevel.EMERGENCY && (
              <Badge variant="destructive" className="animate-pulse">
                EMERGENCY NOTIFICATION
              </Badge>
            )}
            {urgencyLevel === UrgencyLevel.CRITICAL && (
              <Badge className="bg-orange-600">
                CRITICAL NOTIFICATION
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={
                urgencyLevel === UrgencyLevel.EMERGENCY
                  ? 'bg-red-600 hover:bg-red-700'
                  : urgencyLevel === UrgencyLevel.CRITICAL
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : ''
              }
            >
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Urgent Notification
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};