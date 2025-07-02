import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationList from './NotificationList';

interface NotificationBellProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showBadge?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className,
  variant = 'ghost',
  size = 'icon',
  showBadge = true,
}) => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('relative', className)}
        >
          <Bell className="h-5 w-5" />
          {showBadge && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        alignOffset={-8}
        sideOffset={8}
      >
        <NotificationList
          onClose={() => setIsOpen(false)}
          compact
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;