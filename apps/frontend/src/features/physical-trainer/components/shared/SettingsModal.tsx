import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bell, 
  Calendar, 
  Globe, 
  Palette,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeamId: string | null;
  teams: Array<{ id: string; name: string }>;
}

interface UserSettings {
  defaultTeam: string;
  notifications: {
    sessionReminders: boolean;
    medicalAlerts: boolean;
    playerUpdates: boolean;
    templateSharing: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  calendar: {
    defaultView: 'month' | 'week' | 'day';
    showWeekends: boolean;
    startTime: string;
    endTime: string;
    workoutColors: boolean;
  };
  language: string;
  theme: 'light' | 'dark' | 'system';
  workoutDefaults: {
    defaultDuration: number;
    defaultRestPeriod: number;
    autoSave: boolean;
    autoSaveInterval: number;
  };
}

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'sv', name: 'Svenska' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedTeamId,
  teams 
}) => {
  const { t, i18n } = useTranslation(['physicalTrainer', 'common']);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage
  const loadSettings = (): UserSettings => {
    const saved = localStorage.getItem('physicalTrainerSettings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      defaultTeam: selectedTeamId || 'all',
      notifications: {
        sessionReminders: true,
        medicalAlerts: true,
        playerUpdates: true,
        templateSharing: false,
        emailNotifications: true,
        pushNotifications: false,
      },
      calendar: {
        defaultView: 'week',
        showWeekends: true,
        startTime: '06:00',
        endTime: '22:00',
        workoutColors: true,
      },
      language: i18n.language,
      theme: 'system',
      workoutDefaults: {
        defaultDuration: 60,
        defaultRestPeriod: 60,
        autoSave: true,
        autoSaveInterval: 30,
      },
    };
  };

  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('physicalTrainerSettings', JSON.stringify(settings));
    
    // Apply language change
    if (settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }

    // Apply theme change
    if (settings.theme !== 'system') {
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }

    toast.success(t('physicalTrainer:settings.saved'));
    setHasChanges(false);
    onClose();
  };

  const resetToDefaults = () => {
    const defaults: UserSettings = {
      defaultTeam: 'all',
      notifications: {
        sessionReminders: true,
        medicalAlerts: true,
        playerUpdates: true,
        templateSharing: false,
        emailNotifications: true,
        pushNotifications: false,
      },
      calendar: {
        defaultView: 'week',
        showWeekends: true,
        startTime: '06:00',
        endTime: '22:00',
        workoutColors: true,
      },
      language: 'en',
      theme: 'system',
      workoutDefaults: {
        defaultDuration: 60,
        defaultRestPeriod: 60,
        autoSave: true,
        autoSaveInterval: 30,
      },
    };
    setSettings(defaults);
    setHasChanges(true);
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasChanges(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('physicalTrainer:settings.title')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">
              {t('physicalTrainer:settings.tabs.general')}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              {t('physicalTrainer:settings.tabs.notifications')}
            </TabsTrigger>
            <TabsTrigger value="calendar">
              {t('physicalTrainer:settings.tabs.calendar')}
            </TabsTrigger>
            <TabsTrigger value="appearance">
              {t('physicalTrainer:settings.tabs.appearance')}
            </TabsTrigger>
            <TabsTrigger value="workouts">
              {t('physicalTrainer:settings.tabs.workouts')}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:settings.general.defaultTeam')}</CardTitle>
                  <CardDescription>
                    {t('physicalTrainer:settings.general.defaultTeamDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={settings.defaultTeam} 
                    onValueChange={(value) => updateSetting('defaultTeam', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('physicalTrainer:teams.allTeams')}</SelectItem>
                      <SelectItem value="personal">{t('physicalTrainer:teams.personalView')}</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:settings.notifications.types')}</CardTitle>
                  <CardDescription>
                    {t('physicalTrainer:settings.notifications.typesDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="session-reminders">
                      {t('physicalTrainer:settings.notifications.sessionReminders')}
                    </Label>
                    <Switch
                      id="session-reminders"
                      checked={settings.notifications.sessionReminders}
                      onCheckedChange={(checked) => updateSetting('notifications.sessionReminders', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="medical-alerts">
                      {t('physicalTrainer:settings.notifications.medicalAlerts')}
                    </Label>
                    <Switch
                      id="medical-alerts"
                      checked={settings.notifications.medicalAlerts}
                      onCheckedChange={(checked) => updateSetting('notifications.medicalAlerts', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="player-updates">
                      {t('physicalTrainer:settings.notifications.playerUpdates')}
                    </Label>
                    <Switch
                      id="player-updates"
                      checked={settings.notifications.playerUpdates}
                      onCheckedChange={(checked) => updateSetting('notifications.playerUpdates', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="template-sharing">
                      {t('physicalTrainer:settings.notifications.templateSharing')}
                    </Label>
                    <Switch
                      id="template-sharing"
                      checked={settings.notifications.templateSharing}
                      onCheckedChange={(checked) => updateSetting('notifications.templateSharing', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:settings.notifications.delivery')}</CardTitle>
                  <CardDescription>
                    {t('physicalTrainer:settings.notifications.deliveryDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">
                      {t('physicalTrainer:settings.notifications.email')}
                    </Label>
                    <Switch
                      id="email-notifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('notifications.emailNotifications', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">
                      {t('physicalTrainer:settings.notifications.push')}
                    </Label>
                    <Switch
                      id="push-notifications"
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={(checked) => updateSetting('notifications.pushNotifications', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:settings.calendar.view')}</CardTitle>
                  <CardDescription>
                    {t('physicalTrainer:settings.calendar.viewDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t('physicalTrainer:settings.calendar.defaultView')}</Label>
                    <RadioGroup 
                      value={settings.calendar.defaultView} 
                      onValueChange={(value) => updateSetting('calendar.defaultView', value)}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="month" id="month" />
                        <Label htmlFor="month">{t('physicalTrainer:settings.calendar.month')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="week" id="week" />
                        <Label htmlFor="week">{t('physicalTrainer:settings.calendar.week')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="day" id="day" />
                        <Label htmlFor="day">{t('physicalTrainer:settings.calendar.day')}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-weekends">
                      {t('physicalTrainer:settings.calendar.showWeekends')}
                    </Label>
                    <Switch
                      id="show-weekends"
                      checked={settings.calendar.showWeekends}
                      onCheckedChange={(checked) => updateSetting('calendar.showWeekends', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="workout-colors">
                      {t('physicalTrainer:settings.calendar.workoutColors')}
                    </Label>
                    <Switch
                      id="workout-colors"
                      checked={settings.calendar.workoutColors}
                      onCheckedChange={(checked) => updateSetting('calendar.workoutColors', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:settings.appearance.language')}</CardTitle>
                  <CardDescription>
                    {t('physicalTrainer:settings.appearance.languageDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value) => updateSetting('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_LANGUAGES.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:settings.appearance.theme')}</CardTitle>
                  <CardDescription>
                    {t('physicalTrainer:settings.appearance.themeDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={settings.theme} 
                    onValueChange={(value) => updateSetting('theme', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light">{t('physicalTrainer:settings.appearance.light')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark">{t('physicalTrainer:settings.appearance.dark')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system">{t('physicalTrainer:settings.appearance.system')}</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workouts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:settings.workouts.defaults')}</CardTitle>
                  <CardDescription>
                    {t('physicalTrainer:settings.workouts.defaultsDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="default-duration">
                      {t('physicalTrainer:settings.workouts.defaultDuration')}
                    </Label>
                    <Select 
                      value={settings.workoutDefaults.defaultDuration.toString()} 
                      onValueChange={(value) => updateSetting('workoutDefaults.defaultDuration', parseInt(value))}
                    >
                      <SelectTrigger id="default-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 {t('common:time.minutes')}</SelectItem>
                        <SelectItem value="45">45 {t('common:time.minutes')}</SelectItem>
                        <SelectItem value="60">60 {t('common:time.minutes')}</SelectItem>
                        <SelectItem value="75">75 {t('common:time.minutes')}</SelectItem>
                        <SelectItem value="90">90 {t('common:time.minutes')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div>
                    <Label htmlFor="default-rest">
                      {t('physicalTrainer:settings.workouts.defaultRest')}
                    </Label>
                    <Select 
                      value={settings.workoutDefaults.defaultRestPeriod.toString()} 
                      onValueChange={(value) => updateSetting('workoutDefaults.defaultRestPeriod', parseInt(value))}
                    >
                      <SelectTrigger id="default-rest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 {t('common:time.seconds')}</SelectItem>
                        <SelectItem value="45">45 {t('common:time.seconds')}</SelectItem>
                        <SelectItem value="60">60 {t('common:time.seconds')}</SelectItem>
                        <SelectItem value="90">90 {t('common:time.seconds')}</SelectItem>
                        <SelectItem value="120">120 {t('common:time.seconds')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-save">
                      {t('physicalTrainer:settings.workouts.autoSave')}
                    </Label>
                    <Switch
                      id="auto-save"
                      checked={settings.workoutDefaults.autoSave}
                      onCheckedChange={(checked) => updateSetting('workoutDefaults.autoSave', checked)}
                    />
                  </div>
                  {settings.workoutDefaults.autoSave && (
                    <div>
                      <Label htmlFor="auto-save-interval">
                        {t('physicalTrainer:settings.workouts.autoSaveInterval')}
                      </Label>
                      <Select 
                        value={settings.workoutDefaults.autoSaveInterval.toString()} 
                        onValueChange={(value) => updateSetting('workoutDefaults.autoSaveInterval', parseInt(value))}
                      >
                        <SelectTrigger id="auto-save-interval">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 {t('common:time.seconds')}</SelectItem>
                          <SelectItem value="30">30 {t('common:time.seconds')}</SelectItem>
                          <SelectItem value="60">60 {t('common:time.seconds')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={resetToDefaults}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('physicalTrainer:settings.resetToDefaults')}
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                {t('common:actions.cancel')}
              </Button>
              <Button onClick={saveSettings} disabled={!hasChanges}>
                <Save className="mr-2 h-4 w-4" />
                {t('common:actions.save')}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};