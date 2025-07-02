import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Megaphone,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Search,
  Filter,
  Download,
  RefreshCw,
  Mail,
  Bell,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetBroadcastRecipientsQuery } from '@/store/api/communicationApi';

interface BroadcastDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  broadcast: any;
}

type RecipientFilter = 'all' | 'pending' | 'delivered' | 'read' | 'acknowledged' | 'failed';

export const BroadcastDetails: React.FC<BroadcastDetailsProps> = ({
  isOpen,
  onClose,
  broadcast,
}) => {
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: recipients, isLoading, refetch } = useGetBroadcastRecipientsQuery(
    broadcast?.id,
    { skip: !broadcast?.id }
  );

  const filteredRecipients = recipients?.filter((recipient: any) => {
    const matchesStatus = recipientFilter === 'all' || recipient.status === recipientFilter;
    const matchesSearch = !searchQuery || 
      recipient.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.user?.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'acknowledged':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'read':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'acknowledged':
        return <Badge className="bg-green-100 text-green-800">Acknowledged</Badge>;
      case 'read':
        return <Badge className="bg-blue-100 text-blue-800">Read</Badge>;
      case 'delivered':
        return <Badge variant="secondary">Delivered</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">URGENT</Badge>;
      case 'important':
        return <Badge className="bg-orange-100 text-orange-800">IMPORTANT</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'push':
        return <Bell className="w-3 h-3" />;
      case 'sms':
        return <Smartphone className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const stats = {
    deliveryRate: broadcast ? (broadcast.delivered_count / broadcast.total_recipients) * 100 : 0,
    readRate: broadcast ? (broadcast.read_count / broadcast.total_recipients) * 100 : 0,
    acknowledgmentRate: broadcast && broadcast.metadata?.require_acknowledgment
      ? (broadcast.acknowledged_count / broadcast.total_recipients) * 100 : 0,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Broadcast Details
          </DialogTitle>
        </DialogHeader>

        {broadcast && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="overview" className="space-y-6 p-4">
                {/* Broadcast Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{broadcast.title}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    {getPriorityBadge(broadcast.priority)}
                    {getStatusBadge(broadcast.status)}
                    {broadcast.expires_at && (
                      <Badge variant="outline">
                        Expires {format(new Date(broadcast.expires_at), 'MMM d, yyyy')}
                      </Badge>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground mb-4">
                    {broadcast.content}
                  </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Delivery Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {broadcast.delivered_count}/{broadcast.total_recipients}
                      </span>
                    </div>
                    <Progress value={stats.deliveryRate} className="mb-1" />
                    <span className="text-xs text-muted-foreground">{stats.deliveryRate.toFixed(0)}%</span>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Read Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {broadcast.read_count}/{broadcast.total_recipients}
                      </span>
                    </div>
                    <Progress value={stats.readRate} className="mb-1" />
                    <span className="text-xs text-muted-foreground">{stats.readRate.toFixed(0)}%</span>
                  </div>
                  {broadcast.metadata?.require_acknowledgment && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Acknowledgment Rate</span>
                        <span className="text-sm text-muted-foreground">
                          {broadcast.acknowledged_count}/{broadcast.total_recipients}
                        </span>
                      </div>
                      <Progress value={stats.acknowledgmentRate} className="mb-1" />
                      <span className="text-xs text-muted-foreground">{stats.acknowledgmentRate.toFixed(0)}%</span>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="space-y-2">
                  <h4 className="font-medium">Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      {format(new Date(broadcast.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                    {broadcast.scheduled_at && (
                      <div>
                        <span className="text-muted-foreground">Scheduled:</span>{' '}
                        {format(new Date(broadcast.scheduled_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    )}
                    {broadcast.sent_at && (
                      <div>
                        <span className="text-muted-foreground">Sent:</span>{' '}
                        {format(new Date(broadcast.sent_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Target:</span>{' '}
                      {broadcast.target_type === 'team' ? 'Entire Team' : 
                       broadcast.target_type === 'role' ? `Roles: ${broadcast.target_roles?.join(', ')}` :
                       'Custom Selection'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Channels:</span>{' '}
                      <div className="inline-flex gap-1">
                        {broadcast.metadata?.notification_channels?.map((channel: string) => (
                          <span key={channel} className="inline-flex items-center gap-1">
                            {getChannelIcon(channel)}
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                    {broadcast.metadata?.pin_duration_hours && (
                      <div>
                        <span className="text-muted-foreground">Pinned for:</span>{' '}
                        {broadcast.metadata.pin_duration_hours} hours
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                {broadcast.attachments && broadcast.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Attachments</h4>
                    <div className="space-y-2">
                      {broadcast.attachments.map((attachment: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{attachment.name}</span>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recipients" className="p-4">
                {/* Filters */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search recipients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={recipientFilter} onValueChange={(v) => setRecipientFilter(v as RecipientFilter)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Recipients Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Read</TableHead>
                        <TableHead>Acknowledged</TableHead>
                        <TableHead>Channels</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading recipients...
                          </TableCell>
                        </TableRow>
                      ) : filteredRecipients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No recipients found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecipients.map((recipient: any) => (
                          <TableRow key={recipient.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{recipient.user?.name || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">{recipient.user?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(recipient.status)}
                                {getStatusBadge(recipient.status)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {recipient.delivered_at && format(new Date(recipient.delivered_at), 'MMM d, h:mm a')}
                            </TableCell>
                            <TableCell>
                              {recipient.read_at && format(new Date(recipient.read_at), 'MMM d, h:mm a')}
                            </TableCell>
                            <TableCell>
                              {recipient.acknowledged_at && (
                                <div>
                                  <div>{format(new Date(recipient.acknowledged_at), 'MMM d, h:mm a')}</div>
                                  {recipient.acknowledgment_note && (
                                    <div className="text-sm text-muted-foreground">{recipient.acknowledgment_note}</div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {recipient.notification_channels?.map((channel: string) => (
                                  <span key={channel} className="inline-flex items-center">
                                    {getChannelIcon(channel)}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="p-4 space-y-6">
                {/* Engagement Timeline */}
                <div>
                  <h4 className="font-medium mb-4">Engagement Timeline</h4>
                  <div className="space-y-2">
                    {/* This would be a chart in a real implementation */}
                    <div className="p-4 border rounded-lg text-center text-muted-foreground">
                      Engagement timeline chart would go here
                    </div>
                  </div>
                </div>

                {/* Channel Performance */}
                <div>
                  <h4 className="font-medium mb-4">Channel Performance</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {['push', 'email', 'sms'].map((channel) => (
                      <div key={channel} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {getChannelIcon(channel)}
                          <span className="font-medium capitalize">{channel}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Performance metrics would go here
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};