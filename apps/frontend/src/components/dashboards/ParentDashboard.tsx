'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, MessageCircle, AlertCircle, Check, ChevronRight, Map, Clock,
  UserCheck, UserX, Phone, Mail, FileText, Info, TrendingUp, Trophy,
  Activity, Users, DollarSign, Download, Share2, CalendarDays
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import ParentCalendarView from '@/features/parent/calendar/ParentCalendarView';

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeChild, setActiveChild] = useState("child1");
  
  // Mock data
  const childrenData = [
    { 
      id: "child1", 
      name: "Emma Johansson", 
      team: "U14 Girls", 
      age: 13, 
      position: "Forward", 
      number: "15",
      stats: {
        attendance: 92,
        performanceScore: 85,
        nextPaymentDue: "June 1",
        paymentAmount: "2,500 SEK"
      }
    },
    { 
      id: "child2", 
      name: "Victor Johansson", 
      team: "U12 Mixed", 
      age: 11, 
      position: "Defense", 
      number: "4",
      stats: {
        attendance: 88,
        performanceScore: 78,
        nextPaymentDue: "June 1", 
        paymentAmount: "2,200 SEK"
      }
    }
  ];
  
  const selectedChild = childrenData.find(child => child.id === activeChild) || childrenData[0];
  
  // Mock events
  const upcomingEvents = [
    { date: "Today", title: "Team Practice", location: "Main Rink", type: "ice-training", time: "16:30 - 18:00" },
    { date: "May 21", title: "Physical Training", location: "Gym", type: "physical-training", time: "15:30 - 16:30" },
    { date: "May 23", title: "Home Game vs Ice Breakers", location: "Main Rink", type: "game", time: "18:00" },
    { date: "May 25", title: "Away Game vs Northern Knights", location: "Knights Arena", type: "game", time: "17:00" }
  ];
  
  // Mock team announcements
  const teamAnnouncements = [
    { title: "End of Season Party", date: "May 18", content: "We will have our end of season celebration on June 15. More details to follow.", priority: "normal" },
    { title: "Team Photos Next Week", date: "May 16", content: "Team photos will be taken next Thursday before practice. Please arrive 30 minutes early.", priority: "high" },
    { title: "Away Game Transportation", date: "May 15", content: "For the away game against Northern Knights, the bus will leave from the arena at 15:30.", priority: "normal" }
  ];
  
  // Mock absences
  const reportedAbsences = [
    { reason: "Family Vacation", dates: "June 1 - June 8", status: "Approved", type: "vacation" },
    { reason: "School Exam", dates: "May 27", status: "Pending", type: "school" }
  ];
  
  // Mock performance data
  const performanceData = [
    { month: 'Jan', attendance: 95, performance: 82 },
    { month: 'Feb', attendance: 92, performance: 85 },
    { month: 'Mar', attendance: 88, performance: 87 },
    { month: 'Apr', attendance: 90, performance: 85 },
    { month: 'May', attendance: 92, performance: 88 },
  ];
  
  // Mock payment history
  const paymentHistory = [
    { month: "May", amount: 2500, status: "Paid", date: "2024-05-01" },
    { month: "April", amount: 2500, status: "Paid", date: "2024-04-01" },
    { month: "March", amount: 2500, status: "Paid", date: "2024-03-01" },
  ];
  
  const getEventTypeColor = (type: string) => {
    switch(type) {
      case 'ice-training': return 'bg-blue-100 text-blue-600';
      case 'physical-training': return 'bg-green-100 text-green-600';
      case 'game': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your children&apos;s hockey activities</p>
        </div>
        <div className="flex items-center space-x-2">
          {childrenData.map(child => (
            <Button 
              key={child.id}
              variant={activeChild === child.id ? "default" : "outline"}
              onClick={() => setActiveChild(child.id)}
              className="flex items-center"
            >
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback>{child.name.split(" ")[0][0]}</AvatarFallback>
              </Avatar>
              <span>{child.name.split(" ")[0]}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Child Profile Card */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl font-bold">{selectedChild.number}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{selectedChild.name}</h2>
              <div className="flex items-center space-x-2 mt-2">
                <Badge>{selectedChild.team}</Badge>
                <Badge variant="outline">{selectedChild.position}</Badge>
                <Badge variant="outline">#{selectedChild.number}</Badge>
                <Badge variant="outline">Age: {selectedChild.age}</Badge>
              </div>
              <div className="flex items-center space-x-4 mt-3 text-sm">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-1 text-green-600" />
                  <span>Attendance: {selectedChild.stats.attendance}%</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-blue-600" />
                  <span>Performance: {selectedChild.stats.performanceScore}/100</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Next payment due</p>
            <p className="font-bold">{selectedChild.stats.nextPaymentDue}</p>
            <p className="text-lg font-semibold text-primary">{selectedChild.stats.paymentAmount}</p>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="absences">Absences</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upcoming Events */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>For {selectedChild.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className={`p-2 rounded-md ${getEventTypeColor(event.type).split(' ')[0]}`}>
                        <Calendar className={`h-4 w-4 ${getEventTypeColor(event.type).split(' ')[1]}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{event.title}</p>
                          <Badge variant="outline">{event.date}</Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{event.time}</span>
                          <span>•</span>
                          <Map className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Full Calendar
                </Button>
              </CardFooter>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    <UserX className="mr-2 h-4 w-4" />
                    Report Absence
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message Coach
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Make Payment
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Download Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Team Announcements */}
          <Card>
            <CardHeader>
              <CardTitle>Team Announcements</CardTitle>
              <CardDescription>From {selectedChild.team}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamAnnouncements.map((announcement, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className={`p-2 rounded-full ${
                      announcement.priority === 'high' 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      <Info className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{announcement.title}</p>
                        <time className="text-sm text-muted-foreground">Posted: {announcement.date}</time>
                      </div>
                      <p className="text-sm mt-1">{announcement.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month&apos;s Attendance</p>
                    <h3 className="text-2xl font-bold">{selectedChild.stats.attendance}%</h3>
                  </div>
                  <div className="h-12 w-12">
                    <Progress value={selectedChild.stats.attendance} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Games This Month</p>
                    <h3 className="text-2xl font-bold">4</h3>
                  </div>
                  <Trophy className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Ranking</p>
                    <h3 className="text-2xl font-bold">#2</h3>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Schedule for {selectedChild.name}</h2>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Sync to Calendar
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share Schedule
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Schedule</CardTitle>
              <CardDescription>Next 2 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['This Week', 'Next Week'].map((week, weekIndex) => (
                  <div key={weekIndex}>
                    <h3 className="font-medium mb-3">{week}</h3>
                    <div className="space-y-4">
                      {[
                        { day: 'Monday', events: weekIndex === 0 ? [{ title: 'Team Practice', time: '16:30 - 18:00', location: 'Main Rink', type: 'ice-training' }] : [{ title: 'Team Practice', time: '16:30 - 18:00', location: 'Main Rink', type: 'ice-training' }] },
                        { day: 'Tuesday', events: weekIndex === 0 ? [] : [{ title: 'Physical Training', time: '15:30 - 16:30', location: 'Gym', type: 'physical-training' }] },
                        { day: 'Wednesday', events: weekIndex === 0 ? [{ title: 'Physical Training', time: '15:30 - 16:30', location: 'Gym', type: 'physical-training' }] : [] },
                        { day: 'Thursday', events: weekIndex === 0 ? [{ title: 'Team Practice', time: '16:30 - 18:00', location: 'Main Rink', type: 'ice-training' }] : [{ title: 'Team Practice', time: '16:30 - 18:00', location: 'Main Rink', type: 'ice-training' }] },
                        { day: 'Friday', events: weekIndex === 0 ? [] : [] },
                        { day: 'Saturday', events: weekIndex === 0 ? [] : [{ title: 'Away Game vs Polar Bears', time: '17:00', location: 'Polar Bears Arena', type: 'game' }] },
                        { day: 'Sunday', events: weekIndex === 0 ? [{ title: 'Home Game vs Ice Breakers', time: '18:00', location: 'Main Rink', type: 'game' }] : [] },
                      ].map((day, dayIndex) => (
                        <div key={dayIndex} className={`p-4 rounded-lg ${day.events.length > 0 ? 'bg-slate-50' : 'bg-white border border-dashed'}`}>
                          <div className="flex justify-between items-start">
                            <p className="font-medium">{day.day}</p>
                            {day.events.length === 0 && (
                              <p className="text-sm text-muted-foreground">No events</p>
                            )}
                          </div>
                          {day.events.length > 0 && (
                            <div className="mt-2 space-y-3">
                              {day.events.map((event, eventIndex) => (
                                <div key={eventIndex} className="flex items-start space-x-3">
                                  <div className={`p-2 rounded-md ${getEventTypeColor(event.type).split(' ')[0]}`}>
                                    <Calendar className={`h-4 w-4 ${getEventTypeColor(event.type).split(' ')[1]}`} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{event.title}</p>
                                    <div className="flex items-center text-xs text-muted-foreground space-x-2 mt-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{event.time}</span>
                                      <span>•</span>
                                      <span>{event.location}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Calendar Tab */}
        <TabsContent value="calendar" className="h-[800px]">
          <ParentCalendarView />
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance & Performance Trends</CardTitle>
              <CardDescription>Tracking {selectedChild.name}&apos;s progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" stroke="#3b82f6" name="Attendance %" />
                    <Line type="monotone" dataKey="performance" stroke="#10b981" name="Performance Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Coach Feedback</CardTitle>
                <CardDescription>Latest assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Emma shows great dedication and has improved her skating speed significantly. 
                    Continue working on puck handling during high-pressure situations.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Skating</span>
                    <Progress value={85} className="w-32 h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Shooting</span>
                    <Progress value={78} className="w-32 h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Passing</span>
                    <Progress value={90} className="w-32 h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Game IQ</span>
                    <Progress value={82} className="w-32 h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Goals & Achievements</CardTitle>
                <CardDescription>This season</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-amber-600 mr-2" />
                      <span className="font-medium">Player of the Month</span>
                    </div>
                    <Badge variant="outline">March</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium">Most Improved Player</span>
                    </div>
                    <Badge variant="outline">Q1 2024</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium">Perfect Attendance</span>
                    </div>
                    <Badge variant="outline">February</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Absences Tab */}
        <TabsContent value="absences" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Absence Management</h2>
            <Button>
              <UserX className="mr-2 h-4 w-4" />
              Report New Absence
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Report Absence</CardTitle>
              <CardDescription>Notify coaches about upcoming absences</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Child</label>
                    <Input value={selectedChild.name} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team</label>
                    <Input value={selectedChild.team} disabled />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for Absence</label>
                  <Input placeholder="E.g., Illness, Vacation, School Event" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Date</label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Date</label>
                    <Input type="date" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Information</label>
                  <Textarea placeholder="Any additional details the coach should know..." rows={3} />
                </div>
                
                <Button className="w-full">Submit Absence Report</Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Absence History</CardTitle>
              <CardDescription>Previous and upcoming absences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportedAbsences.map((absence, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className={`p-2 rounded-md ${
                      absence.type === 'vacation' ? 'bg-blue-100' : 'bg-amber-100'
                    }`}>
                      <UserX className={`h-4 w-4 ${
                        absence.type === 'vacation' ? 'text-blue-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{absence.reason}</p>
                        <Badge className={
                          absence.status === 'Approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }>
                          {absence.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Dates: {absence.dates}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Overview</CardTitle>
              <CardDescription>Manage team fees and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    Next payment of <strong>{selectedChild.stats.paymentAmount}</strong> is due on <strong>{selectedChild.stats.nextPaymentDue}</strong>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Payment History</h3>
                  {paymentHistory.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{payment.month} Payment</p>
                        <p className="text-sm text-muted-foreground">Paid on {payment.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{payment.amount} SEK</p>
                        <Badge className="bg-green-100 text-green-800">{payment.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button className="w-full">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Make Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Contacts</CardTitle>
              <CardDescription>Get in touch with coaches and staff</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { role: "Head Coach", name: "Anders Eriksson", email: "anders@team.com", phone: "+46 70 123 4567" },
                  { role: "Assistant Coach", name: "Maria Lindqvist", email: "maria@team.com", phone: "+46 70 234 5678" },
                  { role: "Team Manager", name: "Johan Berg", email: "johan@team.com", phone: "+46 70 345 6789" },
                ].map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.role}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 