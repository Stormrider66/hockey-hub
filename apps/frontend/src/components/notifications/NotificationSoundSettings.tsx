'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  Music, 
  Play, 
  Info,
  MessageSquare,
  AtSign,
  AlertTriangle,
  Calendar,
  Dumbbell,
  Heart,
  Wrench,
  Megaphone
} from 'lucide-react';
import { notificationSoundService, SoundSettings } from '@/services/NotificationSoundService';
import { toast } from 'react-hot-toast';

const soundOptions = [
  { value: 'default', label: 'Default' },
  { value: 'chime', label: 'Chime' },
  { value: 'bell', label: 'Bell' },
  { value: 'ping', label: 'Ping' },
  { value: 'pop', label: 'Pop' },
  { value: 'custom', label: 'Custom' },
];

const notificationCategories = [
  { 
    key: 'message' as keyof SoundSettings['playForTypes'], 
    label: 'Messages', 
    icon: MessageSquare,
    description: 'New messages and replies'
  },
  { 
    key: 'mention' as keyof SoundSettings['playForTypes'], 
    label: 'Mentions', 
    icon: AtSign,
    description: 'When someone mentions you'
  },
  { 
    key: 'urgent' as keyof SoundSettings['playForTypes'], 
    label: 'Urgent', 
    icon: AlertTriangle,
    description: 'Important alerts and conflicts'
  },
  { 
    key: 'calendar' as keyof SoundSettings['playForTypes'], 
    label: 'Calendar', 
    icon: Calendar,
    description: 'Event reminders and updates'
  },
  { 
    key: 'training' as keyof SoundSettings['playForTypes'], 
    label: 'Training', 
    icon: Dumbbell,
    description: 'Training sessions and workouts'
  },
  { 
    key: 'medical' as keyof SoundSettings['playForTypes'], 
    label: 'Medical', 
    icon: Heart,
    description: 'Medical appointments and updates'
  },
  { 
    key: 'equipment' as keyof SoundSettings['playForTypes'], 
    label: 'Equipment', 
    icon: Wrench,
    description: 'Equipment status and maintenance'
  },
  { 
    key: 'general' as keyof SoundSettings['playForTypes'], 
    label: 'General', 
    icon: Megaphone,
    description: 'Announcements and updates'
  },
];

export const NotificationSoundSettings: React.FC = () => {
  const [settings, setSettings] = useState<SoundSettings>(notificationSoundService.getSettings());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Preload sounds when component mounts
    notificationSoundService.preloadSounds().catch(console.error);
  }, []);

  const handleToggleSound = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, enabled }));
    setHasChanges(true);
  };

  const handleVolumeChange = (value: number[]) => {
    setSettings(prev => ({ ...prev, volume: value[0] }));
    setHasChanges(true);
  };

  const handleSoundTypeChange = (soundType: string) => {
    setSettings(prev => ({ ...prev, soundType: soundType as any }));
    setHasChanges(true);
  };

  const handleCustomUrlChange = (customSoundUrl: string) => {
    setSettings(prev => ({ ...prev, customSoundUrl }));
    setHasChanges(true);
  };

  const handleCategoryToggle = (category: keyof SoundSettings['playForTypes'], enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      playForTypes: {
        ...prev.playForTypes,
        [category]: enabled,
      },
    }));
    setHasChanges(true);
  };

  const handleTestSound = async () => {
    try {
      await notificationSoundService.testSound(settings.soundType);
      toast.success('Sound test played');
    } catch (error) {
      toast.error('Failed to play test sound');
    }
  };

  const handleSave = () => {
    notificationSoundService.updateSettings(settings);
    setHasChanges(false);
    toast.success('Sound settings saved');
  };

  const handleReset = () => {
    const defaultSettings = notificationSoundService.getSettings();
    setSettings(defaultSettings);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Notification Sounds
          </CardTitle>
          <CardDescription>
            Configure sound alerts for different types of notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-enabled" className="text-base">
                Enable Notification Sounds
              </Label>
              <p className="text-sm text-muted-foreground">
                Play sounds when you receive notifications
              </p>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.enabled}
              onCheckedChange={handleToggleSound}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Volume Control */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Volume</Label>
                  <span className="text-sm text-muted-foreground">{settings.volume}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[settings.volume]}
                    onValueChange={handleVolumeChange}
                    min={0}
                    max={100}
                    step={10}
                    className="flex-1"
                  />
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Sound Type Selection */}
              <div className="space-y-3">
                <Label htmlFor="sound-type">Notification Sound</Label>
                <div className="flex gap-2">
                  <Select
                    value={settings.soundType}
                    onValueChange={handleSoundTypeChange}
                  >
                    <SelectTrigger id="sound-type" className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {soundOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleTestSound}
                    title="Test sound"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Custom Sound URL */}
              {settings.soundType === 'custom' && (
                <div className="space-y-3">
                  <Label htmlFor="custom-url">Custom Sound URL</Label>
                  <Input
                    id="custom-url"
                    type="url"
                    placeholder="https://example.com/sound.mp3"
                    value={settings.customSoundUrl || ''}
                    onChange={(e) => handleCustomUrlChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the URL of an MP3 or WAV file
                  </p>
                </div>
              )}

              {/* Notification Categories */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-medium mb-1">Play Sounds For</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose which types of notifications should play sounds
                  </p>
                </div>
                <div className="space-y-3">
                  {notificationCategories.map(category => {
                    const Icon = category.icon;
                    return (
                      <div
                        key={category.key}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <Label htmlFor={`category-${category.key}`} className="text-sm font-medium">
                              {category.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {category.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={`category-${category.key}`}
                          checked={settings.playForTypes[category.key]}
                          onCheckedChange={(checked) => handleCategoryToggle(category.key, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Browser Permissions Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>To hear notification sounds, make sure:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Your device volume is turned up</li>
                  <li>Your browser is not muted</li>
                  <li>You have granted notification permissions</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          {hasChanges && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};