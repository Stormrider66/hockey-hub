import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  File, 
  Globe, 
  Mail,
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Edit,
  Copy,
  Eye
} from '@/components/icons';
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

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  supportedFormats: string[];
  previewUrl?: string;
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

interface ExportManagerProps {
  initialFilters?: Partial<ExportRequest['filters']>;
  onExportComplete?: (result: any) => void;
  availableTeams?: Array<{ id: string; name: string; }>;
  availablePlayers?: Array<{ id: string; name: string; teamId: string; }>;
  availableSessions?: Array<{ id: string; name: string; date: string; type: string; }>;
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  initialFilters = {},
  onExportComplete,
  availableTeams = [],
  availablePlayers = [],
  availableSessions = []
}) => {
  const { toast } = useToast();
  
  // State management
  const [exportRequest, setExportRequest] = useState<ExportRequest>({
    type: 'workout-summary',
    format: 'pdf',
    filters: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      includeCharts: true,
      includeMedicalData: false,
      ...initialFilters
    }
  });

  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [bulkExports, setBulkExports] = useState<ExportRequest[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    schedule: 'weekly' as const,
    recipients: [''],
    active: true
  });

  // Mock data for demonstration
  const mockTemplates: ExportTemplate[] = [
    {
      id: 'standard-workout',
      name: 'Standard Workout Summary',
      description: 'Comprehensive workout session analysis with participant metrics',
      category: 'Workout Reports',
      supportedFormats: ['pdf', 'excel', 'html']
    },
    {
      id: 'player-progress',
      name: 'Player Progress Report',
      description: 'Individual player development tracking and milestone analysis',
      category: 'Player Reports',
      supportedFormats: ['pdf', 'excel', 'csv']
    },
    {
      id: 'team-performance',
      name: 'Team Performance Dashboard',
      description: 'Team-wide performance metrics and comparative analysis',
      category: 'Team Reports',
      supportedFormats: ['pdf', 'html', 'excel']
    },
    {
      id: 'medical-compliance',
      name: 'Medical Compliance Report',
      description: 'Medical clearances, restrictions, and compliance tracking',
      category: 'Medical Reports',
      supportedFormats: ['pdf', 'excel']
    },
    {
      id: 'historical-trends',
      name: 'Historical Trends Analysis',
      description: 'Long-term performance trends and forecasting analysis',
      category: 'Analytics Reports',
      supportedFormats: ['pdf', 'excel', 'csv']
    }
  ];

  const mockScheduledReports: ScheduledReport[] = [
    {
      id: 'weekly-team-1',
      reportType: 'team-performance',
      schedule: 'weekly',
      format: 'pdf',
      recipients: ['coach@example.com', 'trainer@example.com'],
      active: true,
      nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'monthly-medical',
      reportType: 'medical-compliance',
      schedule: 'monthly',
      format: 'excel',
      recipients: ['medical@example.com'],
      active: true,
      nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    setTemplates(mockTemplates);
    setScheduledReports(mockScheduledReports);
  }, []);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv': return <File className="h-4 w-4" />;
      case 'html': return <Globe className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getReportTypeDisplay = (type: string) => {
    const types = {
      'workout-summary': 'Workout Summary',
      'player-progress': 'Player Progress',
      'team-performance': 'Team Performance',
      'medical-compliance': 'Medical Compliance',
      'historical-trends': 'Historical Trends',
      'custom': 'Custom Report'
    };
    return types[type as keyof typeof types] || type;
  };

  const handleExportRequest = async () => {
    setLoading(true);
    setExportProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setExportProgress(100);

      const result = {
        success: true,
        downloadUrl: `/api/exports/report_${Date.now()}.${exportRequest.format}`,
        metadata: {
          fileSize: Math.floor(Math.random() * 1000000) + 100000,
          format: exportRequest.format,
          generatedAt: new Date()
        }
      };

      // Add to export history
      setExportHistory(prev => [{
        id: `export-${Date.now()}`,
        type: exportRequest.type,
        format: exportRequest.format,
        downloadUrl: result.downloadUrl,
        fileSize: result.metadata.fileSize,
        createdAt: new Date(),
        status: 'completed'
      }, ...prev]);

      toast({
        title: "Export Generated",
        description: `Your ${getReportTypeDisplay(exportRequest.type)} report is ready for download.`,
      });

      onExportComplete?.(result);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  };

  const handleBulkExport = async () => {
    if (bulkExports.length === 0) return;
    
    setLoading(true);
    
    try {
      // Mock bulk export
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Bulk Export Complete",
        description: `${bulkExports.length} reports have been generated successfully.`,
      });
      
      setBulkExports([]);
    } catch (error) {
      toast({
        title: "Bulk Export Failed",
        description: "Some reports could not be generated. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReport = async () => {
    try {
      const scheduled: ScheduledReport = {
        id: `scheduled-${Date.now()}`,
        reportType: exportRequest.type,
        schedule: newSchedule.schedule,
        format: exportRequest.format,
        recipients: newSchedule.recipients.filter(email => email.trim()),
        active: newSchedule.active,
        nextRun: calculateNextRun(newSchedule.schedule),
        createdAt: new Date()
      };

      setScheduledReports(prev => [scheduled, ...prev]);
      setScheduleModalOpen(false);
      
      toast({
        title: "Report Scheduled",
        description: `Your ${newSchedule.schedule} ${getReportTypeDisplay(exportRequest.type)} report has been scheduled.`,
      });
    } catch (error) {
      toast({
        title: "Scheduling Failed",
        description: "Could not schedule the report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const calculateNextRun = (schedule: string): Date => {
    const now = new Date();
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'quarterly':
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        return nextQuarter;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  };

  const addToBulkExport = () => {
    setBulkExports(prev => [...prev, { ...exportRequest }]);
    toast({
      title: "Added to Bulk Export",
      description: "Report configuration added to bulk export queue.",
    });
  };

  const removeFromBulkExport = (index: number) => {
    setBulkExports(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Export Manager</h3>
          <p className="text-muted-foreground">
            Generate and manage analytics reports in multiple formats
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={addToBulkExport}
            disabled={loading}
          >
            <Copy className="h-4 w-4 mr-2" />
            Add to Bulk ({bulkExports.length})
          </Button>
          <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={loading}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Report</DialogTitle>
                <DialogDescription>
                  Set up automatic report generation and delivery
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="schedule-frequency">Frequency</Label>
                  <Select 
                    value={newSchedule.schedule} 
                    onValueChange={(value: any) => setNewSchedule(prev => ({ ...prev, schedule: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recipients">Email Recipients</Label>
                  {newSchedule.recipients.map((email, index) => (
                    <div key={index} className="flex items-center space-x-2 mt-2">
                      <Input
                        value={email}
                        onChange={(e) => {
                          const updated = [...newSchedule.recipients];
                          updated[index] = e.target.value;
                          setNewSchedule(prev => ({ ...prev, recipients: updated }));
                        }}
                        placeholder="email@example.com"
                      />
                      {index === newSchedule.recipients.length - 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNewSchedule(prev => ({ 
                            ...prev, 
                            recipients: [...prev.recipients, ''] 
                          }))}
                        >
                          +
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={newSchedule.active}
                    onCheckedChange={(checked) => setNewSchedule(prev => ({ 
                      ...prev, 
                      active: !!checked 
                    }))}
                  />
                  <Label>Active</Label>
                </div>
                <Button onClick={handleScheduleReport} className="w-full">
                  Schedule Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="single-export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="single-export">Single Export</TabsTrigger>
          <TabsTrigger value="bulk-export">Bulk Export ({bulkExports.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports ({scheduledReports.length})</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="single-export" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>
                  Configure your export settings and filters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Report Type</Label>
                  <Select 
                    value={exportRequest.type} 
                    onValueChange={(value: any) => setExportRequest(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workout-summary">Workout Summary</SelectItem>
                      <SelectItem value="player-progress">Player Progress</SelectItem>
                      <SelectItem value="team-performance">Team Performance</SelectItem>
                      <SelectItem value="medical-compliance">Medical Compliance</SelectItem>
                      <SelectItem value="historical-trends">Historical Trends</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Export Format</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {(['pdf', 'excel', 'csv', 'html'] as const).map((format) => (
                      <Button
                        key={format}
                        variant={exportRequest.format === format ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExportRequest(prev => ({ ...prev, format }))}
                        className="flex items-center justify-center"
                      >
                        {getFormatIcon(format)}
                        <span className="ml-1 text-xs">{format.toUpperCase()}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {availableTeams.length > 0 && (
                  <div>
                    <Label>Team</Label>
                    <Select 
                      value={exportRequest.filters.teamId || ''} 
                      onValueChange={(value) => setExportRequest(prev => ({ 
                        ...prev, 
                        filters: { ...prev.filters, teamId: value } 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Teams</SelectItem>
                        {availableTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={exportRequest.filters.dateRange?.start.toISOString().split('T')[0]}
                      onChange={(e) => setExportRequest(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          dateRange: {
                            ...prev.filters.dateRange!,
                            start: new Date(e.target.value)
                          }
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={exportRequest.filters.dateRange?.end.toISOString().split('T')[0]}
                      onChange={(e) => setExportRequest(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          dateRange: {
                            ...prev.filters.dateRange!,
                            end: new Date(e.target.value)
                          }
                        }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={exportRequest.filters.includeCharts}
                        onCheckedChange={(checked) => setExportRequest(prev => ({
                          ...prev,
                          filters: { ...prev.filters, includeCharts: !!checked }
                        }))}
                      />
                      <Label className="text-sm">Include Charts and Visualizations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={exportRequest.filters.includeMedicalData}
                        onCheckedChange={(checked) => setExportRequest(prev => ({
                          ...prev,
                          filters: { ...prev.filters, includeMedicalData: !!checked }
                        }))}
                      />
                      <Label className="text-sm">Include Medical Data</Label>
                    </div>
                    {exportRequest.type === 'team-performance' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={exportRequest.filters.includePlayerBreakdown}
                          onCheckedChange={(checked) => setExportRequest(prev => ({
                            ...prev,
                            filters: { ...prev.filters, includePlayerBreakdown: !!checked }
                          }))}
                        />
                        <Label className="text-sm">Include Player Breakdown</Label>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Preview</CardTitle>
                <CardDescription>
                  Preview of your export configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Generating export...</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Report Type:</span>
                    <Badge variant="outline">{getReportTypeDisplay(exportRequest.type)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Format:</span>
                    <div className="flex items-center space-x-1">
                      {getFormatIcon(exportRequest.format)}
                      <span className="text-sm">{exportRequest.format.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Date Range:</span>
                    <span className="text-sm text-muted-foreground">
                      {exportRequest.filters.dateRange?.start.toLocaleDateString()} - {exportRequest.filters.dateRange?.end.toLocaleDateString()}
                    </span>
                  </div>
                  {exportRequest.filters.teamId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Team:</span>
                      <span className="text-sm text-muted-foreground">
                        {availableTeams.find(t => t.id === exportRequest.filters.teamId)?.name || 'Selected Team'}
                      </span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleExportRequest} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Export
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk-export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Export Queue</CardTitle>
              <CardDescription>
                Manage multiple report exports in a single batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bulkExports.length === 0 ? (
                <div className="text-center py-8">
                  <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reports in bulk export queue</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add reports from the Single Export tab to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {bulkExports.map((export_, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {getFormatIcon(export_.format)}
                          <div>
                            <span className="font-medium">{getReportTypeDisplay(export_.type)}</span>
                            <p className="text-sm text-muted-foreground">
                              {export_.filters.dateRange?.start.toLocaleDateString()} - {export_.filters.dateRange?.end.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromBulkExport(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleBulkExport} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Generating {bulkExports.length} Reports...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate {bulkExports.length} Reports
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Manage automatic report generation and delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledReports.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No scheduled reports</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use the Schedule button to set up automatic report delivery
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{getReportTypeDisplay(report.reportType)}</span>
                          <Badge variant={report.active ? "default" : "secondary"}>
                            {report.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {report.schedule}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Next run: {report.nextRun.toLocaleDateString()} | 
                          Recipients: {report.recipients.length}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                Recent export downloads and generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exportHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No export history</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Generated reports will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {exportHistory.map((export_) => (
                    <div key={export_.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        {export_.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <div>
                          <span className="font-medium">{getReportTypeDisplay(export_.type)}</span>
                          <p className="text-sm text-muted-foreground">
                            {export_.createdAt.toLocaleDateString()} | {Math.round(export_.fileSize / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {export_.downloadUrl && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={export_.downloadUrl} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge variant="outline">{template.category}</Badge>
                    <div className="flex flex-wrap gap-1">
                      {template.supportedFormats.map((format) => (
                        <div key={format} className="flex items-center space-x-1 text-xs">
                          {getFormatIcon(format)}
                          <span>{format.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setExportRequest(prev => ({ 
                          ...prev, 
                          template: { templateId: template.id } 
                        }))}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};