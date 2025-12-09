import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ExportRequest {
  type: 'workout-summary' | 'player-progress' | 'team-performance' | 'medical-compliance' | 'historical-trends' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'html';
  filters: {
    teamId?: string;
    playerId?: string;
    sessionId?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    workoutTypes?: string[];
    includeCharts?: boolean;
    includeMedicalData?: boolean;
    includePlayerBreakdown?: boolean;
    includeInjuryHistory?: boolean;
    includeReturnToPlay?: boolean;
    includeForecasting?: boolean;
    metrics?: string[];
  };
  template?: {
    templateId?: string;
    customTemplate?: any;
  };
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  metadata?: {
    fileSize: number;
    format: string;
    generatedAt: Date;
  };
  error?: string;
}

export interface ScheduledReport {
  id: string;
  reportType: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  format: string;
  recipients: string[];
  active: boolean;
  nextRun: Date;
  createdAt: Date;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  supportedFormats: string[];
  previewUrl?: string;
}

const STATISTICS_API_BASE = process.env.NEXT_PUBLIC_API_GATEWAY_URL 
  ? `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/statistics-service/api/statistics/export`
  : 'http://localhost:3007/api/statistics/export';

export const useExportAnalytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportReport = useCallback(async (request: ExportRequest): Promise<ExportResult> => {
    setLoading(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const endpoint = getExportEndpoint(request.type);
      const response = await fetch(`${STATISTICS_API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          ...request.filters,
          format: request.format,
          templateId: request.template?.templateId
        })
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const result = await response.json();
      
      toast({
        title: "Export Generated",
        description: `Your ${request.type} report is ready for download.`,
      });

      return {
        success: true,
        downloadUrl: result.downloadUrl,
        metadata: result.metadata
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [toast]);

  const bulkExport = useCallback(async (reports: ExportRequest[]): Promise<ExportResult> => {
    setLoading(true);
    setProgress(0);

    try {
      const response = await fetch(`${STATISTICS_API_BASE}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          reports: reports.map(report => ({
            type: report.type,
            filters: report.filters
          })),
          format: 'zip',
          deliveryMethod: 'download'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk export failed');
      }

      const result = await response.json();
      
      toast({
        title: "Bulk Export Complete",
        description: `${reports.length} reports have been generated successfully.`,
      });

      return {
        success: true,
        downloadUrl: result.reports?.[0]?.downloadUrl,
        metadata: {
          fileSize: result.reports?.reduce((sum: number, r: any) => sum + r.metadata.fileSize, 0) || 0,
          format: 'zip',
          generatedAt: new Date()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bulk export failed';
      
      toast({
        title: "Bulk Export Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [toast]);

  const getExportTemplates = useCallback(async (): Promise<ExportTemplate[]> => {
    try {
      const response = await fetch(`${STATISTICS_API_BASE}/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const result = await response.json();
      return result.templates || [];
    } catch (error) {
      console.error('Failed to fetch export templates:', error);
      return [];
    }
  }, []);

  const scheduleReport = useCallback(async (config: {
    reportType: string;
    schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    filters: any;
    format: string;
    recipients: string[];
    active?: boolean;
  }): Promise<ScheduledReport | null> => {
    try {
      const response = await fetch(`${STATISTICS_API_BASE}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule report');
      }

      const result = await response.json();
      
      toast({
        title: "Report Scheduled",
        description: `Your ${config.schedule} ${config.reportType} report has been scheduled.`,
      });

      return result.scheduledReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule report';
      
      toast({
        title: "Scheduling Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return null;
    }
  }, [toast]);

  const getScheduledReports = useCallback(async (): Promise<ScheduledReport[]> => {
    try {
      const response = await fetch(`${STATISTICS_API_BASE}/scheduled`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scheduled reports');
      }

      const result = await response.json();
      return result.reports || [];
    } catch (error) {
      console.error('Failed to fetch scheduled reports:', error);
      return [];
    }
  }, []);

  // Quick export functions for common report types
  const exportWorkoutSummary = useCallback((sessionId: string, format: 'pdf' | 'excel' | 'csv' | 'html' = 'pdf') => {
    return exportReport({
      type: 'workout-summary',
      format,
      filters: {
        sessionId,
        includeCharts: true
      }
    });
  }, [exportReport]);

  const exportPlayerProgress = useCallback((playerId: string, teamId?: string, format: 'pdf' | 'excel' | 'csv' | 'html' = 'pdf') => {
    return exportReport({
      type: 'player-progress',
      format,
      filters: {
        playerId,
        teamId,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        includeMedicalData: true
      }
    });
  }, [exportReport]);

  const exportTeamPerformance = useCallback((teamId: string, format: 'pdf' | 'excel' | 'csv' | 'html' = 'pdf') => {
    return exportReport({
      type: 'team-performance',
      format,
      filters: {
        teamId,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        includeCharts: true,
        includePlayerBreakdown: true
      }
    });
  }, [exportReport]);

  const exportMedicalCompliance = useCallback((teamId?: string, playerId?: string, format: 'pdf' | 'excel' | 'csv' | 'html' = 'excel') => {
    return exportReport({
      type: 'medical-compliance',
      format,
      filters: {
        teamId,
        playerId,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        includeInjuryHistory: true,
        includeReturnToPlay: true
      }
    });
  }, [exportReport]);

  const exportHistoricalTrends = useCallback((entityId: string, entityType: 'team' | 'player', format: 'pdf' | 'excel' | 'csv' | 'html' = 'csv') => {
    return exportReport({
      type: 'historical-trends',
      format,
      filters: {
        [entityType === 'team' ? 'teamId' : 'playerId']: entityId,
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        metrics: ['performance', 'adherence', 'completion', 'load'],
        includeForecasting: true
      }
    });
  }, [exportReport]);

  return {
    // Core export functions
    exportReport,
    bulkExport,
    
    // Template and scheduling
    getExportTemplates,
    scheduleReport,
    getScheduledReports,
    
    // Quick export functions
    exportWorkoutSummary,
    exportPlayerProgress,
    exportTeamPerformance,
    exportMedicalCompliance,
    exportHistoricalTrends,
    
    // State
    loading,
    progress
  };
};

function getExportEndpoint(reportType: string): string {
  switch (reportType) {
    case 'workout-summary':
      return 'workout-summary';
    case 'player-progress':
      return 'player-progress';
    case 'team-performance':
      return 'team-performance';
    case 'medical-compliance':
      return 'medical-compliance';
    case 'historical-trends':
      return 'historical-trends';
    default:
      return 'workout-summary';
  }
}