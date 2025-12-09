import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Calendar,
  Heart,
  MessageSquare,
  AlertTriangle,
  Activity,
  Package,
  Megaphone,
  AtSign,
  Smile,
  Trash2,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType, NotificationPriority } from '@/store/api/notificationApi';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  const iconMap: Record<NotificationType, React.ReactNode> = {
    MESSAGE: <MessageSquare className="h-5 w-5 text-blue-500" />,
    MENTION: <AtSign className="h-5 w-5 text-purple-500" />,
    REACTION: <Smile className="h-5 w-5 text-yellow-500" />,
    SYSTEM: <Bell className="h-5 w-5 text-gray-500" />,
    CALENDAR_REMINDER: <Calendar className="h-5 w-5 text-green-500" />,
    CALENDAR_UPDATE: <Calendar className="h-5 w-5 text-blue-500" />,
    CALENDAR_CONFLICT: <Calendar className="h-5 w-5 text-red-500" />,
    TRAINING_SCHEDULED: <Activity className="h-5 w-5 text-blue-500" />,
    TRAINING_UPDATED: <Activity className="h-5 w-5 text-orange-500" />,
    TRAINING_CANCELLED: <Activity className="h-5 w-5 text-red-500" />,
    TRAINING_REMINDER: <Activity className="h-5 w-5 text-green-500" />,
    MEDICAL_APPOINTMENT: <Heart className="h-5 w-5 text-red-500" />,
    MEDICAL_UPDATE: <Heart className="h-5 w-5 text-blue-500" />,
    MEDICAL_ALERT: <Heart className="h-5 w-5 text-red-600" />,
    EQUIPMENT_READY: <Package className="h-5 w-5 text-green-500" />,
    EQUIPMENT_MAINTENANCE: <Package className="h-5 w-5 text-orange-500" />,
    EQUIPMENT_REQUEST: <Package className="h-5 w-5 text-blue-500" />,
    ANNOUNCEMENT: <Megaphone className="h-5 w-5 text-purple-500" />,
    ALERT: <AlertTriangle className="h-5 w-5 text-red-500" />,
  };

  return iconMap[type] || <Bell className="h-5 w-5" />;
};

const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case 'URGENT':
      return 'destructive';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'secondary';
    case 'LOW':
    default:
      return 'outline';
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}) => {
  const isUnread = notification.status === 'DELIVERED';

  const handleClick = () => {
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      className={cn(
        'p-4 hover:bg-muted/50 cursor-pointer transition-colors group relative',
        isUnread && 'bg-muted/20'
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                'text-sm font-medium',
                isUnread && 'font-semibold'
              )}>
                {notification.title}
              </h4>
              {notification.priority !== 'LOW' && (
                <Badge
                  variant={getPriorityColor(notification.priority)}
                  className="text-xs h-5"
                >
                  {notification.priority}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
              {isUnread && (
                <Circle className="h-2 w-2 fill-primary text-primary" />
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.content}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {notification.data?.actionUrl && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = notification.data.actionUrl;
                  }}
                >
                  {notification.data.actionText || 'View'}
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;