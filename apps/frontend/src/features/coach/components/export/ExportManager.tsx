'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import {
  Download,
  FileText,
  Settings,
  Eye,
  Printer,
  Share2,
  Copy,
  QrCode,
  Lock,
  Clock,
  Image,
  FileImage,
  BookOpen,
  Palette,
  Layout,
  Monitor,
  Save,
  FolderOpen,
  History,
  Star,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar as CalendarIcon,
  Filter,
  Search,
  MoreHorizontal,
  ExternalLink,
  Archive,
  Tag,
  Users,
  Globe,
  Shield
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useTranslation } from '@hockey-hub/translations';
import { format } from 'date-fns';

// Import our services
import { EnhancedExportService, ExportOptions, ExportResult, ExportProgress, PlaySystem } from '../../services/exportService';
import { ExcelExportService } from '../../services/excelExportService';
import { SharingService, ShareLink, CreateShareLinkOptions } from '../../services/sharingService';
import QRCodeGenerator from '../sharing/QRCodeGenerator';
import { exportTemplates, ExportTemplate, TemplateCategory } from '../../templates/exportTemplates';

// Enhanced interfaces
export interface ExportJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  type: 'single' | 'batch' | 'template';
  format: 'pdf' | 'excel' | 'csv' | 'png' | 'svg';
  template?: ExportTemplate;
  progress: ExportProgress | null;
  result: ExportResult | null;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  plays: PlaySystem[];
  options: ExportOptions;
  shareLink?: ShareLink;
  downloadCount: number;
  tags: string[];
}

export interface ExportHistory {
  jobs: ExportJob[];
  templates: ExportTemplate[];
  favorites: string[];
  recentTemplates: string[];
  statistics: {
    totalExports: number;
    successRate: number;
    mostUsedFormat: string;
    mostUsedTemplate: string;
    totalDownloads: number;
  };
}

export interface ExportFilter {
  status?: string[];
  format?: string[];
  dateRange?: { start: Date; end: Date };
  template?: string[];
  tags?: string[];
  search?: string;
}

export interface EnhancedExportManagerProps {
  isOpen: boolean;
  onClose: () => void;
  playSystem?: PlaySystem;
  playSystems?: PlaySystem[];
  tacticalBoardRef?: React.RefObject<HTMLDivElement>;
  onExportComplete?: (result: ExportResult) => void;
  initialTemplate?: string;
  showTemplateLibrary?: boolean;
  showHistory?: boolean;
  enableSharing?: boolean;
}

const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF Document', icon: <FileText className="h-4 w-4" />, description: 'Portable document with layouts' },
  { value: 'excel', label: 'Excel Spreadsheet', icon: <FileImage className="h-4 w-4" />, description: 'Data with analytics and charts' },
  { value: 'csv', label: 'CSV Data', icon: <FileText className="h-4 w-4" />, description: 'Simple comma-separated values' },
  { value: 'png', label: 'PNG Images', icon: <Image className="h-4 w-4" />, description: 'High-quality raster images' },
  { value: 'svg', label: 'SVG Vector', icon: <Image className="h-4 w-4" />, description: 'Scalable vector graphics' }
];

