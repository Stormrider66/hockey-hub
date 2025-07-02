'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Bell, Mail, MessageSquare, Smartphone, Info, Save } from 'lucide-react';
import { 
  useGetNotificationPreferencesQuery, 
  useUpdateNotificationPreferencesMutation,
  NotificationChannel,
  NotificationType,
  NotificationPreference
} from '@/store/api/notificationApi';
import { toast } from 'react-hot-toast';
import { PushNotificationSettings } from './PushNotificationSettings';
import { NotificationSoundSettings } from './NotificationSoundSettings';

// Helper to get human-readable names for notification types
const getNotificationTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    [NotificationType.EVENT_REMINDER]: 'Event Reminders',
    [NotificationType.EVENT_CREATED]: 'New Events',
    [NotificationType.EVENT_UPDATED]: 'Event Updates',
    [NotificationType.EVENT_CANCELLED]: 'Event Cancellations',
    [NotificationType.RSVP_REQUEST]: 'RSVP Requests',
    [NotificationType.SCHEDULE_CONFLICT]: 'Schedule Conflicts',
    [NotificationType.TRAINING_ASSIGNED]: 'Training Assignments',
    [NotificationType.TRAINING_COMPLETED]: 'Training Completions',
    [NotificationType.TRAINING_OVERDUE]: 'Overdue Training',
    [NotificationType.MEDICAL_APPOINTMENT]: 'Medical Appointments',
    [NotificationType.INJURY_UPDATE]: 'Injury Updates',
    [NotificationType.MEDICAL_CLEARANCE]: 'Medical Clearances',
    [NotificationType.EQUIPMENT_DUE]: 'Equipment Due',
    [NotificationType.EQUIPMENT_READY]: 'Equipment Ready',
    [NotificationType.MAINTENANCE_REQUIRED]: 'Maintenance Required',
    [NotificationType.ANNOUNCEMENT]: 'Announcements',
    [NotificationType.SYSTEM_ALERT]: 'System Alerts',
    [NotificationType.PAYMENT_DUE]: 'Payment Reminders',
    [NotificationType.TEAM_UPDATE]: 'Team Updates',
  };
  return labels[type] || type;
};

// Group notification types by category
const notificationCategories = {
  'Calendar & Events': [
    NotificationType.EVENT_REMINDER,
    NotificationType.EVENT_CREATED,
    NotificationType.EVENT_UPDATED,
    NotificationType.EVENT_CANCELLED,
    NotificationType.RSVP_REQUEST,
    NotificationType.SCHEDULE_CONFLICT,
  ],
  'Training': [
    NotificationType.TRAINING_ASSIGNED,
    NotificationType.TRAINING_COMPLETED,
    NotificationType.TRAINING_OVERDUE,
  ],
  'Medical': [
    NotificationType.MEDICAL_APPOINTMENT,
    NotificationType.INJURY_UPDATE,
    NotificationType.MEDICAL_CLEARANCE,
  ],
  'Equipment': [
    NotificationType.EQUIPMENT_DUE,
    NotificationType.EQUIPMENT_READY,
    NotificationType.MAINTENANCE_REQUIRED,
  ],
  'General': [
    NotificationType.ANNOUNCEMENT,
    NotificationType.SYSTEM_ALERT,
    NotificationType.PAYMENT_DUE,
    NotificationType.TEAM_UPDATE,
  ],
};

interface PreferenceState {
  [key: string]: boolean;
}

export const NotificationPreferences: React.FC = () => {
  const { data: preferences = [], isLoading, error } = useGetNotificationPreferencesQuery();
  const [updatePreferences, { isLoading: isUpdating }] = useUpdateNotificationPreferencesMutation();
  
  const [preferenceState, setPreferenceState] = useState<PreferenceState>({});
  const [quietHours, setQuietHours] = useState({ start: '', end: '' });
  const [emailSettings, setEmailSettings] = useState({ address: '', format: 'html' });
  const [smsSettings, setSmsSettings] = useState({ phone: '' });
  const [pushSettings, setPushSettings] = useState({ sound: true, vibrate: true });

  // Initialize state from API data
  useEffect(() => {
    if (preferences.length > 0) {
      const state: PreferenceState = {};
      let quietStart = '';
      let quietEnd = '';
      
      preferences.forEach(pref => {
        state[`${pref.type}-${pref.channel}`] = pref.is_enabled;
        
        if (pref.quiet_hours_start && !quietStart) {
          quietStart = pref.quiet_hours_start;
        }
        if (pref.quiet_hours_end && !quietEnd) {
          quietEnd = pref.quiet_hours_end;
        }
        
        if (pref.channel_settings) {
          if (pref.channel === NotificationChannel.EMAIL && pref.channel_settings.email) {
            setEmailSettings({
              address: pref.channel_settings.email.address || '',
              format: pref.channel_settings.email.format || 'html',
            });
          }
          if (pref.channel === NotificationChannel.SMS && pref.channel_settings.sms) {
            setSmsSettings({
              phone: pref.channel_settings.sms.phone_number || '',
            });
          }
          if (pref.channel === NotificationChannel.PUSH && pref.channel_settings.push) {
            setPushSettings({
              sound: pref.channel_settings.push.sound !== undefined ? true : true,
              vibrate: pref.channel_settings.push.vibrate !== undefined ? pref.channel_settings.push.vibrate : true,
            });
          }
        }
      });
      
      setPreferenceState(state);
      setQuietHours({ start: quietStart, end: quietEnd });
    }
  }, [preferences]);

  const handleToggle = (type: NotificationType, channel: NotificationChannel) => {
    const key = `${type}-${channel}`;
    setPreferenceState(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      const updatedPreferences: Partial<NotificationPreference>[] = [];
      
      // Generate preferences from state
      Object.values(NotificationType).forEach(type => {
        Object.values(NotificationChannel).forEach(channel => {
          const key = `${type}-${channel}`;
          const isEnabled = preferenceState[key] !== undefined ? preferenceState[key] : true;
          
          const preference: Partial<NotificationPreference> = {
            type,
            channel,
            is_enabled: isEnabled,
            quiet_hours_start: quietHours.start || undefined,
            quiet_hours_end: quietHours.end || undefined,
            send_immediately: true,
            send_daily_digest: false,
            send_weekly_digest: false,
          };
          
          // Add channel-specific settings
          if (channel === NotificationChannel.EMAIL && emailSettings.address) {
            preference.channel_settings = {
              email: {
                address: emailSettings.address,
                format: emailSettings.format as 'html' | 'text',
              },
            };
          } else if (channel === NotificationChannel.SMS && smsSettings.phone) {
            preference.channel_settings = {
              sms: {
                phone_number: smsSettings.phone,
              },
            };
          } else if (channel === NotificationChannel.PUSH) {
            preference.channel_settings = {
              push: {
                sound: pushSettings.sound ? 'default' : undefined,
                vibrate: pushSettings.vibrate,
              },
            };
          }
          
          updatedPreferences.push(preference);
        });
      });
      
      await updatePreferences(updatedPreferences).unwrap();
      toast.success('Notification preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save notification preferences');
      console.error('Error saving preferences:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load notification preferences. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications for different types of events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preferences" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="push">Push</TabsTrigger>
              <TabsTrigger value="sounds">Sounds</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preferences" className="space-y-6">
              {Object.entries(notificationCategories).map(([category, types]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <div className="space-y-3">
                    {types.map(type => (
                      <div key={type} className="border rounded-lg p-4">
                        <div className="mb-3">
                          <h4 className="font-medium">{getNotificationTypeLabel(type)}</h4>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2">
                            <Bell className="h-4 w-4" />
                            <Label htmlFor={`${type}-in_app`}>In-App</Label>
                            <Switch
                              id={`${type}-in_app`}
                              checked={preferenceState[`${type}-${NotificationChannel.IN_APP}`] ?? true}
                              onCheckedChange={() => handleToggle(type, NotificationChannel.IN_APP)}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <Label htmlFor={`${type}-email`}>Email</Label>
                            <Switch
                              id={`${type}-email`}
                              checked={preferenceState[`${type}-${NotificationChannel.EMAIL}`] ?? true}
                              onCheckedChange={() => handleToggle(type, NotificationChannel.EMAIL)}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4" />
                            <Label htmlFor={`${type}-sms`}>SMS</Label>
                            <Switch
                              id={`${type}-sms`}
                              checked={preferenceState[`${type}-${NotificationChannel.SMS}`] ?? false}
                              onCheckedChange={() => handleToggle(type, NotificationChannel.SMS)}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Smartphone className="h-4 w-4" />
                            <Label htmlFor={`${type}-push`}>Push</Label>
                            <Switch
                              id={`${type}-push`}
                              checked={preferenceState[`${type}-${NotificationChannel.PUSH}`] ?? true}
                              onCheckedChange={() => handleToggle(type, NotificationChannel.PUSH)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="channels" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Email Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="email-address">Email Address</Label>
                      <Input
                        id="email-address"
                        type="email"
                        placeholder="your@email.com"
                        value={emailSettings.address}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-format">Email Format</Label>
                      <Select
                        value={emailSettings.format}
                        onValueChange={(value) => setEmailSettings(prev => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger id="email-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="html">HTML (Rich Text)</SelectItem>
                          <SelectItem value="text">Plain Text</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">SMS Settings</h3>
                  <div>
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={smsSettings.phone}
                      onChange={(e) => setSmsSettings({ phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Push Notification Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="push-sound"
                        checked={pushSettings.sound}
                        onCheckedChange={(checked) => setPushSettings(prev => ({ ...prev, sound: checked }))}
                      />
                      <Label htmlFor="push-sound">Play sound</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="push-vibrate"
                        checked={pushSettings.vibrate}
                        onCheckedChange={(checked) => setPushSettings(prev => ({ ...prev, vibrate: checked }))}
                      />
                      <Label htmlFor="push-vibrate">Vibrate</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="push" className="space-y-6">
              <PushNotificationSettings />
            </TabsContent>
            
            <TabsContent value="sounds" className="space-y-6">
              <NotificationSoundSettings />
            </TabsContent>
            
            <TabsContent value="schedule" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Quiet Hours</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set times when you don't want to receive notifications (except urgent ones)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={quietHours.start}
                      onChange={(e) => setQuietHours(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">End Time</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={quietHours.end}
                      onChange={(e) => setQuietHours(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Urgent notifications will always be delivered regardless of quiet hours settings.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};