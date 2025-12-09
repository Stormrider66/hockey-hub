import React from 'react';
import { Megaphone, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BroadcastIndicatorProps {
  unreadCount?: number;
  priority?: 'normal' | 'important' | 'urgent';
  className?: string;
}

export const BroadcastIndicator: React.FC<BroadcastIndicatorProps> = ({
  unreadCount = 0,
  priority = 'normal',
  className,
}) => {
  if (unreadCount === 0) return null;

  const getIndicatorColor = () => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white animate-pulse';
      case 'important':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getIcon = () => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-3 h-3" />;
      case 'important':
        return <Megaphone className="w-3 h-3" />;
      default:
        return <Megaphone className="w-3 h-3" />;
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Badge
        className={cn(
          'absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center gap-1',
          getIndicatorColor()
        )}
      >
        {getIcon()}
        <span className="text-xs font-semibold">{unreadCount}</span>
      </Badge>
    </div>
  );
};