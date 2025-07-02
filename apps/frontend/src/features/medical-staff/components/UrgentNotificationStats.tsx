import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  BarChart3,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { useGetComplianceReportQuery } from '@/store/api/urgentMedicalApi';
import { Button } from '@/components/ui/button';

interface UrgentNotificationStatsProps {
  organizationId: string;
  teamId?: string;
}

const UrgentNotificationStats: React.FC<UrgentNotificationStatsProps> = ({
  organizationId,
  teamId,
}) => {
  const [dateRange, setDateRange] = useState('7days');
  
  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '24hours':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const { data: report, isLoading } = useGetComplianceReportQuery(getDateRange());

  const urgencyColors = {
    urgent: '#3B82F6',
    critical: '#F59E0B',
    emergency: '#EF4444',
  };

  const statusColors = {
    pending: '#6B7280',
    delivered: '#3B82F6',
    acknowledged: '#10B981',
    escalated: '#F59E0B',
    resolved: '#9CA3AF',
    expired: '#EF4444',
  };

  // Prepare chart data
  const urgencyData = report?.summary.byUrgencyLevel
    ? Object.entries(report.summary.byUrgencyLevel).map(([level, count]) => ({
        name: level.charAt(0).toUpperCase() + level.slice(1),
        value: count as number,
        color: urgencyColors[level as keyof typeof urgencyColors],
      }))
    : [];

  const statusData = report?.summary.byStatus
    ? Object.entries(report.summary.byStatus).map(([status, count]) => ({
        name: status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        value: count as number,
        color: statusColors[status as keyof typeof statusColors],
      }))
    : [];

  const escalationReasonData = report?.escalationMetrics.escalationReasons
    ? Object.entries(report.escalationMetrics.escalationReasons).map(([reason, count]) => ({
        name: reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        count: count as number,
      }))
    : [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Total Notifications
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report?.summary.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Acknowledgment Rate
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report?.acknowledgmentMetrics.acknowledgmentRate?.toFixed(1) || 0}%
            </div>
            <Progress 
              value={report?.acknowledgmentMetrics.acknowledgmentRate || 0} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Avg Response Time
              <Clock className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((report?.acknowledgmentMetrics.averageResponseTime || 0) / 60)}m
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {report?.acknowledgmentMetrics.averageResponseTime || 0} seconds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Urgency Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications by Urgency Level</CardTitle>
          </CardHeader>
          <CardContent>
            {urgencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={urgencyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {urgencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Escalation Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escalation Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Escalations</span>
                <Badge variant="secondary">
                  {report?.escalationMetrics.totalEscalations || 0}
                </Badge>
              </div>
              
              {escalationReasonData.length > 0 ? (
                <div className="space-y-2">
                  {escalationReasonData.map((reason) => (
                    <div key={reason.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{reason.name}</span>
                      <span className="text-sm font-medium">{reason.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No escalations in this period</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {report?.recommendations && report.recommendations.length > 0 ? (
              <div className="space-y-3">
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {rec.severity === 'high' ? (
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    ) : rec.severity === 'medium' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                    )}
                    <p className="text-sm">{rec.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <p className="text-sm">All metrics are within acceptable ranges</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medical Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications by Medical Type</CardTitle>
        </CardHeader>
        <CardContent>
          {report?.summary.byMedicalType ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(report.summary.byMedicalType).map(([type, count]) => (
                <div key={type} className="text-center">
                  <p className="text-2xl font-bold">{count as number}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {type.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UrgentNotificationStats;