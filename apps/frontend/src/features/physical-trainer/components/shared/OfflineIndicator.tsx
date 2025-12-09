import React from 'react';
import { Cloud, CloudOff, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineIndicator({ className, showDetails = true }: OfflineIndicatorProps) {
  const { 
    isOnline, 
    queueSize, 
    queue, 
    retryItem, 
    removeFromQueue, 
    clearQueue, 
    syncQueue 
  } = useOfflineMode();

  const pendingItems = queue.filter(item => item.status === 'pending');
  const syncingItems = queue.filter(item => item.status === 'syncing');
  const failedItems = queue.filter(item => item.status === 'failed');

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-orange-500" />;
    }

    if (syncingItems.length > 0) {
      return <LoadingSpinner size="sm" variant="primary" center={false} />;
    }

    if (failedItems.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }

    if (pendingItems.length > 0) {
      return <CloudOff className="h-4 w-4 text-orange-500" />;
    }

    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncingItems.length > 0) return 'Syncing...';
    if (failedItems.length > 0) return 'Sync Failed';
    if (pendingItems.length > 0) return 'Pending Sync';
    return 'Online';
  };

  const getStatusColor = () => {
    if (!isOnline || pendingItems.length > 0) return 'warning';
    if (failedItems.length > 0) return 'destructive';
    return 'default';
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActionText = (type: string, action: string) => {
    const actionMap = {
      create: 'Create',
      update: 'Update',
      delete: 'Delete'
    };
    const typeMap = {
      workout: 'Workout',
      session: 'Session',
      update: 'Update'
    };
    return `${actionMap[action as keyof typeof actionMap]} ${typeMap[type as keyof typeof typeMap]}`;
  };

  if (!showDetails) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {getStatusIcon()}
        {queueSize > 0 && (
          <Badge variant="secondary" className="text-xs">
            {queueSize}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-2 h-8 px-3",
            !isOnline && "text-orange-600",
            failedItems.length > 0 && "text-red-600",
            className
          )}
        >
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          {queueSize > 0 && (
            <Badge variant={getStatusColor()} className="h-5 min-w-[20px] text-xs">
              {queueSize}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Connection Status</h4>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-500" />
              )}
              <span className={cn(
                "text-sm font-medium",
                isOnline ? "text-green-600" : "text-orange-600"
              )}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              All changes are synced
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sync Queue ({queue.length})</span>
                {queue.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearQueue}
                    className="h-6 px-2 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {item.status === 'syncing' && (
                            <LoadingSpinner size="xs" variant="primary" center={false} />
                          )}
                          {item.status === 'failed' && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                          {item.status === 'pending' && (
                            <Cloud className="h-3 w-3 text-orange-500" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {getActionText(item.type, item.action)}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(item.timestamp)}
                          </span>
                          {item.retryCount > 0 && (
                            <span className="text-xs text-orange-600">
                              Retry {item.retryCount}/{item.maxRetries}
                            </span>
                          )}
                        </div>
                        {item.error && (
                          <p className="text-xs text-red-600 mt-1 truncate">
                            {item.error}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {item.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryItem(item.id)}
                            className="h-6 px-2 text-xs"
                            disabled={!isOnline}
                          >
                            Retry
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromQueue(item.id)}
                          className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {isOnline && pendingItems.length > 0 && (
                <Button
                  onClick={syncQueue}
                  disabled={syncingItems.length > 0}
                  className="w-full"
                  size="sm"
                >
                  {syncingItems.length > 0 ? (
                    <>
                      <LoadingSpinner size="sm" variant="primary" center={false} className="mr-2" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {!isOnline && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-start gap-2">
                <WifiOff className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Working Offline
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Your changes are being saved locally and will sync automatically when you're back online.
                  </p>
                </div>
              </div>
            </div>
          )}

          {failedItems.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Sync Failed
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {failedItems.length} item(s) failed to sync. Check your connection and try again.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact version for status bars
export function OfflineIndicatorCompact({ className }: { className?: string }) {
  return <OfflineIndicator className={className} showDetails={false} />;
}