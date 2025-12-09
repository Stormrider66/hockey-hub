import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, Calendar as CalendarIcon, Info, Shield, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateSystemAnnouncementMutation, CreateSystemAnnouncementDto } from '@/store/api/systemAnnouncementApi';
import { toast } from 'react-hot-toast';

interface SystemAnnouncementComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'info', label: 'Info', icon: Info, color: 'bg-blue-500' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-500' },
  { value: 'critical', label: 'Critical', icon: Shield, color: 'bg-red-500' },
];

const TYPE_OPTIONS = [
  { value: 'general', label: 'General Announcement' },
  { value: 'maintenance', label: 'Maintenance Notice' },
  { value: 'feature_update', label: 'Feature Update' },
  { value: 'policy_change', label: 'Policy Change' },
  { value: 'security_alert', label: 'Security Alert' },
  { value: 'system_update', label: 'System Update' },
];

const ROLE_OPTIONS = [
  { value: 'player', label: 'Players' },
  { value: 'parent', label: 'Parents' },
  { value: 'coach', label: 'Coaches' },
  { value: 'medical-staff', label: 'Medical Staff' },
  { value: 'equipment-manager', label: 'Equipment Managers' },
  { value: 'physical-trainer', label: 'Physical Trainers' },
  { value: 'club-admin', label: 'Club Administrators' },
  { value: 'admin', label: 'System Administrators' },
];

const NOTIFICATION_CHANNELS = [
  { value: 'in_app', label: 'In-App Notification' },
  { value: 'push', label: 'Push Notification' },
  { value: 'email', label: 'Email' },
];

export const SystemAnnouncementComposer: React.FC<SystemAnnouncementComposerProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateSystemAnnouncementDto>({
    title: '',
    content: '',
    priority: 'info',
    type: 'general',
    targetRoles: [],
    excludedRoles: [],
    metadata: {
      show_banner: false,
      require_acknowledgment: false,
      notification_channels: ['in_app', 'push'],
    },
  });

  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [expiresDate, setExpiresDate] = useState<Date>();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [createAnnouncement, { isLoading }] = useCreateSystemAnnouncementMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const submitData: CreateSystemAnnouncementDto = {
        ...formData,
        scheduledAt: scheduledDate?.toISOString(),
        expiresAt: expiresDate?.toISOString(),
      };

      await createAnnouncement(submitData).unwrap();
      toast.success(scheduledDate ? 'System announcement scheduled successfully' : 'System announcement sent successfully');
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating system announcement:', error);
      toast.error(error.data?.error || 'Failed to create system announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'info',
      type: 'general',
      targetRoles: [],
      excludedRoles: [],
      metadata: {
        show_banner: false,
        require_acknowledgment: false,
        notification_channels: ['in_app', 'push'],
      },
    });
    setScheduledDate(undefined);
    setExpiresDate(undefined);
    setShowAdvanced(false);
  };

  const handleRoleToggle = (role: string, type: 'target' | 'excluded') => {
    const field = type === 'target' ? 'targetRoles' : 'excludedRoles';
    const currentRoles = formData[field] || [];
    
    if (currentRoles.includes(role)) {
      setFormData(prev => ({
        ...prev,
        [field]: currentRoles.filter(r => r !== role),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentRoles, role],
      }));
    }
  };

  const handleChannelToggle = (channel: string) => {
    const currentChannels = formData.metadata?.notification_channels || [];
    
    if (currentChannels.includes(channel)) {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          notification_channels: currentChannels.filter(c => c !== channel),
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          notification_channels: [...currentChannels, channel],
        },
      }));
    }
  };

  if (!isOpen) return null;

  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === formData.priority);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl">Create System Announcement</CardTitle>
            <CardDescription>
              Send important announcements to all users across the platform
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter announcement title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'info' | 'warning' | 'critical') => 
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", option.color)} />
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Announcement Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter announcement content (supports markdown)"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                required
              />
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule For Later (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP p") : "Send immediately"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                    {scheduledDate && (
                      <div className="p-3 border-t">
                        <input
                          type="time"
                          className="w-full p-2 border rounded"
                          onChange={(e) => {
                            if (scheduledDate && e.target.value) {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(scheduledDate);
                              newDate.setHours(parseInt(hours), parseInt(minutes));
                              setScheduledDate(newDate);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setScheduledDate(undefined)}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Expires At (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiresDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiresDate ? format(expiresDate, "PPP p") : "Never expires"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiresDate}
                      onSelect={setExpiresDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                    {expiresDate && (
                      <div className="p-3 border-t">
                        <input
                          type="time"
                          className="w-full p-2 border rounded"
                          onChange={(e) => {
                            if (expiresDate && e.target.value) {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(expiresDate);
                              newDate.setHours(parseInt(hours), parseInt(minutes));
                              setExpiresDate(newDate);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setExpiresDate(undefined)}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_banner"
                  checked={formData.metadata?.show_banner || false}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, show_banner: !!checked }
                    }))
                  }
                />
                <Label htmlFor="show_banner">Show as banner at top of application</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="require_acknowledgment"
                  checked={formData.metadata?.require_acknowledgment || false}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, require_acknowledgment: !!checked }
                    }))
                  }
                />
                <Label htmlFor="require_acknowledgment">Require user acknowledgment</Label>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-2">
              <Label>Notification Channels</Label>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <div key={channel.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={channel.value}
                      checked={formData.metadata?.notification_channels?.includes(channel.value) || false}
                      onCheckedChange={() => handleChannelToggle(channel.value)}
                    />
                    <Label htmlFor={channel.value} className="text-sm">
                      {channel.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Targeting */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Targeting Options
              </Button>

              {showAdvanced && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label>Target Specific Roles (leave empty for all users)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {ROLE_OPTIONS.map((role) => (
                        <div key={role.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`target-${role.value}`}
                            checked={formData.targetRoles?.includes(role.value) || false}
                            onCheckedChange={() => handleRoleToggle(role.value, 'target')}
                          />
                          <Label htmlFor={`target-${role.value}`} className="text-sm">
                            {role.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Exclude Roles</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {ROLE_OPTIONS.map((role) => (
                        <div key={role.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`exclude-${role.value}`}
                            checked={formData.excludedRoles?.includes(role.value) || false}
                            onCheckedChange={() => handleRoleToggle(role.value, 'excluded')}
                          />
                          <Label htmlFor={`exclude-${role.value}`} className="text-sm">
                            {role.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            {(formData.title || formData.content) && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    {selectedPriority && (
                      <div className={cn("w-3 h-3 rounded-full mt-1", selectedPriority.color)} />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{formData.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{formData.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{selectedPriority?.label}</Badge>
                        <Badge variant="outline">
                          {TYPE_OPTIONS.find(t => t.value === formData.type)?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? 'Creating...' 
                  : scheduledDate 
                    ? 'Schedule Announcement' 
                    : 'Send Announcement'
                }
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};