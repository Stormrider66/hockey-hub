import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Calendar, AlertCircle, ChevronRight, Package, ShoppingBag, 
  Scissors, Truck, FileText, Users, Search, Plus, Activity, Clock, Check,
  MapPin, Clipboard, ArrowLeft, ArrowRight
} from 'lucide-react';

export default function EquipmentManagerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTeam, setSelectedTeam] = useState("senior");
  
  // Mock data
  const teams = [
    { id: "senior", name: "Senior Team" },
    { id: "junior", name: "Junior A" },
    { id: "u16", name: "U16 Boys" }
  ];
  
  const inventoryAlerts = [
    { item: "Hockey Tape (White)", status: "Low Stock", remaining: 5, reorderLevel: 10 },
    { item: "Practice Pucks", status: "Low Stock", remaining: 12, reorderLevel: 20 },
    { item: "Game Jerseys (Away, Size L)", status: "Out of Stock", remaining: 0, reorderLevel: 5 }
  ];
  
  const upcomingEvents = [
    { date: "Today", title: "Home Game Preparation", team: "Senior Team", time: "16:00", notes: "Set up equipment 2 hours before game" },
    { date: "Tomorrow", title: "Equipment Maintenance", team: "All Teams", time: "10:00", notes: "Sharpen skates for Junior A team" },
    { date: "May 21", title: "Equipment Inventory", team: "All Teams", time: "09:00", notes: "Monthly stock check" },
    { date: "May 23", title: "Away Game Preparation", team: "Junior A", time: "14:00", notes: "Pack travel gear bags" }
  ];
  
  const maintenanceSchedule = [
    { item: "Skate Sharpening", frequency: "Weekly", lastDone: "May 15", nextDue: "May 22", team: "Senior Team" },
    { item: "Helmet Inspection", frequency: "Monthly", lastDone: "May 1", nextDue: "June 1", team: "All Teams" },
    { item: "Washing Jerseys", frequency: "After Games", lastDone: "May 16", nextDue: "May 19", team: "Senior Team" },
    { item: "Stick Blade Replacement", frequency: "As Needed", lastDone: "May 10", nextDue: "Ongoing", team: "Various" }
  ];
  
  const inventoryItems = [
    { category: "Game Equipment", items: [
      { name: "Game Jerseys (Home)", stock: 25, total: 25 },
      { name: "Game Jerseys (Away)", stock: 22, total: 25 },
      { name: "Game Socks (Home)", stock: 28, total: 30 },
      { name: "Game Socks (Away)", stock: 26, total: 30 }
    ]},
    { category: "Practice Equipment", items: [
      { name: "Practice Jerseys", stock: 35, total: 40 },
      { name: "Practice Socks", stock: 32, total: 40 },
      { name: "Pucks", stock: 80, total: 150 },
      { name: "Cones", stock: 45, total: 50 }
    ]},
    { category: "Consumables", items: [
      { name: "Hockey Tape (White)", stock: 5, total: 30 },
      { name: "Hockey Tape (Black)", stock: 12, total: 30 },
      { name: "Stick Wax", stock: 8, total: 15 },
      { name: "First Aid Supplies", stock: 4, total: 10 }
    ]},
  ];

  const playerEquipment = [
    { player: "Erik Johansson", number: "10", items: [
      { name: "Home Jersey #10", issued: "Sept 1, 2024", condition: "Good" },
      { name: "Away Jersey #10", issued: "Sept 1, 2024", condition: "Good" },
      { name: "Practice Jersey", issued: "Sept 1, 2024", condition: "Fair" }
    ]},
    { player: "Johan Berg", number: "5", items: [
      { name: "Home Jersey #5", issued: "Sept 1, 2024", condition: "Good" },
      { name: "Away Jersey #5", issued: "Sept 1, 2024", condition: "Good" },
      { name: "Practice Jersey", issued: "Sept 1, 2024", condition: "Good" }
    ]},
    { player: "Maria Andersson", number: "21", items: [
      { name: "Home Jersey #21", issued: "Sept 1, 2024", condition: "Good" },
      { name: "Away Jersey #21", issued: "Sept 1, 2024", condition: "Fair" },
      { name: "Practice Jersey", issued: "Sept 1, 2024", condition: "Poor" }
    ]},
  ];

  const maintenanceTasks = [
    { type: "Skate Sharpening", equipment: "Player Skates", assignedTo: "You", deadline: "May 19", priority: "High", notes: "Sharpen skates before game" },
    { type: "Equipment Repair", equipment: "Goalkeeper Glove", assignedTo: "You", deadline: "May 20", priority: "Medium", notes: "Repair stitching on palm" },
    { type: "General Maintenance", equipment: "Helmets", assignedTo: "Anna Lindström", deadline: "May 22", priority: "Low", notes: "Check all screws and straps" },
    { type: "Equipment Cleaning", equipment: "Game Jerseys", assignedTo: "You", deadline: "May 19", priority: "High", notes: "Wash after today's game" }
  ];

  // Mock data for Game Day tab
  const gameDayChecklist = [
    { task: "Pack game jerseys", completed: true },
    { task: "Pack extra socks and jerseys", completed: true },
    { task: "Prepare water bottles", completed: false },
    { task: "Pack medical kit", completed: false },
    { task: "Load equipment to transport", completed: false },
    { task: "Check stick inventory", completed: true },
    { task: "Prepare coach's equipment", completed: false }
  ];

  const upcomingGames = [
    { opponent: "Tigers HC", date: "May 19, 2025", location: "Home", time: "19:00", preparationStatus: 70 },
    { opponent: "Lions HC", date: "May 23, 2025", location: "Away", time: "18:30", preparationStatus: 20 },
    { opponent: "Eagles HC", date: "May 30, 2025", location: "Home", time: "19:00", preparationStatus: 10 }
  ];

  // Event handlers
  const toggleTaskStatus = (index) => {
    // In a real implementation, this would update state
    console.log(`Toggling task ${index}`);
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Equipment Manager Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select 
            className="border rounded p-1"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="gameday">Game Day</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Inventory Alerts</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className="p-2 bg-red-100 rounded-md">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{alert.item}</p>
                          <Badge className={
                            alert.remaining === 0 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }>{alert.status}</Badge>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm">
                            <span>{alert.remaining} remaining (Reorder level: {alert.reorderLevel})</span>
                            <span>{Math.round((alert.remaining / alert.reorderLevel) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(alert.remaining / alert.reorderLevel) * 100}
                            className="h-2 mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full justify-start">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Create Order
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Scissors className="mr-2 h-4 w-4" />
                    Record Maintenance
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="mr-2 h-4 w-4" />
                    Check Out Equipment
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Truck className="mr-2 h-4 w-4" />
                    Prepare Travel Gear
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Equipment preparation needed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{event.title}</p>
                        <Badge variant="outline">{event.date}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                        <span>{event.time}</span>
                        <span>•</span>
                        <span>{event.team}</span>
                      </div>
                      {event.notes && (
                        <p className="mt-1 text-sm">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Due</CardTitle>
              <CardDescription>Upcoming maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceSchedule.map((task, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className="p-2 bg-green-100 rounded-md">
                      <Scissors className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{task.item}</p>
                        <p className="text-sm">{task.frequency}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        <div>
                          <span className="text-muted-foreground">Last done:</span> {task.lastDone}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next due:</span> {task.nextDue}
                        </div>
                      </div>
                      <p className="text-sm mt-1">Team: {task.team}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Maintenance Schedule</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Inventory Management</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search inventory..." className="pl-8 w-60" />
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            {inventoryItems.map((category, catIndex) => (
              <Card key={catIndex}>
                <CardHeader>
                  <CardTitle>{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                            <span>{item.stock} of {item.total} in stock</span>
                            <Badge className={
                              (item.stock / item.total) < 0.1 ? "bg-red-100 text-red-800" :
                              (item.stock / item.total) < 0.3 ? "bg-amber-100 text-amber-800" :
                              "bg-green-100 text-green-800"
                            }>
                              {Math.round((item.stock / item.total) * 100)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Player Equipment Assignments</CardTitle>
              <CardDescription>Senior Team - Equipment issued to players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {playerEquipment.map((player, playerIndex) => (
                  <div key={playerIndex} className="space-y-3 border-b pb-3 last:border-0">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-4">
                        <AvatarFallback>{player.number}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{player.player}</p>
                        <p className="text-sm text-muted-foreground">#{player.number}</p>
                      </div>
                    </div>
                    <div className="pl-14">
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs text-muted-foreground">
                          <tr>
                            <th className="py-1">Item</th>
                            <th className="py-1">Issued</th>
                            <th className="py-1">Condition</th>
                            <th className="py-1"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {player.items.map((item, itemIndex) => (
                            <tr key={itemIndex}>
                              <td className="py-1">{item.name}</td>
                              <td className="py-1">{item.issued}</td>
                              <td className="py-1">
                                <Badge className={
                                  item.condition === "Good" ? "bg-green-100 text-green-800" :
                                  item.condition === "Fair" ? "bg-amber-100 text-amber-800" :
                                  "bg-red-100 text-red-800"
                                }>
                                  {item.condition}
                                </Badge>
                              </td>
                              <td className="py-1 text-right">
                                <Button size="sm" variant="ghost">Details</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button>Manage Equipment Assignments</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Equipment Maintenance</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Maintenance Task
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Maintenance Tasks</CardTitle>
              <CardDescription>Current and upcoming maintenance work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceTasks.map((task, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className={`p-2 rounded-md ${
                      task.priority === "High" ? "bg-red-100" :
                      task.priority === "Medium" ? "bg-amber-100" :
                      "bg-blue-100"
                    }`}>
                      <Scissors className={`h-4 w-4 ${
                        task.priority === "High" ? "text-red-600" :
                        task.priority === "Medium" ? "text-amber-600" :
                        "text-blue-600"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{task.type}</p>
                          <p className="text-sm">{task.equipment}</p>
                        </div>
                        <Badge className={
                          task.priority === "High" ? "bg-red-100 text-red-800" :
                          task.priority === "Medium" ? "bg-amber-100 text-amber-800" :
                          "bg-blue-100 text-blue-800"
                        }>
                          {task.priority} Priority
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                        <div>
                          <span className="text-muted-foreground">Assigned to:</span> {task.assignedTo}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Deadline:</span> {task.deadline}
                        </div>
                      </div>
                      {task.notes && (
                        <p className="mt-2 text-sm">{task.notes}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline">Complete</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription>Recurring maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {maintenanceSchedule.map((task, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="flex justify-between">
                        <p className="font-medium">{task.item}</p>
                        <Badge variant="outline">{task.frequency}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Next due: {task.nextDue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Equipment Inspection Reports</CardTitle>
                <CardDescription>Recent inspection results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "Helmet Inspection", date: "May 1, 2025", items: 25, issues: 2 },
                    { type: "Protective Gear", date: "April 15, 2025", items: 40, issues: 5 },
                    { type: "Skate Inspection", date: "April 10, 2025", items: 22, issues: 3 },
                  ].map((report, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="flex justify-between">
                        <p className="font-medium">{report.type}</p>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                      <div className="flex justify-between mt-1 text-sm">
                        <span>{report.items} items inspected</span>
                        <Badge className={report.issues > 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}>
                          {report.issues > 0 ? `${report.issues} issues found` : "No issues"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Reports</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="gameday" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Next Game: Tigers HC</CardTitle>
                    <CardDescription>May 19, 2025 - 19:00 - Home Game</CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Tonight</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium mb-2">Game Day Checklist</h3>
                    <div className="space-y-2">
                      {gameDayChecklist.map((item, index) => (
                        <div 
                          key={index} 
                          className={`p-3 border rounded-md flex items-center ${item.completed ? 'bg-gray-50' : ''}`}
                          onClick={() => toggleTaskStatus(index)}
                        >
                          <div className={`h-5 w-5 border rounded-sm mr-3 flex items-center justify-center ${
                            item.completed ? 'bg-primary border-primary' : 'border-gray-300'
                          }`}>
                            {item.completed && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                            {item.task}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">Game Day Notes</h3>
                    <div className="border rounded-md p-4">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Location Details</p>
                            <p className="text-sm">Skellefteå Kraft Arena - Main Rink</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Schedule</p>
                            <p className="text-sm">Equipment setup: 17:00</p>
                            <p className="text-sm">Team arrival: 17:30</p>
                            <p className="text-sm">Warmup: 18:30</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Clipboard className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Special Requirements</p>
                            <p className="text-sm">Prepare ceremonial puck for team captain</p>
                            <p className="text-sm">Set up extra water bottles for penalty box</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Print Checklist
                  </Button>
                  <Button>
                    <Check className="mr-2 h-4 w-4" />
                    Mark All Complete
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Games</CardTitle>
                <CardDescription>Preparation status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingGames.map((game, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between">
                        <p className="font-medium">{game.opponent}</p>
                        <Badge className={
                          game.location === "Home" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }>
                          {game.location}
                        </Badge>
                        <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{game.date} at {game.time}</span>
                          <span>Preparation: {game.preparationStatus}%</span>
                        </div>
                        <Progress value={game.preparationStatus} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Full Schedule</Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Travel Equipment</CardTitle>
                <CardDescription>For upcoming away games</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { game: "Lions HC - May 23", status: "Not Started", items: 35, packed: 0 },
                    { game: "Wolves HC - June 2", status: "Not Started", items: 35, packed: 0 },
                  ].map((trip, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{trip.game}</p>
                        <Badge className="bg-amber-100 text-amber-800">{trip.status}</Badge>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{trip.packed} of {trip.items} items packed</span>
                          <span>{Math.round((trip.packed / trip.items) * 100)}%</span>
                        </div>
                        <Progress value={(trip.packed / trip.items) * 100} className="h-2" />
                      </div>
                      <div className="mt-3">
                        <Button size="sm" variant="outline" className="w-full">
                          <Truck className="mr-2 h-4 w-4" />
                          Start Packing
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Special Requests</CardTitle>
                <CardDescription>Equipment requests from coaches and players</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { from: "Erik Johansson", request: "New stick blade - CCM P28", status: "Pending", date: "May 18" },
                    { from: "Coach Nilsson", request: "Extra practice pucks for morning skate", status: "Completed", date: "May 17" },
                    { from: "Maria Andersson", request: "Replacement laces for skates", status: "Pending", date: "May 16" },
                  ].map((request, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between">
                        <p className="font-medium">{request.from}</p>
                        <Badge className={
                          request.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1">{request.request}</p>
                      <p className="text-xs text-muted-foreground mt-1">Requested on {request.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Requests</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Game Day Equipment Preparation Guide</CardTitle>
              <CardDescription>Standard procedures for home and away games</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-green-100 rounded-md">
                    <Package className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Home Game Preparation Timeline</h3>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span><strong>4 hours before game</strong>: Begin equipment room setup</span>
                      </li>
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span><strong>3 hours before game</strong>: Check all jerseys and equipment</span>
                      </li>
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span><strong>2 hours before game</strong>: Set up locker room</span>
                      </li>
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span><strong>1 hour before game</strong>: Prepare bench area and ice access</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Away Game Preparation Timeline</h3>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span><strong>Day before game</strong>: Pack all equipment and verify inventory</span>
                      </li>
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span><strong>5 hours before game</strong>: Load transport vehicle</span>
                      </li>
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span><strong>3 hours before game</strong>: Arrive at away venue</span>
                      </li>
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span><strong>2 hours before game</strong>: Set up visitor locker room</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                View Detailed Guides
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Calendar, AlertCircle, ChevronRight, Package, ShoppingBag, 
  Scissors, Truck, FileText, Users, Search, Plus, Activity, Clock, Check,
  MapPin, Clipboard, ArrowLeft, ArrowRight
} from 'lucide-react';

export default function EquipmentManagerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTeam, setSelectedTeam] = useState("senior");
  
  // Mock data
  const teams = [
    { id: "senior", name: "Senior Team" },
    { id: "junior", name: "Junior A" },
    { id: "u16", name: "U16 Boys" }
  ];
  
  const inventoryAlerts = [
    { item: "Hockey Tape (White)", status: "Low Stock", remaining: 5, reorderLevel: 10 },
    { item: "Practice Pucks", status: "Low Stock", remaining: 12, reorderLevel: 20 },
    { item: "Game Jerseys (Away, Size L)", status: "Out of Stock", remaining: 0, reorderLevel: 5 }
  ];
  
  const upcomingEvents = [
    { date: "Today", title: "Home Game Preparation", team: "Senior Team", time: "16:00", notes: "Set up equipment 2 hours before game" },
    { date: "Tomorrow", title: "Equipment Maintenance", team: "All Teams", time: "10:00", notes: "Sharpen skates for Junior A team" },
    { date: "May 21", title: "Equipment Inventory", team: "All Teams", time: "09:00", notes: "Monthly stock check" },
    { date: "May 23", title: "Away Game Preparation", team: "Junior A", time: "14:00", notes: "Pack travel gear bags" }
  ];
  
  const maintenanceSchedule = [
    { item: "Skate Sharpening", frequency: "Weekly", lastDone: "May 15", nextDue: "May 22", team: "Senior Team" },
    { item: "Helmet Inspection", frequency: "Monthly", lastDone: "May 1", nextDue: "June 1", team: "All Teams" },
    { item: "Washing Jerseys", frequency: "After Games", lastDone: "May 16", nextDue: "May 19", team: "Senior Team" },
    { item: "Stick Blade Replacement", frequency: "As Needed", lastDone: "May 10", nextDue: "Ongoing", team: "Various" }
  ];
  
  const inventoryItems = [
    { category: "Game Equipment", items: [
      { name: "Game Jerseys (Home)", stock: 25, total: 25 },
      { name: "Game Jerseys (Away)", stock: 22, total: 25 },
      { name: "Game Socks (Home)", stock: 28, total: 30 },
      { name: "Game Socks (Away)", stock: 26, total: 30 }
    ]},
    { category: "Practice Equipment", items: [
      { name: "Practice Jerseys", stock: 35, total: 40 },
      { name: "Practice Socks", stock: 32, total: 40 },
      { name: "Pucks", stock: 80, total: 150 },
      { name: "Cones", stock: 45, total: 50 }
    ]},
    { category: "Consumables", items: [
      { name: "Hockey Tape (White)", stock: 5, total: 30 },
      { name: "Hockey Tape (Black)", stock: 12, total: 30 },
      { name: "Stick Wax", stock: 8, total: 15 },
      { name: "First Aid Supplies", stock: 4, total: 10 }
    ]},
  ];

  const playerEquipment = [
    { player: "Erik Johansson", number: "10", items: [
      { name: "Home Jersey #10", issued: "Sept 1, 2024", condition: "Good" },
      { name: "Away Jersey #10", issued: "Sept 1, 2024", condition: "Good" },
      { name: "Practice Jersey", issued: "Sept 1, 2024", condition: "Fair" }
    ]},
    { player: "Johan Berg", number: "5", items: [
      { name: "Home Jersey #5", issued: "Sept 1, 2024", condition: "Good" },
      { name: "Away Jersey #5", issued: "Sept 1, 2024", condition: "Good" },
      { name: "Practice Jersey", issued: "Sept 1, 2024", condition: "Good" }
    ]},
    { player: "Maria Andersson", number: "21", items: [
      { name: "Home Jersey #21", issued: "Sept 1, 2024", condition: "Good" },
      { name: "Away Jersey #21", issued: "Sept 1, 2024", condition: "Fair" },
      { name: "Practice Jersey", issued: "Sept 1, 2024", condition: "Poor" }
    ]},
  ];

  const maintenanceTasks = [
    { type: "Skate Sharpening", equipment: "Player Skates", assignedTo: "You", deadline: "May 19", priority: "High", notes: "Sharpen skates before game" },
    { type: "Equipment Repair", equipment: "Goalkeeper Glove", assignedTo: "You", deadline: "May 20", priority: "Medium", notes: "Repair stitching on palm" },
    { type: "General Maintenance", equipment: "Helmets", assignedTo: "Anna Lindström", deadline: "May 22", priority: "Low", notes: "Check all screws and straps" },
    { type: "Equipment Cleaning", equipment: "Game Jerseys", assignedTo: "You", deadline: "May 19", priority: "High", notes: "Wash after today's game" }
  ];

  // Mock data for Game Day tab
  const gameDayChecklist = [
    { task: "Pack game jerseys", completed: true },
    { task: "Pack extra socks and jerseys", completed: true },
    { task: "Prepare water bottles", completed: false },
    { task: "Pack medical kit", completed: false },
    { task: "Load equipment to transport", completed: false },
    { task: "Check stick inventory", completed: true },
    { task: "Prepare coach's equipment", completed: false }
  ];

  const upcomingGames = [
    { opponent: "Tigers HC", date: "May 19, 2025", location: "Home", time: "19:00", preparationStatus: 70 },
    { opponent: "Lions HC", date: "May 23, 2025", location: "Away", time: "18:30", preparationStatus: 20 },
    { opponent: "Eagles HC", date: "May 30, 2025", location: "Home", time: "19:00", preparationStatus: 10 }
  ];

  // Event handlers
  const toggleTaskStatus = (index) => {
    // In a real implementation, this would update state
    console.log(`Toggling task ${index}`);
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Equipment Manager Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select 
            className="border rounded p-1"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="gameday">Game Day</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Inventory Alerts</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className="p-2 bg-red-100 rounded-md">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{alert.item}</p>
                          <Badge className={
                            alert.remaining === 0 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }>{alert.status}</Badge>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm">
                            <span>{alert.remaining} remaining (Reorder level: {alert.reorderLevel})</span>
                            <span>{Math.round((alert.remaining / alert.reorderLevel) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(alert.remaining / alert.reorderLevel) * 100}
                            className="h-2 mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full justify-start">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Create Order
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Scissors className="mr-2 h-4 w-4" />
                    Record Maintenance
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="mr-2 h-4 w-4" />
                    Check Out Equipment
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Truck className="mr-2 h-4 w-4" />
                    Prepare Travel Gear
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Equipment preparation needed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{event.title}</p>
                        <Badge variant="outline">{event.date}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                        <span>{event.time}</span>
                        <span>•</span>
                        <span>{event.team}</span>
                      </div>
                      {event.notes && (
                        <p className="mt-1 text-sm">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Due</CardTitle>
              <CardDescription>Upcoming maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceSchedule.map((task, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className="p-2 bg-green-100 rounded-md">
                      <Scissors className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{task.item}</p>
                        <p className="text-sm">{task.frequency}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
                        <div>
                          <span className="text-muted-foreground">Last done:</span> {task.lastDone}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next due:</span> {task.nextDue}
                        </div>
                      </div>
                      <p className="text-sm mt-1">Team: {task.team}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Maintenance Schedule</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Inventory Management</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search inventory..." className="pl-8 w-60" />
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            {inventoryItems.map((category, catIndex) => (
              <Card key={catIndex}>
                <CardHeader>
                  <CardTitle>{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                            <span>{item.stock} of {item.total} in stock</span>
                            <Badge className={
                              (item.stock / item.total) < 0.1 ? "bg-red-100 text-red-800" :
                              (item.stock / item.total) < 0.3 ? "bg-amber-100 text-amber-800" :
                              "bg-green-100 text-green-800"
                            }>
                              {Math.round((item.stock / item.total) * 100)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Player Equipment Assignments</CardTitle>
              <CardDescription>Senior Team - Equipment issued to players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {playerEquipment.map((player, playerIndex) => (
                  <div key={playerIndex} className="space-y-3 border-b pb-3 last:border-0">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-4">
                        <AvatarFallback>{player.number}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{player.player}</p>
                        <p className="text-sm text-muted-foreground">#{player.number}</p>
                      </div>
                    </div>
                    <div className="pl-14">
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs text-muted-foreground">
                          <tr>
                            <th className="py-1">Item</th>
                            <th className="py-1">Issued</th>
                            <th className="py-1">Condition</th>
                            <th className="py-1"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {player.items.map((item, itemIndex) => (
                            <tr key={itemIndex}>
                              <td className="py-1">{item.name}</td>
                              <td className="py-1">{item.issued}</td>
                              <td className="py-1">
                                <Badge className={
                                  item.condition === "Good" ? "bg-green-100 text-green-800" :
                                  item.condition === "Fair" ? "bg-amber-100 text-amber-800" :
                                  "bg-red-100 text-red-800"
                                }>
                                  {item.condition}
                                </Badge>
                              </td>
                              <td className="py-1 text-right">
                                <Button size="sm" variant="ghost">Details</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button>Manage Equipment Assignments</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Equipment Maintenance</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Maintenance Task
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Maintenance Tasks</CardTitle>
              <CardDescription>Current and upcoming maintenance work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceTasks.map((task, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className={`p-2 rounded-md ${
                      task.priority === "High" ? "bg-red-100" :
                      task.priority === "Medium" ? "bg-amber-100" :
                      "bg-blue-100"
                    }`}>
                      <Scissors className={`h-4 w-4 ${
                        task.priority === "High" ? "text-red-600" :
                        task.priority === "Medium" ? "text-amber-600" :
                        "text-blue-600"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{task.type}</p>
                          <p className="text-sm">{task.equipment}</p>
                        </div>
                        <Badge className={
                          task.priority === "High" ? "bg-red-100 text-red-800" :
                          task.priority === "Medium" ? "bg-amber-100 text-amber-800" :
                          "bg-blue-100 text-blue-800"
                        }>
                          {task.priority} Priority
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                        <div>
                          <span className="text-muted-foreground">Assigned to:</span> {task.assignedTo}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Deadline:</span> {task.deadline}
                        </div>
                      </div>
                      {task.notes && (
                        <p className="mt-2 text-sm">{task.notes}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline">Complete</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription>Recurring maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {maintenanceSchedule.map((task, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="flex justify-between">
                        <p className="font-medium">{task.item}</p>
                        <Badge variant="outline">{task.frequency}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Next due: {task.nextDue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Equipment Inspection Reports</CardTitle>
                <CardDescription>Recent inspection results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "Helmet Inspection", date: "May 1, 2025", items: 25, issues: 2 },
                    { type: "Protective Gear", date: "April 15, 2025", items: 40, issues: 5 },
                    { type: "Skate Inspection", date: "April 10, 2025", items: 22, issues: 3 },
                  ].map((report, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="flex justify-between">
                        <p className="font-medium">{report.type}</p>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                      <div className="flex justify-between mt-1 text-sm">
                        <span>{report.items} items inspected</span>
                        <Badge className={report.issues > 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}>
                          {report.issues > 0 ? `${report.issues} issues found` : "No issues"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Reports</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="gameday" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Next Game: Tigers HC</CardTitle>
                    <CardDescription>May 19, 2025 - 19:00 - Home Game</CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Tonight</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium mb-2">Game Day Checklist</h3>
                    <div className="space-y-2">
                      {gameDayChecklist.map((item, index) => (
                        <div 
                          key={index} 
                          className={`p-3 border rounded-md flex items-center ${item.completed ? 'bg-gray-50' : ''}`}
                          onClick={() => toggleTaskStatus(index)}
                        >
                          <div className={`h-5 w-5 border rounded-sm mr-3 flex items-center justify-center ${
                            item.completed ? 'bg-primary border-primary' : 'border-gray-300'
                          }`}>
                            {item.completed && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                            {item.task}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">Game Day Notes</h3>
                    <div className="border rounded-md p-4">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Location Details</p>
                            <p className="text-sm">Skellefteå Kraft Arena - Main Rink</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Schedule</p>
                            <p className="text-sm">Equipment setup: 17:00</p>
                            <p className="text-sm">Team arrival: 17:30</p>
                            <p className="text-sm">Warmup: 18:30</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Clipboard className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Special Requirements</p>
                            <p className="text-sm">Prepare ceremonial puck for team captain</p>
                            <p className="text-sm">Set up extra water bottles for penalty box</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Print Checklist
                  </Button>
                  <Button>
                    <Check className="mr-2 h-4 w-4" />
                    Mark All Complete
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Games</CardTitle>
                <CardDescription>Preparation status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingGames.map((game, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between">
                        <p className="font-medium">{game.opponent}</p>
                        <Badge className={
                          game.location === "Home" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }>
                          {game.location}
                        </Badge>