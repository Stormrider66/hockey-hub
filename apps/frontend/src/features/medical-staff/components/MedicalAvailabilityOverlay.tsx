"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, Clock, Calendar, MapPin, 
  UserCheck, UserX, AlertCircle, ChevronRight,
  Building, Stethoscope, Activity, Brain,
  Home, Car, Video, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  status: 'available' | 'busy' | 'break' | 'off-duty';
  currentActivity?: string;
  nextAvailable?: string;
  todayCapacity: number;
  bookedSlots: number;
}

interface MedicalRoom {
  id: string;
  name: string;
  type: 'treatment' | 'exam' | 'testing' | 'therapy';
  status: 'available' | 'occupied' | 'maintenance';
  currentPatient?: string;
  nextAvailable?: string;
  equipment: string[];
  capacity: number;
}

export function MedicalAvailabilityOverlay() {
  const [activeTab, setActiveTab] = useState("staff");

  // Mock data - would come from API
  const staffMembers: StaffMember[] = [
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      role: "Team Physician",
      specialty: "Sports Medicine",
      status: "available",
      todayCapacity: 12,
      bookedSlots: 8
    },
    {
      id: "2",
      name: "Mike Thompson",
      role: "Physiotherapist",
      specialty: "Injury Rehabilitation",
      status: "busy",
      currentActivity: "Treating Marcus Lindberg",
      nextAvailable: "10:30 AM",
      todayCapacity: 10,
      bookedSlots: 9
    },
    {
      id: "3",
      name: "Anna Chen",
      role: "Athletic Therapist",
      specialty: "Preventive Care",
      status: "available",
      todayCapacity: 15,
      bookedSlots: 6
    },
    {
      id: "4",
      name: "Dr. James Wilson",
      role: "Orthopedic Specialist",
      specialty: "Surgery Consultation",
      status: "break",
      nextAvailable: "11:00 AM",
      todayCapacity: 6,
      bookedSlots: 4
    },
    {
      id: "5",
      name: "Lisa Martinez",
      role: "Massage Therapist",
      specialty: "Recovery Therapy",
      status: "off-duty",
      nextAvailable: "Tomorrow",
      todayCapacity: 8,
      bookedSlots: 8
    }
  ];

  const medicalRooms: MedicalRoom[] = [
    {
      id: "1",
      name: "Treatment Room 1",
      type: "treatment",
      status: "occupied",
      currentPatient: "Erik Andersson",
      nextAvailable: "10:15 AM",
      equipment: ["Ultrasound", "TENS", "Ice Machine"],
      capacity: 1
    },
    {
      id: "2",
      name: "Examination Room A",
      type: "exam",
      status: "available",
      equipment: ["Exam Table", "Diagnostic Tools"],
      capacity: 1
    },
    {
      id: "3",
      name: "Therapy Pool",
      type: "therapy",
      status: "available",
      equipment: ["Aqua Therapy Equipment"],
      capacity: 3
    },
    {
      id: "4",
      name: "Testing Lab",
      type: "testing",
      status: "occupied",
      currentPatient: "Concussion Testing",
      nextAvailable: "11:30 AM",
      equipment: ["ImPACT System", "Balance Board"],
      capacity: 2
    },
    {
      id: "5",
      name: "Recovery Suite",
      type: "therapy",
      status: "maintenance",
      nextAvailable: "2:00 PM",
      equipment: ["Cryotherapy", "Compression"],
      capacity: 4
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50';
      case 'busy': case 'occupied': return 'text-red-600 bg-red-50';
      case 'break': case 'maintenance': return 'text-amber-600 bg-amber-50';
      case 'off-duty': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <UserCheck className="h-4 w-4" />;
      case 'busy': case 'occupied': return <UserX className="h-4 w-4" />;
      case 'break': case 'maintenance': return <Clock className="h-4 w-4" />;
      case 'off-duty': return <Home className="h-4 w-4" />;
      default: return null;
    }
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'treatment': return <Stethoscope className="h-4 w-4" />;
      case 'exam': return <Activity className="h-4 w-4" />;
      case 'testing': return <Brain className="h-4 w-4" />;
      case 'therapy': return <Heart className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const availableStaff = staffMembers.filter(s => s.status === 'available').length;
  const availableRooms = medicalRooms.filter(r => r.status === 'available').length;

  return (
    <Card className="w-96 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Medical Availability
          </span>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {availableStaff}/{staffMembers.length} Staff
            </Badge>
            <Badge variant="outline" className="text-xs">
              {availableRooms}/{medicalRooms.length} Rooms
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {staffMembers.map(staff => (
                  <Card key={staff.id} className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{staff.name}</p>
                          <p className="text-xs text-muted-foreground">{staff.role}</p>
                          <p className="text-xs text-muted-foreground">{staff.specialty}</p>
                        </div>
                        <div className={cn("px-2 py-1 rounded-full flex items-center gap-1", getStatusColor(staff.status))}>
                          {getStatusIcon(staff.status)}
                          <span className="text-xs capitalize">{staff.status}</span>
                        </div>
                      </div>

                      {staff.currentActivity && (
                        <div className="text-xs bg-muted rounded p-2">
                          <p className="text-muted-foreground">Currently:</p>
                          <p>{staff.currentActivity}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Today's Capacity</span>
                          <span>{staff.bookedSlots}/{staff.todayCapacity} slots</span>
                        </div>
                        <Progress 
                          value={(staff.bookedSlots / staff.todayCapacity) * 100} 
                          className="h-2"
                        />
                      </div>

                      {staff.nextAvailable && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Next Available:</span>
                          <Badge variant="outline" className="text-xs">
                            {staff.nextAvailable}
                          </Badge>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          View Schedule
                        </Button>
                        {staff.status === 'available' && (
                          <Button size="sm" className="flex-1 h-7 text-xs">
                            Book Appointment
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rooms" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {medicalRooms.map(room => (
                  <Card key={room.id} className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getRoomIcon(room.type)}
                          <div>
                            <p className="font-medium text-sm">{room.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{room.type}</p>
                          </div>
                        </div>
                        <div className={cn("px-2 py-1 rounded-full flex items-center gap-1", getStatusColor(room.status))}>
                          {getStatusIcon(room.status)}
                          <span className="text-xs capitalize">{room.status}</span>
                        </div>
                      </div>

                      {room.currentPatient && (
                        <div className="text-xs bg-muted rounded p-2">
                          <p className="text-muted-foreground">Current Use:</p>
                          <p>{room.currentPatient}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {room.equipment.map((equip, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {equip}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="ml-1 font-medium">{room.capacity} person(s)</span>
                        </div>
                        {room.nextAvailable && (
                          <Badge variant="outline" className="text-xs">
                            Free at {room.nextAvailable}
                          </Badge>
                        )}
                      </div>

                      {room.status === 'available' && (
                        <Button size="sm" className="w-full h-7 text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          Reserve Room
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Today • {format(new Date(), 'EEEE, MMMM d')}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Appointments</p>
                    <p className="text-2xl font-bold">32</p>
                    <div className="flex items-center gap-1 text-xs">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span>3 urgent cases</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Utilization Rate</p>
                    <p className="text-2xl font-bold">78%</p>
                    <Progress value={78} className="h-2" />
                  </div>
                </Card>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Upcoming Availability</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>10:30 AM</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">2 staff</span>, <span className="font-medium">1 room</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>11:00 AM</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">3 staff</span>, <span className="font-medium">2 rooms</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>2:00 PM</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">4 staff</span>, <span className="font-medium">3 rooms</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full text-xs">
                View Full Schedule
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}