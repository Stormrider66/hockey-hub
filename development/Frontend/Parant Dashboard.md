import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, MessageCircle, AlertCircle, Check, ChevronRight, Map, Clock,
  UserCheck, UserX, Phone, Mail, FileText, Info
} from 'lucide-react';

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeChild, setActiveChild] = useState("child1");
  
  // Mock data
  const childrenData = [
    { id: "child1", name: "Emma Johansson", team: "U14 Girls", age: 13, position: "Forward", number: "15" },
    { id: "child2", name: "Victor Johansson", team: "U12 Mixed", age: 11, position: "Defense", number: "4" }
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
    { title: "End of Season Party", date: "May 18", content: "We will have our end of season celebration on June 15. More details to follow." },
    { title: "Team Photos Next Week", date: "May 16", content: "Team photos will be taken next Thursday before practice. Please arrive 30 minutes early." },
    { title: "Away Game Transportation", date: "May 15", content: "For the away game against Northern Knights, the bus will leave from the arena at 15:30." }
  ];
  
  // Mock absences
  const reportedAbsences = [
    { reason: "Family Vacation", dates: "June 1 - June 8", status: "Approved" }
  ];
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your child's hockey activities</p>
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
      
      <div className="flex items-center space-x-4 bg-muted/40 p-4 rounded-lg">
        <Avatar className="h-16 w-16">
          <AvatarFallback>{selectedChild.number}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{selectedChild.name}</h2>
          <div className="flex items-center space-x-2 mt-1">
            <Badge>{selectedChild.team}</Badge>
            <Badge variant="outline">{selectedChild.position}</Badge>
            <Badge variant="outline">#{selectedChild.number}</Badge>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="absences">Absences</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>For {selectedChild.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className={`p-2 rounded-md ${
                        event.type === 'ice-training' ? 'bg-blue-100' :
                        event.type === 'physical-training' ? 'bg-green-100' :
                        'bg-red-100'
                      }`}>
                        <Calendar className={`h-4 w-4 ${
                          event.type === 'ice-training' ? 'text-blue-600' :
                          event.type === 'physical-training' ? 'text-green-600' :
                          'text-red-600'
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
                <Button variant="outline" className="w-full">View Full Calendar</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full justify-start">
                    <UserX className="mr-2 h-4 w-4" />
                    Report Absence
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message Coach
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Schedule
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    View Team Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Team Announcements</CardTitle>
              <CardDescription>From {selectedChild.team}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamAnnouncements.map((announcement, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
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
          
          <Card>
            <CardHeader>
              <CardTitle>Equipment Checklist</CardTitle>
              <CardDescription>Required for next events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h3 className="font-medium">Ice Practice (Today)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Full equipment", "Practice jersey", "Water bottle", "Towel", 
                    "Tape", "Extra socks", "Off-ice shoes", "Shower supplies"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="h-5 w-5 rounded border flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium">Home Game vs Ice Breakers (May 23)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {[
                      "Full equipment", "Game jersey", "Game socks", "Water bottle", 
                      "Pre-game snack", "Towel", "Extra tape", "Shower supplies"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="h-5 w-5 rounded border flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Schedule for {selectedChild.name}</h2>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Sync to Calendar
              </Button>
              <Button variant="outline">
                <Map className="mr-2 h-4 w-4" />
                Locations
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
                                  <div className={`p-2 rounded-md ${
                                    event.type === 'ice-training' ? 'bg-blue-100' :
                                    event.type === 'physical-training' ? 'bg-green-100' :
                                    'bg-red-100'
                                  }`}>
                                    <Calendar className={`h-4 w-4 ${
                                      event.type === 'ice-training' ? 'text-blue-600' :
                                      event.type === 'physical-training' ? 'text-green-600' :
                                      'text-red-600'
                                    }`} />
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
          
          <Card>
            <CardHeader>
              <CardTitle>Game Schedule</CardTitle>
              <CardDescription>Upcoming games for {selectedChild.team}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { opponent: "Ice Breakers", date: "May 23", time: "18:00", location: "Home - Main Rink", uniform: "Blue" },
                  { opponent: "Northern Knights", date: "May 25", time: "17:00", location: "Away - Knights Arena", uniform: "White" },
                  { opponent: "Polar Bears", date: "June 1", time: "17:00", location: "Away - Polar Bears Arena", uniform: "White" },
                  { opponent: "Winter Wolves", date: "June 8", time: "16:00", location: "Home - Main Rink", uniform: "Blue" },
                ].map((game, index) => (
                  <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                    <div className="p-2 bg-red-100 rounded-md">
                      <Calendar className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">vs {game.opponent}</p>
                        <Badge variant="outline">{game.date}</Badge>
                      </div>
                      <div className="grid grid-cols-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{game.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Map className="h-3 w-3" />
                          <span>{game.location}</span>
                        </div>
                      </div>
                      <p className="text-sm mt-1">Uniform: {game.uniform}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="absences" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Absences</h2>
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
              <div className="space-y-4">
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
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Reported Absences</CardTitle>
              <CardDescription>Previous and upcoming absences</CardDescription>
            </CardHeader>
            <CardContent>
              {reportedAbsences.length > 0 ? (
                <div className="space-y-4">
                  {reportedAbsences.map((absence, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                      <div className="p-2 bg-amber-100 rounded-md">
                        <UserX className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{absence.reason}</p>
                          <Badge className="bg-green-100 text-green-800">{absence.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Dates: {absence.dates}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-
) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="p-3 bg-slate-100 rounded-full mb-4">
                    <Calendar className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium">No Reported Absences</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Any absences you report will appear here
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                <p className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
                  Please report absences at least 24 hours in advance when possible.
                </p>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Attendance Policy</CardTitle>
              <CardDescription>{selectedChild.team} attendance requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">
                  Regular attendance at training sessions and games is important for player development and team cohesion. 
                  Please familiarize yourself with the attendance policy below:
                </p>
                
                <div className="space-y-3">
                  <div className="p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Practice Sessions</h3>
                    <ul className="text-sm space-y-1 ml-5 list-disc">
                      <li>Players are expected to attend all scheduled practice sessions</li>
                      <li>A minimum attendance rate of 80% is required for all players</li>
                      <li>Absences should be reported at least 24 hours in advance</li>
                      <li>Three consecutive unexcused absences may result in reduced game time</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Games</h3>
                    <ul className="text-sm space-y-1 ml-5 list-disc">
                      <li>Players are expected to attend all scheduled games</li>
                      <li>Absences from games must be reported as soon as possible</li>
                      <li>For away games, players should arrive at the specified meeting point on time</li>
                      <li>Repeated game absences may affect team placement for tournaments</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Excused Absences</h3>
                    <ul className="text-sm space-y-1 ml-5 list-disc">
                      <li>Illness or injury</li>
                      <li>Important school commitments</li>
                      <li>Family emergencies</li>
                      <li>Pre-planned family vacations (with advance notice)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Contacts</CardTitle>
              <CardDescription>Key contacts for {selectedChild.team}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Coaching Staff</h3>
                  <div className="space-y-4">
                    {[
                      { name: "Erik Svensson", role: "Head Coach", phone: "+46 70 123 4567", email: "erik.svensson@hockeyapp.com" },
                      { name: "Anna Nilsson", role: "Assistant Coach", phone: "+46 70 234 5678", email: "anna.nilsson@hockeyapp.com" },
                      { name: "Johan Berg", role: "Assistant Coach", phone: "+46 70 345 6789", email: "johan.berg@hockeyapp.com" },
                    ].map((contact, index) => (
                      <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{contact.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-muted-foreground">{contact.role}</p>
                            </div>
                            <Button size="sm" variant="ghost">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-2 text-sm">
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span>{contact.phone}</span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span>{contact.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Support Staff</h3>
                  <div className="space-y-4">
                    {[
                      { name: "Maria Andersson", role: "Team Manager", phone: "+46 70 456 7890", email: "maria.andersson@hockeyapp.com" },
                      { name: "Lars Johansson", role: "Equipment Manager", phone: "+46 70 567 8901", email: "lars.johansson@hockeyapp.com" },
                    ].map((contact, index) => (
                      <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{contact.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-muted-foreground">{contact.role}</p>
                            </div>
                            <Button size="sm" variant="ghost">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-2 text-sm">
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span>{contact.phone}</span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span>{contact.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Team</CardTitle>
                <CardDescription>Send a message to the coaching staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input placeholder="Enter message subject" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea placeholder="Type your message here..." rows={5} />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="urgent" className="h-4 w-4 rounded border-gray-300" />
                    <label htmlFor="urgent" className="text-sm">Mark as urgent</label>
                  </div>
                  
                  <Button className="w-full">Send Message</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Team Information</CardTitle>
                <CardDescription>{selectedChild.team} details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Practice Schedule</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monday:</span>
                        <span>16:30 - 18:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>Main Rink</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Thursday:</span>
                        <span>16:30 - 18:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>Main Rink</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Team Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age Group:</span>
                        <span>U14</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Season:</span>
                        <span>2024-2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Players:</span>
                        <span>18</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">League:</span>
                        <span>Regional Youth</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <h3 className="font-medium text-amber-800 mb-2">Parent Meeting</h3>
                    <p className="text-sm text-amber-700">
                      Next parent meeting: May 25, 2025 at 18:30 in the conference room.
                      Topics: End of season tournament and summer training program.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Download Team Information</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Parent Resources</CardTitle>
              <CardDescription>Helpful information for hockey parents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Club Handbook", description: "Complete guide to club policies, procedures, and expectations", icon: FileText },
                  { title: "Equipment Guide", description: "Information about required equipment and maintenance", icon: Clipboard },
                  { title: "Travel Guidelines", description: "Procedures for away games and tournaments", icon: Map },
                  { title: "Development Path", description: "Understanding player development stages", icon: TrendingUp },
                  { title: "Nutrition Guide", description: "Healthy eating for young athletes", icon: AlertCircle },
                  { title: "Parent Code of Conduct", description: "Expectations for parents at games and events", icon: UserCheck },
                ].map((resource, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <resource.icon className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-medium">{resource.title}</h3>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Resource
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}