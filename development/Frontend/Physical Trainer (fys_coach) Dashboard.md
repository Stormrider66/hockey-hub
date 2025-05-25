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
  BarChart, Bar, ScatterChart, Scatter, Cell 
} from 'recharts';
import { 
  Calendar, Clock, Plus, BarChart2, Activity, Clipboard, 
  Heart, Dumbbell, TrendingUp, Users
} from 'lucide-react';

export default function PhysicalTrainerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTeam, setSelectedTeam] = useState("senior");
  
  // Mock data
  const teams = [
    { id: "senior", name: "Senior Team" },
    { id: "junior", name: "Junior A" },
    { id: "u16", name: "U16 Boys" }
  ];
  
  const todaysSchedule = [
    { time: "15:00 - 15:45", title: "Team Meeting", location: "Video Room", type: "meeting" },
    { time: "16:00 - 17:30", title: "Ice Practice", location: "Main Rink", type: "ice-training" },
    { time: "17:45 - 18:30", title: "Gym Session", location: "Weight Room", type: "physical-training", note: "Upper body focus" }
  ];
  
  const upcomingTests = [
    { date: "May 21", title: "Mid-Season Testing", team: "Senior Team", location: "Performance Lab", time: "14:00 - 17:00" },
    { date: "May 23", title: "Junior A Testing", team: "Junior A", location: "Performance Lab", time: "15:00 - 18:00" },
    { date: "May 28", title: "U16 Boys Testing", team: "U16 Boys", location: "Performance Lab", time: "16:00 - 18:30" }
  ];
  
  const recentTestResults = [
    { player: "Erik Johansson", team: "Senior Team", test: "Vertical Jump", result: "68 cm", change: "+3 cm" },
    { player: "Maria Andersson", team: "Senior Team", test: "5-10-5 Agility", result: "4.32 s", change: "-0.14 s" },
    { player: "Johan Berg", team: "Senior Team", test: "1RM Squat", result: "142 kg", change: "+7 kg" },
    { player: "Lucas Holm", team: "Senior Team", test: "VO2 Max", result: "58.6", change: "+1.2" }
  ];
  
  const trainingLoad = [
    { date: "May 12", load: 720 },
    { date: "May 13", load: 480 },
    { date: "May 14", load: 620 },
    { date: "May 15", load: 540 },
    { date: "May 16", load: 780 },
    { date: "May 17", load: 340 },
    { date: "May 18", load: 0 },
    { date: "May 19", load: 680 }
  ];
  
  const readinessScores = [
    { player: "Erik Johansson", score: 84, sleep: 7.5, soreness: "Low", fatigue: "Low" },
    { player: "Maria Andersson", score: 72, sleep: 6.2, soreness: "Moderate", fatigue: "Moderate" },
    { player: "Johan Berg", score: 90, sleep: 8.1, soreness: "None", fatigue: "Low" },
    { player: "Anna Nilsson", score: 78, sleep: 7.0, soreness: "Low", fatigue: "Moderate" },
    { player: "Lucas Holm", score: 62, sleep: 5.5, soreness: "High", fatigue: "High" }
  ];
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Physical Training Dashboard</h1>
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
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
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
                <CardTitle>Team Readiness</CardTitle>
                <CardDescription>Player readiness scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {readinessScores.map((player, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <p className="font-medium">{player.player}</p>
                        <Badge className={
                          player.score >= 85 ? "bg-green-100 text-green-800" :
                          player.score >= 70 ? "bg-amber-100 text-amber-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {player.score}/100
                        </Badge>
                      </div>
                      <Progress value={player.score} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Sleep: {player.sleep}h</span>
                        <span>Soreness: {player.soreness}</span>
                        <span>Fatigue: {player.fatigue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Players</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Team Load</CardTitle>
                <CardDescription>Weekly training load</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainingLoad}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="load" 
                      fill="#3b82f6" 
                      name="Team Training Load (AU)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>Latest performance tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTestResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{result.player}</p>
                      <div className="flex items-center text-sm text-muted-foreground space-x-2">
                        <span>{result.test}</span>
                        <span>•</span>
                        <span>{result.team}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{result.result}</p>
                      <p className={`text-sm ${
                        result.change.startsWith('+') || 
                        (result.test === '5-10-5 Agility' && result.change.startsWith('-')) ? 
                        'text-green-600' : 'text-red-600'
                      }`}>
                        {result.change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <BarChart2 className="mr-2 h-4 w-4" />
                View All Test Data
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="training" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Training Management</h2>
            <div className="flex space-x-2">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Training Session
              </Button>
              <Button variant="outline">Manage Templates</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Training Sessions</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: "Today", time: "17:45 - 18:30", title: "Upper Body Strength", team: "Senior Team", location: "Weight Room", type: "strength" },
                    { date: "Tomorrow", time: "16:30 - 17:30", title: "Lower Body Power", team: "Senior Team", location: "Weight Room", type: "power" },
                    { date: "May 21", time: "14:00 - 17:00", title: "Mid-Season Testing", team: "Senior Team", location: "Performance Lab", type: "testing" },
                    { date: "May 22", time: "08:00 - 09:00", title: "Pre-game Activation", team: "Senior Team", location: "Warm-up Area", type: "activation" },
                    { date: "May 23", time: "15:00 - 18:00", title: "Junior A Testing", team: "Junior A", location: "Performance Lab", type: "testing" },
                    { date: "May 24", time: "10:00 - 11:30", title: "Mobility & Recovery", team: "Senior Team", location: "Yoga Room", type: "recovery" },
                  ].map((session, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className={`p-2 rounded-md ${
                        session.type === 'strength' ? 'bg-blue-100' :
                        session.type === 'power' ? 'bg-purple-100' :
                        session.type === 'testing' ? 'bg-amber-100' :
                        session.type === 'activation' ? 'bg-green-100' :
                        session.type === 'recovery' ? 'bg-cyan-100' :
                        'bg-gray-100'
                      }`}>
                        <Activity className={`h-4 w-4 ${
                          session.type === 'strength' ? 'text-blue-600' :
                          session.type === 'power' ? 'text-purple-600' :
                          session.type === 'testing' ? 'text-amber-600' :
                          session.type === 'activation' ? 'text-green-600' :
                          session.type === 'recovery' ? 'text-cyan-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{session.title}</p>
                          <Badge variant="outline">{session.date}</Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                          <span>{session.time}</span>
                          <span>•</span>
                          <span>{session.location}</span>
                          <span>•</span>
                          <span>{session.team}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full justify-start">
                    <Dumbbell className="mr-2 h-4 w-4" />
                    Start Group Session
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Record Test Results
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="mr-2 h-4 w-4" />
                    Check Player Readiness
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Clipboard className="mr-2 h-4 w-4" />
                    Add Readiness Notes
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Assign Individual Program
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Exercise Library</CardTitle>
              <CardDescription>Recently used exercises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { name: "Back Squat", category: "Strength", muscle: "Lower Body", difficulty: "Intermediate" },
                  { name: "Box Jumps", category: "Power", muscle: "Lower Body", difficulty: "Intermediate" },
                  { name: "Bench Press", category: "Strength", muscle: "Upper Body", difficulty: "Beginner" },
                  { name: "Front Plank", category: "Core", muscle: "Core", difficulty: "Beginner" },
                  { name: "Romanian Deadlift", category: "Strength", muscle: "Lower Body", difficulty: "Intermediate" },
                  { name: "Lateral Bounds", category: "Power", muscle: "Lower Body", difficulty: "Advanced" },
                  { name: "Pull-Ups", category: "Strength", muscle: "Upper Body", difficulty: "Intermediate" },
                  { name: "Medicine Ball Throws", category: "Power", muscle: "Upper Body", difficulty: "Intermediate" },
                ].map((exercise, index) => (
                  <Card key={index} className="border">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{exercise.name}</CardTitle>
                      <CardDescription>{exercise.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target:</span>
                          <span>{exercise.muscle}</span>
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
              <Button variant="outline" className="w-full">View Full Exercise Library</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="testing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Physical Testing</h2>
            <div className="flex space-x-2">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Test Session
              </Button>
              <Button variant="outline">Test Templates</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Test Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTests.map((test, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className="p-2 bg-amber-100 rounded-md">
                        <Activity className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{test.title}</p>
                          <Badge variant="outline">{test.date}</Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                          <span>{test.time}</span>
                          <span>•</span>
                          <span>{test.location}</span>
                          <span>•</span>
                          <span>{test.team}</span>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Users className="mr-2 h-4 w-4" />
                            Attendees
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Clipboard className="mr-2 h-4 w-4" />
                            Test Protocol
                          </Button>
                          <Button size="sm" className="flex-1">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Start Testing
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
                <CardTitle>Testing Categories</CardTitle>
                <CardDescription>Available test types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Power Tests", count: 6, lastUsed: "2 days ago" },
                    { name: "Strength Tests", count: 8, lastUsed: "1 week ago" },
                    { name: "Speed Tests", count: 4, lastUsed: "2 weeks ago" },
                    { name: "Endurance Tests", count: 5, lastUsed: "3 weeks ago" },
                    { name: "Mobility Tests", count: 7, lastUsed: "1 month ago" },
                  ].map((category, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.count} tests</p>
                      </div>
                      <Button size="sm" variant="ghost">View</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>Team performance trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Vertical Jump Trends (Last 3 Tests)</h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { name: 'Test 1', team: 55.2, reference: 60 },
                          { name: 'Test 2', team: 57.4, reference: 60 },
                          { name: 'Test 3', team: 59.1, reference: 60 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="team" stroke="#3b82f6" name="Team Average (cm)" />
                        <Line type="monotone" dataKey="reference" stroke="#d1d5db" strokeDasharray="5 5" name="Reference Value" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Max Strength Improvement (%)</h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Squat', value: 12.3 },
                          { name: 'Bench', value: 8.7 },
                          { name: 'Deadlift', value: 11.2 },
                          { name: 'Pull-up', value: 15.4 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" name="Improvement %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Performance Analytics</h2>
            <Button variant="outline">Export Data</Button>
          </div>
          
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Physical Performance Analysis</CardTitle>
              <CardDescription>Off-ice to on-ice performance correlations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 h-80">
                  <h3 className="text-sm font-medium mb-2">Vertical Jump vs. On-Ice Sprint Time</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis type="number" dataKey="verticalJump" name="Vertical Jump" unit="cm" />
                      <YAxis type="number" dataKey="sprintTime" name="30m Sprint Time" unit="s" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter
                        name="Players"
                        data={[
                          { verticalJump: 52, sprintTime: 4.65, name: "Player A" },
                          { verticalJump: 57, sprintTime: 4.48, name: "Player B" },
                          { verticalJump: 61, sprintTime: 4.32, name: "Player C" },
                          { verticalJump: 54, sprintTime: 4.58, name: "Player D" },
                          { verticalJump: 59, sprintTime: 4.40, name: "Player E" },
                          { verticalJump: 64, sprintTime: 4.25, name: "Player F" },
                          { verticalJump: 53, sprintTime: 4.62, name: "Player G" },
                          { verticalJump: 58, sprintTime: 4.45, name: "Player H" },
                          { verticalJump: 63, sprintTime: 4.30, name: "Player I" },
                          { verticalJump: 56, sprintTime: 4.52, name: "Player J" },
                        ]}
                        fill="#3b82f6"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-4">Key Correlations</h3>
                  <div className="space-y-6">
                    {[
                      { test: "Vertical Jump", correlation: -0.65, target: "On-ice Sprint" },
                      { test: "Broad Jump", correlation: -0.53, target: "Acceleration" },
                      { test: "5-10-5 Agility", correlation: 0.71, target: "Skating Agility" },
                      { test: "Pull-up Strength", correlation: -0.48, target: "Shot Power" },
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <p className="font-medium">{item.test}</p>
                          <p className={`font-medium ${Math.abs(item.correlation) > 0.6 ? "text-green-600" : "text-amber-600"}`}>
                            r = {item.correlation}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">Correlates with: {item.target}</p>
                        <Progress 
                          value={Math.abs(item.correlation) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <h3 className="font-medium text-amber-800 mb-2">Training Recommendations</h3>
                <ul className="text-sm text-amber-700 space-y-2 ml-6 list-disc">
                  <li>Prioritize explosive power development through plyometric training</li>
                  <li>Implement targeted strength work for skating-specific muscle groups</li>
                  <li>Consider individualized programs based on position-specific demands</li>
                  <li>Increase focus on change-of-direction training for defensive players</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <TrendingUp className="mr-2 h-4 w-4" />
                Perform Advanced Analysis
              </Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Player Load Monitoring</CardTitle>
                <CardDescription>Weekly team training load distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { day: 'Mon', planned: 700, actual: 680 },
                      { day: 'Tue', planned: 500, actual: 480 },
                      { day: 'Wed', planned: 650, actual: 620 },
                      { day: 'Thu', planned: 550, actual: 540 },
                      { day: 'Fri', planned: 800, actual: 780 },
                      { day: 'Sat', planned: 350, actual: 340 },
                      { day: 'Sun', planned: 0, actual: 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="planned" fill="#94a3b8" name="Planned Load" />
                    <Bar dataKey="actual" fill="#3b82f6" name="Actual Load" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Predictions</CardTitle>
                <CardDescription>Based on current physical metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-slate-100 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Current 30m Sprint (on-ice)</p>
                      <p className="text-sm font-bold">4.45s</p>
                    </div>
                    <div className="flex justify-between mt-4">
                      <p className="text-sm font-medium text-muted-foreground">Predicted with 5% power increase</p>
                      <p className="text-sm font-bold text-green-600">4.32s</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-medium text-blue-800 mb-2">Performance Model</h3>
                    <div className="bg-white p-2 rounded font-mono text-xs mb-3 overflow-x-auto">
                      On-Ice Time = 7.21 - 0.023 × Vertical Jump + 0.532 × Off-Ice 30m - 0.006 × Broad Jump
                    </div>
                    <p className="text-sm text-blue-700">
                      This model explains 74% of the variation in on-ice sprint performance based on three key off-ice tests.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Recommended Focus Areas</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-1/2 h-3 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: "80%" }}></div>
                      </div>
                      <span className="text-sm">Explosive Power</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1/2 h-3 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: "65%" }}></div>
                      </div>
                      <span className="text-sm">Sprint Technique</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1/2 h-3 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: "50%" }}></div>
                      </div>
                      <span className="text-sm">Strength Base</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}