'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  Calendar,
  Users,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Eye,
  X
} from 'lucide-react';

import { 
  ExportOptions,
  ExportSection,
  AnalyticsDashboardFilters,
  PlayerPerformanceData,
  TeamPerformanceData
} from '../../types/performance-analytics.types';

interface ExportOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => Promise<void>;
  data: {
    players: PlayerPerformanceData[];
    teams: TeamPerformanceData[];
  } | null;
  filters: AnalyticsDashboardFilters;
}

export function ExportOptionsModal({
  open,
  onOpenChange,
  onExport,
  data,
  filters
}: ExportOptionsModalProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Export state
  const [exportFormat, setExportFormat] = useState<ExportOptions['format']>('pdf');
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'summary',
    'team-performance',
    'player-performance',
    'trends'
  ]);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'preparing' | 'generating' | 'complete' | 'error'>('idle');

  // Available export formats
  const exportFormats = [
    { 
      key: 'pdf' as const, 
      label: 'PDF Report', 
      icon: FileText, 
      description: 'Comprehensive report with charts and analysis',
      extension: '.pdf'
    },
    { 
      key: 'csv' as const, 
      label: 'CSV Data', 
      icon: FileSpreadsheet, 
      description: 'Raw data in spreadsheet format',
      extension: '.csv'
    },
    { 
      key: 'xlsx' as const, 
      label: 'Excel Workbook', 
      icon: FileSpreadsheet, 
      description: 'Multiple sheets with data and charts',
      extension: '.xlsx'
    },
    { 
      key: 'png' as const, 
      label: 'Chart Images', 
      icon: FileImage, 
      description: 'Individual chart images as PNG files',
      extension: '.png'
    },
    { 
      key: 'json' as const, 
      label: 'JSON Data', 
      icon: FileCode, 
      description: 'Raw data in JSON format for API integration',
      extension: '.json'
    }
  ];

  // Available sections for export
  const availableSections: (ExportSection & { description: string })[] = [
    {
      id: 'summary',
      name: 'Executive Summary',
      enabled: true,
      description: 'High-level overview and key insights'
    },
    {
      id: 'team-performance',
      name: 'Team Performance',
      enabled: true,
      description: 'Team-level metrics and comparisons'
    },
    {
      id: 'player-performance',
      name: 'Individual Player Performance',
      enabled: true,
      description: 'Detailed player analytics and trends'
    },
    {
      id: 'trends',
      name: 'Performance Trends',
      enabled: true,
      description: 'Historical trends and trajectory analysis'
    },
    {
      id: 'load-management',
      name: 'Load Management',
      enabled: false,
      description: 'Training load analysis and injury risk'
    },
    {
      id: 'workout-effectiveness',
      name: 'Workout Effectiveness',
      enabled: false,
      description: 'Analysis of workout program success'
    },
    {
      id: 'recommendations',
      name: 'Recommendations',
      enabled: false,
      description: 'AI-generated insights and action items'
    },
    {
      id: 'raw-data',
      name: 'Raw Data Tables',
      enabled: false,
      description: 'Complete dataset for further analysis'
    }
  ];

  // Calculate estimated file size and export time
  const exportEstimates = useMemo(() => {
    const baseSize = exportFormat === 'pdf' ? 2 : exportFormat === 'xlsx' ? 1.5 : 0.5; // MB
    const sectionMultiplier = selectedSections.length * 0.5;
    const chartMultiplier = includeCharts ? 1.5 : 1;
    const dataMultiplier = includeRawData ? 2 : 1;
    const playerMultiplier = selectedPlayers.length > 0 ? selectedPlayers.length * 0.1 : 1;
    
    const estimatedSize = baseSize * sectionMultiplier * chartMultiplier * dataMultiplier * playerMultiplier;
    const estimatedTime = Math.max(5, Math.round(estimatedSize * 2)); // 2 seconds per MB, minimum 5 seconds

    return {
      size: estimatedSize.toFixed(1),
      time: estimatedTime
    };
  }, [exportFormat, selectedSections.length, includeCharts, includeRawData, selectedPlayers.length]);

  // Handle section toggle
  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Handle player selection
  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Handle team selection
  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Handle export
  const handleExport = async () => {
    if (selectedSections.length === 0) return;

    setIsExporting(true);
    setExportStatus('preparing');
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressSteps = [10, 25, 50, 75, 90, 100];
      const statusSteps = ['preparing', 'generating', 'generating', 'generating', 'generating', 'complete'];
      
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setExportProgress(progressSteps[i]);
        setExportStatus(statusSteps[i] as any);
      }

      const exportOptions: ExportOptions = {
        format: exportFormat,
        sections: availableSections
          .filter(section => selectedSections.includes(section.id))
          .map(section => ({
            id: section.id,
            name: section.name,
            enabled: true
          })),
        includeCharts,
        includeRawData,
        dateRange: filters.dateRange,
        players: selectedPlayers.length > 0 ? selectedPlayers : undefined,
        teams: selectedTeams.length > 0 ? selectedTeams : undefined
      };

      await onExport(exportOptions);
      
      // Reset after successful export
      setTimeout(() => {
        setIsExporting(false);
        setExportStatus('idle');
        setExportProgress(0);
        onOpenChange(false);
      }, 1000);

    } catch (error) {
      setExportStatus('error');
      setTimeout(() => {
        setIsExporting(false);
        setExportStatus('idle');
        setExportProgress(0);
      }, 2000);
    }
  };

  const selectedFormat = exportFormats.find(f => f.key === exportFormat);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('physicalTrainer:analytics.export.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Export Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exportFormats.map(format => (
                  <div
                    key={format.key}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      exportFormat === format.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setExportFormat(format.key)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <format.icon className="h-4 w-4" />
                      <span className="font-medium">{format.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {format.extension}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{format.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Content Sections
                <Badge variant="secondary">{selectedSections.length} selected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableSections.map(section => (
                  <div key={section.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={section.id}
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={() => handleSectionToggle(section.id)}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={section.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {section.name}
                      </label>
                      <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-charts"
                  checked={includeCharts}
                  onCheckedChange={setIncludeCharts}
                />
                <label htmlFor="include-charts" className="text-sm font-medium cursor-pointer">
                  Include Charts and Visualizations
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-raw-data"
                  checked={includeRawData}
                  onCheckedChange={setIncludeRawData}
                />
                <label htmlFor="include-raw-data" className="text-sm font-medium cursor-pointer">
                  Include Raw Data Tables
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Data Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Players
                  {selectedPlayers.length > 0 && (
                    <Badge variant="secondary">{selectedPlayers.length} selected</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="all-players"
                      checked={selectedPlayers.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedPlayers([]);
                      }}
                    />
                    <label htmlFor="all-players" className="text-sm font-medium cursor-pointer">
                      All Players
                    </label>
                  </div>
                  {data?.players.slice(0, 10).map(player => (
                    <div key={player.playerId} className="flex items-center space-x-2">
                      <Checkbox
                        id={`player-${player.playerId}`}
                        checked={selectedPlayers.includes(player.playerId)}
                        onCheckedChange={() => handlePlayerToggle(player.playerId)}
                      />
                      <label 
                        htmlFor={`player-${player.playerId}`}
                        className="text-sm cursor-pointer"
                      >
                        {player.playerName}
                      </label>
                    </div>
                  ))}
                  {data && data.players.length > 10 && (
                    <p className="text-xs text-gray-500">
                      Showing first 10 players. Select "All Players" for complete data.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teams
                  {selectedTeams.length > 0 && (
                    <Badge variant="secondary">{selectedTeams.length} selected</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="all-teams"
                      checked={selectedTeams.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedTeams([]);
                      }}
                    />
                    <label htmlFor="all-teams" className="text-sm font-medium cursor-pointer">
                      All Teams
                    </label>
                  </div>
                  {data?.teams.map(team => (
                    <div key={team.teamId} className="flex items-center space-x-2">
                      <Checkbox
                        id={`team-${team.teamId}`}
                        checked={selectedTeams.includes(team.teamId)}
                        onCheckedChange={() => handleTeamToggle(team.teamId)}
                      />
                      <label 
                        htmlFor={`team-${team.teamId}`}
                        className="text-sm cursor-pointer"
                      >
                        {team.teamName} ({team.playerCount} players)
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {exportStatus === 'preparing' && 'Preparing export...'}
                      {exportStatus === 'generating' && 'Generating report...'}
                      {exportStatus === 'complete' && 'Export complete!'}
                      {exportStatus === 'error' && 'Export failed'}
                    </span>
                    <span className="text-sm text-gray-500">{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                  {exportStatus === 'error' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Export failed. Please try again or contact support if the issue persists.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Summary */}
          {!isExporting && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Export Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Format:</span>
                    <div className="font-medium">{selectedFormat?.label}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Sections:</span>
                    <div className="font-medium">{selectedSections.length} selected</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Size:</span>
                    <div className="font-medium">{exportEstimates.size} MB</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Time:</span>
                    <div className="font-medium">{exportEstimates.time}s</div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Calendar className="h-4 w-4" />
                    <span>Date Range: {filters.dateRange.from.toLocaleDateString()} - {filters.dateRange.to.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {selectedSections.length === 0 && 'Please select at least one section to export'}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
                {t('common:actions.cancel')}
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={selectedSections.length === 0 || isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t('physicalTrainer:analytics.export.button')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}