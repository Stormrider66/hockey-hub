'use client';

import React from 'react';
import { useSocket } from '@/src/contexts/SocketContext';
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className,
  showText = false,
  size = 'md'
}) => {
  const { connectionState, isConnected, connect } = useSocket();

  const getStatusIcon = () => {
    if (connectionState.connecting) {
      return <Loader2 className="animate-spin" />;
    }
    
    if (isConnected) {
      return <Wifi />;
    }
    
    if (connectionState.error) {
      return <AlertTriangle />;
    }
    
    return <WifiOff />;
  };

  const getStatusColor = () => {
    if (connectionState.connecting) {
      return 'text-yellow-500';
    }
    
    if (isConnected) {
      return 'text-green-500';
    }
    
    if (connectionState.error) {
      return 'text-red-500';
    }
    
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (connectionState.connecting) {
      if (connectionState.reconnectAttempts > 0) {
        return `Reconnecting... (${connectionState.reconnectAttempts})`;
      }
      return 'Connecting...';
    }
    
    if (isConnected) {
      return 'Connected';
    }
    
    if (connectionState.error) {
      return 'Connection failed';
    }
    
    return 'Disconnected';
  };

  const getTooltipText = () => {
    if (connectionState.connecting) {
      return 'Connecting to real-time services...';
    }
    
    if (isConnected) {
      const lastConnected = connectionState.lastConnected?.toLocaleTimeString();
      return `Connected to real-time services${lastConnected ? ` at ${lastConnected}` : ''}`;
    }
    
    if (connectionState.error) {
      return `Connection error: ${connectionState.error}`;
    }
    
    return 'Not connected to real-time services';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  const handleClick = () => {
    if (!isConnected && !connectionState.connecting) {
      connect();
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80',
        className
      )}
      title={getTooltipText()}
      onClick={handleClick}
    >
      <div className={cn(getStatusColor(), getSizeClasses())}>
        {getStatusIcon()}
      </div>
      
      {showText && (
        <span className={cn(
          'text-sm font-medium',
          getStatusColor(),
          size === 'sm' && 'text-xs',
          size === 'lg' && 'text-base'
        )}>
          {getStatusText()}
        </span>
      )}
      
      {connectionState.reconnectAttempts > 0 && !showText && (
        <span className={cn(
          'text-xs bg-yellow-100 text-yellow-800 px-1 rounded',
          size === 'sm' && 'text-xs px-1',
          size === 'lg' && 'text-sm px-2'
        )}>
          {connectionState.reconnectAttempts}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;