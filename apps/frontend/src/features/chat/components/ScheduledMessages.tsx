import React, { useState } from 'react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { Clock, Send, X, Edit2, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  useGetScheduledMessagesQuery,
  useCancelScheduledMessageMutation,
  ScheduledMessage,
} from '@/store/api/scheduledMessageApi';
import ScheduleMessageModal from './ScheduleMessageModal';

interface ScheduledMessagesProps {
  conversationId?: string;
  className?: string;
}

const ScheduledMessages: React.FC<ScheduledMessagesProps> = ({
  conversationId,
  className,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'sent' | 'failed' | 'cancelled'>('all');
  const [messageToCancel, setMessageToCancel] = useState<ScheduledMessage | null>(null);
  const [messageToEdit, setMessageToEdit] = useState<ScheduledMessage | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const { data: messages = [], isLoading, refetch } = useGetScheduledMessagesQuery({
    conversationId,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });

  const [cancelMessage] = useCancelScheduledMessageMutation();

  const handleCancel = async () => {
    if (!messageToCancel) return;

    try {
      await cancelMessage(messageToCancel.id).unwrap();
      toast.success('Scheduled message cancelled');
      setMessageToCancel(null);
      refetch();
    } catch (error) {
      toast.error('Failed to cancel scheduled message');
    }
  };

  const getStatusIcon = (status: ScheduledMessage['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ScheduledMessage['status']) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'sent':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
    }
  };

  const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'sent', label: 'Sent' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const groupMessagesByDate = (messages: ScheduledMessage[]) => {
    const groups: Record<string, ScheduledMessage[]> = {};
    
    messages.forEach((message) => {
      const date = format(new Date(message.scheduledFor), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Scheduled Messages</h2>
          <Button size="sm" onClick={() => setShowScheduleModal(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule New
          </Button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1">
          {statusTabs.map((tab) => (
            <Button
              key={tab.value}
              variant={selectedStatus === tab.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedStatus(tab.value as 'all' | 'pending' | 'sent' | 'failed' | 'cancelled')}
              className="flex-1"
            >
              {tab.label}
              {tab.value !== 'all' && (
                <Badge variant="secondary" className="ml-2">
                  {messages.filter((m) => m.status === tab.value).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages list */}
      <ScrollArea className="flex-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No scheduled messages</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowScheduleModal(true)}
            >
              Schedule your first message
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {groupMessagesByDate(messages).map(([date, dateMessages]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="space-y-3">
                  {dateMessages.map((message) => (
                    <Card key={message.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(message.status)}>
                              {getStatusIcon(message.status)}
                              <span className="ml-1 capitalize">{message.status}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {message.status === 'sent' && message.sentAt
                                ? `Sent ${formatDistanceToNow(new Date(message.sentAt), {
                                    addSuffix: true,
                                  })}`
                                : message.status === 'pending'
                                ? isPast(new Date(message.scheduledFor))
                                  ? 'Processing...'
                                  : `In ${formatDistanceToNow(new Date(message.scheduledFor))}`
                                : format(new Date(message.scheduledFor), 'p')}
                            </span>
                          </div>
                          {message.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setMessageToEdit(message)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setMessageToCancel(message)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.failureReason && (
                          <div className="mt-2 p-2 bg-destructive/10 text-destructive text-sm rounded">
                            Error: {message.failureReason}
                          </div>
                        )}
                        {message.retryCount > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Retry attempts: {message.retryCount}/{message.maxRetries}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Cancel confirmation dialog */}
      <AlertDialog
        open={!!messageToCancel}
        onOpenChange={(open) => !open && setMessageToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the scheduled message. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {messageToCancel && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm">{messageToCancel.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled for {format(new Date(messageToCancel.scheduledFor), 'PPp')}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">
              Cancel Message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule new message modal */}
      <ScheduleMessageModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        conversationId={conversationId || ''}
      />
    </div>
  );
};

export default ScheduledMessages;