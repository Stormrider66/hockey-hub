import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertCircle, Server, Users, Clock, Settings, Bell, Globe, Database } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock data
  const systemMetrics = [
    { timestamp: '2025-05-12', errors: 12, responseTime: 230, activeUsers: 450 },
    { timestamp: '2025-05-13', errors: 8, responseTime: 210, activeUsers: 520 },
    { timestamp: '2025-05-14', errors: 15, responseTime: 250, activeUsers: 480 },
    { timestamp: '2025-05-15', errors: 5, responseTime: 190, activeUsers: 540 },
    { timestamp: '2025-05-16', errors: 7, responseTime: 200, activeUsers: 510 },
    { timestamp: '2025-05-17', errors: 9, responseTime: 220, activeUsers: 490 },
    { timestamp: '2025-05-18', errors: 6, responseTime: 210, activeUsers: 570 },
  ];
  
  const services = [
    { name: "User Service", status: "healthy", uptime: 99.98, errors: 0.01 },
    { name: "Calendar Service", status: "healthy", uptime: 99.95, errors: 0.02 },
    { name: "Training Service", status: "healthy", uptime: 99.97, errors: 0.01 },
    { name: "Medical Service", status: "degraded", uptime: 99.82, errors: 0.12 },
    { name: "Communication Service", status: "healthy", uptime: 99.99, errors: 0.01 },
    { name: "Statistics Service", status: "healthy", uptime: 99.94, errors: 0.03 },
    { name: "Planning Service", status: "healthy", uptime: 99.96, errors: 0.02 },
    { name: "Payment Service", status: "healthy", uptime: 99.99, errors: 0.00 },
  ];
  
  const organizations = [
    { name: "Active organizations", value: 152, change: +5 },
    { name: "In trial period", value: 24, change: +2 },
    { name: "Pending renewal", value: 7, change: -1 },
  ];
  
  const subscriptions = [
    { name: "Basic", count: 45 },
    { name: "Standard", count: 87 },
    { name: "Premium", count: 32 },
    { name: "Enterprise", count: 12 },
  ];
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button size="sm" variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="admin">Administration</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <Card key={index} className={service.status === "degraded" ? "border-amber-400" : ""}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{service.name}</p>
                    <div className="flex items-center mt-1">
                      <Badge
                        className={`${
                          service.status === "healthy" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{service.uptime}%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Error Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={systemMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="errors" 
                      stroke="#ef4444" 
                      activeDot={{ r: 8 }} 
                      name="Errors"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Response Time & Active Users</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={systemMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#3b82f6" 
                      name="Response Time (ms)"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="activeUsers" 
                      stroke="#10b981" 
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Medical Service Performance Degradation</p>
                    <p className="text-sm text-amber-700 mt-1">Response times have increased by 15% in the last hour. The system is investigating the issue.</p>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start">
                  <Bell className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Scheduled Maintenance Tonight</p>
                    <p className="text-sm text-blue-700 mt-1">Database optimization scheduled from 02:00 to 03:00 AM. Expect brief service interruptions.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="organizations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {organizations.map((org, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{org.name}</p>
                      <div className="flex items-baseline space-x-2">
                        <h3 className="text-2xl font-bold">{org.value}</h3>
                        <span className={org.change > 0 ? "text-green-500" : "text-red-500"}>
                          {org.change > 0 ? `+${org.change}` : org.change}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>New Organizations (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { date: '04/19', count: 2 },
                    { date: '04/26', count: 3 },
                    { date: '05/03', count: 1 },
                    { date: '05/10', count: 4 },
                    { date: '05/17', count: 2 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="New Organizations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Organization Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="h-24 flex flex-col gap-2 items-center justify-center">
                  <Users className="h-6 w-6" />
                  <span>Register Organization</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
                  <Globe className="h-6 w-6" />
                  <span>Manage Regions</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
                  <Database className="h-6 w-6" />
                  <span>Export Organization Data</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
                  <Clock className="h-6 w-6" />
                  <span>Activity Logs</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Subscriptions by Type</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subscriptions}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Organizations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Renewals</CardTitle>
                <CardDescription>Organizations with renewals in the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Hockey Tigers", date: "May 22, 2025", plan: "Premium" },
                    { name: "Ice Breakers Club", date: "May 25, 2025", plan: "Standard" },
                    { name: "Polar Bears Youth", date: "May 28, 2025", plan: "Standard" },
                    { name: "Northern Knights", date: "June 2, 2025", plan: "Basic" },
                    { name: "Frosty Flyers", date: "June 10, 2025", plan: "Enterprise" },
                  ].map((org, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-muted-foreground">{org.date}</p>
                      </div>
                      <Badge>{org.plan}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-16">Manage Plans</Button>
                <Button variant="outline" className="h-16">Update Pricing</Button>
                <Button variant="outline" className="h-16">Special Offers</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="admin" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Admins
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Admin Activity Logs
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Access Control
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Global Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Globe className="mr-2 h-4 w-4" />
                    Language Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Server className="mr-2 h-4 w-4" />
                    Service Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="mr-2 h-4 w-4" />
                    Backup Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="mr-2 h-4 w-4" />
                    Data Retention Policies
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="mr-2 h-4 w-4" />
                    System Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}