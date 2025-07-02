'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Settings, Filter, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters } from './NotificationFilters';
import { NotificationPreferences } from './NotificationPreferences';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../types';

interface NotificationCenterProps {
  userId: string;
  organizationId?: string;
  className?: string;
}

export function NotificationCenter({ userId, organizationId, className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    type: undefined as NotificationType | undefined,
    priority: undefined as NotificationPriority | undefined,
    unreadOnly: false,
  });

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markMultipleAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications({
    recipientId: userId,
    organizationId,
    ...filters,
    limit: 50,
  });

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.read_at;
      case 'important':
        return notification.priority === 'high' || notification.priority === 'urgent';
      case 'calendar':
        return notification.type.includes('event') || notification.type.includes('rsvp') || notification.type.includes('schedule');
      case 'training':
        return notification.type.includes('training');
      case 'medical':
        return notification.type.includes('medical') || notification.type.includes('injury');
      default:
        return true;
    }
  });

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length > 0) {
      await markMultipleAsRead(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  const handleBulkDelete = async () => {
    for (const notificationId of selectedNotifications) {
      await deleteNotification(notificationId);
    }
    setSelectedNotifications([]);
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'unread':
        return notifications.filter(n => !n.read_at).length;
      case 'important':
        return notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length;
      case 'calendar':
        return notifications.filter(n => 
          n.type.includes('event') || n.type.includes('rsvp') || n.type.includes('schedule')
        ).length;
      case 'training':
        return notifications.filter(n => n.type.includes('training')).length;
      case 'medical':
        return notifications.filter(n => 
          n.type.includes('medical') || n.type.includes('injury')
        ).length;
      default:
        return notifications.length;
    }
  };

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPreferences(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 border-b bg-muted/50">
              <NotificationFilters 
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 h-8 text-xs">
              <TabsTrigger value="all" className="text-xs">
                All {getTabCount('all') > 0 && <Badge variant="secondary" className="ml-1 text-xs">{getTabCount('all')}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                New {getTabCount('unread') > 0 && <Badge variant="secondary" className="ml-1 text-xs">{getTabCount('unread')}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="important" className="text-xs">
                Important {getTabCount('important') > 0 && <Badge variant="secondary" className="ml-1 text-xs">{getTabCount('important')}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs">
                Calendar {getTabCount('calendar') > 0 && <Badge variant="secondary" className="ml-1 text-xs">{getTabCount('calendar')}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="training" className="text-xs">
                Training {getTabCount('training') > 0 && <Badge variant="secondary" className="ml-1 text-xs">{getTabCount('training')}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="medical" className="text-xs">
                Medical {getTabCount('medical') > 0 && <Badge variant="secondary" className="ml-1 text-xs">{getTabCount('medical')}</Badge>}
              </TabsTrigger>
            </TabsList>

            {selectedNotifications.length > 0 && (
              <div className="flex items-center justify-between p-2 bg-muted/50 border-b text-sm">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedNotifications.length === filteredNotifications.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span>{selectedNotifications.length} selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleBulkMarkAsRead}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="h-96">
              <TabsContent value={activeTab} className="m-0">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {activeTab === 'unread' ? 'No new notifications' : 'No notifications'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        isSelected={selectedNotifications.includes(notification.id)}
                        onSelect={(selected) => {
                          if (selected) {
                            setSelectedNotifications(prev => [...prev, notification.id]);
                          } else {
                            setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                          }
                        }}
                        onMarkAsRead={() => markAsRead(notification.id)}
                        onDelete={() => deleteNotification(notification.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="p-2 border-t text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshNotifications}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {showPreferences && (
        <NotificationPreferences
          userId={userId}
          organizationId={organizationId}
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
}