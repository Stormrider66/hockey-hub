import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  type NotificationPreference,
  type NotificationType,
  type NotificationChannel,
} from '@/store/api/notificationApi';
import { LoadingSkeleton } from '@/components/ui/loading';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NOTIFICATION_CATEGORIES: {
  category: string;
  types: { value: NotificationType; label: string; description: string }[];
}[] = [
  {
    category: 'Messages & Chat',
    types: [
      { value: 'MESSAGE', label: 'New Messages', description: 'When you receive a new message' },
      { value: 'MENTION', label: 'Mentions', description: 'When someone mentions you in a conversation' },
      { value: 'REACTION', label: 'Reactions', description: 'When someone reacts to your message' },
    ],
  },
  {
    category: 'Calendar & Schedule',
    types: [
      { value: 'CALENDAR_REMINDER', label: 'Event Reminders', description: 'Reminders for upcoming events' },
      { value: 'CALENDAR_UPDATE', label: 'Event Updates', description: 'When events are changed or updated' },
      { value: 'CALENDAR_CONFLICT', label: 'Schedule Conflicts', description: 'When scheduling conflicts occur' },
    ],
  },
  {
    category: 'Training',
    types: [
      { value: 'TRAINING_SCHEDULED', label: 'New Sessions', description: 'When training sessions are scheduled' },
      { value: 'TRAINING_UPDATED', label: 'Session Updates', description: 'When sessions are modified' },
      { value: 'TRAINING_CANCELLED', label: 'Cancellations', description: 'When sessions are cancelled' },
      { value: 'TRAINING_REMINDER', label: 'Session Reminders', description: 'Reminders for upcoming sessions' },
    ],
  },
  {
    category: 'Medical',
    types: [
      { value: 'MEDICAL_APPOINTMENT', label: 'Appointments', description: 'Medical appointment notifications' },
      { value: 'MEDICAL_UPDATE', label: 'Medical Updates', description: 'Updates to medical status' },
      { value: 'MEDICAL_ALERT', label: 'Medical Alerts', description: 'Important medical alerts' },
    ],
  },
  {
    category: 'Equipment',
    types: [
      { value: 'EQUIPMENT_READY', label: 'Equipment Ready', description: 'When equipment is ready for pickup' },
      { value: 'EQUIPMENT_MAINTENANCE', label: 'Maintenance', description: 'Equipment maintenance notifications' },
      { value: 'EQUIPMENT_REQUEST', label: 'Equipment Requests', description: 'Status of equipment requests' },
    ],
  },
  {
    category: 'General',
    types: [
      { value: 'ANNOUNCEMENT', label: 'Announcements', description: 'Team and organization announcements' },
      { value: 'ALERT', label: 'System Alerts', description: 'Important system alerts and warnings' },
      { value: 'SYSTEM', label: 'System Messages', description: 'General system notifications' },
    ],
  },
];

const CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: 'IN_APP', label: 'In-App' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PUSH', label: 'Push' },
];

const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: preferences, isLoading, refetch } = useGetNotificationPreferencesQuery();
  const [updatePreferences, { isLoading: isSaving }] = useUpdateNotificationPreferencesMutation();
  
  const [localPreferences, setLocalPreferences] = useState<Record<string, NotificationPreference>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local preferences from fetched data
  useEffect(() => {
    if (preferences) {
      const prefsMap: Record<string, NotificationPreference> = {};
      preferences.forEach((pref) => {
        const key = `${pref.notificationType}-${pref.channel}`;
        prefsMap[key] = pref;
      });
      setLocalPreferences(prefsMap);
    }
  }, [preferences]);

  const getPreference = (type: NotificationType, channel: NotificationChannel): NotificationPreference => {
    const key = `${type}-${channel}`;
    return localPreferences[key] || {
      id: key,
      userId: localStorage.getItem('current_user_id') || '',
      notificationType: type,
      channel,
      enabled: channel === 'IN_APP', // Default to enabled for in-app
    };
  };

  const handleToggle = (type: NotificationType, channel: NotificationChannel, enabled: boolean) => {
    const key = `${type}-${channel}`;
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: {
        ...getPreference(type, channel),
        enabled,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const preferencesToSave = Object.values(localPreferences);
      await updatePreferences(preferencesToSave).unwrap();
      toast.success('Notification preferences saved');
      setHasChanges(false);
      refetch();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
          <DialogDescription>
            Choose how you want to receive notifications for different types of events
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="p-4">
            <LoadingSkeleton type="messages" count={5} />
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {/* Global settings header */}
              <div className="grid grid-cols-4 gap-4 pb-2 border-b">
                <div className="col-span-1"></div>
                {CHANNELS.map((channel) => (
                  <div key={channel.value} className="text-center">
                    <Label className="text-sm font-medium">{channel.label}</Label>
                  </div>
                ))}
              </div>

              {/* Categories */}
              {NOTIFICATION_CATEGORIES.map((category) => (
                <div key={category.category} className="space-y-4">
                  <h3 className="font-semibold text-sm">{category.category}</h3>
                  
                  {category.types.map((type) => (
                    <div key={type.value} className="grid grid-cols-4 gap-4 items-center">
                      <div className="col-span-1">
                        <Label className="text-sm font-medium">{type.label}</Label>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                      
                      {CHANNELS.map((channel) => {
                        const pref = getPreference(type.value, channel.value);
                        const isDisabled = channel.value === 'SMS' || 
                          (channel.value === 'PUSH' && !('Notification' in window));
                        
                        return (
                          <div key={channel.value} className="flex justify-center">
                            <Switch
                              checked={pref.enabled}
                              onCheckedChange={(checked) => 
                                handleToggle(type.value, channel.value, checked)
                              }
                              disabled={isDisabled || isSaving}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  
                  {category !== NOTIFICATION_CATEGORIES[NOTIFICATION_CATEGORIES.length - 1] && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasChanges && (
              <Badge variant="secondary">Unsaved changes</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPreferencesModal;