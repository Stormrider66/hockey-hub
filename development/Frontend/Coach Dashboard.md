import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { 
  Calendar, Clock, UserCheck, UserX, Video, Plus, MessageCircle, 
  ChevronRight, Clipboard, Edit, Activity, AlertCircle
} from 'lucide-react';

export default function CoachDashboard() {
  const [activeTab, setActiveTab] = useState("today");
  
  // Mock data
  const teamStats = {
    wins: 12,
    losses: 5,
    ties: 3,
    goalsFor: 68,
    goalsAgainst: 42
  };
  
  const availabilityStats = {
    available: 18,
    limited: 4,
    unavailable: 2
  };
  
  const players = [
    { id: 1, name: "Erik Johansson", position: "Forward", number: "10", status: "available" },
    { id: 2, name: "Maria Andersson", position: "Forward", number: "21", status: "available" },
    { id: 3, name: "Johan Berg", position: "Defense", number: "5", status: "limited", note: "Recovering from minor strain" },
    { id: 4, name: "Anna Nilsson", position: "Goalie", number: "1", status: "available" },
    { id: 5, name: "Lucas Holm", position: "Forward", number: "18", status: "available" },
    { id: 6, name: "Oskar Lind", position: "Defense", number: "4", status: "unavailable", note: "Knee injury - expected return in 2 weeks" }
  ];
  
  const todaysSchedule = [
    { time: "15:00 - 15:45", title: "Team Meeting", location: "Video Room", type: "meeting" },
    { time: "16:00 - 17:30", title: "Ice Practice", location: "Main Rink", type: "ice-training", note: "Focus on powerplay" },
    { time: "17:45 - 18:30", title: "Gym Session", location: "Weight Room", type: "physical-training" }
  ];
  
  const upcomingGames = [
    { date: "May 22", opponent: "Northern Knights", location: "Away", time: "19:00" },
    { date: "May 25", opponent: "Ice Breakers", location: "Home", time: "18:30" },
    { date: "June 1", opponent: "Polar Bears", location: "Away", time: "17:00" }
  ];
  
  const developmentGoals = [
    { player: "Erik Johansson", goal: "Improve shot accuracy", progress: 75 },
    { player: "Maria Andersson", goal: "Increase skating speed", progress: 60 },
    { player: "Johan Berg", goal: "Defensive positioning", progress: 80 },
    { player: "Anna Nilsson", goal: "Rebound control", progress: 65 }
  ];
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Coach Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Senior Team</span>
          <Button size="sm" variant="outline">Change Team</Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="space-y-4">
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
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Player Availability</CardTitle>
                <CardDescription>Current team status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{availabilityStats.available}</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{availabilityStats.limited}</p>
                    <p className="text-sm text-muted-foreground">Limited</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{availabilityStats.unavailable}</p>
                    <p className="text-sm text-muted-foreground">Unavailable</p>
                  </div>
                </div>
                <div className="h-48 overflow-y-auto space-y-3">
                  {players.map((player, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>{player.number}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{player.name}</p>
                          <p className="text-xs text-muted-foreground">{player.position}</p>
                        </div>
                      </div>
                      <Badge className={
                        player.status === "available" ? "bg-green-100 text-green-800" :
                        player.status === "limited" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {player.status}
                      </Badge>
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
                <CardTitle>Upcoming Games</CardTitle>
                <CardDescription>Next matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingGames.map((game, index) => (
                    <div key={index} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{game.opponent}</p>
                        <Badge variant="outline">{game.date}</Badge>
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-sm text-muted-foreground">{game.location}</p>
                        <p className="text-sm text-muted-foreground">{game.time}</p>
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Clipboard className="mr-2 h-4 w-4" />
                          Game Plan
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Video className="mr-2 h-4 w-4" />
                          Opponent Analysis
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Season Schedule</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: "injury", message: "Oskar Lind reported knee pain after yesterday's practice", time: "1 hour ago" },
                  { type: "attendance", message: "Lucas Holm will be absent from tomorrow's practice", time: "3 hours ago" },
                  { type: "schedule", message: "Ice time for Thursday has been changed to 18:00-19:30", time: "Yesterday" },
                  { type: "message", message: "Physical Trainer shared new off-ice training plan", time: "Yesterday" },
                ].map((notification, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className={`p-2 rounded-md ${
                      notification.type === 'injury' ? 'bg-red-100' :
                      notification.type === 'attendance' ? 'bg-amber-100' :
                      notification.type === 'schedule' ? 'bg-blue-100' :
                      'bg-green-100'
                    }`}>
                      {notification.type === 'injury' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : notification.type === 'attendance' ? (
                        <UserX className="h-4 w-4 text-amber-600" />
                      ) : notification.type === 'schedule' ? (
                        <Clock className="h-4 w-4 text-blue-600" />
                      ) : (
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{notification.message}</p>
                        <time className="text-sm text-muted-foreground">{notification.time}</time>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Current season</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Record</p>
                    <p className="text-xl font-bold">{teamStats.wins}-{teamStats.losses}-{teamStats.ties}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Win %</p>
                    <p className="text-xl font-bold">
                      {Math.round((teamStats.wins / (teamStats.wins + teamStats.losses + teamStats.ties)) * 100)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Goals For</p>
                    <p className="text-xl font-bold">{teamStats.goalsFor}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Goals Against</p>
                    <p className="text-xl font-bold">{teamStats.goalsAgainst}</p>
                  </div>
                </div>
                
                <div className="h-40 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Wins', value: teamStats.wins, fill: '#10b981' },
                        { name: 'Losses', value: teamStats.losses, fill: '#ef4444' },
                        { name: 'Ties', value: teamStats.ties, fill: '#3b82f6' },
                      ]}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Detailed Stats</Button>
              </CardFooter>
            </Card>
            
            <Card className="col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Team Roster</CardTitle>
                <CardDescription>All team members</CardDescription>
              </CardHeader>
              <CardContent className="h-80 overflow-auto">
                <div className="space-y-4">
                  {[...players, 
                    { id: 7, name: "Sofia Karlsson", position: "Forward", number: "16", status: "available" },
                    { id: 8, name: "Gustav Johansson", position: "Defense", number: "3", status: "available" },
                    { id: 9, name: "Emma Lindberg", position: "Forward", number: "15", status: "available" },
                    { id: 10, name: "Alexander Björk", position: "Forward", number: "22", status: "available" },
                  ].map((player, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-4">
                          <AvatarFallback>{player.number}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <div className="flex items-center text-sm text-muted-foreground space-x-2">
                            <span>#{player.number}</span>
                            <span>•</span>
                            <span>{player.position}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          player.status === "available" ? "bg-green-100 text-green-800" :
                          player.status === "limited" ? "bg-amber-100 text-amber-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {player.status}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Development Goals</CardTitle>
              <CardDescription>Player improvement tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {developmentGoals.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{goal.player}</p>
                        <p className="text-sm text-muted-foreground">{goal.goal}</p>
                      </div>
                      <p className="font-medium">{goal.progress}%</p>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Goals
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
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
                Create Ice Session
              </Button>
              <Button variant="outline">View Training Library</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Training Sessions</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
                </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: "Today", type: "ice-training", title: "Ice Practice", focus: "Powerplay, zone entries", attendance: 20 },
                    { date: "Yesterday", type: "physical-training", title: "Gym Session", focus: "Upper body strength", attendance: 18 },
                    { date: "May 17", type: "ice-training", title: "Game Prep", focus: "Defensive zone coverage", attendance: 22 },
                    { date: "May 16", type: "physical-training", title: "Agility & Conditioning", focus: "Lateral movement", attendance: 21 },
                    { date: "May 15", type: "ice-training", title: "Skills Development", focus: "Passing and puck handling", attendance: 19 },
                  ].map((session, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className={`p-2 rounded-md ${
                        session.type === 'ice-training' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <Activity className={`h-4 w-4 ${
                          session.type === 'ice-training' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{session.title}</p>
                          <Badge variant="outline">{session.date}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Focus: {session.focus}</p>
                        <p className="text-sm text-muted-foreground">Attendance: {session.attendance} players</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Training</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: "Tomorrow", type: "ice-training", title: "Team Practice", focus: "Forechecking systems", status: "scheduled" },
                    { date: "May 21", type: "physical-training", title: "Team Gym", focus: "Core & lower body", status: "scheduled" },
                    { date: "May 22", type: "ice-training", title: "Pre-game Skate", focus: "Light tempo, special teams", status: "draft" },
                    { date: "May 24", type: "physical-training", title: "Recovery Session", focus: "Active recovery", status: "draft" },
                  ].map((session, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className={`p-2 rounded-md ${
                        session.type === 'ice-training' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <Activity className={`h-4 w-4 ${
                          session.type === 'ice-training' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{session.title}</p>
                          <Badge variant="outline">{session.date}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Focus: {session.focus}</p>
                        <div className="flex items-center mt-1">
                          <Badge 
                            className={session.status === 'scheduled' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}
                          >
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Training Calendar</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Training Template Library</CardTitle>
              <CardDescription>Your saved training templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Powerplay Setup", category: "Special Teams", sessions: 8, lastUsed: "2 days ago" },
                  { title: "Defensive Zone Coverage", category: "Defense", sessions: 12, lastUsed: "5 days ago" },
                  { title: "High-Tempo Conditioning", category: "Conditioning", sessions: 6, lastUsed: "1 week ago" },
                  { title: "Transition Game", category: "Systems", sessions: 10, lastUsed: "2 weeks ago" },
                  { title: "Shooting Accuracy", category: "Skills", sessions: 5, lastUsed: "3 weeks ago" },
                  { title: "Game Situation Drills", category: "Game Play", sessions: 9, lastUsed: "1 month ago" },
                ].map((template, index) => (
                  <Card key={index} className="border">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      <CardDescription>{template.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm">
                        <p>Used in {template.sessions} sessions</p>
                        <p className="text-muted-foreground">Last used: {template.lastUsed}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="games" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Game Management</h2>
            <Button variant="outline">Season Statistics</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Games</CardTitle>
                <CardDescription>Next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: "May 22", opponent: "Northern Knights", location: "Away", time: "19:00", status: "upcoming" },
                    { date: "May 25", opponent: "Ice Breakers", location: "Home", time: "18:30", status: "upcoming" },
                    { date: "June 1", opponent: "Polar Bears", location: "Away", time: "17:00", status: "upcoming" },
                    { date: "June 5", opponent: "Frosty Flyers", location: "Home", time: "19:30", status: "upcoming" },
                    { date: "June 8", opponent: "Mountain Hawks", location: "Home", time: "18:00", status: "upcoming" },
                  ].map((game, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{game.opponent}</p>
                            <div className="flex items-center text-sm text-muted-foreground space-x-2">
                              <span>{game.location}</span>
                              <span>•</span>
                              <span>{game.time}</span>
                            </div>
                          </div>
                          <Badge variant="outline">{game.date}</Badge>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Clipboard className="mr-2 h-4 w-4" />
                            Game Plan
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Video className="mr-2 h-4 w-4" />
                            Opponent Video
                          </Button>
                          <Button size="sm" className="flex-1">
                            <UserCheck className="mr-2 h-4 w-4" />
                            Roster
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
                <CardTitle>Game Results</CardTitle>
                <CardDescription>Recent games</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: "May 12", opponent: "Glacier Giants", result: "Win", score: "4-2" },
                    { date: "May 8", opponent: "Snow Leopards", result: "Loss", score: "1-3" },
                    { date: "May 5", opponent: "Ice Dragons", result: "Win", score: "5-3" },
                    { date: "May 1", opponent: "Winter Wolves", result: "Win", score: "3-1" },
                  ].map((game, index) => (
                    <div key={index} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{game.opponent}</p>
                        <Badge 
                          className={game.result === 'Win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {game.result}
                        </Badge>
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-sm text-muted-foreground">{game.date}</p>
                        <p className="text-sm">{game.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Results</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Analysis</CardTitle>
              <CardDescription>Key performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-60">
                  <h3 className="text-sm font-medium mb-2">Goals Distribution</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Even Strength', value: 42, color: '#3b82f6' },
                          { name: 'Power Play', value: 18, color: '#10b981' },
                          { name: 'Short Handed', value: 5, color: '#f97316' },
                          { name: 'Empty Net', value: 3, color: '#8b5cf6' },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[...Array(4)].map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f97316', '#8b5cf6'][index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-60">
                  <h3 className="text-sm font-medium mb-2">Shot Metrics</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Shots For', value: 342, fill: '#3b82f6' },
                        { name: 'Shots Against', value: 287, fill: '#ef4444' },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-60">
                  <h3 className="text-sm font-medium mb-2">Last 10 Games</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { game: 1, goalsFor: 4, goalsAgainst: 2 },
                        { game: 2, goalsFor: 1, goalsAgainst: 3 },
                        { game: 3, goalsFor: 5, goalsAgainst: 3 },
                        { game: 4, goalsFor: 3, goalsAgainst: 1 },
                        { game: 5, goalsFor: 2, goalsAgainst: 2 },
                        { game: 6, goalsFor: 4, goalsAgainst: 1 },
                        { game: 7, goalsFor: 1, goalsAgainst: 0 },
                        { game: 8, goalsFor: 3, goalsAgainst: 4 },
                        { game: 9, goalsFor: 2, goalsAgainst: 3 },
                        { game: 10, goalsFor: 5, goalsAgainst: 2 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="game" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="goalsFor" stroke="#3b82f6" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="goalsAgainst" stroke="#ef4444" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}