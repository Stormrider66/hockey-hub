import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Megaphone,
  Plus,
  Filter,
  Search,
  MoreVertical,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash,
  Copy,
  MessageSquareText,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useDispatch } from 'react-redux';
import { BroadcastComposer } from './BroadcastComposer';
import { BroadcastDetails } from './BroadcastDetails';
import CreateAnnouncementChannelModal from './CreateAnnouncementChannelModal';
import {
  useGetBroadcastsQuery,
  useCancelBroadcastMutation,
  useDeleteBroadcastMutation,
  useSendBroadcastNowMutation,
} from '@/store/api/communicationApi';
import {
  useGetAnnouncementChannelsQuery,
  useCreateAnnouncementChannelMutation,
} from '@/store/api/chatApi';
import { setActiveConversation, toggleChat } from '@/store/slices/chatSlice';

interface BroadcastManagementProps {
  teamId: string;
  organizationId: string;
  coachId: string;
}

type BroadcastStatus = 'all' | 'draft' | 'scheduled' | 'sent' | 'failed';
type BroadcastPriority = 'all' | 'normal' | 'important' | 'urgent';

export const BroadcastManagement: React.FC<BroadcastManagementProps> = ({
  teamId,
  organizationId,
  coachId,
}) => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('broadcasts');
  const [statusFilter, setStatusFilter] = useState<BroadcastStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<BroadcastPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [broadcastToDelete, setBroadcastToDelete] = useState<any>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  const { data, isLoading, refetch } = useGetBroadcastsQuery({
    teamId,
    coachId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
  });

  const [cancelBroadcast] = useCancelBroadcastMutation();
  const [deleteBroadcast] = useDeleteBroadcastMutation();
  const [sendNow] = useSendBroadcastNowMutation();

  // Announcement Channels queries
  const { data: announcementChannels, isLoading: isLoadingChannels } = useGetAnnouncementChannelsQuery();

  const filteredBroadcasts = data?.broadcasts.filter((broadcast: any) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        broadcast.title.toLowerCase().includes(query) ||
        broadcast.content.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'important':
        return <Badge className="bg-orange-100 text-orange-800">Important</Badge>;
      default:
        return null;
    }
  };

  const handleCancel = async (broadcastId: string) => {
    try {
      await cancelBroadcast(broadcastId).unwrap();
      toast({
        title: 'Broadcast cancelled',
        description: 'The scheduled broadcast has been cancelled',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel broadcast',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!broadcastToDelete) return;

    try {
      await deleteBroadcast(broadcastToDelete.id).unwrap();
      toast({
        title: 'Broadcast deleted',
        description: 'The broadcast has been deleted',
      });
      setShowDeleteDialog(false);
      setBroadcastToDelete(null);
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete broadcast',
        variant: 'destructive',
      });
    }
  };

  const handleSendNow = async (broadcastId: string) => {
    try {
      await sendNow(broadcastId).unwrap();
      toast({
        title: 'Broadcast sent',
        description: 'The broadcast has been sent to all recipients',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send broadcast',
        variant: 'destructive',
      });
    }
  };

  const stats = {
    total: data?.total || 0,
    sent: filteredBroadcasts.filter((b: any) => b.status === 'sent').length,
    scheduled: filteredBroadcasts.filter((b: any) => b.status === 'scheduled').length,
    draft: filteredBroadcasts.filter((b: any) => b.status === 'draft').length,
  };

  const handleOpenChannel = (conversationId: string) => {
    dispatch(setActiveConversation(conversationId));
    dispatch(toggleChat());
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="w-6 h-6" />
              Communication Management
            </h2>
            <p className="text-muted-foreground">
              Manage broadcasts and announcement channels
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="broadcasts" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Broadcasts
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Announcement Channels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="broadcasts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Team Broadcasts</h3>
              <Button onClick={() => setShowComposer(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Broadcast
              </Button>
            </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Total Broadcasts</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search broadcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BroadcastStatus)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as BroadcastPriority)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="important">Important</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Broadcasts Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Scheduled/Sent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading broadcasts...
                  </TableCell>
                </TableRow>
              ) : filteredBroadcasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No broadcasts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBroadcasts.map((broadcast: any) => (
                  <TableRow key={broadcast.id} className="cursor-pointer hover:bg-accent">
                    <TableCell onClick={() => {
                      setSelectedBroadcast(broadcast);
                      setShowDetails(true);
                    }}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(broadcast.status)}
                        <div>
                          <div className="font-medium">{broadcast.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {broadcast.content}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(broadcast.priority)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(broadcast.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {broadcast.total_recipients}
                      </div>
                    </TableCell>
                    <TableCell>
                      {broadcast.status === 'sent' && (
                        <div className="text-sm">
                          <div>{broadcast.delivered_count}/{broadcast.total_recipients} delivered</div>
                          <div className="text-muted-foreground">
                            {broadcast.read_count} read, {broadcast.acknowledged_count} ack
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {broadcast.scheduled_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(broadcast.scheduled_at), 'MMM d, h:mm a')}
                          </div>
                        )}
                        {broadcast.sent_at && (
                          <div className="text-muted-foreground">
                            Sent {format(new Date(broadcast.sent_at), 'MMM d, h:mm a')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedBroadcast(broadcast);
                            setShowDetails(true);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {broadcast.status === 'draft' && (
                            <>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendNow(broadcast.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                Send Now
                              </DropdownMenuItem>
                            </>
                          )}
                          {broadcast.status === 'scheduled' && (
                            <DropdownMenuItem onClick={() => handleCancel(broadcast.id)}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {broadcast.status === 'draft' && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setBroadcastToDelete(broadcast);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Announcement Channels</h3>
              <Button onClick={() => setShowCreateChannel(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Channel
              </Button>
            </div>

            {/* Announcement Channels List */}
            <div className="grid gap-4">
              {isLoadingChannels ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    Loading announcement channels...
                  </CardContent>
                </Card>
              ) : announcementChannels && announcementChannels.length > 0 ? (
                announcementChannels.map((channel: any) => (
                  <Card key={channel.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleOpenChannel(channel.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Megaphone className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{channel.name}</CardTitle>
                            {channel.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {channel.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {channel.participants.length} members
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {channel.unreadCount > 0 ? (
                              <span className="font-medium text-foreground">
                                {channel.unreadCount} new
                              </span>
                            ) : (
                              'No new messages'
                            )}
                          </span>
                          {channel.lastMessage && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(channel.lastMessage.createdAt), 'MMM d, h:mm a')}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChannel(channel.id);
                          }}
                        >
                          <MessageSquareText className="h-4 w-4 mr-2" />
                          Open Channel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Announcement Channels</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first announcement channel to share important updates with your team.
                    </p>
                    <Button onClick={() => setShowCreateChannel(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Channel
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Broadcast Composer */}
      <BroadcastComposer
        isOpen={showComposer}
        onClose={() => {
          setShowComposer(false);
          refetch();
        }}
        teamId={teamId}
        organizationId={organizationId}
      />

      {/* Broadcast Details */}
      {selectedBroadcast && (
        <BroadcastDetails
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedBroadcast(null);
          }}
          broadcast={selectedBroadcast}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Broadcast</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this broadcast? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Announcement Channel Modal */}
      {showCreateChannel && (
        <CreateAnnouncementChannelModal
          teamId={teamId}
          organizationId={organizationId}
          onClose={() => setShowCreateChannel(false)}
          onSuccess={(channelId) => {
            setShowCreateChannel(false);
            handleOpenChannel(channelId);
          }}
        />
      )}
    </>
  );
};