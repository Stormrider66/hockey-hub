import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Calendar, Clock, Plus, Activity, AlertCircle, FileText, Clipboard, 
  Stethoscope, Heart, MoveRight, Users, ArrowUpRight, Edit
} from 'lucide-react';

export default function MedicalDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTeam, setSelectedTeam] = useState("senior");
  
  // Mock data
  const teams = [
    { id: "senior", name: "Senior Team" },
    { id: "junior", name: "Junior A" },
    { id: "u16", name: "U16 Boys" }
  ];
  
  const todaysAppointments = [
    { time: "14:00 - 14:30", player: "Oskar Lind", type: "Injury Assessment", location: "Medical Room", status: "scheduled" },
    { time: "15:00 - 15:45", player: "Johan Berg", type: "Rehabilitation", location: "Rehab Gym", status: "scheduled" },
    { time: "16:30 - 17:00", player: "Maria Andersson", type: "Follow-up", location: "Medical Room", status: "scheduled" }
  ];
  
  const activeInjuries = [
    { player: "Oskar Lind", injury: "Knee Sprain", status: "Acute", daysSince: 3, expectedReturn: "2-3 weeks" },
    { player: "Johan Berg", injury: "Shoulder Strain", status: "Rehabilitation", daysSince: 14, expectedReturn: "1 week" },
    { player: "Emma Lindberg", injury: "Ankle Sprain", status: "Return to Play", daysSince: 21, expectedReturn: "Cleared" },
    { player: "Alexander Björk", injury: "Concussion", status: "Monitoring", daysSince: 10, expectedReturn: "TBD" }
  ];
  
  const playerAvailability = {
    full: 18,
    limited: 3,
    rehab: 2,
    unavailable: 1
  };
  
  const injuryDistribution = [
    { name: "Lower Body", value: 8, color: "#3b82f6" },
    { name: "Upper Body", value: 5, color: "#ef4444" },
    { name: "Head", value: 2, color: "#f97316" },
    { name: "Illness", value: 3, color: "#8b5cf6" }
  ];
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Medical Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="injuries">Injuries</TabsTrigger>
          <TabsTrigger value="rehabilitation">Rehabilitation</TabsTrigger>
          <TabsTrigger value="records">Medical Records</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Today's Appointments</CardTitle>
                <CardDescription>Monday, May 19, 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysAppointments.map((appointment, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className={`p-2 rounded-md ${
                        appointment.type === 'Injury Assessment' ? 'bg-amber-100' :
                        appointment.type === 'Rehabilitation' ? 'bg-green-100' :
                        'bg-blue-100'
                      }`}>
                        <Stethoscope className={`h-4 w-4 ${
                          appointment.type === 'Injury Assessment' ? 'text-amber-600' :
                          appointment.type === 'Rehabilitation' ? 'text-green-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{appointment.player}</p>
                          <span className="text-sm text-muted-foreground">{appointment.time}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                          <span>{appointment.type}</span>
                          <span>•</span>
                          <span>{appointment.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Player Availability</CardTitle>
                <CardDescription>Team status overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Full Availability", value: playerAvailability.full, color: "#10b981" },
                          { name: "Limited Participation", value: playerAvailability.limited, color: "#f59e0b" },
                          { name: "Rehabilitation", value: playerAvailability.rehab, color: "#3b82f6" },
                          { name: "Unavailable", value: playerAvailability.unavailable, color: "#ef4444" }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {[...Array(4)].map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={[
                              "#10b981", "#f59e0b", "#3b82f6", "#ef4444"
                            ][index]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Full: {playerAvailability.full}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-sm">Limited: {playerAvailability.limited}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">Rehab: {playerAvailability.rehab}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm">Out: {playerAvailability.unavailable}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Update Player Status</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Injury Distribution</CardTitle>
                <CardDescription>Season overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={injuryDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={true}
                      >
                        {injuryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {injuryDistribution.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm
<span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Detailed Report</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Injuries</CardTitle>
              <CardDescription>Currently managing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeInjuries.map((injury, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className={`p-2 rounded-md ${
                      injury.status === 'Acute' ? 'bg-red-100' :
                      injury.status === 'Rehabilitation' ? 'bg-blue-100' :
                      injury.status === 'Return to Play' ? 'bg-green-100' :
                      'bg-amber-100'
                    }`}>
                      <Activity className={`h-4 w-4 ${
                        injury.status === 'Acute' ? 'text-red-600' :
                        injury.status === 'Rehabilitation' ? 'text-blue-600' :
                        injury.status === 'Return to Play' ? 'text-green-600' :
                        'text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{injury.player}</p>
                          <p className="text-sm text-muted-foreground">{injury.injury}</p>
                        </div>
                        <Badge className={
                          injury.status === 'Acute' ? 'bg-red-100 text-red-800' :
                          injury.status === 'Rehabilitation' ? 'bg-blue-100 text-blue-800' :
                          injury.status === 'Return to Play' ? 'bg-green-100 text-green-800' :
                          'bg-amber-100 text-amber-800'
                        }>{injury.status}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{injury.daysSince} days since injury</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm">Expected return: <strong>{injury.expectedReturn}</strong></span>
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Register New Injury
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="injuries" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Injury Management</h2>
            <div className="flex space-x-2">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Injury Report
              </Button>
              <Button variant="outline">Statistics</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Current Injuries</CardTitle>
                <CardDescription>Active cases requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="h-80 overflow-auto">
                <div className="space-y-4">
                  {[...activeInjuries, 
                    { player: "Sofia Karlsson", injury: "Lower Back Pain", status: "Monitoring", daysSince: 5, expectedReturn: "1 week" },
                    { player: "Gustav Johansson", injury: "Groin Strain", status: "Rehabilitation", daysSince: 18, expectedReturn: "3-4 days" },
                  ].map((injury, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{injury.player.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{injury.player}</p>
                            <div className="flex items-center text-sm text-muted-foreground space-x-2">
                              <span>{injury.injury}</span>
                              <span>•</span>
                              <span>{injury.daysSince} days</span>
                            </div>
                          </div>
                          <Badge className={
                            injury.status === 'Acute' ? 'bg-red-100 text-red-800' :
                            injury.status === 'Rehabilitation' ? 'bg-blue-100 text-blue-800' :
                            injury.status === 'Return to Play' ? 'bg-green-100 text-green-800' :
                            'bg-amber-100 text-amber-800'
                          }>{injury.status}</Badge>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <FileText className="mr-2 h-4 w-4" />
                            Treatment Notes
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="mr-2 h-4 w-4" />
                            Update Status
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Injury Prevention</CardTitle>
                <CardDescription>Risk assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">High Risk Players</h3>
                  {[
                    { name: "Lucas Holm", risk: "High", factors: "Recent illness, fatigue" },
                    { name: "Anna Nilsson", risk: "Medium", factors: "Previous ankle issue" },
                    { name: "Erik Johansson", risk: "Medium", factors: "Training load spike" },
                  ].map((player, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.factors}</p>
                      </div>
                      <Badge className={
                        player.risk === 'High' ? 'bg-red-100 text-red-800' :
                        player.risk === 'Medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }>{player.risk}</Badge>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Team Risk Factors</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Training load</span>
                        <span className="text-amber-600">Moderate Risk</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: "65%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Sleep quality</span>
                        <span className="text-green-600">Low Risk</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: "35%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Game congestion</span>
                        <span className="text-red-600">High Risk</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Prevention Guidelines</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Injury Trends</CardTitle>
              <CardDescription>Season overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-60">
                  <h3 className="text-sm font-medium mb-2">Injuries by Month</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { month: 'Nov', count: 3 },
                        { month: 'Dec', count: 5 },
                        { month: 'Jan', count: 8 },
                        { month: 'Feb', count: 4 },
                        { month: 'Mar', count: 6 },
                        { month: 'Apr', count: 3 },
                        { month: 'May', count: 2 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Injuries" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-60">
                  <h3 className="text-sm font-medium mb-2">Recovery Time by Injury Type (Avg. Days)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { type: 'Ankle Sprain', days: 14 },
                        { type: 'Groin Strain', days: 18 },
                        { type: 'Shoulder', days: 21 },
                        { type: 'Knee Sprain', days: 28 },
                        { type: 'Concussion', days: 16 },
                        { type: 'Back Pain', days: 10 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="days" stroke="#ef4444" name="Recovery Days" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rehabilitation" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Rehabilitation Management</h2>
            <div className="flex space-x-2">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Rehab Plan
              </Button>
              <Button variant="outline">Exercise Library</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Current Rehabilitation Plans</CardTitle>
                <CardDescription>Active treatment programs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { 
                      player: "Johan Berg", 
                      injury: "Shoulder Strain", 
                      phase: "Mid-Phase", 
                      progress: 65, 
                      startDate: "May 5, 2025",
                      nextAppointment: "Today, 15:00"
                    },
                    { 
                      player: "Emma Lindberg", 
                      injury: "Ankle Sprain", 
                      phase: "Late-Phase", 
                      progress: 85, 
                      startDate: "April 28, 2025",
                      nextAppointment: "May 20, 2025"
                    },
                    { 
                      player: "Gustav Johansson", 
                      injury: "Groin Strain", 
                      phase: "Mid-Phase", 
                      progress: 60, 
                      startDate: "May 1, 2025",
                      nextAppointment: "May 21, 2025"
                    },
                  ].map((plan, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{plan.player}</p>
                          <p className="text-sm text-muted-foreground">{plan.injury}</p>
                        </div>
                        <Badge className={
                          plan.phase === 'Early-Phase' ? 'bg-blue-100 text-blue-800' :
                          plan.phase === 'Mid-Phase' ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }>{plan.phase}</Badge>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Rehabilitation Progress</span>
                          <span>{plan.progress}%</span>
                        </div>
                        <Progress value={plan.progress} className="h-2 mt-1" />
                      </div>
                      <div className="grid grid-cols-2 mt-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-muted-foreground">Started: {plan.startDate}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-muted-foreground">Next: {plan.nextAppointment}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1">
                          <FileText className="mr-2 h-4 w-4" />
                          View Plan
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="mr-2 h-4 w-4" />
                          Update Progress
                        </Button>
                        <Button size="sm" className="flex-1">
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Advance Phase
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Transitions</CardTitle>
                <CardDescription>Phase transitions and RTPs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { player: "Emma Lindberg", transition: "Return to Play", date: "May 20, 2025", readiness: 85 },
                    { player: "Gustav Johansson", transition: "Late Phase", date: "May 21, 2025", readiness: 78 },
                    { player: "Johan Berg", transition: "Return to Training", date: "May 24, 2025", readiness: 72 },
                  ].map((item, index) => (
                    <div key={index} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{item.player}</p>
                        <Badge className={
                          item.transition === 'Return to Play' ? 'bg-green-100 text-green-800' :
                          item.transition === 'Return to Training' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }>{item.transition}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Scheduled: {item.date}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Readiness Assessment</span>
                          <span>{item.readiness}%</span>
                        </div>
                        <Progress 
                          value={item.readiness} 
                          className="h-2 mt-1" 
                          style={{
                            backgroundColor: "#f3f4f6",
                            "& > div": {
                              backgroundColor: item.readiness >= 80 ? "#10b981" : 
                                              item.readiness >= 70 ? "#f59e0b" : "#ef4444"
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Schedule Assessment</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Rehabilitation Exercise Library</CardTitle>
              <CardDescription>Recently used exercises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { name: "Isometric Shoulder External Rotation", phase: "Early", bodyPart: "Shoulder", difficulty: "Beginner" },
                  { name: "Single-Leg Balance", phase: "Early", bodyPart: "Ankle", difficulty: "Beginner" },
                  { name: "Eccentric Hamstring Slides", phase: "Mid", bodyPart: "Knee", difficulty: "Intermediate" },
                  { name: "Banded Rotator Cuff Series", phase: "Mid", bodyPart: "Shoulder", difficulty: "Intermediate" },
                  { name: "Lateral Movement Progression", phase: "Late", bodyPart: "Groin", difficulty: "Advanced" },
                  { name: "Y-Balance Test Exercises", phase: "Late", bodyPart: "Lower Body", difficulty: "Advanced" },
                  { name: "Lumbar Stabilization", phase: "All", bodyPart: "Back", difficulty: "Intermediate" },
                  { name: "Vestibular Rehabilitation", phase: "All", bodyPart: "Head", difficulty: "Intermediate" },
                ].map((exercise, index) => (
                  <Card key={index} className="border">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{exercise.name}</CardTitle>
                      <CardDescription>
                        <Badge className={
                          exercise.phase === 'Early' ? 'bg-blue-100 text-blue-800' :
                          exercise.phase === 'Mid' ? 'bg-amber-100 text-amber-800' :
                          exercise.phase === 'Late' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }>{exercise.phase} Phase</Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Body Part:</span>
                          <span>{exercise.bodyPart}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Difficulty:</span>
                          <span>{exercise.difficulty}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Exercises</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="records" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Medical Records</h2>
            <Button variant="outline">Export Records</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Player Search</CardTitle>
                <CardDescription>Access medical records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Erik Johansson", position: "Forward", status: "Healthy" },
                    { name: "Maria Andersson", position: "Forward", status: "Healthy" },
                    { name: "Johan Berg", position: "Defense", status: "Injured" },
                    { name: "Anna Nilsson", position: "Goalie", status: "Healthy" },
                    { name: "Lucas Holm", position: "Forward", status: "Healthy" },
                  ].map((player, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>{player.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{player.name}</p>
                          <p className="text-xs text-muted-foreground">{player.position}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">View</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Players</Button>
              </CardFooter>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Medical History Overview</CardTitle>
                <CardDescription>Team injury history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { season: '2020', injuries: 24, severity: 18.5, manGames: 145 },
                        { season: '2021', injuries: 28, severity: 15.2, manGames: 168 },
                        { season: '2022', injuries: 22, severity: 14.8, manGames: 132 },
                        { season: '2023', injuries: 18, severity: 17.2, manGames: 122 },
                        { season: '2024', injuries: 20, severity: 16.5, manGames: 132 },
                        { season: '2025', injuries: 16, severity: 15.8, manGames: 98 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="season" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="injuries" 
                        stroke="#3b82f6" 
                        name="Total Injuries" 
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="severity" 
                        stroke="#f97316" 
                        name="Avg. Severity (days)" 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="manGames" 
                        stroke="#ef4444" 
                        name="Man Games Lost" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">Current Season Insights</h3>
                  <ul className="text-sm text-blue-700 space-y-2 ml-6 list-disc">
                    <li>Total injuries down 20% compared to 5-year average</li>
                    <li>Average severity decreased by 8% from previous season</li>
                    <li>Lower body injuries remain most common (68% of all injuries)</li>
                    <li>Recurrence rate decreased to 12% (from 18% last season)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Medical Staff Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="h-24 flex flex-col gap-2 items-center justify-center">
                  <FileText className="h-6 w-6" />
                  <span>New Medical Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
                  <Heart className="h-6 w-6" />
                  <span>Health Screening</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
                  <Stethoscope className="h-6 w-6" />
                  <span>Update Medical Status</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                  <span>Injury Prevention Plan</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}