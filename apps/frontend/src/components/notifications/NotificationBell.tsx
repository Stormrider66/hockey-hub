'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { useGetNotificationStatsQuery } from '@/store/api/notificationApi';
import { NotificationCenter } from './NotificationCenter';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
  showPopover?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  className,
  showPopover = true 
}) => {
  const [open, setOpen] = useState(false);
  const { data: stats } = useGetNotificationStatsQuery();
  
  const unreadCount = stats?.unreadCount || 0;

  const bellButton = (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      onClick={showPopover ? undefined : () => window.location.href = '/notifications'}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  if (!showPopover) {
    return bellButton;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {bellButton}
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="end">
        <div className="max-h-[600px] overflow-hidden">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  window.location.href = '/notifications';
                }}
              >
                View All
              </Button>
            </div>
          </div>
          <NotificationCenter embedded={true} maxHeight="400px" />
        </div>
      </PopoverContent>
    </Popover>
  );
};