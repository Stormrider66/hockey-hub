"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Heart, Activity, AlertCircle, TrendingUp, Users, Calendar,
  Clock, CheckCircle2, XCircle, Plus, Edit, FileText,
  Stethoscope, Pill, Shield, User, Phone
} from "lucide-react";

export function MedicalStaffDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for medical staff
  const medicalStats = {
    totalPatients: 156,
    activeInjuries: 8,
    rehabPrograms: 12,
    upcomingAppointments: 15,
    clearancesPending: 3,
    emergencyContacts: 156
  };

  const activeInjuries = [
    { 
      player: "Erik Lindqvist", 
      team: "Senior A", 
      injury: "Knee Strain", 
      severity: "moderate", 
      date: "2025-01-05",
      status: "treatment",
      nextAppointment: "Tomorrow 10:00"
    },
    { 
      player: "Anna Svensson", 
      team: "Senior A", 
      injury: "Shoulder Impingement", 
      severity: "mild", 
      date: "2025-01-03",
      status: "rehabilitation",
      nextAppointment: "Friday 14:00"
    },
    { 
      player: "Lars Andersson", 
      team: "Junior A", 
      injury: "Ankle Sprain", 
      severity: "severe", 
      date: "2024-12-28",
      status: "recovery",
      nextAppointment: "Monday 09:00"
    },
    { 
      player: "Maria Johansson", 
      team: "Junior A", 
      injury: "Concussion", 
      severity: "severe", 
      date: "2025-01-02",
      status: "monitoring",
      nextAppointment: "Wednesday 11:00"
    }
  ];

  const rehabPrograms = [
    { 
      name: "Post-Injury Knee Rehabilitation", 
      patients: 3, 
      duration: "6 weeks", 
      progress: 65,
      status: "active"
    },
    { 
      name: "Shoulder Mobility Program", 
      patients: 2, 
      duration: "4 weeks", 
      progress: 80,
      status: "active"
    },
    { 
      name: "Concussion Protocol", 
      patients: 1, 
      duration: "2-4 weeks", 
      progress: 25,
      status: "active"
    },
    { 
      name: "General Injury Prevention", 
      patients: 25, 
      duration: "Ongoing", 
      progress: 45,
      status: "active"
    }
  ];

  const upcomingAppointments = [
    { time: "09:00", player: "Erik Lindqvist", type: "Follow-up", injury: "Knee Strain" },
    { time: "10:30", player: "Maria Johansson", type: "Concussion Check", injury: "Concussion" },
    { time: "14:00", player: "Anna Svensson", type: "Rehabilitation", injury: "Shoulder Impingement" },
    { time: "15:30", player: "Per Nilsson", type: "Clearance Exam", injury: "Return to Play" }
  ];

  const healthMetrics = [
    { metric: "Overall Team Health", value: 95, status: "excellent" },
    { metric: "Injury Rate", value: 5.1, status: "good", unit: "%" },
    { metric: "Recovery Time", value: 12, status: "average", unit: "days" },
    { metric: "Prevention Compliance", value: 88, status: "good", unit: "%" }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'treatment': return 'bg-blue-100 text-blue-800';
      case 'rehabilitation': return 'bg-purple-100 text-purple-800';
      case 'recovery': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'Follow-up': return 'bg-blue-100 text-blue-800';
      case 'Concussion Check': return 'bg-red-100 text-red-800';
      case 'Rehabilitation': return 'bg-green-100 text-green-800';
      case 'Clearance Exam': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalStats.totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">Under care</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Injuries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalStats.activeInjuries}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring treatment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rehab Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalStats.rehabPrograms}</div>
            <p className="text-xs text-muted-foreground mt-1">Active programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalStats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Clearances Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalStats.clearancesPending}</div>
            <p className="text-xs text-muted-foreground mt-1">Return to play</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalStats.emergencyContacts}</div>
            <p className="text-xs text-muted-foreground mt-1">On file</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Today's Appointments</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingAppointments.map((appointment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">{appointment.time}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">{appointment.player}</h3>
                    <p className="text-sm text-muted-foreground">{appointment.injury}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getAppointmentTypeColor(appointment.type)}>
                    {appointment.type}
                  </Badge>
                  <Button variant="outline" size="sm">
                    View Record
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Injuries */}
      <Card>
        <CardHeader>
          <CardTitle>Active Injuries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeInjuries.map((injury, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{injury.player}</h3>
                    <p className="text-sm text-muted-foreground">{injury.team} • {injury.injury}</p>
                    <p className="text-xs text-muted-foreground">Injured: {injury.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getSeverityColor(injury.severity)}>
                    {injury.severity}
                  </Badge>
                  <Badge className={getStatusColor(injury.status)}>
                    {injury.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">Next: {injury.nextAppointment}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Team Health Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {healthMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{metric.metric}</span>
                  <span className="text-sm font-bold">
                    {metric.value}{metric.unit || '%'}
                  </span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInjuriesTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Active Injuries</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Report Injury
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeInjuries.map((injury, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{injury.player}</h3>
                    <p className="text-sm text-muted-foreground">{injury.team}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(injury.severity)}>
                      {injury.severity}
                    </Badge>
                    <Badge className={getStatusColor(injury.status)}>
                      {injury.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Injury</p>
                    <p className="font-medium">{injury.injury}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{injury.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Appointment</p>
                    <p className="font-medium">{injury.nextAppointment}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3 mr-1" />
                    Update Status
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-3 w-3 mr-1" />
                    View Record
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="injuries">Injuries</TabsTrigger>
        <TabsTrigger value="rehabilitation">Rehabilitation</TabsTrigger>
        <TabsTrigger value="records">Medical Records</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        {renderOverviewTab()}
      </TabsContent>

      <TabsContent value="injuries">
        {renderInjuriesTab()}
      </TabsContent>

      <TabsContent value="rehabilitation">
        <Card>
          <CardHeader>
            <CardTitle>Rehabilitation Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rehabPrograms.map((program, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{program.name}</h3>
                      <p className="text-sm text-muted-foreground">Duration: {program.duration}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {program.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Patients</p>
                      <p className="font-medium">{program.patients}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="font-medium">{program.progress}%</p>
                    </div>
                  </div>

                  <Progress value={program.progress} className="h-2 mb-3" />

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit Program
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="h-3 w-3 mr-1" />
                      Manage Patients
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="records">
        <Card>
          <CardHeader>
            <CardTitle>Medical Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Medical records management coming soon</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 