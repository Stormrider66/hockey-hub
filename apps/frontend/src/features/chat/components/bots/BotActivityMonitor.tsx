import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Activity, Bot, MessageSquare, Clock, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export interface BotActivity {
  id: string;
  botName: string;
  botType: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details?: any;
}

export interface BotStats {
  botName: string;
  botType: string;
  messagesPerDay: number[];
  totalMessages: number;
  activeUsers: number;
  averageResponseTime: number;
  satisfactionRate: number;
}

export interface BotActivityMonitorProps {
  activities: BotActivity[];
  stats: BotStats[];
  timeRange: 'day' | 'week' | 'month';
  onTimeRangeChange: (range: 'day' | 'week' | 'month') => void;
}

export const BotActivityMonitor: React.FC<BotActivityMonitorProps> = ({
  activities,
  stats,
  timeRange,
  onTimeRangeChange,
}) => {
  const [selectedBot, setSelectedBot] = useState<string>('all');

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      message_sent: 'blue',
      reminder_sent: 'green',
      question_answered: 'purple',
      appointment_scheduled: 'orange',
      escalated_to_human: 'red',
    };
    return colors[action] || 'gray';
  };

  const getBotColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
    return colors[index % colors.length];
  };

  // Prepare chart data
  const messageVolumeData = stats.map((bot, index) => ({
    name: bot.botName,
    messages: bot.totalMessages,
    color: getBotColor(index),
  }));

  const userEngagementData = stats.map((bot) => ({
    name: bot.botName,
    users: bot.activeUsers,
  }));

  const satisfactionData = stats.map((bot, index) => ({
    name: bot.botName,
    value: bot.satisfactionRate,
    color: getBotColor(index),
  }));

  // Filter activities based on selected bot
  const filteredActivities = selectedBot === 'all' 
    ? activities 
    : activities.filter(a => a.botType === selectedBot);

  // Get recent activities (last 10)
  const recentActivities = filteredActivities.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.reduce((sum, bot) => sum + bot.totalMessages, 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12% from last {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.reduce((sum, bot) => sum + bot.activeUsers, 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Unique users this {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.reduce((sum, bot) => sum + bot.averageResponseTime, 0) / stats.length).toFixed(1)}s
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Clock className="w-3 h-3 inline mr-1" />
              Across all bots
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Satisfaction Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.reduce((sum, bot) => sum + bot.satisfactionRate, 0) / stats.length).toFixed(0)}%
            </div>
            <Progress 
              value={stats.reduce((sum, bot) => sum + bot.satisfactionRate, 0) / stats.length} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <Tabs value="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Message Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Message Volume by Bot</CardTitle>
                <CardDescription>Total messages sent this {timeRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={messageVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="messages">
                      {messageVolumeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Engagement Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Engagement</CardTitle>
                <CardDescription>Active users per bot</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={userEngagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bot Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bot Performance</CardTitle>
              <CardDescription>Detailed metrics for each bot</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bot</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">Avg Response</TableHead>
                    <TableHead className="text-right">Satisfaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((bot, index) => (
                    <TableRow key={bot.botName}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getBotColor(index) }}
                          />
                          {bot.botName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {bot.botType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {bot.totalMessages.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {bot.activeUsers.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {bot.averageResponseTime.toFixed(1)}s
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{bot.satisfactionRate}%</span>
                          <Progress
                            value={bot.satisfactionRate}
                            className="w-16 h-2"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Recent Bot Activity
                <select
                  value={selectedBot}
                  onChange={(e) => setSelectedBot(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Bots</option>
                  {stats.map((bot) => (
                    <option key={bot.botType} value={bot.botType}>
                      {bot.botName}
                    </option>
                  ))}
                </select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {activity.botName}{' '}
                            <span className="font-normal text-gray-600 dark:text-gray-400">
                              {activity.action.replace(/_/g, ' ')}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            To: {activity.userName} • {format(activity.timestamp, 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-${getActionColor(activity.action)}-600`}
                        >
                          {activity.action.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {activity.details && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {JSON.stringify(activity.details)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Satisfaction Rate Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Satisfaction by Bot</CardTitle>
                <CardDescription>User satisfaction rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={satisfactionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {satisfactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Time Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Response Time Trends</CardTitle>
                <CardDescription>Average response times over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.map((bot, index) => (
                    <div key={bot.botName} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{bot.botName}</span>
                        <span>{bot.averageResponseTime.toFixed(1)}s</span>
                      </div>
                      <Progress
                        value={(5 - bot.averageResponseTime) * 20}
                        className="h-2"
                        style={{
                          '--progress-background': getBotColor(index),
                        } as any}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};