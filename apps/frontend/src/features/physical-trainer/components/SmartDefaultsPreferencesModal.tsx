import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Brain,
  Settings,
  Clock,
  Calendar,
  Users,
  Dumbbell,
  Activity,
  Zap,
  Target,
  Info,
  Check,
  X,
  Download,
  Upload,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserPreferences, WorkoutType } from '../hooks/useSmartDefaults';
import { SmartDefaultsPreferencesManager } from '../utils/smartDefaultsPreferences';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface SmartDefaultsPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  preferences: UserPreferences | null;
  onPreferencesChange?: (preferences: UserPreferences) => void;
}

const WORKOUT_TYPE_CONFIG = {
  [WorkoutType.STRENGTH]: { icon: Dumbbell, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  [WorkoutType.CONDITIONING]: { icon: Activity, color: 'text-red-600', bgColor: 'bg-red-50' },
  [WorkoutType.HYBRID]: { icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  [WorkoutType.AGILITY]: { icon: Target, color: 'text-orange-600', bgColor: 'bg-orange-50' }
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SmartDefaultsPreferencesModal: React.FC<SmartDefaultsPreferencesModalProps> = ({
  isOpen,
  onClose,
  userId,
  preferences: initialPreferences,
  onPreferencesChange
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [preferences, setPreferences] = useState<UserPreferences>(
    initialPreferences || SmartDefaultsPreferencesManager.createDefaultPreferences(userId)
  );
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    SmartDefaultsPreferencesManager.savePreferences(userId, preferences);
    onPreferencesChange?.(preferences);
    setHasChanges(false);
    toast.success('Smart defaults preferences saved');
    onClose();
  };

  const handleReset = () => {
    const defaultPrefs = SmartDefaultsPreferencesManager.createDefaultPreferences(userId);
    setPreferences(defaultPrefs);
    setHasChanges(true);
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateDefaultDuration = (workoutType: WorkoutType, duration: number) => {
    updatePreference('defaultDuration', {
      ...preferences.defaultDuration,
      [workoutType]: duration
    });
  };

  const updateDefaultIntensity = (workoutType: WorkoutType, intensity: 'low' | 'medium' | 'high' | 'max') => {
    updatePreference('defaultIntensity', {
      ...preferences.defaultIntensity,
      [workoutType]: intensity
    });
  };

  const addPreferredTime = (dayOfWeek: number, startTime: string, workoutType?: WorkoutType) => {
    const newTime = { dayOfWeek, startTime, workoutType };
    updatePreference('preferredTimes', [...preferences.preferredTimes, newTime]);
  };

  const removePreferredTime = (index: number) => {
    updatePreference(
      'preferredTimes',
      preferences.preferredTimes.filter((_, i) => i !== index)
    );
  };

  const exportPreferences = () => {
    const data = SmartDefaultsPreferencesManager.exportPreferences(userId);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-defaults-preferences-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Preferences exported successfully');
    }
  };

  const importPreferences = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = SmartDefaultsPreferencesManager.importPreferences(userId, content);
      if (success) {
        const imported = SmartDefaultsPreferencesManager.getPreferences(userId);
        if (imported) {
          setPreferences(imported);
          setHasChanges(true);
          toast.success('Preferences imported successfully');
        }
      } else {
        toast.error('Failed to import preferences');
      }
    };
    reader.readAsText(file);
  };

  const stats = SmartDefaultsPreferencesManager.getPreferenceStats(userId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Smart Defaults Preferences
          </DialogTitle>
          <DialogDescription>
            Customize how smart defaults work for you. The system learns from your patterns and preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="workout">Workout Types</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)] mt-4">
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Selection Settings</CardTitle>
                  <CardDescription>
                    Control how smart defaults automatically select teams and players
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-team" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Auto-select team based on context
                    </Label>
                    <Switch
                      id="auto-team"
                      checked={preferences.autoSelectTeam}
                      onCheckedChange={(checked) => updatePreference('autoSelectTeam', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-players" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Auto-select available players
                    </Label>
                    <Switch
                      id="auto-players"
                      checked={preferences.autoSelectPlayers}
                      onCheckedChange={(checked) => updatePreference('autoSelectPlayers', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your most recent selections influence smart defaults
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Recent Teams</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {preferences.recentTeams.length > 0 ? (
                        preferences.recentTeams.map((teamId, index) => (
                          <Badge key={index} variant="secondary">
                            Team {index + 1}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No recent teams</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Recent Workout Types</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {preferences.recentWorkoutTypes.length > 0 ? (
                        preferences.recentWorkoutTypes.map((type, index) => {
                          const config = WORKOUT_TYPE_CONFIG[type];
                          const Icon = config.icon;
                          return (
                            <Badge key={index} className={cn(config.bgColor, config.color)} variant="secondary">
                              <Icon className="h-3 w-3 mr-1" />
                              {type}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground">No recent workouts</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workout" className="space-y-4">
              {Object.entries(WORKOUT_TYPE_CONFIG).map(([type, config]) => {
                const Icon = config.icon;
                const workoutType = type as WorkoutType;
                return (
                  <Card key={type}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className={cn("h-5 w-5", config.color)} />
                        {type.charAt(0).toUpperCase() + type.slice(1)} Workouts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Default Duration (minutes)</Label>
                        <input
                          type="number"
                          value={preferences.defaultDuration[workoutType]}
                          onChange={(e) => updateDefaultDuration(workoutType, parseInt(e.target.value) || 60)}
                          className="w-24 mt-1 px-3 py-2 border rounded-md"
                          min="5"
                          max="240"
                          step="5"
                        />
                      </div>

                      <div>
                        <Label>Default Intensity</Label>
                        <div className="flex gap-2 mt-2">
                          {(['low', 'medium', 'high', 'max'] as const).map((intensity) => (
                            <Button
                              key={intensity}
                              variant={preferences.defaultIntensity[workoutType] === intensity ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateDefaultIntensity(workoutType, intensity)}
                              className="capitalize"
                            >
                              {intensity}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preferred Workout Times</CardTitle>
                  <CardDescription>
                    Set your preferred times for different days and workout types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {preferences.preferredTimes.map((time, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{DAY_NAMES[time.dayOfWeek]}</span>
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{time.startTime}</span>
                          {time.workoutType && (
                            <Badge variant="secondary" className="text-xs">
                              {time.workoutType}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePreferredTime(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // In a real app, this would open a form
                        addPreferredTime(1, '16:00'); // Example: Monday at 4 PM
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Preferred Time
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="equipment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preferred Equipment</CardTitle>
                  <CardDescription>
                    Equipment that will be prioritized in workout suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {['barbell', 'dumbbells', 'kettlebells', 'rowing-machine', 'bike', 'treadmill'].map((equipment) => (
                      <Badge
                        key={equipment}
                        variant={preferences.preferredEquipment.includes(equipment) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const updated = preferences.preferredEquipment.includes(equipment)
                            ? preferences.preferredEquipment.filter(e => e !== equipment)
                            : [...preferences.preferredEquipment, equipment];
                          updatePreference('preferredEquipment', updated);
                        }}
                      >
                        {equipment.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                  <CardDescription>
                    See how smart defaults have learned from your patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.totalWorkouts}
                      </div>
                      <div className="text-sm text-gray-600">Workouts Created</div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.averageDuration}
                      </div>
                      <div className="text-sm text-gray-600">Avg Duration (min)</div>
                    </div>

                    {stats.favoriteWorkoutType && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const config = WORKOUT_TYPE_CONFIG[stats.favoriteWorkoutType];
                            const Icon = config.icon;
                            return (
                              <>
                                <Icon className={cn("h-6 w-6", config.color)} />
                                <span className="font-bold capitalize">{stats.favoriteWorkoutType}</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-sm text-gray-600">Favorite Type</div>
                      </div>
                    )}

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold capitalize text-purple-600">
                        {stats.preferredIntensity}
                      </div>
                      <div className="text-sm text-gray-600">Preferred Intensity</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Export, import, or reset your smart defaults preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportPreferences}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Preferences
                    </Button>
                    
                    <Button variant="outline" asChild>
                      <label>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Preferences
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={importPreferences}
                        />
                      </label>
                    </Button>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Your preferences are stored locally and help smart defaults make better suggestions over time.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            <Button variant="destructive" onClick={handleReset}>
              <Trash2 className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges}>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};