import React, { useState } from 'react';
import { usePersistence, useApiCacheMonitor } from '@/hooks/usePersistence';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Download, Upload, Trash2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PersistenceDebugPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const PersistenceDebugPanel: React.FC<PersistenceDebugPanelProps> = ({ isOpen = true, onClose }) => {
  const {
    storageInfo,
    quotaInfo,
    isClearing,
    clearAll,
    clearReducer,
    exportState,
    importState,
    updateStorageInfo,
  } = usePersistence();

  const [selectedApi, setSelectedApi] = useState('authApi');
  const apiCache = useApiCacheMonitor(selectedApi);

  if (!isOpen) return null;

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importState(file).catch(error => {
        console.error('Import failed:', error);
        alert('Failed to import state. Please check the file format.');
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Redux Persist Debug</CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
          <CardDescription>Monitor and manage persisted state</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Storage Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Size:</span>
              <span className="font-mono">{formatBytes(storageInfo.size)}</span>
            </div>
            
            {quotaInfo.quota > 0 && (
              <>
                <Progress value={quotaInfo.percentUsed} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatBytes(quotaInfo.used)} used</span>
                  <span>{formatBytes(quotaInfo.quota)} total</span>
                </div>
              </>
            )}
            
            {quotaInfo.isNearQuota && (
              <Alert className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Storage quota is nearly full ({quotaInfo.percentUsed.toFixed(1)}%)
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* API Cache Monitor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">API Cache Monitor</label>
            <select
              value={selectedApi}
              onChange={(e) => setSelectedApi(e.target.value)}
              className="w-full px-3 py-1 text-sm border rounded-md"
            >
              <option value="authApi">Auth API</option>
              <option value="calendarApi">Calendar API</option>
              <option value="trainingApi">Training API</option>
              <option value="playerApi">Player API</option>
              <option value="dashboardApi">Dashboard API</option>
              <option value="recentWorkoutsApi">Recent Workouts API</option>
            </select>
            <div className="text-xs text-muted-foreground">
              {apiCache.cacheEntries} entries, {formatBytes(apiCache.cacheSize)}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStorageInfo()}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={exportState}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              
              <label className="flex-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure you want to clear all persisted state?')) {
                  clearAll();
                }
              }}
              disabled={isClearing}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isClearing ? 'Clearing...' : 'Clear All State'}
            </Button>
          </div>

          {/* Clear Specific Reducer */}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Advanced Options</summary>
            <div className="mt-2 space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => clearReducer(selectedApi)}
                disabled={isClearing}
                className="w-full"
              >
                Clear {selectedApi} Cache
              </Button>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

// Development-only hook to show debug panel
export const usePersistenceDebugPanel = () => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Keyboard shortcut to toggle debug panel (Ctrl+Shift+P)
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          e.preventDefault();
          setShowDebugPanel(prev => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
    return undefined;
  }, []);

  return {
    showDebugPanel,
    setShowDebugPanel,
    DebugPanel: showDebugPanel ? (
      <PersistenceDebugPanel
        isOpen={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
    ) : null,
  };
};