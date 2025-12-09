import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  Image,
  Paperclip,
  Send,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  usePostAnnouncementMutation,
  type Conversation,
} from '@/store/api/chatApi';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { useToast } from '@/components/ui/use-toast';
import FileUpload from './FileUpload';

interface CreateAnnouncementModalProps {
  conversation: Conversation;
  onClose: () => void;
}

type Priority = 'normal' | 'important' | 'urgent';

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  conversation,
  onClose,
}) => {
  const currentUser = useSelector(selectCurrentUser);
  const { toast } = useToast();
  const [postAnnouncement, { isLoading }] = usePostAnnouncementMutation();

  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter announcement content',
        variant: 'destructive',
      });
      return;
    }

    try {
      await postAnnouncement({
        conversationId: conversation.id,
        content: content.trim(),
        priority,
        attachments,
      }).unwrap();

      toast({
        title: 'Success',
        description: 'Announcement posted successfully',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post announcement',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (files: any[]) => {
    setAttachments([...attachments, ...files]);
    setShowFileUpload(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getPriorityInfo = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'Urgent',
          description: 'Requires immediate attention. All members will be notified.',
          color: 'text-destructive',
        };
      case 'important':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Important',
          description: 'High priority information. Members will receive a notification.',
          color: 'text-warning',
        };
      default:
        return {
          icon: <FileText className="h-4 w-4" />,
          label: 'Normal',
          description: 'Regular announcement. Members will see it in their feed.',
          color: 'text-muted-foreground',
        };
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
          <DialogDescription>
            Post an announcement to {conversation.name}. Only team members can view announcements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Priority Selection */}
          <div className="space-y-3">
            <Label>Priority Level</Label>
            <RadioGroup value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              {(['normal', 'important', 'urgent'] as Priority[]).map((p) => {
                const info = getPriorityInfo(p);
                return (
                  <div
                    key={p}
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      priority === p ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                    )}
                    onClick={() => setPriority(p)}
                  >
                    <RadioGroupItem value={p} id={p} className="mt-0.5" />
                    <div className="flex-1">
                      <Label
                        htmlFor={p}
                        className={cn("flex items-center gap-2 cursor-pointer", info.color)}
                      >
                        {info.icon}
                        {info.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {info.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Announcement Content</Label>
            <Textarea
              id="content"
              placeholder="Type your announcement here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length} characters
            </p>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attachments (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFileUpload(true)}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Add Files
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="text-sm">{file.filename}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {content && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Preview:</strong> This announcement will be posted by{' '}
                <strong>{currentUser?.name}</strong> with{' '}
                <strong>{getPriorityInfo(priority).label.toLowerCase()}</strong> priority.
                {priority !== 'normal' && ' All team members will receive a notification.'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !content.trim()}>
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2">⏳</span>
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post Announcement
              </>
            )}
          </Button>
        </DialogFooter>

        {/* File Upload Modal */}
        {showFileUpload && (
          <FileUpload
            onUpload={handleFileUpload}
            onClose={() => setShowFileUpload(false)}
            maxFiles={5}
            maxSize={10 * 1024 * 1024} // 10MB
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateAnnouncementModal;