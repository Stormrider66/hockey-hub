'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { Wifi, WifiOff, Circle } from 'lucide-react';
import {
  selectIsConnected,
  selectIsConnecting,
  selectConnectionQuality,
} from '@/store/slices/socketSlice';
import { RootState } from '@/store/store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function EnhancedConnectionStatus() {
  const isConnected = useSelector(selectIsConnected);
  const isConnecting = useSelector(selectIsConnecting);
  const connectionQuality = useSelector(selectConnectionQuality);
  const reconnectAttempts = useSelector((state: RootState) => state.socket.reconnectAttempts);

  const getStatusColor = () => {
    if (!isConnected) return 'text-gray-400';
    switch (connectionQuality) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-green-400';
      case 'fair':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    if (isConnecting) {
      return reconnectAttempts > 0 
        ? `Reconnecting... (Attempt ${reconnectAttempts})`
        : 'Connecting...';
    }
    if (!isConnected) return 'Offline';
    
    switch (connectionQuality) {
      case 'excellent':
        return 'Excellent connection';
      case 'good':
        return 'Good connection';
      case 'fair':
        return 'Fair connection';
      case 'poor':
        return 'Poor connection';
      default:
        return 'Unknown';
    }
  };

  const getIcon = () => {
    if (!isConnected) {
      return <WifiOff className="h-4 w-4" />;
    }
    return <Wifi className="h-4 w-4" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              getStatusColor()
            )}
            aria-label="Connection status"
          >
            {isConnecting ? (
              <Circle className="h-4 w-4 animate-pulse" />
            ) : (
              getIcon()
            )}
            <span className="sr-only">{getStatusText()}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">{getStatusText()}</p>
            {isConnected && connectionQuality !== 'offline' && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Real-time features active
              </p>
            )}
            {!isConnected && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Updates will sync when reconnected
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for mobile
export function EnhancedConnectionStatusCompact() {
  const isConnected = useSelector(selectIsConnected);
  const isConnecting = useSelector(selectIsConnecting);
  const connectionQuality = useSelector(selectConnectionQuality);

  const getStatusColor = () => {
    if (!isConnected) return 'bg-gray-400';
    switch (connectionQuality) {
      case 'excellent':
      case 'good':
        return 'bg-green-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          getStatusColor(),
          isConnecting && 'animate-pulse'
        )}
        aria-label={isConnected ? 'Connected' : 'Disconnected'}
      />
      {isConnecting && (
        <div className={cn(
          'absolute inset-0 h-2 w-2 rounded-full animate-ping',
          getStatusColor(),
          'opacity-75'
        )} />
      )}
    </div>
  );
}