"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X, Home, Users, Clock, TrendingUp, AlertTriangle,
  Calendar, DollarSign, Activity, ChevronRight
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

interface ResourceAllocationOverlayProps {
  onClose: () => void;
  selectedDate?: Date | null;
}

export function ResourceAllocationOverlay({ onClose, selectedDate }: ResourceAllocationOverlayProps) {
  const [view, setView] = useState<'facilities' | 'equipment' | 'staff'>('facilities');
  const currentDate = selectedDate || new Date();
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Mock data - would come from API
  const facilities = [
    {
      id: 1,
      name: "Main Ice Rink",
      type: "ice",
      capacity: 100,
      bookings: [
        { day: 0, slots: 8, used: 6, teams: ["Senior Team", "Junior A"] },
        { day: 1, slots: 8, used: 7, teams: ["U16", "U14", "Senior Team"] },
        { day: 2, slots: 8, used: 8, teams: ["All Teams"], full: true },
        { day: 3, slots: 8, used: 5, teams: ["Junior A", "U16"] },
        { day: 4, slots: 8, used: 6, teams: ["Senior Team", "U14"] },
        { day: 5, slots: 10, used: 10, teams: ["Tournament"], full: true },
        { day: 6, slots: 10, used: 8, teams: ["Games", "Public Skate"] }
      ],
      cost: 250,
      utilization: 81
    },
    {
      id: 2,
      name: "Practice Rink",
      type: "ice",
      capacity: 50,
      bookings: [
        { day: 0, slots: 6, used: 4, teams: ["Skills Training"] },
        { day: 1, slots: 6, used: 5, teams: ["Goalie Training", "Power Skating"] },
        { day: 2, slots: 6, used: 3, teams: ["U12", "U10"] },
        { day: 3, slots: 6, used: 4, teams: ["Skills Development"] },
        { day: 4, slots: 6, used: 2, teams: ["Private Lessons"] },
        { day: 5, slots: 8, used: 6, teams: ["Tournament Warmup"] },
        { day: 6, slots: 8, used: 4, teams: ["Learn to Skate"] }
      ],
      cost: 150,
      utilization: 67
    },
    {
      id: 3,
      name: "Conference Room A",
      type: "meeting",
      capacity: 20,
      bookings: [
        { day: 0, slots: 4, used: 2, teams: ["Board Meeting"] },
        { day: 1, slots: 4, used: 1, teams: ["Coaches Meeting"] },
        { day: 2, slots: 4, used: 3, teams: ["Parent Meeting", "Staff"] },
        { day: 3, slots: 4, used: 0, teams: [] },
        { day: 4, slots: 4, used: 2, teams: ["Team Meeting"] },
        { day: 5, slots: 2, used: 0, teams: [] },
        { day: 6, slots: 2, used: 1, teams: ["Tournament Brief"] }
      ],
      cost: 0,
      utilization: 32
    },
    {
      id: 4,
      name: "Gym/Dryland Training",
      type: "training",
      capacity: 30,
      bookings: [
        { day: 0, slots: 6, used: 4, teams: ["Senior Team", "Junior A"] },
        { day: 1, slots: 6, used: 5, teams: ["All Teams Rotation"] },
        { day: 2, slots: 6, used: 6, teams: ["Fitness Testing"], full: true },
        { day: 3, slots: 6, used: 3, teams: ["U16", "U14"] },
        { day: 4, slots: 6, used: 4, teams: ["Senior Team", "Rehab"] },
        { day: 5, slots: 4, used: 2, teams: ["Open Gym"] },
        { day: 6, slots: 4, used: 0, teams: [] }
      ],
      cost: 50,
      utilization: 60
    }
  ];

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return "text-red-600 bg-red-50";
    if (percent >= 70) return "text-amber-600 bg-amber-50";
    if (percent >= 50) return "text-blue-600 bg-blue-50";
    return "text-green-600 bg-green-50";
  };

  const getSlotColor = (used: number, total: number) => {
    const percent = (used / total) * 100;
    if (percent === 100) return "bg-red-500";
    if (percent >= 75) return "bg-amber-500";
    if (percent >= 50) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto">
      <div className="container max-w-6xl mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Home className="h-6 w-6" />
                  Resource Allocation Dashboard
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Total Facilities</p>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-muted-foreground mt-1">4 Ice, 2 Meeting, 2 Training</p>
                </div>
                <Home className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Utilization</p>
                  <p className="text-2xl font-bold">72%</p>
                  <Progress value={72} className="mt-2 h-1" />
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Cost</p>
                  <p className="text-2xl font-bold">$14,200</p>
                  <p className="text-xs text-green-600 mt-1">-5% vs last week</p>
                </div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Conflicts</p>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-amber-600 mt-1">Action required</p>
                </div>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Facility Grid */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Facility Schedule</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  Available
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                  Partial
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
                  Busy
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                  Full
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {facilities.map((facility) => (
                <div key={facility.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{facility.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {facility.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Capacity: {facility.capacity}
                          </span>
                          {facility.cost > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ${facility.cost}/hour
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUtilizationColor(facility.utilization)}`}>
                      {facility.utilization}% utilized
                    </div>
                  </div>

                  {/* Weekly Schedule Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, idx) => {
                      const booking = facility.bookings[idx];
                      const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      
                      return (
                        <div
                          key={idx}
                          className={`border rounded p-2 text-center ${
                            isToday ? 'ring-2 ring-primary' : ''
                          } ${booking.full ? 'bg-red-50' : ''}`}
                        >
                          <p className="text-xs font-medium mb-1">
                            {format(day, 'EEE')}
                          </p>
                          <div className="mb-2">
                            <div className={`h-2 rounded-full ${getSlotColor(booking.used, booking.slots)}`}
                              style={{ width: `${(booking.used / booking.slots) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {booking.used}/{booking.slots}
                          </p>
                          {booking.teams.length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">
                              {booking.teams[0]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex justify-end gap-2 mt-3">
                    <Button size="sm" variant="ghost">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Manage Bookings
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Suggestions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Optimization Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Practice Rink Underutilized</p>
                    <p className="text-xs text-muted-foreground">
                      Thursday & Friday have 50% availability
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Schedule More
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded">
                    <Users className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ice Time Conflict Wednesday</p>
                    <p className="text-xs text-muted-foreground">
                      3 teams requesting same 7-9pm slot
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-amber-600 border-amber-600">
                  Resolve
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Cost Saving Opportunity</p>
                    <p className="text-xs text-muted-foreground">
                      Consolidate Saturday morning sessions
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  View Details
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}