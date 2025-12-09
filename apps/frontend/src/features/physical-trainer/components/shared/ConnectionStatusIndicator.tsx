import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConnectionStatusIndicatorProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  className?: string;
  showLabel?: boolean;
}

export function ConnectionStatusIndicator({
  status,
  className,
  showLabel = false,
}: ConnectionStatusIndicatorProps) {
  const statusConfig = {
    connecting: {
      icon: Wifi,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Connecting...',
      description: 'Establishing real-time connection',
    },
    connected: {
      icon: Wifi,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Connected',
      description: 'Real-time updates active',
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      label: 'Disconnected',
      description: 'Real-time updates unavailable',
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Connection Error',
      description: 'Unable to establish connection',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-2 px-2 py-1 rounded-md transition-colors',
              config.bgColor,
              className
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4',
                config.color,
                status === 'connecting' && 'animate-pulse'
              )}
            />
            {showLabel && (
              <span className={cn('text-xs font-medium', config.color)}>
                {config.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}