'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { NotificationType, NotificationChannel } from '../types';

interface NotificationPreferencesProps {
  userId: string;
  organizationId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const notificationCategories = [
  {
    id: 'calendar',
    label: 'Calendar Events',
    icon: Bell,
    types: [
      { type: 'event_reminder', label: 'Event Reminders' },
      { type: 'event_created', label: 'New Events' },
      { type: 'event_updated', label: 'Event Updates' },
      { type: 'event_cancelled', label: 'Event Cancellations' },
      { type: 'rsvp_request', label: 'RSVP Requests' },
      { type: 'schedule_conflict', label: 'Schedule Conflicts' },
    ]
  },
  {
    id: 'training',
    label: 'Training',
    icon: Bell,
    types: [
      { type: 'training_assigned', label: 'Training Assigned' },
      { type: 'training_completed', label: 'Training Completed' },
      { type: 'training_overdue', label: 'Training Overdue' },
    ]
  },
  {
    id: 'medical',
    label: 'Medical',
    icon: Bell,
    types: [
      { type: 'medical_appointment', label: 'Medical Appointments' },
      { type: 'injury_update', label: 'Injury Updates' },
      { type: 'medical_clearance', label: 'Medical Clearance' },
    ]
  },
  {
    id: 'equipment',
    label: 'Equipment',
    icon: Bell,
    types: [
      { type: 'equipment_due', label: 'Equipment Due' },
      { type: 'equipment_ready', label: 'Equipment Ready' },
      { type: 'maintenance_required', label: 'Maintenance Required' },
    ]
  },
  {
    id: 'general',
    label: 'General',
    icon: Bell,
    types: [
      { type: 'announcement', label: 'Announcements' },
      { type: 'system_alert', label: 'System Alerts' },
      { type: 'payment_due', label: 'Payment Due' },
      { type: 'team_update', label: 'Team Updates' },
    ]
  },
];

const channels = [
  { id: 'in_app', label: 'In-App', icon: Bell },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'push', label: 'Push', icon: Smartphone },
];

export function NotificationPreferences({ 
  userId, 
  organizationId, 
  isOpen, 
  onClose 
}: NotificationPreferencesProps) {
  const { preferences, updatePreferences, isLoading } = useNotificationPreferences(userId, organizationId);
  const [localPreferences, setLocalPreferences] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      const prefMap: any = {};
      preferences.forEach(pref => {
        const key = `${pref.type}_${pref.channel}`;
        prefMap[key] = pref;
      });
      setLocalPreferences(prefMap);
    }
  }, [preferences]);

  const getPreference = (type: NotificationType, channel: NotificationChannel) => {
    const key = `${type}_${channel}`;
    return localPreferences[key] || {
      type,
      channel,
      is_enabled: true,
      reminder_minutes_before: channel === 'email' ? 60 : 15,
      send_immediately: false,
      send_daily_digest: false,
      send_weekly_digest: false,
    };
  };

  const updatePreference = (type: NotificationType, channel: NotificationChannel, updates: any) => {
    const key = `${type}_${channel}`;
    setLocalPreferences(prev => ({
      ...prev,
      [key]: {
        ...getPreference(type, channel),
        ...updates,
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const preferencesToSave = Object.values(localPreferences);
    await updatePreferences(preferencesToSave);
    setHasChanges(false);
    onClose();
  };

  const toggleCategoryChannel = (category: typeof notificationCategories[0], channel: NotificationChannel, enabled: boolean) => {
    category.types.forEach(({ type }) => {
      updatePreference(type as NotificationType, channel, { is_enabled: enabled });
    });
  };

  const isCategoryChannelEnabled = (category: typeof notificationCategories[0], channel: NotificationChannel) => {
    return category.types.every(({ type }) => 
      getPreference(type as NotificationType, channel).is_enabled
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="digest">Digest</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-96 mt-4">
            <TabsContent value="channels" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Channel Headers */}
                <div className="grid grid-cols-5 gap-4 items-center pb-2 border-b">
                  <div className="font-medium">Category</div>
                  {channels.map(channel => (
                    <div key={channel.id} className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <channel.icon className="h-4 w-4" />
                        <span className="text-sm">{channel.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Category Preferences */}
                {notificationCategories.map(category => (
                  <div key={category.id} className="space-y-3">
                    {/* Category Toggle */}
                    <div className="grid grid-cols-5 gap-4 items-center py-2 bg-muted/50 rounded-lg px-3">
                      <div className="font-medium flex items-center gap-2">
                        <category.icon className="h-4 w-4" />
                        {category.label}
                      </div>
                      {channels.map(channel => (
                        <div key={channel.id} className="flex justify-center">
                          <Switch
                            checked={isCategoryChannelEnabled(category, channel.id as NotificationChannel)}
                            onCheckedChange={(checked) => 
                              toggleCategoryChannel(category, channel.id as NotificationChannel, checked)
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {/* Individual Type Preferences */}
                    {category.types.map(({ type, label }) => (
                      <div key={type} className="grid grid-cols-5 gap-4 items-center py-1 pl-6">
                        <div className="text-sm text-muted-foreground">{label}</div>
                        {channels.map(channel => (
                          <div key={channel.id} className="flex justify-center">
                            <Switch
                              checked={getPreference(type as NotificationType, channel.id as NotificationChannel).is_enabled}
                              onCheckedChange={(checked) => 
                                updatePreference(type as NotificationType, channel.id as NotificationChannel, { is_enabled: checked })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="timing" className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Reminder Timing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Reminders (minutes before)</Label>
                    <Select defaultValue="60">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="1440">1 day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Push Notifications (minutes before)</Label>
                    <Select defaultValue="15">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Quiet Hours</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input type="time" defaultValue="22:00" />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input type="time" defaultValue="08:00" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="digest" className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Digest Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Daily Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a daily summary of all notifications
                      </p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of activities
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>

                  <div className="space-y-2">
                    <Label>Digest Time</Label>
                    <Select defaultValue="09:00">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="07:00">7:00 AM</SelectItem>
                        <SelectItem value="08:00">8:00 AM</SelectItem>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="18:00">6:00 PM</SelectItem>
                        <SelectItem value="19:00">7:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}