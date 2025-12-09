import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Download,
  Filter,
  AlertTriangle,
  Target,
  MapPin,
  Users
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface FacilityData {
  id: string;
  name: string;
  type: 'ice' | 'training' | 'meeting' | 'locker';
  capacity: number;
  hourlyRate: number;
  utilization: number;
  revenue: number;
  bookings: number;
  peakHours: string[];
  efficiency: number;
}

interface UtilizationTrend {
  date: string;
  ice: number;
  training: number;
  meeting: number;
  total: number;
}

interface PeakUsage {
  hour: string;
  usage: number;
  cost: number;
}

const FacilityUtilizationReports: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');

  // Mock data - in real implementation, this would come from API
  const facilities: FacilityData[] = [
    {
      id: '1',
      name: 'Main Ice Rink',
      type: 'ice',
      capacity: 30,
      hourlyRate: 200,
      utilization: 85,
      revenue: 45600,
      bookings: 228,
      peakHours: ['18:00', '19:00', '20:00'],
      efficiency: 92
    },
    {
      id: '2',
      name: 'Practice Rink',
      type: 'ice',
      capacity: 25,
      hourlyRate: 150,
      utilization: 72,
      revenue: 28800,
      bookings: 192,
      peakHours: ['17:00', '18:00', '19:00'],
      efficiency: 88
    },
    {
      id: '3',
      name: 'Fitness Center',
      type: 'training',
      capacity: 20,
      hourlyRate: 50,
      utilization: 68,
      revenue: 8160,
      bookings: 163,
      peakHours: ['06:00', '17:00', '18:00'],
      efficiency: 85
    },
    {
      id: '4',
      name: 'Conference Room A',
      type: 'meeting',
      capacity: 12,
      hourlyRate: 30,
      utilization: 45,
      revenue: 3240,
      bookings: 108,
      peakHours: ['10:00', '14:00', '16:00'],
      efficiency: 78
    }
  ];

  const utilizationTrends: UtilizationTrend[] = [
    { date: '2025-06-01', ice: 82, training: 65, meeting: 40, total: 75 },
    { date: '2025-06-08', ice: 85, training: 68, meeting: 45, total: 78 },
    { date: '2025-06-15', ice: 88, training: 70, meeting: 42, total: 80 },
    { date: '2025-06-22', ice: 85, training: 72, meeting: 48, total: 82 },
    { date: '2025-06-29', ice: 87, training: 68, meeting: 45, total: 79 }
  ];

  const peakUsageData: PeakUsage[] = [
    { hour: '06:00', usage: 25, cost: 1250 },
    { hour: '07:00', usage: 35, cost: 1750 },
    { hour: '08:00', usage: 45, cost: 2250 },
    { hour: '17:00', usage: 95, cost: 4750 },
    { hour: '18:00', usage: 98, cost: 4900 },
    { hour: '19:00', usage: 92, cost: 4600 },
    { hour: '20:00', usage: 88, cost: 4400 },
    { hour: '21:00', usage: 65, cost: 3250 }
  ];

  const facilityTypeData = [
    { name: 'Ice Rinks', value: 65, color: '#3b82f6' },
    { name: 'Training', value: 20, color: '#10b981' },
    { name: 'Meeting', value: 10, color: '#f59e0b' },
    { name: 'Other', value: 5, color: '#ef4444' }
  ];

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 85) return 'text-green-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationBadge = (utilization: number) => {
    if (utilization >= 85) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (utilization >= 70) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (utilization >= 50) return <Badge variant="default" className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const totalRevenue = facilities.reduce((sum, facility) => sum + facility.revenue, 0);
  const avgUtilization = facilities.reduce((sum, facility) => sum + facility.utilization, 0) / facilities.length;
  const totalBookings = facilities.reduce((sum, facility) => sum + facility.bookings, 0);

  const exportReport = () => {
    // Mock export functionality
    console.log('Exporting facility utilization report...');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facility Utilization Reports</h2>
          <p className="text-gray-600">Comprehensive analysis of facility usage and revenue</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{avgUtilization.toFixed(1)}%</p>
                <p className="text-xs text-blue-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +3% from last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                <p className="text-xs text-purple-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% from last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Efficiency Score</p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
                <p className="text-xs text-orange-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5% from last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilization Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Utilization Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={utilizationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="ice" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="training" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="meeting" stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Facility Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Usage by Facility Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={facilityTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {facilityTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Peak Usage Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Usage Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="usage" fill="#3b82f6" />
                  <Bar yAxisId="right" dataKey="cost" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <div className="grid gap-4">
            {facilities.map((facility) => (
              <Card key={facility.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="font-semibold text-lg">{facility.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{facility.type} • Capacity: {facility.capacity}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold ${getUtilizationColor(facility.utilization)}">{facility.utilization}%</p>
                        <p className="text-xs text-gray-600">Utilization</p>
                        {getUtilizationBadge(facility.utilization)}
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">${facility.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{facility.bookings}</p>
                        <p className="text-xs text-gray-600">Bookings</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Utilization Progress</span>
                      <span>{facility.utilization}% of capacity</span>
                    </div>
                    <Progress value={facility.utilization} className="h-2" />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Peak Hours:</p>
                      <div className="flex space-x-2 mt-1">
                        {facility.peakHours.map((hour) => (
                          <Badge key={hour} variant="outline">{hour}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Efficiency Score</p>
                      <p className="text-lg font-semibold text-green-600">{facility.efficiency}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Utilization Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={utilizationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="ice" stroke="#3b82f6" strokeWidth={3} name="Ice Rinks" />
                  <Line type="monotone" dataKey="training" stroke="#10b981" strokeWidth={3} name="Training Facilities" />
                  <Line type="monotone" dataKey="meeting" stroke="#f59e0b" strokeWidth={3} name="Meeting Rooms" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                  Optimization Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-orange-800">Conference Room A Underutilized</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Only 45% utilized. Consider promoting team meetings or offering discounted rates during off-peak hours.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      View Suggestions
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-800">Peak Hour Management</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      High demand at 6-8 PM. Consider dynamic pricing or additional scheduling options.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Implement Dynamic Pricing
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                  <Target className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-green-800">Revenue Optimization</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Potential 15% revenue increase by optimizing ice time allocation and implementing surge pricing.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      View Revenue Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacilityUtilizationReports;