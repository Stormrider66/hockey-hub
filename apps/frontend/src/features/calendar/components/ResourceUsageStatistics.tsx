import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  MapPin,
  Users,
  Wrench,
  Shield,
  Download,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

interface Resource {
  id: string;
  name: string;
  type: 'equipment' | 'facility' | 'staff';
  category: string;
  utilization: number;
  availability: number;
  bookingCount: number;
  revenue: number;
  cost: number;
  efficiency: number;
  status: 'available' | 'in-use' | 'maintenance' | 'unavailable';
  maintenanceScore: number;
  lastMaintenance: string;
  nextMaintenance: string;
  usageHours: number;
  maxCapacity: number;
  peakUsage: string[];
  issues: number;
}

interface UsageTrend {
  date: string;
  equipment: number;
  facility: number;
  staff: number;
  total: number;
}

interface CategoryStats {
  name: string;
  utilization: number;
  revenue: number;
  count: number;
  efficiency: number;
  color: string;
}

const ResourceUsageStatistics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [resourceType, setResourceType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data - in real implementation, this would come from API
  const resources: Resource[] = [
    {
      id: '1',
      name: 'Main Ice Rink',
      type: 'facility',
      category: 'Ice Rink',
      utilization: 85,
      availability: 92,
      bookingCount: 156,
      revenue: 31200,
      cost: 8500,
      efficiency: 88,
      status: 'available',
      maintenanceScore: 95,
      lastMaintenance: '2025-06-15',
      nextMaintenance: '2025-07-15',
      usageHours: 312,
      maxCapacity: 360,
      peakUsage: ['18:00-20:00', '19:00-21:00'],
      issues: 0
    },
    {
      id: '2',
      name: 'Practice Rink',
      type: 'facility',
      category: 'Ice Rink',
      utilization: 72,
      availability: 88,
      bookingCount: 128,
      revenue: 19200,
      cost: 6800,
      efficiency: 82,
      status: 'available',
      maintenanceScore: 90,
      lastMaintenance: '2025-06-20',
      nextMaintenance: '2025-07-20',
      usageHours: 256,
      maxCapacity: 360,
      peakUsage: ['17:00-19:00'],
      issues: 1
    },
    {
      id: '3',
      name: 'Zamboni #1',
      type: 'equipment',
      category: 'Ice Maintenance',
      utilization: 68,
      availability: 95,
      bookingCount: 84,
      revenue: 0,
      cost: 2400,
      efficiency: 92,
      status: 'in-use',
      maintenanceScore: 85,
      lastMaintenance: '2025-06-10',
      nextMaintenance: '2025-07-10',
      usageHours: 168,
      maxCapacity: 240,
      peakUsage: ['07:00-09:00', '21:00-23:00'],
      issues: 0
    },
    {
      id: '4',
      name: 'Training Equipment Set A',
      type: 'equipment',
      category: 'Training',
      utilization: 45,
      availability: 80,
      bookingCount: 96,
      revenue: 0,
      cost: 1200,
      efficiency: 78,
      status: 'maintenance',
      maintenanceScore: 70,
      lastMaintenance: '2025-06-25',
      nextMaintenance: '2025-06-30',
      usageHours: 144,
      maxCapacity: 200,
      peakUsage: ['16:00-18:00'],
      issues: 3
    },
    {
      id: '5',
      name: 'Head Coach Smith',
      type: 'staff',
      category: 'Coaching Staff',
      utilization: 78,
      availability: 85,
      bookingCount: 124,
      revenue: 12400,
      cost: 5000,
      efficiency: 85,
      status: 'available',
      maintenanceScore: 100,
      lastMaintenance: '',
      nextMaintenance: '',
      usageHours: 186,
      maxCapacity: 240,
      peakUsage: ['17:00-20:00'],
      issues: 0
    },
    {
      id: '6',
      name: 'Fitness Center',
      type: 'facility',
      category: 'Training Facility',
      utilization: 65,
      availability: 90,
      bookingCount: 98,
      revenue: 9800,
      cost: 3200,
      efficiency: 80,
      status: 'available',
      maintenanceScore: 88,
      lastMaintenance: '2025-06-18',
      nextMaintenance: '2025-07-18',
      usageHours: 196,
      maxCapacity: 300,
      peakUsage: ['06:00-08:00', '17:00-19:00'],
      issues: 1
    }
  ];

  const usageTrends: UsageTrend[] = [
    { date: '2025-06-01', equipment: 58, facility: 82, staff: 75, total: 72 },
    { date: '2025-06-08', equipment: 62, facility: 85, staff: 78, total: 75 },
    { date: '2025-06-15', equipment: 55, facility: 88, staff: 80, total: 74 },
    { date: '2025-06-22', equipment: 60, facility: 85, staff: 82, total: 76 },
    { date: '2025-06-29', equipment: 58, facility: 87, staff: 78, total: 74 }
  ];

  const categoryStats: CategoryStats[] = [
    { name: 'Ice Rinks', utilization: 78, revenue: 50400, count: 2, efficiency: 85, color: '#3b82f6' },
    { name: 'Training Facilities', utilization: 65, revenue: 9800, count: 1, efficiency: 80, color: '#10b981' },
    { name: 'Ice Maintenance', utilization: 68, revenue: 0, count: 1, efficiency: 92, color: '#f59e0b' },
    { name: 'Training Equipment', utilization: 45, revenue: 0, count: 1, efficiency: 78, color: '#ef4444' },
    { name: 'Coaching Staff', utilization: 78, revenue: 12400, count: 1, efficiency: 85, color: '#8b5cf6' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-use':
        return <Timer className="h-4 w-4 text-blue-600" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>;
      case 'in-use':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Use</Badge>;
      case 'maintenance':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Maintenance</Badge>;
      case 'unavailable':
        return <Badge variant="destructive">Unavailable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-green-600';
    if (utilization >= 60) return 'text-yellow-600';
    if (utilization >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const totalRevenue = resources.reduce((sum, resource) => sum + resource.revenue, 0);
  const totalCost = resources.reduce((sum, resource) => sum + resource.cost, 0);
  const avgUtilization = resources.reduce((sum, resource) => sum + resource.utilization, 0) / resources.length;
  const totalBookings = resources.reduce((sum, resource) => sum + resource.bookingCount, 0);

  const exportReport = () => {
    console.log('Exporting resource usage statistics...');
  };

  const filteredResources = resources.filter(resource => {
    if (resourceType !== 'all' && resource.type !== resourceType) return false;
    if (statusFilter !== 'all' && resource.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Usage Statistics</h2>
          <p className="text-gray-600">Track utilization and efficiency of all organizational resources</p>
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
          <Select value={resourceType} onValueChange={setResourceType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="facility">Facilities</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
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
                <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${(totalRevenue - totalCost).toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  ROI: {((totalRevenue - totalCost) / totalCost * 100).toFixed(1)}%
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
                  +2% from last month
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
                  +15% this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Efficiency Score</p>
                <p className="text-2xl font-bold text-gray-900">84%</p>
                <p className="text-xs text-orange-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +3% improvement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usageTrends}>
                    <defs>
                      <linearGradient id="facilityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="equipmentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="staffGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="facility" stackId="1" stroke="#3b82f6" fill="url(#facilityGradient)" />
                    <Area type="monotone" dataKey="equipment" stackId="1" stroke="#10b981" fill="url(#equipmentGradient)" />
                    <Area type="monotone" dataKey="staff" stackId="1" stroke="#f59e0b" fill="url(#staffGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, utilization }) => `${name}: ${utilization}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="utilization"
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue vs Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={2} name="Efficiency %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4">
            {filteredResources.map((resource) => (
              <Card key={resource.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(resource.status)}
                        <div>
                          <h3 className="font-semibold text-lg">{resource.name}</h3>
                          <p className="text-sm text-gray-600">{resource.category} • {resource.type}</p>
                          {getStatusBadge(resource.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${getUtilizationColor(resource.utilization)}`}>{resource.utilization}%</p>
                        <p className="text-xs text-gray-600">Utilization</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">{resource.availability}%</p>
                        <p className="text-xs text-gray-600">Availability</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600">{resource.bookingCount}</p>
                        <p className="text-xs text-gray-600">Bookings</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-purple-600">{resource.efficiency}%</p>
                        <p className="text-xs text-gray-600">Efficiency</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Utilization Progress</span>
                      <span>{resource.usageHours}h / {resource.maxCapacity}h</span>
                    </div>
                    <Progress value={resource.utilization} className="h-3" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenue</p>
                      <p className="text-lg font-bold text-green-600">${resource.revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Operating Cost</p>
                      <p className="text-lg font-bold text-red-600">${resource.cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Maintenance Score</p>
                      <p className="text-lg font-bold text-blue-600">{resource.maintenanceScore}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Issues</p>
                      <p className={`text-lg font-bold ${resource.issues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {resource.issues}
                      </p>
                    </div>
                  </div>

                  {resource.peakUsage.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Peak Usage Hours:</p>
                      <div className="flex space-x-2">
                        {resource.peakUsage.map((time, index) => (
                          <Badge key={index} variant="outline">{time}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {resource.nextMaintenance && (
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Next Maintenance:</p>
                        <p className="text-sm text-gray-800">{new Date(resource.nextMaintenance).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-600">Last Maintenance:</p>
                        <p className="text-sm text-gray-800">{new Date(resource.lastMaintenance).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4">
            {categoryStats.map((category) => (
              <Card key={category.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: category.color }}></div>
                      <div>
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.count} resources</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${getUtilizationColor(category.utilization)}`}>{category.utilization}%</p>
                        <p className="text-xs text-gray-600">Avg Utilization</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">${category.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">Total Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600">{category.efficiency}%</p>
                        <p className="text-xs text-gray-600">Efficiency</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Progress value={category.utilization} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Usage Trends by Resource Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={usageTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="facility" stroke="#3b82f6" strokeWidth={3} name="Facilities" />
                  <Line type="monotone" dataKey="equipment" stroke="#10b981" strokeWidth={3} name="Equipment" />
                  <Line type="monotone" dataKey="staff" stroke="#f59e0b" strokeWidth={3} name="Staff" />
                  <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" name="Total Average" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceUsageStatistics;