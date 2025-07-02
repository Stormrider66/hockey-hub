'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Bell, 
  CheckCheck, 
  Filter, 
  Search, 
  Trash2, 
  Calendar,
  Dumbbell,
  Heart,
  Wrench,
  Info,
  AlertCircle,
  Clock,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  useGetNotificationsQuery,
  useGetNotificationStatsQuery,
  useMarkAsReadMutation,
  useMarkMultipleAsReadMutation,
  useDeleteNotificationMutation,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  Notification
} from '@/store/api/notificationApi';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { notificationSoundService } from '@/services/NotificationSoundService';

// Icon mapping for notification types
const notificationIcons: Record<NotificationType, React.ComponentType<any>> = {
  // Calendar Events
  [NotificationType.EVENT_REMINDER]: Calendar,
  [NotificationType.EVENT_CREATED]: Calendar,
  [NotificationType.EVENT_UPDATED]: Calendar,
  [NotificationType.EVENT_CANCELLED]: Calendar,
  [NotificationType.RSVP_REQUEST]: Calendar,
  [NotificationType.SCHEDULE_CONFLICT]: AlertCircle,
  
  // Training
  [NotificationType.TRAINING_ASSIGNED]: Dumbbell,
  [NotificationType.TRAINING_COMPLETED]: Dumbbell,
  [NotificationType.TRAINING_OVERDUE]: AlertCircle,
  
  // Medical
  [NotificationType.MEDICAL_APPOINTMENT]: Heart,
  [NotificationType.INJURY_UPDATE]: Heart,
  [NotificationType.MEDICAL_CLEARANCE]: Heart,
  
  // Equipment
  [NotificationType.EQUIPMENT_DUE]: Wrench,
  [NotificationType.EQUIPMENT_READY]: Wrench,
  [NotificationType.MAINTENANCE_REQUIRED]: Wrench,
  
  // General
  [NotificationType.ANNOUNCEMENT]: Info,
  [NotificationType.SYSTEM_ALERT]: AlertCircle,
  [NotificationType.PAYMENT_DUE]: AlertCircle,
  [NotificationType.TEAM_UPDATE]: Info,
};

// Priority color mapping
const priorityColors = {
  [NotificationPriority.LOW]: 'bg-gray-100 text-gray-800',
  [NotificationPriority.NORMAL]: 'bg-blue-100 text-blue-800',
  [NotificationPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [NotificationPriority.URGENT]: 'bg-red-100 text-red-800',
};

interface NotificationCenterProps {
  embedded?: boolean;
  maxHeight?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  embedded = false,
  maxHeight = '600px' 
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [previousNotificationCount, setPreviousNotificationCount] = useState<number>(0);

  // API hooks
  const { 
    data: notificationsData, 
    isLoading, 
    error,
    refetch 
  } = useGetNotificationsQuery({
    unreadOnly: activeTab === 'unread',
    type: typeFilter !== 'all' ? typeFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
  });

  const { data: stats } = useGetNotificationStatsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markMultipleAsRead] = useMarkMultipleAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  // Filter notifications by search query
  const filteredNotifications = notificationsData?.notifications.filter(notification => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return notification.title.toLowerCase().includes(query) || 
           notification.message.toLowerCase().includes(query);
  }) || [];

  // Handle marking notification as read
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read_at) return;
    
    try {
      await markAsRead(notification.id).unwrap();
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  // Handle marking multiple as read
  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      await markMultipleAsRead(Array.from(selectedNotifications)).unwrap();
      toast.success(`${selectedNotifications.size} notifications marked as read`);
      setSelectedNotifications(new Set());
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  // Handle delete notification
  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId).unwrap();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Toggle selection
  const toggleSelection = (notificationId: string) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  // Select all visible
  const selectAll = () => {
    const allIds = new Set(filteredNotifications.map(n => n.id));
    setSelectedNotifications(allIds);
  };

  // Real-time updates simulation (in production, this would use Socket.io)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  // Play sound when new notifications arrive
  useEffect(() => {
    if (stats && stats.unreadCount > previousNotificationCount && previousNotificationCount > 0) {
      // New notification(s) arrived
      const newNotifications = filteredNotifications.filter(n => !n.read_at);
      if (newNotifications.length > 0) {
        // Play sound for the most recent notification type
        const mostRecentType = newNotifications[0].type;
        notificationSoundService.playNotificationSound(mostRecentType);
      }
    }
    
    if (stats) {
      setPreviousNotificationCount(stats.unreadCount);
    }
  }, [stats?.unreadCount, filteredNotifications, previousNotificationCount]);

  const renderNotification = (notification: Notification) => {
    const Icon = notificationIcons[notification.type] || Info;
    const isRead = !!notification.read_at;
    const isSelected = selectedNotifications.has(notification.id);

    return (
      <div
        key={notification.id}
        className={cn(
          'p-4 border-b transition-colors cursor-pointer hover:bg-gray-50',
          !isRead && 'bg-blue-50/30',
          isSelected && 'bg-blue-100/30'
        )}
        onClick={() => handleMarkAsRead(notification)}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(notification.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
          <div className={cn(
            'p-2 rounded-full',
            isRead ? 'bg-gray-100' : 'bg-blue-100'
          )}>
            <Icon className={cn(
              'h-4 w-4',
              isRead ? 'text-gray-600' : 'text-blue-600'
            )} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className={cn(
                  'text-sm font-medium',
                  isRead ? 'text-gray-700' : 'text-gray-900'
                )}>
                  {notification.title}
                </h4>
                <p className={cn(
                  'text-sm',
                  isRead ? 'text-gray-500' : 'text-gray-700'
                )}>
                  {notification.message}
                </p>
                {notification.action_url && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(notification.action_url, '_blank');
                    }}
                  >
                    {notification.action_text || 'View Details'}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={priorityColors[notification.priority]}>
                  {notification.priority}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
              {notification.channels.map(channel => (
                <Badge key={channel} variant="outline" className="text-xs">
                  {channel}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (embedded) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Notifications</CardTitle>
            {stats && (
              <Badge variant="secondary">
                {stats.unreadCount} unread
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <Alert variant="destructive" className="m-4">
                <AlertDescription>
                  Failed to load notifications
                </AlertDescription>
              </Alert>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                No notifications
              </div>
            ) : (
              <div>
                {filteredNotifications.slice(0, 5).map(renderNotification)}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notification Center</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={typeFilter}
                    onValueChange={(value) => setTypeFilter(value as NotificationType | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.values(NotificationType).map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={priorityFilter}
                    onValueChange={(value) => setPriorityFilter(value as NotificationPriority | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {Object.values(NotificationPriority).map(priority => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">
              All {stats && `(${stats.totalNotifications})`}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread {stats && `(${stats.unreadCount})`}
            </TabsTrigger>
          </TabsList>
          
          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {selectedNotifications.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkSelectedAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark as Read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNotifications(new Set())}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="all" className="mt-4">
          <Card>
            <ScrollArea style={{ maxHeight }}>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <Alert variant="destructive" className="m-4">
                  <AlertDescription>
                    Failed to load notifications. Please try again.
                  </AlertDescription>
                </Alert>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No notifications found</p>
                </div>
              ) : (
                <div>
                  <div className="p-2 border-b bg-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAll}
                      className="text-xs"
                    >
                      Select All ({filteredNotifications.length})
                    </Button>
                  </div>
                  {filteredNotifications.map(renderNotification)}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          <Card>
            <ScrollArea style={{ maxHeight }}>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <CheckCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>All caught up!</p>
                  <p className="text-sm mt-2">No unread notifications</p>
                </div>
              ) : (
                <div>
                  <div className="p-2 border-b bg-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAll}
                      className="text-xs"
                    >
                      Select All ({filteredNotifications.length})
                    </Button>
                  </div>
                  {filteredNotifications.map(renderNotification)}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};