import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Trash2, 
  Cloud,
  Info
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import { useTranslation } from 'react-i18next';

interface OfflineQueueManagerProps {
  className?: string;
}

export function OfflineQueueManager({ className }: OfflineQueueManagerProps) {
  const { t } = useTranslation(['physicalTrainer']);
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

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getActionText = (type: string, action: string) => {
    return `${t(`offline.actions.${action}`)} ${t(`offline.types.${type}`)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'syncing':
        return <LoadingSpinner size="sm" variant="primary" center={false} />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'syncing':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'completed':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          {t('offline.queue.title')}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'default' : 'warning'}>
            {isOnline ? t('offline.status.online') : t('offline.status.offline')}
          </Badge>
          {queueSize > 0 && (
            <Badge variant="secondary">
              {t('offline.queue.size', { count: queueSize })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {isOnline 
              ? 'Connected to server. Changes will sync automatically.'
              : 'Working offline. Changes are saved locally and will sync when connection is restored.'
            }
          </AlertDescription>
        </Alert>

        {/* Queue Summary */}
        {queue.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingItems.length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{syncingItems.length}</div>
              <div className="text-sm text-muted-foreground">Syncing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedItems.length}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{queue.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        )}

        {/* Queue Actions */}
        {queue.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {isOnline && pendingItems.length > 0 && (
              <Button
                onClick={syncQueue}
                disabled={syncingItems.length > 0}
                size="sm"
                className="flex items-center gap-2"
              >
                {syncingItems.length > 0 ? (
                  <>
                    <LoadingSpinner size="sm" variant="primary" center={false} className="mr-1" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4" />
                    {t('offline.queue.syncNow')}
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={clearQueue}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('offline.queue.clearAll')}
            </Button>
          </div>
        )}

        {/* Queue Items */}
        {queue.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">{t('offline.queue.empty')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              All your changes are synced with the server
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {queue.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-start justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getStatusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {getActionText(item.type, item.action)}
                          </span>
                          <Badge 
                            variant={getStatusColor(item.status) as any}
                            className="text-xs"
                          >
                            {t(`offline.status.${item.status}`)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.data.title || item.data.name || 'Untitled'}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{formatTimestamp(item.timestamp)}</span>
                          {item.retryCount > 0 && (
                            <span className="text-orange-600">
                              Retry {item.retryCount}/{item.maxRetries}
                            </span>
                          )}
                        </div>
                        {item.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            {item.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {item.status === 'failed' && isOnline && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryItem(item.id)}
                          className="h-8 px-2"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromQueue(item.id)}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {index < queue.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Offline Tips */}
        {!isOnline && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Working Offline:</strong> Your changes are being saved locally. 
              They will automatically sync when your internet connection is restored.
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Failed Help */}
        {failedItems.length > 0 && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Sync Issues:</strong> Some changes couldn't be synced. 
              This might be due to server issues or data conflicts. 
              You can retry individual items or contact support if the problem persists.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default OfflineQueueManager;