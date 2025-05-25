import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Calendar, MessageCircle, Activity, FileText, Heart, Dumbbell, TrendingUp, Check
} from 'lucide-react';

export default function PlayerDashboard() {
  const [activeTab, setActiveTab] = useState("today");
  
  // Mock player data
  const playerInfo = {
    name: "Erik Johansson",
    number: "10",
    position: "Forward",
    team: "Senior Team",
    healthStatus: "Available",
    age: 24
  };
  
  // Mock today's schedule
  const todaysSchedule = [
    { time: "15:00 - 15:45", title: "Team Meeting", location: "Video Room", type: "meeting" },
    { time: "16:00 - 17:30", title: "Ice Practice", location: "Main Rink", type: "ice-training", note: "Focus on powerplay" },
    { time: "17:45 - 18:30", title: "Gym Session", location: "Weight Room", type: "physical-training" }
  ];
  
  // Mock upcoming events
  const upcomingEvents = [
    { date: "Tomorrow", title: "Team Training", type: "ice-training", time: "16:00 - 17:30" },
    { date: "May 21", title: "Physical Testing", type: "testing", time: "14:00 - 16:00" },
    { date: "May 22", title: "Away Game vs Northern Knights", type: "game", time: "19:00" },
    { date: "May 23", title: "Recovery Session", type: "physical-training", time: "10:00 - 11:00" }
  ];
  
  // Mock training program
  const assignedTraining = [
    { title: "Leg Strength", type
      // Mock training program
  const assignedTraining = [
    { title: "Leg Strength", type: "strength", dueDate: "Today", completed: false, description: "Focus on lower body power" },
    { title: "Core Stability", type: "core", dueDate: "Tomorrow", completed: false, description: "Stabilization exercises" },
    { title: "Recovery Protocol", type: "recovery", dueDate: "May 23", completed: false, description: "After game recovery" }
  ];
  
  // Mock development goals
  const developmentGoals = [
    { goal: "Improve shot accuracy", progress: 75, target: "June 15" },
    { goal: "Increase skating speed", progress: 60, target: "June 30" },
    { goal: "Defensive positioning", progress: 85, target: "May 31" }
  ];
  
  // Mock performance stats
  const performanceStats = [
    { date: 'Jan', value: 72 },
    { date: 'Feb', value: 78 },
    { date: 'Mar', value: 82 },
    { date: 'Apr', value: 79 },
    { date: 'May', value: 85 },
  ];
  
  // Mock health metrics
  const healthMetrics = {
    readiness: 87,
    sleep: 8.2,
    soreness: "Low",
    fatigue: "Low"
  };
  
  // Mock radar chart data
  const skillsData = [
    { subject: 'Shooting', A: 85, fullMark: 100 },
    { subject: 'Skating', A: 78, fullMark: 100 },
    { subject: 'Puck Control', A: 82, fullMark: 100 },
    { subject: 'Passing', A: 88, fullMark: 100 },
    { subject: 'Tactical', A: 75, fullMark: 100 },
    { subject: 'Physicality', A: 70, fullMark: 100 },
  ];
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{playerInfo.name}</h1>
          <div className="flex items-center space-x-2 mt-1">
            <Badge>#{playerInfo.number}</Badge>
            <Badge variant="outline">{playerInfo.position}</Badge>
            <Badge className="bg-green-100 text-green-800">{playerInfo.healthStatus}</Badge>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-sm text-muted-foreground">{playerInfo.team}</p>
          <Button size="sm" variant="outline" className="mt-2">
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Coach
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Monday, May 19, 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysSchedule.map((event, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className={`p-2 rounded-md ${
                        event.type === 'ice-training' ? 'bg-blue-100' :
                        event.type === 'physical-training' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        <Calendar className={`h-4 w-4 ${
                          event.type === 'ice-training' ? 'text-blue-600' :
                          event.type === 'physical-training' ? 'text-green-600' :
                          'text-purple-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{event.title}</p>
                          <span className="text-sm text-muted-foreground">{event.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
                        {event.note && (
                          <p className="mt-2 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            {event.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Full Calendar</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Daily Readiness</CardTitle>
                <CardDescription>How are you feeling?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{healthMetrics.readiness}</p>
                      <p className="text-xs text-muted-foreground">Readiness</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sleep Quality:</span>
                    <span className="font-medium">{healthMetrics.sleep}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Muscle Soreness:</span>
                    <span className="font-medium">{healthMetrics.soreness}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fatigue:</span>
                    <span className="font-medium">{healthMetrics.fatigue}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button size="sm" className="w-full">Update Wellness</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className={`p-2 rounded-md ${
                      event.type === 'ice-training' ? 'bg-blue-100' :
                      event.type === 'physical-training' ? 'bg-green-100' :
                      event.type === 'game' ? 'bg-red-100' :
                      event.type === 'testing' ? 'bg-amber-100' :
                      'bg-purple-100'
                    }`}>
                      <Calendar className={`h-4 w-4 ${
                        event.type === 'ice-training' ? 'text-blue-600' :
                        event.type === 'physical-training' ? 'text-green-600' :
                        event.type === 'game' ? 'text-red-600' :
                        event.type === 'testing' ? 'text-amber-600' :
                        'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{event.title}</p>
                        <Badge variant="outline">{event.date}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Team Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: "Team Dinner After Thursday's Game", date: "Today", from: "Coach Svensson" },
                  { title: "Equipment Check Before Away Game", date: "Yesterday", from: "Equipment Manager" },
                  { title: "Travel Arrangements for Northern Knights Game", date: "May 18", from: "Team Manager" },
                ].map((announcement, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{announcement.title}</p>
                        <time className="text-sm text-muted-foreground">{announcement.date}</time>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">From: {announcement.from}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="training" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Assigned Training Programs</CardTitle>
                <CardDescription>Your personal training plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {assignedTraining.map((program, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 mr-3 rounded-md ${
                            program.type === 'strength' ? 'bg-blue-100' :
                            program.type === 'core' ? 'bg-purple-100' :
                            'bg-green-100'
                          }`}>
                            <Dumbbell className={`h-4 w-4 ${
                              program.type === 'strength' ? 'text-blue-600' :
                              program.type === 'core' ? 'text-purple-600' :
                              'text-green-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{program.title}</p>
                            <p className="text-sm text-muted-foreground">{program.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{program.dueDate}</Badge>
                      </div>
                      <div className="flex justify-between mt-3">
                        <Button 
                          size="sm" 
                          variant={program.completed ? "default" : "outline"}
                          className={program.completed ? "pointer-events-none" : ""}
                        >
                          {program.completed ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Completed
                            </>
                          ) : (
                            "Mark Complete"
                          )}
                        </Button>
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Training History</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Development Goals</CardTitle>
                <CardDescription>Your progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {developmentGoals.map((goal, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <p className="font-medium">{goal.goal}</p>
                        <p className="text-sm text-muted-foreground">Target: {goal.target}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Progress value={goal.progress} className="h-2 flex-1 mr-4" />
                        <span className="text-sm font-medium">{goal.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>Your physical testing data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-60">
                  <h3 className="text-sm font-medium mb-2">Vertical Jump (cm)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { date: 'Nov', value: 62, teamAvg: 60 },
                        { date: 'Jan', value: 64, teamAvg: 61 },
                        { date: 'Mar', value: 66, teamAvg: 62 },
                        { date: 'May', value: 68, teamAvg: 62 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[50, 75]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" name="Your Result" />
                      <Line type="monotone" dataKey="teamAvg" stroke="#d1d5db" strokeDasharray="5 5" name="Team Average" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-60">
                  <h3 className="text-sm font-medium mb-2">5-10-5 Agility (seconds)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { date: 'Nov', value: 4.42, teamAvg: 4.38 },
                        { date: 'Jan', value: 4.36, teamAvg: 4.35 },
                        { date: 'Mar', value: 4.28, teamAvg: 4.32 },
                        { date: 'May', value: 4.21, teamAvg: 4.30 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[4.0, 4.5]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" name="Your Result" />
                      <Line type="monotone" dataKey="teamAvg" stroke="#d1d5db" strokeDasharray="5 5" name="Team Average" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Coach's Notes</h3>
                <p className="text-sm text-blue-700">
                  Great improvement in your 5-10-5 agility test! The explosive power training is paying off. 
                  Let's continue to focus on your core stability to maintain these gains while working on your 
                  lateral movement speed.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                View All Test Results
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Season overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceStats}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[50, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" name="Performance Rating" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Skill Assessment</CardTitle>
                <CardDescription>Your strengths and areas to improve</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Skills" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Game Statistics</CardTitle>
                <CardDescription>Last 5 games</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { opponent: "Glacier Giants", result: "W 4-2", goals: 1, assists: 1, rating: 8.2 },
                    { opponent: "Snow Leopards", result: "L 1-3", goals: 0, assists: 0, rating: 6.8 },
                    { opponent: "Ice Dragons", result: "W 5-3", goals: 2, assists: 0, rating: 8.5 },
                    { opponent: "Winter Wolves", result: "W 3-1", goals: 0, assists: 2, rating: 7.9 },
                    { opponent: "Polar Bears", result: "L 2-4", goals: 1, assists: 0, rating: 7.2 },
                  ].map((game, index) => (
                    <div key={index} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{game.opponent}</p>
                          <p className="text-sm text-muted-foreground">{game.result}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{game.goals}G {game.assists}A</p>
                          <p className={`text-sm ${
                            game.rating > 8 ? "text-green-600" : 
                            game.rating > 7 ? "text-amber-600" : "text-red-600"
                          }`}>
                            Rating: {game.rating}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Season Totals</CardTitle>
                <CardDescription>Current statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Games</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Goals</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Assists</p>
                    <p className="text-2xl font-bold">18</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="text-2xl font-bold">30</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">+/-</p>
                    <p className="text-2xl font-bold">+8</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">PIM</p>
                    <p className="text-2xl font-bold">14</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Points Per Game</h3>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { month: 'Nov', value: 1.0 },
                          { month: 'Dec', value: 1.2 },
                          { month: 'Jan', value: 1.1 },
                          { month: 'Feb', value: 1.4 },
                          { month: 'Mar', value: 1.3 },
                          { month: 'Apr', value: 1.6 },
                          { month: 'May', value: 1.5 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 2]} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" name="Points Per Game" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Coach's Feedback</CardTitle>
              <CardDescription>Latest evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-md">
                <p className="italic text-sm">
                  "Erik has shown excellent improvement in his offensive production this season. His playmaking 
                  ability has become a significant asset to the team, as evidenced by his 18 assists. Areas for 
                  continued focus include defensive zone positioning and consistency in physical battles along 
                  the boards. His skating speed and shot accuracy have improved notably since mid-season testing."
                </p>
                <p className="text-right text-sm text-muted-foreground mt-2">- Coach Svensson, May 15, 2025</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Strengths</p>
                  <ul className="text-sm space-y-1 ml-5 list-disc">
                    <li>Playmaking ability</li>
                    <li>Shot accuracy</li>
                    <li>Skating speed</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Areas to Improve</p>
                  <ul className="text-sm space-y-1 ml-5 list-disc">
                    <li>Defensive positioning</li>
                    <li>Physical battles</li>
                    <li>Consistency</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Next Steps</p>
                  <ul className="text-sm space-y-1 ml-5 list-disc">
                    <li>Review defensive zone video clips</li>
                    <li>Additional upper body strength program</li>
                    <li>One-on-one sessions with Coach Berg</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Request Feedback Meeting</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Wellness Tracking</CardTitle>
                <CardDescription>How you've been feeling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { date: 'May 13', sleep: 7.5, soreness: 3, fatigue: 4, readiness: 78 },
                        { date: 'May 14', sleep: 8.2, soreness: 4, fatigue: 3, readiness: 82 },
                        { date: 'May 15', sleep: 7.8, soreness: 2, fatigue: 2, readiness: 88 },
                        { date: 'May 16', sleep: 7.2, soreness: 2, fatigue: 3, readiness: 85 },
                        { date: 'May 17', sleep: 8.5, soreness: 1, fatigue: 2, readiness: 90 },
                        { date: 'May 18', sleep: 8.0, soreness: 1, fatigue: 1, readiness: 92 },
                        { date: 'May 19', sleep: 8.2, soreness: 1, fatigue: 1, readiness: 87 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" domain={[0, 10]} />
                      <YAxis yAxisId="right" orientation="right" domain={[50, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="sleep" stroke="#3b82f6" name="Sleep (hours)" />
                      <Line yAxisId="left" type="monotone" dataKey="soreness" stroke="#ef4444" name="Soreness (1-10)" />
                      <Line yAxisId="left" type="monotone" dataKey="fatigue" stroke="#f97316" name="Fatigue (1-10)" />
                      <Line yAxisId="right" type="monotone" dataKey="readiness" stroke="#10b981" name="Readiness Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Today's Readiness</CardTitle>
                <CardDescription>How are you feeling?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{healthMetrics.readiness}</p>
                      <p className="text-xs text-muted-foreground">Readiness Score</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sleep Quality</span>
                      <span className="font-medium">Excellent</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Muscle Soreness</span>
                      <span className="font-medium">Low</span>
                    </div>