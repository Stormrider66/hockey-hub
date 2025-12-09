import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Send,
  Calendar as CalendarIcon,
  AlertCircle,
  Upload,
  X,
  Users,
  Shield,
  Clock,
  Megaphone,
  Bell,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import FileUpload from './FileUpload';
import { useSendBroadcastMutation } from '@/store/api/communicationApi';
import { useGetOrganizationUsersQuery } from '@/store/api/userApi';

interface BroadcastComposerProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  organizationId: string;
}

type BroadcastPriority = 'normal' | 'important' | 'urgent';
type TargetType = 'team' | 'role' | 'custom';

const ROLES = [
  { value: 'player', label: 'Players' },
  { value: 'parent', label: 'Parents' },
  { value: 'coach', label: 'Coaches' },
  { value: 'medical_staff', label: 'Medical Staff' },
  { value: 'equipment_manager', label: 'Equipment Managers' },
];

export const BroadcastComposer: React.FC<BroadcastComposerProps> = ({
  isOpen,
  onClose,
  teamId,
  organizationId,
}) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [sendBroadcast, { isLoading }] = useSendBroadcastMutation();
  const { data: teamMembers } = useGetOrganizationUsersQuery({ organizationId, role: 'player', teamId });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<BroadcastPriority>('normal');
  const [targetType, setTargetType] = useState<TargetType>('team');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>();
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [attachments, setAttachments] = useState<any[]>([]);
  const [requireAcknowledgment, setRequireAcknowledgment] = useState(false);
  const [allowReplies, setAllowReplies] = useState(true);
  const [pinDurationHours, setPinDurationHours] = useState<number | undefined>();
  const [notificationChannels, setNotificationChannels] = useState<string[]>(['push', 'email']);

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title and content for the broadcast',
        variant: 'destructive',
      });
      return;
    }

    try {
      const broadcastData: any = {
        teamId,
        organizationId,
        title,
        content,
        priority,
        targetType,
        targetUserIds: targetType === 'custom' ? selectedUserIds : undefined,
        targetRoles: targetType === 'role' ? selectedRoles : undefined,
        scheduledAt,
        expiresAt,
        attachments,
        metadata: {
          require_acknowledgment: requireAcknowledgment,
          allow_replies: allowReplies,
          pin_duration_hours: pinDurationHours,
          notification_channels: notificationChannels,
        },
      };

      await sendBroadcast(broadcastData).unwrap();

      toast({
        title: 'Success',
        description: scheduledAt 
          ? 'Broadcast scheduled successfully' 
          : 'Broadcast sent successfully',
      });

      // Reset form
      setTitle('');
      setContent('');
      setPriority('normal');
      setTargetType('team');
      setSelectedRoles([]);
      setSelectedUserIds([]);
      setScheduledAt(undefined);
      setExpiresAt(undefined);
      setAttachments([]);
      setRequireAcknowledgment(false);
      setAllowReplies(true);
      setPinDurationHours(undefined);
      setNotificationChannels(['push', 'email']);

      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.data?.error || 'Failed to send broadcast',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (files: File[]) => {
    // In a real implementation, you would upload files to storage and get URLs
    const newAttachments = files.map((file) => ({
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: URL.createObjectURL(file), // Temporary URL for preview
      name: file.name,
      size: file.size,
      mime_type: file.type,
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getPriorityColor = (p: BroadcastPriority) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'important':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRecipientCount = () => {
    if (!teamMembers) return 0;
    
    switch (targetType) {
      case 'team':
        return teamMembers.length;
      case 'role':
        return teamMembers.filter((member: any) => 
          selectedRoles.some(role => member.roles.includes(role))
        ).length;
      case 'custom':
        return selectedUserIds.length;
      default:
        return 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Create Team Broadcast
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Broadcast Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter broadcast title..."
              className="mt-1"
            />
          </div>

          {/* Priority */}
          <div>
            <Label>Priority Level</Label>
            <RadioGroup
              value={priority}
              onValueChange={(value) => setPriority(value as BroadcastPriority)}
              className="mt-2"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="cursor-pointer">
                    Normal
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="important" id="important" />
                  <Label htmlFor="important" className="cursor-pointer">
                    <span className="text-orange-600">Important</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="cursor-pointer">
                    <span className="text-red-600">Urgent</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Target Audience */}
          <div>
            <Label>Target Audience</Label>
            <Tabs value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="team">Entire Team</TabsTrigger>
                <TabsTrigger value="role">By Role</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
              
              <TabsContent value="team" className="mt-4">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All team members will receive this broadcast
                  <Badge variant="secondary">{teamMembers?.length || 0} recipients</Badge>
                </div>
              </TabsContent>
              
              <TabsContent value="role" className="mt-4">
                <div className="space-y-2">
                  {ROLES.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={role.value}
                        checked={selectedRoles.includes(role.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRoles([...selectedRoles, role.value]);
                          } else {
                            setSelectedRoles(selectedRoles.filter((r) => r !== role.value));
                          }
                        }}
                      />
                      <Label htmlFor={role.value} className="cursor-pointer">
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="mt-4">
                <div className="space-y-2">
                  <Label>Select team members</Label>
                  <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                    {teamMembers?.map((member: any) => (
                      <div key={member.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={member.id}
                          checked={selectedUserIds.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUserIds([...selectedUserIds, member.id]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== member.id));
                            }
                          }}
                        />
                        <Label htmlFor={member.id} className="cursor-pointer text-sm">
                          {member.name} ({member.role})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-2 text-sm text-muted-foreground">
              Recipients: <Badge variant="outline">{getRecipientCount()}</Badge>
            </div>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your broadcast message..."
              className="mt-1 min-h-[150px]"
            />
          </div>

          {/* Attachments */}
          <div>
            <Label>Attachments</Label>
            <FileUpload onUpload={handleFileUpload} multiple />
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm truncate">{attachment.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Schedule for later</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !scheduledAt && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledAt ? format(scheduledAt, 'PPP p') : 'Send immediately'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledAt}
                    onSelect={setScheduledAt}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Expires at</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !expiresAt && 'text-muted-foreground'
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {expiresAt ? format(expiresAt, 'PPP') : 'No expiration'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expiresAt}
                    onSelect={setExpiresAt}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="acknowledge"
                checked={requireAcknowledgment}
                onCheckedChange={(checked) => setRequireAcknowledgment(checked as boolean)}
              />
              <Label htmlFor="acknowledge" className="cursor-pointer">
                Require acknowledgment from recipients
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="replies"
                checked={allowReplies}
                onCheckedChange={(checked) => setAllowReplies(checked as boolean)}
              />
              <Label htmlFor="replies" className="cursor-pointer">
                Allow replies to this broadcast
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="pin-duration">Pin message for</Label>
              <Select
                value={pinDurationHours?.toString() || ''}
                onValueChange={(value) => setPinDurationHours(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Don't pin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Don't pin</SelectItem>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notification channels</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="push"
                    checked={notificationChannels.includes('push')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNotificationChannels([...notificationChannels, 'push']);
                      } else {
                        setNotificationChannels(notificationChannels.filter((c) => c !== 'push'));
                      }
                    }}
                  />
                  <Label htmlFor="push" className="cursor-pointer">
                    Push notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={notificationChannels.includes('email')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNotificationChannels([...notificationChannels, 'email']);
                      } else {
                        setNotificationChannels(notificationChannels.filter((c) => c !== 'email'));
                      }
                    }}
                  />
                  <Label htmlFor="email" className="cursor-pointer">
                    Email notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms"
                    checked={notificationChannels.includes('sms')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNotificationChannels([...notificationChannels, 'sms']);
                      } else {
                        setNotificationChannels(notificationChannels.filter((c) => c !== 'sms'));
                      }
                    }}
                  />
                  <Label htmlFor="sms" className="cursor-pointer">
                    SMS notifications
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || !title.trim() || !content.trim()}
            className={cn(getPriorityColor(priority))}
          >
            {isLoading ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {scheduledAt ? 'Schedule Broadcast' : 'Send Broadcast'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};