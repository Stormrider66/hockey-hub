import React, { useState } from 'react';
import { Wifi, WifiOff, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface SessionBroadcastIndicatorProps {
  isConnected: boolean;
  isReconnecting?: boolean;
  queuedUpdates?: number;
  onToggleBroadcast?: (enabled: boolean) => void;
  broadcastEnabled?: boolean;
  className?: string;
}

export function SessionBroadcastIndicator({
  isConnected,
  isReconnecting = false,
  queuedUpdates = 0,
  onToggleBroadcast,
  broadcastEnabled = true,
  className
}: SessionBroadcastIndicatorProps) {
  const { t } = useTranslation('physicalTrainer');
  const [showSettings, setShowSettings] = useState(false);
  
  const getStatusColor = () => {
    if (!broadcastEnabled) return 'bg-gray-500';
    if (isConnected) return 'bg-green-500';
    if (isReconnecting) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getStatusText = () => {
    if (!broadcastEnabled) return t('broadcasting.broadcastingOff');
    if (isConnected) return t('broadcasting.live');
    if (isReconnecting) return t('broadcasting.reconnecting');
    return t('broadcasting.offline');
  };
  
  const getStatusIcon = () => {
    if (!broadcastEnabled) return <EyeOff className="h-4 w-4" />;
    if (isConnected) return <Wifi className="h-4 w-4" />;
    if (isReconnecting) return <Loader2 className="h-4 w-4 animate-spin" />;
    return <WifiOff className="h-4 w-4" />;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Main Status Indicator */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all",
                broadcastEnabled && isConnected && "border-green-500 text-green-700 bg-green-50",
                broadcastEnabled && isReconnecting && "border-yellow-500 text-yellow-700 bg-yellow-50",
                broadcastEnabled && !isConnected && !isReconnecting && "border-red-500 text-red-700 bg-red-50",
                !broadcastEnabled && "border-gray-300 text-gray-600 bg-gray-50"
              )}
              onClick={() => setShowSettings(!showSettings)}
            >
              <div className={cn("w-2 h-2 rounded-full animate-pulse", getStatusColor())} />
              {getStatusIcon()}
              <span className="font-medium">{getStatusText()}</span>
              {queuedUpdates > 0 && broadcastEnabled && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                  {queuedUpdates} {t('broadcasting.queued')}
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{t('broadcasting.sessionBroadcasting')}</p>
              <p className="text-xs text-muted-foreground">
                {broadcastEnabled ? (
                  isConnected ? (
                    t('broadcasting.shareProgress')
                  ) : isReconnecting ? (
                    t('broadcasting.connectionLost')
                  ) : (
                    t('broadcasting.unableToConnect')
                  )
                ) : (
                  t('broadcasting.broadcastingDisabled')
                )}
              </p>
              {queuedUpdates > 0 && (
                <p className="text-xs text-yellow-600">
                  {t('broadcasting.queuedUpdates')}: {queuedUpdates}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Settings Popover */}
      <Popover open={showSettings} onOpenChange={setShowSettings}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{t('broadcasting.sessionBroadcasting')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('broadcasting.shareProgress')}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="broadcast-toggle" className="text-sm font-medium">
                  {t('broadcasting.enableBroadcasting')}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t('broadcasting.allowTrainerToSee')}
                </p>
              </div>
              <Switch
                id="broadcast-toggle"
                checked={broadcastEnabled}
                onCheckedChange={onToggleBroadcast}
              />
            </div>
            
            {broadcastEnabled && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>{t('broadcasting.connectionStatus')}</span>
                  <span className={cn(
                    "font-medium",
                    isConnected && "text-green-600",
                    isReconnecting && "text-yellow-600",
                    !isConnected && !isReconnecting && "text-red-600"
                  )}>
                    {isConnected ? t('broadcasting.connected') : isReconnecting ? t('broadcasting.reconnecting') : t('broadcasting.disconnected')}
                  </span>
                </div>
                
                {queuedUpdates > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('broadcasting.queuedUpdates')}</span>
                    <span className="font-medium text-yellow-600">{queuedUpdates}</span>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{t('broadcasting.whenBroadcastingEnabled')}</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>{t('broadcasting.currentExercise')}</li>
                    <li>{t('broadcasting.heartRateMetrics')}</li>
                    <li>{t('broadcasting.completionStatus')}</li>
                    <li>{t('broadcasting.restPeriods')}</li>
                  </ul>
                </div>
              </div>
            )}
            
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>{t('broadcasting.privacyNote')}:</strong> {t('broadcasting.privacyDescription')}
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}