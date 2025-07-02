import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react';
import { useGetModerationStatsQuery } from '@/store/api/moderationApi';

export const ModerationStats: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30');
  
  const { data, isLoading } = useGetModerationStatsQuery({ days: parseInt(timeRange) });
  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    );
  }

  const resolutionRate = stats?.totalReports 
    ? Math.round((stats.resolvedReports / stats.totalReports) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-medium">Analytics Overview</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pendingReports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.resolvedReports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {resolutionRate}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderated Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.moderatedUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently restricted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Report Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topReasons.map((reason, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {reason.reason.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${stats?.totalReports 
                            ? (reason.count / stats.totalReports) * 100 
                            : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {reason.count}
                    </span>
                  </div>
                </div>
              ))}
              
              {stats?.topReasons.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No data available for this time period
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Moderation Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {action.action.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${stats?.resolvedReports 
                            ? (action.count / stats.resolvedReports) * 100 
                            : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {action.count}
                    </span>
                  </div>
                </div>
              ))}
              
              {stats?.topActions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No data available for this time period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {resolutionRate}%
              </div>
              <p className="text-sm text-gray-600 mt-1">Resolution Rate</p>
              <p className="text-xs text-gray-500">
                Reports resolved vs total
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats?.totalReports && stats.pendingReports
                  ? Math.round(((stats.totalReports - stats.pendingReports) / stats.totalReports) * 100)
                  : 0}%
              </div>
              <p className="text-sm text-gray-600 mt-1">Processing Rate</p>
              <p className="text-xs text-gray-500">
                Reports processed vs total
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats?.totalReports 
                  ? Math.round(stats.totalReports / parseInt(timeRange))
                  : 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Daily Average</p>
              <p className="text-xs text-gray-500">
                Reports per day
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};