import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Calendar as CalendarIcon,
  Download,
  FileText,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter,
  BarChart3,
} from 'lucide-react';
import {
  useGenerateReportQuery,
  CommunicationReport,
  CommunicationCategory,
  CommunicationType,
} from '@/store/api/parentCommunicationApi';
import { cn } from '@/lib/utils';

interface ParentCommunicationReportProps {
  organizationId: string;
  teamId?: string;
  coachId?: string;
}

const COLORS = {
  category: {
    academic: '#8B5CF6',
    behavioral: '#F97316',
    medical: '#EF4444',
    performance: '#10B981',
    administrative: '#6B7280',
    social: '#3B82F6',
    other: '#64748B',
  },
  type: {
    in_person_meeting: '#3B82F6',
    phone_call: '#10B981',
    video_call: '#8B5CF6',
    email: '#F59E0B',
    chat_message: '#EC4899',
    text_message: '#14B8A6',
    other: '#6B7280',
  },
  priority: {
    low: '#9CA3AF',
    medium: '#FCD34D',
    high: '#FB923C',
    urgent: '#F87171',
  },
};

export const ParentCommunicationReport: React.FC<ParentCommunicationReportProps> = ({
  organizationId,
  teamId,
  coachId,
}) => {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(subMonths(new Date(), 2)),
    to: endOfMonth(new Date()),
  });
  
  const [groupBy, setGroupBy] = useState<'coach' | 'player' | 'category' | 'type'>('category');
  const [includeConfidential, setIncludeConfidential] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: report, isLoading, error } = useGenerateReportQuery({
    organizationId,
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
    groupBy,
    includeConfidential,
  });

  const handleExportReport = () => {
    if (!report) return;

    // Create CSV content
    const csvContent = generateCSVContent(report);
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parent-communication-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateCSVContent = (report: CommunicationReport): string => {
    let csv = 'Parent Communication Report\n';
    csv += `Date Range: ${format(new Date(report.dateRange.from), 'PP')} - ${format(new Date(report.dateRange.to), 'PP')}\n`;
    csv += `Total Communications: ${report.totalCommunications}\n\n`;

    // Statistics by category
    csv += 'By Category:\n';
    Object.entries(report.statistics.byCategory).forEach(([key, value]) => {
      csv += `${key},${value}\n`;
    });
    csv += '\n';

    // Statistics by type
    csv += 'By Type:\n';
    Object.entries(report.statistics.byType).forEach(([key, value]) => {
      csv += `${key.replace(/_/g, ' ')},${value}\n`;
    });
    csv += '\n';

    // Statistics by priority
    csv += 'By Priority:\n';
    Object.entries(report.statistics.byPriority).forEach(([key, value]) => {
      csv += `${key},${value}\n`;
    });
    csv += '\n';

    csv += `Average Duration: ${report.statistics.averageDuration} minutes\n`;
    csv += `Follow-up Rate: ${report.statistics.followUpRate.toFixed(1)}%\n`;
    csv += `Completion Rate: ${report.statistics.completionRate.toFixed(1)}%\n`;

    return csv;
  };

  const prepareChartData = () => {
    if (!report) return { categoryData: [], typeData: [], priorityData: [] };

    const categoryData = Object.entries(report.statistics.byCategory).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      fill: COLORS.category[key as keyof typeof COLORS.category],
    }));

    const typeData = Object.entries(report.statistics.byType).map(([key, value]) => ({
      name: key.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value,
      fill: COLORS.type[key as keyof typeof COLORS.type],
    }));

    const priorityData = Object.entries(report.statistics.byPriority).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      fill: COLORS.priority[key as keyof typeof COLORS.priority],
    }));

    return { categoryData, typeData, priorityData };
  };

  const { categoryData, typeData, priorityData } = prepareChartData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to generate report</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parent Communication Report</CardTitle>
              <CardDescription>
                Comprehensive analysis of parent-coach communications
              </CardDescription>
            </div>
            <Button onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !dateRange.from && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, 'PP') : 'From date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !dateRange.to && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, 'PP') : 'To date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="group-by">Group By</Label>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger id="group-by">
                  <SelectValue placeholder="Select grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="confidential"
                  checked={includeConfidential}
                  onCheckedChange={setIncludeConfidential}
                />
                <Label htmlFor="confidential">Include Confidential</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalCommunications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(report.dateRange.from), 'MMM d')} - {format(new Date(report.dateRange.to), 'MMM d')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.statistics.averageDuration} min</div>
            <p className="text-xs text-muted-foreground mt-1">Per communication</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Follow-up Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.statistics.followUpRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-amber-500" />
              <p className="text-xs text-muted-foreground">Require follow-up</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.statistics.completionRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <p className="text-xs text-muted-foreground">Follow-ups completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Communication by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Communication by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Communication Priority Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Trends</CardTitle>
              <CardDescription>
                Analysis of communication patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <p>Trend analysis coming soon</p>
                <p className="text-sm mt-2">
                  This will show communication frequency, patterns, and trends over the selected period
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
              <CardDescription>
                Breakdown by {groupBy}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.breakdown && Object.entries(report.breakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(report.breakdown).map(([key, data]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{key}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.count} communications
                        </p>
                      </div>
                      <Badge variant="secondary">{data.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>No breakdown data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};