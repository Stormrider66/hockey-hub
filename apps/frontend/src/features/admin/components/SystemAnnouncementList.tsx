import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertTriangle, Calendar, Edit, Eye, Info, MoreHorizontal, Plus, Search, Send, Shield, Trash, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useGetSystemAnnouncementsQuery,
  useSendSystemAnnouncementMutation,
  useCancelSystemAnnouncementMutation,
  useDeleteSystemAnnouncementMutation,
  SystemAnnouncement,
  SystemAnnouncementFilters,
} from '@/store/api/systemAnnouncementApi';
import { toast } from 'react-hot-toast';
import { SystemAnnouncementComposer } from './SystemAnnouncementComposer';

interface SystemAnnouncementListProps {
  onViewDetails?: (announcement: SystemAnnouncement) => void;
  onEditAnnouncement?: (announcement: SystemAnnouncement) => void;
}

const PRIORITY_CONFIG = {
  info: { label: 'Info', icon: Info, color: 'bg-blue-500', variant: 'secondary' as const },
  warning: { label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-500', variant: 'destructive' as const },
  critical: { label: 'Critical', icon: Shield, color: 'bg-red-500', variant: 'destructive' as const },
};

const STATUS_CONFIG = {
  draft: { label: 'Draft', variant: 'secondary' as const },
  scheduled: { label: 'Scheduled', variant: 'outline' as const },
  sending: { label: 'Sending', variant: 'default' as const },
  sent: { label: 'Sent', variant: 'default' as const },
  failed: { label: 'Failed', variant: 'destructive' as const },
  cancelled: { label: 'Cancelled', variant: 'secondary' as const },
  expired: { label: 'Expired', variant: 'secondary' as const },
};

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'general', label: 'General' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'feature_update', label: 'Feature Update' },
  { value: 'policy_change', label: 'Policy Change' },
  { value: 'security_alert', label: 'Security Alert' },
  { value: 'system_update', label: 'System Update' },
];

export const SystemAnnouncementList: React.FC<SystemAnnouncementListProps> = ({
  onViewDetails,
  onEditAnnouncement,
}) => {
  const [filters, setFilters] = useState<SystemAnnouncementFilters>({
    includeExpired: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  const { data, isLoading, refetch } = useGetSystemAnnouncementsQuery(filters);
  const [sendAnnouncement] = useSendSystemAnnouncementMutation();
  const [cancelAnnouncement] = useCancelSystemAnnouncementMutation();
  const [deleteAnnouncement] = useDeleteSystemAnnouncementMutation();

  const filteredAnnouncements = data?.announcements?.filter(announcement =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSendAnnouncement = async (id: string, title: string) => {
    try {
      await sendAnnouncement(id).unwrap();
      toast.success(`Announcement "${title}" sent successfully`);
      refetch();
    } catch (error: any) {
      console.error('Error sending announcement:', error);
      toast.error(error.data?.error || 'Failed to send announcement');
    }
  };

  const handleCancelAnnouncement = async (id: string, title: string) => {
    try {
      await cancelAnnouncement(id).unwrap();
      toast.success(`Announcement "${title}" cancelled successfully`);
      refetch();
    } catch (error: any) {
      console.error('Error cancelling announcement:', error);
      toast.error(error.data?.error || 'Failed to cancel announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the announcement "${title}"?`)) {
      return;
    }

    try {
      await deleteAnnouncement(id).unwrap();
      toast.success(`Announcement "${title}" deleted successfully`);
      refetch();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast.error(error.data?.error || 'Failed to delete announcement');
    }
  };

  const getActionButtons = (announcement: SystemAnnouncement) => {
    const actions = [];

    // View details
    actions.push(
      <DropdownMenuItem
        key="view"
        onClick={() => onViewDetails?.(announcement)}
      >
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </DropdownMenuItem>
    );

    // Edit (only for draft and scheduled)
    if (['draft', 'scheduled'].includes(announcement.status)) {
      actions.push(
        <DropdownMenuItem
          key="edit"
          onClick={() => onEditAnnouncement?.(announcement)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
      );
    }

    // Send (only for draft)
    if (announcement.status === 'draft') {
      actions.push(
        <DropdownMenuItem
          key="send"
          onClick={() => handleSendAnnouncement(announcement.id, announcement.title)}
        >
          <Send className="mr-2 h-4 w-4" />
          Send Now
        </DropdownMenuItem>
      );
    }

    // Cancel (only for scheduled)
    if (announcement.status === 'scheduled') {
      actions.push(
        <DropdownMenuItem
          key="cancel"
          onClick={() => handleCancelAnnouncement(announcement.id, announcement.title)}
          className="text-yellow-600"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </DropdownMenuItem>
      );
    }

    // Delete (only for draft)
    if (announcement.status === 'draft') {
      actions.push(
        <DropdownMenuSeparator key="sep" />,
        <DropdownMenuItem
          key="delete"
          onClick={() => handleDeleteAnnouncement(announcement.id, announcement.title)}
          className="text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      );
    }

    return actions;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Announcements</h2>
          <p className="text-gray-600">Manage platform-wide announcements for all users</p>
        </div>
        <Button onClick={() => setShowComposer(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status as string || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={filters.priority as string || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={filters.type as string || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
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
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Announcements ({data?.total || 0})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No announcements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnouncements.map((announcement) => {
                    const priorityConfig = PRIORITY_CONFIG[announcement.priority];
                    const statusConfig = STATUS_CONFIG[announcement.status];
                    const PriorityIcon = priorityConfig.icon;

                    return (
                      <TableRow key={announcement.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{announcement.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {announcement.content}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {TYPE_OPTIONS.find(t => t.value === announcement.type)?.label || announcement.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", priorityConfig.color)} />
                            <PriorityIcon className="h-4 w-4" />
                            <span className="text-sm">{priorityConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{announcement.total_recipients} total</div>
                            {announcement.status === 'sent' && (
                              <div className="text-gray-500">
                                {announcement.read_count} read
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {announcement.scheduled_at ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(announcement.scheduled_at), 'MMM d, p')}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Immediate</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {getActionButtons(announcement)}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Composer Modal */}
      <SystemAnnouncementComposer
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};