import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Alert,
  Toolbar,
  Tooltip,
  Zoom,
  Fab
} from '@mui/material';
import { CircularProgress } from '@/components/ui/loading';
import {
  Print,
  Download,
  Share,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  FitScreen,
  Computer,
  TabletMac,
  PhoneIphone,
  Refresh,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import {
  ReportConfig,
  ReportSection,
  ReportType,
  PlayerPerformanceData,
  TeamAnalyticsData,
  InjuryRiskData,
  TrainingLoadData,
  ProgressComparisonData
} from '../../types/report.types';
import { useReportData } from '../../hooks/useReportData';
import PlayerPerformancePreview from './previews/PlayerPerformancePreview';
import TeamAnalyticsPreview from './previews/TeamAnalyticsPreview';
import InjuryRiskPreview from './previews/InjuryRiskPreview';
import TrainingLoadPreview from './previews/TrainingLoadPreview';
import ProgressComparisonPreview from './previews/ProgressComparisonPreview';

interface ReportPreviewProps {
  config: ReportConfig;
  sections: ReportSection[];
  onExport: () => void;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
  config,
  sections,
  onExport
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const previewRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data, loading, error, refetch } = useReportData(config);

  // Handle zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleFitScreen = () => {
    setZoom(100);
  };

  // Handle fullscreen
  const handleFullscreen = () => {
    if (!isFullscreen && previewRef.current) {
      previewRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Get viewport dimensions
  const getViewportDimensions = () => {
    switch (viewport) {
      case 'tablet':
        return { width: 768, maxWidth: 768 };
      case 'mobile':
        return { width: 375, maxWidth: 375 };
      default:
        return { width: '100%', maxWidth: 1200 };
    }
  };

  // Render report content based on type
  const renderReportContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={60} color="currentColor" />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!data) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          {t('physicalTrainer:reports.preview.noData')}
        </Alert>
      );
    }

    switch (config.type) {
      case ReportType.PLAYER_PERFORMANCE:
        return (
          <PlayerPerformancePreview
            data={data as PlayerPerformanceData}
            config={config}
            sections={sections}
          />
        );

      case ReportType.TEAM_ANALYTICS:
        return (
          <TeamAnalyticsPreview
            data={data as TeamAnalyticsData}
            config={config}
            sections={sections}
          />
        );

      case ReportType.INJURY_RISK:
        return (
          <InjuryRiskPreview
            data={data as InjuryRiskData}
            config={config}
            sections={sections}
          />
        );

      case ReportType.TRAINING_LOAD:
        return (
          <TrainingLoadPreview
            data={data as TrainingLoadData}
            config={config}
            sections={sections}
          />
        );

      case ReportType.PROGRESS_COMPARISON:
        return (
          <ProgressComparisonPreview
            data={data as ProgressComparisonData}
            config={config}
            sections={sections}
          />
        );

      default:
        return (
          <Alert severity="warning" sx={{ m: 2 }}>
            {t('physicalTrainer:reports.preview.unsupportedType')}
          </Alert>
        );
    }
  };

  const dimensions = getViewportDimensions();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Paper sx={{ p: 1, mb: 2 }}>
        <Toolbar variant="dense" disableGutters>
          {/* Viewport Toggle */}
          <ToggleButtonGroup
            value={viewport}
            exclusive
            onChange={(e, value) => value && setViewport(value)}
            size="small"
            sx={{ mr: 2 }}
          >
            <ToggleButton value="desktop">
              <Tooltip title={t('physicalTrainer:reports.preview.desktop')}>
                <Computer />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="tablet">
              <Tooltip title={t('physicalTrainer:reports.preview.tablet')}>
                <TabletMac />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="mobile">
              <Tooltip title={t('physicalTrainer:reports.preview.mobile')}>
                <PhoneIphone />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Zoom Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut />
            </IconButton>
            <Typography variant="body2" sx={{ mx: 1, minWidth: 50, textAlign: 'center' }}>
              {zoom}%
            </Typography>
            <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn />
            </IconButton>
            <IconButton size="small" onClick={handleFitScreen}>
              <FitScreen />
            </IconButton>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Page Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <IconButton
              size="small"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              <NavigateBefore />
            </IconButton>
            <Typography variant="body2" sx={{ mx: 1 }}>
              {t('physicalTrainer:reports.preview.page', { current: currentPage, total: totalPages })}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              <NavigateNext />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Actions */}
          <Tooltip title={t('physicalTrainer:reports.preview.refresh')}>
            <IconButton onClick={refetch} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('physicalTrainer:reports.preview.fullscreen')}>
            <IconButton onClick={handleFullscreen}>
              <Fullscreen />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('physicalTrainer:reports.preview.print')}>
            <IconButton onClick={handlePrint}>
              <Print />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={onExport}
            sx={{ ml: 1 }}
          >
            {t('physicalTrainer:reports.preview.export')}
          </Button>
        </Toolbar>
      </Paper>

      {/* Preview Container */}
      <Box
        ref={previewRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: 'grey.100',
          display: 'flex',
          justifyContent: 'center',
          p: 2,
          '@media print': {
            bgcolor: 'white',
            p: 0
          }
        }}
      >
        <Paper
          sx={{
            ...dimensions,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s',
            minHeight: 600,
            '@media print': {
              transform: 'none',
              width: '100%',
              maxWidth: 'none',
              boxShadow: 'none'
            }
          }}
          elevation={3}
        >
          {renderReportContent()}
        </Paper>
      </Box>

      {/* Floating Action Button for Quick Export */}
      {!isFullscreen && (
        <Zoom in>
          <Fab
            color="primary"
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16
            }}
            onClick={onExport}
          >
            <Download />
          </Fab>
        </Zoom>
      )}
    </Box>
  );
};

export default ReportPreview;