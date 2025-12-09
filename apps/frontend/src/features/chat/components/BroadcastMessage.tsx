import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Megaphone,
  AlertCircle,
  CheckCircle,
  Clock,
  Paperclip,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { 
  useAcknowledgeBroadcastMutation,
  useMarkBroadcastAsReadMutation,
} from '@/store/api/communicationApi';

interface BroadcastMessageProps {
  message: {
    id: string;
    broadcast_id: string;
    broadcast_priority: 'normal' | 'important' | 'urgent';
    sender_id: string;
    content: string;
    created_at: string;
    metadata?: {
      broadcast_title?: string;
      attachments?: Array<{
        type: string;
        url: string;
        name: string;
        size: number;
        mime_type: string;
      }>;
      require_acknowledgment?: boolean;
      allow_replies?: boolean;
      pin_duration_hours?: number;
    };
    sender?: {
      id: string;
      name: string;
      avatar?: string;
      role: string;
    };
  };
  recipientStatus?: {
    status: 'pending' | 'delivered' | 'read' | 'acknowledged';
    read_at?: string;
    acknowledged_at?: string;
    acknowledgment_note?: string;
  };
  broadcastStats?: {
    total_recipients: number;
    delivered_count: number;
    read_count: number;
    acknowledged_count: number;
  };
  currentUserId: string;
  onReply?: () => void;
}

export const BroadcastMessage: React.FC<BroadcastMessageProps> = ({
  message,
  recipientStatus,
  broadcastStats,
  currentUserId,
  onReply,
}) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [acknowledgmentNote, setAcknowledgmentNote] = useState('');
  const [showAcknowledgmentForm, setShowAcknowledgmentForm] = useState(false);
  
  const [acknowledgeBroadcast, { isLoading: isAcknowledging }] = useAcknowledgeBroadcastMutation();
  const [markAsRead] = useMarkBroadcastAsReadMutation();

  const isCoach = message.sender_id === currentUserId;
  const requiresAcknowledgment = message.metadata?.require_acknowledgment && !recipientStatus?.acknowledged_at;
  const allowReplies = message.metadata?.allow_replies;

  React.useEffect(() => {
    // Mark as read when viewed
    if (message.broadcast_id && recipientStatus?.status !== 'read' && recipientStatus?.status !== 'acknowledged') {
      markAsRead(message.broadcast_id);
    }
  }, [message.broadcast_id, recipientStatus?.status]);

  const handleAcknowledge = async () => {
    try {
      await acknowledgeBroadcast({
        broadcastId: message.broadcast_id,
        note: acknowledgmentNote,
      }).unwrap();
      
      toast({
        title: 'Broadcast acknowledged',
        description: 'Your acknowledgment has been recorded',
      });
      
      setShowAcknowledgmentForm(false);
      setAcknowledgmentNote('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge broadcast',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'important':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'important':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Megaphone className="w-4 h-4 text-blue-600" />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">URGENT</Badge>;
      case 'important':
        return <Badge className="bg-orange-500 text-white">IMPORTANT</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    if (!recipientStatus) return null;
    
    switch (recipientStatus.status) {
      case 'acknowledged':
        return (
          <Tooltip>
            <TooltipTrigger>
              <CheckCheck className="w-4 h-4 text-green-600" />
            </TooltipTrigger>
            <TooltipContent>
              Acknowledged {recipientStatus.acknowledged_at && format(new Date(recipientStatus.acknowledged_at), 'MMM d, h:mm a')}
            </TooltipContent>
          </Tooltip>
        );
      case 'read':
        return (
          <Tooltip>
            <TooltipTrigger>
              <CheckCheck className="w-4 h-4 text-blue-600" />
            </TooltipTrigger>
            <TooltipContent>
              Read {recipientStatus.read_at && format(new Date(recipientStatus.read_at), 'MMM d, h:mm a')}
            </TooltipContent>
          </Tooltip>
        );
      case 'delivered':
        return (
          <Tooltip>
            <TooltipTrigger>
              <Check className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>Delivered</TooltipContent>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Card className={cn(
        'p-4 mb-4 border-2 transition-all',
        getPriorityColor(message.broadcast_priority),
        'hover:shadow-md'
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={message.sender?.avatar} alt={message.sender?.name} />
              <AvatarFallback>{message.sender?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                {getPriorityIcon(message.broadcast_priority)}
                <span className="font-semibold">{message.metadata?.broadcast_title || 'Team Broadcast'}</span>
                {getPriorityLabel(message.broadcast_priority)}
              </div>
              <div className="text-sm text-muted-foreground">
                From {message.sender?.name} • {format(new Date(message.created_at), 'MMM d, h:mm a')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCoach && getStatusIcon()}
            {isCoach && broadcastStats && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-3 whitespace-pre-wrap">{message.content}</div>

        {/* Attachments */}
        {message.metadata?.attachments && message.metadata.attachments.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Paperclip className="w-4 h-4" />
              Attachments ({message.metadata.attachments.length})
            </div>
            <div className="space-y-2">
              {message.metadata.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-background rounded-md hover:bg-accent"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">{attachment.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(attachment.size / 1024)} KB)
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Acknowledgment Section */}
        {!isCoach && requiresAcknowledgment && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium">Acknowledgment Required</span>
            </div>
            {showAcknowledgmentForm ? (
              <div className="space-y-2">
                <Textarea
                  value={acknowledgmentNote}
                  onChange={(e) => setAcknowledgmentNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAcknowledge}
                    disabled={isAcknowledging}
                  >
                    {isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAcknowledgmentForm(false);
                      setAcknowledgmentNote('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAcknowledgmentForm(true)}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Acknowledge Broadcast
              </Button>
            )}
          </div>
        )}

        {/* Reply Button */}
        {!isCoach && allowReplies && onReply && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onReply}
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Reply to Broadcast
            </Button>
          </div>
        )}

        {/* Coach Statistics */}
        {isCoach && broadcastStats && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent>
              <div className="mt-4 p-3 bg-background rounded-md border">
                <h4 className="text-sm font-semibold mb-3">Broadcast Statistics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {broadcastStats.delivered_count}/{broadcastStats.total_recipients}
                    </div>
                    <div className="text-xs text-muted-foreground">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {broadcastStats.read_count}/{broadcastStats.total_recipients}
                    </div>
                    <div className="text-xs text-muted-foreground">Read</div>
                  </div>
                  {message.metadata?.require_acknowledgment && (
                    <div className="text-center col-span-2">
                      <div className="text-2xl font-bold">
                        {broadcastStats.acknowledged_count}/{broadcastStats.total_recipients}
                      </div>
                      <div className="text-xs text-muted-foreground">Acknowledged</div>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm">
                    <span>Delivery Rate</span>
                    <span className="font-medium">
                      {Math.round((broadcastStats.delivered_count / broadcastStats.total_recipients) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(broadcastStats.delivered_count / broadcastStats.total_recipients) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </Card>
    </TooltipProvider>
  );
};