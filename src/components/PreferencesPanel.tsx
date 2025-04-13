import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  setLanguage,
  setTheme,
  toggleNotification,
  setNotificationTiming,
  updateAccessibility,
  updateCalendarPreferences,
  type PreferencesState,
} from '@/store/features/preferencesSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Bell, Calendar, AccessibilityIcon } from 'lucide-react';

type BooleanAccessibilityKeys = Extract<
  keyof PreferencesState['accessibility'],
  'reduceMotion' | 'highContrast' | 'enableScreenReader'
>;

export function PreferencesPanel() {
  const dispatch = useDispatch();
  const preferences = useSelector((state: RootState) => state.preferences);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <AccessibilityIcon className="w-6 h-6" />
          Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">
              <Globe className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="accessibility">
              <AccessibilityIcon className="w-4 h-4 mr-2" />
              Accessibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value: 'en' | 'sv') => dispatch(setLanguage(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sv">Svenska</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value: 'light' | 'dark') => dispatch(setTheme(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-4">
                <Label className="text-base">Notification Channels</Label>
                <div className="space-y-2">
                  {(['email', 'push', 'sms'] as const).map((type) => (
                    <div key={type} className="flex items-center justify-between">
                      <Label className="capitalize">{type}</Label>
                      <Switch
                        checked={preferences.notifications[type]}
                        onCheckedChange={() => dispatch(toggleNotification(type))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Notification Timing</Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Event Reminder (minutes before)</Label>
                    <Slider
                      value={[preferences.notifications.timing.beforeEvent]}
                      onValueChange={(value: number[]) =>
                        dispatch(setNotificationTiming({ beforeEvent: value[0] }))
                      }
                      min={5}
                      max={120}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Daily Summary</Label>
                    <Select
                      value={preferences.notifications.timing.dailySummary}
                      onValueChange={(value: 'morning' | 'evening' | 'none') =>
                        dispatch(setNotificationTiming({ dailySummary: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Weekly Report</Label>
                    <Switch
                      checked={preferences.notifications.timing.weeklyReport}
                      onCheckedChange={(checked: boolean) =>
                        dispatch(setNotificationTiming({ weeklyReport: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default View</Label>
                <Select
                  value={preferences.calendar.defaultView}
                  onValueChange={(value: 'day' | 'week' | 'month') =>
                    dispatch(updateCalendarPreferences({ defaultView: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start of Week</Label>
                <Select
                  value={preferences.calendar.startOfWeek.toString()}
                  onValueChange={(value: string) =>
                    dispatch(updateCalendarPreferences({ startOfWeek: parseInt(value) as 0 | 1 }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Show Week Numbers</Label>
                <Switch
                  checked={preferences.calendar.showWeekNumbers}
                  onCheckedChange={(checked: boolean) =>
                    dispatch(updateCalendarPreferences({ showWeekNumbers: checked }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select
                  value={preferences.accessibility.fontSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') =>
                    dispatch(updateAccessibility({ fontSize: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Reduce Motion', key: 'reduceMotion' },
                  { label: 'High Contrast', key: 'highContrast' },
                  { label: 'Screen Reader Optimization', key: 'enableScreenReader' },
                ].map(({ label, key }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <Switch
                      checked={preferences.accessibility[key as BooleanAccessibilityKeys]}
                      onCheckedChange={(checked: boolean) =>
                        dispatch(updateAccessibility({ [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 