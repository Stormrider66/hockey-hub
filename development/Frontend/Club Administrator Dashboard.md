import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar 
} from 'recharts';
import { 
  Users, Calendar, Search, MessageCircle, Shield, Plus, User, UserCog, 
  BarChart2, Clock, Settings, Bell 
} from 'lucide-react';

export default function ClubAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock data
  const organizationStats = {
    teams: 12,
    activeMembers: 243,
    coachingStaff: 18,
    upcomingEvents: 28
  };
  
  const teamData = [
    { id: 1, name: "Senior Team", membersCount: 32, status: "active", category: "Senior", attendance: 92 },
    { id: 2, name: "Junior A", membersCount: 28, status: "active", category: "Junior", attendance: 88 },
    { id: 3, name: "Junior B", membersCount: 26, status: "active", category: "Junior", attendance: 85 },
    { id: 4, name: "U16 Boys", membersCount: 24, status: "active", category: "Youth", attendance: 90 },
    { id: 5, name: "U14 Girls", membersCount: 22, status: "active", category: "Youth", attendance: 94 },
    { id: 6, name: "U14 Boys", membersCount: 26, status: "active", category: "Youth", attendance: 87 },
    { id: 7, name: "U12 Mixed", membersCount: 28, status: "active", category: "Youth", attendance: 91 },
    { id: 8, name: "Development Team", membersCount: 35, status: "active", category: "Development", attendance: 82 },
  ];
  
  const roleBreakdown = [
    { name: "Players", value: 180, color: "#3b82f6" },
    { name: "Coaches", value: 15, color: "#10b981" },
    { name: "Medical Staff", value: 3, color: "#ef4444" },
    { name: "Physical Trainers", value: 5, color: "#f97316" },
    { name: "Parents", value: 35, color: "#6366f1" },
    { name: "Equipment Managers", value: 2, color: "#8b5cf6" }
  ];
  
  const recentActivity = [
    { id: 1, type: "New Player", name: "Erik Johansson", team: "U14 Boys", timestamp: "Today, 15:42" },
    { id: 2, type: "Team Creation", name: "U12 Girls", team: "-", timestamp: "Today, 13:21" },
    { id: 3, type: "Role Change", name: "Maria Andersson", team: "Junior A", timestamp: "Yesterday, 18:05" },
    { id: 4, type: "New Coach", name: "Johan Berg", team: "U16 Boys", timestamp: "May 17, 10:30" },
    { id: 5, type: "Player Transfer", name: "Lucas Nilsson", team: "Junior B", timestamp: "May 16, 09:15" },
  ];
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Club Administration</h1>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="admin">Administration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Teams</p>
                    <h3 className="text-2xl font-bold">{organizationStats.teams}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                    <h3 className="text-2xl font-bold">{organizationStats.activeMembers}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Coaching Staff</p>
                    <h3 className="text-2xl font-bold">{organizationStats.coachingStaff}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                    <h3 className="text-2xl font-bold">{organizationStats.upcomingEvents}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Team Overview</CardTitle>
                  <CardDescription>Current teams status and statistics</CardDescription>
                </CardHeader>
                <CardContent className="h-80 overflow-auto">
                  <div className="space-y-4">
                    {teamData.map((team) => (
                      <div key={team.id} className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-4">
                            <AvatarFallback>{team.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{team.name}</p>
                            <div className="flex items-center text-sm text-muted-foreground space-x-2">
                              <Badge variant="outline">{team.category}</Badge>
                              <span>•</span>
                              <span>{team.membersCount} members</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right hidden md:block">
                            <p className="text-sm font-medium">Attendance Rate</p>
                            <p className={`text-sm ${
                              team.attendance >= 90 ? "text-green-600" : 
                              team.attendance >= 85 ? "text-amber-600" : "text-red-600"
                            }`}>
                              {team.attendance}%
                            </p>
                          </div>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Team
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Member Distribution</CardTitle>
                <CardDescription>Members by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={1}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {roleBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className="p-2 bg-muted rounded-full">
                      {activity.type === "New Player" || activity.type === "New Coach" ? (
                        <User className="h-4 w-4" />
                      ) : activity.type === "Team Creation" ? (
                        <Users className="h-4 w-4" />
                      ) : activity.type === "Role Change" ? (
                        <UserCog className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{activity.type}</p>
                        <time className="text-sm text-muted-foreground">{activity.timestamp}</time>
                      </div>
                      <p className="text-sm">{activity.name}</p>
                      {activity.team !== "-" && (
                        <p className="text-sm text-muted-foreground">Team: {activity.team}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Activity</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="teams" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search teams..." className="pl-8" />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamData.map((team) => (
              <Card key={team.id}>
                <CardHeader className="pb-2">
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.category} • {team.membersCount} members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attendance:</span>
                      <span className="font-medium">{team.attendance}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Upcoming events:</span>
                      <span className="font-medium">{Math.floor(Math.random() * 10) + 2}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last activity:</span>
                      <span className="font-medium">Today</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">Members</Button>
                  <Button size="sm">Manage</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search members..." className="pl-8" />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Erik Svensson", role: "Coach", team: "Senior Team", status: "active" },
                  { name: "Maria Andersson", role: "Player", team: "Junior A", status: "active" },
                  { name: "Johan Berg", role: "Coach", team: "U16 Boys", status: "active" },
                  { name: "Anna Nilsson", role: "Physical Trainer", team: "Multiple", status: "active" },
                  { name: "Lucas Holm", role: "Player", team: "Junior B", status: "active" },
                  { name: "Sofia Karlsson", role: "Medical Staff", team: "Multiple", status: "active" },
                  { name: "Gustav Johansson", role: "Equipment Manager", team: "Multiple", status: "active" },
                  { name: "Emma Lindberg", role: "Player", team: "U14 Girls", status: "active" },
                ].map((member, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-4">
                        <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground space-x-2">
                          <Badge variant="outline">{member.role}</Badge>
                          <span>•</span>
                          <span>{member.team}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost">Profile</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Members</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          {/* Calendar content would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Calendar</CardTitle>
              <CardDescription>Upcoming events across all teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: "Senior Team Practice", location: "Main Rink", date: "Today", time: "18:00 - 19:30", type: "ice-training" },
                  { title: "Junior A vs Northern Knights", location: "Main Rink", date: "Tomorrow", time: "15:00 - 17:00", type: "game" },
                  { title: "U16 Physical Training", location: "Gym", date: "Tomorrow", time: "17:30 - 19:00", type: "physical-training" },
                  { title: "Coaches Meeting", location: "Conference Room", date: "May 21", time: "19:00 - 20:30", type: "meeting" },
                  { title: "U14 Boys Practice", location: "B Rink", date: "May 21", time: "16:00 - 17:30", type: "ice-training" },
                ].map((event, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className={`p-2 rounded-md ${
                      event.type === 'ice-training' ? 'bg-blue-100' :
                      event.type === 'game' ? 'bg-red-100' :
                      event.type === 'physical-training' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}>
                      <Calendar className={`h-4 w-4 ${
                        event.type === 'ice-training' ? 'text-blue-600' :
                        event.type === 'game' ? 'text-red-600' :
                        event.type === 'physical-training' ? 'text-green-600' :
                        'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{event.title}</p>
                        <Badge variant="outline">{event.date}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                        <span>{event.time}</span>
                        <span>•</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </CardFooter>
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
                    <User className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <UserCog className="mr-2 h-4 w-4" />
                    Role Assignment
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Users
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Announcement
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Create Channel
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="mr-2 h-4 w-4" />
                    Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    General Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Reports
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Subscription Management
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