export default function EnhancedExportManager({
  isOpen,
  onClose,
  playSystem,
  playSystems = [],
  tacticalBoardRef,
  onExportComplete,
  initialTemplate,
  showTemplateLibrary = true,
  showHistory = true,
  enableSharing = true
}: EnhancedExportManagerProps) {
  const { t } = useTranslation(['coach', 'common']);
  
  // Services
  const [exportService] = useState(() => new EnhancedExportService({} as ExportOptions));
  const [excelService] = useState(() => new ExcelExportService(ExcelExportService.createDefaultOptions()));
  const [sharingService] = useState(() => new SharingService());

  // State management
  const [activeTab, setActiveTab] = useState('export');
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(
    initialTemplate ? exportTemplates.find(t => t.id === initialTemplate) || null : null
  );
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistory>({
    jobs: [],
    templates: [],
    favorites: [],
    recentTemplates: [],
    statistics: {
      totalExports: 0,
      successRate: 0,
      mostUsedFormat: 'pdf',
      mostUsedTemplate: 'playbook',
      totalDownloads: 0
    }
  });
  
  // Selection and filtering
  const [selectedPlays, setSelectedPlays] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<'single' | 'batch' | 'template'>('single');
  const [historyFilter, setHistoryFilter] = useState<ExportFilter>({});
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Export options
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    template: 'playbook',
    quality: 'high',
    pageSize: 'A4',
    orientation: 'landscape',
    colorMode: 'color',
    includeMetadata: true,
    includeNotes: true,
    includeStatistics: false,
    includePlayerInstructions: true,
    includeVideoScreenshots: false,
    includeAnimationFrames: false,
    includeDiagrams: true,
    includeAnalytics: false,
    includeBranding: true,
    pageNumbers: true,
    tableOfContents: false,
    coverPage: true,
    sectionDividers: false,
    playIndex: false,
    compression: true,
    batchExport: false
  });

  // Sharing state
  const [shareOptions, setShareOptions] = useState({
    generateLink: true,
    expiration: '7days' as const,
    passwordProtected: false,
    password: '',
    allowDownload: true,
    generateQRCode: true
  });

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('export_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setExportHistory({
          ...parsed,
          jobs: parsed.jobs.map((job: any) => ({
            ...job,
            createdAt: new Date(job.createdAt),
            updatedAt: new Date(job.updatedAt)
          }))
        });
      } catch (error) {
        console.error('Failed to parse export history:', error);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((history: ExportHistory) => {
    try {
      localStorage.setItem('export_history', JSON.stringify(history));
      setExportHistory(history);
    } catch (error) {
      console.error('Failed to save export history:', error);
    }
  }, []);

  // Update export option
  const updateExportOption = useCallback(<K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // Apply template
  const applyTemplate = useCallback((template: ExportTemplate) => {
    setSelectedTemplate(template);
    setExportOptions(prev => ({
      ...prev,
      ...template.options,
      template: template.id as any
    }));

    // Update recent templates
    setExportHistory(prev => {
      const recentTemplates = [template.id, ...prev.recentTemplates.filter(id => id !== template.id)].slice(0, 10);
      const updated = { ...prev, recentTemplates };
      saveHistory(updated);
      return updated;
    });

    toast.success(`Applied ${template.name} template`);
  }, [saveHistory]);

  // Toggle favorite template
  const toggleFavoriteTemplate = useCallback((templateId: string) => {
    setExportHistory(prev => {
      const favorites = prev.favorites.includes(templateId)
        ? prev.favorites.filter(id => id !== templateId)
        : [...prev.favorites, templateId];
      
      const updated = { ...prev, favorites };
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  // Handle progress updates
  const handleProgress = useCallback((progress: ExportProgress) => {
    setCurrentJob(prev => prev ? { ...prev, progress } : null);
  }, []);

  // Main export function
  const handleExport = useCallback(async () => {
    if (!playSystem && selectedPlays.length === 0) {
      toast.error('No plays selected for export');
      return;
    }

    // Create export job
    const job: ExportJob = {
      id: `export_${Date.now()}`,
      name: selectedTemplate ? selectedTemplate.name : `Export ${exportOptions.format.toUpperCase()}`,
      status: 'pending',
      type: exportMode,
      format: exportOptions.format as any,
      template: selectedTemplate || undefined,
      progress: null,
      result: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      plays: exportMode === 'single' && playSystem ? [playSystem] : playSystems.filter(p => selectedPlays.includes(p.id)),
      options: exportOptions,
      downloadCount: 0,
      tags: []
    };

    setCurrentJob(job);

    try {
      job.status = 'processing';
      setCurrentJob({ ...job });

      let result: ExportResult;

      // Choose export method based on format
      if (exportOptions.format === 'excel' || exportOptions.format === 'csv') {
        // Excel/CSV export
        const blob = await excelService.exportPlaysToExcel(job.plays);
        result = {
          success: true,
          fileName: `export_${Date.now()}.${exportOptions.format}`,
          fileSize: blob.size,
          blob,
          metadata: {
            exportTime: new Date(),
            playsCount: job.plays.length,
            template: exportOptions.template,
            format: exportOptions.format,
            quality: exportOptions.quality,
            processingTime: Date.now() - job.createdAt.getTime(),
            options: exportOptions
          }
        };
      } else {
        // PDF/Image export
        const service = new EnhancedExportService(exportOptions, handleProgress);
        result = await service.exportPlays(job.plays, tacticalBoardRef ? [tacticalBoardRef.current!] : []);
      }

      // Update job with result
      job.result = result;
      job.status = result.success ? 'completed' : 'failed';
      job.error = result.error;
      job.updatedAt = new Date();
      setCurrentJob({ ...job });

      if (result.success) {
        // Create share link if enabled
        if (enableSharing && shareOptions.generateLink && result.blob) {
          try {
            const shareLink = await sharingService.createShareLink({
              title: job.name,
              description: `Exported ${job.plays.length} tactical play${job.plays.length > 1 ? 's' : ''}`,
              type: 'export',
              resourceId: job.id,
              resourceData: { fileName: result.fileName, format: exportOptions.format },
              permissions: ['view', 'download'],
              expiration: shareOptions.expiration,
              passwordProtected: shareOptions.passwordProtected,
              password: shareOptions.password,
              allowDownload: shareOptions.allowDownload,
              generateQRCode: shareOptions.generateQRCode
            });
            
            job.shareLink = shareLink;
            result.shareUrl = shareLink.url;
            result.qrCode = shareLink.qrCode;
          } catch (error) {
            console.warn('Failed to create share link:', error);
          }
        }

        // Download the file
        if (result.blob) {
          const url = URL.createObjectURL(result.blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = result.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          job.downloadCount = 1;
        }

        // Update history
        setExportHistory(prev => {
          const jobs = [job, ...prev.jobs.slice(0, 99)]; // Keep last 100 jobs
          const statistics = {
            ...prev.statistics,
            totalExports: prev.statistics.totalExports + 1,
            successRate: ((prev.statistics.totalExports * prev.statistics.successRate) + 1) / (prev.statistics.totalExports + 1) * 100,
            totalDownloads: prev.statistics.totalDownloads + 1
          };
          
          const updated = { ...prev, jobs, statistics };
          saveHistory(updated);
          return updated;
        });

        toast.success(`Successfully exported ${job.plays.length} play${job.plays.length > 1 ? 's' : ''}`);
        
        if (onExportComplete) {
          onExportComplete(result);
        }

      } else {
        toast.error(`Export failed: ${result.error}`);
      }

    } catch (error) {
      console.error('Export failed:', error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.updatedAt = new Date();
      setCurrentJob({ ...job });
      
      toast.error(`Export failed: ${job.error}`);
    }
  }, [
    playSystem,
    selectedPlays,
    exportMode,
    exportOptions,
    selectedTemplate,
    playSystems,
    tacticalBoardRef,
    excelService,
    handleProgress,
    enableSharing,
    shareOptions,
    sharingService,
    onExportComplete,
    saveHistory
  ]);

  // Filter history
  const filteredHistory = exportHistory.jobs.filter(job => {
    if (historyFilter.search && !job.name.toLowerCase().includes(historyFilter.search.toLowerCase())) {
      return false;
    }
    if (historyFilter.status && !historyFilter.status.includes(job.status)) {
      return false;
    }
    if (historyFilter.format && !historyFilter.format.includes(job.format)) {
      return false;
    }
    if (historyFilter.template && job.template && !historyFilter.template.includes(job.template.id)) {
      return false;
    }
    if (historyFilter.dateRange) {
      const { start, end } = historyFilter.dateRange;
      if (job.createdAt < start || job.createdAt > end) {
        return false;
      }
    }
    return true;
  });

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setCurrentJob(null);
    setSelectedPlays([]);
    setPreviewUrl(null);
    setShowPreview(false);
    setShowQRGenerator(false);
    onClose();
  }, [onClose]);

  // Download job result
  const downloadJobResult = useCallback(async (job: ExportJob) => {
    if (!job.result?.blob) {
      toast.error('No file available for download');
      return;
    }

    try {
      const url = URL.createObjectURL(job.result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = job.result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update download count
      setExportHistory(prev => {
        const jobs = prev.jobs.map(j => 
          j.id === job.id ? { ...j, downloadCount: j.downloadCount + 1 } : j
        );
        const updated = { ...prev, jobs };
        saveHistory(updated);
        return updated;
      });

      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  }, [saveHistory]);

  // Delete job from history
  const deleteJob = useCallback((jobId: string) => {
    setExportHistory(prev => {
      const jobs = prev.jobs.filter(job => job.id !== jobId);
      const updated = { ...prev, jobs };
      saveHistory(updated);
      return updated;
    });
    toast.success('Export deleted');
  }, [saveHistory]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Enhanced Export Manager
          </DialogTitle>
          <DialogDescription>
            Export tactical plays with advanced templates, sharing, and analytics
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            {showTemplateLibrary && (
              <TabsTrigger value="templates">
                <BookOpen className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
            )}
            <TabsTrigger value="selection">
              <FileText className="h-4 w-4 mr-2" />
              Selection
            </TabsTrigger>
            {enableSharing && (
              <TabsTrigger value="sharing">
                <Share2 className="h-4 w-4 mr-2" />
                Sharing
              </TabsTrigger>
            )}
            {showHistory && (
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            )}
          </TabsList>

          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <TabsContent value="export" className="space-y-6">
              {/* Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Export Format
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {EXPORT_FORMATS.map((format) => (
                      <div
                        key={format.value}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-all hover:border-primary",
                          exportOptions.format === format.value ? "border-primary bg-primary/5" : ""
                        )}
                        onClick={() => updateExportOption('format', format.value as any)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-primary">{format.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{format.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Template Quick Select */}
              {selectedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Selected Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-primary">{selectedTemplate.icon}</div>
                        <div>
                          <div className="font-medium">{selectedTemplate.name}</div>
                          <div className="text-sm text-muted-foreground">{selectedTemplate.description}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFavoriteTemplate(selectedTemplate.id)}
                        >
                          <Star className={cn(
                            "h-4 w-4",
                            exportHistory.favorites.includes(selectedTemplate.id) && "fill-current text-yellow-500"
                          )} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTemplate(null)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Export Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quality">Quality</Label>
                      <Select 
                        value={exportOptions.quality} 
                        onValueChange={(value: any) => updateExportOption('quality', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (Fast)</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High (Recommended)</SelectItem>
                          <SelectItem value="ultra">Ultra (Slow)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="orientation">Orientation</Label>
                      <Select 
                        value={exportOptions.orientation} 
                        onValueChange={(value: any) => updateExportOption('orientation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landscape">Landscape</SelectItem>
                          <SelectItem value="portrait">Portrait</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-metadata" className="text-sm font-medium">
                        Include Metadata
                      </Label>
                      <Switch
                        id="include-metadata"
                        checked={exportOptions.includeMetadata}
                        onCheckedChange={(checked) => updateExportOption('includeMetadata', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-notes" className="text-sm font-medium">
                        Include Notes
                      </Label>
                      <Switch
                        id="include-notes"
                        checked={exportOptions.includeNotes}
                        onCheckedChange={(checked) => updateExportOption('includeNotes', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-statistics" className="text-sm font-medium">
                        Include Statistics
                      </Label>
                      <Switch
                        id="include-statistics"
                        checked={exportOptions.includeStatistics}
                        onCheckedChange={(checked) => updateExportOption('includeStatistics', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-analytics" className="text-sm font-medium">
                        Include Analytics
                      </Label>
                      <Switch
                        id="include-analytics"
                        checked={exportOptions.includeAnalytics}
                        onCheckedChange={(checked) => updateExportOption('includeAnalytics', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {showTemplateLibrary && (
              <TabsContent value="templates" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant="outline">{exportTemplates.length} templates</Badge>
                    <Badge variant="outline">{exportHistory.favorites.length} favorites</Badge>
                  </div>
                </div>

                {/* Favorites */}
                {exportHistory.favorites.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Favorite Templates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {exportTemplates
                          .filter(template => exportHistory.favorites.includes(template.id))
                          .map((template) => (
                            <div
                              key={template.id}
                              className="p-3 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                              onClick={() => applyTemplate(template)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-primary">{template.icon}</div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{template.name}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {template.description}
                                  </div>
                                  <div className="flex gap-1 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {template.category}
                                    </Badge>
                                    {template.features.slice(0, 2).map((feature, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavoriteTemplate(template.id);
                                  }}
                                >
                                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Templates by Category */}
                {Object.entries(
                  exportTemplates
                    .filter(template => 
                      !searchQuery || template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      template.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .reduce((acc, template) => {
                      if (!acc[template.category]) acc[template.category] = [];
                      acc[template.category].push(template);
                      return acc;
                    }, {} as Record<TemplateCategory, ExportTemplate[]>)
                ).map(([category, templates]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {category.charAt(0).toUpperCase() + category.slice(1)} Templates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {templates.map((template) => (
                          <div
                            key={template.id}
                            className={cn(
                              "p-3 border rounded-lg hover:border-primary cursor-pointer transition-colors",
                              selectedTemplate?.id === template.id && "border-primary bg-primary/5"
                            )}
                            onClick={() => applyTemplate(template)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-primary">{template.icon}</div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{template.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {template.description}
                                </div>
                                <div className="flex gap-1 mt-2">
                                  {template.features.slice(0, 3).map((feature, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {template.features.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{template.features.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavoriteTemplate(template.id);
                                  }}
                                >
                                  <Star className={cn(
                                    "h-4 w-4",
                                    exportHistory.favorites.includes(template.id) && "fill-current text-yellow-500"
                                  )} />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            )}

            <TabsContent value="selection" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Export Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={exportMode} onValueChange={(value: any) => setExportMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {playSystem && (
                        <SelectItem value="single">Single Play - {playSystem.name}</SelectItem>
                      )}
                      <SelectItem value="batch">Selected Plays</SelectItem>
                      <SelectItem value="template">Template-based Export</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {exportMode !== 'single' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Available Plays</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPlays(playSystems.map(p => p.id))}
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPlays([])}
                      >
                        Clear All
                      </Button>
                      <Badge variant="secondary">
                        {selectedPlays.length} selected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {playSystems.map((play) => (
                          <div key={play.id} className="flex items-center space-x-2 p-2 border rounded">
                            <Checkbox
                              id={play.id}
                              checked={selectedPlays.includes(play.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPlays([...selectedPlays, play.id]);
                                } else {
                                  setSelectedPlays(selectedPlays.filter(id => id !== play.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <Label htmlFor={play.id} className="text-sm font-medium">
                                {play.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {play.category} • {play.formation || 'No formation'}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {play.tags.length} tags
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {enableSharing && (
              <TabsContent value="sharing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Sharing Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="generate-link" className="text-sm font-medium">
                        Generate Share Link
                      </Label>
                      <Switch
                        id="generate-link"
                        checked={shareOptions.generateLink}
                        onCheckedChange={(checked) => setShareOptions(prev => ({ ...prev, generateLink: checked }))}
                      />
                    </div>

                    {shareOptions.generateLink && (
                      <>
                        <div>
                          <Label htmlFor="expiration">Link Expiration</Label>
                          <Select 
                            value={shareOptions.expiration} 
                            onValueChange={(value: any) => setShareOptions(prev => ({ ...prev, expiration: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1hour">1 Hour</SelectItem>
                              <SelectItem value="1day">1 Day</SelectItem>
                              <SelectItem value="7days">7 Days</SelectItem>
                              <SelectItem value="30days">30 Days</SelectItem>
                              <SelectItem value="never">Never Expires</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="password-protected" className="text-sm font-medium">
                            Password Protected
                          </Label>
                          <Switch
                            id="password-protected"
                            checked={shareOptions.passwordProtected}
                            onCheckedChange={(checked) => setShareOptions(prev => ({ ...prev, passwordProtected: checked }))}
                          />
                        </div>

                        {shareOptions.passwordProtected && (
                          <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Enter password"
                              value={shareOptions.password}
                              onChange={(e) => setShareOptions(prev => ({ ...prev, password: e.target.value }))}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Label htmlFor="allow-download" className="text-sm font-medium">
                            Allow Download
                          </Label>
                          <Switch
                            id="allow-download"
                            checked={shareOptions.allowDownload}
                            onCheckedChange={(checked) => setShareOptions(prev => ({ ...prev, allowDownload: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="generate-qr" className="text-sm font-medium">
                            Generate QR Code
                          </Label>
                          <Switch
                            id="generate-qr"
                            checked={shareOptions.generateQRCode}
                            onCheckedChange={(checked) => setShareOptions(prev => ({ ...prev, generateQRCode: checked }))}
                          />
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => setShowQRGenerator(true)}
                          disabled={!shareOptions.generateQRCode}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Customize QR Code
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {showHistory && (
              <TabsContent value="history" className="space-y-4">
                {/* History Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search history..."
                      value={historyFilter.search || ''}
                      onChange={(e) => setHistoryFilter(prev => ({ ...prev, search: e.target.value }))}
                      className="w-64"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilter(!showFilter)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Badge variant="outline">
                      {exportHistory.statistics.totalExports} exports
                    </Badge>
                    <Badge variant="outline">
                      {exportHistory.statistics.successRate.toFixed(1)}% success
                    </Badge>
                  </div>
                </div>

                {/* Export History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Export History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {filteredHistory.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No export history found</p>
                          </div>
                        ) : (
                          filteredHistory.map((job) => (
                            <div key={job.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    job.status === 'completed' && "bg-green-500",
                                    job.status === 'failed' && "bg-red-500",
                                    job.status === 'processing' && "bg-yellow-500 animate-pulse",
                                    job.status === 'pending' && "bg-gray-400"
                                  )} />
                                  <div>
                                    <div className="font-medium text-sm">{job.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {job.plays.length} plays • {job.format.toUpperCase()} • {format(job.createdAt, 'MMM dd, yyyy HH:mm')}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {job.status === 'completed' && (
                                    <>
                                      <Badge variant="outline" className="text-xs">
                                        {job.downloadCount} downloads
                                      </Badge>
                                      
                                      {job.shareLink && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            navigator.clipboard.writeText(job.shareLink!.url);
                                            toast.success('Share URL copied');
                                          }}
                                        >
                                          <Share2 className="h-3 w-3" />
                                        </Button>
                                      )}

                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => downloadJobResult(job)}
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteJob(job.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {job.status === 'processing' && job.progress && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span>{job.progress.stage}</span>
                                    <span>{Math.round(job.progress.progress)}%</span>
                                  </div>
                                  <Progress value={job.progress.progress} />
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {job.progress.message}
                                  </div>
                                </div>
                              )}

                              {job.status === 'failed' && job.error && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                  {job.error}
                                </div>
                              )}

                              {job.template && (
                                <div className="mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {job.template.name}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Export Progress */}
        {currentJob && currentJob.progress && (
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{currentJob.progress.stage}</span>
                  <span>{Math.round(currentJob.progress.progress)}%</span>
                </div>
                <Progress value={currentJob.progress.progress} />
                <p className="text-sm text-muted-foreground">{currentJob.progress.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {exportMode === 'single' && playSystem && (
                <Badge variant="outline">1 play</Badge>
              )}
              {exportMode !== 'single' && (
                <Badge variant="outline">
                  {selectedPlays.length} play{selectedPlays.length !== 1 ? 's' : ''} selected
                </Badge>
              )}
              <Badge variant="outline">{exportOptions.format.toUpperCase()}</Badge>
              {selectedTemplate && (
                <Badge variant="outline">{selectedTemplate.name}</Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              
              <Button 
                onClick={handleExport} 
                disabled={currentJob?.status === 'processing' || (exportMode !== 'single' && selectedPlays.length === 0)}
                className="min-w-[120px]"
              >
                {currentJob?.status === 'processing' ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export {exportOptions.format.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>

        {/* QR Code Generator Modal */}
        {showQRGenerator && (
          <Dialog open={showQRGenerator} onOpenChange={setShowQRGenerator}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Customize QR Code</DialogTitle>
              </DialogHeader>
              <QRCodeGenerator
                initialUrl={currentJob?.shareLink?.url || 'https://hockeyhub.app/shared/demo'}
                showPresets={true}
                showBatch={false}
                onGenerated={(qr, options) => {
                  // Handle generated QR code
                  console.log('QR generated:', { qr, options });
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}