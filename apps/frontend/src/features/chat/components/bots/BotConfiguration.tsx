import React, { useState } from 'react';
import { Bot, Settings, Power, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export interface BotConfig {
  id: string;
  name: string;
  type: string;
  avatar: string;
  description: string;
  isActive: boolean;
  permissions: string[];
  settings?: Record<string, any>;
}

export interface BotConfigurationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bots: BotConfig[];
  onSave: (bots: BotConfig[]) => Promise<void>;
}

export const BotConfiguration: React.FC<BotConfigurationProps> = ({
  open,
  onOpenChange,
  bots: initialBots,
  onSave,
}) => {
  const [bots, setBots] = useState<BotConfig[]>(initialBots);
  const [saving, setSaving] = useState(false);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const { toast } = useToast();

  const handleToggleBot = (botId: string) => {
    setBots((current) =>
      current.map((bot) =>
        bot.id === botId ? { ...bot, isActive: !bot.isActive } : bot
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(bots);
      toast({
        title: 'Bot Configuration Saved',
        description: 'Bot settings have been updated successfully.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save bot configuration.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getBotAvatar = (bot: BotConfig) => {
    if (bot.avatar && bot.avatar.length <= 2) {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-lg">
          {bot.avatar}
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </div>
    );
  };

  const getBotTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      system: 'blue',
      coach: 'green',
      faq: 'purple',
      training_reminder: 'orange',
      medical_appointment: 'red',
    };
    return colors[type] || 'gray';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Bot Configuration
          </DialogTitle>
          <DialogDescription>
            Manage and configure chat bots for automated assistance
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={selectedBot || 'overview'}
          onValueChange={setSelectedBot}
          className="flex-1"
        >
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {bots.map((bot) => (
              <TabsTrigger key={bot.id} value={bot.id}>
                {bot.name.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="space-y-4">
              {bots.map((bot) => (
                <Card key={bot.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getBotAvatar(bot)}
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {bot.name}
                            <Badge variant="outline" className={`text-${getBotTypeColor(bot.type)}-600`}>
                              {bot.type.replace('_', ' ')}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {bot.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`bot-${bot.id}`} className="sr-only">
                          Enable {bot.name}
                        </Label>
                        <Switch
                          id={`bot-${bot.id}`}
                          checked={bot.isActive}
                          onCheckedChange={() => handleToggleBot(bot.id)}
                        />
                        <Power
                          className={cn(
                            'w-4 h-4',
                            bot.isActive
                              ? 'text-green-600'
                              : 'text-gray-400'
                          )}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Permissions:</strong>{' '}
                      {bot.permissions
                        .map((p) => p.replace(/_/g, ' '))
                        .join(', ')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {bots.map((bot) => (
            <TabsContent key={bot.id} value={bot.id} className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {getBotAvatar(bot)}
                    <div className="flex-1">
                      <CardTitle>{bot.name}</CardTitle>
                      <CardDescription>{bot.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Status</h4>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={bot.isActive}
                        onCheckedChange={() => handleToggleBot(bot.id)}
                      />
                      <Label>
                        {bot.isActive ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Permissions</h4>
                    <div className="flex flex-wrap gap-2">
                      {bot.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {permission.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {bot.type === 'faq' && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">FAQ Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Auto-answer questions</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Escalate to human on low confidence</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Learn from interactions</Label>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  )}

                  {bot.type === 'training_reminder' && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Reminder Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>24-hour reminders</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>2-hour reminders</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>30-minute reminders</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Send workout tips</Label>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  )}

                  {bot.type === 'medical_appointment' && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Medical Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Appointment reminders</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Medication reminders</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Injury check-ins</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Post-appointment follow-ups</Label>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Utility function for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}