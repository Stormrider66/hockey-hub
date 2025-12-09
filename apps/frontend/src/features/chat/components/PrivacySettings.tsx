import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import { Shield, Eye, MessageSquare, UserX, Camera, Clock } from 'lucide-react';
import {
  useGetPrivacySettingsQuery,
  useUpdatePrivacySettingsMutation,
  MessagePrivacy,
  OnlineVisibility,
} from '@/store/api/privacyApi';

interface PrivacySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const privacyOptions = {
  whoCanMessage: [
    { value: MessagePrivacy.EVERYONE, label: 'Everyone', description: 'Anyone can send you messages' },
    { value: MessagePrivacy.TEAM_ONLY, label: 'Team Only', description: 'Only team members can message you' },
    { value: MessagePrivacy.CONTACTS_ONLY, label: 'Contacts Only', description: 'Only your contacts can message you' },
    { value: MessagePrivacy.NO_ONE, label: 'No One', description: 'Nobody can send you messages' },
  ],
  onlineVisibility: [
    { value: OnlineVisibility.EVERYONE, label: 'Everyone', description: 'Anyone can see when you\'re online' },
    { value: OnlineVisibility.TEAM_ONLY, label: 'Team Only', description: 'Only team members can see your status' },
    { value: OnlineVisibility.CONTACTS_ONLY, label: 'Contacts Only', description: 'Only contacts can see your status' },
    { value: OnlineVisibility.NO_ONE, label: 'No One', description: 'Nobody can see when you\'re online' },
  ],
};

export function PrivacySettings({ isOpen, onClose }: PrivacySettingsProps) {
  const { data: settings, isLoading } = useGetPrivacySettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdatePrivacySettingsMutation();
  const [formData, setFormData] = useState(settings || {});

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        whoCanMessage: formData.whoCanMessage,
        onlineVisibility: formData.onlineVisibility,
        showReadReceipts: formData.showReadReceipts,
        showTypingIndicators: formData.showTypingIndicators,
        showLastSeen: formData.showLastSeen,
        allowProfileViews: formData.allowProfileViews,
        blockScreenshots: formData.blockScreenshots,
      }).unwrap();
      toast.success('Privacy settings updated');
      onClose();
    } catch (error) {
      toast.error('Failed to update privacy settings');
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </DialogTitle>
          <DialogDescription>
            Control who can contact you and see your activity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Messaging Privacy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label>Who can message me</Label>
            </div>
            <Select
              value={formData.whoCanMessage}
              onValueChange={(value) => setFormData({ ...formData, whoCanMessage: value as MessagePrivacy })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {privacyOptions.whoCanMessage.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Online Visibility */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label>Online visibility</Label>
            </div>
            <Select
              value={formData.onlineVisibility}
              onValueChange={(value) => setFormData({ ...formData, onlineVisibility: value as OnlineVisibility })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {privacyOptions.onlineVisibility.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Toggle Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Read receipts</Label>
                <p className="text-sm text-muted-foreground">
                  Let others know when you've read their messages
                </p>
              </div>
              <Switch
                checked={formData.showReadReceipts}
                onCheckedChange={(checked) => setFormData({ ...formData, showReadReceipts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Typing indicators</Label>
                <p className="text-sm text-muted-foreground">
                  Show when you're typing a message
                </p>
              </div>
              <Switch
                checked={formData.showTypingIndicators}
                onCheckedChange={(checked) => setFormData({ ...formData, showTypingIndicators: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Last seen</Label>
                <p className="text-sm text-muted-foreground">
                  Show when you were last active
                </p>
              </div>
              <Switch
                checked={formData.showLastSeen}
                onCheckedChange={(checked) => setFormData({ ...formData, showLastSeen: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Profile views</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to view your profile
                </p>
              </div>
              <Switch
                checked={formData.allowProfileViews}
                onCheckedChange={(checked) => setFormData({ ...formData, allowProfileViews: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Block screenshots</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when someone takes a screenshot (mobile only)
                </p>
              </div>
              <Switch
                checked={formData.blockScreenshots}
                onCheckedChange={(checked) => setFormData({ ...formData, blockScreenshots: checked })}
              />
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}