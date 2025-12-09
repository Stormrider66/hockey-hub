/**
 * Cache Management UI Component
 * 
 * Provides a user interface for managing application cache
 * including viewing status, clearing cache, and monitoring size.
 */

import React, { useState } from 'react';
import { 
  useClearCache, 
  useCacheStatus, 
  useCacheSize,
  useAutoCacheClear 
} from '@/hooks/useCache';
import { 
  Alert, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box, 
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

export const CacheManagement: React.FC = () => {
  const { status, isLoading: statusLoading, error: statusError, refreshStatus } = useCacheStatus();
  const { sizeInfo, totalSizeFormatted, apiSizes, getCacheAge, refreshSize } = useCacheSize();
  const { clearAllCache, clearExpired, clearBySize, isClearing, lastResult } = useClearCache();
  const { lastClearTime, clearedCount } = useAutoCacheClear(true, 24, 60);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'all' | 'expired' | 'size' | null;
    title: string;
    message: string;
  }>({
    open: false,
    action: null,
    title: '',
    message: ''
  });
  
  const [autoClearEnabled, setAutoClearEnabled] = useState(true);

  const handleClearAll = () => {
    setConfirmDialog({
      open: true,
      action: 'all',
      title: 'Clear All Cache',
      message: 'This will clear all cached data. The application will need to fetch fresh data from the server. Continue?'
    });
  };

  const handleClearExpired = () => {
    setConfirmDialog({
      open: true,
      action: 'expired',
      title: 'Clear Expired Cache',
      message: 'This will remove cache entries older than 24 hours. Continue?'
    });
  };

  const handleClearBySize = () => {
    setConfirmDialog({
      open: true,
      action: 'size',
      title: 'Clear Cache by Size',
      message: 'This will remove old cache entries to keep cache under 50MB. Continue?'
    });
  };

  const handleConfirm = async () => {
    const { action } = confirmDialog;
    setConfirmDialog({ ...confirmDialog, open: false });

    switch (action) {
      case 'all':
        await clearAllCache();
        break;
      case 'expired':
        await clearExpired(24);
        break;
      case 'size':
        await clearBySize(50);
        break;
    }

    // Refresh status after clearing
    setTimeout(() => {
      refreshStatus();
      refreshSize();
    }, 500);
  };

  const cacheAge = getCacheAge();

  return (
    <Box>
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <StorageIcon />
              <Typography variant="h6">Cache Management</Typography>
            </Box>
          }
          action={
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh Status">
                <IconButton onClick={() => { refreshStatus(); refreshSize(); }} disabled={statusLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        <CardContent>
          {statusError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {statusError}
            </Alert>
          )}

          {lastResult && (
            <Alert 
              severity={lastResult.success ? 'success' : 'error'} 
              sx={{ mb: 2 }}
              onClose={() => {}}
            >
              {lastResult.success 
                ? `Successfully cleared ${lastResult.clearedCount} cache entries`
                : `Failed to clear cache: ${lastResult.error}`
              }
            </Alert>
          )}

          {statusLoading ? (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
            </Box>
          ) : (
            <>
              {/* Cache Status */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Cache Status</strong>
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Version"
                      secondary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{status?.version || 'Unknown'}</span>
                          {status?.needsMigration && (
                            <Chip 
                              label="Migration Available" 
                              size="small" 
                              color="warning" 
                              icon={<WarningIcon />}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Total Size"
                      secondary={totalSizeFormatted}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Entries"
                      secondary={sizeInfo?.entryCount || 0}
                    />
                  </ListItem>
                  {cacheAge && (
                    <ListItem>
                      <ListItemText 
                        primary="Oldest Entry"
                        secondary={cacheAge}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Cache by API */}
              {apiSizes.length > 0 && (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Cache by API</strong>
                    </Typography>
                    <List dense>
                      {apiSizes.map(({ api, formatted }) => (
                        <ListItem key={api}>
                          <ListItemText 
                            primary={api}
                            secondary={formatted}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Auto Clear Settings */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Automatic Cleanup</strong>
                </Typography>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={autoClearEnabled} 
                      onChange={(e) => setAutoClearEnabled(e.target.checked)}
                    />
                  }
                  label="Enable automatic cleanup of old cache entries"
                />
                {lastClearTime && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    <ScheduleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Last cleanup: {lastClearTime.toLocaleString()} 
                    {clearedCount > 0 && ` (${clearedCount} entries removed)`}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleClearAll}
                  disabled={isClearing}
                >
                  Clear All Cache
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={handleClearExpired}
                  disabled={isClearing}
                >
                  Clear Expired
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<StorageIcon />}
                  onClick={handleClearBySize}
                  disabled={isClearing}
                >
                  Optimize Size
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};